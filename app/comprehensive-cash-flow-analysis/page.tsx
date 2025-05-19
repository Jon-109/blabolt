'use client'

import { convertToNumeric } from "@/app/(components)/FinancialsUtils";

import { useState, useMemo, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import { useRouter } from 'next/navigation';
// Import helper for runtime dynamic import
// (actual import is done inside useEffect to avoid SSR issues)

import Link from 'next/link'
import LoanInfoStep from '@/app/(components)/LoanInfoStep'
import FinancialsStep from '@/app/(components)/FinancialsStep'
// Import the necessary types from FinancialsStep
import type { FinancialsPayload, FullFinancialData, NumericFinancialData } from '@/app/(components)/FinancialsStep'; 
import BusinessDebtsStep from '@/app/(components)/BusinessDebtsStep'
import type { Debt } from '@/app/(components)/BusinessDebtsStep';
import { ReviewSubmitStep } from '@/app/(components)/ReviewSubmitStep'
import { categories } from '@/app/(components)/BusinessDebtsStep';
import { supabase } from '@/supabase/helpers/client'
import { Toast, useToast } from '@/app/(components)/shared/Toast'; // Import Toast and useToast
import { calculateDebtSummary } from '@/lib/financial/calculations';
import type { LoanInfoData } from '@/app/(components)/LoanInfoStep';
import type { Session, AuthError } from '@supabase/supabase-js';

// Helper to get default state structures
const getDefaultLoanInfo = (): LoanInfoData => ({
  businessName: '',
  firstName: '',
  lastName: '',
  loanPurpose: '',
  desiredAmount: '',
  estimatedPayment: '',
  downPayment: '',
  downPayment293: '',
  proposedLoan: '',
  term: '',
  interestRate: '',
  annualizedLoan: '',
});

// Helper function to create empty input data
const createEmptyFullFinancialData = (): FullFinancialData => ({
  revenue: '',
  cogs: '',
  operatingExpenses: '',
  nonRecurringIncome: '',
  nonRecurringExpenses: '',
  depreciation: '',
  amortization: '',
  interest: '',
  taxes: '',
});

// Helper function to create empty summary data
const createEmptyNumericFinancialData = (): NumericFinancialData => ({
  revenue: 0,
  cogs: 0,
  operatingExpenses: 0,
  nonRecurringIncome: 0,
  nonRecurringExpenses: 0,
  depreciation: 0,
  amortization: 0,
  interest: 0,
  taxes: 0,
  expenses: 0,
  netIncome: 0,
  ebitda: 0,
  grossProfit: 0,
  adjustedEbitda: 0,
});

const getDefaultFinancials = (): FinancialsPayload => ({
  year2023: { 
    input: createEmptyFullFinancialData(),
    summary: createEmptyNumericFinancialData(),
  },
  year2024: { 
    input: createEmptyFullFinancialData(),
    summary: createEmptyNumericFinancialData(),
  },
  year2025YTD: { 
    input: createEmptyFullFinancialData(),
    summary: createEmptyNumericFinancialData(),
    ytdMonth: '', // Default YTD month
  }
});

type Step = {
  id: number
  title: string
}

const steps: Step[] = [
  { id: 1, title: 'Loan Info' },
  { id: 2, title: 'Financials' },
  { id: 3, title: 'Business Debts' },
  { id: 4, title: 'Review & Submit' }
]

export default function Page() {
  const router = useRouter();

  // --- DEBUG: Log Supabase session on mount ---
  useEffect(() => {
    supabase.auth.getSession().then(
      (res: { data: { session: Session | null }, error: AuthError | null }) => {
        console.debug('[DEBUG] Supabase session:', res);
      }
    );
  }, []);

  // --- Protect route: redirect to login if not authenticated ---
  // --- Also redirect to report-preview if user already has a submitted analysis ---
  useEffect(() => {
    async function checkAuthAndPurchase() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCurrentStep(1);
        router.replace('/login');
        return;
      }

      // Check if user has a paid purchase for the cash flow analysis
      try {
        const { hasUserPurchasedCashFlowAnalysis } = await import('./purchase-check');
        const hasPurchased = await hasUserPurchasedCashFlowAnalysis(user.id);
        if (hasPurchased) {
          // User has paid, redirect to the comprehensive form page
          router.replace('/comprehensive-cash-flow-analysis');
          return;
        }
      } catch (err) {
        console.error('Error checking purchase status:', err);
      }

      // If not purchased, check if user has a submitted analysis (legacy logic)
      const { data: submittedAnalyses, error: analysesError } = await supabase
        .from('cash_flow_analyses')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'submitted')
        .order('updated_at', { ascending: false })
        .limit(1);
      if (analysesError) {
        console.error('Error checking for submitted analyses:', analysesError);
        return;
      }
      if (submittedAnalyses && submittedAnalyses.length > 0) {
        router.replace(`/report-preview?id=${submittedAnalyses[0].id}`);
      }
    }
    checkAuthAndPurchase();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Listen for auth state changes: redirect to login on SIGNED_OUT, reset to step 1 on SIGNED_IN ---
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (event === 'SIGNED_OUT') {
        setCurrentStep(1);
        router.replace('/login');
      } else if (event === 'SIGNED_IN') {
        setCurrentStep(1);
      }
    });
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  // --- Hydration-safe client mount flag ---
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);

  // --- SSR-safe state initialization: always start with defaults, hydrate from localStorage on client ---
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isStepValid, setIsStepValid] = useState(false);
  const [loanInfo, setLoanInfo] = useState<LoanInfoData>(getDefaultLoanInfo());
  const [financials, setFinancials] = useState<FinancialsPayload>(getDefaultFinancials());
  const [debts, setDebts] = useState<Array<Debt>>([]);
  const [draftId, setDraftId] = useState<string | null>(null);

  // --- Add debtsRef to always have latest debts ---
  const debtsRef = useRef(debts);
  useEffect(() => {
    debtsRef.current = debts;
  }, [debts]);

  // Toast state management
  const { message: toastMessage, visible: toastVisible, closeToast } = useToast(); 

  // --- Refs for Step Components ---
  const loanInfoStepRef = useRef<{ validate: () => boolean }>(null);
  const financialsStepRef = useRef<{ validate: () => boolean }>(null);
  const businessDebtsStepRef = useRef<{ validate: () => boolean }>(null);
  // Add ref for ReviewSubmitStep if it needs validation (e.g., reviewSubmitStepRef)

  // Map step IDs to refs for easy lookup
  const stepRefs = useMemo(() => ({
    1: loanInfoStepRef,
    2: financialsStepRef,
    3: businessDebtsStepRef,
    // 4: reviewSubmitStepRef, // Add if ReviewSubmitStep needs validation
  }), []);

  // --- Other State ---
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pdfUrls, setPdfUrls] = useState<string | null>(null);

  const [isReviewConfirmed, setIsReviewConfirmed] = useState(false);
  
  // --- Add hydrated flag to block saves until restore is complete --- 
  const [hydrated, setHydrated] = useState(false); 

  // --- Whenever draftId changes, sync it into loanInfo.id ---
  useEffect(() => {
    if (draftId) {
      setLoanInfo((prev) => ({ ...prev, id: draftId }));
    }
  }, [draftId]);

  // --- Fetch User & Draft Effect ---
  useEffect(() => {
    const fetchUserAndDraft = async () => {
      console.log('[DEBUG] fetchUserAndDraft: Starting...');
      setLoadingUser(true);
      setHydrated(false); // Block saves until restore is done
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('[DEBUG] fetchUserAndDraft: Error fetching user:', userError);
        // Reset form state if user fetch fails
        setUserEmail(null);
        setLoanInfo(getDefaultLoanInfo());
        setFinancials(getDefaultFinancials());
        setDebts([]);
        setDraftId(null);
      } else if (user) {
        console.log('[DEBUG] fetchUserAndDraft: User found:', { id: user.id, email: user.email });
        setUserEmail(user.email || null);

        // Always attempt to fetch the latest draft from Supabase for the authenticated user
        console.log(`[DEBUG] fetchUserAndDraft: Querying Supabase for draft with user_id: ${user.id}`);
        const { data: dbDraftData, error: dbDraftError } = await supabase
          .from('cash_flow_analyses')
          .select('id, business_name, loan_purpose, desired_amount, estimated_payment, financials, debts, first_name, last_name, down_payment, down_payment293, proposed_loan, term, interest_rate, annualized_loan')
          .eq('user_id', user.id)
          .eq('status', 'inprogress') 
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (dbDraftError?.code === 'PGRST116') {
          // No draft found for user, this is normal on first entry
          console.info('[DEBUG] No draft found for user, creating new blank draft row.');
          // Insert a new blank draft for this user
          const { data: newDraft, error: insertError } = await supabase
            .from('cash_flow_analyses')
            .insert([{ user_id: user.id, status: 'inprogress' }])
            .select()
            .single();
          if (insertError) {
            // Only log as info if there is a real error, suppress if empty
            if (Object.keys(insertError).length > 0) {
              console.info('[DEBUG] Insert draft: harmless/expected insert error:', insertError);
            }
            // Reset form state if insert fails
            setUserEmail(user.email || null);
            setLoanInfo(getDefaultLoanInfo());
            setFinancials(getDefaultFinancials());
            setDebts([]);
            setDraftId(null);
          } else if (newDraft) {
            console.log('[DEBUG] New draft created:', newDraft);
            setDraftId(newDraft.id);
            setLoanInfo({ ...getDefaultLoanInfo(), id: newDraft.id });
            setFinancials(getDefaultFinancials());
            setDebts([]);
          }
        } else if (dbDraftError) {
          // Other errors should be logged as errors
          console.error('[DEBUG] fetchUserAndDraft: Supabase query error:', dbDraftError);
        }
        if (dbDraftData) {
          console.log('[DEBUG] fetchUserAndDraft: Supabase query returned data:', dbDraftData);
        }

        if (dbDraftData && !dbDraftError) {
          console.log('[DEBUG] fetchUserAndDraft: Setting draftId:', dbDraftData.id);
          setDraftId(dbDraftData.id); 

          const newLoanInfo = {
            ...getDefaultLoanInfo(), 
            id: dbDraftData.id, 
            businessName: dbDraftData.business_name || '',
            firstName: dbDraftData.first_name || '',
            lastName: dbDraftData.last_name || '',
            loanPurpose: dbDraftData.loan_purpose || '',
            desiredAmount: dbDraftData.desired_amount != null ? String(dbDraftData.desired_amount) : '',
            estimatedPayment: dbDraftData.estimated_payment != null ? String(dbDraftData.estimated_payment) : '',
            downPayment: dbDraftData.down_payment != null ? String(dbDraftData.down_payment) : '',
            downPayment293: dbDraftData.down_payment293 != null ? String(dbDraftData.down_payment293) : '',
            proposedLoan: dbDraftData.proposed_loan != null ? String(dbDraftData.proposed_loan) : '',
            term: dbDraftData.term != null ? String(dbDraftData.term) : '',
            interestRate: dbDraftData.interest_rate != null ? String(dbDraftData.interest_rate) : '',
            annualizedLoan: dbDraftData.annualized_loan != null ? String(dbDraftData.annualized_loan) : '',
          };
          console.log('[DEBUG] fetchUserAndDraft: Setting loanInfo:', newLoanInfo);
          setLoanInfo(newLoanInfo);

          if (dbDraftData.financials) {
            console.log('[DEBUG] fetchUserAndDraft: Setting financials:', dbDraftData.financials);
            setFinancials(dbDraftData.financials);
          } else {
            console.log('[DEBUG] fetchUserAndDraft: No financials in DB draft, resetting to default.');
            setFinancials(getDefaultFinancials()); 
          }

          if (dbDraftData.debts) {
            let processedDebts = [];
            if (Array.isArray(dbDraftData.debts)) {
              processedDebts = dbDraftData.debts; 
            } else if (dbDraftData.debts && Array.isArray((dbDraftData.debts as any).entries)) {
              processedDebts = (dbDraftData.debts as any).entries; 
            } else {
              processedDebts = []; 
            }
            console.log('[DEBUG] fetchUserAndDraft: Setting debts:', processedDebts);
            setDebts(processedDebts);
          } else {
            console.log('[DEBUG] fetchUserAndDraft: No debts in DB draft, resetting to default.');
            setDebts([]); 
          }
        } else if (dbDraftError && dbDraftError.code !== 'PGRST116') { 
          console.error('[DEBUG] fetchUserAndDraft: Error loading draft from Supabase (and not PGRST116). Resetting form.');
          setLoanInfo(getDefaultLoanInfo());
          setFinancials(getDefaultFinancials());
          setDebts([]);
          setDraftId(null);
        } else {
          console.log('[DEBUG] fetchUserAndDraft: No draft found in Supabase (or PGRST116 error). Resetting form to defaults.');
          setLoanInfo(getDefaultLoanInfo());
          setFinancials(getDefaultFinancials());
          setDebts([]);
          setDraftId(null);
        }
      } else {
        console.log('[DEBUG] fetchUserAndDraft: No user logged in. Resetting form to default state.');
        setUserEmail(null);
        setLoanInfo(getDefaultLoanInfo());
        setFinancials(getDefaultFinancials());
        setDebts([]);
        setDraftId(null);
      }
      setLoadingUser(false);
      setHydrated(true); 
      console.log('[DEBUG] fetchUserAndDraft: Finished. Hydrated set to true.');
    };

    fetchUserAndDraft();
  }, [supabase]); // Depend only on supabase client. Remove draftId from deps.

  // --- Utility: Calculate per-category totals for debts ---
  function getDebtCategoryTotals(debts: Debt[]) {
    const categories = [
      'REAL_ESTATE',
      'VEHICLE_EQUIPMENT',
      'CREDIT_CARD',
      'LINE_OF_CREDIT',
      'OTHER',
    ];
    const catTotals: Record<string, {
      totalMonthlyPayment: number;
      totalOriginalLoanAmount: number;
      totalOutstandingBalance: number;
    }> = {};
    for (const category of categories) {
      const filtered = debts.filter(d => d.category === category);
      catTotals[category] = {
        totalMonthlyPayment: filtered.reduce((sum, d) => sum + (parseFloat(d.monthlyPayment.replace(/[^\d.]/g, '')) || 0), 0),
        totalOriginalLoanAmount: filtered.reduce((sum, d) => sum + (parseFloat(d.originalLoanAmount.replace(/[^\d.]/g, '')) || 0), 0),
        totalOutstandingBalance: filtered.reduce((sum, d) => sum + (parseFloat(d.outstandingBalance.replace(/[^\d.]/g, '')) || 0), 0),
      };
    }
    return catTotals;
  }

  // --- Utility: Calculate top-level debt summary fields ---
  function getDebtSummaryFields(debts: Debt[]): {
    monthlyDebtService: number;
    annualDebtService: number;
    totalCreditBalance: number;
    totalCreditLimit: number;
    creditUtilizationRate: number | null;
  } {
    // Only consider CREDIT_CARD and LINE_OF_CREDIT for credit calculations
    const creditCategories = ['CREDIT_CARD', 'LINE_OF_CREDIT'];
    let monthlyDebtService = 0;
    let totalCreditBalance = 0;
    let totalCreditLimit = 0;

    for (const debt of debts) {
      const monthly = parseFloat(debt.monthlyPayment.replace(/[^\d.]/g, '')) || 0;
      monthlyDebtService += monthly;
      if (creditCategories.includes(debt.category)) {
        totalCreditBalance += parseFloat(debt.outstandingBalance.replace(/[^\d.]/g, '')) || 0;
        // Use originalLoanAmount for limit calculation, assuming it represents the limit
        totalCreditLimit += parseFloat(debt.originalLoanAmount?.replace(/[^\d.]/g, '') || '0') || 0;
      }
    }
    const annualDebtService = monthlyDebtService * 12;
    const creditUtilizationRate = totalCreditLimit > 0 ? totalCreditBalance / totalCreditLimit : null;

    return {
      monthlyDebtService,
      annualDebtService,
      totalCreditBalance,
      totalCreditLimit,
      creditUtilizationRate,
    };
  }

  // --- Helper to convert numeric fields that might be stored as strings into numbers ---
  const toNumberOrNull = (val: any): number | null => {
    if (val === null || val === undefined || val === '') return null;
    const num = typeof val === 'number' ? val : parseFloat(val.toString().replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? null : num;
  };

  // --- Fix: save term as years string (e.g., '5 Years') ---
  const toYearsString = (months: any): string => {
    const n = parseInt(months, 10);
    if (isNaN(n) || n === 0) return '';
    const years = n / 12;
    return years === 1 ? '1 Year' : `${years} Years`;
  };

  // Utility to flatten financials for 2023, 2024, 2025YTD
  function flattenFinancials(financials: any) {
    return {
      // 2023
      ebitda2023: financials.year2023?.summary?.ebitda ?? '',
      revenue2023: financials.year2023?.input?.revenue ?? '',
      cogs2023: financials.year2023?.input?.cogs ?? '',
      grossProfit2023: financials.year2023?.summary?.grossProfit ?? '',
      operatingExpenses2023: financials.year2023?.input?.operatingExpenses ?? '',
      nonRecurringIncome2023: financials.year2023?.input?.nonRecurringIncome ?? '',
      nonRecurringExpenses2023: financials.year2023?.input?.nonRecurringExpenses ?? '',
      depreciation2023: financials.year2023?.input?.depreciation ?? '',
      amortization2023: financials.year2023?.input?.amortization ?? '',
      operatingIncome2023: financials.year2023?.summary?.operatingIncome ?? '',
      // 2024
      ebitda2024: financials.year2024?.summary?.ebitda ?? '',
      revenue2024: financials.year2024?.input?.revenue ?? '',
      cogs2024: financials.year2024?.input?.cogs ?? '',
      grossProfit2024: financials.year2024?.summary?.grossProfit ?? '',
      operatingExpenses2024: financials.year2024?.input?.operatingExpenses ?? '',
      nonRecurringIncome2024: financials.year2024?.input?.nonRecurringIncome ?? '',
      nonRecurringExpenses2024: financials.year2024?.input?.nonRecurringExpenses ?? '',
      depreciation2024: financials.year2024?.input?.depreciation ?? '',
      amortization2024: financials.year2024?.input?.amortization ?? '',
      operatingIncome2024: financials.year2024?.summary?.operatingIncome ?? '',
      // 2025YTD
      ebitda2025YTD: financials.year2025YTD?.summary?.ebitda ?? '',
      revenue2025YTD: financials.year2025YTD?.input?.revenue ?? '',
      cogs2025: financials.year2025YTD?.input?.cogs ?? '',
      grossProfit2025: financials.year2025YTD?.summary?.grossProfit ?? '',
      operatingExpenses2025: financials.year2025YTD?.input?.operatingExpenses ?? '',
      nonRecurringIncome2025: financials.year2025YTD?.input?.nonRecurringIncome ?? '',
      nonRecurringExpenses2025: financials.year2025YTD?.input?.nonRecurringExpenses ?? '',
      depreciation2025: financials.year2025YTD?.input?.depreciation ?? '',
      amortization2025: financials.year2025YTD?.input?.amortization ?? '',
      operatingIncome2025: financials.year2025YTD?.summary?.operatingIncome ?? '',
      ytdMonth: financials.year2025YTD?.ytdMonth ?? '',
    };
  }

  // Utility to flatten debts into grouped, indexed fields for backend
  function flattenDebts(debts: any[]) {
    // Group by category
    const grouped: {
      REAL_ESTATE: any[];
      VEHICLE_EQUIPMENT: any[];
      CREDIT_CARD: any[];
      LINE_OF_CREDIT: any[];
      OTHER: any[];
    } = {
      REAL_ESTATE: [],
      VEHICLE_EQUIPMENT: [],
      CREDIT_CARD: [],
      LINE_OF_CREDIT: [],
      OTHER: []
    };
    for (const debt of debts) {
      if (!debt) continue;
      const category = debt.category as keyof typeof grouped;
      if (category in grouped) {
        (grouped[category] as any[]).push(debt);
      } else {
        grouped.OTHER.push(debt);
      }
    }
    // Map to field structure expected by backend
    const realEstate: Record<string, any> = {};
    grouped.REAL_ESTATE.slice(0, 5).forEach((d, idx) => {
      if (!d) return;
      realEstate[(idx + 1).toString()] = {
        address: d?.description ?? '',
        lenderNotes: d?.notes ?? '',
        minimumMonthly: d?.monthlyPayment ?? '',
        originalLoan: d?.originalLoanAmount ?? '',
        outstandingBalance: d?.outstandingBalance ?? ''
      };
    });
    const vehicleEquipment: Record<string, any> = {};
    grouped.VEHICLE_EQUIPMENT.slice(0, 5).forEach((d, idx) => {
      if (!d) return;
      vehicleEquipment[(idx + 1).toString()] = {
        lenderName: d?.notes ?? '',
        notes: d?.description ?? '',
        minimumMonthly: d?.monthlyPayment ?? '',
        originalLoan: d?.originalLoanAmount ?? '',
        outstandingBalance: d?.outstandingBalance ?? ''
      };
    });
    const creditCards: Record<string, any> = {};
    grouped.CREDIT_CARD.slice(0, 5).forEach((d, idx) => {
      if (!d) return;
      creditCards[(idx + 1).toString()] = {
        lenderName: d?.description ?? '',
        notes: d?.notes ?? '',
        minimumMonthly: d?.monthlyPayment ?? '',
        creditLimit: d?.originalLoanAmount ?? '',
        balance: d?.outstandingBalance ?? ''
      };
    });
    const linesOfCredit: Record<string, any> = {};
    grouped.LINE_OF_CREDIT.slice(0, 5).forEach((d, idx) => {
      if (!d) return;
      linesOfCredit[(idx + 1).toString()] = {
        lenderName: d?.description ?? '',
        notes: d?.notes ?? '',
        minimumMonthly: d?.monthlyPayment ?? '',
        creditLimit: d?.originalLoanAmount ?? '',
        outstandingBalance: d?.outstandingBalance ?? ''
      };
    });
    const otherDebts: Record<string, any> = {};
    grouped.OTHER.slice(0, 5).forEach((d, idx) => {
      if (!d) return;
      otherDebts[(idx + 1).toString()] = {
        description: d?.description ?? '',
        notes: d?.notes ?? '',
        minimumMonthly: d?.monthlyPayment ?? '',
        originalLoan: d?.originalLoanAmount ?? '',
        outstandingBalance: d?.outstandingBalance ?? ''
      };
    });
    return {
      realEstate,
      vehicleEquipment,
      creditCards,
      linesOfCredit,
      otherDebts
    };
  }

  // --- Progress Bar Calculation Helper ---
  function getProgressWidth() {
    if (!steps || steps.length === 0) return 0;
    // Show progress as (currentStep - 1) / (steps.length - 1) for 0% to 100%
    if (currentStep <= 1) return 0;
    if (currentStep >= steps.length) return 100;
    return ((currentStep - 1) / (steps.length - 1)) * 100;
  }

  // --- Save Draft to Supabase ---
  const saveDraft = async () => {
    if (!hydrated) {
      console.warn('[DEBUG] Blocked saveDraft: not hydrated yet.');
      return;
    }
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user?.id) {
        console.warn("Cannot save draft, user not available.");
        return; // Don't proceed if user isn't available
    }
    const userId = userData.user.id;

    // Compose enriched debts JSONB
    const debtSummary = calculateDebtSummary(debtsRef.current || []);
    const creditUtilizationRateRaw = debtSummary.creditUtilizationRate;
    const creditUtilizationRateFormatted =
      creditUtilizationRateRaw == null ? null : `${(creditUtilizationRateRaw * 100).toFixed(1)}%`;
    // Safely parse YTD month number for use in debtsJson
    const ytdMonthRaw = financials.year2025YTD?.ytdMonth;
    let ytdMonthNum = 0;
    if (ytdMonthRaw) {
      if (/^\d+$/.test(ytdMonthRaw)) ytdMonthNum = parseInt(ytdMonthRaw, 10);
      else {
        const monthMap = {
          'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
          'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
        };
        ytdMonthNum = monthMap[ytdMonthRaw as keyof typeof monthMap] || 0;
      }
    }

    const debtsJson = {
      entries: debtsRef.current || [],
      monthlyDebtService: debtSummary.monthlyDebtService,
      annualDebtService: debtSummary.annualDebtService,
      totalCreditBalance: debtSummary.totalCreditBalance,
      totalCreditLimit: debtSummary.totalCreditLimit,
      creditUtilizationRate: creditUtilizationRateFormatted,
      categoryTotals: debtSummary.categoryTotals,
      totalDebtService: {
        '2023': debtSummary.annualDebtService + (Number(loanInfo.annualizedLoan) || 0),
        '2024': debtSummary.annualDebtService + (Number(loanInfo.annualizedLoan) || 0),
        '2025YTD': debtSummary.annualDebtService * (ytdMonthNum / 12) + (Number(loanInfo.annualizedLoan) || 0) * (ytdMonthNum / 12),
      },
    };

    // Helper to get the number of months for YTD (from month string)
    const getYTDMonthNumber = () => {
      const ytdMonth = financials.year2025YTD?.ytdMonth;
      if (!ytdMonth) return 0;
      if (/^\d+$/.test(ytdMonth)) return parseInt(ytdMonth, 10);
      const monthMap = {
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
      const annualDebtService = (debts || []).reduce((sum, d) => sum + (parseFloat(d.monthlyPayment.replace(/[^\d.]/g, '')) || 0), 0) * 12;
      if (year === '2023' || year === '2024') return annualDebtService;
      if (year === '2025YTD') {
        const months = getYTDMonthNumber();
        if (!months) return 0;
        return (annualDebtService * months) / 12;
      }
      return 0;
    };

    // --- Ensure financials summaries are up to date before DSCR calculation ---

    const processedFinancials = {
      year2023: {
        input: financials.year2023?.input || {},
        summary: convertToNumeric(financials.year2023?.input || {})
      },
      year2024: {
        input: financials.year2024?.input || {},
        summary: convertToNumeric(financials.year2024?.input || {})
      },
      year2025YTD: {
        input: financials.year2025YTD?.input || {},
        summary: convertToNumeric(financials.year2025YTD?.input || {}),
        ytdMonth: financials.year2025YTD?.ytdMonth || ''
      }
    };

    // Compose DSCRs for all years (rounded to 2 decimal points)
    const { calculateDSCR: calculateDSCRReview } = require('@/app/(components)/ReviewSubmitStep.dscr');
    const dscrResults = calculateDSCRReview(
      processedFinancials,
      {
        '2023': getAnnualDebtService('2023'),
        '2024': getAnnualDebtService('2024'),
        '2025YTD': getAnnualDebtService('2025YTD'),
      },
      {
        '2023': getAnnualizedLoanPayment('2023'),
        '2024': getAnnualizedLoanPayment('2024'),
        '2025YTD': getAnnualizedLoanPayment('2025YTD'),
      }
    );
    const round2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);
    const dscrs = {
      '2023': round2(dscrResults.dscr2023),
      '2024': round2(dscrResults.dscr2024),
      '2025YTD': round2(dscrResults.dscr2025),
    };
    // Use processedFinancials for saving as well
    // ...

    // --- Compose draftData ---
    const draftData: { [key: string]: any } = {
      user_id: userId, // Always include user_id for RLS
      business_name: loanInfo.businessName?.trim() || "",
      loan_purpose: loanInfo.loanPurpose || null,
      // Add first/last name
      first_name: loanInfo.firstName || null,
      last_name: loanInfo.lastName || null,
      desired_amount: toNumberOrNull(loanInfo.desiredAmount),
      estimated_payment: toNumberOrNull(loanInfo.estimatedPayment),
      down_payment: toNumberOrNull(loanInfo.downPayment),
      down_payment293: loanInfo.downPayment293 || null,
      proposed_loan: toNumberOrNull(loanInfo.proposedLoan),
      term: toYearsString(loanInfo.term), // Fix: save term as years string
      interest_rate: toNumberOrNull(loanInfo.interestRate),
      annualized_loan: toNumberOrNull(loanInfo.annualizedLoan),
      financials: financials || {}, // Ensure it's an object
      debts: debtsJson,
      status: 'inprogress',
      dscr: dscrs,
    };
    try {
        // Use draftId directly from state
        let currentDraftId = draftId;

        if (!currentDraftId) {
          // If draftId is not in state, it means we need to create a new draft.
          console.log('[DEBUG] No draftId found in state. Inserting new draft.');
          const { error, data } = await supabase
            .from('cash_flow_analyses')
            .insert([{ ...draftData }])
            .select('id')
            .single();
          if (error) {
            console.error('[DEBUG] Supabase insert error:', error, error?.message, error?.details, error?.hint);
          } else if (data?.id) {
            setDraftId(data.id);
            console.log('[DEBUG] Supabase insert success, new draftId:', data.id);
          } else {
            console.error('[DEBUG] Supabase insert: No ID returned.');
          }
        } else {
          // Update existing draft
          console.log('[DEBUG] Using draftId for update:', currentDraftId);
          // 1. Fetch existing row
          const { data: existingRows, error: fetchError } = await supabase
            .from('cash_flow_analyses')
            .select('*')
            .eq('id', currentDraftId)
            .limit(1);
          if (fetchError) {
            console.error('[DEBUG] Supabase fetch error before update:', fetchError);
            // Optionally, fallback to updating with just draftData
          }
          const existingRow = (existingRows && existingRows.length > 0) ? existingRows[0] : {};
          // 2. Merge existing row with draftData (draftData takes precedence)
          const mergedData = { ...existingRow, ...draftData };
          // 3. Update with merged object
          const { error, data } = await supabase
            .from('cash_flow_analyses')
            .update(mergedData)
            .eq('id', currentDraftId);
          if (error) {
            console.error('[DEBUG] Supabase update error:', error, error?.message, error?.details, error?.hint);
          } else {
            console.log('[DEBUG] Supabase update success:', data);
          }
        }
    } catch (err) {
      console.error('[DEBUG] Draft save error:', err);
    }
  };

  const handleNext = useCallback(async () => { // Make async if saveDraft is needed
    if (!hydrated) {
      console.warn('[DEBUG handleNext] Blocked: not hydrated yet.');
      return;
    }
    const currentRef = stepRefs[currentStep as keyof typeof stepRefs];
    let isValid = false;
    if (currentRef?.current?.validate) {
      isValid = currentRef.current.validate(); // Call child validation directly
    } else {
      console.warn(`[DEBUG handleNext] No validate function found or ref not ready for step ${currentStep}`);
      isValid = false;
    }

    if (isValid) {
      await saveDraft(); // Save progress before moving to the next step
      setCurrentStep((prev) => {
        const nextStep = Math.min(prev + 1, steps.length);
        return nextStep;
      });
      
      // Move scrolling outside of state update callback to ensure it happens after state is updated
      // Special handling for step 3 to 4 transition with a slight delay to ensure it works properly
      if (typeof window !== 'undefined') {
        if (currentStep === 3) {
          // Use a slightly longer timeout for step 3 to 4 to ensure it works reliably
          setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }), 50);
        } else {
          // For all other transitions
          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }
      }
      setIsStepValid(false); // Reset validity for the next step's initial state
    } else {
      console.warn(`[handleNext] Validation failed for step ${currentStep}. Cannot proceed.`);
      // Toast or other user feedback should be handled by child's validate function
    }
  }, [currentStep, stepRefs, hydrated]);

  const handleBack = useCallback(() => {
    if (!hydrated) {
      console.warn('[DEBUG handleBack] Blocked: not hydrated yet.');
      return;
    }
    // Allow going back from Step 2 to Step 1 without validation
    if (currentStep === 2) {
      setCurrentStep(1);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
      setIsStepValid(false);
      return;
    }
    // For other steps, keep validation if desired
    const currentRef = stepRefs[currentStep as keyof typeof stepRefs];
    let isValid = false;
    if (currentRef?.current?.validate) {
      isValid = currentRef.current.validate();
    } else {
      isValid = true;
    }
    if (isValid) {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
      setIsStepValid(false);
    } else {
      console.warn(`[handleBack] Validation failed for step ${currentStep}. Cannot go back.`);
    }
  }, [currentStep, stepRefs, hydrated]);

  // --- Memoized debts change handler for BusinessDebtsStep ---
  const handleDebtsChange = useCallback((debts: Debt[]) => {
    setDebts(debts);
  }, []);

  // --- Submit Logic ---
  // Wrap handleSubmit in useCallback
  const handleSubmit = useCallback(async (): Promise<{ submissionId?: string }> => { 
    console.log('Reached handleSubmit');
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('User object:', user);
    if (!user) {
      console.error('User not authenticated (client-side)');
      throw new Error('User not authenticated');
    }
    if (submitStatus === 'submitting') {
      console.warn('[SUBMIT] Submission already in progress.');
      return {};
    }
    setSubmitStatus('submitting');
    setSubmitError(null);
    try {
      // --- Build flat draftData matching cashFlowFieldMap ---
      const debtsFlat = flattenDebts(debts);
      const draftData = {
        // User info
        email: userEmail ?? user?.email ?? '',
        businessName: loanInfo.businessName,
        firstName: loanInfo.firstName,
        lastName: loanInfo.lastName,
        loanPurpose: loanInfo.loanPurpose,
        totalProjectAmount: loanInfo.desiredAmount,
        downPaymentPercent: loanInfo.downPayment,
        downPaymentAmount: loanInfo.downPayment293,
        proposedLoanAmount: loanInfo.proposedLoan,
        term: loanInfo.term,
        interestRate: loanInfo.interestRate,
        annualizedLoan: loanInfo.annualizedLoan,
        financials, // <--- Ensure full financials object is sent
        ...flattenFinancials(financials),
        ...debtsFlat,
        draftId,
      };
      console.debug('[SUBMIT] Draft data payload:', draftData);
      const accessToken = user?.access_token;
      // --- Update PDF URLs in Supabase record (PDF generation logic) ---
      // TODO: Decide how to handle PDF URLs when external PDF generation is skipped
      const pdfData = { cashFlow: { pdfUrl: null }, debtSummary: { pdfUrl: null }}; // Placeholder

      if (draftId) {
        const { error: updateError } = await supabase
          .from('cash_flow_analyses')
          .update({
            cash_flow_pdf_url: pdfData.cashFlow?.pdfUrl || null,
            debt_summary_pdf_url: pdfData.debtSummary?.pdfUrl || null,
            status: 'submitted', // Update status to 'submitted' when the form is submitted
          })
          .eq('id', draftId);
        if (updateError) {
          console.error('[SUBMIT] Supabase PDF URL update error:', updateError);
          throw new Error('Failed to update PDF URLs in database: ' + (updateError.message || JSON.stringify(updateError)));
        } else {
          console.debug('[SUBMIT] Supabase PDF URLs updated successfully.');
        }
      } else {
        console.warn('[SUBMIT] No draftId found, skipping PDF URL update.');
      }

      // --- Calculate DSCR 2024 for redirect ---
      const { calculateDSCR: calculateDSCRReview } = require('@/app/(components)/ReviewSubmitStep.dscr');
      const getYTDMonthNumber = () => {
        const ytdMonth = financials.year2025YTD?.ytdMonth;
        if (!ytdMonth) return 0;
        if (/^\d+$/.test(ytdMonth)) return parseInt(ytdMonth, 10);
        const monthMap = {
          'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
          'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
        };
        return monthMap[ytdMonth as keyof typeof monthMap] || 0;
      };
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
      const getAnnualDebtService = (year: '2023' | '2024' | '2025YTD') => {
        const annualDebtService = (debts || []).reduce((sum, d) => sum + (parseFloat(d.monthlyPayment.replace(/[^\d.]/g, '')) || 0), 0) * 12;
        if (year === '2023' || year === '2024') return annualDebtService;
        if (year === '2025YTD') {
          const months = getYTDMonthNumber();
          if (!months) return 0;
          return (annualDebtService * months) / 12;
        }
        return 0;
      };
      const dscrResults = calculateDSCRReview(
        financials,
        {
          '2023': getAnnualDebtService('2023'),
          '2024': getAnnualDebtService('2024'),
          '2025YTD': getAnnualDebtService('2025YTD'),
        },
        {
          '2023': getAnnualizedLoanPayment('2023'),
          '2024': getAnnualizedLoanPayment('2024'),
          '2025YTD': getAnnualizedLoanPayment('2025YTD'),
        }
      );
      const round2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);
      const dscr2024 = round2(dscrResults.dscr2024);
      console.debug('[SUBMIT] Calculated DSCR 2024:', dscr2024);
      // --- End submission logic ---
      setSubmitStatus('success');
      router.push(`/report-preview?id=${draftId}`); 
      return { submissionId: 'simulated-id' }; 
    } catch (err: any) {
      console.error('[SUBMIT] Submission failed:', err);
      setSubmitError('Submission failed. Please try again. ' + (err?.message || ''));
      setSubmitStatus('error');
      return {};
    }
  }, [submitStatus, loanInfo, financials, debts, userEmail, draftId, supabase, setSubmitStatus, setSubmitError, setPdfUrls, setDraftId, router]);
  // Defensive fallback for currentStepComponent
  let currentStepComponent;
  switch (currentStep) {
    case 1:
      currentStepComponent = (
        <LoanInfoStep 
          ref={loanInfoStepRef}
          initialData={loanInfo}
          onFormDataChange={setLoanInfo}
          isFormValid={setIsStepValid}
          onNext={handleNext}
        />
      );
      break;
    case 2:
      currentStepComponent = (
        <FinancialsStep 
          ref={financialsStepRef}
          initialData={financials}
          onFormDataChange={setFinancials}
          isFormValid={setIsStepValid}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
      break;
    case 3:
      currentStepComponent = (
        <BusinessDebtsStep 
          ref={businessDebtsStepRef}
          initialData={debts}
          onFormDataChange={handleDebtsChange}
          isFormValid={setIsStepValid}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
      break;
    case 4:
      currentStepComponent = (
        <ReviewSubmitStep
          loanInfo={{
            ...loanInfo,
            id: draftId ?? undefined,
            desiredAmount: loanInfo.desiredAmount ? parseFloat(String(loanInfo.desiredAmount).replace(/[^0-9.]/g, "")) || 0 : 0,
            estimatedPayment: loanInfo.estimatedPayment ? parseFloat(String(loanInfo.estimatedPayment).replace(/[^0-9.]/g, "")) || 0 : 0,
            annualizedLoan: loanInfo.annualizedLoan ? parseFloat(String(loanInfo.annualizedLoan).replace(/[^0-9.]/g, "")) || 0 : 0,
            email: userEmail ?? undefined, // Ensure user email is passed
          }}
          financials={financials}
          debts={debts}
          categories={categories}
          onSubmit={handleSubmit}
          onBack={handleBack}
          submitStatus={submitStatus}
          submitError={submitError ?? null}
          pdfUrls={pdfUrls ?? null}
          
          onSaveDraft={saveDraft}
          onConfirmChange={setIsReviewConfirmed}
        />
      );
      break;
    default:
      currentStepComponent = <div className="text-center text-red-600">Unknown or invalid step.</div>;
  }

  // Defensive: always render main content
  return (
    <div id="__page-root" className="min-h-screen bg-gray-100">
      {/* Global Navigation */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30">
        <div className="max-w-[1200px] h-full mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            BlaBolt
          </Link>
          <div className="flex items-center gap-8">
            <Link 
              href="/comprehensive-cash-flow-analysis" 
              className="text-sm font-medium text-blue-600"
            >
              Cash Flow Analysis
            </Link>
            <Link 
              href="/loan-services" 
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Loan Services
            </Link>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Check Now—Free & Fast
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {!hydrated ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          <div className="text-lg font-semibold text-gray-700">Loading your data...</div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="min-h-[400px]">
  {/* Wizard Header with Blue Background */}
  <div className="rounded-xl mb-6 p-5 pb-4 shadow-lg border border-blue-900 bg-gradient-to-br from-[#002c55] to-[#02396e]">
    <h2 className="text-3xl font-bold mb-1 text-center text-white tracking-tight drop-shadow-sm">
      Comprehensive Cash Flow Analysis
    </h2>
    <p className="text-center text-blue-100 mb-3 text-base max-w-4xl mx-auto font-medium">
    We’ll guide you step-by-step to build a funding-ready cash flow report — perfect for loan applications.    </p>
    {/* Sleek Stepper with Progress Bar */}
    <div className="relative mb-0">
      {/* Progress Bar (background) */}
      <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-1.5 bg-white rounded-full z-0" style={{height: '6px'}} />
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1.5 bg-blue-300 rounded-full z-10 transition-all duration-500" style={{width: `${getProgressWidth()}%`, height: '6px'}} />
      {/* Step Icons and Titles */}
      <div className="relative flex justify-between items-center z-20 px-2">
        {steps.map((step, idx) => {
          // Icon selection
          let icon = null;
          if (step.id === 1) icon = (
            // Identification/User Icon
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9.004 9.004 0 0112 15c2.003 0 3.868.659 5.293 1.764M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          );
          if (step.id === 2) icon = (
            // Classic Dollar Sign Icon
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 7c0-2.21-2.239-4-5-4s-5 1.79-5 4c0 2.21 2.239 4 5 4s5 1.79 5 4-2.239 4-5 4-5-1.79-5-4" />
            </svg>
          );
          if (step.id === 3) icon = (
            // Credit Card Icon
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="2" strokeLinejoin="round" /><path d="M2 10h20" /></svg>
          );
          if (step.id === 4) icon = (
            // Clipboard Check Icon
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5h6a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2zm0 0V3a2 2 0 012-2h2a2 2 0 012 2v2" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2 2 4-4" /></svg>
          );
          // Step state
          const isComplete = currentStep > step.id;
          const isActive = currentStep === step.id;
          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div className={`relative z-20 flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all duration-300
                ${isActive ? 'bg-white border-blue-500 shadow-2xl scale-110 ring-4 ring-blue-400 ring-offset-2 ring-offset-[#002c55]' : isComplete ? 'bg-green-500 border-green-300 text-white' : 'bg-blue-900 border-blue-700 text-blue-200'}`}
              >
                {isComplete ? (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <span className={isActive ? 'text-blue-700' : isComplete ? 'text-white' : 'text-blue-200'}>{icon}</span>
                )}
              </div>
              <div className={`mt-2 text-xs font-semibold text-center transition-colors duration-300
                ${isActive ? 'text-blue-100' : isComplete ? 'text-green-100' : 'text-blue-200'}`}
              >
                {step.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
  {currentStepComponent}
</div>
          {/* Navigation Buttons */}
          <div className="mt-12 flex justify-between items-center">
            <button
              onClick={handleBack}
              className={`group px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2
                transition-all duration-300 transform
                ${currentStep === 1 
                  ? 'invisible' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:-translate-x-1'}`}
                disabled={!hydrated}
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="text-sm text-gray-500">
              Step {currentStep} of {steps.length}
            </div>
            <button
              onClick={currentStep === steps.length ? handleSubmit : handleNext}
              disabled={!hydrated || submitStatus === 'submitting' || (currentStep === steps.length && !isReviewConfirmed)}
              className="group px-6 py-3 rounded-lg bg-blue-600 text-white text-sm font-medium 
                flex items-center gap-2 hover:bg-blue-700 transition-all duration-300 transform hover:translate-x-1
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            >
              {submitStatus === 'submitting' && currentStep === steps.length ? (
                <>
                  <svg className="w-4 h-4 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Generating Reports...
                </>
              ) : (
                <>
                  {currentStep === steps.length ? 'Submit' : 'Save & Continue'}
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
          {submitStatus === 'error' && (
            <div className="text-red-600 font-semibold">Error: {submitError}</div>
          )}
        </div>
      )}
      <Toast message={toastMessage} visible={toastVisible} onClose={closeToast} />
    </div>
  );
}
