import {
  COMPLETED_DOCUMENT_STATUSES,
  TEMPLATE_KEYS,
  type TemplateKey,
} from '@/lib/loan-packaging/constants';
import {
  computeTemplateMetrics,
  getTemplateCompletionPercentage,
  getTemplateDefinition,
  getTemplateValidationIssues,
  type TemplateValues,
} from '@/lib/loan-packaging/template-engine';

type AnyRow = Record<string, unknown>;

export type AssistantScope = 'loan_packaging_dashboard' | 'template';

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
  admin: {
    from: (table: string) => {
      select: (columns: string) => any;
    };
  };
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
      .select('requirement_key,display_name,description,required,template_key,service_type')
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
          .select('requirement_key,status,updated_at')
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
    (row) => String(row.service_type ?? '') === 'loan_packaging',
  );

  const missingRequiredDocuments = requirements
    .filter((row) => Boolean(row.required))
    .map((row) => {
      const requirementKey = String(row.requirement_key ?? '');
      const document = documentByKey.get(requirementKey);
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
    .filter((row) => !COMPLETED_DOCUMENT_STATUSES.has(row.status as never));

  const completedRequired = requirements.filter((row) => {
    if (!row.required) {
      return false;
    }

    const requirementKey = String(row.requirement_key ?? '');
    const status = String(documentByKey.get(requirementKey)?.status ?? 'not_started');
    return COMPLETED_DOCUMENT_STATUSES.has(status as never);
  }).length;

  const totalRequired = requirements.filter((row) => Boolean(row.required)).length;
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

export async function buildTemplateAssistantContext(args: {
  admin: {
    from: (table: string) => {
      select: (columns: string) => any;
    };
  };
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

  return [
    'You are the in-app Business Lending Advocate assistant.',
    'Your job is to guide the user through loan packaging, template completion, and cover-letter preparation using the application context provided to you.',
    'Use the user context when it is available. If data is missing, say so plainly instead of inventing details.',
    'Keep answers practical, specific, and easy to act on.',
    'Do not give legal advice, tax advice, or guarantee financing outcomes.',
    'Do not mention raw JSON, internal database tables, or implementation details unless the user directly asks.',
    scope === 'template'
      ? `The current template focus is ${templateKey ?? 'template'}. ${templateFocus}`
      : 'The current screen is the loan packaging dashboard. Help the user understand missing requirements, next steps, document expectations, and how their current data affects the package.',
  ].join(' ');
}
