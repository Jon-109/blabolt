import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { type User } from '@supabase/supabase-js';
import {
  buildDebtMetrics,
  calculateDscrResults,
  normalizeFinancialsPayload,
  roundDscrMap,
} from '@/lib/financial/calculations';
import {
  type AnyRow,
  buildPackagingProgress,
  computeTemplateProgress,
  createEmptyFinancialPayload,
  deriveAccessFlags,
  deriveServicePills,
  filterApplicableRequirements,
  formatRequirementDisplayName,
  normalizeDscrSnapshot,
  parseFiniteNumber,
} from '@/lib/admin/client-dashboard';
import { requireAdminApiIdentity } from '@/lib/server/admin-api-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import {
  getPendingSharedProfileSnapshot,
  stagePendingSharedProfile,
} from '@/lib/server/client-account-sync';
import {
  getSharedProfileSnapshot,
  type SharedProfileSnapshot,
  upsertSharedProfileAndSync,
} from '@/lib/server/shared-profile';

export const runtime = 'nodejs';

const nullableNumberSchema = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : value;
    }

    if (typeof value === 'string') {
      const normalized = Number(value.replace(/[$,%\s,]/g, '').trim());
      return Number.isFinite(normalized) ? normalized : value;
    }

    return value;
  },
  z.number().finite().nullable(),
);

const nullableTextSchema = z.preprocess(
  (value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  },
  z.string().max(5000).nullable().optional(),
);

const fullFinancialInputSchema = z.object({
  revenue: z.string(),
  cogs: z.string(),
  operatingExpenses: z.string(),
  nonRecurringIncome: z.string(),
  nonRecurringExpenses: z.string(),
  depreciation: z.string(),
  amortization: z.string(),
  interest: z.string(),
  taxes: z.string(),
});

const financialYearSchema = z.object({
  input: fullFinancialInputSchema,
  skip: z.boolean().optional(),
  ytdMonth: z.string().optional().nullable(),
});

const detailPatchSchema = z.object({
  account: z.object({
    fullName: z.string().trim().max(180).nullable().optional(),
    email: z.preprocess(
      (value) => {
        if (value === undefined) return undefined;
        if (value === null) return null;
        if (typeof value !== 'string') return value;
        const trimmed = value.trim().toLowerCase();
        return trimmed.length > 0 ? trimmed : null;
      },
      z.string().email().nullable().optional(),
    ),
    notes: nullableTextSchema,
    nextStep: nullableTextSchema,
    serviceLevel: z.enum(['none', 'comprehensive', 'templates', 'packaging', 'brokering']).optional(),
    accessTemplates: z.boolean().optional(),
    accessPackaging: z.boolean().optional(),
    accessComprehensive: z.boolean().optional(),
  }).optional(),
  sharedProfile: z.object({
    personalName: nullableTextSchema,
    businessName: nullableTextSchema,
    businessLegalName: nullableTextSchema,
    loanPurpose: nullableTextSchema,
    loanAmount: nullableNumberSchema.optional(),
    annualRevenue: nullableNumberSchema.optional(),
    yearsInBusiness: nullableNumberSchema.optional(),
    businessDescription: nullableTextSchema,
  }).optional(),
  loanRequest: z.object({
    id: z.string().uuid(),
    status: z.enum(['draft', 'in_progress', 'submitted', 'completed', 'archived']).optional(),
    businessName: z.string().trim().max(180).nullable().optional(),
    businessDescription: nullableTextSchema,
    loanPurpose: z.string().trim().max(240).nullable().optional(),
    loanAmount: nullableNumberSchema.optional(),
    annualRevenue: nullableNumberSchema.optional(),
    yearsInBusiness: nullableNumberSchema.optional(),
    strengths: nullableTextSchema,
  }).optional(),
  cashFlowAnalysis: z.object({
    id: z.string().uuid(),
    status: z.enum(['inprogress', 'submitted']).optional(),
    firstName: z.string().trim().max(30).nullable().optional(),
    lastName: z.string().trim().max(30).nullable().optional(),
    businessName: z.string().trim().max(180).nullable().optional(),
    loanPurpose: z.string().trim().max(240).nullable().optional(),
    desiredAmount: nullableNumberSchema.optional(),
    estimatedPayment: nullableNumberSchema.optional(),
    annualizedLoan: nullableNumberSchema.optional(),
    term: z.string().trim().max(20).nullable().optional(),
    interestRate: nullableNumberSchema.optional(),
    downPayment: nullableNumberSchema.optional(),
    downPayment293: z.string().trim().max(20).nullable().optional(),
    proposedLoan: nullableNumberSchema.optional(),
    financials: z.object({
      year2024: financialYearSchema,
      year2025: financialYearSchema,
      year2026YTD: financialYearSchema,
    }).optional(),
  }).optional(),
});

function latestIsoDate(...values: unknown[]): string {
  const latest = values.reduce<number>((current, value) => {
    if (typeof value !== 'string' && !(value instanceof Date)) {
      return current;
    }

    const parsed = new Date(value).getTime();
    if (Number.isNaN(parsed)) {
      return current;
    }

    return Math.max(current, parsed);
  }, 0);

  return latest > 0 ? new Date(latest).toISOString() : new Date().toISOString();
}

function coerceString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractDebtEntries(value: unknown): AnyRow[] {
  if (Array.isArray(value)) {
    return value.filter((entry) => entry && typeof entry === 'object') as AnyRow[];
  }

  if (value && typeof value === 'object' && Array.isArray((value as { entries?: unknown[] }).entries)) {
    return (value as { entries: unknown[] }).entries.filter((entry) => entry && typeof entry === 'object') as AnyRow[];
  }

  return [];
}

function mergeSharedProfiles(
  primary: SharedProfileSnapshot,
  fallback: SharedProfileSnapshot,
): SharedProfileSnapshot {
  return {
    personalName: primary.personalName ?? fallback.personalName,
    businessName: primary.businessName ?? fallback.businessName,
    businessLegalName: primary.businessLegalName ?? fallback.businessLegalName,
    loanPurpose: primary.loanPurpose ?? fallback.loanPurpose,
    loanAmount: primary.loanAmount ?? fallback.loanAmount,
    annualRevenue: primary.annualRevenue ?? fallback.annualRevenue,
    yearsInBusiness: primary.yearsInBusiness ?? fallback.yearsInBusiness,
    businessDescription: primary.businessDescription ?? fallback.businessDescription,
  };
}

async function resolveClientIdentity(
  admin: ReturnType<typeof getSupabaseAdmin>,
  clientId: string,
): Promise<{ account: AnyRow | null; user: User | null }> {
  const accountResult = await admin
    .from('client_accounts')
    .select('*')
    .or(`id.eq.${clientId},user_id.eq.${clientId}`)
    .maybeSingle();

  let account = (accountResult.data as AnyRow | null) ?? null;
  let user: User | null = null;

  const directUser = await admin.auth.admin.getUserById(clientId);
  if (directUser.data.user) {
    user = directUser.data.user;
  }

  if (!user && account?.user_id) {
    const accountUser = await admin.auth.admin.getUserById(String(account.user_id));
    user = accountUser.data.user ?? null;
  }

  if (!user && account?.email) {
    const usersPage = await admin.auth.admin.listUsers({ page: 1, perPage: 2000 });
    user = usersPage.data.users.find(
      (candidate) => candidate.email?.toLowerCase() === String(account?.email ?? '').toLowerCase(),
    ) ?? null;
  }

  if (!account && user?.email) {
    const byEmail = await admin
      .from('client_accounts')
      .select('*')
      .eq('email', user.email.toLowerCase())
      .maybeSingle();
    account = (byEmail.data as AnyRow | null) ?? null;
  }

  return { account, user };
}

async function ensureClientAccount(
  admin: ReturnType<typeof getSupabaseAdmin>,
  identity: { account: AnyRow | null; user: User | null },
) {
  if (identity.account) {
    return identity.account;
  }

  if (!identity.user?.email) {
    return null;
  }

  const { data } = await admin
    .from('client_accounts')
    .upsert(
      {
        user_id: identity.user.id,
        email: identity.user.email.toLowerCase(),
        full_name:
          (typeof identity.user.user_metadata?.full_name === 'string' && identity.user.user_metadata.full_name) ||
          (typeof identity.user.user_metadata?.name === 'string' && identity.user.user_metadata.name) ||
          null,
      },
      { onConflict: 'email' },
    )
    .select('*')
    .single();

  return (data as AnyRow | null) ?? null;
}

async function buildClientDetailPayload(
  admin: ReturnType<typeof getSupabaseAdmin>,
  clientId: string,
) {
  const identity = await resolveClientIdentity(admin, clientId);
  const account = identity.account;
  const user = identity.user;

  if (!account && !user) {
    return null;
  }

  const userId = user?.id ?? (typeof account?.user_id === 'string' ? account.user_id : null);
  const email = String(account?.email ?? user?.email ?? '').toLowerCase();
  const pendingSharedProfile = getPendingSharedProfileSnapshot(account);

  let sharedProfile = mergeSharedProfiles({}, pendingSharedProfile);
  let latestLoanRequest: AnyRow | null = null;
  let latestCashFlowAnalysis: AnyRow | null = null;
  let templateRows: AnyRow[] = [];
  let purchaseRows: AnyRow[] = [];
  let signedBrokerAgreement = false;
  let documentRows: AnyRow[] = [];
  let requirementRows: AnyRow[] = [];

  if (userId) {
    const [
      sharedProfileResult,
      loanRequestResult,
      cashFlowResult,
      templatesResult,
      purchasesResult,
      brokerAgreementResult,
    ] = await Promise.all([
      getSharedProfileSnapshot(admin, userId),
      admin
        .from('loan_requests')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['draft', 'in_progress', 'submitted', 'completed'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from('cash_flow_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from('template_submissions')
        .select('id,user_id,template_type,form_data,pdf_url,updated_at,archived_at,template_slot')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false }),
      admin
        .from('purchases')
        .select('product_type,paid')
        .eq('user_id', userId)
        .eq('paid', true),
      admin
        .from('broker_fee_agreements')
        .select('id,status')
        .eq('user_id', userId)
        .eq('status', 'signed')
        .limit(1)
        .maybeSingle(),
    ]);

    sharedProfile = mergeSharedProfiles(sharedProfileResult, pendingSharedProfile);
    latestLoanRequest = (loanRequestResult.data as AnyRow | null) ?? null;
    latestCashFlowAnalysis = (cashFlowResult.data as AnyRow | null) ?? null;
    templateRows = (templatesResult.data ?? []) as AnyRow[];
    purchaseRows = (purchasesResult.data ?? []) as AnyRow[];
    signedBrokerAgreement = Boolean(brokerAgreementResult.data?.id);

    if (latestLoanRequest?.id) {
      const [documentsResult, requirementsResult] = await Promise.all([
        admin
          .from('loan_request_documents')
          .select('*')
          .eq('loan_request_id', String(latestLoanRequest.id))
          .eq('user_id', userId)
          .order('updated_at', { ascending: false }),
        admin
          .from('document_requirements')
          .select('requirement_key,service_type,loan_purpose,display_name,description,required,sort_order,is_active')
          .eq('is_active', true)
          .limit(500),
      ]);

      documentRows = (documentsResult.data ?? []) as AnyRow[];
      requirementRows = filterApplicableRequirements(
        (requirementsResult.data ?? []) as AnyRow[],
        String(latestLoanRequest.service_type ?? 'loan_packaging'),
        coerceString(latestLoanRequest.loan_purpose),
      );
    }
  }

  const purchaseTypes = new Set(
    purchaseRows
      .map((row) => String(row.product_type ?? '').trim())
      .filter(Boolean),
  );

  const access = deriveAccessFlags(account, latestLoanRequest, purchaseTypes, signedBrokerAgreement);
  const services = deriveServicePills({
    accountRow: account,
    latestLoanRequest,
    purchaseTypes,
    hasSignedBrokerAgreement: signedBrokerAgreement,
  });

  const dscr = normalizeDscrSnapshot(latestCashFlowAnalysis?.dscr ?? null);
  const templateSummary = computeTemplateProgress(templateRows);
  const packagingProgress = latestLoanRequest
    ? buildPackagingProgress(requirementRows, documentRows)
    : null;

  const documentByRequirement = new Map(
    documentRows.map((document) => [String(document.requirement_key ?? ''), document]),
  );

  const uploadedDocuments = documentRows
    .filter((document) => String(document.status ?? 'not_started') !== 'not_started')
    .map((document) => ({
      id: String(document.id ?? ''),
      requirementKey: String(document.requirement_key ?? ''),
      displayName: formatRequirementDisplayName(
        String(document.requirement_key ?? ''),
        coerceString(documentByRequirement.get(String(document.requirement_key ?? ''))?.display_name) ??
          requirementRows.find(
            (requirement) => String(requirement.requirement_key ?? '') === String(document.requirement_key ?? ''),
          )?.display_name as string | undefined,
      ),
      status: String(document.status ?? 'not_started'),
      source: String(document.source ?? 'upload'),
      uploadedAt: typeof document.uploaded_at === 'string' ? document.uploaded_at : null,
      updatedAt: typeof document.updated_at === 'string' ? document.updated_at : null,
    }));

  const nextRequired = requirementRows
    .filter((requirement) => Boolean(requirement.required))
    .filter((requirement) => {
      const document = documentByRequirement.get(String(requirement.requirement_key ?? ''));
      return !document || !['uploaded', 'generated', 'approved'].includes(String(document.status ?? ''));
    })
    .slice(0, 6)
    .map((requirement) => ({
      requirementKey: String(requirement.requirement_key ?? ''),
      displayName: formatRequirementDisplayName(
        String(requirement.requirement_key ?? ''),
        coerceString(requirement.display_name),
      ),
      description: String(requirement.description ?? ''),
    }));

  const financials = latestCashFlowAnalysis
    ? normalizeFinancialsPayload(latestCashFlowAnalysis.financials)
    : createEmptyFinancialPayload();

  return {
    client: {
      id: userId ?? String(account?.id ?? clientId),
      clientAccountId: account?.id ? String(account.id) : null,
      userId,
      fullName: String(
        account?.full_name ??
        user?.user_metadata?.full_name ??
        user?.user_metadata?.name ??
        '',
      ),
      email,
      hasAccount: Boolean(userId),
      services,
      hasTemplateAccess: access.hasTemplateAccess,
      hasPackagingAccess: access.hasLoanPackaging,
      hasComprehensiveAccess: access.hasComprehensiveAccess,
      lastUpdate: latestIsoDate(
        account?.updated_at,
        latestLoanRequest?.updated_at,
        latestCashFlowAnalysis?.updated_at,
        user?.last_sign_in_at,
        user?.created_at,
      ),
      dscr,
    },
    account: {
      fullName: coerceString(account?.full_name),
      notes: coerceString(account?.notes),
      nextStep: coerceString(account?.next_step),
      serviceLevel: String(account?.service_level ?? 'none'),
      accessTemplates: Boolean(account?.access_templates),
      accessPackaging: Boolean(account?.access_packaging),
      accessComprehensive: Boolean(account?.access_comprehensive),
      email,
    },
    sharedProfile,
    templateSummary: {
      progressPct: templateSummary.progressPct,
      nextStep: templateSummary.nextStep,
      submissions: templateRows
        .filter((row) => !row.archived_at)
        .map((row) => ({
          id: String(row.id ?? ''),
          templateType: String(row.template_type ?? ''),
          updatedAt: String(row.updated_at ?? ''),
          pdfUrl: coerceString(row.pdf_url),
          slot: row.template_slot == null ? null : Number(row.template_slot),
        })),
    },
    packaging: latestLoanRequest
      ? {
          loanRequest: {
            id: String(latestLoanRequest.id ?? ''),
            serviceType: String(latestLoanRequest.service_type ?? ''),
            status: String(latestLoanRequest.status ?? ''),
            businessName: coerceString(latestLoanRequest.business_name),
            businessDescription: coerceString(latestLoanRequest.business_description),
            loanPurpose: coerceString(latestLoanRequest.loan_purpose),
            loanAmount: parseFiniteNumber(latestLoanRequest.loan_amount),
            annualRevenue: parseFiniteNumber(latestLoanRequest.annual_revenue),
            yearsInBusiness: parseFiniteNumber(latestLoanRequest.years_in_business),
            strengths: coerceString(latestLoanRequest.strengths),
            updatedAt: String(latestLoanRequest.updated_at ?? ''),
          },
          progress: packagingProgress,
          uploadedDocuments,
          nextRequired,
        }
      : null,
    cashFlowAnalysis: latestCashFlowAnalysis
      ? {
          id: String(latestCashFlowAnalysis.id ?? ''),
          status: String(latestCashFlowAnalysis.status ?? 'inprogress'),
          updatedAt: String(latestCashFlowAnalysis.updated_at ?? ''),
          dscr,
          loanInfo: {
            firstName: coerceString(latestCashFlowAnalysis.first_name),
            lastName: coerceString(latestCashFlowAnalysis.last_name),
            businessName: coerceString(latestCashFlowAnalysis.business_name),
            loanPurpose: coerceString(latestCashFlowAnalysis.loan_purpose),
            desiredAmount: parseFiniteNumber(latestCashFlowAnalysis.desired_amount),
            estimatedPayment: parseFiniteNumber(latestCashFlowAnalysis.estimated_payment),
            annualizedLoan: parseFiniteNumber(latestCashFlowAnalysis.annualized_loan),
            term: coerceString(latestCashFlowAnalysis.term),
            interestRate: parseFiniteNumber(latestCashFlowAnalysis.interest_rate),
            downPayment: parseFiniteNumber(latestCashFlowAnalysis.down_payment),
            downPayment293: coerceString(latestCashFlowAnalysis.down_payment293),
            proposedLoan: parseFiniteNumber(latestCashFlowAnalysis.proposed_loan),
          },
          financials,
        }
      : null,
  };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ clientId: string }> },
) {
  const adminIdentity = await requireAdminApiIdentity(req);
  if (!adminIdentity.ok) return adminIdentity.response;

  const { clientId } = await context.params;
  const admin = getSupabaseAdmin();
  const payload = await buildClientDetailPayload(admin, clientId);

  if (!payload) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  return NextResponse.json(payload);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ clientId: string }> },
) {
  const adminIdentity = await requireAdminApiIdentity(req);
  if (!adminIdentity.ok) return adminIdentity.response;

  const parsed = detailPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const { clientId } = await context.params;
  const admin = getSupabaseAdmin();
  const identity = await resolveClientIdentity(admin, clientId);

  if (!identity.account && !identity.user) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const userId = identity.user?.id ?? (typeof identity.account?.user_id === 'string' ? identity.account.user_id : null);
  const nowIso = new Date().toISOString();

  if (parsed.data.account) {
    const account = await ensureClientAccount(admin, identity);
    if (!account) {
      return NextResponse.json({ error: 'Client account could not be created.' }, { status: 400 });
    }

    const accountUpdates: AnyRow = {
      updated_at: nowIso,
    };

    if ('fullName' in parsed.data.account) accountUpdates.full_name = parsed.data.account.fullName ?? null;
    if ('email' in parsed.data.account) {
      if (identity.user) {
        const nextEmail = (parsed.data.account.email ?? '').trim().toLowerCase();
        const currentEmail = String(identity.user.email ?? identity.account?.email ?? '').trim().toLowerCase();

        if (nextEmail && nextEmail !== currentEmail) {
          return NextResponse.json({ error: 'Linked auth user email is read-only here.' }, { status: 400 });
        }
      } else {
        accountUpdates.email = parsed.data.account.email ?? null;
      }
    }
    if ('notes' in parsed.data.account) accountUpdates.notes = parsed.data.account.notes ?? null;
    if ('nextStep' in parsed.data.account) accountUpdates.next_step = parsed.data.account.nextStep ?? null;
    if ('serviceLevel' in parsed.data.account) accountUpdates.service_level = parsed.data.account.serviceLevel;
    if ('accessTemplates' in parsed.data.account) accountUpdates.access_templates = parsed.data.account.accessTemplates;
    if ('accessPackaging' in parsed.data.account) accountUpdates.access_packaging = parsed.data.account.accessPackaging;
    if ('accessComprehensive' in parsed.data.account) accountUpdates.access_comprehensive = parsed.data.account.accessComprehensive;

    const { error } = await admin
      .from('client_accounts')
      .update(accountUpdates)
      .eq('id', String(account.id));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (parsed.data.sharedProfile) {
    if (userId) {
      await upsertSharedProfileAndSync(admin, userId, parsed.data.sharedProfile);
    } else {
      const account = await ensureClientAccount(admin, identity);
      if (!account) {
        return NextResponse.json({ error: 'Client account could not be created.' }, { status: 400 });
      }

      try {
        await stagePendingSharedProfile(admin, account, parsed.data.sharedProfile);
      } catch (error) {
        return NextResponse.json({
          error: error instanceof Error ? error.message : 'Failed to stage shared profile.',
        }, { status: 500 });
      }
    }
  }

  if (parsed.data.loanRequest && userId) {
    const loanRequestUpdates: AnyRow = {
      updated_at: nowIso,
    };

    if ('status' in parsed.data.loanRequest) loanRequestUpdates.status = parsed.data.loanRequest.status;
    if ('businessName' in parsed.data.loanRequest) loanRequestUpdates.business_name = parsed.data.loanRequest.businessName ?? null;
    if ('businessDescription' in parsed.data.loanRequest) {
      loanRequestUpdates.business_description = parsed.data.loanRequest.businessDescription ?? null;
    }
    if ('loanPurpose' in parsed.data.loanRequest) loanRequestUpdates.loan_purpose = parsed.data.loanRequest.loanPurpose ?? null;
    if ('loanAmount' in parsed.data.loanRequest) loanRequestUpdates.loan_amount = parsed.data.loanRequest.loanAmount ?? null;
    if ('annualRevenue' in parsed.data.loanRequest) {
      loanRequestUpdates.annual_revenue = parsed.data.loanRequest.annualRevenue ?? null;
    }
    if ('yearsInBusiness' in parsed.data.loanRequest) {
      loanRequestUpdates.years_in_business = parsed.data.loanRequest.yearsInBusiness ?? null;
    }
    if ('strengths' in parsed.data.loanRequest) loanRequestUpdates.strengths = parsed.data.loanRequest.strengths ?? null;

    const { error } = await admin
      .from('loan_requests')
      .update(loanRequestUpdates)
      .eq('id', parsed.data.loanRequest.id)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (parsed.data.cashFlowAnalysis && userId) {
    const currentAnalysisResult = await admin
      .from('cash_flow_analyses')
      .select('id,user_id,debts,financials,annualized_loan')
      .eq('id', parsed.data.cashFlowAnalysis.id)
      .eq('user_id', userId)
      .single();

    if (currentAnalysisResult.error) {
      return NextResponse.json({ error: currentAnalysisResult.error.message }, { status: 500 });
    }

    const currentAnalysis = currentAnalysisResult.data as AnyRow;
    const financialsPayload = parsed.data.cashFlowAnalysis.financials
      ? normalizeFinancialsPayload({
          year2024: {
            input: parsed.data.cashFlowAnalysis.financials.year2024.input,
            skip: parsed.data.cashFlowAnalysis.financials.year2024.skip,
          },
          year2025: {
            input: parsed.data.cashFlowAnalysis.financials.year2025.input,
            skip: parsed.data.cashFlowAnalysis.financials.year2025.skip,
          },
          year2026YTD: {
            input: parsed.data.cashFlowAnalysis.financials.year2026YTD.input,
            skip: parsed.data.cashFlowAnalysis.financials.year2026YTD.skip,
            ytdMonth: parsed.data.cashFlowAnalysis.financials.year2026YTD.ytdMonth ?? '',
          },
        })
      : normalizeFinancialsPayload(currentAnalysis.financials);

    const annualizedLoan = parsed.data.cashFlowAnalysis.annualizedLoan ?? parseFiniteNumber(currentAnalysis.annualized_loan) ?? 0;
    const debtEntries = extractDebtEntries(currentAnalysis.debts);
    const debtMetrics = buildDebtMetrics(
      debtEntries as never[],
      annualizedLoan,
      financialsPayload.year2026YTD?.ytdMonth,
    );
    const dscr = roundDscrMap(
      calculateDscrResults(
        financialsPayload,
        debtMetrics.annualDebtServices,
        debtMetrics.annualizedLoanPayments,
      ),
    );

    const cashFlowUpdates: AnyRow = {
      updated_at: nowIso,
      financials: financialsPayload,
      dscr,
    };

    if ('status' in parsed.data.cashFlowAnalysis) cashFlowUpdates.status = parsed.data.cashFlowAnalysis.status;
    if ('firstName' in parsed.data.cashFlowAnalysis) cashFlowUpdates.first_name = parsed.data.cashFlowAnalysis.firstName ?? null;
    if ('lastName' in parsed.data.cashFlowAnalysis) cashFlowUpdates.last_name = parsed.data.cashFlowAnalysis.lastName ?? null;
    if ('businessName' in parsed.data.cashFlowAnalysis) cashFlowUpdates.business_name = parsed.data.cashFlowAnalysis.businessName ?? '';
    if ('loanPurpose' in parsed.data.cashFlowAnalysis) cashFlowUpdates.loan_purpose = parsed.data.cashFlowAnalysis.loanPurpose ?? null;
    if ('desiredAmount' in parsed.data.cashFlowAnalysis) cashFlowUpdates.desired_amount = parsed.data.cashFlowAnalysis.desiredAmount ?? null;
    if ('estimatedPayment' in parsed.data.cashFlowAnalysis) {
      cashFlowUpdates.estimated_payment = parsed.data.cashFlowAnalysis.estimatedPayment ?? null;
    }
    if ('annualizedLoan' in parsed.data.cashFlowAnalysis) {
      cashFlowUpdates.annualized_loan = parsed.data.cashFlowAnalysis.annualizedLoan ?? null;
    }
    if ('term' in parsed.data.cashFlowAnalysis) cashFlowUpdates.term = parsed.data.cashFlowAnalysis.term ?? null;
    if ('interestRate' in parsed.data.cashFlowAnalysis) {
      cashFlowUpdates.interest_rate = parsed.data.cashFlowAnalysis.interestRate ?? null;
    }
    if ('downPayment' in parsed.data.cashFlowAnalysis) {
      cashFlowUpdates.down_payment = parsed.data.cashFlowAnalysis.downPayment ?? null;
    }
    if ('downPayment293' in parsed.data.cashFlowAnalysis) {
      cashFlowUpdates.down_payment293 = parsed.data.cashFlowAnalysis.downPayment293 ?? null;
    }
    if ('proposedLoan' in parsed.data.cashFlowAnalysis) {
      cashFlowUpdates.proposed_loan = parsed.data.cashFlowAnalysis.proposedLoan ?? null;
    }

    const { error } = await admin
      .from('cash_flow_analyses')
      .update(cashFlowUpdates)
      .eq('id', parsed.data.cashFlowAnalysis.id)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const payload = await buildClientDetailPayload(admin, clientId);
  if (!payload) {
    return NextResponse.json({ error: 'Client not found after update' }, { status: 404 });
  }

  return NextResponse.json(payload);
}
