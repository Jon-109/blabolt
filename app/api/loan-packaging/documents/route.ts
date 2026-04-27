import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildPackagingProgress } from '@/lib/admin/client-dashboard';
import { documentRequirementMatchesLoanPurpose, normalizeLoanPurpose } from '@/lib/loan-packaging/constants';
import { resolveServiceAccessForUser } from '@/lib/server/service-access';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { isApiUserFailure, requireApiUser } from '@/lib/server/request-auth';

export const runtime = 'nodejs';

type AnyRow = Record<string, unknown>;

const patchDocumentSchema = z.object({
  loanRequestId: z.string().uuid(),
  requirementKey: z.string().trim().min(1).max(120),
  excludedFromPackage: z.boolean(),
});

async function ensureLoanPackagingApiAccess(user: { id: string; email?: string | null }) {
  const access = await resolveServiceAccessForUser({
    id: user.id,
    email: user.email ?? undefined,
  });

  return access.canAccessLoanPackaging;
}

function getDocumentSource(requirementKey: string, templateKey: unknown): 'upload' | 'template' | 'generated' {
  if (requirementKey === 'cover_letter' || requirementKey === 'broker_fee_agreement') {
    return 'generated';
  }

  return typeof templateKey === 'string' && templateKey.trim().length > 0 ? 'template' : 'upload';
}

export async function PATCH(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiUserFailure(auth)) {
    return auth.response;
  }
  if (!(await ensureLoanPackagingApiAccess(auth.user))) {
    return NextResponse.json({ error: 'Loan packaging access is required' }, { status: 403 });
  }

  const parsed = patchDocumentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { loanRequestId, requirementKey, excludedFromPackage } = parsed.data;
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

  const serviceTypes =
    String(loanRequest.service_type) === 'loan_brokering'
      ? ['loan_packaging', 'loan_brokering']
      : [String(loanRequest.service_type)];

  const requirementsResult = await admin
    .from('document_requirements')
    .select('*')
    .in('service_type', serviceTypes)
    .eq('is_active', true);

  if (requirementsResult.error) {
    return NextResponse.json(
      { error: requirementsResult.error.message || 'Failed to load document requirements.' },
      { status: 500 },
    );
  }

  const applicableRequirements = ((requirementsResult.data ?? []) as AnyRow[]).filter((requirement) =>
    documentRequirementMatchesLoanPurpose(
      typeof requirement.loan_purpose === 'string' ? requirement.loan_purpose : null,
      normalizeLoanPurpose(typeof loanRequest.loan_purpose === 'string' ? loanRequest.loan_purpose : null),
    ),
  );

  const requirement = applicableRequirements.find(
    (entry) => String(entry.requirement_key ?? '') === requirementKey,
  );

  if (!requirement || requirementKey === 'cover_letter') {
    return NextResponse.json({ error: 'Document requirement not found' }, { status: 404 });
  }

  if (!requirement.required) {
    return NextResponse.json(
      { error: 'Only required checklist documents can be removed from the package.' },
      { status: 400 },
    );
  }

  const existingDocumentResult = await admin
    .from('loan_request_documents')
    .select('*')
    .eq('loan_request_id', loanRequestId)
    .eq('user_id', auth.user.id)
    .eq('requirement_key', requirementKey)
    .maybeSingle();

  if (existingDocumentResult.error) {
    return NextResponse.json(
      { error: existingDocumentResult.error.message || 'Failed to load document state.' },
      { status: 500 },
    );
  }

  const existingDocument = (existingDocumentResult.data as AnyRow | null) ?? null;
  const nowIso = new Date().toISOString();

  const nextRow = existingDocument
    ? {
        excluded_from_package: excludedFromPackage,
        excluded_at: excludedFromPackage ? nowIso : null,
      }
    : {
        loan_request_id: loanRequestId,
        user_id: auth.user.id,
        requirement_key: requirementKey,
        status: 'not_started',
        source: getDocumentSource(requirementKey, requirement.template_key),
        excluded_from_package: excludedFromPackage,
        excluded_at: excludedFromPackage ? nowIso : null,
      };

  const mutation = existingDocument
    ? admin
        .from('loan_request_documents')
        .update(nextRow)
        .eq('id', String(existingDocument.id))
        .eq('loan_request_id', loanRequestId)
        .eq('user_id', auth.user.id)
    : admin
        .from('loan_request_documents')
        .insert(nextRow);

  const documentResult = await mutation.select('*').single();

  if (documentResult.error || !documentResult.data) {
    return NextResponse.json(
      { error: documentResult.error?.message ?? 'Failed to update document package status.' },
      { status: 500 },
    );
  }

  await admin
    .from('loan_requests')
    .update({
      updated_at: nowIso,
      package_zip_path: null,
      package_zip_generated_at: null,
    })
    .eq('id', loanRequestId)
    .eq('user_id', auth.user.id);

  const documentsResult = await admin
    .from('loan_request_documents')
    .select('*')
    .eq('loan_request_id', loanRequestId)
    .eq('user_id', auth.user.id);

  if (documentsResult.error) {
    return NextResponse.json(
      { error: documentsResult.error.message || 'Failed to refresh document checklist state.' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    document: documentResult.data,
    progress: buildPackagingProgress(applicableRequirements, (documentsResult.data ?? []) as AnyRow[]),
  });
}
