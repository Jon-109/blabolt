'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import DownloadButton from '@/app/(components)/shared/DownloadButton';
import CashFlowReport, { 
  LoanInfo, 
  Financials,
  DscrResults
} from '@/app/(components)/CashFlowReport';
import type { Debt } from '@/app/(components)/BusinessDebtsStep';
import { supabase } from '@/supabase/helpers/client';
import { Button } from '@/app/(components)/ui/button';
import ServiceCard from '@/app/(components)/analysis/ServiceCard';
import Testimonials from '@/app/(components)/shared/Testimonials';
import { HelpCircle, ArrowRight as ArrowRightIcon } from 'lucide-react';

// --- Type Definitions for Local Use ---
// These are not exported from shared or CashFlowReport, so define here for type safety.
type DscrYearData = {
  noi: number;
  debtService: number;
  annualizedLoanPayment: number;
  totalDebtService: number;
  dscr: number;
};

type DebtDetail = {
  id: string;
  name?: string;
  type?: string;
  monthlyPayment?: number;
  outstandingBalance?: number;
  originalLoanAmount?: number;
  creditLimit?: number;
  [key: string]: any;
};

// --- Currency Parsing Utility ---
const parseCurrency = (value: string | number | undefined | null): number => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  return parseFloat(value.replace(/[$,]/g, '')) || 0;
};

// Define the shape of the data fetched from Supabase
interface CashFlowAnalysisRecord {
  id: string;
  user_id: string | null;
  business_name: string | null;
  loan_purpose: string | null;
  desired_amount: number | null;
  estimated_payment: number | null;
  financials: Financials | null;
  debts: { entries?: Debt[] } | null;
  dscr: DscrResults | null;
  created_at: string;
  updated_at: string;
  cash_flow_pdf_url: string | null;
  debt_summary_pdf_url: string | null;
  status: string | null;
  first_name: string | null;
  last_name: string | null;
  down_payment: number | null;
  down_payment293: string | null;
  proposed_loan: number | null;
  term: string | null;
  interest_rate: number | null;
  annualized_loan: number | null;
}

export default function ReportPreviewPageContent() {
  // Fallback UI for error
  function ErrorFallback({ error }: { error: string }) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Oops! Something went wrong</h2>
        <p className="mb-4 text-gray-600">{error}</p>
        <Link href="/" className="text-blue-600 underline">Go back home</Link>
      </div>
    );
  }

  const searchParams = useSearchParams(); 
  const analysisId = searchParams.get('id');
  const router = useRouter();
  type ReportData = {
    loanInfo: LoanInfo;
    financials: Financials;
    dscr: DscrResults;
    debts: any[] | { entries: any[] } | null;
    cashFlowPdfUrl?: string;
    debtSummaryPdfUrl?: string;
  };
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);

  // Check user authentication on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error('Authentication error:', authError);
          router.replace('/login');
          return;
        }
        if (!analysisId) {
          const { data: analyses, error: analysesError } = await supabase
            .from('cash_flow_analyses')
            .select('id, status')
            .eq('user_id', user.id)
            .eq('status', 'submitted')
            .order('updated_at', { ascending: false })
            .limit(1);
          if (analysesError) {
            console.error('Error fetching analyses:', analysesError);
            return;
          }
          if (analyses && analyses.length > 0) {
            router.replace(`/report-preview?id=${analyses[0].id}`);
          } else {
            router.replace('/comprehensive-cash-flow-analysis');
          }
          return;
        }
      } catch (err) {
        console.error('Auth check error:', err);
        router.replace('/login');
      }
    };
    checkAuth();
  }, [router, analysisId]);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      if (!analysisId) {
        setError('No analysis ID provided in the URL.');
        setIsLoading(false);
        return;
      }
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError('You must be logged in to view this analysis.');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: dbError } = await supabase
          .from('cash_flow_analyses')
          .select('*') 
          .eq('id', analysisId)
          .single(); 
        if (dbError) {
          throw new Error(`Failed to fetch analysis data: ${dbError.message}`);
        }
        if (!data) {
          throw new Error(`No analysis found with ID: ${analysisId}`);
        }
        if (data.user_id !== user.id) {
          throw new Error('You are not authorized to view this analysis.');
        }
        if (data.status !== 'submitted') {
          console.log('Analysis status is not submitted:', data.status);
          router.replace('/comprehensive-cash-flow-analysis');
          return;
        }
        const parseCurrency = (value: string | number | undefined | null): number => {
          if (typeof value === 'number') return value;
          if (typeof value !== 'string') return 0;
          return parseFloat(value.replace(/[$,]/g, '')) || 0;
        };
        const reconstructedLoanInfo: LoanInfo = {
          businessName: data.business_name || '',
          loanPurpose: data.loan_purpose || '',
          desiredAmount: parseCurrency(data.desired_amount), 
          estimatedPayment: parseCurrency(data.estimated_payment), 
          annualizedLoan: parseCurrency(data.annualized_loan),
          loanTerm: parseInt(String(data.term || '0'), 10),
          interestRate: (typeof data.interest_rate === 'number' ? data.interest_rate : parseFloat(String(data.interest_rate || '0'))) / 100,
          downPaymentPercent: parseFloat(String(data.down_payment293 || '0')),
          downPaymentAmount: parseCurrency(data.down_payment),
          proposedLoanAmount: parseCurrency(data.proposed_loan ?? data.desired_amount)
        };
        const transformedFinancials: Financials = {};
        for (const yearKey of ['year2023', 'year2024', 'year2025YTD']) {
          const yearShort = yearKey.replace('year', '');
          const rawYearData = data.financials?.[yearKey];
          transformedFinancials[yearShort] = {
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
            },...(yearShort === '2025YTD' && rawYearData?.ytdMonth ? { ytdMonth: rawYearData.ytdMonth } : {})
          };
        };
        const transformedDebts = {
          ...data.debts,
          entries: (data.debts?.entries ?? []).map((debt: any, index: number) => ({
            ...debt,
            id: index.toString(),
            monthlyPayment: parseCurrency(debt.monthlyPayment),
            outstandingBalance: parseCurrency(debt.outstandingBalance),
            originalLoanAmount: parseCurrency(debt.originalLoanAmount),
            creditLimit: parseCurrency(debt.creditLimit),
          }))
        };
        const defaultDscrYearData: DscrYearData = { noi: 0, debtService: 0, annualizedLoanPayment: 0, totalDebtService: 0, dscr: 0 };
        const totalAnnualizedExistingDebt = (transformedDebts.entries ?? []).reduce(
          (sum: number, debt: DebtDetail) => {
            return sum + Number(debt.monthlyPayment ?? 0) * 12;
          },
          0
        );
        // Set the transformed report data for rendering
        setReportData({
          loanInfo: reconstructedLoanInfo,
          financials: transformedFinancials,
          dscr: data.dscr ?? {},
          debts: transformedDebts,
          cashFlowPdfUrl: data.cash_flow_pdf_url ?? undefined,
          debtSummaryPdfUrl: data.debt_summary_pdf_url ?? undefined,
        });
      } catch (err: any) {
        setError(err.message || 'Unknown error occurred while fetching analysis data.');
      }
      setIsLoading(false);
    };
    fetchAnalysisData();
  }, [analysisId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  if (error) {
    return <ErrorFallback error={error} />;
  }
  if (!reportData) {
    return <ErrorFallback error="No report data available." />;
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {/* Enhanced Thank You Banner */}
        <div
          className="w-full mb-4 rounded-xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-lg p-8 flex flex-col items-center justify-center border border-gray-700 max-w-5xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-2">
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" className="text-green-400"><path fill="currentColor" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm3.66 5.23a1 1 0 0 1 1.41 1.42l-5.01 5a1 1 0 0 1-1.41 0l-2.01-2a1 1 0 0 1 1.41-1.42l1.3 1.3 4.3-4.3Z"/></svg>
            <h1 className="text-2xl font-bold text-white drop-shadow">Thank you for your submission!</h1>
          </div>
          <p className="text-white text-lg md:text-xl max-w-4xl mx-auto text-center mb-2 font-medium">
            Your personalized business lending analysis is ready. Below you’ll find your detailed reports, including your cash flow, DSCR, and business debt summary.
          </p>
          <p className="text-gray-300 text-base md:text-lg max-w-4xl mx-auto text-center">
            You can download your full PDF report using the button below. Please review the sections below for a comprehensive breakdown of your business’s financial position and lending eligibility.
          </p>
        </div>
        {/* Download Buttons */}
        <div className="flex justify-center mb-2 gap-4 flex-col sm:flex-row">
          <DownloadButton
            analysisId={analysisId as string}
            type="full"
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
          >
            Download Cash Flow Analysis
          </DownloadButton>
          <DownloadButton
            analysisId={analysisId as string}
            type="summary"
            className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded font-semibold hover:bg-gray-700"
          >
            Download Business Debt Summary
          </DownloadButton>
        </div>
        <hr className="border-t-4 border-black rounded-full mb-6" />
        <CashFlowReport {...reportData} />
        {/* Download Buttons (Bottom) */}
        <div className="flex justify-center mt-10 mb-4 gap-4 flex-col sm:flex-row">
          <DownloadButton
            analysisId={analysisId as string}
            type="full"
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
          >
            Download Cash Flow Analysis
          </DownloadButton>
          <DownloadButton
            analysisId={analysisId as string}
            type="summary"
            className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded font-semibold hover:bg-gray-700"
          >
            Download Business Debt Summary
          </DownloadButton>
        </div>
        
        {/* Loan Services Section */}
        <section className="relative max-w-5xl mx-auto mt-12 mb-8 px-6 py-10 bg-gradient-to-br from-blue-50 via-white to-green-50 border border-blue-100 dark:border-gray-700 shadow-xl rounded-3xl overflow-hidden animate-fade-in">
          <div className="flex flex-col items-center">
            <div className="mb-4 flex items-center gap-3">
              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c1.657 0 3-1.343 3-3S13.657 2 12 2 9 3.343 9 5s1.343 3 3 3zm0 0v12m0 0c-4.418 0-8-1.79-8-4V7c0-2.21 3.582-4 8-4s8 1.79 8 4v9c0 2.21-3.582 4-8 4z" /></svg>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-900 dark:text-white tracking-tight drop-shadow-sm">Explore Our Business Loan Services</h2>
            </div>
            <p className="text-lg text-gray-700 dark:text-gray-200 mb-8 text-center max-w-2xl">
              Unlock funding opportunities tailored for your business. Discover flexible loan solutions, expert guidance, and dedicated support to help you grow and succeed.
            </p>
            <div className="flex flex-col md:flex-row gap-6 items-stretch w-full justify-center">
              <ServiceCard />
            </div>
          </div>
        </section>

        <div className="mt-8">
          <Testimonials />
        </div>

        {/* FAQ Section - Enhanced */}
        <section className="py-8 bg-gradient-to-br from-[#e6ecf2] to-[#c9d7e6]">
          <div className="container mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <HelpCircle className="w-8 h-8 text-primary-blue" />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Have Questions?
              </h2>
            </div>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              We've compiled answers to common questions about our services and the business lending process. Find the information you need quickly and easily.
            </p>
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary-blue hover:bg-primary-blue/90 text-white rounded-lg font-semibold text-lg transition-colors shadow-md"
            >
              Visit Our FAQ Page
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
