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
        <h1 className="text-3xl font-bold mb-4">Cash Flow Analysis Report Preview</h1>
        <CashFlowReport {...reportData} />
        <div className="flex flex-col md:flex-row gap-4 mt-8">
          {analysisId && (
            <DownloadButton analysisId={analysisId} type="full">
              Download PDF Report
            </DownloadButton>
          )}
          {analysisId && (
            <DownloadButton analysisId={analysisId} type="summary">
              Download Debt Summary
            </DownloadButton>
          )}
        </div>
        <div className="mt-8">
          <ServiceCard />
        </div>
        <div className="mt-8">
          <Testimonials />
        </div>
      </div>
    </div>
  );
}
