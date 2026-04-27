import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isDocumentCompleted, isDocumentExcludedFromPackage } from '@/lib/loan-packaging/document-state';
import { verifyPassword } from '@/lib/server/password-hash';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

type AnyRow = Record<string, unknown>;

const lenderAccessSchema = z.object({
  token: z.string().min(10).max(120),
  password: z.string().min(1).max(128),
});

function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  if (!forwarded) {
    return null;
  }

  const firstIp = forwarded.split(',')[0]?.trim();
  return firstIp || null;
}

export async function POST(req: NextRequest) {
  const parsed = lenderAccessSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();
  const { token, password } = parsed.data;

  const linkResult = await admin
    .from('lender_access_links')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  const link = (linkResult.data as AnyRow | null) ?? null;

  if (!link) {
    return NextResponse.json({ error: 'Access link not found' }, { status: 404 });
  }

  const now = new Date();
  const expiresAt = new Date(String(link.expires_at));

  if (link.is_revoked || expiresAt.getTime() <= now.getTime()) {
    await admin.from('lender_access_events').insert({
      lender_access_link_id: link.id,
      success: false,
      ip_address: getClientIp(req),
      user_agent: req.headers.get('user-agent') || null,
    });

    return NextResponse.json({ error: 'Access link is expired or revoked' }, { status: 403 });
  }

  const passwordHash = typeof link.password_hash === 'string' ? link.password_hash : '';
  const passwordValid = verifyPassword(password, passwordHash);

  if (!passwordValid) {
    await admin.from('lender_access_events').insert({
      lender_access_link_id: link.id,
      success: false,
      ip_address: getClientIp(req),
      user_agent: req.headers.get('user-agent') || null,
    });

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const [loanRequestResult, documentResult, requirementResult] = await Promise.all([
    admin
      .from('loan_requests')
      .select('*')
      .eq('id', String(link.loan_request_id))
      .maybeSingle(),
    admin
      .from('loan_request_documents')
      .select('*')
      .eq('loan_request_id', String(link.loan_request_id))
      .order('updated_at', { ascending: true }),
    admin
      .from('document_requirements')
      .select('*')
      .eq('service_type', 'loan_packaging')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ]);

  const loanRequest = (loanRequestResult.data as AnyRow | null) ?? null;
  if (!loanRequest) {
    return NextResponse.json({ error: 'Loan request not found' }, { status: 404 });
  }

  const requirements = (requirementResult.data ?? []) as AnyRow[];
  const requirementByKey = new Map(
    requirements.map((requirement) => [String(requirement.requirement_key), requirement]),
  );

  const documents = (documentResult.data ?? []) as AnyRow[];

  const lenderDocuments = await Promise.all(
    documents
      .filter((document) => (
        !isDocumentExcludedFromPackage(document) &&
        isDocumentCompleted(document) &&
        document.file_path
      ))
      .map(async (document) => {
        const metadata = (document.metadata ?? {}) as Record<string, unknown>;
        const bucket = typeof metadata.bucket === 'string' ? metadata.bucket : 'loan-package-documents';

        const signed = await admin.storage
          .from(bucket)
          .createSignedUrl(String(document.file_path), 60 * 30);

        const requirement = requirementByKey.get(String(document.requirement_key));

        return {
          requirementKey: String(document.requirement_key),
          displayName: String(requirement?.display_name ?? document.requirement_key),
          description: String(requirement?.description ?? ''),
          category: requirement?.category ?? null,
          status: String(document.status),
          uploadedAt: document.uploaded_at ? String(document.uploaded_at) : null,
          downloadUrl: signed.data?.signedUrl ?? null,
        };
      }),
  );

  let packageZipUrl: string | null = null;
  if (loanRequest.package_zip_path) {
    const signedPackage = await admin.storage
      .from('generated-packages')
      .createSignedUrl(String(loanRequest.package_zip_path), 60 * 30);
    packageZipUrl = signedPackage.data?.signedUrl ?? null;
  }

  await Promise.all([
    admin.from('lender_access_links').update({
      access_count: Number(link.access_count ?? 0) + 1,
      last_accessed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', String(link.id)),
    admin.from('lender_access_events').insert({
      lender_access_link_id: link.id,
      success: true,
      ip_address: getClientIp(req),
      user_agent: req.headers.get('user-agent') || null,
    }),
  ]);

  return NextResponse.json({
    portal: {
      title: String(link.title || 'Lender Access Package'),
      expiresAt: String(link.expires_at),
    },
    loanRequest: {
      businessName: loanRequest.business_name ? String(loanRequest.business_name) : null,
      businessDescription: loanRequest.business_description ? String(loanRequest.business_description) : null,
      loanPurpose: loanRequest.loan_purpose ? String(loanRequest.loan_purpose) : null,
      loanAmount: typeof loanRequest.loan_amount === 'number' ? loanRequest.loan_amount : null,
      annualRevenue: typeof loanRequest.annual_revenue === 'number' ? loanRequest.annual_revenue : null,
      yearsInBusiness: typeof loanRequest.years_in_business === 'number' ? loanRequest.years_in_business : null,
      coverLetterContent: loanRequest.cover_letter_content ? String(loanRequest.cover_letter_content) : null,
      packageZipUrl,
      documents: lenderDocuments.filter((document) => document.downloadUrl),
    },
  });
}
