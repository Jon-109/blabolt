export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import ReportPreviewPageContent from './ReportPreviewPageContent';

export default function ReportPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ReportPreviewPageContent />
    </Suspense>
  );
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
        
        // Check if the user is authorized to view this analysis
        if (data.user_id !== user.id) {
          throw new Error('You are not authorized to view this analysis.');
        }
        
        // Check if the analysis is submitted
        if (data.status !== 'submitted') {
          console.log('Analysis status is not submitted:', data.status);
          router.replace('/comprehensive-cash-flow-analysis');
          return;
        }

        // --- Helper function to safely parse currency strings to numbers --- 
        const parseCurrency = (value: string | number | undefined | null): number => {
          if (typeof value === 'number') return value;
          if (typeof value !== 'string') return 0;
          return parseFloat(value.replace(/[$,]/g, '')) || 0;
        };

        // --- Reconstruct LoanInfo from individual columns --- 
        // Only include fields defined in the LoanInfo type from CashFlowReport.tsx
        const reconstructedLoanInfo: LoanInfo = {
          businessName: data.business_name || '',
          loanPurpose: data.loan_purpose || '',
          desiredAmount: parseCurrency(data.desired_amount), 
          estimatedPayment: parseCurrency(data.estimated_payment), 
          annualizedLoan: parseCurrency(data.annualized_loan), // Added from schema

          // Map fields using correct DB column names
          loanTerm: parseInt(String(data.term || '0'), 10), // Parse 'term' (text) to int
          interestRate: (typeof data.interest_rate === 'number' ? data.interest_rate : parseFloat(String(data.interest_rate || '0'))) / 100, // Use 'interest_rate', assume % -> decimal
          downPaymentPercent: parseFloat(String(data.down_payment293 || '0')), // Use 'down_payment293' (text) and parse
          downPaymentAmount: parseCurrency(data.down_payment), // Use 'down_payment'
          proposedLoanAmount: parseCurrency(data.proposed_loan ?? data.desired_amount) // Use 'proposed_loan', fallback to desired
        };

        // --- CORRECTED Transformation for CashFlowReportProps ---
        // 1. Transform Financials
        const transformedFinancials: Financials = {};

        // Process each year
        for (const yearKey of ['year2023', 'year2024', 'year2025YTD']) {
          const yearShort = yearKey.replace('year', ''); // '2023', '2024', '2025YTD'
          const rawYearData = data.financials?.[yearKey];

          // DEBUG: Log rawYearData for each year
          console.log(`[DEBUG] Raw year data for ${yearShort}:`, rawYearData);

          // Combine data from 'input' (parsed) and 'summary' (calculated)
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

          // --- Ensure ytdMonth is included for 2025YTD ---
          // if (yearShort === '2025YTD' && rawYearData?.ytdMonth) {
          //   (transformedFinancials[yearShort] as any).ytdMonth = rawYearData.ytdMonth;
          // }
        };

        // 2. Transform Debts (Convert strings to numbers)
        // Instead of just the entries array, preserve the full debts JSON (including new fields)
        const transformedDebts = {
          ...data.debts,
          entries: (data.debts?.entries ?? []).map((debt: any, index: number) => ({
            ...debt,
            id: index.toString(),
            monthlyPayment: parseCurrency(debt.monthlyPayment),
            outstandingBalance: parseCurrency(debt.outstandingBalance),
            originalLoanAmount: parseCurrency(debt.originalLoanAmount),
            creditLimit: parseCurrency(debt.creditLimit),
            // Add other numeric conversions if needed based on Debt type
          }))
        };

        // 3. Transform DSCR Results
        const defaultDscrYearData: DscrYearData = { noi: 0, debtService: 0, annualizedLoanPayment: 0, totalDebtService: 0, dscr: 0 };

        // Calculate total annualized existing debt payment once
        const totalAnnualizedExistingDebt = (transformedDebts.entries ?? []).reduce(
          (sum: number, debt: DebtDetail) => {
            return sum + Number(debt.monthlyPayment ?? 0) * 12;
          },
          0
        );

        // Get annualized new loan payment once
        const annualizedNewLoanPayment = reconstructedLoanInfo.annualizedLoan ?? 0; 

        const transformedDscr: DscrResults = {};

        if (data?.dscr) { // Use optional chaining
          for (const year of ['2023', '2024', '2025YTD']) {
            const score = data.dscr[year]; // Raw DSCR score from DB
            const financialsForYear = transformedFinancials[year];
            // SIMPLIFIED: Directly use EBITDA from transformedFinancials as it's correct for Income Breakdown
            const totalDebtServiceForYear = totalAnnualizedExistingDebt + annualizedNewLoanPayment;

            if (score !== undefined && score !== null) {
              transformedDscr[year] = {
                debtService: totalAnnualizedExistingDebt, // Existing debt annual payment
                annualizedLoanPayment: annualizedNewLoanPayment, // New loan annual payment
                totalDebtService: totalDebtServiceForYear, // Sum of the two
                dscr: score // The score from DB
              };
            } else {
              // Provide defaults, including calculated values if financials exist
              transformedDscr[year] = {
                ...defaultDscrYearData,
                debtService: totalAnnualizedExistingDebt,
                annualizedLoanPayment: annualizedNewLoanPayment,
                totalDebtService: totalDebtServiceForYear,
                // dscr remains 0 from default
              };
            }
          }
        } else {
          // If raw data.dscr is completely missing, provide defaults for all years, calculating what we can
          for (const year of ['2023', '2024', '2025YTD']) {
            const financialsForYear = transformedFinancials[year];
            // SIMPLIFIED: Directly use EBITDA from transformedFinancials as it's correct for Income Breakdown
            const totalDebtServiceForYear = totalAnnualizedExistingDebt + annualizedNewLoanPayment;
            transformedDscr[year] = {
              ...defaultDscrYearData,
              debtService: totalAnnualizedExistingDebt,
              annualizedLoanPayment: annualizedNewLoanPayment,
              totalDebtService: totalDebtServiceForYear,
            };
          }
        }

        // Second pass to calculate DSCR score using the now populated EBITDA
        for (const year of ['2023', '2024', '2025YTD']) {
          const dscrData = transformedDscr[year];
          const ebitdaFromFinancials = transformedFinancials[year]?.summary?.ebitda ?? 0; // Safe access
          if (dscrData && dscrData.totalDebtService !== undefined) {
            dscrData.dscr = dscrData.totalDebtService > 0 && ebitdaFromFinancials > 0
              ? ebitdaFromFinancials / dscrData.totalDebtService // Use safe value
              : 0;
          } else if (dscrData) {
            dscrData.dscr = 0; // Ensure dscr is always set, even if calculation failed
          }
        }

        // --- Final Props Object ---
        const finalReportData: CashFlowReportProps = {
          loanInfo: reconstructedLoanInfo,
          financials: transformedFinancials,
          debts: transformedDebts, // Pass full debts object
          dscr: transformedDscr,
        };

        setReportData(finalReportData);
        setError(null);
        setIsLoading(false);

      } catch (err) {
        // Log full error for debugging
        console.error('Failed to fetch or process analysis data:', err);
        // Provide a user-friendly error message
        if (err instanceof Error) {
          setError(err.message);
        } else if (typeof err === 'object' && err !== null && 'message' in err) {
          setError((err as any).message);
        } else {
          setError('An unexpected error occurred. Please try again later.');
        }
        setIsLoading(false);
      }
    };

    fetchAnalysisData();
  }, [analysisId]);
 
 
return (
  <div className="container mx-auto p-4">
    {/* Enhanced Thank You Banner */}
    <div
      className="w-full mb-8 rounded-xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-lg p-8 flex flex-col items-center justify-center border border-gray-700 max-w-5xl mx-auto"
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
    <div className="flex justify-center mb-4 gap-4 flex-col sm:flex-row">
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

    {isLoading && (
      <div className="text-center p-10">
        <p>Loading analysis data...</p>
      </div>
    )}
    {!isLoading && error && (
      <ErrorFallback error={error} />
    )}
    {!isLoading && !error && reportData ? (
      <>
        <div className="border p-6 mb-6 bg-white shadow-lg rounded-md">
          <CashFlowReport {...reportData} />
        </div>
      </>
    ) : (
      <div className="text-center p-10">
        <p>No data loaded. Ensure a valid 'id' parameter is in the URL.</p>
      </div>
    )}

    {/* Download buttons at bottom (only if reportData) */}
    {reportData && (
      <>
        <div className="flex justify-center mt-8 mb-4 gap-4 flex-col sm:flex-row">
          <DownloadButton
            analysisId={analysisId as string}
            type="full"
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
          >
            Download Full Report
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
        <div className="max-w-5xl mx-auto mt-8 mb-4">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Explore Our Business Loan Services</h2>
          <div className="flex flex-col md:flex-row gap-6 items-stretch">
            <ServiceCard />
          </div>
        </div>
      </>
    )}
    <div className="mt-8">
      <Testimonials />
    </div>
    <section className="bg-gray-50 py-10 px-6 rounded-2xl shadow-md text-center max-w-4xl mx-auto border border-gray-100">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Ready to Turn Your Report Into Real Funding?
      </h2>
      <p className="text-gray-600 max-w-2xl mx-auto mb-6">
        Whether you want expert guidance preparing a lender-ready package or prefer a hands-off experience where we find the right lender for you — we’re here to help.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link
          href="/loan-packaging"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition text-lg shadow-md border border-blue-700/10"
        >
          Get Help With Loan Packaging ($499)
        </Link>
        <Link
          href="/loan-brokering"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition text-lg shadow-md border border-green-700/10"
        >
          Let Us Find You a Lender (Free Until Funded)
        </Link>
      </div>
      <p className="text-sm text-gray-500 mt-4">
        Need help deciding? <Link href="/contact" className="underline text-blue-600 hover:text-blue-800">Contact us</Link> for a free consultation.
      </p>
    </section>
  </div>
);
}
