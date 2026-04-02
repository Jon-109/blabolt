'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation';
// Import helper for runtime dynamic import
// (actual import is done inside useEffect to avoid SSR issues)

import LoanInfoStep from '@/app/(components)/LoanInfoStep'
import FinancialsStep from '@/app/(components)/FinancialsStep'
// Import the necessary types from FinancialsStep
import type { FinancialsPayload, FullFinancialData, NumericFinancialData } from '@/app/(components)/FinancialsStep'; 
import BusinessDebtsStep from '@/app/(components)/BusinessDebtsStep'
import type { Debt, DebtCategory } from '@/app/(components)/BusinessDebtsStep';
import { ReviewSubmitStep } from '@/app/(components)/ReviewSubmitStep'
import { categories } from '@/app/(components)/BusinessDebtsStep';
import { supabase } from '@/supabase/helpers/client'
import { Toast, useToast } from '@/app/(components)/shared/Toast'; // Import Toast and useToast
import {
  buildDebtMetrics,
  calculateDebtSummary,
  calculateDscrResults,
  formatCreditUtilizationRate,
  formatTermForStorage,
  normalizeFinancialsPayload,
  roundDscrMap,
} from '@/lib/financial/calculations';
import type { LoanInfoData } from '@/app/(components)/LoanInfoStep';
import { getTemplateSharedProfile, upsertTemplateSharedProfile } from '@/lib/templates/profile';
import TemplatePageShell from '@/app/(components)/templates/shared/TemplatePageShell';
import TemplateHeroProgressBar from '@/app/(components)/templates/shared/TemplateHeroProgressBar';
import type { Json } from '@/types/supabase';

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
  year2024: { 
    input: createEmptyFullFinancialData(),
    summary: createEmptyNumericFinancialData(),
  },
  year2025: { 
    input: createEmptyFullFinancialData(),
    summary: createEmptyNumericFinancialData(),
  },
  year2026YTD: { 
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

const mobileStepTitles: Record<number, string> = {
  1: 'Loan Info',
  2: 'Financials',
  3: 'Debts',
  4: 'Review',
};

const FINANCIAL_PROGRESS_FIELDS: Array<keyof FullFinancialData> = [
  'revenue',
  'cogs',
  'operatingExpenses',
  'nonRecurringIncome',
  'nonRecurringExpenses',
  'depreciation',
  'amortization',
  'interest',
  'taxes',
];

const PROGRESS_STEP_WEIGHT = 33;

const hasMeaningfulValue = (value: unknown) => {
  if (value == null) return false;
  if (typeof value === 'number') return Number.isFinite(value);
  const stringValue = String(value).trim();
  if (!stringValue || stringValue === '$') return false;
  return /[A-Za-z0-9]/.test(stringValue);
};

type AccessPayload = {
  canAccessComprehensive?: boolean;
} | null;

type FetchAccessResult = {
  ok: boolean;
  payload: AccessPayload;
};

type StoredDebtEntries = {
  entries?: Json;
};

type PdfGenerationResponse = {
  error?: string;
  pdfUrl?: string | null;
};

const DEBT_CATEGORIES: DebtCategory[] = [
  'REAL_ESTATE',
  'VEHICLE_EQUIPMENT',
  'CREDIT_CARD',
  'LINE_OF_CREDIT',
  'OTHER',
];

const isDebt = (value: unknown): value is Debt => {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.category === 'string' &&
    DEBT_CATEGORIES.includes(candidate.category as DebtCategory) &&
    typeof candidate.description === 'string' &&
    typeof candidate.monthlyPayment === 'string' &&
    typeof candidate.originalLoanAmount === 'string' &&
    typeof candidate.outstandingBalance === 'string' &&
    (candidate.notes === undefined || typeof candidate.notes === 'string')
  );
};

const extractStoredDebts = (value: Json | null | undefined): Debt[] => {
  if (Array.isArray(value)) {
    return (value as unknown[]).filter(isDebt);
  }

  if (value && typeof value === 'object' && 'entries' in value) {
    const entries = (value as StoredDebtEntries).entries;
    return Array.isArray(entries) ? (entries as unknown[]).filter(isDebt) : [];
  }

  return [];
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '';
};

const getLoanInfoDraftSignature = (loanInfo: LoanInfoData) =>
  JSON.stringify({
    businessName: loanInfo.businessName,
    firstName: loanInfo.firstName,
    lastName: loanInfo.lastName,
    loanPurpose: loanInfo.loanPurpose,
    desiredAmount: loanInfo.desiredAmount,
    estimatedPayment: loanInfo.estimatedPayment,
    downPayment: loanInfo.downPayment,
    downPayment293: loanInfo.downPayment293,
    proposedLoan: loanInfo.proposedLoan,
    term: loanInfo.term,
    interestRate: loanInfo.interestRate,
    annualizedLoan: loanInfo.annualizedLoan,
  });

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const comprehensivePagePath = '/comprehensive-cash-flow-analysis';
  const requestedAnalysisId = searchParams.get('analysisId');
  const pendingCheckoutSessionId = searchParams.get('session_id');
  const isEditingExistingAnalysis = searchParams.get('edit') === '1' && Boolean(requestedAnalysisId);
  const comprehensiveRedirectPath = isEditingExistingAnalysis && requestedAnalysisId
    ? `${comprehensivePagePath}?analysisId=${encodeURIComponent(requestedAnalysisId)}&edit=1`
    : comprehensivePagePath;

  // --- Protect route: redirect to login if not authenticated ---
  // --- Also redirect to report-preview if user already has a submitted analysis ---
  useEffect(() => {
    async function checkAuthAndPurchase() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user ?? null;

      if (!user) {
        setCurrentStep(1);
        router.replace(`/login?redirectTo=${encodeURIComponent(comprehensiveRedirectPath)}`);
        return;
      }

      const fetchAccessPayload = async (): Promise<FetchAccessResult> => {
        const accessResponse = await fetch('/api/access/me', {
          cache: 'no-store',
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined,
        });

        if (!accessResponse.ok) {
          return { ok: false, payload: null };
        }

        return {
          ok: true,
          payload: (await accessResponse.json()) as AccessPayload,
        };
      };

      let accessResult = await fetchAccessPayload();
      if (!accessResult.ok) {
        setCurrentStep(1);
        router.replace(`/login?redirectTo=${encodeURIComponent(comprehensiveRedirectPath)}`);
        return;
      }

      if (!accessResult.payload?.canAccessComprehensive && pendingCheckoutSessionId && session?.access_token) {
        await fetch('/api/checkout/confirm-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ sessionId: pendingCheckoutSessionId }),
        }).catch(() => null);

        for (let attempt = 0; attempt < 4; attempt += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 900 * (attempt + 1)));
          accessResult = await fetchAccessPayload();
          if (!accessResult.ok || accessResult.payload?.canAccessComprehensive) {
            break;
          }
        }
      }

      const accessPayload = accessResult.payload;
      if (!accessPayload?.canAccessComprehensive) {
        setCurrentStep(1);
        router.replace('/cash-flow-analysis');
        return;
      }

      if (pendingCheckoutSessionId && typeof window !== 'undefined') {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.delete('session_id');
        window.history.replaceState({}, '', nextUrl.toString());
      }

      if (!isEditingExistingAnalysis) {
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
    }
    checkAuthAndPurchase();
  }, [comprehensiveRedirectPath, isEditingExistingAnalysis, pendingCheckoutSessionId, router]);

  // --- Listen for auth state changes: redirect to login on SIGNED_OUT, reset to step 1 on SIGNED_IN ---
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_OUT') {
        setCurrentStep(1);
        router.replace(`/login?redirectTo=${encodeURIComponent(comprehensiveRedirectPath)}`);
      } else if (event === 'SIGNED_IN') {
        setCurrentStep(1);
      }
    });
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [comprehensiveRedirectPath, router]);

  // --- SSR-safe state initialization: always start with defaults, hydrate from localStorage on client ---
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [, setIsStepValid] = useState(false);
  const [loanInfo, setLoanInfo] = useState<LoanInfoData>(getDefaultLoanInfo());
  const [financials, setFinancials] = useState<FinancialsPayload>(getDefaultFinancials());
  const [debts, setDebts] = useState<Array<Debt>>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [loadedAnalysisStatus, setLoadedAnalysisStatus] = useState<string | null>(null);
  const [debtProgressState, setDebtProgressState] = useState<{
    categoryCounts: Record<DebtCategory, number>;
    answeredCategories: Record<DebtCategory, boolean>;
  }>({
    categoryCounts: {
      REAL_ESTATE: 0,
      VEHICLE_EQUIPMENT: 0,
      CREDIT_CARD: 0,
      LINE_OF_CREDIT: 0,
      OTHER: 0,
    },
    answeredCategories: {
      REAL_ESTATE: false,
      VEHICLE_EQUIPMENT: false,
      CREDIT_CARD: false,
      LINE_OF_CREDIT: false,
      OTHER: false,
    },
  });

  // --- Add debtsRef to always have latest debts ---
  const debtsRef = useRef(debts);
  const lastSyncedBusinessNameRef = useRef('');
  const lastSavedLoanInfoSignatureRef = useRef(getLoanInfoDraftSignature(getDefaultLoanInfo()));
  const loanInfoAutosaveTimerRef = useRef<number | null>(null);
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
      setHydrated(false); // Block saves until restore is done
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('[DEBUG] fetchUserAndDraft: Error fetching user:', userError);
        // Reset form state if user fetch fails
        const defaultLoanInfo = getDefaultLoanInfo();
        setUserEmail(null);
        setLoanInfo(defaultLoanInfo);
        lastSavedLoanInfoSignatureRef.current = getLoanInfoDraftSignature(defaultLoanInfo);
        setFinancials(getDefaultFinancials());
        setDebts([]);
        setDraftId(null);
        setLoadedAnalysisStatus(null);
      } else if (user) {
        console.log('[DEBUG] fetchUserAndDraft: User found:', { id: user.id, email: user.email });
        setUserEmail(user.email || null);
        const sharedProfile = await getTemplateSharedProfile(user.id);
        const sharedBusinessName =
          sharedProfile.businessName || sharedProfile.businessLegalName || '';
        if (sharedBusinessName) {
          lastSyncedBusinessNameRef.current = sharedBusinessName;
        }

        // Always attempt to fetch the latest draft from Supabase for the authenticated user
        console.log(`[DEBUG] fetchUserAndDraft: Querying Supabase for draft with user_id: ${user.id}`);
        let draftQuery = supabase
          .from('cash_flow_analyses')
          .select('id, business_name, loan_purpose, desired_amount, estimated_payment, financials, debts, first_name, last_name, down_payment, down_payment293, proposed_loan, term, interest_rate, annualized_loan, status')
          .eq('user_id', user.id);

        if (requestedAnalysisId) {
          draftQuery = draftQuery.eq('id', requestedAnalysisId).limit(1);
        } else {
          draftQuery = draftQuery
            .eq('status', 'inprogress')
            .order('updated_at', { ascending: false })
            .limit(1);
        }

        const { data: dbDraftData, error: dbDraftError } = await draftQuery.maybeSingle();

        if (!dbDraftData && requestedAnalysisId) {
          console.error('[DEBUG] Requested analysis for edit was not found:', requestedAnalysisId);
          router.replace('/report-preview');
          return;
        }

        if (!dbDraftData && !requestedAnalysisId) {
          // No draft found for user, this is normal on first entry
          console.info('[DEBUG] No draft found for user, creating new blank draft row.');
          // Insert a new blank draft for this user
          const { data: newDraft, error: insertError } = await supabase
            .from('cash_flow_analyses')
            .insert([
              {
                user_id: user.id,
                status: 'inprogress',
                business_name: sharedBusinessName || '',
              },
            ])
            .select()
            .single();
          if (insertError) {
            // Only log as info if there is a real error, suppress if empty
            if (Object.keys(insertError).length > 0) {
              console.info('[DEBUG] Insert draft: harmless/expected insert error:', insertError);
            }
            // Reset form state if insert fails
            const defaultLoanInfo = getDefaultLoanInfo();
            setUserEmail(user.email || null);
            setLoanInfo(defaultLoanInfo);
            lastSavedLoanInfoSignatureRef.current = getLoanInfoDraftSignature(defaultLoanInfo);
            setFinancials(getDefaultFinancials());
            setDebts([]);
            setDraftId(null);
          } else if (newDraft) {
            console.log('[DEBUG] New draft created:', newDraft);
            const initialLoanInfo = {
              ...getDefaultLoanInfo(),
              id: newDraft.id,
              businessName: sharedBusinessName || '',
            };
            setDraftId(newDraft.id);
            setLoanInfo(initialLoanInfo);
            lastSavedLoanInfoSignatureRef.current = getLoanInfoDraftSignature(initialLoanInfo);
            setFinancials(getDefaultFinancials());
            setDebts([]);
            setLoadedAnalysisStatus('inprogress');
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
          setLoadedAnalysisStatus(dbDraftData.status || 'inprogress');

          const newLoanInfo = {
            ...getDefaultLoanInfo(), 
            id: dbDraftData.id, 
            businessName: dbDraftData.business_name || sharedBusinessName || '',
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
          lastSavedLoanInfoSignatureRef.current = getLoanInfoDraftSignature(newLoanInfo);

          if (dbDraftData.financials) {
            console.log('[DEBUG] fetchUserAndDraft: Setting financials:', dbDraftData.financials);
            setFinancials(normalizeFinancialsPayload(dbDraftData.financials));
          } else {
            console.log('[DEBUG] fetchUserAndDraft: No financials in DB draft, resetting to default.');
            setFinancials(getDefaultFinancials()); 
          }

          if (dbDraftData.debts) {
            const processedDebts = extractStoredDebts(dbDraftData.debts);
            console.log('[DEBUG] fetchUserAndDraft: Setting debts:', processedDebts);
            setDebts(processedDebts);
          } else {
            console.log('[DEBUG] fetchUserAndDraft: No debts in DB draft, resetting to default.');
            setDebts([]); 
          }
        } else if (dbDraftError && dbDraftError.code !== 'PGRST116') { 
          console.error('[DEBUG] fetchUserAndDraft: Error loading draft from Supabase (and not PGRST116). Resetting form.');
          const defaultLoanInfo = getDefaultLoanInfo();
          setLoanInfo(defaultLoanInfo);
          lastSavedLoanInfoSignatureRef.current = getLoanInfoDraftSignature(defaultLoanInfo);
          setFinancials(getDefaultFinancials());
          setDebts([]);
          setDraftId(null);
          setLoadedAnalysisStatus(null);
        } else {
          console.log('[DEBUG] fetchUserAndDraft: No draft found in Supabase (or PGRST116 error). Resetting form to defaults.');
          const defaultLoanInfo = getDefaultLoanInfo();
          setLoanInfo(defaultLoanInfo);
          lastSavedLoanInfoSignatureRef.current = getLoanInfoDraftSignature(defaultLoanInfo);
          setFinancials(getDefaultFinancials());
          setDebts([]);
          setDraftId(null);
          setLoadedAnalysisStatus(null);
        }
      } else {
        console.log('[DEBUG] fetchUserAndDraft: No user logged in. Resetting form to default state.');
        const defaultLoanInfo = getDefaultLoanInfo();
        setUserEmail(null);
        setLoanInfo(defaultLoanInfo);
        lastSavedLoanInfoSignatureRef.current = getLoanInfoDraftSignature(defaultLoanInfo);
        setFinancials(getDefaultFinancials());
        setDebts([]);
        setDraftId(null);
        setLoadedAnalysisStatus(null);
      }
      setHydrated(true); 
      console.log('[DEBUG] fetchUserAndDraft: Finished. Hydrated set to true.');
    };

    fetchUserAndDraft();
  }, [requestedAnalysisId, router]); // Reload if a specific analysis is requested.

  useEffect(() => {
    return () => {
      if (loanInfoAutosaveTimerRef.current) {
        window.clearTimeout(loanInfoAutosaveTimerRef.current);
      }
    };
  }, []);

  // --- Helper to convert numeric fields that might be stored as strings into numbers ---
  const toNumberOrNull = (val: unknown): number | null => {
    if (val === null || val === undefined || val === '') return null;
    const num = typeof val === 'number' ? val : parseFloat(val.toString().replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? null : num;
  };

  const buildAnalysisStatePayload = useCallback(() => {
    const normalizedFinancials = normalizeFinancialsPayload(financials);
    const debtMetrics = buildDebtMetrics(
      debtsRef.current || [],
      loanInfo.annualizedLoan,
      normalizedFinancials.year2026YTD?.ytdMonth,
    );
    const dscr = roundDscrMap(
      calculateDscrResults(
        normalizedFinancials,
        debtMetrics.annualDebtServices,
        debtMetrics.annualizedLoanPayments,
      ),
    );

    return {
      normalizedFinancials,
      debtsJson: {
        entries: debtsRef.current || [],
        monthlyDebtService: debtMetrics.debtSummary.monthlyDebtService,
        annualDebtService: debtMetrics.annualDebtServices,
        annualDebtServices: debtMetrics.annualDebtServices,
        totalCreditBalance: debtMetrics.debtSummary.totalCreditBalance,
        totalCreditLimit: debtMetrics.debtSummary.totalCreditLimit,
        creditUtilizationRate: formatCreditUtilizationRate(debtMetrics.debtSummary.creditUtilizationRate),
        categoryTotals: debtMetrics.debtSummary.categoryTotals,
        totalDebtService: debtMetrics.totalDebtService,
        annualizedLoanPayments: debtMetrics.annualizedLoanPayments,
      },
      dscr,
    };
  }, [financials, loanInfo.annualizedLoan]);

  // --- Save Draft to Supabase ---
  const saveDraft = useCallback(async (): Promise<string | null> => {
    if (!hydrated) {
      console.warn('[DEBUG] Blocked saveDraft: not hydrated yet.');
      return draftId;
    }
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user?.id) {
        console.warn("Cannot save draft, user not available.");
        return draftId; // Don't proceed if user isn't available
    }
    const userId = userData.user.id;

    const { normalizedFinancials, debtsJson, dscr } = buildAnalysisStatePayload();

    // --- Compose draftData ---
    const draftData = {
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
      term: formatTermForStorage(loanInfo.term),
      interest_rate: toNumberOrNull(loanInfo.interestRate),
      annualized_loan: toNumberOrNull(loanInfo.annualizedLoan),
      financials: normalizedFinancials,
      debts: debtsJson,
      status: loadedAnalysisStatus === 'submitted' ? 'submitted' : 'inprogress',
      dscr,
    };
    let currentDraftId = draftId;
    let saveSucceeded = false;
    try {

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
            const { data: existingActiveDraft } = await supabase
              .from('cash_flow_analyses')
              .select('id')
              .eq('user_id', userId)
              .eq('status', 'inprogress')
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (existingActiveDraft?.id) {
              currentDraftId = existingActiveDraft.id;
              setDraftId(existingActiveDraft.id);
              const { error: existingDraftUpdateError } = await supabase
                .from('cash_flow_analyses')
                .update(draftData)
                .eq('id', existingActiveDraft.id);
              if (existingDraftUpdateError) {
                console.error('[DEBUG] Failed updating existing active draft after insert race:', existingDraftUpdateError);
              } else {
                saveSucceeded = true;
              }
            }
          } else if (data?.id) {
            currentDraftId = data.id;
            setDraftId(data.id);
            saveSucceeded = true;
            console.log('[DEBUG] Supabase insert success, new draftId:', data.id);
          } else {
            console.error('[DEBUG] Supabase insert: No ID returned.');
          }
        } else {
          // Update existing draft
          console.log('[DEBUG] Using draftId for update:', currentDraftId);
          const { error, data } = await supabase
            .from('cash_flow_analyses')
            .update(draftData)
            .eq('id', currentDraftId);
          if (error) {
            console.error('[DEBUG] Supabase update error:', error, error?.message, error?.details, error?.hint);
          } else {
            saveSucceeded = true;
            console.log('[DEBUG] Supabase update success:', data);
          }
        }
    } catch (err) {
      console.error('[DEBUG] Draft save error:', err);
      return draftId;
    }

    if (saveSucceeded) {
      lastSavedLoanInfoSignatureRef.current = getLoanInfoDraftSignature(loanInfo);

      const nextBusinessName = loanInfo.businessName.trim();
      if (nextBusinessName && nextBusinessName !== lastSyncedBusinessNameRef.current) {
        lastSyncedBusinessNameRef.current = nextBusinessName;
        void upsertTemplateSharedProfile(userId, {
          businessName: nextBusinessName,
          businessLegalName: nextBusinessName,
        });
      }
    }
    return currentDraftId;
  }, [buildAnalysisStatePayload, draftId, hydrated, loadedAnalysisStatus, loanInfo]);

  useEffect(() => {
    if (!hydrated || currentStep !== 1) return;

    const nextSignature = getLoanInfoDraftSignature(loanInfo);
    if (nextSignature === lastSavedLoanInfoSignatureRef.current) return;

    if (loanInfoAutosaveTimerRef.current) {
      window.clearTimeout(loanInfoAutosaveTimerRef.current);
    }

    loanInfoAutosaveTimerRef.current = window.setTimeout(() => {
      void saveDraft();
    }, 900);

    return () => {
      if (loanInfoAutosaveTimerRef.current) {
        window.clearTimeout(loanInfoAutosaveTimerRef.current);
      }
    };
  }, [currentStep, hydrated, loanInfo, saveDraft]);

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
  }, [currentStep, hydrated, saveDraft, stepRefs]);

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

  useEffect(() => {
    const derivedCategoryCounts = categories.reduce((acc, category) => {
      acc[category.id as DebtCategory] = debts.filter((debt) => debt.category === category.id).length;
      return acc;
    }, {} as Record<DebtCategory, number>);

    setDebtProgressState((prev) => ({
      categoryCounts: {
        REAL_ESTATE: prev.answeredCategories.REAL_ESTATE ? prev.categoryCounts.REAL_ESTATE : derivedCategoryCounts.REAL_ESTATE,
        VEHICLE_EQUIPMENT: prev.answeredCategories.VEHICLE_EQUIPMENT ? prev.categoryCounts.VEHICLE_EQUIPMENT : derivedCategoryCounts.VEHICLE_EQUIPMENT,
        CREDIT_CARD: prev.answeredCategories.CREDIT_CARD ? prev.categoryCounts.CREDIT_CARD : derivedCategoryCounts.CREDIT_CARD,
        LINE_OF_CREDIT: prev.answeredCategories.LINE_OF_CREDIT ? prev.categoryCounts.LINE_OF_CREDIT : derivedCategoryCounts.LINE_OF_CREDIT,
        OTHER: prev.answeredCategories.OTHER ? prev.categoryCounts.OTHER : derivedCategoryCounts.OTHER,
      },
      answeredCategories: {
        REAL_ESTATE: prev.answeredCategories.REAL_ESTATE || derivedCategoryCounts.REAL_ESTATE > 0,
        VEHICLE_EQUIPMENT: prev.answeredCategories.VEHICLE_EQUIPMENT || derivedCategoryCounts.VEHICLE_EQUIPMENT > 0,
        CREDIT_CARD: prev.answeredCategories.CREDIT_CARD || derivedCategoryCounts.CREDIT_CARD > 0,
        LINE_OF_CREDIT: prev.answeredCategories.LINE_OF_CREDIT || derivedCategoryCounts.LINE_OF_CREDIT > 0,
        OTHER: prev.answeredCategories.OTHER || derivedCategoryCounts.OTHER > 0,
      },
    }));
  }, [debts]);

  // --- Submit Logic ---
  // Wrap handleSubmit in useCallback
  const handleSubmit = useCallback(async (): Promise<{ submissionId?: string }> => { 
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    const accessToken = session?.access_token ?? null;
    if (!user || !accessToken) {
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
      const savedDraftId = await saveDraft();
      if (!savedDraftId) {
        throw new Error('Failed to save analysis before submission.');
      }

      const generatePdf = async (type: 'full' | 'summary') => {
        const response = await fetch('/api/generate-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            analysisId: savedDraftId,
            type,
            accessToken,
            download: false,
          }),
          credentials: 'include',
        });

        const payload = (await response.json().catch(() => null)) as PdfGenerationResponse | null;
        if (!response.ok) {
          throw new Error(payload?.error || `Failed to generate ${type} PDF.`);
        }

        return payload?.pdfUrl as string | null | undefined;
      };

      const [cashFlowPdfUrl, debtSummaryPdfUrl] = await Promise.all([
        generatePdf('full'),
        generatePdf('summary'),
      ]);

      const { error: updateError } = await supabase
        .from('cash_flow_analyses')
        .update({ status: 'submitted' })
        .eq('id', savedDraftId);
      if (updateError) {
        throw new Error(updateError.message || 'Failed to finalize submission.');
      }

      setLoadedAnalysisStatus('submitted');
      setPdfUrls(JSON.stringify({
        cashFlowPdfUrl: cashFlowPdfUrl ?? null,
        debtSummaryPdfUrl: debtSummaryPdfUrl ?? null,
      }));
      setSubmitStatus('success');
      router.push(`/report-preview?id=${savedDraftId}`); 
      return { submissionId: savedDraftId }; 
    } catch (err: unknown) {
      console.error('[SUBMIT] Submission failed:', err);
      setSubmitError(`Submission failed. Please try again. ${getErrorMessage(err)}`.trim());
      setSubmitStatus('error');
      return {};
    }
  }, [router, saveDraft, submitStatus]);
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
          onProgressChange={setDebtProgressState}
          showCompletionProgress={false}
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
          
          onSaveDraft={async () => {
            await saveDraft();
          }}
          onConfirmChange={setIsReviewConfirmed}
        />
      );
      break;
    default:
      currentStepComponent = <div className="text-center text-red-600">Unknown or invalid step.</div>;
  }

  // Defensive: always render main content
  const formatHeroCurrency = (value: number | null | undefined) => {
    if (value == null || !Number.isFinite(value) || value === 0) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };
  const latestEbitda = Number(financials.year2025?.summary?.ebitda ?? 0);
  const monthlyDebtService = calculateDebtSummary(debts).monthlyDebtService;
  const completionPercent = useMemo(() => {
    const purchasePurposes = ['Purchase Business', 'Purchase Commercial Real Estate'];
    const step1VisibleFields: Array<keyof LoanInfoData> = [
      'businessName',
      'firstName',
      'lastName',
      'loanPurpose',
      'desiredAmount',
      ...(purchasePurposes.includes(loanInfo.loanPurpose)
        ? (['downPayment', 'downPayment293', 'proposedLoan', 'term', 'interestRate', 'annualizedLoan'] as Array<keyof LoanInfoData>)
        : []),
    ];
    const step1Completed = step1VisibleFields.filter((field) => hasMeaningfulValue(loanInfo[field])).length;
    const step1Ratio = step1VisibleFields.length > 0 ? step1Completed / step1VisibleFields.length : 0;

    const countFilledFinancialFields = (values: Partial<FullFinancialData> | undefined) =>
      FINANCIAL_PROGRESS_FIELDS.filter((field) => hasMeaningfulValue(values?.[field])).length;

    const step2TotalFields = FINANCIAL_PROGRESS_FIELDS.length * 3 + 1;
    const step2Completed =
      (financials.year2024?.skip ? FINANCIAL_PROGRESS_FIELDS.length : countFilledFinancialFields(financials.year2024?.input)) +
      countFilledFinancialFields(financials.year2025?.input) +
      (financials.year2026YTD?.skip
        ? FINANCIAL_PROGRESS_FIELDS.length + 1
        : countFilledFinancialFields(financials.year2026YTD?.input) + (hasMeaningfulValue(financials.year2026YTD?.ytdMonth) ? 1 : 0));
    const step2Ratio = step2TotalFields > 0 ? step2Completed / step2TotalFields : 0;

    const debtsByCategory = categories.reduce((acc, category) => {
      acc[category.id as DebtCategory] = debts.filter((debt) => debt.category === category.id);
      return acc;
    }, {} as Record<DebtCategory, Debt[]>);

    let step3TotalUnits = 0;
    let step3CompletedUnits = 0;

    categories.forEach((category) => {
      const categoryId = category.id as DebtCategory;
      const configuredCount = debtProgressState.categoryCounts[categoryId] ?? 0;
      const answered = debtProgressState.answeredCategories[categoryId] ?? false;
      const categoryEntries = debtsByCategory[categoryId] ?? [];

      step3TotalUnits += 1 + configuredCount * 4;
      if (answered) step3CompletedUnits += 1;

      for (let index = 0; index < configuredCount; index += 1) {
        const entry = categoryEntries[index];
        if (hasMeaningfulValue(entry?.description)) step3CompletedUnits += 1;
        if (hasMeaningfulValue(entry?.monthlyPayment)) step3CompletedUnits += 1;
        if (hasMeaningfulValue(entry?.originalLoanAmount)) step3CompletedUnits += 1;
        if (hasMeaningfulValue(entry?.outstandingBalance)) step3CompletedUnits += 1;
      }
    });

    const step3Ratio = step3TotalUnits > 0 ? step3CompletedUnits / step3TotalUnits : 0;
    const preReviewPercent = (step1Ratio + step2Ratio + step3Ratio) * PROGRESS_STEP_WEIGHT;

    return isReviewConfirmed ? 100 : Math.min(99, Math.round(preReviewPercent));
  }, [debtProgressState, debts, financials, isReviewConfirmed, loanInfo]);

  return (
    <div id="__page-root" className="min-h-screen">
      {!hydrated ? (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fafc_42%,_#f3f4f6_100%)] px-4">
          <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          <div className="text-lg font-semibold text-gray-700">Loading your analysis draft...</div>
        </div>
      ) : (
        <TemplatePageShell
          title="Comprehensive Cash Flow Analysis"
          subtitle="This guided workflow helps you complete a bank-level cash flow analysis."
          description="You’ll enter your business details, financials over multiple years, and debt information step by step, then review everything before submitting and getting report instantly."
          metricLabel="Key Metrics"
          metricValue=""
          metricContent={
            <div className="grid gap-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">2025 EBITDA</p>
                <p className="mt-2 text-2xl font-bold text-white">{formatHeroCurrency(latestEbitda)}</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                <p className="whitespace-nowrap text-[10px] uppercase tracking-[0.08em] text-slate-400 sm:text-[11px]">
                  Monthly Debt Service
                </p>
                <p className="mt-2 text-2xl font-bold text-white">{formatHeroCurrency(monthlyDebtService)}</p>
              </div>
            </div>
          }
          statusLabel="Draft saves automatically while you work"
          statusTone="saved"
          hideStatusOnMobile
          hideMetricOnMobile
          fullWidthBelowHero={
            <TemplateHeroProgressBar
              label={`Step ${currentStep} of ${steps.length}`}
              percent={completionPercent}
            />
          }
        >
          <section className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] sm:p-6">
            <div className="mb-6 grid grid-cols-4 gap-2 sm:gap-3">
              {steps.map((step) => {
                const isActive = step.id === currentStep;
                const isComplete = step.id < currentStep;

                return (
                  <div
                    key={step.id}
                    className={`rounded-2xl border px-2 py-2 text-center transition sm:px-4 sm:py-3 sm:text-left ${
                      isActive
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                        : isComplete
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                        : 'border-slate-300 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="text-[9px] font-semibold uppercase tracking-[0.08em] sm:text-[11px] sm:tracking-[0.12em]">
                      Step {step.id}
                    </div>
                    <div className="mt-1 whitespace-nowrap text-[10px] font-semibold leading-4 sm:text-base sm:whitespace-normal">
                      {isComplete ? '✓ ' : ''}
                      <span className="sm:hidden">{mobileStepTitles[step.id] ?? step.title}</span>
                      <span className="hidden sm:inline">{step.title}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="min-h-[400px]">{currentStepComponent}</div>
          </section>

          <section className="sticky bottom-0 z-30 rounded-[1.25rem] border border-slate-200 bg-white/95 p-4 shadow-[0_-12px_32px_-24px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">
                Step {currentStep} of {steps.length}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={handleBack}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                    currentStep === 1
                      ? 'invisible'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  disabled={!hydrated}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>

                <button
                  onClick={currentStep === steps.length ? handleSubmit : handleNext}
                  disabled={!hydrated || submitStatus === 'submitting' || (currentStep === steps.length && !isReviewConfirmed)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitStatus === 'submitting' && currentStep === steps.length ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      Generating Reports...
                    </>
                  ) : (
                    <>
                      {currentStep === steps.length ? 'Submit Analysis' : 'Save & Continue'}
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>

            {submitStatus === 'error' ? (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                Error: {submitError}
              </div>
            ) : null}
          </section>
        </TemplatePageShell>
      )}
      <Toast message={toastMessage} visible={toastVisible} onClose={closeToast} />
    </div>
  );
}
