import { notFound } from 'next/navigation';
import { getCashFlowAnalysisById } from '@/lib/getCashFlowAnalysisById';
import { createClient } from '@/supabase/helpers/server';
import { cookies as nextCookies } from 'next/headers';
import CashFlowReport from '@/app/(components)/CashFlowReport';
import CashFlowBusinessDebtSummaryTemplate from '@/app/(components)/cash-flow/CashFlowBusinessDebtSummaryTemplate';
import './print-report.css';
import { verifyPdfRenderToken } from '@/lib/server/pdf-render-token';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export default async function PrintReportPage({ params, searchParams }: any) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { analysisId, type } = resolvedParams;
  if (type !== 'full' && type !== 'summary') {
    return notFound();
  }
  let supabase;
  const renderToken = typeof resolvedSearchParams?.renderToken === 'string'
    ? resolvedSearchParams.renderToken
    : null;
  // If a signed render token is present, use the admin client for one-time PDF rendering.
  if (renderToken) {
    const payload = verifyPdfRenderToken(renderToken);
    if (!payload || payload.analysisId !== analysisId || payload.type !== type) {
      return notFound();
    }
    supabase = getSupabaseAdmin();
  } else {
    // Normal browser/server-side rendering
    supabase = createClient(await nextCookies());
  }
  const raw: any = await getCashFlowAnalysisById(analysisId, supabase);
  
  if (!raw || Object.values(raw).every((v) => v == null || v === '' || (typeof v === 'object' && Object.keys(v).length === 0))) {
    return notFound();
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

  // `getCashFlowAnalysisById` already normalizes DB payloads into year-keyed report data.
  // Re-normalizing here drops those keys and zeroes the financial sections in the PDF.
  const transformedFinancials: any = raw.financials ?? {
    '2024': null,
    '2025': null,
    '2026YTD': null,
  };

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

  // Helper to get YTD month number from '2026YTD' data
  const getYtdMonthNumber = () => {
    const ytdMonthRaw = transformedFinancials['2026YTD']?.ytdMonth;
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
  const dscrYears = ['2024', '2025', '2026YTD'];
  const transformedDscr: any = {};
  dscrYears.forEach((year) => {
    const financialsForYear = transformedFinancials[year];
    let debtService = 0;
    let annualizedLoanPayment = 0;
    if (year === '2026YTD') {
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
      annualizedLoanPayment = year === '2025' ? (finalLoanInfo.annualizedLoan ?? 0) : 0;
    }
    const totalDebtServiceForYear = debtService + annualizedLoanPayment;
    transformedDscr[year] = {
      ...defaultDscrYearData,
      debtService,
      annualizedLoanPayment,
      totalDebtService: totalDebtServiceForYear,
      dscr: totalDebtServiceForYear > 0 && (financialsForYear?.summary?.adjustedEbitda ?? 0) > 0
        ? (financialsForYear?.summary?.adjustedEbitda ?? 0) / totalDebtServiceForYear
        : 0,
    };
  });


  // Populate annualizedLoanPayments for table display
  const annualizedLoanPayments: Record<string, number> = {
    '2024': 0,
    '2025': finalLoanInfo.annualizedLoan ?? 0,
    '2026YTD': ytdMonthNum > 0 ? ((finalLoanInfo.annualizedLoan ?? 0) * ytdMonthNum) / 12 : 0,
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
          <CashFlowBusinessDebtSummaryTemplate
            debts={transformedDebts}
            businessName={finalLoanInfo?.businessName}
          />
        </section>
      )}
    </div>
  );
}
