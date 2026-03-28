import {
  formatCreditUtilizationRate,
  normalizeFinancialsPayload,
  parseStoredTermMonths,
} from '@/lib/financial/calculations';

// Utility to parse currency/number fields
function parseCurrency(value: string | number | undefined | null): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  return parseFloat(value.replace(/[$,]/g, '')) || 0;
}

function normalizeDscr(dscr: any) {
  if (!dscr || typeof dscr !== 'object') return {};

  return {
    '2024': dscr['2024'] ?? dscr.dscr2023 ?? null,
    '2025': dscr['2025'] ?? dscr.dscr2024 ?? null,
    '2026YTD': dscr['2026YTD'] ?? dscr.dscr2025 ?? null,
  };
}

function normalizeDebtSummary(debts: any) {
  if (!debts || typeof debts !== 'object' || Array.isArray(debts)) return debts;

  const mapYearObject = (value: any) => {
    if (!value || typeof value !== 'object') return value;

    return {
      '2024': value['2024'] ?? value['2023'] ?? 0,
      '2025': value['2025'] ?? value['2024'] ?? 0,
      '2026YTD': value['2026YTD'] ?? value['2025YTD'] ?? 0,
    };
  };

  return {
    ...debts,
    annualDebtService: mapYearObject(debts.annualDebtService),
    annualDebtServices: mapYearObject(debts.annualDebtServices),
    totalDebtService: mapYearObject(debts.totalDebtService),
    annualizedLoanPayments: mapYearObject(debts.annualizedLoanPayments),
  };
}

export async function getCashFlowAnalysisById(analysisId: string, supabase: any) {
  // Use the provided Supabase client (already authenticated with user's token)
  const { data, error } = await supabase
    .from('cash_flow_analyses')
    .select('*')
    .eq('id', analysisId)
    .single();

  if (error) {
    console.error(`[getCashFlowAnalysisById] Supabase query error for ID ${analysisId}:`, error.message, error.details, error.hint);
  }
  if (!data) {
    console.warn(`[getCashFlowAnalysisById] No data returned from Supabase for ID ${analysisId}.`);
  }

  if (error || !data) return null;

  // --- Reconstruct LoanInfo ---
  const loanInfo = {
    businessName: data.business_name || '',
    loanPurpose: data.loan_purpose || '',
    desiredAmount: parseCurrency(data.desired_amount),
    estimatedPayment: parseCurrency(data.estimated_payment),
    annualizedLoan: parseCurrency((data as any).annualized_loan),
    loanTerm: parseStoredTermMonths((data as any).term),
    interestRate: (typeof (data as any).interest_rate === 'number' ? (data as any).interest_rate : parseFloat(String((data as any).interest_rate || '0'))) / 100,
    downPaymentPercent: parseFloat(String((data as any).down_payment293 || '0')),
    downPaymentAmount: parseCurrency((data as any).down_payment),
    proposedLoanAmount: parseCurrency((data as any).proposed_loan ?? (data as any).desired_amount)
  };  

  // --- Transform Financials ---
  const normalizedFinancials = normalizeFinancialsPayload(data.financials);
  const years: Record<string, any> = {};
  for (const [key, val] of Object.entries(normalizedFinancials)) {
    const yearKey = key.replace('year', '');
    years[yearKey] = val;
  }
  const financials = years;

  // --- DSCR ---
  const dscr = normalizeDscr(data.dscr);

  // --- Debts ---
  // debts may be stored as { entries: Debt[] } or as Debt[]
  let debts = null;
  if (
    data.debts &&
    typeof data.debts === 'object' &&
    !Array.isArray(data.debts) &&
    'entries' in data.debts &&
    Array.isArray((data.debts as any).entries)
  ) {
    debts = {
      ...(data.debts as any),
      creditUtilizationRate:
        typeof (data.debts as any).creditUtilizationRate === 'number'
          ? formatCreditUtilizationRate((data.debts as any).creditUtilizationRate)
          : (data.debts as any).creditUtilizationRate,
    };
  } else if (Array.isArray(data.debts)) {
    debts = data.debts;
  } else if (data.debts) {
    debts = normalizeDebtSummary(data.debts);
  }

  // --- Debt Summary (optional, for summary page) ---
  const debtSummary = (data as any).debt_summary || null;

  return {
    loanInfo,
    financials,
    dscr,
    debts,
    debtSummary,
  };
}
