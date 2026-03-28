import React from 'react';
import { InfoIcon } from 'lucide-react';
import { DscrGauge } from '@/app/(components)/cash-flow/DscrQuickCalculator';
import CashFlowBusinessDebtSummaryTemplate from '@/app/(components)/cash-flow/CashFlowBusinessDebtSummaryTemplate';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/app/(components)/ui/tooltip';
import { calculateFinancialSummary, formatLoanTermLabel } from '@/lib/financial/calculations';

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
  input: { [key: string]: any };
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
function hasDebtEntries(obj: any): obj is { entries: DebtDetail[] } {
  return obj && typeof obj === 'object' && Array.isArray(obj.entries);
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

  const bankPreference = 1.25;

  // --- Determine which columns to show ---
  const show2024 = !isYearSkipped(financials2024);
  const show2025 = !isYearSkipped(financials2025);
  const show2026 = !isYearSkipped(financials2026);

  // Helper to get summary object for each year
  const getSummary = (year: string) => financialYears?.[year]?.summary ?? null;


  

  const renderDSCRCell = (dscrValue: number | undefined | null, paddingClass: string = 'p-1') => {
    const value = dscrValue ?? 0;
    const isSufficient = value >= bankPreference;
    const textColor = isSufficient ? 'text-green-600' : 'text-red-600';
    const bgColor = isSufficient ? 'bg-green-100' : 'bg-red-100';
    const formattedDSCR = value.toFixed(2);
    return <td className={`border ${paddingClass} text-center ${bgColor} ${textColor}`}>{formattedDSCR}</td>;
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

  // --- Component Rendering ---

  return (
    <div className="pt-0 pb-4 px-3 bg-white rounded-lg shadow-md max-w-4xl mx-auto print:mt-0 print:pt-0 print:pb-0 print:px-0 print:rounded-none print:shadow-none">
      {/* --- Report Header --- */}
      <header className="mt-0 mb-1 text-center border-b pb-1 print:mt-0 print:pt-0">
        <h1 className="text-2xl font-bold text-gray-800">Comprehensive Cash Flow Analysis</h1>
        {safeLoanInfo.businessName && (
          <h2 className="text-lg text-gray-600 mt-0">Prepared for: {safeLoanInfo.businessName}</h2>
        )}
        {/* Can add date here if needed */}
      </header>

      {/* --- Loan Purpose Section --- */}
      <section className="mb-8 print:mb-4">
        <h3 className="text-lg font-semibold border-b pb-1 mb-2">Loan Purpose & Details</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
          <div><strong>Loan Purpose:</strong> {safeLoanInfo?.loanPurpose ?? 'N/A'}</div>
          <div><strong>Estimated Term:</strong> {formatLoanTermLabel(safeLoanInfo?.loanTerm)}</div>
          <div><strong>Estimated Interest Rate:</strong> {formatPercentage(safeLoanInfo?.interestRate ?? 0, 2)}</div>
          <div><strong>Down Payment %:</strong> {formatPercentage((safeLoanInfo?.downPaymentPercent ?? 0) / 100, 2)}</div>         
          <div><strong>Estimated Monthly Payment:</strong> {formatCurrency(safeLoanInfo?.estimatedPayment ?? 0)}</div>
          <div><strong>Down Payment Amount:</strong> {formatCurrency(safeLoanInfo?.downPaymentAmount ?? 0)}</div>
          <div><strong>Annualized Loan Payment:</strong> {formatCurrency(safeLoanInfo?.annualizedLoan ?? 0)}</div>
          <div><strong>Proposed Loan Amount:</strong> {formatCurrency(safeLoanInfo?.proposedLoanAmount ?? safeLoanInfo?.desiredAmount ?? 0)}</div>
        </div>
      </section>

      {/* --- Business Cash Flow Section --- */}
      <section className="mb-2 print:mb-1">
        <h3 className="text-lg font-semibold border-b pb-1 mb-2">Business Cash Flow & DSCR</h3>
        <table className="w-full border-collapse border text-sm table-fixed">
          <colgroup>
            <col className="w-[30%]" />
            {show2024 && <col className="w-[23.3%]" />}
            {show2025 && <col className="w-[23.3%]" />}
            {show2026 && <col className="w-[23.3%]" />}
          </colgroup>
          <thead>
            <tr className="bg-blue-100">
              <th className="border p-0.5 text-left">Metric</th>
              {show2024 && <th className="border p-0.5 text-center">2024</th>}
              {show2025 && <th className="border p-0.5 text-center">2025</th>}
              {show2026 && <th className="border p-0.5 text-center">{ytdColumnHeader}</th>}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-green-50">
              {/* Changed label to Adjusted EBITDA */}
              <td className="border p-1 text-center">Adjusted EBITDA</td>
              {show2024 && <td className="border p-1 text-center">{formatCurrency(financials2024?.adjustedEbitda ?? 0)}</td>}
              {show2025 && <td className="border p-1 text-center">{formatCurrency(financials2025?.adjustedEbitda ?? 0)}</td>}
              {show2026 && <td className="border p-1 text-center">{formatCurrency(financials2026?.adjustedEbitda ?? 0)}</td>}
            </tr>
            <tr className="bg-orange-50">
              <td className="border p-1 text-center">Annualized Existing Debt (-)</td>
              {show2024 && <td className="border p-1 text-center">{formatCurrency(annualDebtService['2024'] ?? dscr2024?.debtService ?? 0)}</td>}
              {show2025 && <td className="border p-1 text-center">{formatCurrency(annualDebtService['2025'] ?? dscr2025?.debtService ?? 0)}</td>}
              {show2026 && <td className="border p-1 text-center">{formatCurrency(annualDebtService[ytdKey] ?? dscr2026?.debtService ?? 0)}</td>}
            </tr>
            <tr className="bg-orange-50">
              <td className="border p-1 text-center">Annualized Loan Payment (-)</td>
              {show2024 && <td className="border p-1 text-center">{formatCurrency(annualizedLoanPayments['2024'] ?? 0)}</td>}
              {show2025 && <td className="border p-1 text-center">{formatCurrency(annualizedLoanPayments['2025'] ?? safeLoanInfo?.annualizedLoan ?? 0)}</td>}
              {show2026 && <td className="border p-1 text-center">{formatCurrency(annualizedLoanPayments[ytdKey] ?? safeLoanInfo?.annualizedLoan ?? 0)}</td>}
            </tr>
            <tr className="font-semibold bg-orange-100">
              <td className="border p-1 text-center">Total Debt Service</td>
              {/* Assuming dscr.debtService already includes proposed loan payment, adjust if needed */}
              {show2024 && <td className="border p-1 text-center">{formatCurrency((annualDebtService['2024'] ?? dscr2024?.debtService ?? 0) + (annualizedLoanPayments['2024'] ?? 0))}</td>}
              {show2025 && <td className="border p-1 text-center">{formatCurrency((annualDebtService['2025'] ?? dscr2025?.debtService ?? 0) + (annualizedLoanPayments['2025'] ?? safeLoanInfo?.annualizedLoan ?? 0))}</td>}
              {show2026 && <td className="border p-1 text-center">{formatCurrency((annualDebtService[ytdKey] ?? dscr2026?.debtService ?? 0) + (annualizedLoanPayments[ytdKey] ?? safeLoanInfo?.annualizedLoan ?? 0))}</td>}
            </tr>
            <tr className="bg-blue-100 font-bold">
              <td className="border p-1 text-center">Business DSCR</td>
              {show2024 && renderDSCRCell((financials2024?.adjustedEbitda ?? 0) / ((annualDebtService['2024'] ?? dscr2024?.debtService ?? 0) + (annualizedLoanPayments['2024'] ?? 0)), 'p-1')}
              {show2025 && renderDSCRCell((financials2025?.adjustedEbitda ?? 0) / ((annualDebtService['2025'] ?? dscr2025?.debtService ?? 0) + (annualizedLoanPayments['2025'] ?? safeLoanInfo?.annualizedLoan ?? 0)), 'p-1')}
              {show2026 && renderDSCRCell((financials2026?.adjustedEbitda ?? 0) / ((annualDebtService[ytdKey] ?? dscr2026?.debtService ?? 0) + (annualizedLoanPayments[ytdKey] ?? safeLoanInfo?.annualizedLoan ?? 0)), 'p-1')}
            
            </tr>
          </tbody>
        </table>
        <p className="text-sm text-center text-gray-600 mt-2">
          Bank Preference: At Least {bankPreference.toFixed(2)}x
        </p>
      </section>
      {/* --- Understanding Your Debt Service Coverage Ratio (DSCR) - 2025 (Optimized) --- */}
      <section className="mb-2 print:mb-1">
        <h3 className="text-lg font-semibold border-b pb-1 mb-1">Understanding Your DSCR for 2025</h3>
        <div className="bg-white rounded-xl shadow-md p-3 md:p-4 flex flex-col md:flex-row print:flex-row gap-4 items-stretch">
          {/* Gauge and Score */}
          <div className="md:w-1/3 print:w-1/3 flex flex-col items-center justify-center mb-6 md:mb-0">
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
                          <span className="text-xs text-blue-700">(Business cash flow divided by all debt payments for the year)</span><br/>
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
                </>
              );
            })()}
          </div>

          {/* Explanation and Calculation */}
          <div className="md:w-2/3 print:w-2/3 flex flex-col">
            <p className="mb-2 text-gray-600 text-xs md:text-sm leading-snug">
              Your Debt Service Coverage Ratio (DSCR) shows if your business brings in enough income to pay all its debt payments. <span className="font-semibold">A score of 1.0x means for every $1 you make, you pay $1 in debts.</span> Most banks want to see at least <span className="font-semibold">1.25x</span>—so you have a safety cushion.
            </p>
            {/* Use calculated DSCR for conditional rendering */}
            {(() => {
              const dscr2025Calc = (financials2025?.adjustedEbitda ?? 0) /
                ((annualDebtService['2025'] ?? dscr2025?.debtService ?? 0) + (annualizedLoanPayments['2025'] ?? safeLoanInfo?.annualizedLoan ?? 0));
              if (!Number.isFinite(dscr2025Calc)) return null;
              if (dscr2025Calc >= 1.25) {
                return (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-4 text-gray-800 text-sm">
                    <div className="flex items-center mb-1">
                      <span className="text-lg mr-2">🔵</span>
                      <span className="font-semibold text-green-700">1.25 or Higher (Strong)</span>
                    </div>
                    <div className="mb-1">Your DSCR is above 1.25, which is excellent.</div>
                    <div className="mb-2">From a lender’s viewpoint, this means your business is generating at least 25% more income than needed to cover your debt obligations. You’re operating with a healthy cushion, which reduces our risk significantly.</div>
                    <ul className="list-disc pl-5 mb-2">
                      <li>Potential for larger loan amounts</li>
                      <li>Access to better interest rates</li>
                      <li>Greater likelihood of faster approvals with fewer conditions</li>
                    </ul>
                    <div className="text-green-800 font-semibold">✅ Bottom line: You’re in a great position to borrow — and possibly even refinance existing debt on better terms.</div>
                  </div>
                );
              } else if (dscr2025Calc >= 1.0) {
                return (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-4 text-gray-800 text-sm">
                    <div className="flex items-center mb-1">
                      <span className="text-lg mr-2">🟡</span>
                      <span className="font-semibold text-yellow-700">1.00 – 1.24 (Needs Work)</span>
                    </div>
                    <div className="mb-1">Your DSCR falls between 1.00 and 1.24 — you're covering debt, but just barely.</div>
                    <div className="mb-2">From a lender’s viewpoint, this means your business is meeting debt payments, but there's little room for unexpected expenses or downturns.</div>
                    <div className="mb-2">This range signals marginal strength. You're not in danger, but we may:</div>
                    <ul className="list-disc pl-5 mb-2">
                      <li>Request additional financial documentation</li>
                      <li>Ask about cash flow strategies or upcoming changes</li>
                      <li>Offer smaller loan amounts or require collateral</li>
                    </ul>
                    <div className="text-yellow-800 font-semibold">⚠️ Recommendation: Focus on boosting cash flow and reducing non-essential debt to strengthen your future borrowing power.</div>
                  </div>
                );
              } else if (dscr2025Calc < 1.0) {
                return (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded mb-4 text-gray-800 text-sm">
                    <div className="flex items-center mb-1">
                      <span className="text-lg mr-2">🔴</span>
                      <span className="font-semibold text-red-700">Below 1.00 (High Risk)</span>
                    </div>
                    <div className="mb-1">Your DSCR is under 1.00, which raises red flags for lending.</div>
                    <div className="mb-2">This means your business isn’t generating enough income to cover its current debt — a lender’s biggest concern. It suggests you’re relying on external sources, reserves, or hoping for increased revenue to stay afloat.</div>
                    <div className="mb-2">❌ In this case, we would typically:</div>
                    <ul className="list-disc pl-5 mb-2">
                      <li>Decline the loan request, or</li>
                      <li>Require major improvements or guarantees before reconsidering</li>
                    </ul>
                    <div className="mb-2">🔄 What you can do:</div>
                    <ul className="list-disc pl-5 mb-2">
                      <li>Review expenses and eliminate non-essential costs</li>
                      <li>Explore ways to increase revenue (e.g., raise prices, boost sales)</li>
                      <li>Consider restructuring existing debt to lower your payments</li>
                    </ul>
                    <div className="text-red-800 font-semibold">💬 Once your DSCR improves, we can revisit your application.</div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </section>
      <div className="page-break" />
      {/* --- Income Breakdown Section --- */}
      <section className="mb-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2 mt-2 border-b-2 border-gray-300 pb-2">Income Breakdown</h2>
          <table className="w-full border-collapse border text-sm table-fixed">
            <colgroup>
              <col className="w-[30%]" />
              {show2024 && <col className="w-[23.3%]" />}
              {show2025 && <col className="w-[23.3%]" />}
              {show2026 && <col className="w-[23.3%]" />}
            </colgroup>
            <thead>
              <tr className="bg-green-100">
                <th className="border p-2 text-left"></th>
                {show2024 && <th className="border p-2 text-center">2024</th>}
                {show2025 && <th className="border p-2 text-center">2025</th>}
                {show2026 && <th className="border p-2 text-center">{ytdColumnHeader}</th>}
              </tr>
            </thead>
            <tbody>
            <tr>
              <td className="border p-2 text-left">Revenue (Sales)</td>
              {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.revenue ?? 0)}</td>}
              {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary('2025')?.revenue ?? 0)}</td>}
              {show2026 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.revenue ?? 0)}</td>}
            </tr>
            <tr>
              <td className="border p-2 text-left">Cost of Goods Sold (-)</td>
              {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.cogs ?? 0)}</td>}
              {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary('2025')?.cogs ?? 0)}</td>}
              {show2026 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.cogs ?? 0)}</td>}
            </tr>
            <tr className="font-semibold bg-gray-50">
              <td className="border p-2 text-left">Gross Profit</td>
              {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.grossProfit ?? 0)}</td>}
              {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary('2025')?.grossProfit ?? 0)}</td>}
              {show2026 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.grossProfit ?? 0)}</td>}
            </tr>
            <tr>
              <td className="border p-2 text-left">Operating Expenses (-)</td>
              {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.operatingExpenses ?? 0)}</td>}
              {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary('2025')?.operatingExpenses ?? 0)}</td>}
              {show2026 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.operatingExpenses ?? 0)}</td>}
            </tr>
            <tr className="font-semibold bg-gray-50">
              <td className="border p-2 text-left">Net Income</td>
              {show2024 && (
                <td className="border p-2 text-center">
                  {formatCurrency(getSummary('2024')?.netIncome ?? 0)}
                </td>
              )}
              {show2025 && (
                <td className="border p-2 text-center">
                  {formatCurrency(getSummary('2025')?.netIncome ?? 0)}
                </td>
              )}
              {show2026 && (
                <td className="border p-2 text-center">
                  {formatCurrency(getSummary(ytdKey)?.netIncome ?? 0)}
                </td>
              )}
            </tr>
            <tr>
              <td className="border p-2 text-left">Interest (+)</td>
              {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.interest ?? 0)}</td>}
              {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary('2025')?.interest ?? 0)}</td>}
              {show2026 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.interest ?? 0)}</td>}
            </tr>
            <tr>
              <td className="border p-2 text-left">Taxes (+)</td>
              {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.taxes ?? 0)}</td>}
              {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary('2025')?.taxes ?? 0)}</td>}
              {show2026 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.taxes ?? 0)}</td>}
            </tr>
            <tr>
              <td className="border p-2 text-left">Depreciation (+)</td>
              {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.depreciation ?? 0)}</td>}
              {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary('2025')?.depreciation ?? 0)}</td>}
              {show2026 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.depreciation ?? 0)}</td>}
            </tr>
            <tr>
              <td className="border p-2 text-left">Amortization (+)</td>
              {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.amortization ?? 0)}</td>}
              {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary('2025')?.amortization ?? 0)}</td>}
              {show2026 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.amortization ?? 0)}</td>}
            </tr>
            <tr className="font-bold bg-green-100">
              <td className="border p-2 text-left">EBITDA</td>
              {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.ebitda ?? 0)}</td>}
              {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary('2025')?.ebitda ?? 0)}</td>}
              {show2026 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.ebitda ?? 0)}</td>}
            </tr>
            <tr>
  <td className="border p-2 text-left">Non-Recurring Income (-)</td>
  {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.nonRecurringIncome ?? 0)}</td>}
  {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary('2025')?.nonRecurringIncome ?? 0)}</td>}
  {show2026 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.nonRecurringIncome ?? 0)}</td>}
</tr>
<tr>
  <td className="border p-2 text-left">Non-Recurring Expenses (+)</td>
  {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.nonRecurringExpenses ?? 0)}</td>}
  {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary('2025')?.nonRecurringExpenses ?? 0)}</td>}
  {show2026 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.nonRecurringExpenses ?? 0)}</td>}
</tr>
<tr className="font-bold bg-green-200">
  <td className="border p-2 flex items-center gap-2">
    Adjusted EBITDA
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-pointer">
            <InfoIcon className="w-4 h-4 text-green-600 inline-block" />
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
    <td className="border p-2 text-center font-bold">
      {formatCurrency((getSummary('2024')?.ebitda ?? 0)
        - (getSummary('2024')?.nonRecurringIncome ?? 0)
        + (getSummary('2024')?.nonRecurringExpenses ?? 0))}
    </td>
  )}
  {show2025 && (
    <td className="border p-2 text-center font-bold">
      {formatCurrency((getSummary('2025')?.ebitda ?? 0)
        - (getSummary('2025')?.nonRecurringIncome ?? 0)
        + (getSummary('2025')?.nonRecurringExpenses ?? 0))}
    </td>
  )}
  {show2026 && (
    <td className="border p-2 text-center font-bold">
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

// Helper function to get DSCR color based on value
const getDscrColor = (value: number): string => {
  if (value >= 1.25) return '#34C759'; // Green (Above 1.25)
  if (value >= 1.0) return '#F7DC6F'; // Yellow (Between 1.0 and 1.25)
  return '#DC2626'; // Red (Default/Below 1.0)
};

// Helper function for DSCR interpretation text
const getDscrInterpretation = (value: number, preference: number): string => {
  if (value === 0) return "Insufficient data or zero income/debt";
  if (value >= preference) return `Strong! Meets or exceeds the typical bank preference of ${preference.toFixed(2)}x.`;
  if (value >= 1.0) return `Okay. Covers debt payments, but below the typical bank preference of ${preference.toFixed(2)}x.`;
  return `Caution! Income may not be sufficient to cover all debt payments.`;
};

export default CashFlowReport;
