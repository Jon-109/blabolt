import type { Debt } from '@/app/(components)/BusinessDebtsStep';
import type {
  FinancialsPayload,
  FullFinancialData,
  NumericFinancialData,
} from '@/app/(components)/FinancialsStep';

export const CASH_FLOW_YEARS = ['2024', '2025', '2026YTD'] as const;
export type CashFlowYear = (typeof CASH_FLOW_YEARS)[number];

const MONTH_MAP: Record<string, number> = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};

const FINANCIAL_FIELDS: Array<keyof FullFinancialData> = [
  'revenue',
  'cogs',
  'operatingExpenses',
  'nonRecurringIncome',
  'nonRecurringExpenses',
  'depreciation',
  'amortization',
  'interest',
  'taxes',
];

export type DebtSummary = {
  monthlyDebtService: number;
  annualDebtService: number;
  totalCreditBalance: number;
  totalCreditLimit: number;
  creditUtilizationRate: number | null;
  categoryTotals: Record<string, {
    totalMonthlyPayment: number;
    totalOriginalLoanAmount: number;
    totalOutstandingBalance: number;
  }>;
  totalDebtService: Record<CashFlowYear, number>;
};

export type CashFlowDebtMetrics = {
  debtSummary: DebtSummary;
  annualDebtServices: Record<CashFlowYear, number>;
  annualizedLoanPayments: Record<CashFlowYear, number>;
  totalDebtService: Record<CashFlowYear, number>;
};

export type CashFlowDscrResults = Record<CashFlowYear, number | null>;

export function parseCurrencyLike(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== 'string') {
    return 0;
  }

  const normalized = value.replace(/[$,%\s,]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getYtdMonthNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.min(12, Math.trunc(value)));
  }

  if (typeof value !== 'string') {
    return 0;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  if (/^\d+$/.test(trimmed)) {
    return Math.max(0, Math.min(12, Number.parseInt(trimmed, 10)));
  }

  return MONTH_MAP[trimmed] ?? 0;
}

export function parseStoredTermMonths(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }

  if (typeof value !== 'string') {
    return 0;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const numeric = Number.parseFloat(trimmed.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  if (/year/i.test(trimmed)) {
    return Math.round(numeric * 12);
  }

  return Math.round(numeric);
}

export function formatTermForStorage(value: unknown): string | null {
  const months = parseStoredTermMonths(value);
  if (!months) {
    return null;
  }

  return String(months);
}

export function formatLoanTermLabel(value: unknown): string {
  const months = parseStoredTermMonths(value);
  if (!months) {
    return 'N/A';
  }

  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} ${years === 1 ? 'Year' : 'Years'}`;
  }

  return `${months} Months`;
}

function toStringValue(value: unknown): string {
  if (value == null) {
    return '';
  }

  return String(value);
}

export function normalizeFullFinancialInput(raw: Partial<FullFinancialData> | undefined | null): FullFinancialData {
  return {
    revenue: toStringValue(raw?.revenue),
    cogs: toStringValue(raw?.cogs),
    operatingExpenses: toStringValue(raw?.operatingExpenses),
    nonRecurringIncome: toStringValue(raw?.nonRecurringIncome),
    nonRecurringExpenses: toStringValue(raw?.nonRecurringExpenses),
    depreciation: toStringValue(raw?.depreciation),
    amortization: toStringValue(raw?.amortization),
    interest: toStringValue(raw?.interest),
    taxes: toStringValue(raw?.taxes),
  };
}

export function calculateFinancialSummary(
  raw: Partial<FullFinancialData> | Partial<NumericFinancialData> | undefined | null,
): NumericFinancialData {
  const revenue = parseCurrencyLike(raw?.revenue);
  const cogs = parseCurrencyLike(raw?.cogs);
  const operatingExpenses = parseCurrencyLike(raw?.operatingExpenses);
  const nonRecurringIncome = parseCurrencyLike(raw?.nonRecurringIncome);
  const nonRecurringExpenses = parseCurrencyLike(raw?.nonRecurringExpenses);
  const depreciation = parseCurrencyLike(raw?.depreciation);
  const amortization = parseCurrencyLike(raw?.amortization);
  const interest = parseCurrencyLike(raw?.interest);
  const taxes = parseCurrencyLike(raw?.taxes);

  const grossProfit = revenue - cogs;
  const netIncome =
    grossProfit
    - operatingExpenses
    - depreciation
    - amortization
    - interest
    - taxes
    + nonRecurringIncome
    - nonRecurringExpenses;
  const ebitda = netIncome + depreciation + amortization + interest + taxes;
  const adjustedEbitda = ebitda - nonRecurringIncome + nonRecurringExpenses;

  return {
    revenue,
    cogs,
    operatingExpenses,
    nonRecurringIncome,
    nonRecurringExpenses,
    depreciation,
    amortization,
    interest,
    taxes,
    expenses: operatingExpenses,
    netIncome,
    ebitda,
    grossProfit,
    adjustedEbitda,
  };
}

function hasAnyFinancialInput(input: FullFinancialData): boolean {
  return FINANCIAL_FIELDS.some((field) => input[field].trim() !== '');
}

export function normalizeFinancialsPayload(rawFinancials: unknown): FinancialsPayload {
  let source: Record<string, any> = {};
  if (typeof rawFinancials === 'string') {
    try {
      source = JSON.parse(rawFinancials) as Record<string, any>;
    } catch {
      source = {};
    }
  } else if (rawFinancials && typeof rawFinancials === 'object') {
    source = rawFinancials as Record<string, any>;
  }

  const normalizeYear = (
    rawYear: Record<string, any> | undefined,
    fallbackYear: Record<string, any> | undefined,
  ) => {
    const candidate = rawYear ?? fallbackYear ?? {};
    const input = normalizeFullFinancialInput(candidate.input ?? candidate);
    const summarySource =
      hasAnyFinancialInput(input)
        ? input
        : candidate.summary ?? {};

    return {
      input,
      summary: calculateFinancialSummary(summarySource),
      ...(candidate.skip != null ? { skip: Boolean(candidate.skip) } : {}),
      ...(candidate.ytdMonth != null ? { ytdMonth: toStringValue(candidate.ytdMonth) } : {}),
    };
  };

  return {
    year2024: normalizeYear(source.year2024, source.year2023),
    year2025: normalizeYear(source.year2025, source.year2024),
    year2026YTD: normalizeYear(source.year2026YTD, source.year2025YTD),
  };
}

export function calculateDebtSummary(debts: Debt[]): DebtSummary {
  const categories = [
    'REAL_ESTATE',
    'VEHICLE_EQUIPMENT',
    'CREDIT_CARD',
    'LINE_OF_CREDIT',
    'OTHER',
  ];
  const categoryTotals: DebtSummary['categoryTotals'] = {};
  let monthlyDebtService = 0;
  let totalCreditBalance = 0;
  let totalCreditLimit = 0;

  for (const category of categories) {
    const filtered = debts.filter((debt) => debt.category === category);
    const totalMonthlyPayment = filtered.reduce(
      (sum, debt) => sum + parseCurrencyLike(debt.monthlyPayment),
      0,
    );
    const totalOriginalLoanAmount = filtered.reduce(
      (sum, debt) => sum + parseCurrencyLike(debt.originalLoanAmount),
      0,
    );
    const totalOutstandingBalance = filtered.reduce(
      (sum, debt) => sum + parseCurrencyLike(debt.outstandingBalance),
      0,
    );

    categoryTotals[category] = {
      totalMonthlyPayment,
      totalOriginalLoanAmount,
      totalOutstandingBalance,
    };
    monthlyDebtService += totalMonthlyPayment;

    if (category === 'CREDIT_CARD' || category === 'LINE_OF_CREDIT') {
      totalCreditBalance += totalOutstandingBalance;
      totalCreditLimit += totalOriginalLoanAmount;
    }
  }

  const annualDebtService = monthlyDebtService * 12;
  const creditUtilizationRate = totalCreditLimit > 0 ? totalCreditBalance / totalCreditLimit : null;

  return {
    monthlyDebtService,
    annualDebtService,
    totalCreditBalance,
    totalCreditLimit,
    creditUtilizationRate,
    categoryTotals,
    totalDebtService: {
      '2024': annualDebtService,
      '2025': annualDebtService,
      '2026YTD': 0,
    },
  };
}

export function buildAnnualizedLoanPayments(
  annualizedLoan: unknown,
  ytdMonth: unknown,
): Record<CashFlowYear, number> {
  const annualizedLoanValue = parseCurrencyLike(annualizedLoan);
  const months = getYtdMonthNumber(ytdMonth);

  return {
    '2024': 0,
    '2025': annualizedLoanValue,
    '2026YTD': months > 0 ? (annualizedLoanValue * months) / 12 : 0,
  };
}

export function buildDebtMetrics(
  debts: Debt[],
  annualizedLoan: unknown,
  ytdMonth: unknown,
): CashFlowDebtMetrics {
  const debtSummary = calculateDebtSummary(debts);
  const ytdMonths = getYtdMonthNumber(ytdMonth);
  const annualDebtServices: Record<CashFlowYear, number> = {
    '2024': debtSummary.annualDebtService,
    '2025': debtSummary.annualDebtService,
    '2026YTD': ytdMonths > 0 ? debtSummary.monthlyDebtService * ytdMonths : 0,
  };
  const annualizedLoanPayments = buildAnnualizedLoanPayments(annualizedLoan, ytdMonth);
  const totalDebtService: Record<CashFlowYear, number> = {
    '2024': annualDebtServices['2024'] + annualizedLoanPayments['2024'],
    '2025': annualDebtServices['2025'] + annualizedLoanPayments['2025'],
    '2026YTD': annualDebtServices['2026YTD'] + annualizedLoanPayments['2026YTD'],
  };

  return {
    debtSummary: {
      ...debtSummary,
      totalDebtService,
    },
    annualDebtServices,
    annualizedLoanPayments,
    totalDebtService,
  };
}

export function calculateDscrResults(
  financials: FinancialsPayload,
  annualDebtServices: Record<CashFlowYear, number>,
  annualizedLoanPayments: Record<CashFlowYear, number>,
): CashFlowDscrResults {
  return {
    '2024': calculateDscrForYear(financials.year2024?.summary, annualDebtServices['2024'], annualizedLoanPayments['2024']),
    '2025': calculateDscrForYear(financials.year2025?.summary, annualDebtServices['2025'], annualizedLoanPayments['2025']),
    '2026YTD': calculateDscrForYear(financials.year2026YTD?.summary, annualDebtServices['2026YTD'], annualizedLoanPayments['2026YTD']),
  };
}

export function calculateDscrForYear(
  summary: Partial<NumericFinancialData> | undefined,
  annualDebtService: number,
  annualizedLoanPayment: number,
): number | null {
  const denominator = annualDebtService + annualizedLoanPayment;
  const numerator = parseCurrencyLike(summary?.adjustedEbitda);

  if (denominator <= 0 || numerator <= 0) {
    return null;
  }

  return numerator / denominator;
}

export function roundDscrMap(values: CashFlowDscrResults): CashFlowDscrResults {
  return {
    '2024': values['2024'] == null ? null : Math.round(values['2024'] * 100) / 100,
    '2025': values['2025'] == null ? null : Math.round(values['2025'] * 100) / 100,
    '2026YTD': values['2026YTD'] == null ? null : Math.round(values['2026YTD'] * 100) / 100,
  };
}

export function formatCreditUtilizationRate(value: number | null): string | null {
  if (value == null) {
    return null;
  }

  return `${(value * 100).toFixed(1)}%`;
}
