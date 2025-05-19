import { Button } from "@/app/(components)/ui/button";
import { Card } from "@/app/(components)/ui/card";
import { Checkbox } from "@/app/(components)/ui/checkbox";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import type { Debt } from "@/app/(components)/BusinessDebtsStep";
import type { FullFinancialData, NumericFinancialData } from "./FinancialsStep";
import { calculateDSCR } from './ReviewSubmitStep.dscr';
import { supabase } from "@/supabase/helpers/client";
import { calculateDebtSummary, calculateDSCR as calculateDSCRUtil } from "@/lib/financial/calculations";

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
    year2023: { input: FullFinancialData; summary: NumericFinancialData };
    year2024: { input: FullFinancialData; summary: NumericFinancialData };
    year2025YTD: { input: FullFinancialData; summary: NumericFinancialData; ytdMonth?: string };
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
  onBack,
  onSubmit,
  submitStatus,
  submitError,
  pdfUrls,

  onSaveDraft,
  onConfirmChange,
}: ReviewSubmitStepProps) {
  // SSR-safe: do not use window/localStorage in state initializers
  // All state is initialized to deterministic values
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  // If you need to hydrate from browser, do it in useEffect (none needed here)

  // Helper to get the number of months for YTD (from month string)
  const getYTDMonthNumber = () => {
    const ytdMonth = financials.year2025YTD?.ytdMonth;
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
  const getAnnualizedLoanPayment = (year: '2023' | '2024' | '2025YTD') => {
    if (year === '2023') return 0;
    if (year === '2024') return Number(loanInfo.annualizedLoan) || 0;
    if (year === '2025YTD') {
      const months = getYTDMonthNumber();
      if (!months) return 0;
      return ((Number(loanInfo.annualizedLoan) || 0) * months) / 12;
    }
    return 0;
  };

  // Helper to get annual debt service for each year
  const getAnnualDebtService = (year: '2023' | '2024' | '2025YTD') => {
    if (year === '2023' || year === '2024') {
      return debts.reduce((sum, d) => sum + (parseFloat(d.monthlyPayment.replace(/[^\d.]/g, '')) || 0), 0) * 12;
    }
    if (year === '2025YTD') {
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
      '2023': getAnnualDebtService('2023'),
      '2024': getAnnualDebtService('2024'),
      '2025YTD': getAnnualDebtService('2025YTD')
    },
    {
      '2023': getAnnualizedLoanPayment('2023'),
      '2024': getAnnualizedLoanPayment('2024'),
      '2025YTD': getAnnualizedLoanPayment('2025YTD')
    }
  );

  // Fix DSCR lint: map dscr object to correct keys for table rendering
  const dscrTable: Record<'2023' | '2024' | '2025YTD', number | null> = {
    '2023': dscr.dscr2023 ?? null,
    '2024': dscr.dscr2024 ?? null,
    '2025YTD': dscr.dscr2025 ?? null, 
  };

  // --- Helper to convert FinancialYearData for backend/db (adds adjustedEbitda, netIncome, etc.)
  function prepareFinancialSummary(yearData: any): any {
    if (!yearData) return {};
    // Coerce all fields to numbers for correct calculations
    const toNum = (v: any) => typeof v === 'string' ? parseFloat(v.replace(/[^\d.-]/g, '')) || 0 : (typeof v === 'number' ? v : 0);
    const revenue = toNum(yearData.revenue);
    const cogs = toNum(yearData.cogs);
    const operatingExpenses = toNum(yearData.operatingExpenses);
    const depreciation = toNum(yearData.depreciation);
    const amortization = toNum(yearData.amortization);
    const interest = toNum(yearData.interest);
    const taxes = toNum(yearData.taxes);
    const nonRecurringIncome = toNum(yearData.nonRecurringIncome);
    const nonRecurringExpenses = toNum(yearData.nonRecurringExpenses);
    const grossProfit = revenue - cogs;
    const netIncome = grossProfit - operatingExpenses;
    const ebitda = netIncome + depreciation + amortization + interest + taxes;
    const adjustedEbitda = ebitda - nonRecurringIncome + nonRecurringExpenses;
    return {
      ...yearData,
      grossProfit,
      netIncome,
      ebitda,
      adjustedEbitda,
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
      // Calculate debt summary
      const debtSummary = (() => {
        const base = calculateDebtSummary(debts || []);
        const ytdMonth = financials.year2025YTD?.ytdMonth;
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
        return {
          ...base,
          totalDebtService: {
            ...base.totalDebtService,
            '2025YTD': getAnnualDebtService('2025YTD'),
          },
        };
      })();
      const ytdMonth = financials.year2025YTD?.ytdMonth;
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
      const annualizedLoan = Number(loanInfo.annualizedLoan) || 0;
      const annualizedLoanPayments = {
        '2023': 0,
        '2024': annualizedLoan,
        '2025YTD': ytdMonthNum ? (annualizedLoan * ytdMonthNum) / 12 : 0,
      };
      const annualDebtServices = {
        '2023': getAnnualDebtService('2023'),
        '2024': getAnnualDebtService('2024'),
        '2025YTD': getAnnualDebtService('2025YTD'),
      };
      const dscrs = calculateDSCR(financials, annualDebtServices, annualizedLoanPayments);
      const totalDebtService = {
        '2023': annualDebtServices['2023'] + annualizedLoanPayments['2023'],
        '2024': annualDebtServices['2024'] + annualizedLoanPayments['2024'],
        '2025YTD': debtSummary.totalDebtService['2025YTD'] + annualizedLoanPayments['2025YTD'],
      };
      // Compose the debts object for JSONB
      const debtsJson = {
        entries: debts || [],
        monthlyDebtService: debtSummary.monthlyDebtService,
        annualDebtService: {
          '2023': annualDebtServices['2023'],
          '2024': annualDebtServices['2024'],
          '2025YTD': annualDebtServices['2025YTD'],
        },
        // --- Add annualDebtServices for legacy compatibility ---
        annualDebtServices: {
          '2023': annualDebtServices['2023'],
          '2024': annualDebtServices['2024'],
          '2025YTD': annualDebtServices['2025YTD'],
        },
        totalCreditBalance: debtSummary.totalCreditBalance,
        totalCreditLimit: debtSummary.totalCreditLimit,
        creditUtilizationRate: debtSummary.creditUtilizationRate,
        categoryTotals: debtSummary.categoryTotals,
        totalDebtService,
        // --- Ensure annualizedLoanPayments is included ---
        annualizedLoanPayments,
      };
      // Also upsert at the top level for easy querying
      const summary2023 = prepareFinancialSummary(financials.year2023?.summary);
      const summary2024 = prepareFinancialSummary(financials.year2024?.summary);
      const summary2025YTD = prepareFinancialSummary(financials.year2025YTD?.summary);
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
          year2023: { ...financials.year2023, summary: summary2023 },
          year2024: { ...financials.year2024, summary: summary2024 },
          year2025YTD: { ...financials.year2025YTD, summary: summary2025YTD },
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
    const debtSummary = (() => {
      const base = calculateDebtSummary(debts || []);
      const ytdMonth = financials.year2025YTD?.ytdMonth;
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
      return {
        ...base,
        totalDebtService: {
          ...base.totalDebtService,
          '2025YTD': getAnnualDebtService('2025YTD'),
        },
      };
    })();
    const ytdMonth = financials.year2025YTD?.ytdMonth;
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
    // Calculate annualized loan payments
    const annualizedLoanPayments = {
      '2023': getAnnualizedLoanPayment('2023'),
      '2024': getAnnualizedLoanPayment('2024'),
      '2025YTD': getAnnualizedLoanPayment('2025YTD'),
    };
    // Calculate annual debt service
    const annualDebtServices = {
      '2023': getAnnualDebtService('2023'),
      '2024': getAnnualDebtService('2024'),
      '2025YTD': getAnnualDebtService('2025YTD'),
    };
    // Calculate DSCRs
    const dscrs = calculateDSCR(financials, annualDebtServices, annualizedLoanPayments);
    // Compose the debts object for JSONB
    const debtsJson = {
      entries: debts || [],
      monthlyDebtService: debtSummary.monthlyDebtService,
      annualDebtService: {
        '2023': annualDebtServices['2023'],
        '2024': annualDebtServices['2024'],
        '2025YTD': annualDebtServices['2025YTD'],
      },
      // --- Add annualDebtServices for legacy compatibility ---
      annualDebtServices: {
        '2023': annualDebtServices['2023'],
        '2024': annualDebtServices['2024'],
        '2025YTD': annualDebtServices['2025YTD'],
      },
      totalCreditBalance: debtSummary.totalCreditBalance,
      totalCreditLimit: debtSummary.totalCreditLimit,
      creditUtilizationRate: debtSummary.creditUtilizationRate,
      categoryTotals: debtSummary.categoryTotals,
      totalDebtService: {
        '2023': annualDebtServices['2023'] + annualizedLoanPayments['2023'],
        '2024': annualDebtServices['2024'] + annualizedLoanPayments['2024'],
        '2025YTD': debtSummary.totalDebtService['2025YTD'] + annualizedLoanPayments['2025YTD'],
      },
      // --- Ensure annualizedLoanPayments is included ---
      annualizedLoanPayments,
    };
    // Compose upsertData
    const summary2023 = prepareFinancialSummary(financials.year2023?.summary);
    const summary2024 = prepareFinancialSummary(financials.year2024?.summary);
    const summary2025YTD = prepareFinancialSummary(financials.year2025YTD?.summary);
    const upsertData = {
      id: loanInfo?.id,
      business_name: loanInfo?.businessName,
      loan_purpose: loanInfo?.loanPurpose,
      desired_amount: loanInfo?.desiredAmount,
      estimated_payment: loanInfo?.estimatedPayment,
      annualized_loan: loanInfo?.annualizedLoan,
      email: loanInfo?.email,
      financials: {
        year2023: { ...financials.year2023, summary: summary2023 },
        year2024: { ...financials.year2024, summary: summary2024 },
        year2025YTD: { ...financials.year2025YTD, summary: summary2025YTD },
      },
      debts: debtsJson,
      dscrs,
      ytdMonthNum,
    
    };
    // Log all data to be sent
    
    
    
  }, []); // Only run on mount

  const handleSubmit = async () => {
    if (!isConfirmed) {
      setError('Please confirm that the information is accurate before submitting.');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(true);
    } catch (err) {
      setError("An error occurred while submitting your information. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    onConfirmChange?.(isConfirmed);
  }, [isConfirmed, onConfirmChange]);

  if (success) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Thank you!</h2>
        <p className="text-gray-600">
          We've received your information. You'll receive two PDF reports via email soon.
        </p>
        {/* Optionally, you may want to remove this fallback UI if always redirecting */}
      </div>
    );
  }

  return (
    <div className="py-8 px-2 md:px-0 bg-gray-50 min-h-screen">
      {/* --- Step 4 Header Section --- */}
      <div className="w-full max-w-4xl mx-auto text-center mb-10">
        <h1 className="text-2xl md:text-3xl font-extrabold text-blue-900 mb-3 tracking-tight drop-shadow-sm">Step 4: Review & Submit</h1>
        <p className="text-base text-gray-700 max-w-4xl mx-auto mb-0 leading-relaxed">
          Please review all your information below. This is your final opportunity to check your loan details and financials before submitting. Make sure everything is accurate and complete. When ready, confirm and submit your application.
        </p>
      </div>
      <Card className="p-8 md:p-10 max-w-4xl mx-auto shadow-xl space-y-10">

        <div className="mb-10">
          <h3 className="font-semibold text-xl mb-4 text-blue-800">Loan Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Business Name</label>
              <p className="font-medium">{loanInfo.businessName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Loan Purpose</label>
              <p className="font-medium">{loanInfo.loanPurpose}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Desired Amount</label>
              <p className="font-medium">{formatCurrency(loanInfo.desiredAmount)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Estimated Payment</label>
              <p className="font-medium">{formatCurrency(loanInfo.estimatedPayment)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Your Email</label>
              <p className="font-medium">{loanInfo.email || '—'}</p>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <h3 className="font-semibold text-xl mb-4 text-blue-800">Financial Information</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border rounded-lg text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2 bg-blue-50 text-left font-bold text-blue-900 border-b">Field</th>
                  <th className="px-4 py-2 bg-blue-50 text-center font-bold text-blue-900 border-b">2023</th>
                  <th className="px-4 py-2 bg-blue-50 text-center font-bold text-blue-900 border-b">2024</th>
                  <th className="px-4 py-2 bg-blue-50 text-center font-bold text-blue-900 border-b">2025 YTD</th>
                </tr>
              </thead>
              <tbody>
                <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-700 border-b">Revenue</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2023.input.revenue)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2024.input.revenue)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2025YTD.input.revenue)}</td>
                </tr>
                <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-700 border-b">COGS</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2023.input.cogs)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2024.input.cogs)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2025YTD.input.cogs)}</td>
                </tr>
                <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-700 border-b">Operating Expenses</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2023.input.operatingExpenses)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2024.input.operatingExpenses)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2025YTD.input.operatingExpenses)}</td>
                </tr>
                <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-700 border-b">Non-Recurring Income</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2023.input.nonRecurringIncome)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2024.input.nonRecurringIncome)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2025YTD.input.nonRecurringIncome)}</td>
                </tr>
                <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-700 border-b">Non-Recurring Expenses</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2023.input.nonRecurringExpenses)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2024.input.nonRecurringExpenses)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2025YTD.input.nonRecurringExpenses)}</td>
                </tr>
                <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-700 border-b">
                    Net Income (calculated)
                  </td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2023.summary.netIncome)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2024.summary.netIncome)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2025YTD.summary.netIncome)}</td>
                </tr>
                <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-700 border-b">Depreciation</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2023.input.depreciation)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2024.input.depreciation)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2025YTD.input.depreciation)}</td>
                </tr>
                <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-700 border-b">Amortization</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2023.input.amortization)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2024.input.amortization)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2025YTD.input.amortization)}</td>
                </tr>
                <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-700 border-b">Interest Expense</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2023.input.interest)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2024.input.interest)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2025YTD.input.interest)}</td>
                </tr>
                <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-700 border-b">Income Taxes</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2023.input.taxes)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2024.input.taxes)}</td>
                  <td className="px-4 py-2 text-center border-b">{formatCurrency(financials.year2025YTD.input.taxes)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-10">
          <h3 className="font-semibold text-xl mb-4 text-blue-800">Current Debts</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border rounded-lg text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 bg-blue-50 text-left font-bold text-blue-900 border-b">Description</th>
                  <th className="px-3 py-2 bg-blue-50 text-left font-bold text-blue-900 border-b">Category</th>
                  <th className="px-3 py-2 bg-blue-50 text-right font-bold text-blue-900 border-b">Monthly Payment</th>
                  <th className="px-3 py-2 bg-blue-50 text-right font-bold text-blue-900 border-b">Loan Amount</th>
                  <th className="px-3 py-2 bg-blue-50 text-right font-bold text-blue-900 border-b">Outstanding Balance</th>
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
      <div className="mt-12 mb-8 p-6 bg-gray-100 border border-gray-200 rounded-lg max-w-3xl mx-auto">
        <label className="flex items-start space-x-3 text-sm text-gray-700">
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
