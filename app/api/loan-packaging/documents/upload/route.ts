import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { documentRequirementMatchesLoanPurpose, normalizeLoanPurpose } from '@/lib/loan-packaging/constants';
import { resolveServiceAccessForUser } from '@/lib/server/service-access';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { isApiUserFailure, requireApiUser } from '@/lib/server/request-auth';

export const runtime = 'nodejs';

type AnyRow = Record<string, unknown>;

async function ensureLoanPackagingApiAccess(user: { id: string; email?: string | null }) {
  const access = await resolveServiceAccessForUser({
    id: user.id,
    email: user.email ?? undefined,
  });

  return access.canAccessLoanPackaging;
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function buildRequirementSlotMetadata(requirementKey: string) {
  const nowYear = new Date().getFullYear();

  if (requirementKey === 'business_tax_return_year_1') {
    return {
      slot_type: 'tax_return',
      slot_label: `Business Tax Return (${nowYear - 1})`,
      target_year: nowYear - 1,
      period_kind: 'annual',
    };
  }

  if (requirementKey === 'business_tax_return_year_2') {
    return {
      slot_type: 'tax_return',
      slot_label: `Business Tax Return (${nowYear - 2})`,
      target_year: nowYear - 2,
      period_kind: 'annual',
    };
  }

  if (requirementKey === 'personal_tax_return_year_1') {
    return {
      slot_type: 'tax_return',
      slot_label: `Personal Tax Return (${nowYear - 1})`,
      target_year: nowYear - 1,
      period_kind: 'annual',
    };
  }

  if (requirementKey === 'personal_tax_return_year_2') {
    return {
      slot_type: 'tax_return',
      slot_label: `Personal Tax Return (${nowYear - 2})`,
      target_year: nowYear - 2,
      period_kind: 'annual',
    };
  }

  if (requirementKey === 'income_statement_annual_year_1') {
    return {
      slot_type: 'income_statement',
      slot_label: `Income Statement (${nowYear - 1} Annual)`,
      target_year: nowYear - 1,
      period_kind: 'annual',
    };
  }

  if (requirementKey === 'income_statement_annual_year_2') {
    return {
      slot_type: 'income_statement',
      slot_label: `Income Statement (${nowYear - 2} Annual)`,
      target_year: nowYear - 2,
      period_kind: 'annual',
    };
  }

  if (requirementKey === 'income_statement_ytd') {
    return {
      slot_type: 'income_statement',
      slot_label: `Income Statement (${nowYear} YTD)`,
      target_year: nowYear,
      period_kind: 'ytd',
    };
  }

  return {
    slot_type: null,
    slot_label: null,
    target_year: null,
    period_kind: null,
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiUserFailure(auth)) {
    return auth.response;
  }
  if (!(await ensureLoanPackagingApiAccess(auth.user))) {
    return NextResponse.json({ error: 'Loan packaging access is required' }, { status: 403 });
  }

  const formData = await req.formData();

  const loanRequestId = String(formData.get('loanRequestId') || '');
  const requirementKey = String(formData.get('requirementKey') || '');
  const file = formData.get('file');

  if (!loanRequestId || !requirementKey || !(file instanceof File)) {
    return NextResponse.json(
      { error: 'loanRequestId, requirementKey, and file are required' },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();

  const loanRequestResult = await admin
    .from('loan_requests')
    .select('id,user_id,service_type,loan_purpose')
    .eq('id', loanRequestId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  const loanRequest = (loanRequestResult.data as AnyRow | null) ?? null;

  if (!loanRequest) {
    return NextResponse.json({ error: 'Loan request not found' }, { status: 404 });
  }

  const requirementResult = await admin
    .from('document_requirements')
    .select('*')
    .eq('requirement_key', requirementKey)
    .eq('service_type', String(loanRequest.service_type))
    .eq('is_active', true)
    .maybeSingle();

  const requirement = (requirementResult.data as AnyRow | null) ?? null;

  if (!requirement) {
    return NextResponse.json({ error: 'Document requirement not found' }, { status: 404 });
  }

  if (
    !documentRequirementMatchesLoanPurpose(
      typeof requirement.loan_purpose === 'string' ? requirement.loan_purpose : null,
      normalizeLoanPurpose(typeof loanRequest.loan_purpose === 'string' ? loanRequest.loan_purpose : null),
    )
  ) {
    return NextResponse.json(
      { error: 'Document requirement does not apply to the current loan purpose' },
      { status: 400 },
    );
  }

  const allowedMimeTypes = Array.isArray(requirement.allowed_mime_types)
    ? (requirement.allowed_mime_types as string[])
    : [];

  if (allowedMimeTypes.length > 0 && file.type && !allowedMimeTypes.includes(file.type)) {
    return NextResponse.json(
      {
        error: `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
      },
      { status: 400 },
    );
  }

  const maxSizeMb = Number(requirement.max_size_mb ?? 25);
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return NextResponse.json(
      {
        error: `File too large. Max size is ${maxSizeMb}MB`,
      },
      { status: 400 },
    );
  }

  const fileName = sanitizeFileName(file.name || 'upload.bin');
  const objectPath = `${auth.user.id}/${loanRequestId}/${requirementKey}/${Date.now()}-${randomUUID()}-${fileName}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const uploadResult = await admin.storage
    .from('loan-package-documents')
    .upload(objectPath, fileBuffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (uploadResult.error) {
    return NextResponse.json({ error: uploadResult.error.message }, { status: 500 });
  }

  const nowIso = new Date().toISOString();

  const documentResult = await admin
    .from('loan_request_documents')
    .upsert(
      {
        loan_request_id: loanRequestId,
        user_id: auth.user.id,
        requirement_key: requirementKey,
        status: 'uploaded',
        source: 'upload',
        file_path: objectPath,
        mime_type: file.type || null,
        file_size_bytes: file.size,
        uploaded_at: nowIso,
        metadata: {
          bucket: 'loan-package-documents',
          original_file_name: file.name,
          ...buildRequirementSlotMetadata(requirementKey),
        },
      },
      {
        onConflict: 'loan_request_id,requirement_key',
      },
    )
    .select('*')
    .single();

  if (documentResult.error || !documentResult.data) {
    return NextResponse.json({ error: documentResult.error?.message || 'Failed to persist document metadata' }, { status: 500 });
  }

  await admin
    .from('loan_requests')
    .update({
      updated_at: nowIso,
    })
    .eq('id', loanRequestId)
    .eq('user_id', auth.user.id);

  const signedUrlResult = await admin.storage
    .from('loan-package-documents')
    .createSignedUrl(objectPath, 60 * 60 * 24 * 7);

  return NextResponse.json({
    document: documentResult.data,
    signedUrl: signedUrlResult.data?.signedUrl ?? null,
  });
}
