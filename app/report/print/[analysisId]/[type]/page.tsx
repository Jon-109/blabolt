import { notFound } from 'next/navigation';
import { getCashFlowAnalysisById } from '@/lib/getCashFlowAnalysisById';
import { createClient } from '@/supabase/helpers/server';
import { cookies as nextCookies } from 'next/headers';
import CashFlowReport from '@/app/(components)/CashFlowReport';
import BusinessDebtSummary from '@/app/(components)/cash-flow/BusinessDebtSummary';
import './print-report.css';
// Next.js Image can use public/ images via /images/ path
const logoPath = '/images/BusLendAdv_Final_4c.jpg';
import Image from 'next/image';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

interface PrintPageProps {
  params: { analysisId: string; type: 'full' | 'summary' };
  searchParams?: { token?: string };
}

export default async function PrintReportPage({ params, searchParams }: PrintPageProps) {
  const { analysisId, type } = params;
  let supabase;
  // If a token is present in the query, use it to create the client (for SSR PDF gen)
  if (searchParams && searchParams.token) {
    const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = process.env;
    supabase = createSupabaseClient(
      NEXT_PUBLIC_SUPABASE_URL!,
      NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${searchParams.token}` } } }
    );
  } else {
    // Normal browser/server-side rendering
    supabase = createClient(await nextCookies());
  }
  const raw: any = await getCashFlowAnalysisById(analysisId, supabase);
  
  if (!raw || Object.values(raw).every((v) => v == null || v === '' || (typeof v === 'object' && Object.keys(v).length === 0))) {
    console.warn('No analysis found or all fields empty for analysisId:', analysisId);
    // Show a visible message for debugging in addition to notFound
    return <div style={{color: 'red', padding: 32}}>ERROR: No analysis data found or all fields empty for ID: {analysisId}.<br/>Check Supabase fetch, authentication, and data presence.</div>;
  }
  // --- Transform data to match report preview logic ---
  // Helper to parse currency
  const parseCurrency = (value: string | number | undefined | null): number => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return 0;
    return parseFloat(value.replace(/[$,]/g, '')) || 0;
  };

  // Transform LoanInfo (already correct)
  const finalLoanInfo = raw.loanInfo;

  // Transform Financials
  const transformedFinancials: any = {};
  if (raw.financials) {
    for (const yearKey of Object.keys(raw.financials)) {
      const rawYearData = raw.financials[yearKey];
      transformedFinancials[yearKey] = {
        input: {
          revenue: parseCurrency(rawYearData?.input?.revenue),
          cogs: parseCurrency(rawYearData?.input?.cogs),
          operatingExpenses: parseCurrency(rawYearData?.input?.operatingExpenses),
          nonRecurringIncome: parseCurrency(rawYearData?.input?.nonRecurringIncome),
          nonRecurringExpenses: parseCurrency(rawYearData?.input?.nonRecurringExpenses),
          depreciation: parseCurrency(rawYearData?.input?.depreciation),
          amortization: parseCurrency(rawYearData?.input?.amortization),
          interest: parseCurrency(rawYearData?.input?.interest),
          taxes: parseCurrency(rawYearData?.input?.taxes),
        },
        summary: {
          revenue: rawYearData?.summary?.revenue ?? parseCurrency(rawYearData?.input?.revenue) ?? 0,
          cogs: rawYearData?.summary?.cogs ?? parseCurrency(rawYearData?.input?.cogs) ?? 0,
          grossProfit: rawYearData?.summary?.grossProfit ?? (rawYearData?.summary?.revenue ?? parseCurrency(rawYearData?.input?.revenue) ?? 0) - (rawYearData?.summary?.cogs ?? parseCurrency(rawYearData?.input?.cogs) ?? 0),
          operatingExpenses: rawYearData?.summary?.operatingExpenses ?? parseCurrency(rawYearData?.input?.operatingExpenses) ?? 0,
          netIncome: rawYearData?.summary?.netIncome ?? 0,
          nonRecurringIncome: rawYearData?.summary?.nonRecurringIncome ?? parseCurrency(rawYearData?.input?.nonRecurringIncome) ?? 0,
          nonRecurringExpenses: rawYearData?.summary?.nonRecurringExpenses ?? parseCurrency(rawYearData?.input?.nonRecurringExpenses) ?? 0,
          depreciation: rawYearData?.summary?.depreciation ?? parseCurrency(rawYearData?.input?.depreciation) ?? 0,
          amortization: rawYearData?.summary?.amortization ?? parseCurrency(rawYearData?.input?.amortization) ?? 0,
          interest: rawYearData?.summary?.interest ?? parseCurrency(rawYearData?.input?.interest) ?? 0,
          taxes: rawYearData?.summary?.taxes ?? parseCurrency(rawYearData?.input?.taxes) ?? 0,
          ebitda: rawYearData?.summary?.ebitda ?? (
            (rawYearData?.summary?.grossProfit ?? (rawYearData?.summary?.revenue ?? parseCurrency(rawYearData?.input?.revenue) ?? 0) - (rawYearData?.summary?.cogs ?? parseCurrency(rawYearData?.input?.cogs) ?? 0))
            - (rawYearData?.summary?.operatingExpenses ?? parseCurrency(rawYearData?.input?.operatingExpenses) ?? 0)
            + (rawYearData?.summary?.depreciation ?? parseCurrency(rawYearData?.input?.depreciation) ?? 0)
            + (rawYearData?.summary?.amortization ?? parseCurrency(rawYearData?.input?.amortization) ?? 0)
          ),
          adjustedEbitda: rawYearData?.summary?.adjustedEbitda ?? rawYearData?.summary?.ebitda ?? 0,
        },
        ...(yearKey === '2025YTD' && rawYearData?.ytdMonth ? { ytdMonth: rawYearData.ytdMonth } : {})
      };
    }
  }

  // Transform Debts
  const transformedDebts = raw.debts && typeof raw.debts === 'object' && Array.isArray(raw.debts.entries)
  ? {
      ...raw.debts, // preserves totalCreditLimit, totalCreditBalance, creditUtilizationRate, etc.
      entries: raw.debts.entries.map((debt: any, idx: number) => ({
        ...debt,
        id: debt.id || idx.toString(),
        monthlyPayment: parseCurrency(debt.monthlyPayment),
        outstandingBalance: parseCurrency(debt.outstandingBalance),
        originalLoanAmount: parseCurrency(debt.originalLoanAmount),
        // Use creditLimit if present, otherwise use originalLoanAmount for CREDIT_CARD/LINE_OF_CREDIT
        creditLimit:
          debt.creditLimit !== undefined
            ? parseCurrency(debt.creditLimit)
            : (["CREDIT_CARD", "LINE_OF_CREDIT"].includes(debt.category)
                ? parseCurrency(debt.originalLoanAmount)
                : 0),
      })),
    }
  : Array.isArray(raw.debts)
    ? {
        entries: raw.debts.map((debt: any, idx: number) => ({
          ...debt,
          id: debt.id || idx.toString(),
          monthlyPayment: parseCurrency(debt.monthlyPayment),
          outstandingBalance: parseCurrency(debt.outstandingBalance),
          originalLoanAmount: parseCurrency(debt.originalLoanAmount),
          creditLimit:
            debt.creditLimit !== undefined
              ? parseCurrency(debt.creditLimit)
              : (["CREDIT_CARD", "LINE_OF_CREDIT"].includes(debt.category)
                  ? parseCurrency(debt.originalLoanAmount)
                  : 0),
        })),
      }
    : raw.debts;

  // Transform DSCR
  const defaultDscrYearData = { noi: 0, debtService: 0, annualizedLoanPayment: 0, totalDebtService: 0, dscr: 0 };

  // Helper to get YTD month number from '2025YTD' data
  const getYtdMonthNumber = () => {
    const ytdMonthRaw = transformedFinancials['2025YTD']?.ytdMonth;
    if (!ytdMonthRaw) return 0;
    if (/^\d+$/.test(ytdMonthRaw)) return parseInt(ytdMonthRaw, 10);
    const monthMap: Record<string, number> = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
      'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
    };
    return monthMap[ytdMonthRaw as keyof typeof monthMap] || 0;
  };

  const ytdMonthNum = getYtdMonthNumber();

  // Calculate annualized/prorated debt and loan payment for each year
  const dscrYears = ['2023', '2024', '2025YTD'];
  const transformedDscr: any = {};
  dscrYears.forEach((year) => {
    const financialsForYear = transformedFinancials[year];
    let debtService = 0;
    let annualizedLoanPayment = 0;
    if (year === '2025YTD') {
      if (ytdMonthNum > 0) {
        debtService = (transformedDebts?.entries ?? []).reduce(
          (sum: number, debt: any) => sum + Number(debt.monthlyPayment ?? 0) * ytdMonthNum,
          0
        );
        annualizedLoanPayment = ytdMonthNum > 0 ? ((finalLoanInfo.annualizedLoan ?? 0) * ytdMonthNum) / 12 : 0;
      } else {
        debtService = 0;
        annualizedLoanPayment = 0;
      }
    } else {
      debtService = (transformedDebts?.entries ?? []).reduce(
        (sum: number, debt: any) => sum + Number(debt.monthlyPayment ?? 0) * 12,
        0
      );
      annualizedLoanPayment = year === '2024' ? (finalLoanInfo.annualizedLoan ?? 0) : 0;
    }
    const totalDebtServiceForYear = debtService + annualizedLoanPayment;
    transformedDscr[year] = {
      ...defaultDscrYearData,
      debtService,
      annualizedLoanPayment,
      totalDebtService: totalDebtServiceForYear,
      dscr: totalDebtServiceForYear > 0 && (financialsForYear?.summary?.ebitda ?? 0) > 0
        ? (financialsForYear?.summary?.ebitda ?? 0) / totalDebtServiceForYear
        : 0,
    };
  });


  // Populate annualizedLoanPayments for table display
  const annualizedLoanPayments: Record<string, number> = {
    '2023': 0,
    '2024': finalLoanInfo.annualizedLoan ?? 0,
    '2025YTD': ytdMonthNum > 0 ? ((finalLoanInfo.annualizedLoan ?? 0) * ytdMonthNum) / 12 : 0,
  };

  const finalReportData = {
    loanInfo: finalLoanInfo,
    financials: transformedFinancials,
    dscr: transformedDscr,
    debts: {
      ...transformedDebts,
      annualizedLoanPayments
    },
  };

  // Section rendering logic
  return (
    <div className="print:bg-white print:text-black print:w-full print:p-0 print:mt-0 print:mb-0"
     style={{ width: '100%', padding: 0, marginTop: 0, marginBottom: 0 }}>

      {type === 'full' && (
        <CashFlowReport
          loanInfo={finalReportData.loanInfo}
          financials={finalReportData.financials}
          dscr={finalReportData.dscr}
          debts={finalReportData.debts}
        />
      )}
      {type === 'summary' && (
        <section id="business-debt-summary">
          <BusinessDebtSummary debts={transformedDebts} businessName={finalLoanInfo?.businessName} />
        </section>
      )}
    </div>
  );
}
