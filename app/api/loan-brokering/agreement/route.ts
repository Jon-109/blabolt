import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { normalizeTemplateContext } from '@/lib/loan-packaging/template-data';
import { getSharedProfileSnapshot, upsertSharedProfileAndSync } from '@/lib/server/shared-profile';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { isApiUserFailure, requireApiUser } from '@/lib/server/request-auth';

export const runtime = 'nodejs';

type AnyRow = Record<string, unknown>;

const signAgreementSchema = z.object({
  businessName: z.string().trim().min(2).max(180),
  signerName: z.string().trim().min(2).max(180),
  agreedToTerms: z.literal(true),
});

function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getOrigin(req: NextRequest): string {
  const configuredOrigin = process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configuredOrigin) {
    return configuredOrigin;
  }

  const forwardedProto = req.headers.get('x-forwarded-proto');
  const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (forwardedProto && forwardedHost) {
    const forwardedOrigin = `${forwardedProto}://${forwardedHost}`;
    if (!forwardedOrigin.includes('localhost') && !forwardedOrigin.includes('127.0.0.1')) {
      return forwardedOrigin;
    }
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const origin = req.nextUrl.origin;
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    throw new Error(
      'Localhost is not reachable by Browserless. Set SITE_URL (or NEXT_PUBLIC_APP_URL) to a public tunnel URL and retry agreement signing.',
    );
  }

  return origin;
}

function getBrowserlessApiKey(): string {
  const apiKey = process.env.BROWSERLESS_API_KEY;
  if (!apiKey) {
    throw new Error('PDF generation service is not configured');
  }

  return apiKey;
}

async function generatePdfBuffer(printUrl: string): Promise<Buffer> {
  const browserlessApiKey = getBrowserlessApiKey();
  const browserlessUrl = `https://production-sfo.browserless.io/pdf?token=${browserlessApiKey}`;
  const response = await fetch(browserlessUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: printUrl,
      options: {
        format: 'Letter',
        printBackground: true,
        margin: { top: '16px', bottom: '16px', left: '10px', right: '10px' },
      },
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    throw new Error(`Browserless PDF generation failed: ${response.status} ${await response.text()}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function createSignedPdfUrl(
  admin: ReturnType<typeof getSupabaseAdmin>,
  pdfPath: string | null,
): Promise<string | null> {
  if (!pdfPath) {
    return null;
  }

  const signed = await admin.storage
    .from('pdfs')
    .createSignedUrl(pdfPath, 60 * 60 * 24 * 7);

  return signed.data?.signedUrl ?? null;
}

async function getLatestLoanRequest(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
): Promise<AnyRow | null> {
  const { data } = await admin
    .from('loan_requests')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['draft', 'in_progress', 'submitted', 'completed'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as AnyRow | null) ?? null;
}

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiUserFailure(auth)) {
    return auth.response;
  }

  const admin = getSupabaseAdmin();
  const [sharedProfile, latestLoanRequest, agreementResult] = await Promise.all([
    getSharedProfileSnapshot(admin, auth.user.id),
    getLatestLoanRequest(admin, auth.user.id),
    admin
      .from('broker_fee_agreements')
      .select('*')
      .eq('user_id', auth.user.id)
      .maybeSingle(),
  ]);

  const agreement = (agreementResult.data as AnyRow | null) ?? null;
  const pdfUrl = await createSignedPdfUrl(
    admin,
    typeof agreement?.pdf_path === 'string' ? agreement.pdf_path : null,
  );

  return NextResponse.json({
    agreement: agreement
      ? {
          id: String(agreement.id),
          loanRequestId: normalizeText(agreement.loan_request_id),
          status: normalizeText(agreement.status) ?? 'draft',
          businessName: normalizeText(agreement.business_name),
          signerName: normalizeText(agreement.signer_name),
          agreedToTerms: Boolean(agreement.agreed_to_terms),
          signedAt: normalizeText(agreement.signed_at),
          pdfUrl,
        }
      : null,
    defaults: {
      businessName:
        sharedProfile.businessName ??
        sharedProfile.businessLegalName ??
        normalizeText(latestLoanRequest?.business_name) ??
        '',
      signerName: sharedProfile.personalName ?? '',
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiUserFailure(auth)) {
    return auth.response;
  }

  const parsed = signAgreementSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();
  const payload = parsed.data;
  const nowIso = new Date().toISOString();
  const latestLoanRequest = await getLatestLoanRequest(admin, auth.user.id);
  const currentTemplateContext = normalizeTemplateContext(latestLoanRequest?.template_shared_context ?? {});
  const sharedContextUpdates = normalizeTemplateContext({
    business_name: payload.businessName,
  });

  let loanRequest: AnyRow | null = null;

  if (latestLoanRequest?.id) {
    const latestStatus = String(latestLoanRequest.status ?? '').trim();
    const nextStatus =
      latestStatus === 'draft' || latestStatus === 'in_progress' || latestStatus === 'submitted'
        ? latestStatus
        : 'in_progress';

    const { data, error } = await admin
      .from('loan_requests')
      .update({
        service_type: 'loan_brokering',
        status: nextStatus,
        business_name: payload.businessName,
        template_shared_context: {
          ...currentTemplateContext,
          ...sharedContextUpdates,
        },
        updated_at: nowIso,
      })
      .eq('id', String(latestLoanRequest.id))
      .eq('user_id', auth.user.id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    loanRequest = data as AnyRow;
  } else {
    const { data, error } = await admin
      .from('loan_requests')
      .insert({
        user_id: auth.user.id,
        service_type: 'loan_brokering',
        status: 'in_progress',
        business_name: payload.businessName,
        template_shared_context: sharedContextUpdates,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    loanRequest = data as AnyRow;
  }

  await upsertSharedProfileAndSync(admin, auth.user.id, {
    personalName: payload.signerName,
    businessName: payload.businessName,
    businessLegalName: payload.businessName,
  });

  const { data: draftAgreement, error: draftAgreementError } = await admin
    .from('broker_fee_agreements')
    .upsert(
      {
        user_id: auth.user.id,
        loan_request_id: String(loanRequest.id),
        status: 'draft',
        business_name: payload.businessName,
        signer_name: payload.signerName,
        agreed_to_terms: payload.agreedToTerms,
        signed_at: nowIso,
        pdf_path: null,
        pdf_url: null,
        updated_at: nowIso,
      },
      {
        onConflict: 'user_id',
      },
    )
    .select('*')
    .single();

  if (draftAgreementError || !draftAgreement) {
    return NextResponse.json(
      { error: draftAgreementError?.message ?? 'Failed to prepare broker agreement' },
      { status: 500 },
    );
  }

  const origin = getOrigin(req);
  const printUrl = `${origin}/report/loan-packaging/broker-fee-agreement/${String(loanRequest.id)}?token=${encodeURIComponent(auth.accessToken)}`;

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generatePdfBuffer(printUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate broker agreement PDF';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const pdfPath = `${auth.user.id}/loan-packaging/broker-fee-agreement/broker-fee-agreement-${String(loanRequest.id)}-${randomUUID()}.pdf`;
  const uploadResult = await admin.storage
    .from('pdfs')
    .upload(pdfPath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadResult.error) {
    return NextResponse.json({ error: uploadResult.error.message }, { status: 500 });
  }

  const pdfUrl = await createSignedPdfUrl(admin, pdfPath);

  const { error: finalizeAgreementError } = await admin
    .from('broker_fee_agreements')
    .update({
      loan_request_id: String(loanRequest.id),
      status: 'signed',
      business_name: payload.businessName,
      signer_name: payload.signerName,
      agreed_to_terms: true,
      signed_at: nowIso,
      pdf_path: pdfPath,
      pdf_url: pdfUrl,
      updated_at: nowIso,
    })
    .eq('id', String(draftAgreement.id))
    .eq('user_id', auth.user.id);

  if (finalizeAgreementError) {
    return NextResponse.json({ error: finalizeAgreementError.message }, { status: 500 });
  }

  const { error: documentError } = await admin.from('loan_request_documents').upsert(
    {
      loan_request_id: String(loanRequest.id),
      user_id: auth.user.id,
      requirement_key: 'broker_fee_agreement',
      status: 'approved',
      source: 'generated',
      file_path: pdfPath,
      mime_type: 'application/pdf',
      file_size_bytes: pdfBuffer.length,
      uploaded_at: nowIso,
      metadata: {
        bucket: 'pdfs',
        generated_at: nowIso,
        original_file_name: 'broker-fee-agreement.pdf',
        template: 'broker_fee_agreement_svg_v1',
      },
    },
    {
      onConflict: 'loan_request_id,requirement_key',
    },
  );

  if (documentError) {
    return NextResponse.json({ error: documentError.message }, { status: 500 });
  }

  const generatedReportInsert = await admin.from('generated_reports').insert({
    user_id: auth.user.id,
    loan_request_id: String(loanRequest.id),
    report_type: 'broker_fee_agreement_pdf',
    source_type: 'broker_fee_agreement',
    source_id: String(draftAgreement.id),
    file_path: pdfPath,
    mime_type: 'application/pdf',
    file_size_bytes: pdfBuffer.length,
    visibility: 'private',
  });

  if (generatedReportInsert.error) {
    console.error('[broker-fee-agreement] Failed to insert generated report:', generatedReportInsert.error);
  }

  return NextResponse.json({
    success: true,
    redirectTo: '/loan-packaging',
    loanRequestId: String(loanRequest.id),
    agreement: {
      id: String(draftAgreement.id),
      status: 'signed',
      businessName: payload.businessName,
      signerName: payload.signerName,
      signedAt: nowIso,
      pdfUrl,
    },
  });
}
