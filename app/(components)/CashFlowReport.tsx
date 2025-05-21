import React from 'react';
import { InfoIcon } from 'lucide-react';
import { DscrGauge } from '@/app/(components)/cash-flow/DscrQuickCalculator';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/app/(components)/ui/tooltip';

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
  [key: string]: DscrYearData | undefined; // e.g., '2023', '2024', '2025'
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
    const revenue = yearData.revenue ?? 0;
    const cogs = yearData.cogs ?? 0;
    const operatingExpenses = yearData.operatingExpenses ?? 0;
    const depreciation = yearData.depreciation ?? 0;
    const amortization = yearData.amortization ?? 0;
    const interest = yearData.interest ?? 0;
    const taxes = yearData.taxes ?? 0;
    const nonRecurringIncome = yearData.nonRecurringIncome ?? 0;
    const nonRecurringExpenses = yearData.nonRecurringExpenses ?? 0;

    const grossProfit = revenue - cogs;
    // Net Income = grossProfit - operatingExpenses
    const netIncome = grossProfit - operatingExpenses;
    // EBITDA = Net Income + Depreciation + Amortization + Interest + Taxes
    const ebitda = netIncome + depreciation + amortization + interest + taxes;
    // Adjusted EBITDA = EBITDA - Non-Recurring Income + Non-Recurring Expenses
    const adjustedEbitda = ebitda - nonRecurringIncome + nonRecurringExpenses;

    return {
        ...yearData,
        grossProfit,
        netIncome,
        ebitda,
        adjustedEbitda,
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
  const ytdKey = '2025YTD';
  // Only index into the flat financials object, which is type-safe
  const ytdMonthRaw = safeFinancials?.[ytdKey]?.ytdMonth;
  let ytdMonthName = '';
  let ytdColumnHeader = '2025 YTD';
  if (ytdMonthRaw) {
    const monthNum = parseInt(ytdMonthRaw, 10);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
      ytdMonthName = monthNames[monthNum - 1] ?? '';
      ytdColumnHeader = `2025 YTD - ${ytdMonthName}`;
    } else {
      // If user entered a string month (e.g., "March"), use it directly
      ytdColumnHeader = `2025 YTD - ${ytdMonthRaw}`;
    }
  }

  // --- User's YTD Month Input Display ---
  const usersYtdMonthInput = ytdMonthRaw || 'N/A';

  const financialYears = safeFinancials;

  // Get calculated financials for each year using safeFinancialsYears
  const financials2023 = calculateFinancials(getYearData<FinancialYearWrapped>(financialYears, '2023')?.summary ?? null); 
  const financials2024 = calculateFinancials(getYearData<FinancialYearWrapped>(financialYears, '2024')?.summary ?? null); 
  const financials2025 = calculateFinancials(getYearData<FinancialYearWrapped>(financialYears, ytdKey)?.summary ?? null); 

  // Get DSCR data for each year (DSCR structure not changed, uses safeDscr directly)
  const dscr2023 = getYearData<DscrYearData>(safeDscr, '2023'); 
  const dscr2024 = getYearData<DscrYearData>(safeDscr, '2024'); 
  const dscr2025 = getYearData<DscrYearData>(safeDscr, ytdKey); 

  const bankPreference = 1.25;

  // --- Determine which columns to show ---
  const show2023 = !isYearSkipped(financials2023);
  const show2024 = !isYearSkipped(financials2024); // 2024 cannot be skipped, but keep logic consistent
  const show2025 = !isYearSkipped(financials2025);

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

  // --- Debt Calculations --- 
  const groupedDebts: { [key: string]: DebtDetail[] } = safeDebts.reduce((acc: { [key: string]: DebtDetail[] }, debt: DebtDetail) => {
    const category = debt.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(debt);
    return acc;
  }, {});

  const totalMonthlyPayment = safeDebts.reduce((sum: number, debt: DebtDetail) => sum + Number(debt.monthlyPayment ?? 0), 0);
  const totalAnnualPayment = totalMonthlyPayment * 12;
  const totalOutstandingBalance = safeDebts.reduce((sum: number, debt: DebtDetail) => sum + Number(debt.outstandingBalance ?? 0), 0);

  // Only credit card and line of credit count toward credit balance and limit
  const totalCreditBalance = safeDebts
    .filter(debt => debt.category === 'CREDIT_CARD' || debt.category === 'LINE_OF_CREDIT')
    .reduce((sum, debt) => sum + Number(debt.outstandingBalance ?? 0), 0);
  const totalCreditLimit = safeDebts
    .filter(debt => debt.category === 'CREDIT_CARD' || debt.category === 'LINE_OF_CREDIT')
    .reduce((sum, debt) => sum + Number(debt.creditLimit ?? 0), 0);
  const creditUtilization = totalCreditLimit > 0 ? (totalCreditBalance / totalCreditLimit) : 0;

  // --- Component Rendering ---

  return (
    <div className="pt-0 pb-4 px-3 bg-white rounded-lg shadow-md max-w-4xl mx-auto print:pt-0 print:mt-0">
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
          <div><strong>Estimated Term:</strong> {safeLoanInfo?.loanTerm ? `${safeLoanInfo.loanTerm} Years` : 'N/A'}</div>
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
            {show2023 && <col className="w-[23.3%]" />}
            {show2024 && <col className="w-[23.3%]" />}
            {show2025 && <col className="w-[23.3%]" />}
          </colgroup>
          <thead>
            <tr className="bg-blue-100">
              <th className="border p-0.5 text-left">Metric</th>
              {show2023 && <th className="border p-0.5 text-center">2023</th>}
              {show2024 && <th className="border p-0.5 text-center">2024</th>}
              {show2025 && <th className="border p-0.5 text-center">{ytdColumnHeader}</th>}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-green-50">
              {/* Changed label to Adjusted EBITDA */}
              <td className="border p-1 text-center">Adjusted EBITDA</td>
              {show2023 && <td className="border p-1 text-center">{formatCurrency(financials2023?.adjustedEbitda ?? 0)}</td>}
              {show2024 && <td className="border p-1 text-center">{formatCurrency(financials2024?.adjustedEbitda ?? 0)}</td>}
              {show2025 && <td className="border p-1 text-center">{formatCurrency(financials2025?.adjustedEbitda ?? 0)}</td>}
            </tr>
            <tr className="bg-orange-50">
              <td className="border p-1 text-center">Annualized Existing Debt (-)</td>
              {show2023 && <td className="border p-1 text-center">{formatCurrency(annualDebtService['2023'] ?? dscr2023?.debtService ?? 0)}</td>}
              {show2024 && <td className="border p-1 text-center">{formatCurrency(annualDebtService['2024'] ?? dscr2024?.debtService ?? 0)}</td>}
              {show2025 && <td className="border p-1 text-center">{formatCurrency(annualDebtService[ytdKey] ?? dscr2025?.debtService ?? 0)}</td>}
            </tr>
            <tr className="bg-orange-50">
              <td className="border p-1 text-center">Annualized Loan Payment (-)</td>
              {show2023 && <td className="border p-1 text-center">{formatCurrency(annualizedLoanPayments['2023'] ?? 0)}</td>}
              {show2024 && <td className="border p-1 text-center">{formatCurrency(annualizedLoanPayments['2024'] ?? safeLoanInfo?.annualizedLoan ?? 0)}</td>}
              {show2025 && <td className="border p-1 text-center">{formatCurrency(annualizedLoanPayments[ytdKey] ?? safeLoanInfo?.annualizedLoan ?? 0)}</td>}
            </tr>
            <tr className="font-semibold bg-orange-100">
              <td className="border p-1 text-center">Total Debt Service</td>
              {/* Assuming dscr.debtService already includes proposed loan payment, adjust if needed */}
              {show2023 && <td className="border p-1 text-center">{formatCurrency((annualDebtService['2023'] ?? dscr2023?.debtService ?? 0) + (annualizedLoanPayments['2023'] ?? 0))}</td>}
              {show2024 && <td className="border p-1 text-center">{formatCurrency((annualDebtService['2024'] ?? dscr2024?.debtService ?? 0) + (annualizedLoanPayments['2024'] ?? safeLoanInfo?.annualizedLoan ?? 0))}</td>}
              {show2025 && <td className="border p-1 text-center">{formatCurrency((annualDebtService[ytdKey] ?? dscr2025?.debtService ?? 0) + (annualizedLoanPayments[ytdKey] ?? safeLoanInfo?.annualizedLoan ?? 0))}</td>}
            </tr>
            <tr className="bg-blue-100 font-bold">
              <td className="border p-1 text-center">Business DSCR</td>
              {show2023 && renderDSCRCell((financials2023?.adjustedEbitda ?? 0) / ((annualDebtService['2023'] ?? dscr2023?.debtService ?? 0) + (annualizedLoanPayments['2023'] ?? 0)), 'p-1')}
              {show2024 && renderDSCRCell((financials2024?.adjustedEbitda ?? 0) / ((annualDebtService['2024'] ?? dscr2024?.debtService ?? 0) + (annualizedLoanPayments['2024'] ?? safeLoanInfo?.annualizedLoan ?? 0)), 'p-1')}
              {show2025 && renderDSCRCell((financials2025?.adjustedEbitda ?? 0) / ((annualDebtService[ytdKey] ?? dscr2025?.debtService ?? 0) + (annualizedLoanPayments[ytdKey] ?? safeLoanInfo?.annualizedLoan ?? 0)), 'p-1')}
            
            </tr>
          </tbody>
        </table>
        <p className="text-sm text-center text-gray-600 mt-2">
          Bank Preference: At Least {bankPreference.toFixed(2)}x
        </p>
      </section>
      {/* --- Understanding Your Debt Service Coverage Ratio (DSCR) - 2024 (Optimized) --- */}
      <section className="mb-2 print:mb-1">
        <h3 className="text-lg font-semibold border-b pb-1 mb-1">Understanding Your DSCR for 2024</h3>
        <div className="bg-white rounded-xl shadow-md p-3 md:p-4 flex flex-col md:flex-row print:flex-row gap-4 items-stretch">
          {/* Gauge and Score */}
          <div className="md:w-1/3 print:w-1/3 flex flex-col items-center justify-center mb-6 md:mb-0">
            <DscrGauge value={
  (financials2024?.adjustedEbitda ?? 0) /
  ((annualDebtService['2024'] ?? dscr2024?.debtService ?? 0) + (annualizedLoanPayments['2024'] ?? safeLoanInfo?.annualizedLoan ?? 0))
} />
            {safeDscr['2024']?.dscr !== undefined && safeDscr['2024']?.dscr !== null && (
              <div className="mt-2 flex flex-col items-center">
                <div className="border-l-4 border-blue-400 bg-blue-50 p-2 w-full">
                  <span className="block text-sm text-blue-900 font-semibold mb-1">How We Calculated Your Score:</span>
                  {safeDscr['2024'] && (financials2024?.adjustedEbitda ?? safeDscr['2024']?.noi) && safeDscr['2024']?.totalDebtService ? (
                    <span className="block text-blue-900 text-sm">
                      <span className="font-bold">DSCR = Adjusted EBITDA ÷ Total Debt Service</span><br/>
                      <span className="text-xs text-blue-700">(Business cash flow divided by all debt payments for the year)</span><br/>
                      <span className="block mt-1">
                        {formatCurrency(financials2024?.adjustedEbitda ?? safeDscr['2024']?.noi ?? 0)}
                        <span className="mx-2 text-blue-700 font-bold">÷</span>
                        {formatCurrency(safeDscr['2024'].totalDebtService)}
                        <span className="mx-2 text-blue-700 font-bold">=</span>
                        <span className="font-bold text-blue-900">{(safeDscr['2024'].dscr ?? 0).toFixed(2)}</span>
                      </span>
                    </span>
                  ) : (
                    <span className="block text-blue-900 text-sm">Calculation data not available.</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Explanation and Calculation */}
          <div className="md:w-2/3 print:w-2/3 flex flex-col">
            {safeDscr['2024']?.dscr !== undefined && safeDscr['2024']?.dscr !== null && (
              <div className="mb-2 text-base font-bold text-center" style={{
                color:
                  safeDscr['2024'].dscr >= 1.25
                    ? '#15803d' // green-700
                    : safeDscr['2024'].dscr >= 1.0
                    ? '#b45309' // yellow-700
                    : '#b91c1c', // red-700
              }}>
                {safeDscr['2024'].dscr >= 1.25 && (
                  <>Great job! Your 2024 DSCR of <span className="font-bold">{safeDscr['2024'].dscr.toFixed(2)}x</span> is strong and meets or exceeds most lender requirements.</>
                )}
                {safeDscr['2024'].dscr >= 1.0 && safeDscr['2024'].dscr < 1.25 && (
                  <>Your 2024 DSCR of <span className="font-bold">{safeDscr['2024'].dscr.toFixed(2)}x</span> covers debt payments, but consider improving it for better loan options.</>
                )}
                {safeDscr['2024'].dscr < 1.0 && (
                  <>Caution: Your 2024 DSCR of <span className="font-bold">{safeDscr['2024'].dscr.toFixed(2)}x</span> means your business may not generate enough cash to cover debt payments.</>
                )}
                {safeDscr['2024'].dscr === 1.0 && (
                  <>Your cash flow exactly matches your debt payments. Lenders may want to see a higher score for approval.</>
                )}
              </div>
            )}
            <p className="mb-2 text-gray-600 text-xs md:text-sm leading-snug">
              Your Debt Service Coverage Ratio (DSCR) shows if your business brings in enough income to pay all its debt payments. <span className="font-semibold">A score of 1.0x means for every $1 you make, you pay $1 in debts.</span> Most banks want to see at least <span className="font-semibold">1.25x</span>—so you have a safety cushion.
            </p>
            {safeDscr['2024']?.dscr !== undefined && safeDscr['2024']?.dscr !== null && (
              <>
                {safeDscr['2024'].dscr >= 1.25 && (
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
                )}
                {safeDscr['2024'].dscr >= 1.0 && safeDscr['2024'].dscr < 1.25 && (
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
                )}
                {safeDscr['2024'].dscr < 1.0 && (
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
                )}
              </>
            )}
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
            {show2023 && <col className="w-[23.3%]" />}
            {show2024 && <col className="w-[23.3%]" />}
            {show2025 && <col className="w-[23.3%]" />}
          </colgroup>
          <thead>
            <tr className="bg-green-100">
              <th className="border p-2 text-left"></th>
              {show2023 && <th className="border p-2 text-center">2023</th>}
              {show2024 && <th className="border p-2 text-center">2024</th>}
              {show2025 && <th className="border p-2 text-center">{ytdColumnHeader}</th>}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2 text-left">Revenue (Sales)</td>
              {show2023 && <td className="border p-2 text-center">{formatCurrency(getSummary('2023')?.revenue ?? 0)}</td>}
              {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.revenue ?? 0)}</td>}
              {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.revenue ?? 0)}</td>}
            </tr>
            <tr>
              <td className="border p-2 text-left">Cost of Goods Sold (-)</td>
              {show2023 && <td className="border p-2 text-center">{formatCurrency(getSummary('2023')?.cogs ?? 0)}</td>}
              {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.cogs ?? 0)}</td>}
              {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.cogs ?? 0)}</td>}
            </tr>
            <tr className="font-semibold bg-gray-50">
              <td className="border p-2 text-left">Gross Profit</td>
              {show2023 && <td className="border p-2 text-center">{formatCurrency(getSummary('2023')?.grossProfit ?? 0)}</td>}
              {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.grossProfit ?? 0)}</td>}
              {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.grossProfit ?? 0)}</td>}
            </tr>
            <tr>
              <td className="border p-2 text-left">Operating Expenses (-)</td>
              {show2023 && <td className="border p-2 text-center">{formatCurrency(getSummary('2023')?.operatingExpenses ?? 0)}</td>}
              {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.operatingExpenses ?? 0)}</td>}
              {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.operatingExpenses ?? 0)}</td>}
            </tr>
            <tr className="font-semibold bg-gray-50">
              <td className="border p-2 text-left">Net Income</td>
              {show2023 && (
                <td className="border p-2 text-center">
                  {formatCurrency(getSummary('2023')?.netIncome ?? 0)}
                </td>
              )}
              {show2024 && (
                <td className="border p-2 text-center">
                  {formatCurrency(getSummary('2024')?.netIncome ?? 0)}
                </td>
              )}
              {show2025 && (
                <td className="border p-2 text-center">
                  {formatCurrency(getSummary(ytdKey)?.netIncome ?? 0)}
                </td>
              )}
            </tr>
            <tr>
              <td className="border p-2 text-left">Interest (+)</td>
              {show2023 && <td className="border p-2 text-center">{formatCurrency(getSummary('2023')?.interest ?? 0)}</td>}
              {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.interest ?? 0)}</td>}
              {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.interest ?? 0)}</td>}
            </tr>
            <tr>
              <td className="border p-2 text-left">Taxes (+)</td>
              {show2023 && <td className="border p-2 text-center">{formatCurrency(getSummary('2023')?.taxes ?? 0)}</td>}
              {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.taxes ?? 0)}</td>}
              {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.taxes ?? 0)}</td>}
            </tr>
            <tr>
              <td className="border p-2 text-left">Depreciation (+)</td>
              {show2023 && <td className="border p-2 text-center">{formatCurrency(getSummary('2023')?.depreciation ?? 0)}</td>}
              {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.depreciation ?? 0)}</td>}
              {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.depreciation ?? 0)}</td>}
            </tr>
            <tr>
              <td className="border p-2 text-left">Amortization (+)</td>
              {show2023 && <td className="border p-2 text-center">{formatCurrency(getSummary('2023')?.amortization ?? 0)}</td>}
              {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.amortization ?? 0)}</td>}
              {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.amortization ?? 0)}</td>}
            </tr>
            <tr className="font-bold bg-green-100">
              <td className="border p-2 text-left">EBITDA</td>
              {show2023 && <td className="border p-2 text-center">{formatCurrency(getSummary('2023')?.ebitda ?? 0)}</td>}
              {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.ebitda ?? 0)}</td>}
              {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.ebitda ?? 0)}</td>}
            </tr>
            <tr>
  <td className="border p-2 text-left">Non-Recurring Income (-)</td>
  {show2023 && <td className="border p-2 text-center">{formatCurrency(getSummary('2023')?.nonRecurringIncome ?? 0)}</td>}
  {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.nonRecurringIncome ?? 0)}</td>}
  {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.nonRecurringIncome ?? 0)}</td>}
</tr>
<tr>
  <td className="border p-2 text-left">Non-Recurring Expenses (+)</td>
  {show2023 && <td className="border p-2 text-center">{formatCurrency(getSummary('2023')?.nonRecurringExpenses ?? 0)}</td>}
  {show2024 && <td className="border p-2 text-center">{formatCurrency(getSummary('2024')?.nonRecurringExpenses ?? 0)}</td>}
  {show2025 && <td className="border p-2 text-center">{formatCurrency(getSummary(ytdKey)?.nonRecurringExpenses ?? 0)}</td>}
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
  {show2023 && (
    <td className="border p-2 text-center font-bold">
      {formatCurrency((getSummary('2023')?.ebitda ?? 0)
        - (getSummary('2023')?.nonRecurringIncome ?? 0)
        + (getSummary('2023')?.nonRecurringExpenses ?? 0))}
    </td>
  )}
  {show2024 && (
    <td className="border p-2 text-center font-bold">
      {formatCurrency((getSummary('2024')?.ebitda ?? 0)
        - (getSummary('2024')?.nonRecurringIncome ?? 0)
        + (getSummary('2024')?.nonRecurringExpenses ?? 0))}
    </td>
  )}
  {show2025 && (
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
      <section className="mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-green-50 border-l-4 border-blue-400 rounded-xl shadow p-6 md:p-8 flex flex-col gap-4">
          <div className="flex items-center mb-2">
            <InfoIcon className="w-5 h-5 text-blue-600 mr-2" />
            <h4 className="text-lg md:text-xl font-bold text-blue-900">
              Net Income, EBITDA, & Adjusted EBITDA: Why They Matter for Your Loan
            </h4>
          </div>
          <div className="flex flex-col md:flex-row print:flex-row gap-4 mt-2">
            {/* Net Income Box */}
            <div className="flex-1 bg-white border-l-4 border-blue-400 rounded-xl shadow p-5 flex flex-col items-start hover:shadow-lg transition-shadow duration-200 print:border-blue-400">
              <div className="flex items-center mb-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-2">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M4 12h16M4 12l4-4m-4 4l4 4"/></svg>
                </span>
                <span className="text-base font-bold text-blue-900">Net Income</span>
              </div>
              <div className="text-gray-700 text-sm md:text-base">
                Money left after all regular costs—COGS, expenses, interest, and taxes. Shows what you truly earn from your business after everything is paid.
              </div>
            </div>
            {/* EBITDA Box */}
            <div className="flex-1 bg-white border-l-4 border-green-400 rounded-xl shadow p-5 flex flex-col items-start hover:shadow-lg transition-shadow duration-200 print:border-green-400">
              <div className="flex items-center mb-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 mr-2">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path stroke="currentColor" strokeWidth="2" d="M8 12h8"/></svg>
                </span>
                <span className="text-base font-bold text-green-900">EBITDA</span>
              </div>
              <div className="text-gray-700 text-sm md:text-base">
                Earnings before interest, taxes, depreciation, and amortization. Shows core operating cash flow, ignoring non-cash and non-operating items.
              </div>
            </div>
            {/* Adjusted EBITDA Box */}
            <div className="flex-1 bg-white border-l-4 border-yellow-400 rounded-xl shadow p-5 flex flex-col items-start hover:shadow-lg transition-shadow duration-200 print:border-yellow-400">
              <div className="flex items-center mb-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 mr-2">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 6v6l4 2"/></svg>
                </span>
                <span className="text-base font-bold text-yellow-900">Adjusted EBITDA</span>
              </div>
              <div className="text-gray-700 text-sm md:text-base">
                Starts with EBITDA, then adjusts for unusual, one-time income/expenses. Lenders use this to judge your true, recurring earning power for loans.
              </div>
            </div>
          </div>
          <p className="text-sm md:text-base text-blue-900 font-semibold">
            <span className="font-bold">Why do lenders care about these metrics?</span> They want to know your business's ability to generate cash and repay loans. Net income shows your profitability, EBITDA highlights your core cash flow, and Adjusted EBITDA gives a clearer picture of your sustainable earning power.
          </p>
        </div>
      </section>
      <div className="page-break" />
      {/* --- Business Debt Summary --- */}
      <section className="mb-8 print:mb-4">
        <h3 className="text-2xl font-bold text-center mb-2 border-b pb-2 tracking-wide print:text-base print:pb-1 print:mb-2">BUSINESS DEBT SUMMARY</h3>
        <div className="text-center text-base text-gray-700 mb-6 print:text-sm">
          <div><span className="font-semibold">Prepared for:</span> {safeLoanInfo.businessName || '__________'}</div>
          <div><span className="font-semibold">As of:</span> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        {/* --- Debt Service & Credit Metrics Summary --- */}
        <div className="mt-6">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-blue-50">
                <th className="border p-2 text-center font-semibold">
                  <span className="flex items-center gap-0.5">
                    Monthly Debt Service
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1 cursor-pointer text-blue-500">&#9432;</span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Total of all monthly debt payments. Key for banks to assess if your business can handle new loan payments.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </th>
                <th className="border p-2 text-center font-semibold">
                  <span className="flex items-center gap-0.5">
                    Annual Debt Service
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1 cursor-pointer text-blue-500">&#9432;</span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Total yearly debt payments. Used to calculate DSCR and assess annual repayment burden.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </th>
                <th className="border p-2 text-center font-semibold">
                  <span className="flex items-center gap-0.5">
                    Total Credit Balance
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1 cursor-pointer text-blue-500">&#9432;</span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Sum of all outstanding balances on credit lines/cards. High balances can signal risk to lenders.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </th>
                <th className="border p-2 text-center font-semibold">
                  <span className="flex items-center gap-0.5">
                    Total Credit Limit
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1 cursor-pointer text-blue-500">&#9432;</span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Combined credit limit for all credit cards/lines. Shows your available borrowing capacity.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </th>
                <th className="border p-2 text-center font-semibold">
                  <span className="flex items-center gap-0.5">
                    Credit Utilization Rate
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1 cursor-pointer text-blue-500">&#9432;</span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Ratio of your balances to your limits. Lower is better; high utilization can hurt loan eligibility.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-blue-100 font-semibold">
                <td className="border p-2 text-center text-lg">{formatCurrency(totalMonthlyPayment)}</td>
                <td className="border p-2 text-center text-lg">{formatCurrency(totalAnnualPayment)}</td>
                <td className="border p-2 text-center text-lg">{formatCurrency(totalCreditBalance)}</td>
                <td className="border p-2 text-center text-lg">{formatCurrency(totalCreditLimit)}</td>
                <td className="border p-2 text-center text-lg">{totalCreditLimit > 0 ? formatPercentage(creditUtilization, 1) : 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Add spacing between metrics and debt entries */}
        <div className="mb-8" />
        <div className="flex flex-col gap-6 print:gap-4">
        {/* Render category tables */}
          {/* Render category tables */}
          {[
            { key: 'REAL_ESTATE', label: 'REAL ESTATE', columns: ['Property Address', 'Monthly Payment', 'Original Loan Amount', 'Outstanding Balance', 'Notes'] },
            { key: 'CREDIT_CARD', label: 'CREDIT CARD', columns: ['Name of Lender', 'Monthly Payment', 'Credit Limit', 'Outstanding Balance', 'Notes'] },
            { key: 'VEHICLE_EQUIPMENT', label: 'VEHICLE / EQUIPMENT', columns: ['Description', 'Monthly Payment', 'Original Loan Amount', 'Outstanding Balance', 'Notes'] },
            { key: 'LINE_OF_CREDIT', label: 'LINE OF CREDIT', columns: ['Name of Lender', 'Monthly Payment', 'Credit Limit', 'Outstanding Balance', 'Notes'] },
            { key: 'OTHER_DEBT', label: 'OTHER DEBT', columns: ['Description', 'Monthly Payment', 'Original Loan Amount', 'Outstanding Balance', 'Notes'] },
          ].map(({ key, label, columns }) => {
            const debtsInCat = groupedDebts[key] || [];
            if (debtsInCat.length === 0) return null;
            return (
              <div key={key}>
                <div className="font-semibold text-blue-900 bg-blue-50 px-2 py-1 rounded-t border border-b-0">{label}</div>
                <table className="w-full border-collapse border text-sm md:text-base">
                  <colgroup>
  <col className="w-[26%]" />
  <col className="w-[11%]" />
  <col className="w-[14%]" />
  <col className="w-[14%]" />
  <col className="w-[21%]" />
</colgroup>
                  <thead>
                    <tr className="bg-gray-100">
                      {columns.map((col, idx) => {
                        // Center columns 1, 2, 3 (Monthly Payment, Original Loan Amount/Credit Limit, Outstanding Balance)
                        const centerCols = [1, 2, 3];
                        return (
                          <th
                            key={col}
                            className={`border p-0.5 font-semibold ${centerCols.includes(idx) ? 'text-center' : 'text-left'}`}
                          >
                            {col === 'Outstanding Balance' ? (
                              <span>Outstanding<br/>Balance</span>
                            ) : col === 'Original Loan Amount' ? (
                              <span>Original<br/>Loan Amount</span>
                            ) : col === 'Credit Limit' ? (
                              <span>Credit<br/>Limit</span>
                            ) : col}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {debtsInCat.map((debt, i) => (
                      <tr key={i} className={i % 2 ? 'bg-gray-50' : ''}>
                        <td className="border p-0.5">{debt.lenderName ?? debt.description ?? debt.debtType ?? '-'}</td>
                        <td className="border p-0.5 text-center">{formatCurrency(Number(debt.monthlyPayment))}</td>
                        <td className="border p-0.5 text-center">{key.includes('CREDIT') ? formatCurrency(Number(debt.creditLimit)) : formatCurrency(Number(debt.originalLoanAmount))}</td>
                        <td className="border p-0.5 text-center">{formatCurrency(Number(debt.outstandingBalance))}</td>
                        <td className="border p-0.5">{debt.notes ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
        {/* --- Category Summary Table --- */}
        <div className="mt-8 max-w-xl mx-auto">
          <table className="w-full border-collapse text-sm">
            <colgroup>
              <col className="w-[48%]" />
              <col className="w-[26%]" />
              <col className="w-[26%]" />
            </colgroup>
            <thead>
              <tr className="bg-blue-100">
                <th className="border p-2 text-left">Business Debt</th>
                <th className="border p-2 text-center">Monthly Payment</th>
                <th className="border p-2 text-center">Annual Payment</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Total Real Estate', key: 'REAL_ESTATE' },
                { label: 'Total Credit Card', key: 'CREDIT_CARD' },
                { label: 'Total Vehicle / Equipment', key: 'VEHICLE_EQUIPMENT' },
                { label: 'Total Line of Credit', key: 'LINE_OF_CREDIT' },
                { label: 'Total Other Debt', key: 'OTHER_DEBT' },
              ].map(({ label, key }) => {
                const debtsInCat = groupedDebts[key] || [];
                const monthly = debtsInCat.reduce((sum, d) => sum + Number(d.monthlyPayment ?? 0), 0);
                const annual = monthly * 12;
                return (
                  <tr key={key}>
                    <td className="border p-2 text-left">{label}</td>
                    <td className="border p-2 text-center">{formatCurrency(monthly)}</td>
                    <td className="border p-2 text-center">{formatCurrency(annual)}</td>
                  </tr>
                );
              })}
              {/* Final total row */}
              <tr className="bg-orange-100 font-bold">
                <td className="border p-2 text-left">Total Existing Debt:</td>
                <td className="border p-2 text-center font-bold">{formatCurrency(totalMonthlyPayment)}</td>
                <td className="border p-2 text-center font-bold">{formatCurrency(totalAnnualPayment)}</td>
              </tr>
            </tbody>
          </table>
        </div>
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
