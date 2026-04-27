import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  DEFAULT_REQUIREMENT_ROWS,
  LOAN_REQUEST_STATUSES,
  SERVICE_TYPES,
  documentRequirementMatchesLoanPurpose,
  normalizeLoanPurpose,
  type ServiceType,
} from '@/lib/loan-packaging/constants';
import { buildPackagingProgress } from '@/lib/admin/client-dashboard';
import {
  buildCashFlowTemplatePrefill,
  buildLoanRequestTemplateContext,
  normalizeTemplateContext,
} from '@/lib/loan-packaging/template-data';
import {
  buildIncomeStatementFormFromPreset,
  buildIncomeStatementPresets,
  type IncomeStatementRequirementKey,
  type IncomeStatementPreset,
  INCOME_STATEMENT_REQUIREMENT_KEYS,
  matchesIncomeStatementPreset,
} from '@/lib/templates/income-statement-presets';
import {
  getSharedProfileSnapshot,
  upsertSharedProfileAndSync,
} from '@/lib/server/shared-profile';
import { resolveServiceAccessForUser } from '@/lib/server/service-access';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { isApiUserFailure, requireApiUser } from '@/lib/server/request-auth';

export const runtime = 'nodejs';

type AnyRow = Record<string, unknown>;
type SlotPeriodKind = 'annual' | 'ytd' | null;

interface SlotContext {
  slot_type: 'tax_return' | 'income_statement' | null;
  slot_label: string | null;
  target_year: number | null;
  period_kind: SlotPeriodKind;
}

interface LegacyTemplateSubmissionRow {
  id: string;
  template_type: string;
  template_slot: number | null;
  form_data: Record<string, unknown> | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

async function ensureLoanPackagingApiAccess(user: { id: string; email?: string | null }) {
  const access = await resolveServiceAccessForUser({
    id: user.id,
    email: user.email ?? undefined,
  });

  return access.canAccessLoanPackaging;
}

const REQUIREMENT_PRIORITY: Record<string, number> = {
  broker_fee_agreement: 5,
  personal_debt_summary: 10,
  personal_financial_statement: 20,
  personal_tax_return_year_1: 25,
  personal_tax_return_year_2: 26,
  business_debt_summary: 30,
  balance_sheet: 40,
  income_statement_ytd: 50,
  income_statement_annual_year_1: 51,
  income_statement_annual_year_2: 52,
  business_tax_return_year_1: 60,
  business_tax_return_year_2: 61,
  cover_letter: 70,
};

const nullableNumberSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'string') {
      const normalized = Number(value.replace(/,/g, ''));
      return Number.isFinite(normalized) ? normalized : value;
    }

    return value;
  },
  z.number().finite().nonnegative().nullable(),
);

const upsertLoanRequestSchema = z.object({
  loanRequestId: z.string().uuid().optional(),
  serviceType: z.enum(SERVICE_TYPES).default('loan_packaging'),
  status: z.enum(LOAN_REQUEST_STATUSES).optional(),
  businessName: z.string().trim().max(180).optional().nullable(),
  businessDescription: z.string().trim().max(5000).optional().nullable(),
  loanPurpose: z.string().trim().max(240).optional().nullable(),
  loanAmount: nullableNumberSchema.optional(),
  annualRevenue: nullableNumberSchema.optional(),
  yearsInBusiness: nullableNumberSchema.optional(),
  strengths: z.string().trim().max(5000).optional().nullable(),
});

const patchLoanRequestSchema = z.object({
  loanRequestId: z.string().uuid(),
  status: z.enum(LOAN_REQUEST_STATUSES).optional(),
  businessName: z.string().trim().max(180).optional().nullable(),
  businessDescription: z.string().trim().max(5000).optional().nullable(),
  loanPurpose: z.string().trim().max(240).optional().nullable(),
  loanAmount: nullableNumberSchema.optional(),
  annualRevenue: nullableNumberSchema.optional(),
  yearsInBusiness: nullableNumberSchema.optional(),
  strengths: z.string().trim().max(5000).optional().nullable(),
});

function normalizeNullableText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeLoanRequestRow(loanRequest: AnyRow | null): AnyRow | null {
  if (!loanRequest) {
    return null;
  }

  return {
    ...loanRequest,
    business_name: normalizeNullableText(loanRequest.business_name),
    business_description: normalizeNullableText(loanRequest.business_description),
    loan_purpose:
      normalizeLoanPurpose(normalizeNullableText(loanRequest.loan_purpose)) ??
      normalizeNullableText(loanRequest.loan_purpose),
    strengths: normalizeNullableText(loanRequest.strengths),
    cover_letter_content: normalizeNullableText(loanRequest.cover_letter_content),
  };
}

function buildSlotContext(requirementKey: string): SlotContext {
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

function withSlotDisplay(requirements: AnyRow[]): AnyRow[] {
  return requirements.map((requirement) => {
    const requirementKey = String(requirement.requirement_key ?? '');
    const slotContext = buildSlotContext(requirementKey);

    return {
      ...requirement,
      display_name: slotContext.slot_label ?? requirement.display_name,
      slot_context: slotContext,
    };
  });
}

function getRequirementPriority(requirement: AnyRow): number {
  const key = String(requirement.requirement_key ?? '');
  const explicit = REQUIREMENT_PRIORITY[key];
  if (typeof explicit === 'number') {
    return explicit;
  }

  const sortOrder = Number(requirement.sort_order);
  return Number.isFinite(sortOrder) ? sortOrder : Number.MAX_SAFE_INTEGER;
}

function sortRequirementsByPriority(requirements: AnyRow[]): AnyRow[] {
  return [...requirements].sort((left, right) => {
    const byPriority = getRequirementPriority(left) - getRequirementPriority(right);
    if (byPriority !== 0) {
      return byPriority;
    }

    const leftLabel = String(left.display_name ?? left.requirement_key ?? '');
    const rightLabel = String(right.display_name ?? right.requirement_key ?? '');
    return leftLabel.localeCompare(rightLabel);
  });
}

async function ensureRequirementSeed(admin: ReturnType<typeof getSupabaseAdmin>) {
  await admin.from('document_requirements').upsert(
    DEFAULT_REQUIREMENT_ROWS as unknown as AnyRow[],
    {
      onConflict: 'requirement_key',
    },
  );

  const activeLoanPackagingKeys = new Set(
    DEFAULT_REQUIREMENT_ROWS
      .filter((row) => row.service_type === 'loan_packaging')
      .map((row) => row.requirement_key),
  );

  const { data: existingLoanPackagingRequirements } = await admin
    .from('document_requirements')
    .select('requirement_key')
    .eq('service_type', 'loan_packaging')
    .eq('is_active', true);

  const retiredRequirementKeys = (existingLoanPackagingRequirements ?? [])
    .map((row) => String(row.requirement_key ?? ''))
    .filter((requirementKey) => requirementKey && !activeLoanPackagingKeys.has(requirementKey));

  if (retiredRequirementKeys.length > 0) {
    await admin
      .from('document_requirements')
      .update({ is_active: false })
      .eq('service_type', 'loan_packaging')
      .in('requirement_key', retiredRequirementKeys);
  }
}

async function fetchRequirements(
  admin: ReturnType<typeof getSupabaseAdmin>,
  serviceType: ServiceType,
  loanPurpose?: string | null,
): Promise<AnyRow[]> {
  await ensureRequirementSeed(admin);

  const serviceTypes =
    serviceType === 'loan_brokering'
      ? ['loan_packaging', 'loan_brokering']
      : [serviceType];

  let { data: requirements } = await admin
    .from('document_requirements')
    .select('*')
    .in('service_type', serviceTypes)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (!requirements || requirements.length === 0) {
    const retry = await admin
      .from('document_requirements')
      .select('*')
      .in('service_type', serviceTypes)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    requirements = retry.data as AnyRow[] | null;
  }

  const filteredRequirements = ((requirements ?? []) as AnyRow[]).filter((requirement) =>
    documentRequirementMatchesLoanPurpose(
      typeof requirement.loan_purpose === 'string' ? requirement.loan_purpose : null,
      loanPurpose,
    ),
  );

  return sortRequirementsByPriority(withSlotDisplay(filteredRequirements));
}

function isIncomeStatementRequirementKey(value: string): value is IncomeStatementRequirementKey {
  return (INCOME_STATEMENT_REQUIREMENT_KEYS as readonly string[]).includes(value);
}

async function ensureIncomeStatementTemplateBindings(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  loanRequestId: string,
  requirements: AnyRow[],
) {
  const requirementKeys = requirements
    .map((requirement) => String(requirement.requirement_key ?? ''))
    .filter(isIncomeStatementRequirementKey);

  if (requirementKeys.length === 0) {
    return [] as LegacyTemplateSubmissionRow[];
  }

  const presets = buildIncomeStatementPresets()
    .filter((preset) => requirementKeys.includes(preset.requirementKey));

  const [existingSubmissionResult, existingDocumentsResult] = await Promise.all([
    admin
      .from('template_submissions')
      .select('id,template_type,template_slot,form_data,pdf_url,created_at,updated_at')
      .eq('user_id', userId)
      .eq('template_type', 'income_statement')
      .is('archived_at', null)
      .order('created_at', { ascending: true }),
    admin
      .from('loan_request_documents')
      .select('id,requirement_key,metadata,source')
      .eq('loan_request_id', loanRequestId)
      .eq('user_id', userId)
      .in('requirement_key', requirementKeys),
  ]);

  let submissions = (existingSubmissionResult.data ?? []) as LegacyTemplateSubmissionRow[];
  const existingDocuments = (existingDocumentsResult.data ?? []) as AnyRow[];
  const missingPresets = presets.filter(
    (preset) => !submissions.some((submission) => matchesIncomeStatementPreset(submission.form_data, preset)),
  );

  if (missingPresets.length > 0 && submissions.length < 5) {
    const rowsToInsert = missingPresets
      .slice(0, Math.max(0, 5 - submissions.length))
      .map((preset) => ({
        user_id: userId,
        template_type: 'income_statement',
        template_slot: preset.templateSlot,
        form_data: buildIncomeStatementFormFromPreset(preset),
      }));

    if (rowsToInsert.length > 0) {
      const insertResult = await admin
        .from('template_submissions')
        .insert(rowsToInsert)
        .select('id,template_type,template_slot,form_data,pdf_url,created_at,updated_at');

      if (insertResult.data) {
        submissions = [...submissions, ...(insertResult.data as LegacyTemplateSubmissionRow[])];
      } else if (insertResult.error) {
        const refetchResult = await admin
          .from('template_submissions')
          .select('id,template_type,template_slot,form_data,pdf_url,created_at,updated_at')
          .eq('user_id', userId)
          .eq('template_type', 'income_statement')
          .is('archived_at', null)
          .order('created_at', { ascending: true });

        submissions = (refetchResult.data ?? []) as LegacyTemplateSubmissionRow[];
      }
    }
  }

  const documentsByRequirementKey = new Map(
    existingDocuments.map((document) => [String(document.requirement_key ?? ''), document]),
  );

  await Promise.all(
    presets.map(async (preset) => {
      const document = documentsByRequirementKey.get(preset.requirementKey);
      const submission = submissions.find((candidate) => matchesIncomeStatementPreset(candidate.form_data, preset));

      if (!document || !submission) {
        return;
      }

      const existingMetadata =
        document.metadata && typeof document.metadata === 'object'
          ? (document.metadata as Record<string, unknown>)
          : {};

      const nextMetadata = {
        ...existingMetadata,
        template_submission_id: submission.id,
        template_requirement_key: preset.requirementKey,
        period_kind: preset.statementType === 'annual' ? 'annual' : 'ytd',
        target_year: Number(preset.periodEnd.slice(0, 4)),
        statement_label: preset.statementLabel,
      };

      const metadataChanged = JSON.stringify(existingMetadata) !== JSON.stringify(nextMetadata);
      const sourceChanged = String(document.source ?? '') !== 'template';

      if (!metadataChanged && !sourceChanged) {
        return;
      }

      await admin
        .from('loan_request_documents')
        .update({
          source: 'template',
          metadata: nextMetadata,
        })
        .eq('id', String(document.id))
        .eq('loan_request_id', loanRequestId)
        .eq('user_id', userId);
    }),
  );

  return submissions;
}

async function ensureDocumentRows(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  loanRequestId: string,
  requirements: AnyRow[],
) {
  if (requirements.length === 0) {
    return;
  }

  const rows = requirements.map((requirement) => ({
    loan_request_id: loanRequestId,
    user_id: userId,
    requirement_key: String(requirement.requirement_key),
    status: 'not_started',
    source:
      ['cover_letter', 'broker_fee_agreement'].includes(String(requirement.requirement_key))
        ? 'generated'
        : requirement.template_key
          ? 'template'
          : 'upload',
  }));

  await admin.from('loan_request_documents').upsert(rows, {
    onConflict: 'loan_request_id,requirement_key',
    ignoreDuplicates: true,
  });
}

async function attachDocumentDownloadUrls(
  admin: ReturnType<typeof getSupabaseAdmin>,
  documents: AnyRow[],
): Promise<AnyRow[]> {
  return Promise.all(
    documents.map(async (document) => {
      if (!document.file_path) {
        return {
          ...document,
          download_url: null,
        };
      }

      const metadata = (document.metadata ?? {}) as Record<string, unknown>;
      const bucket = typeof metadata.bucket === 'string' ? metadata.bucket : 'loan-package-documents';
      const signed = await admin.storage
        .from(bucket)
        .createSignedUrl(String(document.file_path), 60 * 60);

      return {
        ...document,
        download_url: signed.data?.signedUrl ?? undefined,
      };
    }),
  );
}

async function attachPackageDownloadUrl(
  admin: ReturnType<typeof getSupabaseAdmin>,
  loanRequest: AnyRow | null,
): Promise<AnyRow | null> {
  if (!loanRequest?.package_zip_path) {
    return loanRequest;
  }

  const signed = await admin.storage
    .from('generated-packages')
    .createSignedUrl(String(loanRequest.package_zip_path), 60 * 60);

  return {
    ...loanRequest,
    package_download_url: signed.data?.signedUrl ?? null,
  };
}

async function buildDashboardPayload(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  loanRequest: AnyRow | null,
) {
  let normalizedLoanRequest = normalizeLoanRequestRow(loanRequest);
  const sharedProfile = await getSharedProfileSnapshot(admin, userId);

  if (normalizedLoanRequest) {
    const sharedBusinessName = sharedProfile.businessName ?? sharedProfile.businessLegalName ?? null;
    const loanRequestProfileFallbacks: AnyRow = {};

    if (!normalizedLoanRequest.business_name && sharedBusinessName) {
      loanRequestProfileFallbacks.business_name = sharedBusinessName;
    }
    if (!normalizedLoanRequest.loan_purpose && sharedProfile.loanPurpose) {
      loanRequestProfileFallbacks.loan_purpose = sharedProfile.loanPurpose;
    }
    if (normalizedLoanRequest.loan_amount == null && sharedProfile.loanAmount != null) {
      loanRequestProfileFallbacks.loan_amount = sharedProfile.loanAmount;
    }
    if (normalizedLoanRequest.annual_revenue == null && sharedProfile.annualRevenue != null) {
      loanRequestProfileFallbacks.annual_revenue = sharedProfile.annualRevenue;
    }
    if (
      normalizedLoanRequest.years_in_business == null &&
      sharedProfile.yearsInBusiness != null
    ) {
      loanRequestProfileFallbacks.years_in_business = sharedProfile.yearsInBusiness;
    }
    if (!normalizedLoanRequest.business_description && sharedProfile.businessDescription) {
      loanRequestProfileFallbacks.business_description = sharedProfile.businessDescription;
    }

    if (Object.keys(loanRequestProfileFallbacks).length > 0) {
      const { data: hydratedLoanRequest } = await admin
        .from('loan_requests')
        .update({
          ...loanRequestProfileFallbacks,
          updated_at: new Date().toISOString(),
        })
        .eq('id', String(normalizedLoanRequest.id))
        .eq('user_id', userId)
        .select('*')
        .single();

      normalizedLoanRequest = normalizeLoanRequestRow((hydratedLoanRequest as AnyRow | null) ?? normalizedLoanRequest);
    }
  }

  const serviceType = (normalizedLoanRequest?.service_type ?? 'loan_packaging') as ServiceType;
  const requirements = await fetchRequirements(
    admin,
    serviceType,
    normalizeNullableText(normalizedLoanRequest?.loan_purpose),
  );

  const { data: cashFlowAnalysis } = await admin
    .from('cash_flow_analyses')
    .select('id,business_name,loan_purpose,desired_amount,financials,first_name,last_name,debts,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const cashFlowTemplatePrefill = buildCashFlowTemplatePrefill((cashFlowAnalysis as AnyRow | null) ?? null);
  const sharedProfileTemplateContext = normalizeTemplateContext({
    business_name: sharedProfile.businessName ?? sharedProfile.businessLegalName,
    loan_purpose: sharedProfile.loanPurpose,
    loan_amount: sharedProfile.loanAmount,
    annual_revenue: sharedProfile.annualRevenue,
    years_in_business: sharedProfile.yearsInBusiness,
    business_description: sharedProfile.businessDescription,
  });
  const templateSharedContext = normalizeTemplateContext({
    ...sharedProfileTemplateContext,
    ...normalizeTemplateContext(normalizedLoanRequest?.template_shared_context ?? {}),
  });
  const loanRequestTemplateContext = buildLoanRequestTemplateContext(
    normalizedLoanRequest,
    (cashFlowAnalysis as AnyRow | null) ?? null,
    templateSharedContext,
  );

  if (!normalizedLoanRequest) {
    return {
      loanRequest: null,
      requirements,
      documents: [],
      templateSubmissions: [],
      legacyTemplateSubmissions: [],
      progress: buildPackagingProgress(requirements, []),
      sharedProfile,
      templateSharedContext,
      loanRequestTemplateContext,
      cashFlowTemplatePrefill,
      latestCashFlowAnalysisId: (cashFlowAnalysis as AnyRow | null)?.id ?? null,
    };
  }

  const hydratedLoanRequest =
    (await attachPackageDownloadUrl(admin, normalizedLoanRequest)) ?? normalizedLoanRequest;

  await ensureDocumentRows(admin, userId, String(hydratedLoanRequest.id), requirements);
  const boundIncomeStatementSubmissions = await ensureIncomeStatementTemplateBindings(
    admin,
    userId,
    String(hydratedLoanRequest.id),
    requirements,
  );

  const templateTypes = Array.from(
    new Set(
      requirements
        .map((requirement) => requirement.template_key)
        .filter((templateKey): templateKey is string => typeof templateKey === 'string' && templateKey.length > 0),
    ),
  );

  const [documentResult, templateResult, legacyTemplateResult] = await Promise.all([
    admin
      .from('loan_request_documents')
      .select('*')
      .eq('loan_request_id', String(hydratedLoanRequest.id))
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
    admin
      .from('guided_template_submissions')
      .select('*')
      .eq('loan_request_id', String(hydratedLoanRequest.id))
      .eq('user_id', userId)
      .order('updated_at', { ascending: false }),
    templateTypes.length > 0
      ? admin
        .from('template_submissions')
        .select('id,template_type,template_slot,form_data,pdf_url,created_at,updated_at')
        .eq('user_id', userId)
        .is('archived_at', null)
        .in('template_type', templateTypes)
        .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] as LegacyTemplateSubmissionRow[] }),
  ]);

  const documents = (documentResult.data ?? []) as AnyRow[];
  const documentsWithDownloads = await attachDocumentDownloadUrls(admin, documents);
  const templateSubmissions = (templateResult.data ?? []) as AnyRow[];
  const legacyTemplateSubmissions =
    ((legacyTemplateResult as { data?: LegacyTemplateSubmissionRow[] })?.data ?? []).length > 0
      ? (((legacyTemplateResult as { data?: LegacyTemplateSubmissionRow[] }).data ?? []) as LegacyTemplateSubmissionRow[])
      : boundIncomeStatementSubmissions;

  return {
    loanRequest: hydratedLoanRequest,
    requirements,
    documents: documentsWithDownloads,
    templateSubmissions,
    legacyTemplateSubmissions,
    progress: buildPackagingProgress(requirements, documentsWithDownloads),
    sharedProfile,
    templateSharedContext,
    loanRequestTemplateContext,
    cashFlowTemplatePrefill,
    latestCashFlowAnalysisId: (cashFlowAnalysis as AnyRow | null)?.id ?? null,
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiUserFailure(auth)) {
    return auth.response;
  }
  if (!(await ensureLoanPackagingApiAccess(auth.user))) {
    return NextResponse.json({ error: 'Loan packaging access is required' }, { status: 403 });
  }

  const admin = getSupabaseAdmin();
  const requestedLoanRequestId = req.nextUrl.searchParams.get('loanRequestId');

  let loanRequest: AnyRow | null = null;

  if (requestedLoanRequestId) {
    const { data } = await admin
      .from('loan_requests')
      .select('*')
      .eq('id', requestedLoanRequestId)
      .eq('user_id', auth.user.id)
      .maybeSingle();

    loanRequest = (data as AnyRow | null) ?? null;
  } else {
    const { data } = await admin
      .from('loan_requests')
      .select('*')
      .eq('user_id', auth.user.id)
      .in('status', ['draft', 'in_progress', 'submitted', 'completed'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    loanRequest = (data as AnyRow | null) ?? null;
  }

  const payload = await buildDashboardPayload(admin, auth.user.id, loanRequest);
  return NextResponse.json(payload);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiUserFailure(auth)) {
    return auth.response;
  }
  if (!(await ensureLoanPackagingApiAccess(auth.user))) {
    return NextResponse.json({ error: 'Loan packaging access is required' }, { status: 403 });
  }

  const parsed = upsertLoanRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();
  const payload = parsed.data;
  const nowIso = new Date().toISOString();
  const sharedContextUpdates = normalizeTemplateContext({
    business_name: payload.businessName,
    loan_purpose: payload.loanPurpose,
    loan_amount: payload.loanAmount,
    annual_revenue: payload.annualRevenue,
  });

  let loanRequest: AnyRow | null = null;

  if (payload.loanRequestId) {
    const { data, error } = await admin
      .from('loan_requests')
      .update({
        service_type: payload.serviceType,
        status: payload.status ?? 'in_progress',
        business_name: payload.businessName ?? null,
        business_description: payload.businessDescription ?? null,
        loan_purpose: payload.loanPurpose ?? null,
        loan_amount: payload.loanAmount ?? null,
        annual_revenue: payload.annualRevenue ?? null,
        years_in_business: payload.yearsInBusiness ?? null,
        strengths: payload.strengths ?? null,
        template_shared_context: sharedContextUpdates,
        updated_at: nowIso,
      })
      .eq('id', payload.loanRequestId)
      .eq('user_id', auth.user.id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    loanRequest = data as AnyRow;
  } else {
    const { data: existingData } = await admin
      .from('loan_requests')
      .select('*')
      .eq('user_id', auth.user.id)
      .in('status', ['draft', 'in_progress'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const existing = (existingData as AnyRow | null) ?? null;

    if (existing) {
      const { data, error } = await admin
        .from('loan_requests')
        .update({
          service_type: payload.serviceType,
          status: payload.status ?? 'in_progress',
          business_name: payload.businessName ?? existing.business_name,
          business_description: payload.businessDescription ?? existing.business_description,
          loan_purpose: payload.loanPurpose ?? existing.loan_purpose,
          loan_amount: payload.loanAmount ?? existing.loan_amount,
          annual_revenue: payload.annualRevenue ?? existing.annual_revenue,
          years_in_business: payload.yearsInBusiness ?? existing.years_in_business,
          strengths: payload.strengths ?? existing.strengths,
          template_shared_context: {
            ...(normalizeTemplateContext(existing.template_shared_context ?? {})),
            ...sharedContextUpdates,
          },
          updated_at: nowIso,
        })
        .eq('id', String(existing.id))
        .eq('user_id', auth.user.id)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      loanRequest = data as AnyRow;
    } else {
      const { data, error } = await admin
        .from('loan_requests')
        .insert({
          user_id: auth.user.id,
          service_type: payload.serviceType,
          status: payload.status ?? 'in_progress',
          business_name: payload.businessName ?? null,
          business_description: payload.businessDescription ?? null,
          loan_purpose: payload.loanPurpose ?? null,
          loan_amount: payload.loanAmount ?? null,
          annual_revenue: payload.annualRevenue ?? null,
          years_in_business: payload.yearsInBusiness ?? null,
          strengths: payload.strengths ?? null,
          template_shared_context: sharedContextUpdates,
        })
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      loanRequest = data as AnyRow;
    }
  }

  await upsertSharedProfileAndSync(admin, auth.user.id, {
    businessName: payload.businessName,
    businessLegalName: payload.businessName,
    loanPurpose: payload.loanPurpose,
    loanAmount: payload.loanAmount,
    annualRevenue: payload.annualRevenue,
    yearsInBusiness: payload.yearsInBusiness,
    businessDescription: payload.businessDescription,
  });

  const dashboardPayload = await buildDashboardPayload(admin, auth.user.id, loanRequest);
  return NextResponse.json(dashboardPayload);
}

export async function PATCH(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiUserFailure(auth)) {
    return auth.response;
  }
  if (!(await ensureLoanPackagingApiAccess(auth.user))) {
    return NextResponse.json({ error: 'Loan packaging access is required' }, { status: 403 });
  }

  const parsed = patchLoanRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();
  const payload = parsed.data;

  const updatePayload: AnyRow = {
    updated_at: new Date().toISOString(),
  };

  if (payload.status !== undefined) {
    updatePayload.status = payload.status;
    if (payload.status === 'submitted') {
      updatePayload.submitted_at = new Date().toISOString();
    }
  }

  if (payload.businessName !== undefined) {
    updatePayload.business_name = payload.businessName;
  }

  if (payload.businessDescription !== undefined) {
    updatePayload.business_description = payload.businessDescription;
  }

  if (payload.loanPurpose !== undefined) {
    updatePayload.loan_purpose = payload.loanPurpose;
  }

  if (payload.loanAmount !== undefined) {
    updatePayload.loan_amount = payload.loanAmount;
  }

  if (payload.annualRevenue !== undefined) {
    updatePayload.annual_revenue = payload.annualRevenue;
  }

  if (payload.yearsInBusiness !== undefined) {
    updatePayload.years_in_business = payload.yearsInBusiness;
  }

  if (payload.strengths !== undefined) {
    updatePayload.strengths = payload.strengths;
  }

  if (
    payload.businessName !== undefined ||
    payload.loanPurpose !== undefined ||
    payload.loanAmount !== undefined ||
    payload.annualRevenue !== undefined
  ) {
    const { data: existingLoanRequest } = await admin
      .from('loan_requests')
      .select('template_shared_context')
      .eq('id', payload.loanRequestId)
      .eq('user_id', auth.user.id)
      .maybeSingle();

    updatePayload.template_shared_context = {
      ...(normalizeTemplateContext(existingLoanRequest?.template_shared_context ?? {})),
      ...(normalizeTemplateContext({
        business_name: payload.businessName,
        loan_purpose: payload.loanPurpose,
        loan_amount: payload.loanAmount,
        annual_revenue: payload.annualRevenue,
      })),
    };
  }

  const { data, error } = await admin
    .from('loan_requests')
    .update(updatePayload)
    .eq('id', payload.loanRequestId)
    .eq('user_id', auth.user.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await upsertSharedProfileAndSync(admin, auth.user.id, {
    businessName: payload.businessName,
    businessLegalName: payload.businessName,
    loanPurpose: payload.loanPurpose,
    loanAmount: payload.loanAmount,
    annualRevenue: payload.annualRevenue,
    yearsInBusiness: payload.yearsInBusiness,
    businessDescription: payload.businessDescription,
  });

  const dashboardPayload = await buildDashboardPayload(admin, auth.user.id, data as AnyRow);
  return NextResponse.json(dashboardPayload);
}
