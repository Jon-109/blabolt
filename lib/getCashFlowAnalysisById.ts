// Utility to parse currency/number fields
function parseCurrency(value: string | number | undefined | null): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  return parseFloat(value.replace(/[$,]/g, '')) || 0;
}

export async function getCashFlowAnalysisById(analysisId: string, supabase: any) {
  console.log(`[getCashFlowAnalysisById] Fetching analysis for ID: ${analysisId}`);

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

  console.log(`[getCashFlowAnalysisById] Data found for ID ${analysisId}. Processing...`);

  // --- Reconstruct LoanInfo ---
  const loanInfo = {
    businessName: data.business_name || '',
    loanPurpose: data.loan_purpose || '',
    desiredAmount: parseCurrency(data.desired_amount),
    estimatedPayment: parseCurrency(data.estimated_payment),
    annualizedLoan: parseCurrency((data as any).annualized_loan),
    loanTerm: parseInt(String((data as any).term || '0'), 10),
    interestRate: (typeof (data as any).interest_rate === 'number' ? (data as any).interest_rate : parseFloat(String((data as any).interest_rate || '0'))) / 100,
    downPaymentPercent: parseFloat(String((data as any).down_payment293 || '0')),
    downPaymentAmount: parseCurrency((data as any).down_payment),
    proposedLoanAmount: parseCurrency((data as any).proposed_loan ?? (data as any).desired_amount)
  };  

  // --- Transform Financials ---
  const years: Record<string, any> = {};
  if (data.financials) {
    const financialsObj = typeof data.financials === 'string'
      ? JSON.parse(data.financials)
      : data.financials;
    for (const [key, val] of Object.entries(financialsObj)) {
      // key: 'year2023', 'year2024', 'year2025YTD' -> '2023', '2024', '2025YTD'
      const yearKey = key.replace('year', '');
      years[yearKey] = val;
    }
    
  }
  const financials = years;

  // --- DSCR ---
  const dscr = data.dscr || {};

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
    debts = (data.debts as any).entries;
  } else if (Array.isArray(data.debts)) {
    debts = data.debts;
  } else if (data.debts) {
    debts = data.debts;
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
