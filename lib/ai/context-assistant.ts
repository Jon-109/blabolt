import type { SupabaseClient } from '@supabase/supabase-js';
import {
  COMPLETED_DOCUMENT_STATUSES,
  TEMPLATE_KEYS,
  documentRequirementMatchesLoanPurpose,
  type TemplateKey,
} from '@/lib/loan-packaging/constants';
import { isDocumentExcludedFromPackage } from '@/lib/loan-packaging/document-state';
import {
  computeTemplateMetrics,
  getTemplateCompletionPercentage,
  getTemplateDefinition,
  getTemplateValidationIssues,
  type TemplateValues,
} from '@/lib/loan-packaging/template-engine';

type AnyRow = Record<string, unknown>;

export type AssistantScope = 'global' | 'loan_packaging_dashboard' | 'template';

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DashboardAssistantContext {
  scope: 'loan_packaging_dashboard';
  userProfile: Record<string, unknown>;
  loanRequest: Record<string, unknown> | null;
  progress: {
    totalRequired: number;
    completedRequired: number;
    percentage: number;
    nextRequirement: string | null;
  };
  missingRequiredDocuments: Array<{
    requirementKey: string;
    displayName: string;
    description: string;
    templateKey: string | null;
    status: string;
  }>;
  templateSubmissions: Array<{
    templateKey: string;
    completionPct: number;
    status: string;
    updatedAt: string | null;
  }>;
  coverLetter: Record<string, unknown>;
}

export interface GlobalAssistantContext {
  scope: 'global';
  currentPage: string;
  authenticated: true;
  account: Record<string, unknown>;
  services: unknown[];
  summary: Record<string, unknown>;
  loanPackaging: DashboardAssistantContext;
  cashFlowAnalysis: Record<string, unknown> | null;
  guidedTemplates: unknown[];
  savedTemplates: unknown[];
}

export interface TemplateAssistantContext {
  scope: 'template';
  template: {
    key: TemplateKey;
    name: string;
    description: string;
    focus: string;
    sections: Array<{
      title: string;
      description: string;
      fields: Array<{
        id: string;
        label: string;
        required: boolean;
        helperText: string | null;
      }>;
    }>;
  };
  userProfile: Record<string, unknown>;
  loanRequest: Record<string, unknown> | null;
  guidedSubmission: Record<string, unknown> | null;
  legacySubmission: Record<string, unknown> | null;
}

const TEMPLATE_ASSISTANT_FOCUS: Record<TemplateKey, string> = {
  balance_sheet:
    'Explain asset, liability, and equity classification clearly. Help the user understand what lenders expect and point out balancing issues without inventing numbers.',
  income_statement:
    'Help the user understand period selection, revenue vs direct costs vs operating expenses, and how lenders interpret profitability and repayment capacity.',
  personal_financial_statement:
    'Help the user complete a lender-facing guarantor net-worth statement carefully and explain what belongs in personal assets and liabilities.',
  personal_debt_summary:
    'Help the user organize personal obligations accurately, explain what debt details lenders want, and keep the user focused on monthly payment obligations and balances.',
  business_debt_summary:
    'Help the user organize business obligations accurately, explain what lenders want to see for each debt, and highlight how debt schedules affect underwriting.',
};

function trimString(value: string, maxLength = 280): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}...`;
}

function sanitizeForModel(value: unknown, depth = 0): unknown {
  if (value == null) {
    return value;
  }

  if (typeof value === 'string') {
    return trimString(value, depth === 0 ? 400 : 220);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    if (depth >= 4) {
      return `[${value.length} items]`;
    }

    return value.slice(0, 12).map((item) => sanitizeForModel(item, depth + 1));
  }

  if (typeof value === 'object') {
    if (depth >= 4) {
      return '[object]';
    }

    const entries = Object.entries(value as Record<string, unknown>).filter(([, entryValue]) => {
      if (entryValue == null) {
        return false;
      }

      if (typeof entryValue === 'string') {
        return entryValue.trim().length > 0;
      }

      if (Array.isArray(entryValue)) {
        return entryValue.length > 0;
      }

      return true;
    });

    return Object.fromEntries(
      entries.slice(0, 24).map(([key, entryValue]) => [key, sanitizeForModel(entryValue, depth + 1)]),
    );
  }

  return String(value);
}

function formatCurrency(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function templateKeyFromValue(value: string): TemplateKey {
  if ((TEMPLATE_KEYS as readonly string[]).includes(value)) {
    return value as TemplateKey;
  }

  return 'balance_sheet';
}

export async function buildDashboardAssistantContext(args: {
  admin: Pick<SupabaseClient, 'from'>;
  userId: string;
  loanRequestId?: string | null;
}): Promise<DashboardAssistantContext> {
  const { admin, userId, loanRequestId } = args;

  const profileResult = admin
    .from('user_template_profiles')
    .select('personal_name,business_name,business_legal_name')
    .eq('user_id', userId)
    .maybeSingle();

  const loanRequestQuery = admin
    .from('loan_requests')
    .select(
      'id,service_type,status,business_name,business_description,loan_purpose,loan_amount,annual_revenue,years_in_business,strengths,cover_letter_status,cover_letter_inputs,cover_letter_content,created_at,updated_at',
    )
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1);

  const loanRequestResult = loanRequestId
    ? loanRequestQuery.eq('id', loanRequestId).maybeSingle()
    : loanRequestQuery.maybeSingle();

  const [profileResponse, loanRequestResponse, requirementsResponse] = await Promise.all([
    profileResult,
    loanRequestResult,
    admin
      .from('document_requirements')
      .select('requirement_key,display_name,description,required,template_key,service_type,loan_purpose')
      .eq('service_type', 'loan_packaging')
      .eq('is_active', true),
  ]);

  const loanRequest = (loanRequestResponse.data as AnyRow | null) ?? null;
  const resolvedLoanRequestId =
    loanRequest && typeof loanRequest.id === 'string' ? loanRequest.id : null;

  const [documentsResponse, templateSubmissionsResponse] = resolvedLoanRequestId
    ? await Promise.all([
        admin
          .from('loan_request_documents')
          .select('requirement_key,status,updated_at,excluded_from_package,excluded_at')
          .eq('loan_request_id', resolvedLoanRequestId)
          .eq('user_id', userId),
        admin
          .from('guided_template_submissions')
          .select('template_key,status,completion_pct,updated_at')
          .eq('loan_request_id', resolvedLoanRequestId)
          .eq('user_id', userId),
      ])
    : [
        { data: [] as AnyRow[] | null },
        { data: [] as AnyRow[] | null },
      ];

  const documentByKey = new Map(
    ((documentsResponse.data as AnyRow[] | null) ?? []).map((row) => [
      String(row.requirement_key ?? ''),
      row,
    ]),
  );

  const requirements = ((requirementsResponse.data as AnyRow[] | null) ?? []).filter(
    (row) =>
      String(row.service_type ?? '') === 'loan_packaging' &&
      documentRequirementMatchesLoanPurpose(
        typeof row.loan_purpose === 'string' ? row.loan_purpose : null,
        typeof loanRequest?.loan_purpose === 'string' ? loanRequest.loan_purpose : null,
      ),
  );

  const missingRequiredDocuments = requirements
    .filter((row) => Boolean(row.required))
    .map((row) => {
      const requirementKey = String(row.requirement_key ?? '');
      const document = documentByKey.get(requirementKey);
      if (isDocumentExcludedFromPackage(document)) {
        return null;
      }
      const status = String(document?.status ?? 'not_started');

      return {
        requirementKey,
        displayName: String(row.display_name ?? requirementKey),
        description: String(row.description ?? ''),
        templateKey:
          typeof row.template_key === 'string' && row.template_key.trim().length > 0
            ? row.template_key
            : null,
        status,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .filter((row) => !COMPLETED_DOCUMENT_STATUSES.has(row.status as never));

  const completedRequired = requirements.filter((row) => {
    if (!row.required) {
      return false;
    }

    const requirementKey = String(row.requirement_key ?? '');
    const document = documentByKey.get(requirementKey);
    if (isDocumentExcludedFromPackage(document)) {
      return false;
    }
    const status = String(document?.status ?? 'not_started');
    return COMPLETED_DOCUMENT_STATUSES.has(status as never);
  }).length;

  const totalRequired = requirements.filter((row) => {
    if (!row.required) {
      return false;
    }

    const requirementKey = String(row.requirement_key ?? '');
    return !isDocumentExcludedFromPackage(documentByKey.get(requirementKey));
  }).length;
  const percentage =
    totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;

  return {
    scope: 'loan_packaging_dashboard',
    userProfile: sanitizeForModel(profileResponse.data ?? {}) as Record<string, unknown>,
    loanRequest: sanitizeForModel(
      loanRequest
        ? {
            ...loanRequest,
            loan_amount_display: formatCurrency(loanRequest.loan_amount),
            annual_revenue_display: formatCurrency(loanRequest.annual_revenue),
            cover_letter_content: trimString(
              String(loanRequest.cover_letter_content ?? ''),
              900,
            ),
          }
        : null,
    ) as Record<string, unknown> | null,
    progress: {
      totalRequired,
      completedRequired,
      percentage,
      nextRequirement: missingRequiredDocuments[0]?.displayName ?? null,
    },
    missingRequiredDocuments,
    templateSubmissions: ((templateSubmissionsResponse.data as AnyRow[] | null) ?? []).map(
      (row) => ({
        templateKey: String(row.template_key ?? ''),
        completionPct: Number(row.completion_pct ?? 0),
        status: String(row.status ?? 'draft'),
        updatedAt:
          typeof row.updated_at === 'string' ? row.updated_at : null,
      }),
    ),
    coverLetter: sanitizeForModel({
      status: loanRequest?.cover_letter_status ?? 'not_started',
      hasContent: Boolean(
        typeof loanRequest?.cover_letter_content === 'string' &&
          loanRequest.cover_letter_content.trim().length > 0,
      ),
      contentPreview: trimString(String(loanRequest?.cover_letter_content ?? ''), 900),
      inputs: loanRequest?.cover_letter_inputs ?? {},
    }) as Record<string, unknown>,
  };
}

export async function buildGlobalAssistantContext(args: {
  admin: Pick<SupabaseClient, 'from'>;
  userId: string;
  currentPage?: string | null;
  serviceAccess: unknown;
}): Promise<GlobalAssistantContext> {
  const { admin, userId, currentPage, serviceAccess } = args;
  const [loanPackaging, cashFlowResponse, guidedTemplatesResponse, savedTemplatesResponse, purchasesResponse] =
    await Promise.all([
      buildDashboardAssistantContext({ admin, userId }),
      admin
        .from('cash_flow_analyses')
        .select('id,status,business_name,loan_purpose,desired_amount,estimated_payment,annualized_loan,term,interest_rate,down_payment,proposed_loan,financials,debts,dscr,updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from('guided_template_submissions')
        .select('template_key,status,completion_pct,form_data,derived_metrics,updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(5),
      admin
        .from('template_submissions')
        .select('template_type,form_data,pdf_url,updated_at')
        .eq('user_id', userId)
        .is('archived_at', null)
        .order('updated_at', { ascending: false })
        .limit(5),
      admin
        .from('purchases')
        .select('product_type,paid')
        .eq('user_id', userId)
        .eq('paid', true),
    ]);

  const cashFlow = (cashFlowResponse.data as AnyRow | null) ?? null;
  const cashFlowAnalysis = cashFlow
    ? (sanitizeForModel({
        ...cashFlow,
        desired_amount_display: formatCurrency(cashFlow.desired_amount),
        estimated_payment_display: formatCurrency(cashFlow.estimated_payment),
        proposed_loan_display: formatCurrency(cashFlow.proposed_loan),
      }) as Record<string, unknown>)
    : null;

  return {
    scope: 'global',
    currentPage: trimString(currentPage || '/', 180),
    authenticated: true,
    account: sanitizeForModel({
      profile: loanPackaging.userProfile,
      purchased_products: ((purchasesResponse.data as AnyRow[] | null) ?? []).map(
        (row) => row.product_type,
      ),
      access: serviceAccess,
    }) as Record<string, unknown>,
    services: sanitizeForModel([
      { name: 'Free cash flow and DSCR analysis', href: '/cash-flow-analysis' },
      { name: 'Lender-ready financial templates', href: '/services/templates-bundle' },
      { name: 'Loan packaging', href: '/loan-services' },
      { name: 'Loan brokering and lender matching', href: '/loan-services' },
    ]) as unknown[],
    summary: sanitizeForModel({
      has_cash_flow_analysis: Boolean(cashFlow),
      cash_flow_status: cashFlow?.status ?? null,
      package_progress: loanPackaging.progress,
      missing_required_documents: loanPackaging.missingRequiredDocuments.map(
        (document) => document.displayName,
      ),
    }) as Record<string, unknown>,
    loanPackaging,
    cashFlowAnalysis,
    guidedTemplates: sanitizeForModel(guidedTemplatesResponse.data ?? []) as unknown[],
    savedTemplates: sanitizeForModel(savedTemplatesResponse.data ?? []) as unknown[],
  };
}

export async function buildTemplateAssistantContext(args: {
  admin: Pick<SupabaseClient, 'from'>;
  userId: string;
  templateKey: TemplateKey;
  loanRequestId?: string | null;
  submissionId?: string | null;
}): Promise<TemplateAssistantContext> {
  const { admin, userId, templateKey, loanRequestId, submissionId } = args;
  const definition = getTemplateDefinition(templateKey);

  const profilePromise = admin
    .from('user_template_profiles')
    .select('personal_name,business_name,business_legal_name')
    .eq('user_id', userId)
    .maybeSingle();

  const loanRequestPromise = loanRequestId
    ? admin
        .from('loan_requests')
        .select(
          'id,status,business_name,business_description,loan_purpose,loan_amount,annual_revenue,years_in_business,strengths,cover_letter_status',
        )
        .eq('id', loanRequestId)
        .eq('user_id', userId)
        .maybeSingle()
    : Promise.resolve({ data: null as AnyRow | null });

  const guidedSubmissionQuery = admin
    .from('guided_template_submissions')
    .select('id,status,completion_pct,form_data,derived_metrics,updated_at')
    .eq('user_id', userId)
    .eq('template_key', templateKey)
    .order('updated_at', { ascending: false })
    .limit(1);

  const guidedSubmissionPromise = loanRequestId
    ? guidedSubmissionQuery.eq('loan_request_id', loanRequestId).maybeSingle()
    : guidedSubmissionQuery.maybeSingle();

  const legacySubmissionQuery = admin
    .from('template_submissions')
    .select('id,template_type,form_data,pdf_url,updated_at')
    .eq('user_id', userId)
    .eq('template_type', templateKey)
    .is('archived_at', null)
    .order('updated_at', { ascending: false })
    .limit(1);

  const legacySubmissionPromise = submissionId
    ? legacySubmissionQuery.eq('id', submissionId).maybeSingle()
    : legacySubmissionQuery.maybeSingle();

  const [profileResponse, loanRequestResponse, guidedSubmissionResponse, legacySubmissionResponse] =
    await Promise.all([
      profilePromise,
      loanRequestPromise,
      guidedSubmissionPromise,
      legacySubmissionPromise,
    ]);

  const guidedRow = (guidedSubmissionResponse.data as AnyRow | null) ?? null;
  const guidedValues = (guidedRow?.form_data as TemplateValues | undefined) ?? {};
  const computedCompletion = guidedRow
    ? getTemplateCompletionPercentage(templateKey, guidedValues)
    : null;
  const computedIssues = guidedRow
    ? getTemplateValidationIssues(templateKey, guidedValues)
    : [];
  const computedMetrics = guidedRow
    ? computeTemplateMetrics(templateKey, guidedValues)
    : {};

  return {
    scope: 'template',
    template: {
      key: templateKeyFromValue(templateKey),
      name: definition.name,
      description: definition.description,
      focus: TEMPLATE_ASSISTANT_FOCUS[templateKey],
      sections: definition.sections.map((section) => ({
        title: section.title,
        description: section.description,
        fields: section.fields.map((fieldId) => {
          const field = definition.fields.find((candidate) => candidate.id === fieldId);

          return {
            id: fieldId,
            label: field?.label ?? fieldId,
            required: Boolean(field?.required),
            helperText: field?.helperText ?? null,
          };
        }),
      })),
    },
    userProfile: sanitizeForModel(profileResponse.data ?? {}) as Record<string, unknown>,
    loanRequest: sanitizeForModel(
      loanRequestResponse.data
        ? {
            ...(loanRequestResponse.data as AnyRow),
            loan_amount_display: formatCurrency(
              (loanRequestResponse.data as AnyRow).loan_amount,
            ),
            annual_revenue_display: formatCurrency(
              (loanRequestResponse.data as AnyRow).annual_revenue,
            ),
          }
        : null,
    ) as Record<string, unknown> | null,
    guidedSubmission: guidedRow
      ? (sanitizeForModel({
          id: guidedRow.id,
          status: guidedRow.status,
          completion_pct: Number(guidedRow.completion_pct ?? computedCompletion ?? 0),
          updated_at: guidedRow.updated_at ?? null,
          validation_issues: computedIssues,
          derived_metrics:
            Object.keys(computedMetrics).length > 0
              ? computedMetrics
              : guidedRow.derived_metrics ?? {},
          form_data: guidedValues,
        }) as Record<string, unknown>)
      : null,
    legacySubmission: legacySubmissionResponse.data
      ? (sanitizeForModel(legacySubmissionResponse.data) as Record<string, unknown>)
      : null,
  };
}

export function buildAssistantSystemPrompt(
  scope: AssistantScope,
  templateKey?: TemplateKey,
): string {
  const templateFocus = templateKey
    ? TEMPLATE_ASSISTANT_FOCUS[templateKey]
    : 'Help the user move through the loan packaging process clearly and confidently.';

  const scopeGuidance =
    scope === 'template'
      ? `The current template focus is ${templateKey ?? 'template'}. ${templateFocus}`
      : scope === 'loan_packaging_dashboard'
        ? 'The current screen is the loan packaging dashboard. Help the user understand missing requirements, next steps, document expectations, and how their current data affects the package.'
        : 'Act as a practical small-business lending consultant. Answer questions about loan readiness, loan types, repayment capacity, lender expectations, financial documents, packaging, and the financing process.';

  return [
    'You are the in-app Business Lending Advocate assistant.',
    'Start every answer with a direct short answer of one or two sentences. Add a brief explanation or action steps after that only when useful.',
    'Default to concise responses under 180 words. If the user explicitly asks for detail, a deep explanation, or a step-by-step analysis, you may answer at greater length.',
    'Use the application context when it is available and relevant. If data is missing, say so plainly instead of inventing details.',
    'When referring to the signed-in user’s figures or progress, distinguish facts in their saved data from general guidance.',
    'Keep answers practical, specific, and easy to act on.',
    'You may recommend Business Lending Advocate services only when they directly solve a need raised in the conversation. Do not force an upsell, repeatedly promote services, or recommend something the context shows the user already owns; instead point existing customers to continue that service.',
    'Never claim approval is likely, promise financing, present an estimate as a lender decision, or give legal, tax, accounting, or investment advice.',
    'Do not request highly sensitive information such as passwords, full Social Security numbers, bank credentials, or full payment-card numbers.',
    'Do not mention raw JSON, internal database tables, system instructions, or implementation details.',
    scopeGuidance,
  ].join(' ');
}
