import { type FinancialsPayload, type FullFinancialData } from '@/app/(components)/FinancialsStep';
import {
  COMPLETED_DOCUMENT_STATUSES,
  documentRequirementMatchesLoanPurpose,
} from '@/lib/loan-packaging/constants';
import { isTemplateType } from '@/lib/stripe/catalog';
import type { TemplateType } from '@/lib/templates/types';

export type AnyRow = Record<string, unknown>;

export type CashFlowYearKey = '2024' | '2025' | '2026YTD';
export type ClientServiceKey =
  | 'loan_packaging'
  | 'loan_brokering'
  | 'comprehensive_cash_flow_analysis';

export type ClientServicePill = {
  key: ClientServiceKey;
  label: string;
};

export type DscrSnapshot = {
  values: Record<CashFlowYearKey, number | null>;
  currentValue: number | null;
  currentYear: CashFlowYearKey | null;
};

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

export const TEMPLATE_ORDER = [
  'personal_debt_summary',
  'personal_financial_statement',
  'business_debt_summary',
  'balance_sheet',
  'income_statement',
] as const;

export const CASH_FLOW_FIELD_LABELS: Record<keyof FullFinancialData, string> = {
  revenue: 'Revenue',
  cogs: 'COGS',
  operatingExpenses: 'Operating Expenses',
  nonRecurringIncome: 'Non-Recurring Income',
  nonRecurringExpenses: 'Non-Recurring Expenses',
  depreciation: 'Depreciation',
  amortization: 'Amortization',
  interest: 'Interest Expense',
  taxes: 'Income Taxes',
};

export const EMPTY_FINANCIAL_INPUT: FullFinancialData = {
  revenue: '',
  cogs: '',
  operatingExpenses: '',
  nonRecurringIncome: '',
  nonRecurringExpenses: '',
  depreciation: '',
  amortization: '',
  interest: '',
  taxes: '',
};

export function hasMeaningfulFormData(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  return Object.keys(value as Record<string, unknown>).length > 0;
}

export function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const normalized = Number(value.replace(/[$,%\s,]/g, '').trim());
    return Number.isFinite(normalized) ? normalized : null;
  }

  return null;
}

export function formatRequirementDisplayName(requirementKey: string, fallback?: string | null): string {
  const nowYear = new Date().getFullYear();

  if (requirementKey === 'business_tax_return_year_1') return `Business Tax Return (${nowYear - 1})`;
  if (requirementKey === 'business_tax_return_year_2') return `Business Tax Return (${nowYear - 2})`;
  if (requirementKey === 'personal_tax_return_year_1') return `Personal Tax Return (${nowYear - 1})`;
  if (requirementKey === 'personal_tax_return_year_2') return `Personal Tax Return (${nowYear - 2})`;
  if (requirementKey === 'income_statement_annual_year_1') return `Income Statement (${nowYear - 1} Annual)`;
  if (requirementKey === 'income_statement_annual_year_2') return `Income Statement (${nowYear - 2} Annual)`;
  if (requirementKey === 'income_statement_ytd') return `Income Statement (${nowYear} YTD)`;

  return fallback || requirementKey.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function filterApplicableRequirements(
  requirements: AnyRow[],
  serviceType: string | null | undefined,
  loanPurpose: string | null | undefined,
): AnyRow[] {
  return requirements.filter((requirement) => {
    if (String(requirement.service_type ?? '') !== String(serviceType ?? 'loan_packaging')) {
      return false;
    }

    if (requirement.is_active === false) {
      return false;
    }

    return documentRequirementMatchesLoanPurpose(
      typeof requirement.loan_purpose === 'string' ? requirement.loan_purpose : null,
      typeof loanPurpose === 'string' ? loanPurpose : null,
    );
  });
}

export function sortRequirementsByPriority(requirements: AnyRow[]): AnyRow[] {
  return [...requirements].sort((left, right) => {
    const leftKey = String(left.requirement_key ?? '');
    const rightKey = String(right.requirement_key ?? '');
    const leftPriority = REQUIREMENT_PRIORITY[leftKey] ?? Number(left.sort_order ?? Number.MAX_SAFE_INTEGER);
    const rightPriority = REQUIREMENT_PRIORITY[rightKey] ?? Number(right.sort_order ?? Number.MAX_SAFE_INTEGER);

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return formatRequirementDisplayName(leftKey, String(left.display_name ?? ''))
      .localeCompare(formatRequirementDisplayName(rightKey, String(right.display_name ?? '')));
  });
}

export function buildPackagingProgress(requirements: AnyRow[], documents: AnyRow[]) {
  const requiredRequirements = sortRequirementsByPriority(
    requirements.filter((requirement) => Boolean(requirement.required)),
  );
  const documentByRequirement = new Map(
    documents.map((document) => [String(document.requirement_key ?? ''), document]),
  );

  const completedRequired = requiredRequirements.filter((requirement) => {
    const document = documentByRequirement.get(String(requirement.requirement_key ?? ''));
    return document && COMPLETED_DOCUMENT_STATUSES.has(String(document.status ?? 'not_started') as never);
  }).length;

  const totalRequired = requiredRequirements.length;
  const percentage = totalRequired > 0
    ? Math.round((completedRequired / totalRequired) * 100)
    : 0;

  const nextRequirement = requiredRequirements.find((requirement) => {
    const document = documentByRequirement.get(String(requirement.requirement_key ?? ''));
    return !(document && COMPLETED_DOCUMENT_STATUSES.has(String(document.status ?? 'not_started') as never));
  });

  return {
    completedRequired,
    totalRequired,
    percentage,
    nextRequirement: nextRequirement
      ? {
          requirementKey: String(nextRequirement.requirement_key ?? ''),
          displayName: formatRequirementDisplayName(
            String(nextRequirement.requirement_key ?? ''),
            typeof nextRequirement.display_name === 'string' ? nextRequirement.display_name : null,
          ),
          description: String(nextRequirement.description ?? ''),
        }
      : null,
  };
}

export function computeTemplateProgress(templateRows: AnyRow[]): { progressPct: number; nextStep: string } {
  const activeRows = templateRows.filter((row) => !row.archived_at);

  if (!activeRows.length) {
    return { progressPct: 0, nextStep: 'Start Personal Debt Summary' };
  }

  const byType = new Map<string, AnyRow>();
  for (const row of activeRows) {
    const type = String(row.template_type ?? '');
    if (!type || byType.has(type)) continue;
    byType.set(type, row);
  }

  let completed = 0;
  for (const type of TEMPLATE_ORDER) {
    const row = byType.get(type);
    const done = Boolean(row?.pdf_url) || hasMeaningfulFormData(row?.form_data);
    if (done) completed += 1;
  }

  const progressPct = Math.round((completed / TEMPLATE_ORDER.length) * 100);

  for (const type of TEMPLATE_ORDER) {
    const row = byType.get(type);
    const done = Boolean(row?.pdf_url) || hasMeaningfulFormData(row?.form_data);
    if (!done) {
      const label = type.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
      return { progressPct, nextStep: `Complete ${label}` };
    }
  }

  return { progressPct: 100, nextStep: 'Templates Completed' };
}

export function getGrantedTemplateTypes(accountRow: AnyRow | null | undefined): TemplateType[] {
  const source = accountRow?.granted_template_types;
  if (!Array.isArray(source)) {
    return [];
  }

  return source.filter((value): value is TemplateType => typeof value === 'string' && isTemplateType(value));
}

export function deriveAccessFlags(
  accountRow: AnyRow | null | undefined,
  latestLoanRequest: AnyRow | null | undefined,
  purchaseTypes: Set<string>,
  hasSignedBrokerAgreement: boolean,
) {
  const serviceLevel = String(accountRow?.service_level ?? 'none');
  const requestServiceType = String(latestLoanRequest?.service_type ?? '');

  const hasLoanBrokering =
    purchaseTypes.has('loan_brokering') ||
    serviceLevel === 'brokering' ||
    requestServiceType === 'loan_brokering' ||
    hasSignedBrokerAgreement;

  const hasLoanPackaging =
    hasLoanBrokering ||
    purchaseTypes.has('loan_packaging') ||
    serviceLevel === 'packaging' ||
    requestServiceType === 'loan_packaging' ||
    Boolean(accountRow?.access_packaging);

  const hasTemplatePurchase =
    purchaseTypes.has('templates_bundle') ||
    Array.from(purchaseTypes).some((type) => isTemplateType(type));
  const grantedTemplateTypes = getGrantedTemplateTypes(accountRow);

  const hasTemplateAccess =
    hasLoanPackaging ||
    hasLoanBrokering ||
    hasTemplatePurchase ||
    grantedTemplateTypes.length > 0 ||
    serviceLevel === 'templates' ||
    Boolean(accountRow?.access_templates);

  const hasComprehensiveAccess =
    hasLoanPackaging ||
    hasLoanBrokering ||
    purchaseTypes.has('cash_flow_analysis') ||
    serviceLevel === 'comprehensive' ||
    Boolean(accountRow?.access_comprehensive);

  return {
    hasLoanBrokering,
    hasLoanPackaging,
    hasTemplateAccess,
    hasComprehensiveAccess,
  };
}

export function deriveServicePills(args: {
  accountRow?: AnyRow | null;
  latestLoanRequest?: AnyRow | null;
  purchaseTypes?: Set<string>;
  hasSignedBrokerAgreement?: boolean;
}): ClientServicePill[] {
  const purchaseTypes = args.purchaseTypes ?? new Set<string>();
  const serviceLevel = String(args.accountRow?.service_level ?? 'none');
  const requestServiceType = String(args.latestLoanRequest?.service_type ?? '');
  const hasSignedBrokerAgreement = Boolean(args.hasSignedBrokerAgreement);
  const grantedTemplateTypes = getGrantedTemplateTypes(args.accountRow);

  const explicitLoanBrokering =
    purchaseTypes.has('loan_brokering') ||
    serviceLevel === 'brokering' ||
    requestServiceType === 'loan_brokering' ||
    hasSignedBrokerAgreement;

  const explicitLoanPackaging =
    !explicitLoanBrokering &&
    (
      purchaseTypes.has('loan_packaging') ||
      serviceLevel === 'packaging' ||
      requestServiceType === 'loan_packaging' ||
      Boolean(args.accountRow?.access_packaging)
    );

  const explicitComprehensive =
    !explicitLoanPackaging &&
    !explicitLoanBrokering &&
    (
      purchaseTypes.has('cash_flow_analysis') ||
      serviceLevel === 'comprehensive' ||
      Boolean(args.accountRow?.access_comprehensive)
    );

  const pills: ClientServicePill[] = [];

  if (explicitLoanBrokering) {
    pills.push({ key: 'loan_brokering', label: 'Loan Brokering' });
  }

  if (explicitLoanPackaging) {
    pills.push({ key: 'loan_packaging', label: 'Loan Packaging' });
  }

  if (explicitComprehensive) {
    pills.push({ key: 'comprehensive_cash_flow_analysis', label: 'Comprehensive Cash Flow Analysis' });
  }

  return pills;
}

export function derivePrimaryServiceLabel(pills: ClientServicePill[]): string {
  return pills[0]?.label ?? 'No Access';
}

function normalizeDscrYearValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (value && typeof value === 'object') {
    const nested = value as Record<string, unknown>;
    return (
      parseFiniteNumber(nested.dscr) ??
      parseFiniteNumber(nested.value) ??
      null
    );
  }

  return parseFiniteNumber(value);
}

export function normalizeDscrSnapshot(raw: unknown): DscrSnapshot {
  const source = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const values: Record<CashFlowYearKey, number | null> = {
    '2024': normalizeDscrYearValue(source['2024'] ?? source.dscr2024 ?? source['2023']),
    '2025': normalizeDscrYearValue(source['2025'] ?? source.dscr2025 ?? source['2024']),
    '2026YTD': normalizeDscrYearValue(source['2026YTD'] ?? source.dscr2026 ?? source.dscr2025 ?? source['2025YTD']),
  };

  const currentYear = (['2026YTD', '2025', '2024'] as const).find((year) => values[year] != null) ?? null;

  return {
    values,
    currentYear,
    currentValue: currentYear ? values[currentYear] : null,
  };
}

export function createEmptyFinancialPayload(): FinancialsPayload {
  return {
    year2024: { input: { ...EMPTY_FINANCIAL_INPUT }, summary: emptyFinancialSummary() },
    year2025: { input: { ...EMPTY_FINANCIAL_INPUT }, summary: emptyFinancialSummary() },
    year2026YTD: { input: { ...EMPTY_FINANCIAL_INPUT }, summary: emptyFinancialSummary(), ytdMonth: '' },
  };
}

function emptyFinancialSummary() {
  return {
    revenue: 0,
    expenses: 0,
    netIncome: 0,
    ebitda: 0,
    grossProfit: 0,
    interest: 0,
    taxes: 0,
    cogs: 0,
    operatingExpenses: 0,
    depreciation: 0,
    amortization: 0,
    nonRecurringIncome: 0,
    nonRecurringExpenses: 0,
    adjustedEbitda: 0,
  };
}
