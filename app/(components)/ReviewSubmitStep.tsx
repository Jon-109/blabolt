import { Card } from "@/app/(components)/ui/card";
import { Checkbox } from "@/app/(components)/ui/checkbox";
import { useState, useEffect } from "react";
import type { Debt } from "@/app/(components)/BusinessDebtsStep";
import type { FullFinancialData, NumericFinancialData } from "./FinancialsStep";
import { calculateDSCR } from './ReviewSubmitStep.dscr';
import { supabase } from "@/supabase/helpers/client";
import { buildDebtMetrics, calculateFinancialSummary } from "@/lib/financial/calculations";

interface ReviewSubmitStepProps {
  loanInfo: {
    businessName: string;
    loanPurpose: string;
    desiredAmount: number;
    estimatedPayment: number;
    annualizedLoan: number;
    email?: string;
    id?: string;
  };
  financials: {
    year2024: { input: FullFinancialData; summary: NumericFinancialData };
    year2025: { input: FullFinancialData; summary: NumericFinancialData };
    year2026YTD: { input: FullFinancialData; summary: NumericFinancialData; ytdMonth?: string };
  };
  debts: Debt[];
  categories: { id: string; name: string }[];
  onBack: () => void;
  onSubmit: () => Promise<{ submissionId?: string }>;
  submitStatus: 'idle' | 'submitting' | 'success' | 'error';
  submitError: string | null;
  pdfUrls: string | null;

  onSaveDraft: () => Promise<void>;
  onConfirmChange?: (confirmed: boolean) => void;
}

const formatCurrency = (amount: number | string | null | undefined) => {
  // Accept string or number; parse string if needed
  let num = 0;
  if (typeof amount === 'string') {
    num = parseFloat(amount.replace(/[^\d.]/g, ''));
  } else if (typeof amount === 'number') {
    num = amount;
  }
  if (!num || isNaN(num)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export function ReviewSubmitStep({
  loanInfo,
  financials,
  debts,
  categories,
  submitStatus,
  submitError,
  pdfUrls,
  onConfirmChange,
}: ReviewSubmitStepProps) {
  // SSR-safe: do not use window/localStorage in state initializers
  // All state is initialized to deterministic values
  const [error, setError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  // If you need to hydrate from browser, do it in useEffect (none needed here)

  // Helper to get the number of months for YTD (from month string)
  const getYTDMonthNumber = () => {
    const ytdMonth = financials.year2026YTD?.ytdMonth;
    if (!ytdMonth) return 0;
    // Accept both numeric (e.g. '6') and string (e.g. 'June')
    if (/^\d+$/.test(ytdMonth)) return parseInt(ytdMonth, 10);
    const monthMap: Record<string, number> = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
      'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
    };
    return monthMap[ytdMonth as keyof typeof monthMap] || 0;
  };

  // Helper to get annualized loan payment for each year
  const getAnnualizedLoanPayment = (year: '2024' | '2025' | '2026YTD') => {
    if (year === '2024') return 0;
    if (year === '2025') return Number(loanInfo.annualizedLoan) || 0;
    if (year === '2026YTD') {
      const months = getYTDMonthNumber();
      if (!months) return 0;
      return ((Number(loanInfo.annualizedLoan) || 0) * months) / 12;
    }
    return 0;
  };

  // Helper to get annual debt service for each year
  const getAnnualDebtService = (year: '2024' | '2025' | '2026YTD') => {
    if (year === '2024' || year === '2025') {
      return debts.reduce((sum, d) => sum + (parseFloat(d.monthlyPayment.replace(/[^\d.]/g, '')) || 0), 0) * 12;
    }
    if (year === '2026YTD') {
      const months = getYTDMonthNumber();
      if (!months) return 0;
      return debts.reduce((sum, d) => sum + (parseFloat(d.monthlyPayment.replace(/[^\d.]/g, '')) || 0), 0) * months;
    }
    return 0;
  };

  // Compute DSCR for each year using correct annualized values
  const dscr = calculateDSCR(
    financials,
    {
      '2024': getAnnualDebtService('2024'),
      '2025': getAnnualDebtService('2025'),
      '2026YTD': getAnnualDebtService('2026YTD')
    },
    {
      '2024': getAnnualizedLoanPayment('2024'),
      '2025': getAnnualizedLoanPayment('2025'),
      '2026YTD': getAnnualizedLoanPayment('2026YTD')
    }
  );

  // --- Helper to convert FinancialYearData for backend/db (adds adjustedEbitda, netIncome, etc.)
  function prepareFinancialSummary(yearData: any): any {
    if (!yearData) return {};
    return {
      ...yearData,
      ...calculateFinancialSummary(yearData),
    };
  }

  useEffect(() => {
    async function autosave() {
      // Fetch user id from supabase auth
      const {
        data: { session },
        error: authError
      } = await supabase.auth.getSession();
      if (authError) {
        console.error('[AUTOSAVE] Failed to get user session:', authError);
        return;
      }
      const userId = session?.user?.id;
      if (!userId) {
        console.error('[AUTOSAVE] No user id found in session');
        return;
      }
      const debtMetrics = buildDebtMetrics(debts || [], loanInfo.annualizedLoan, financials.year2026YTD?.ytdMonth);
      const ytdMonth = financials.year2026YTD?.ytdMonth;
      let ytdMonthNum = 0;
      if (ytdMonth) {
        if (/^\d+$/.test(ytdMonth)) ytdMonthNum = parseInt(ytdMonth, 10);
        else {
          const monthMap = {
            'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
            'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
          };
          ytdMonthNum = monthMap[ytdMonth as keyof typeof monthMap] || 0;
        }
      }
      const annualizedLoanPayments = debtMetrics.annualizedLoanPayments;
      const annualDebtServices = debtMetrics.annualDebtServices;
      const dscrs = calculateDSCR(financials, annualDebtServices, annualizedLoanPayments);
      const totalDebtService = debtMetrics.totalDebtService;
      // Compose the debts object for JSONB
      const debtsJson = {
        entries: debts || [],
        monthlyDebtService: debtMetrics.debtSummary.monthlyDebtService,
        annualDebtService: {
          '2024': annualDebtServices['2024'],
          '2025': annualDebtServices['2025'],
          '2026YTD': annualDebtServices['2026YTD'],
        },
        // --- Add annualDebtServices for legacy compatibility ---
        annualDebtServices: {
          '2024': annualDebtServices['2024'],
          '2025': annualDebtServices['2025'],
          '2026YTD': annualDebtServices['2026YTD'],
        },
        totalCreditBalance: debtMetrics.debtSummary.totalCreditBalance,
        totalCreditLimit: debtMetrics.debtSummary.totalCreditLimit,
        creditUtilizationRate: debtMetrics.debtSummary.creditUtilizationRate,
        categoryTotals: debtMetrics.debtSummary.categoryTotals,
        totalDebtService,
        // --- Ensure annualizedLoanPayments is included ---
        annualizedLoanPayments,
      };
      // Also upsert at the top level for easy querying
      const summary2024 = prepareFinancialSummary(financials.year2024?.summary);
      const summary2025 = prepareFinancialSummary(financials.year2025?.summary);
      const summary2026YTD = prepareFinancialSummary(financials.year2026YTD?.summary);
      const upsertData = {
        id: loanInfo?.id,
        user_id: userId, // Use the authenticated user's UID
        business_name: loanInfo?.businessName ?? '',
        loan_purpose: loanInfo?.loanPurpose ?? '',
        desired_amount: loanInfo?.desiredAmount ?? 0,
        estimated_payment: loanInfo?.estimatedPayment ?? 0,
        annualized_loan: loanInfo?.annualizedLoan ?? 0,
        debts: debtsJson,
        dscr: dscrs,
        financials: {
          year2024: { ...financials.year2024, summary: summary2024 },
          year2025: { ...financials.year2025, summary: summary2025 },
          year2026YTD: { ...financials.year2026YTD, summary: summary2026YTD },
        },
      };
      // Debug logs - only show what is being saved to Supabase
      
      
      
      // Upsert to Supabase
      // Use id if available in loanInfo, else skip autosave
      if (loanInfo?.id) {
        const { error, status, statusText, data } = await supabase
          .from("cash_flow_analyses")
          .upsert([upsertData], { onConflict: "id" });
        if (error) {
          console.error("[AUTOSAVE ERROR]", {
            error,
            status,
            statusText,
            data,
            upsertData
          });
        }
      }
    }
    if (loanInfo?.id && debts && financials) {
      autosave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanInfo?.id, debts, financials]);

  useEffect(() => {
    // On mount of review page, log everything that will be sent to DB
    // Compose the same data as autosave
    const debtMetrics = buildDebtMetrics(debts || [], loanInfo.annualizedLoan, financials.year2026YTD?.ytdMonth);
    const annualizedLoanPayments = debtMetrics.annualizedLoanPayments;
    const annualDebtServices = debtMetrics.annualDebtServices;
    // Calculate DSCRs
    const dscrs = calculateDSCR(financials, annualDebtServices, annualizedLoanPayments);
    // Compose the debts object for JSONB
    const debtsJson = {
      entries: debts || [],
      monthlyDebtService: debtMetrics.debtSummary.monthlyDebtService,
      annualDebtService: {
        '2024': annualDebtServices['2024'],
        '2025': annualDebtServices['2025'],
        '2026YTD': annualDebtServices['2026YTD'],
      },
      // --- Add annualDebtServices for legacy compatibility ---
      annualDebtServices: {
        '2024': annualDebtServices['2024'],
        '2025': annualDebtServices['2025'],
        '2026YTD': annualDebtServices['2026YTD'],
      },
      totalCreditBalance: debtMetrics.debtSummary.totalCreditBalance,
      totalCreditLimit: debtMetrics.debtSummary.totalCreditLimit,
      creditUtilizationRate: debtMetrics.debtSummary.creditUtilizationRate,
      categoryTotals: debtMetrics.debtSummary.categoryTotals,
      totalDebtService: debtMetrics.totalDebtService,
      // --- Ensure annualizedLoanPayments is included ---
      annualizedLoanPayments,
    };
    // Compose upsertData
    const summary2024 = prepareFinancialSummary(financials.year2024?.summary);
    const summary2025 = prepareFinancialSummary(financials.year2025?.summary);
    const summary2026YTD = prepareFinancialSummary(financials.year2026YTD?.summary);
    const upsertData = {
      id: loanInfo?.id,
      business_name: loanInfo?.businessName,
      loan_purpose: loanInfo?.loanPurpose,
      desired_amount: loanInfo?.desiredAmount,
      estimated_payment: loanInfo?.estimatedPayment,
      annualized_loan: loanInfo?.annualizedLoan,
      email: loanInfo?.email,
      financials: {
        year2024: { ...financials.year2024, summary: summary2024 },
        year2025: { ...financials.year2025, summary: summary2025 },
        year2026YTD: { ...financials.year2026YTD, summary: summary2026YTD },
      },
      debts: debtsJson,
      dscrs,
    };
    // Log all data to be sent
    
    
    
  }, []); // Only run on mount

  useEffect(() => {
    onConfirmChange?.(isConfirmed);
  }, [isConfirmed, onConfirmChange]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-sm leading-6 text-slate-700">
        Review every section the same way a lender will: request details first, operating performance next, then current debt obligations. This is the final checkpoint before the analysis is generated.
      </div>
      <Card className="mx-auto max-w-5xl space-y-10 border-slate-200 p-6 shadow-[0_16px_35px_-24px_rgba(15,23,42,0.3)] md:p-8">

        <div className="mb-10">
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Request Summary</div>
            <h3 className="mt-1 text-xl font-bold text-slate-900">Loan Information</h3>
          </div>
          <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-slate-500">Business Name</label>
              <p className="font-medium text-slate-900">{loanInfo.businessName}</p>
            </div>
            <div>
              <label className="text-sm text-slate-500">Loan Purpose</label>
              <p className="font-medium text-slate-900">{loanInfo.loanPurpose}</p>
            </div>
            <div>
              <label className="text-sm text-slate-500">Desired Amount</label>
              <p className="font-medium text-slate-900">{formatCurrency(loanInfo.desiredAmount)}</p>
            </div>
            <div>
              <label className="text-sm text-slate-500">Estimated Payment</label>
              <p className="font-medium text-slate-900">{formatCurrency(loanInfo.estimatedPayment)}</p>
            </div>
            <div>
              <label className="text-sm text-slate-500">Your Email</label>
              <p className="font-medium text-slate-900">{loanInfo.email || '—'}</p>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Operating Performance</div>
            <h3 className="mt-1 text-xl font-bold text-slate-900">Financial Information</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full overflow-hidden rounded-2xl border border-slate-200 text-sm">
              <thead>
                <tr>
                  <th className="border-b bg-slate-100 px-4 py-2 text-left font-bold text-slate-900">Field</th>
                  <th className="border-b bg-slate-100 px-4 py-2 text-center font-bold text-slate-900">2024</th>
                  <th className="border-b bg-slate-100 px-4 py-2 text-center font-bold text-slate-900">2025</th>
                  <th className="border-b bg-slate-100 px-4 py-2 text-center font-bold text-slate-900">2026 YTD</th>
                </tr>
              </thead>
              <tbody>
                <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-700 border-b">Revenue</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2024.input.revenue)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2025.input.revenue)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2026YTD.input.revenue)}</td>
                </tr>
                <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-700 border-b">COGS</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2024.input.cogs)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2025.input.cogs)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2026YTD.input.cogs)}</td>
                </tr>
                <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-700 border-b">Operating Expenses</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2024.input.operatingExpenses)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2025.input.operatingExpenses)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2026YTD.input.operatingExpenses)}</td>
                </tr>
                <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-700 border-b">Non-Recurring Income</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2024.input.nonRecurringIncome)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2025.input.nonRecurringIncome)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2026YTD.input.nonRecurringIncome)}</td>
                </tr>
                <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-700 border-b">Non-Recurring Expenses</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2024.input.nonRecurringExpenses)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2025.input.nonRecurringExpenses)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2026YTD.input.nonRecurringExpenses)}</td>
                </tr>
                <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-700 border-b">
                    Net Income (calculated)
                  </td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2024.summary.netIncome)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2025.summary.netIncome)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2026YTD.summary.netIncome)}</td>
                </tr>
                <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-700 border-b">Depreciation</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2024.input.depreciation)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2025.input.depreciation)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2026YTD.input.depreciation)}</td>
                </tr>
                <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-700 border-b">Amortization</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2024.input.amortization)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2025.input.amortization)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2026YTD.input.amortization)}</td>
                </tr>
                <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-700 border-b">Interest Expense</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2024.input.interest)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2025.input.interest)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2026YTD.input.interest)}</td>
                </tr>
                <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-700 border-b">Income Taxes</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2024.input.taxes)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2025.input.taxes)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2026YTD.input.taxes)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-10">
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Obligations</div>
            <h3 className="mt-1 text-xl font-bold text-slate-900">Current Debts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full overflow-hidden rounded-2xl border border-slate-200 text-sm">
              <thead>
                <tr>
                  <th className="border-b bg-slate-100 px-3 py-2 text-left font-bold text-slate-900">Description</th>
                  <th className="border-b bg-slate-100 px-3 py-2 text-left font-bold text-slate-900">Category</th>
                  <th className="border-b bg-slate-100 px-3 py-2 text-right font-bold text-slate-900">Monthly Payment</th>
                  <th className="border-b bg-slate-100 px-3 py-2 text-right font-bold text-slate-900">Loan Amount</th>
                  <th className="border-b bg-slate-100 px-3 py-2 text-right font-bold text-slate-900">Outstanding Balance</th>
                </tr>
              </thead>
              <tbody>
                {debts.map((debt, index) => {
                  // Map category ID to display name
                  const categoryName = (categories.find(c => c.id === debt.category)?.name) || debt.category;
                  return (
                    <tr key={index} className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                      <td className="px-3 py-2 border-b truncate max-w-xs">{debt.description || '—'}</td>
                      <td className="px-3 py-2 border-b">{categoryName}</td>
                      <td className="px-3 py-2 border-b text-right">{formatCurrency(debt.monthlyPayment)}</td>
                      <td className="px-3 py-2 border-b text-right">{formatCurrency(debt.originalLoanAmount)}</td>
                      <td className="px-3 py-2 border-b text-right">{formatCurrency(debt.outstandingBalance)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Confirmation Section */}
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <label className="flex items-start space-x-3 text-sm text-slate-700">
          <Checkbox checked={isConfirmed} onCheckedChange={(v) => setIsConfirmed(!!v)} />
          <span>
            I confirm that the information provided above is accurate to the best of my knowledge. I understand that the analysis and recommendations are based on my inputs and do not constitute a loan approval or commitment.
          </span>
        </label>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}
      {submitStatus === 'success' && (
        <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-md text-green-800">
          <p className="font-semibold">Generating your report, please wait...</p>
          {pdfUrls && (
            <p className="mt-2">
              You can download a copy of your submission: 
            </p>
          )}
        </div>
      )}
      {submitStatus === 'error' && (
        <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md text-red-800">
          <p className="font-semibold">Submission Failed</p>
          <p>{submitError || "An unknown error occurred. Please check your connection and try again."}</p>
        </div>
      )}
    </div>
  );
}
