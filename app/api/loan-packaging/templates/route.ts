import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  TEMPLATE_KEYS,
  TEMPLATE_REQUIREMENT_KEY_BY_TEMPLATE,
  type TemplateKey,
} from '@/lib/loan-packaging/constants';
import {
  computeTemplateMetrics,
  getTemplateCompletionPercentage,
  getTemplateDefinitions,
  getTemplateValidationIssues,
  type TemplateValues,
} from '@/lib/loan-packaging/template-engine';
import {
  buildSharedContextFromTemplateValues,
  getTemplatePdfFileName,
  mergeTemplateContexts,
  toLegacyTemplateSubmissionData,
} from '@/lib/loan-packaging/template-data';
import { resolveServiceAccessForUser } from '@/lib/server/service-access';
import { generateAndStoreTemplatePdf } from '@/lib/templates/pdf';
import type { TemplateType } from '@/lib/templates/types';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { isApiUserFailure, requireApiUser } from '@/lib/server/request-auth';

export const runtime = 'nodejs';

type AnyRow = Record<string, unknown>;

const templateUpsertSchema = z.object({
  loanRequestId: z.string().uuid(),
  templateKey: z.enum(TEMPLATE_KEYS),
  formData: z.record(z.unknown()).default({}),
  markCompleted: z.boolean().default(false),
});

async function ensureLoanPackagingApiAccess(user: { id: string; email?: string | null }) {
  const access = await resolveServiceAccessForUser({
    id: user.id,
    email: user.email ?? undefined,
  });

  return access.canAccessLoanPackaging;
}

async function ensureLoanRequestAccess(
  admin: ReturnType<typeof getSupabaseAdmin>,
  loanRequestId: string,
  userId: string,
) {
  const { data } = await admin
    .from('loan_requests')
    .select('id,user_id,service_type,business_name,template_shared_context,template_data_sources')
    .eq('id', loanRequestId)
    .eq('user_id', userId)
    .maybeSingle();

  return data as AnyRow | null;
}

async function getRequirementKeyForTemplate(
  admin: ReturnType<typeof getSupabaseAdmin>,
  templateKey: TemplateKey,
  serviceType: string,
): Promise<string> {
  const preferred = await admin
    .from('document_requirements')
    .select('requirement_key')
    .eq('template_key', templateKey)
    .eq('service_type', serviceType)
    .maybeSingle();

  if (preferred.data?.requirement_key) {
    return String(preferred.data.requirement_key);
  }

  const fallback = await admin
    .from('document_requirements')
    .select('requirement_key')
    .eq('template_key', templateKey)
    .eq('service_type', 'loan_packaging')
    .maybeSingle();

  if (fallback.data?.requirement_key) {
    return String(fallback.data.requirement_key);
  }

  return TEMPLATE_REQUIREMENT_KEY_BY_TEMPLATE[templateKey];
}

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiUserFailure(auth)) {
    return auth.response;
  }
  if (!(await ensureLoanPackagingApiAccess(auth.user))) {
    return NextResponse.json({ error: 'Loan packaging access is required' }, { status: 403 });
  }

  const loanRequestId = req.nextUrl.searchParams.get('loanRequestId');
  if (!loanRequestId) {
    return NextResponse.json({ error: 'loanRequestId is required' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const hasAccess = await ensureLoanRequestAccess(admin, loanRequestId, auth.user.id);

  if (!hasAccess) {
    return NextResponse.json({ error: 'Loan request not found' }, { status: 404 });
  }

  const { data: submissions, error } = await admin
    .from('guided_template_submissions')
    .select('*')
    .eq('loan_request_id', loanRequestId)
    .eq('user_id', auth.user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    definitions: getTemplateDefinitions(),
    submissions: submissions ?? [],
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiUserFailure(auth)) {
    return auth.response;
  }
  if (!(await ensureLoanPackagingApiAccess(auth.user))) {
    return NextResponse.json({ error: 'Loan packaging access is required' }, { status: 403 });
  }

  const parsed = templateUpsertSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();
  const { loanRequestId, templateKey, formData, markCompleted } = parsed.data;
  const templateValues = formData as TemplateValues;

  const loanRequest = await ensureLoanRequestAccess(admin, loanRequestId, auth.user.id);
  if (!loanRequest) {
    return NextResponse.json({ error: 'Loan request not found' }, { status: 404 });
  }

  const completionPct = getTemplateCompletionPercentage(templateKey, templateValues);
  const derivedMetrics = computeTemplateMetrics(templateKey, templateValues);
  const validationIssues = getTemplateValidationIssues(templateKey, templateValues);

  if (markCompleted && validationIssues.length > 0) {
    return NextResponse.json(
      {
        error: 'Template is not ready to complete',
        validationIssues,
      },
      { status: 400 },
    );
  }

  const nowIso = new Date().toISOString();
  const status = markCompleted ? 'completed' : 'draft';

  const { data: existingSubmission } = await admin
    .from('guided_template_submissions')
    .select('id,legacy_template_submission_id,pdf_path')
    .eq('loan_request_id', loanRequestId)
    .eq('user_id', auth.user.id)
    .eq('template_key', templateKey)
    .maybeSingle();

  const legacyPayload = toLegacyTemplateSubmissionData(templateKey, templateValues);
  let legacySubmissionId =
    typeof existingSubmission?.legacy_template_submission_id === 'string'
      ? existingSubmission.legacy_template_submission_id
      : null;

  if (legacySubmissionId) {
    const { error: legacyUpdateError } = await admin
      .from('template_submissions')
      .update({
        form_data: legacyPayload,
        updated_at: nowIso,
      })
      .eq('id', legacySubmissionId)
      .eq('user_id', auth.user.id);

    if (legacyUpdateError) {
      return NextResponse.json({ error: legacyUpdateError.message }, { status: 500 });
    }
  } else {
    const { data: legacyInsert, error: legacyInsertError } = await admin
      .from('template_submissions')
      .insert({
        user_id: auth.user.id,
        template_type: templateKey,
        form_data: legacyPayload,
      })
      .select('id')
      .single();

    if (legacyInsertError || !legacyInsert?.id) {
      return NextResponse.json(
        { error: legacyInsertError?.message ?? 'Failed to create legacy template submission' },
        { status: 500 },
      );
    }

    legacySubmissionId = String(legacyInsert.id);
  }

  const { data: submission, error } = await admin
    .from('guided_template_submissions')
    .upsert(
      {
        user_id: auth.user.id,
        loan_request_id: loanRequestId,
        template_key: templateKey,
        status,
        completion_pct: completionPct,
        form_data: formData,
        derived_metrics: derivedMetrics,
        legacy_template_submission_id: legacySubmissionId,
      },
      {
        onConflict: 'loan_request_id,template_key',
      },
    )
    .select('*')
    .single();

  if (error || !submission) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to save template submission' },
      { status: 500 },
    );
  }

  const existingContext =
    loanRequest.template_shared_context && typeof loanRequest.template_shared_context === 'object'
      ? (loanRequest.template_shared_context as Record<string, unknown>)
      : {};

  const sharedContextUpdates = buildSharedContextFromTemplateValues(templateKey, templateValues);
  const mergedSharedContext = mergeTemplateContexts(existingContext, sharedContextUpdates);

  const existingDataSources =
    loanRequest.template_data_sources && typeof loanRequest.template_data_sources === 'object'
      ? (loanRequest.template_data_sources as Record<string, unknown>)
      : {};

  const nextDataSources = {
    ...existingDataSources,
    [templateKey]: {
      updated_at: nowIso,
      completion_pct: completionPct,
      status,
    },
  };

  let pdfPath: string | null = typeof submission.pdf_path === 'string' ? submission.pdf_path : null;
  let pdfUrl: string | null = null;

  const shouldGeneratePdf = markCompleted;

  if (shouldGeneratePdf && legacySubmissionId) {
    try {
      const generatedPdf = await generateAndStoreTemplatePdf({
        req,
        admin,
        accessToken: auth.accessToken,
        userId: auth.user.id,
        submissionId: legacySubmissionId,
        templateType: templateKey as TemplateType,
        fileNamePrefix: getTemplatePdfFileName(
          templateKey,
          typeof loanRequest.business_name === 'string' ? loanRequest.business_name : null,
        ),
        bucket: 'pdfs',
      });

      pdfPath = generatedPdf.filePath;
      pdfUrl = generatedPdf.signedUrl;

      await Promise.all([
        admin
          .from('template_submissions')
          .update({
            pdf_url: pdfUrl,
            updated_at: nowIso,
          })
          .eq('id', legacySubmissionId)
          .eq('user_id', auth.user.id),
        admin
          .from('guided_template_submissions')
          .update({
            pdf_path: pdfPath,
            status: 'completed',
            completion_pct: completionPct,
            updated_at: nowIso,
          })
          .eq('id', String(submission.id))
          .eq('user_id', auth.user.id),
      ]);

      const requirementKey = await getRequirementKeyForTemplate(
        admin,
        templateKey,
        String(loanRequest.service_type ?? 'loan_packaging'),
      );

      await admin.from('loan_request_documents').upsert(
        {
          loan_request_id: loanRequestId,
          user_id: auth.user.id,
          requirement_key: requirementKey,
          status: 'generated',
          source: 'template',
          file_path: pdfPath,
          mime_type: 'application/pdf',
          file_size_bytes: generatedPdf.bytes,
          uploaded_at: nowIso,
          metadata: {
            bucket: 'pdfs',
            template_submission_id: submission.id,
            legacy_template_submission_id: legacySubmissionId,
            completion_pct: completionPct,
            template_key: templateKey,
            generated_at: nowIso,
            original_file_name: `${templateKey}.pdf`,
          },
        },
        {
          onConflict: 'loan_request_id,requirement_key',
        },
      );

      await admin.from('generated_reports').insert({
        user_id: auth.user.id,
        loan_request_id: loanRequestId,
        report_type: `${templateKey}_pdf`,
        source_type: 'template',
        source_id: String(submission.id),
        file_path: pdfPath,
        mime_type: 'application/pdf',
        file_size_bytes: generatedPdf.bytes,
        visibility: 'private',
      });
    } catch (generationError) {
      const message = generationError instanceof Error
        ? generationError.message
        : 'Failed to generate template PDF';

      return NextResponse.json(
        {
          error: message,
          validationIssues,
        },
        { status: 500 },
      );
    }
  } else {
    const requirementKey = await getRequirementKeyForTemplate(
      admin,
      templateKey,
      String(loanRequest.service_type ?? 'loan_packaging'),
    );

    const { data: existingDocument } = await admin
      .from('loan_request_documents')
      .select('status')
      .eq('loan_request_id', loanRequestId)
      .eq('requirement_key', requirementKey)
      .eq('user_id', auth.user.id)
      .maybeSingle();

    const nextStatus = shouldGeneratePdf
      ? existingDocument?.status === 'uploaded'
        ? 'uploaded'
        : 'generated'
      : existingDocument?.status ?? 'not_started';

    await admin.from('loan_request_documents').upsert(
      {
        loan_request_id: loanRequestId,
        user_id: auth.user.id,
        requirement_key: requirementKey,
        status: nextStatus,
        source: 'template',
        metadata: {
          template_submission_id: submission.id,
          legacy_template_submission_id: legacySubmissionId,
          completion_pct: completionPct,
          template_key: templateKey,
        },
      },
      {
        onConflict: 'loan_request_id,requirement_key',
      },
    );
  }

  await admin
    .from('loan_requests')
    .update({
      template_shared_context: mergedSharedContext,
      template_data_sources: nextDataSources,
      updated_at: nowIso,
    })
    .eq('id', loanRequestId)
    .eq('user_id', auth.user.id);

  return NextResponse.json({
    submission,
    completionPct,
    derivedMetrics,
    validationIssues,
    pdfPath,
    pdfUrl,
  });
}
