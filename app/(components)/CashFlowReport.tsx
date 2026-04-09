import React from 'react';
import { InfoIcon } from 'lucide-react';
import { DscrGauge } from '@/app/(components)/cash-flow/DscrQuickCalculator';
import CashFlowBusinessDebtSummaryTemplate from '@/app/(components)/cash-flow/CashFlowBusinessDebtSummaryTemplate';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/app/(components)/ui/tooltip';
import { calculateFinancialSummary, formatLoanTermLabel } from '@/lib/financial/calculations';
import { DSCR_BENCHMARK, getDscrBand } from '@/lib/financial/dscr';

// --- Type Definitions ---

export interface LoanInfo {
  businessName?: string;
  loanPurpose?: string;
  desiredAmount?: number;
  estimatedPayment?: number;
  loanTerm?: number | string;
  interestRate?: number; // Changed to number only to match formatPercentage
  downPaymentPercent?: number; // Assuming it exists, as used later
  downPaymentAmount?: number; // Assuming it exists, as used later
  annualizedLoan?: number; // Assuming it exists, as used later
  proposedLoanAmount?: number; // Assuming it exists, as used later
}

export interface FinancialYearData {
  revenue?: number;
  cogs?: number;
  grossProfit?: number;
  operatingExpenses?: number;
  netIncome?: number; // Renamed from operatingIncome
  nonRecurringIncome?: number;
  nonRecurringExpenses?: number;
  depreciation?: number;
  amortization?: number;
  interestExpense?: number; // Often part of OpEx but sometimes separate
  interest?: number; // Added interest
  taxes?: number; // Added taxes
  ebitda?: number; // Often calculated, but might be input
  adjustedEbitda?: number; // New field
  ytdMonth?: string; // For YTD columns, the month number as a string
}

export interface DebtDetail {
  id?: string; // Unique identifier for the debt entry
  category: string; // e.g., 'REAL_ESTATE', 'CREDIT_CARD'
  lenderName?: string;
  debtType?: string; // e.g., 'Mortgage', 'Visa'
  monthlyPayment?: number | string;
  interestRate?: number; // Changed to number only for arithmetic
  outstandingBalance?: number | string;
  originalLoanAmount?: number | string; // Or Credit Limit for CC/LOC
  creditLimit?: number; // Added for credit cards/lines of credit
  notes?: string;
  description?: string;
}

// A wrapper for each year's financials, matching the mapped structure
export interface FinancialYearWrapped {
  input: object;
  summary: FinancialYearData;
  ytdMonth?: string;
}

export interface Financials {
  [key: string]: FinancialYearWrapped | undefined;
}


export interface DscrYearData {
  noi?: number;
  debtService?: number; // Represents ANNUAL Existing Debt Payment from Debt Summary
  annualizedLoanPayment?: number; // Represents ANNUAL New Loan Payment from Loan Info
  totalDebtService?: number; // Combined total debt service
  dscr?: number; // Calculated DSCR
}

export interface DscrResults {
  [key: string]: DscrYearData | undefined; // e.g., '2024', '2025', '2026YTD'
}

export interface CashFlowReportProps {
  loanInfo?: LoanInfo;
  financials?: Financials;
  dscr?: DscrResults;
  debts?: DebtDetail[] | { entries: DebtDetail[] } | null;
}

// --- Type Guard for debts.entries ---
function hasDebtEntries(obj: unknown): obj is { entries: DebtDetail[] } {
  return Boolean(obj) && typeof obj === 'object' && Array.isArray((obj as { entries?: unknown }).entries);
}

// --- Default Values --- 

const defaultLoanInfo: LoanInfo = {
  businessName: '',
  loanPurpose: '',
  desiredAmount: 0,
  loanTerm: 0,
  interestRate: 0,
  downPaymentPercent: 0,
  estimatedPayment: 0,
  downPaymentAmount: 0,
  annualizedLoan: 0,
  proposedLoanAmount: 0,
};

// --- Helper Functions --- 

export const formatCurrency = (value: number | null | undefined, digits: number = 0): string => {
  return `$${(value ?? 0).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
};

export const formatPercentage = (value: number | null | undefined, digits: number = 1): string => { 
  // Assuming value is 0-1 for percentage, adjust if it's 0-100
  return `${((value ?? 0) * 100).toFixed(digits)}%`; 
};

const formatRatioDollarAmount = (value: number): string => {
  return `$${value.toFixed(2)}`;
};

// Simple function to get year data safely
// Type signature remains compatible as it works on the passed object (e.g., financials or dscr)
const getYearData = <T extends FinancialYearData | DscrYearData>(data: { [key: string]: T | undefined } | null | undefined, year: string): T | null => {
    return data?.[year] ?? null;
};

// Function to calculate derived financial values
const calculateFinancials = (yearData: FinancialYearData | null): FinancialYearData | null => {
    if (!yearData) return null;
    const summary = calculateFinancialSummary(yearData);

    return {
        ...yearData,
        ...summary,
    };
};

// --- Helper to determine if a year was skipped (all values zero or undefined) ---
const isYearSkipped = (yearData: FinancialYearData | null | undefined) => {
  if (!yearData) return true;
  // Only check numeric fields that matter for reporting
  const keys = [
    'revenue', 'cogs', 'grossProfit', 'operatingExpenses', 'netIncome',
    'nonRecurringIncome', 'nonRecurringExpenses', 'depreciation', 'amortization', 'ebitda', 'interest', 'taxes'
  ];
  return keys.every(key => {
    const val = yearData[key as keyof FinancialYearData];
    return val === undefined || val === null || Number(val) === 0;
  });
};

// --- Component --- 

const CashFlowReport: React.FC<CashFlowReportProps> = ({ loanInfo, financials, dscr, debts }) => {


  // Safely access top-level props, using defaultLoanInfo
  const safeLoanInfo = { ...defaultLoanInfo, ...(loanInfo || {}) };
  // Remove ytdLabel from fallback, only use years and debts
  const safeFinancials: Financials = financials || {};
  const safeDscr = dscr || {};
  // Defensive: handle debts as array or object with entries[]
  const safeDebtsRaw = Array.isArray(debts)
    ? debts
    : hasDebtEntries(debts)
      ? debts.entries
      : [];

  // --- FIX: Map originalLoanAmount to creditLimit for CREDIT_CARD and LINE_OF_CREDIT ---
  const safeDebts: DebtDetail[] = safeDebtsRaw.map((debt) => {
    if (debt.category === 'CREDIT_CARD' || debt.category === 'LINE_OF_CREDIT') {
      return {
        ...debt,
        creditLimit: Number(debt.originalLoanAmount) || 0,
      };
    }
    return debt;
  });

  // Robust YTD column header logic
  const ytdKey = '2026YTD';
  // Only index into the flat financials object, which is type-safe
  const ytdMonthRaw = safeFinancials?.[ytdKey]?.ytdMonth;
  let ytdMonthName = '';
  let ytdColumnHeader = '2026 YTD';
  if (ytdMonthRaw) {
    const monthNum = parseInt(ytdMonthRaw, 10);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
      ytdMonthName = monthNames[monthNum - 1] ?? '';
      ytdColumnHeader = `2026 YTD - ${ytdMonthName}`;
    } else {
      // If user entered a string month (e.g., "March"), use it directly
      ytdColumnHeader = `2026 YTD - ${ytdMonthRaw}`;
    }
  }

  const financialYears = safeFinancials;

  // Get calculated financials for each year using safeFinancialsYears
  const financials2024 = calculateFinancials(getYearData<FinancialYearWrapped>(financialYears, '2024')?.summary ?? null); 
  const financials2025 = calculateFinancials(getYearData<FinancialYearWrapped>(financialYears, '2025')?.summary ?? null); 
  const financials2026 = calculateFinancials(getYearData<FinancialYearWrapped>(financialYears, ytdKey)?.summary ?? null); 

  // Get DSCR data for each year (DSCR structure not changed, uses safeDscr directly)
  const dscr2024 = getYearData<DscrYearData>(safeDscr, '2024'); 
  const dscr2025 = getYearData<DscrYearData>(safeDscr, '2025'); 
  const dscr2026 = getYearData<DscrYearData>(safeDscr, ytdKey); 

  // --- Determine which columns to show ---
  const show2024 = !isYearSkipped(financials2024);
  const show2025 = !isYearSkipped(financials2025);
  const show2026 = !isYearSkipped(financials2026);

  // Helper to get summary object for each year
  const getSummary = (year: string) => financialYears?.[year]?.summary ?? null;


  

  const renderDSCRCell = (dscrValue: number | undefined | null, paddingClass: string = 'p-1') => {
    const value = dscrValue ?? 0;
    const isSufficient = value >= DSCR_BENCHMARK;
    const textColor = isSufficient ? 'text-emerald-950' : 'text-rose-950';
    const bgColor = isSufficient ? 'bg-emerald-200' : 'bg-rose-200';
    const formattedDSCR = value.toFixed(2);
    return <td className={`border border-slate-200 ${paddingClass} text-center font-semibold tabular-nums ${bgColor} ${textColor}`}>{formattedDSCR}</td>;
  };

  // --- Extract summary debt fields if present ---
  type DebtSummaryFields = {
    annualDebtService?: Record<string, number>;
    annualDebtServices?: Record<string, number>;
    annualizedLoanPayments?: Record<string, number>;
  };
  const debtSummaryObj = (debts && !Array.isArray(debts) && typeof debts === 'object')
    ? debts as DebtSummaryFields
    : {};
  const annualDebtService = debtSummaryObj.annualDebtService || debtSummaryObj.annualDebtServices || {};
  const annualizedLoanPayments = debtSummaryObj.annualizedLoanPayments || {};
  const adjustedEbitda2025 = financials2025?.adjustedEbitda ?? 0;
  const existingDebtService2025 = annualDebtService['2025'] ?? dscr2025?.debtService ?? 0;
  const currentLoanAnnualPayment2025 = annualizedLoanPayments['2025'] ?? safeLoanInfo?.annualizedLoan ?? 0;
  const currentRequestAmount = safeLoanInfo.proposedLoanAmount ?? safeLoanInfo.desiredAmount ?? 0;
  const benchmarkTotalDebtCapacity2025 = adjustedEbitda2025 > 0 ? adjustedEbitda2025 / DSCR_BENCHMARK : 0;
  const benchmarkNewLoanPaymentCapacity2025 = Math.max(benchmarkTotalDebtCapacity2025 - existingDebtService2025, 0);
  const benchmarkLoanAmountEstimate = currentRequestAmount > 0 && currentLoanAnnualPayment2025 > 0
    ? Math.max(0, Math.round(currentRequestAmount * (benchmarkNewLoanPaymentCapacity2025 / currentLoanAnnualPayment2025)))
    : 0;

  const loanPurposeDetailItems = [
    {
      label: 'Loan Purpose',
      value: safeLoanInfo.loanPurpose || 'Not provided',
    },
    {
      label: 'Estimated Term',
      value: formatLoanTermLabel(safeLoanInfo.loanTerm),
      valueClassName: 'tabular-nums',
    },
    {
      label: 'Estimated Interest Rate',
      value: formatPercentage(safeLoanInfo.interestRate ?? 0, 2),
      valueClassName: 'tabular-nums',
    },
    {
      label: 'Down Payment %',
      value: formatPercentage((safeLoanInfo.downPaymentPercent ?? 0) / 100, 2),
      valueClassName: 'tabular-nums',
    },
    {
      label: 'Estimated Monthly Payment',
      value: formatCurrency(safeLoanInfo.estimatedPayment ?? 0),
      valueClassName: 'tabular-nums',
    },
    {
      label: 'Down Payment Amount',
      value: formatCurrency(safeLoanInfo.downPaymentAmount ?? 0),
      valueClassName: 'tabular-nums',
    },
    {
      label: 'Annualized Loan Payment',
      value: formatCurrency(safeLoanInfo.annualizedLoan ?? 0),
      valueClassName: 'tabular-nums',
    },
    {
      label: 'Proposed Loan Amount',
      value: formatCurrency(safeLoanInfo.proposedLoanAmount ?? safeLoanInfo.desiredAmount ?? 0),
      valueClassName: 'tabular-nums',
    },
  ];

  // --- Component Rendering ---

  return (
    <div className="pt-0 pb-4 px-3 bg-white rounded-2xl border border-slate-200 shadow-[0_28px_60px_-36px_rgba(15,23,42,0.35)] max-w-4xl mx-auto print:mt-0 print:pt-0 print:pb-0 print:px-4 print:rounded-none print:border-0 print:shadow-none">
      <div className="report-first-page print:overflow-hidden">
        <div className="report-first-page-fit">
          {/* --- Report Header --- */}
          <header className="mt-0 mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white print:mt-0 print:mb-3 print:rounded-none">
            <div className="h-1 bg-gradient-to-r from-slate-950 via-slate-800 to-blue-900" />
            <div className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)] print:grid-cols-[minmax(0,1.35fr)_minmax(280px,1fr)] print:px-4 print:py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Lender-Ready Credit Review
                </p>
                <h1 className="mt-1.5 text-[1.85rem] font-semibold tracking-[-0.04em] text-slate-950 print:text-[25px]">
                  Comprehensive Cash Flow Analysis
                </h1>
                <p className="mt-2 max-w-2xl text-[13px] leading-5 text-slate-600 print:mt-1.5 print:text-[12px] print:leading-4">
                  Structured for professional underwriting review with a clear summary of the borrower, requested financing, and baseline loan assumptions.
                </p>
              </div>

              <div className="grid gap-2 self-start rounded-xl border border-slate-200 bg-slate-50/90 p-3 print:gap-2 print:rounded-none print:border-slate-300 print:bg-slate-50 print:p-2.5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Prepared For</p>
                  <p className="mt-0.5 text-[15px] font-semibold tracking-[-0.02em] text-slate-950 print:text-[13px]">
                    {safeLoanInfo.businessName || 'Business borrower'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-2 print:gap-2 print:pt-2">
                  <div>
                    <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Requested Amount</p>
                    <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-slate-950 print:text-[12px]">
                      {formatCurrency(safeLoanInfo.proposedLoanAmount ?? safeLoanInfo.desiredAmount ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Primary Purpose</p>
                    <p className="mt-0.5 text-[13px] font-medium text-slate-700 print:text-[12px]">
                      {safeLoanInfo.loanPurpose || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* --- Loan Purpose Section --- */}
          <section className="mb-3 print:mb-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 print:rounded-none print:border-slate-300 print:px-3 print:py-2.5">
              <div className="mb-2.5 flex items-end justify-between gap-4 border-b border-slate-200 pb-2 print:mb-2 print:pb-1.5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Financing Structure</p>
                  <h3 className="mt-0.5 text-lg font-semibold tracking-[-0.03em] text-slate-950">Loan Purpose &amp; Details</h3>
                </div>
                <p className="max-w-sm whitespace-nowrap text-right text-[11px] leading-4 text-slate-500 print:max-w-[16rem]">
                  Snapshot of the request and assumptions used in this analysis.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm print:gap-x-6 print:gap-y-0.5">
                {loanPurposeDetailItems.map((item, index) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between gap-4 border-b border-slate-200/80 py-1 print:py-0.5 ${
                      index >= loanPurposeDetailItems.length - 2 ? 'border-b-0' : ''
                    }`}
                  >
                    <p className="text-[12.5px] font-medium leading-4 text-slate-700">
                      {item.label}
                    </p>
                    <p className={`text-right text-[13px] font-semibold leading-4 text-slate-950 print:text-[12px] print:leading-4 ${item.valueClassName ?? ''}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* --- Business Cash Flow Section --- */}
          <section className="mb-2 print:mb-1">
            <h3 className="mb-2 border-b border-slate-200 pb-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">Business Cash Flow &amp; DSCR</h3>
            <table className="w-full table-fixed border-collapse border border-slate-200 text-sm text-slate-900">
              <colgroup>
                <col className="w-[30%]" />
                {show2024 && <col className="w-[23.3%]" />}
                {show2025 && <col className="w-[23.3%]" />}
                {show2026 && <col className="w-[23.3%]" />}
              </colgroup>
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="border border-slate-300 p-0.5 text-left text-[12px] font-semibold uppercase tracking-[0.16em]">Metric</th>
                  {show2024 && <th className="border border-slate-300 p-0.5 text-center text-[12px] font-semibold uppercase tracking-[0.14em]">2024</th>}
                  {show2025 && <th className="border border-slate-300 p-0.5 text-center text-[12px] font-semibold uppercase tracking-[0.14em]">2025</th>}
                  {show2026 && <th className="border border-slate-300 p-0.5 text-center text-[12px] font-semibold uppercase tracking-[0.14em]">{ytdColumnHeader}</th>}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-emerald-100">
                  {/* Changed label to Adjusted EBITDA */}
                  <td className="border border-slate-200 p-1 text-center font-medium text-slate-700">Adjusted EBITDA</td>
                  {show2024 && <td className="border border-slate-200 p-1 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(financials2024?.adjustedEbitda ?? 0)}</td>}
                  {show2025 && <td className="border border-slate-200 p-1 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(financials2025?.adjustedEbitda ?? 0)}</td>}
                  {show2026 && <td className="border border-slate-200 p-1 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(financials2026?.adjustedEbitda ?? 0)}</td>}
                </tr>
                <tr className="bg-orange-100">
                  <td className="border border-slate-200 p-1 text-center font-medium text-slate-700">Annualized Existing Debt (-)</td>
                  {show2024 && <td className="border border-slate-200 p-1 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(annualDebtService['2024'] ?? dscr2024?.debtService ?? 0)}</td>}
                  {show2025 && <td className="border border-slate-200 p-1 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(annualDebtService['2025'] ?? dscr2025?.debtService ?? 0)}</td>}
                  {show2026 && <td className="border border-slate-200 p-1 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(annualDebtService[ytdKey] ?? dscr2026?.debtService ?? 0)}</td>}
                </tr>
                <tr className="bg-orange-200/80">
                  <td className="border border-slate-200 p-1 text-center font-medium text-slate-700">Annualized Loan Payment (-)</td>
                  {show2024 && <td className="border border-slate-200 p-1 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(annualizedLoanPayments['2024'] ?? 0)}</td>}
                  {show2025 && <td className="border border-slate-200 p-1 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(annualizedLoanPayments['2025'] ?? safeLoanInfo?.annualizedLoan ?? 0)}</td>}
                  {show2026 && <td className="border border-slate-200 p-1 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(annualizedLoanPayments[ytdKey] ?? safeLoanInfo?.annualizedLoan ?? 0)}</td>}
                </tr>
                <tr className="bg-amber-200 font-semibold">
                  <td className="border border-slate-200 p-1 text-center text-slate-900">Total Debt Service</td>
                  {show2024 && <td className="border border-slate-200 p-1 text-center font-semibold tabular-nums text-slate-950">{formatCurrency((annualDebtService['2024'] ?? dscr2024?.debtService ?? 0) + (annualizedLoanPayments['2024'] ?? 0))}</td>}
                  {show2025 && <td className="border border-slate-200 p-1 text-center font-semibold tabular-nums text-slate-950">{formatCurrency((annualDebtService['2025'] ?? dscr2025?.debtService ?? 0) + (annualizedLoanPayments['2025'] ?? safeLoanInfo?.annualizedLoan ?? 0))}</td>}
                  {show2026 && <td className="border border-slate-200 p-1 text-center font-semibold tabular-nums text-slate-950">{formatCurrency((annualDebtService[ytdKey] ?? dscr2026?.debtService ?? 0) + (annualizedLoanPayments[ytdKey] ?? safeLoanInfo?.annualizedLoan ?? 0))}</td>}
                </tr>
                <tr className="bg-blue-900 font-bold text-white">
                  <td className="border border-slate-300 p-1 text-center text-white">Business DSCR</td>
                  {show2024 && renderDSCRCell((financials2024?.adjustedEbitda ?? 0) / ((annualDebtService['2024'] ?? dscr2024?.debtService ?? 0) + (annualizedLoanPayments['2024'] ?? 0)), 'p-1')}
                  {show2025 && renderDSCRCell((financials2025?.adjustedEbitda ?? 0) / ((annualDebtService['2025'] ?? dscr2025?.debtService ?? 0) + (annualizedLoanPayments['2025'] ?? safeLoanInfo?.annualizedLoan ?? 0)), 'p-1')}
                  {show2026 && renderDSCRCell((financials2026?.adjustedEbitda ?? 0) / ((annualDebtService[ytdKey] ?? dscr2026?.debtService ?? 0) + (annualizedLoanPayments[ytdKey] ?? safeLoanInfo?.annualizedLoan ?? 0)), 'p-1')}
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-center text-[13px] font-medium text-slate-600">
              Bank Preference: At Least {DSCR_BENCHMARK.toFixed(2)}x
            </p>
          </section>

          {/* --- Understanding Your Debt Service Coverage Ratio (DSCR) - 2025 (Optimized) --- */}
          <section className="mb-2 print:mb-1">
            <h3 className="text-lg font-semibold border-b pb-1 mb-1">Understanding Your DSCR for 2025</h3>
            <div className="bg-white rounded-xl p-3 md:p-4 flex flex-col md:flex-row print:flex-row gap-4 items-stretch">
              {/* Gauge and Score */}
              <div className="md:w-1/3 print:w-1/3 flex flex-col items-center justify-start self-start mb-6 md:mb-0">
                {/* Calculate DSCR for 2025 once and reuse */}
                {(() => {
                  const dscr2025Calc = (financials2025?.adjustedEbitda ?? 0) /
                    ((annualDebtService['2025'] ?? dscr2025?.debtService ?? 0) + (annualizedLoanPayments['2025'] ?? safeLoanInfo?.annualizedLoan ?? 0));
                  const numerator = financials2025?.adjustedEbitda ?? 0;
                  const denominator = (annualDebtService['2025'] ?? dscr2025?.debtService ?? 0) + (annualizedLoanPayments['2025'] ?? safeLoanInfo?.annualizedLoan ?? 0);
                  return (
                    <>
                      <DscrGauge value={dscr2025Calc} />
                      {Number.isFinite(dscr2025Calc) && denominator > 0 ? (
                        <div className="mt-2 flex flex-col items-center">
                          <div className="border-l-4 border-blue-400 bg-blue-50 p-2 w-full">
                            <span className="block text-sm text-blue-900 font-semibold mb-1">How We Calculated Your Score:</span>
                            <span className="block text-blue-900 text-sm">
                              <span className="font-bold">DSCR = Adjusted EBITDA ÷ Total Debt Service</span><br/>
                              <span className="block mt-1">
                                {formatCurrency(numerator)}
                                <span className="mx-2 text-blue-700 font-bold">÷</span>
                                {formatCurrency(denominator)}
                                <span className="mx-2 text-blue-700 font-bold">=</span>
                                <span className="font-bold text-blue-900">{dscr2025Calc.toFixed(2)}</span>
                              </span>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="block text-blue-900 text-sm">Calculation data not available.</span>
                      )}
                      {currentRequestAmount > 0 && currentLoanAnnualPayment2025 > 0 && (
                        <div className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">DSCR Capacity Insight</p>
                              <p className="mt-1 whitespace-nowrap text-[11px] leading-4 text-slate-600">
                                {dscr2025Calc >= DSCR_BENCHMARK
                                  ? `Estimated max loan at ${DSCR_BENCHMARK.toFixed(2)}x`
                                  : `Estimated right-sized loan at ${DSCR_BENCHMARK.toFixed(2)}x`}
                              </p>
                            </div>
                            <div className={`text-right text-lg font-bold tracking-[-0.03em] tabular-nums ${
                              dscr2025Calc >= DSCR_BENCHMARK ? 'text-emerald-700' : 'text-amber-700'
                            }`}>
                              {formatCurrency(benchmarkLoanAmountEstimate)}
                            </div>
                          </div>
                          <p className="mt-2 border-t border-slate-200 pt-2 text-[11px] leading-4 text-slate-600">
                            {dscr2025Calc >= DSCR_BENCHMARK
                              ? 'At the current terms, cash flow may support a larger request while staying near the common lender benchmark.'
                              : 'At the current terms, this is the approximate loan size that would align more closely with the common lender benchmark.'}
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Explanation and Calculation */}
              <div className="md:w-2/3 print:w-2/3 flex flex-col">
                {(() => {
                  const dscr2025Calc = (financials2025?.adjustedEbitda ?? 0) /
                    ((annualDebtService['2025'] ?? dscr2025?.debtService ?? 0) + (annualizedLoanPayments['2025'] ?? safeLoanInfo?.annualizedLoan ?? 0));
                  if (!Number.isFinite(dscr2025Calc)) return null;
                  const band = getDscrBand(dscr2025Calc);
                  const debtNeededPerDollarEarned = dscr2025Calc > 0 ? 1 / dscr2025Calc : null;
                  const debtLeftoverPerDollarEarned = dscr2025Calc > 0 ? Math.max(1 - (1 / dscr2025Calc), 0) : null;
                  const dollarTranslation =
                    debtNeededPerDollarEarned === null
                      ? ''
                      : dscr2025Calc < 1
                        ? `Based on your current DSCR of ${dscr2025Calc.toFixed(2)}x, for every $1.00 your business earns, about ${formatRatioDollarAmount(debtNeededPerDollarEarned)} is needed for debt payments. That means the debt load is running ahead of the cash flow supporting it.`
                        : `Based on your current DSCR of ${dscr2025Calc.toFixed(2)}x, for every $1.00 your business earns, about ${formatRatioDollarAmount(debtNeededPerDollarEarned)} goes toward debt payments, leaving about ${formatRatioDollarAmount(debtLeftoverPerDollarEarned ?? 0)} after debt.`;

                  return (
                    <>
                      <p className="mb-2 text-xs leading-snug text-slate-600 md:text-sm">
                        <span className="font-semibold text-slate-900">Your Debt Service Coverage Ratio (DSCR)</span>{' '}
                        shows whether your business brings in enough income to cover all required debt payments.{' '}
                        {dollarTranslation}{' '}
                        <span className="font-semibold text-slate-900">Banks tend to prefer a DSCR of at least {DSCR_BENCHMARK.toFixed(2)}x</span>{' '}
                        so there is a stronger cushion above required debt payments.
                      </p>
                      <div className={`${band.report.containerClassName} mb-4 rounded p-4 text-sm`}>
                        <div className="mb-1 flex items-center">
                          <span className={`font-semibold ${band.report.accentTextClassName}`}>
                            {band.report.heading}
                          </span>
                        </div>
                        <div className="mb-1">{band.report.lead}</div>
                        <div className="mb-2">{band.report.lenderPerspective}</div>
                        <ul className="mb-2 list-disc pl-5">
                          {band.report.bullets.map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                        <div className={`font-semibold ${band.report.accentTextClassName}`}>{band.report.bottomLine}</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </section>
        </div>
      </div>
      {/* --- Income Breakdown Section --- */}
      <section className="mb-8">
        <div className="w-full">
          <div className="mb-2 mt-1 flex items-end justify-between gap-4 border-b border-slate-300 pb-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Operating Performance</p>
              <h2 className="mt-0.5 text-[1.75rem] font-semibold tracking-[-0.04em] text-slate-950">Income Breakdown</h2>
            </div>
            <p className="max-w-sm text-right text-[11px] leading-4 text-slate-500">
              Revenue, expenses, and EBITDA bridge used in the underwriting view.
            </p>
          </div>
          <table className="w-full table-fixed border-collapse border border-slate-200 text-sm text-slate-900">
            <colgroup>
              <col className="w-[30%]" />
              {show2024 && <col className="w-[23.3%]" />}
              {show2025 && <col className="w-[23.3%]" />}
              {show2026 && <col className="w-[23.3%]" />}
            </colgroup>
            <thead>
              <tr className="bg-emerald-100 text-slate-700">
                <th className="border border-slate-200 p-2 text-left text-[12px] font-semibold uppercase tracking-[0.14em]"></th>
                {show2024 && <th className="border border-slate-200 p-2 text-center text-[12px] font-semibold uppercase tracking-[0.14em]">2024</th>}
                {show2025 && <th className="border border-slate-200 p-2 text-center text-[12px] font-semibold uppercase tracking-[0.14em]">2025</th>}
                {show2026 && <th className="border border-slate-200 p-2 text-center text-[12px] font-semibold uppercase tracking-[0.14em]">{ytdColumnHeader}</th>}
              </tr>
            </thead>
            <tbody>
            <tr>
              <td className="border border-slate-200 p-2 text-left font-medium text-slate-700">Revenue (Sales)</td>
              {show2024 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary('2024')?.revenue ?? 0)}</td>}
              {show2025 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary('2025')?.revenue ?? 0)}</td>}
              {show2026 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary(ytdKey)?.revenue ?? 0)}</td>}
            </tr>
            <tr>
              <td className="border border-slate-200 p-2 text-left font-medium text-slate-700">Cost of Goods Sold (-)</td>
              {show2024 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary('2024')?.cogs ?? 0)}</td>}
              {show2025 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary('2025')?.cogs ?? 0)}</td>}
              {show2026 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary(ytdKey)?.cogs ?? 0)}</td>}
            </tr>
            <tr className="bg-slate-50 font-semibold">
              <td className="border border-slate-200 p-2 text-left text-slate-900">Gross Profit</td>
              {show2024 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-950">{formatCurrency(getSummary('2024')?.grossProfit ?? 0)}</td>}
              {show2025 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-950">{formatCurrency(getSummary('2025')?.grossProfit ?? 0)}</td>}
              {show2026 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-950">{formatCurrency(getSummary(ytdKey)?.grossProfit ?? 0)}</td>}
            </tr>
            <tr>
              <td className="border border-slate-200 p-2 text-left font-medium text-slate-700">Operating Expenses (-)</td>
              {show2024 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary('2024')?.operatingExpenses ?? 0)}</td>}
              {show2025 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary('2025')?.operatingExpenses ?? 0)}</td>}
              {show2026 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary(ytdKey)?.operatingExpenses ?? 0)}</td>}
            </tr>
            <tr className="bg-slate-50 font-semibold">
              <td className="border border-slate-200 p-2 text-left text-slate-900">Net Income</td>
              {show2024 && (
                <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-950">
                  {formatCurrency(getSummary('2024')?.netIncome ?? 0)}
                </td>
              )}
              {show2025 && (
                <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-950">
                  {formatCurrency(getSummary('2025')?.netIncome ?? 0)}
                </td>
              )}
              {show2026 && (
                <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-950">
                  {formatCurrency(getSummary(ytdKey)?.netIncome ?? 0)}
                </td>
              )}
            </tr>
            <tr>
              <td className="border border-slate-200 p-2 text-left font-medium text-slate-700">Interest (+)</td>
              {show2024 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary('2024')?.interest ?? 0)}</td>}
              {show2025 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary('2025')?.interest ?? 0)}</td>}
              {show2026 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary(ytdKey)?.interest ?? 0)}</td>}
            </tr>
            <tr>
              <td className="border border-slate-200 p-2 text-left font-medium text-slate-700">Taxes (+)</td>
              {show2024 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary('2024')?.taxes ?? 0)}</td>}
              {show2025 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary('2025')?.taxes ?? 0)}</td>}
              {show2026 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary(ytdKey)?.taxes ?? 0)}</td>}
            </tr>
            <tr>
              <td className="border border-slate-200 p-2 text-left font-medium text-slate-700">Depreciation (+)</td>
              {show2024 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary('2024')?.depreciation ?? 0)}</td>}
              {show2025 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary('2025')?.depreciation ?? 0)}</td>}
              {show2026 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary(ytdKey)?.depreciation ?? 0)}</td>}
            </tr>
            <tr>
              <td className="border border-slate-200 p-2 text-left font-medium text-slate-700">Amortization (+)</td>
              {show2024 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary('2024')?.amortization ?? 0)}</td>}
              {show2025 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary('2025')?.amortization ?? 0)}</td>}
              {show2026 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary(ytdKey)?.amortization ?? 0)}</td>}
            </tr>
            <tr className="bg-emerald-100 font-bold">
              <td className="border border-slate-200 p-2 text-left text-slate-950">EBITDA</td>
              {show2024 && <td className="border border-slate-200 p-2 text-center font-bold tabular-nums text-slate-950">{formatCurrency(getSummary('2024')?.ebitda ?? 0)}</td>}
              {show2025 && <td className="border border-slate-200 p-2 text-center font-bold tabular-nums text-slate-950">{formatCurrency(getSummary('2025')?.ebitda ?? 0)}</td>}
              {show2026 && <td className="border border-slate-200 p-2 text-center font-bold tabular-nums text-slate-950">{formatCurrency(getSummary(ytdKey)?.ebitda ?? 0)}</td>}
            </tr>
            <tr>
  <td className="border border-slate-200 p-2 text-left font-medium text-slate-700">Non-Recurring Income (-)</td>
  {show2024 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary('2024')?.nonRecurringIncome ?? 0)}</td>}
  {show2025 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary('2025')?.nonRecurringIncome ?? 0)}</td>}
  {show2026 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary(ytdKey)?.nonRecurringIncome ?? 0)}</td>}
</tr>
<tr>
  <td className="border border-slate-200 p-2 text-left font-medium text-slate-700">Non-Recurring Expenses (+)</td>
  {show2024 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary('2024')?.nonRecurringExpenses ?? 0)}</td>}
  {show2025 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary('2025')?.nonRecurringExpenses ?? 0)}</td>}
  {show2026 && <td className="border border-slate-200 p-2 text-center font-semibold tabular-nums text-slate-900">{formatCurrency(getSummary(ytdKey)?.nonRecurringExpenses ?? 0)}</td>}
</tr>
<tr className="bg-emerald-200 font-bold">
  <td className="border border-slate-200 p-2 flex items-center gap-2 text-slate-950">
    Adjusted EBITDA
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-pointer">
            <InfoIcon className="inline-block h-4 w-4 text-emerald-700" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-left">
          <span className="font-semibold">Adjusted EBITDA</span> gives lenders a clearer picture of your business's true, recurring earning power.
          <br /><br />
          It starts with EBITDA, then subtracts any unusual, non-recurring income (like a grant or COVID relief) and adds back any one-time expenses (like a lawsuit or flood).
          <br /><br />
          <span className="text-green-700 font-semibold">Why?</span> Lenders want to know your sustainable cash flow for repaying debt, not figures distorted by rare events. Adjusted EBITDA helps show your business’s real, ongoing ability to make loan payments.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </td>
  {show2024 && (
    <td className="border border-slate-200 p-2 text-center font-bold tabular-nums text-slate-950">
      {formatCurrency((getSummary('2024')?.ebitda ?? 0)
        - (getSummary('2024')?.nonRecurringIncome ?? 0)
        + (getSummary('2024')?.nonRecurringExpenses ?? 0))}
    </td>
  )}
  {show2025 && (
    <td className="border border-slate-200 p-2 text-center font-bold tabular-nums text-slate-950">
      {formatCurrency((getSummary('2025')?.ebitda ?? 0)
        - (getSummary('2025')?.nonRecurringIncome ?? 0)
        + (getSummary('2025')?.nonRecurringExpenses ?? 0))}
    </td>
  )}
  {show2026 && (
    <td className="border border-slate-200 p-2 text-center font-bold tabular-nums text-slate-950">
      {formatCurrency((getSummary(ytdKey)?.ebitda ?? 0)
        - (getSummary(ytdKey)?.nonRecurringIncome ?? 0)
        + (getSummary(ytdKey)?.nonRecurringExpenses ?? 0))}
    </td>
  )}
</tr>
          </tbody>
      </table>
    </div>
  </section>

      {/* --- Net Income, EBITDA, & Adjusted EBITDA: Why They Matter for Your Loan --- */}
      <section className="mb-6 print:mb-3">
        <div className="bg-gradient-to-br from-blue-50 to-green-50 border-l-4 border-blue-400 rounded-xl p-4 md:p-6 flex flex-col gap-3 print:p-3 print:gap-2">
          <div className="flex items-center mb-2 print:mb-1">
            <InfoIcon className="w-5 h-5 text-blue-600 mr-2" />
            <h4 className="text-lg md:text-xl font-bold text-blue-900 leading-tight">
              Net Income, EBITDA, & Adjusted EBITDA: Why They Matter for Your Loan
            </h4>
          </div>
          <div className="flex flex-col md:flex-row print:flex-row gap-3 mt-2 print:gap-2">
            {/* Net Income Box */}
            <div className="flex-1 bg-white border-l-4 border-blue-400 rounded-xl shadow p-3 flex flex-col items-start print:p-2 print:rounded print:shadow-none">
              <div className="flex items-center mb-1 print:mb-0.5">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 mr-2">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M4 12h16M4 12l4-4m-4 4l4 4"/></svg>
                </span>
                <span className="text-sm font-bold text-blue-900 leading-tight">Net Income</span>
              </div>
              <div className="text-gray-700 text-sm md:text-base leading-snug">
                Money left after all regular costs—COGS, expenses, interest, and taxes. Shows what you truly earn from your business after everything is paid.
              </div>
            </div>
            {/* EBITDA Box */}
            <div className="flex-1 bg-white border-l-4 border-green-400 rounded-xl shadow p-3 flex flex-col items-start print:p-2 print:rounded print:shadow-none">
              <div className="flex items-center mb-1 print:mb-0.5">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-600 mr-2">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path stroke="currentColor" strokeWidth="2" d="M8 12h8"/></svg>
                </span>
                <span className="text-sm font-bold text-green-900 leading-tight">EBITDA</span>
              </div>
              <div className="text-gray-700 text-sm md:text-base leading-snug">
                Earnings before interest, taxes, depreciation, and amortization. Shows core operating cash flow, ignoring non-cash and non-operating items.
              </div>
            </div>
            {/* Adjusted EBITDA Box */}
            <div className="flex-1 bg-white border-l-4 border-yellow-400 rounded-xl shadow p-3 flex flex-col items-start print:p-2 print:rounded print:shadow-none">
              <div className="flex items-center mb-1 print:mb-0.5">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-100 text-yellow-600 mr-2">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 6v6l4 2"/></svg>
                </span>
                <span className="text-sm font-bold text-yellow-900 leading-tight">Adjusted EBITDA</span>
              </div>
              <div className="text-gray-700 text-sm md:text-base leading-snug">
                Starts with EBITDA, then adjusts for unusual, one-time income/expenses. Lenders use this to judge your true, recurring earning power for loans.
              </div>
            </div>
          </div>
          <p className="text-sm md:text-base text-blue-900 font-semibold leading-snug mt-2 print:mt-0">
            <span className="font-bold">Why do lenders care about these metrics?</span> They want to know your business's ability to generate cash and repay loans. Net income shows your profitability, EBITDA highlights your core cash flow, and Adjusted EBITDA gives a clearer picture of your sustainable earning power.
          </p>
        </div>
      </section>
      <div className="page-break" />
      {/* --- Business Debt Summary --- */}
      <section className="mb-8 print:mb-0">
        <CashFlowBusinessDebtSummaryTemplate
          debts={safeDebts}
          businessName={safeLoanInfo.businessName}
        />
      </section>
    </div>
  );
};

export default CashFlowReport;
