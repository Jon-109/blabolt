'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/supabase/helpers/client';
import type { BalanceSheetData, LegacyBalanceSheetData } from '@/lib/templates/types';
import { BalanceSheetSchema } from '@/lib/templates/validate';
import { Input } from '@/app/(components)/ui/input';
import { Textarea } from '@/app/(components)/ui/textarea';
import { FormField } from '@/app/(components)/templates/shared/FormField';
import CurrencyInput from '@/app/(components)/templates/shared/CurrencyInput';
import PdfGenerationOverlay from '@/app/(components)/templates/shared/PdfGenerationOverlay';
import TemplateHeroProgressBar from '@/app/(components)/templates/shared/TemplateHeroProgressBar';
import TemplatePageShell from '@/app/(components)/templates/shared/TemplatePageShell';
import BalanceSheetSvgTemplate from '@/app/(components)/templates/BalanceSheetSvgTemplate';
import { checkUserTemplateAccess } from '@/lib/templates/access';
import { computeBalanceSheetTotals, sumFixedAssetBreakdown } from '@/lib/templates/balance-sheet-calculations';
import { getBalanceSheetProgress } from '@/lib/templates/balance-sheet-progress';
import { deriveBalanceSheetStatementLabel, deriveBalanceSheetTitle } from '@/lib/templates/balance-sheet-labels';
import { getTemplateSharedProfile, upsertTemplateSharedProfile } from '@/lib/templates/profile';
import { CheckCircle2, Info } from 'lucide-react';
import { ZodError } from 'zod';

type BalanceSheetSubmission = {
  id: string;
  form_data: BalanceSheetData | LegacyBalanceSheetData | null;
  pdf_url: string | null;
  updated_at: string;
};

type StepId =
  | 'snapshot'
  | 'current_assets'
  | 'noncurrent_assets'
  | 'current_liabilities'
  | 'longterm_liabilities'
  | 'equity'
  | 'review';

type ReviewField = {
  label: string;
  value: number;
  step: StepId;
  side: 'asset' | 'liability' | 'equity';
  onChange: (value: number | undefined) => void;
};

const MAX_STATEMENTS = 5;

const STEPS: Array<{ id: StepId; title: string; subtitle: string }> = [
  { id: 'snapshot', title: 'Business Snapshot', subtitle: 'Set statement date and reporting basis.' },
  { id: 'current_assets', title: 'Current Assets', subtitle: 'Cash and items expected to be used, collected, or turned into cash within the next 12 months, as of your selected date.' },
  { id: 'noncurrent_assets', title: 'Long-Term Assets', subtitle: 'Fixed and other assets used over time.' },
  { id: 'current_liabilities', title: 'Current Liabilities', subtitle: 'What must be paid within 12 months.' },
  { id: 'longterm_liabilities', title: 'Long-Term Liabilities', subtitle: 'Debt and obligations due after 12 months.' },
  { id: 'equity', title: 'Equity', subtitle: 'Owner value and retained business earnings.' },
  { id: 'review', title: 'Review & Notes', subtitle: 'Confirm totals and add clarifying notes.' },
];

const REPORT_BASIS_OPTIONS: Array<{ value: 'accrual' | 'cash'; label: string }> = [
  { value: 'accrual', label: 'Accrual' },
  { value: 'cash', label: 'Cash' },
];
const STATEMENT_TYPE_OPTIONS: Array<{ value: 'year_end' | 'ytd'; label: string }> = [
  { value: 'year_end', label: 'Year-End' },
  { value: 'ytd', label: 'Year-to-Date' },
];
const QUARTERS = [
  { value: 'Q1', label: 'Q1 (Mar 31)', month: 3, day: 31 },
  { value: 'Q2', label: 'Q2 (Jun 30)', month: 6, day: 30 },
  { value: 'Q3', label: 'Q3 (Sep 30)', month: 9, day: 30 },
  { value: 'Q4', label: 'Q4 (Dec 31)', month: 12, day: 31 },
] as const;
const MONTH_OPTIONS = [
  { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' }, { value: 4, label: 'Apr' },
  { value: 5, label: 'May' }, { value: 6, label: 'Jun' }, { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' }, { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' },
];
const YEAR_OPTIONS = Array.from({ length: 12 }, (_, i) => new Date().getFullYear() - i);
const STATEMENT_TYPE_HELP: Record<NonNullable<BalanceSheetData['statementType']>, string> = {
  year_end: 'Use this for annual financials (12/31). Best for prior-year lender comparisons and tax-year snapshots.',
  interim: 'Use this for quarter-end snapshots (Q1, Q2, Q3, Q4). Best for in-year performance checkpoints.',
  ytd: 'Use this when the lender asks for current year-to-date results. We show Jan 1 through your selected month/day.',
  custom: 'Custom is not used in this flow.',
};
const BASIS_HELP: Record<'accrual' | 'cash' | 'tax', string> = {
  accrual: 'Common for management reporting and many lender packages because it shows receivables and payables.',
  cash: 'Common for simpler bookkeeping businesses where statements mirror money in and money out only.',
  tax: 'Use when your financial statements are prepared to align with your filed business tax return methodology.',
};

const zero = (value?: number) => value || 0;
const toIsoDate = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
const lastDayOfMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
const parseIsoDate = (value: string) => {
  const [y, m, d] = value.split('-').map((part) => Number(part));
  if (!y || !m || !d) return null;
  return { year: y, month: m, day: d };
};
const formatIsoDate = (value?: string) => {
  if (!value) return '-';
  const parsed = parseIsoDate(value);
  if (!parsed) return value;
  return `${String(parsed.month).padStart(2, '0')}/${String(parsed.day).padStart(2, '0')}/${parsed.year}`;
};
const formatLongDate = (value?: string) => {
  if (!value) return '-';
  const parsed = parseIsoDate(value);
  if (!parsed) return value;
  const date = new Date(parsed.year, parsed.month - 1, parsed.day);
  const monthName = date.toLocaleString('en-US', { month: 'long' });
  return `${monthName} ${parsed.day}, ${parsed.year}`;
};
const FIXED_ASSET_FIELDS = [
  'businessRealEstate',
  'vehicles',
  'machineryEquipment',
  'furnitureFixtures',
  'leaseholdImprovements',
] as const;
type FixedAssetField = (typeof FIXED_ASSET_FIELDS)[number];

const defaultBalanceSheetForm = (
  statementType: BalanceSheetData['statementType'] = 'ytd',
): BalanceSheetData => ({
  statementLabel: '',
  statementType,
  periodStartDate: undefined,
  periodEndDate: undefined,
  asOfDate: new Date().toISOString().split('T')[0] as string,
  businessInfo: {
    legalName: '',
    reportBasis: 'accrual',
    reportBasisOther: '',
  },
  assets: {
    cashAndCashEquivalents: undefined,
    accountsReceivable: undefined,
    inventory: undefined,
    prepaidExpenses: undefined,
    otherCurrentAssets: undefined,
    fixedAssetBreakdown: {
      businessRealEstate: undefined,
      vehicles: undefined,
      machineryEquipment: undefined,
      furnitureFixtures: undefined,
      leaseholdImprovements: undefined,
    },
    grossFixedAssets: undefined,
    accumulatedDepreciation: undefined,
    notesReceivable: undefined,
    intangibleAssets: undefined,
    investments: undefined,
    otherNonCurrentAssets: undefined,
  },
  liabilities: {
    accountsPayable: undefined,
    accruedExpenses: undefined,
    taxesPayable: undefined,
    currentPortionLongTermDebt: undefined,
    creditCardsAndLines: undefined,
    deferredRevenue: undefined,
    otherCurrentLiabilities: undefined,
    longTermDebt: undefined,
    shareholderLoans: undefined,
    otherLongTermLiabilities: undefined,
  },
  equity: {
    ownerContributions: undefined,
    retainedEarnings: undefined,
    ownerDistributions: undefined,
    otherEquity: undefined,
  },
  notes: '',
});

const toModernForm = (legacy: LegacyBalanceSheetData): BalanceSheetData => ({
  statementLabel: legacy.statementLabel || '',
  statementType: legacy.statementType === 'custom' ? 'ytd' : (legacy.statementType || 'ytd'),
  periodStartDate: undefined,
  periodEndDate: undefined,
  asOfDate: legacy.asOfDate || (new Date().toISOString().split('T')[0] ?? ''),
  businessInfo: {
    legalName: '',
    reportBasis: 'accrual',
    reportBasisOther: '',
  },
  assets: {
    cashAndCashEquivalents: legacy.assets?.cash ?? undefined,
    accountsReceivable: legacy.assets?.accountsReceivable,
    inventory: legacy.assets?.inventory,
    prepaidExpenses: undefined,
    otherCurrentAssets: legacy.assets?.otherCurrentAssets,
    fixedAssetBreakdown: {
      businessRealEstate: undefined,
      vehicles: undefined,
      machineryEquipment: undefined,
      furnitureFixtures: undefined,
      leaseholdImprovements: undefined,
    },
    grossFixedAssets: legacy.assets?.fixedAssets,
    accumulatedDepreciation: legacy.assets?.accumulatedDepreciation,
    notesReceivable: undefined,
    intangibleAssets: undefined,
    investments: undefined,
    otherNonCurrentAssets: legacy.assets?.otherAssets,
  },
  liabilities: {
    accountsPayable: legacy.liabilities?.accountsPayable,
    accruedExpenses: undefined,
    taxesPayable: undefined,
    currentPortionLongTermDebt: legacy.liabilities?.shortTermLoans,
    creditCardsAndLines: legacy.liabilities?.creditCards,
    deferredRevenue: undefined,
    otherCurrentLiabilities: undefined,
    longTermDebt: legacy.liabilities?.longTermDebt,
    shareholderLoans: undefined,
    otherLongTermLiabilities: legacy.liabilities?.otherLiabilities,
  },
  equity: {
    ownerContributions: legacy.equity?.ownersEquity,
    retainedEarnings: legacy.equity?.retainedEarnings,
    ownerDistributions: undefined,
    otherEquity: undefined,
  },
  notes: legacy.notes || '',
});

const normalizeBalanceSheetForm = (raw: unknown): BalanceSheetData => {
  const base = defaultBalanceSheetForm();
  if (!raw || typeof raw !== 'object') return base;

  const candidate = raw as Record<string, unknown>;
  if (!('businessInfo' in candidate)) {
    return {
      ...base,
      ...toModernForm(candidate as unknown as LegacyBalanceSheetData),
    };
  }

  const modern = candidate as Partial<BalanceSheetData>;
  return {
    ...base,
    ...modern,
    businessInfo: { ...base.businessInfo, ...(modern.businessInfo ?? {}) },
    assets: {
      ...base.assets,
      ...(modern.assets ?? {}),
      fixedAssetBreakdown: {
        ...base.assets.fixedAssetBreakdown,
        ...(modern.assets?.fixedAssetBreakdown ?? {}),
      },
    },
    liabilities: { ...base.liabilities, ...(modern.liabilities ?? {}) },
    equity: { ...base.equity, ...(modern.equity ?? {}) },
  };
};

function Guidance({ text, what, why, where }: { text?: string; what?: string; why?: string; where?: string }) {
  const concise = text || [what, why, where].filter(Boolean).join(' ');
  if (!concise) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
      <p>{concise}</p>
    </div>
  );
}

function HelpTip({ text }: { text: string }) {
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-sky-300 bg-sky-50 text-sky-700 transition-colors hover:bg-sky-100"
      role="img"
      aria-label="Info"
      title={text}
    >
      <Info className="h-3.5 w-3.5" />
    </span>
  );
}

type CurrentAssetCardProps = {
  title: string;
  question: string;
  explanation: string;
  subtext?: string;
  details?: ReactNode;
  helpTip?: string;
  placeholder?: string;
  value?: number;
  onChange: (value: number | undefined) => void;
  readOnly?: boolean;
};

function CurrentAssetCard({
  title,
  question,
  explanation,
  subtext,
  details,
  helpTip,
  placeholder = '12,500',
  value,
  onChange,
  readOnly = false,
}: CurrentAssetCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {helpTip ? <HelpTip text={helpTip} /> : null}
      </div>
      <p className="mt-2 text-sm font-medium text-slate-800">{question}</p>
      <p className="mt-1 text-xs text-slate-600">{explanation}</p>
      {subtext ? <p className="mt-1 text-xs text-slate-500">{subtext}</p> : null}
      {details ? <div className="mt-3">{details}</div> : null}
      <div className="mt-3">
        <CurrencyInput
          value={value}
          placeholder={placeholder}
          withDollarPrefix
          className="w-[190px]"
          onValueChange={onChange}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}

export default function BalanceSheetFormPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedSubmissionId = searchParams.get('submissionId');
  const loanRequestId = searchParams.get('loanRequestId');
  const forceNew = searchParams.get('new') === '1';

  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<BalanceSheetSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<StepId>('snapshot');
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState<(typeof QUARTERS)[number]['value']>('Q4');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [previewConfirmed, setPreviewConfirmed] = useState(false);

  const [form, setForm] = useState<BalanceSheetData>(defaultBalanceSheetForm());
  const {
    totalAssets,
    totalLiabilities,
    retainedEarnings: calculatedRetainedEarnings,
    totalEquity,
    balanceDelta,
    netWorth,
  } = useMemo(() => computeBalanceSheetTotals(form), [form]);
  const formWithCalculatedRetainedEarnings = useMemo<BalanceSheetData>(
    () => ({
      ...form,
      equity: {
        ...form.equity,
        retainedEarnings: calculatedRetainedEarnings,
      },
    }),
    [calculatedRetainedEarnings, form],
  );

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSubmissions = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('template_submissions')
      .select('id,form_data,pdf_url,updated_at')
      .eq('user_id', userId)
      .eq('template_type', 'balance_sheet')
      .is('archived_at', null)
      .order('updated_at', { ascending: false })
      .limit(MAX_STATEMENTS);

    if (error) throw error;
    const rows = (data ?? []) as BalanceSheetSubmission[];
    setSubmissions(rows);
    return rows;
  }, []);

  const loadSubmissionIntoForm = useCallback((submission: BalanceSheetSubmission) => {
    const normalized = normalizeBalanceSheetForm(submission.form_data);
    const parsed = parseIsoDate(normalized.asOfDate);
    setSubmissionId(submission.id);
    setPdfUrl(submission.pdf_url);
    setForm(normalized);
    if (parsed) {
      setSelectedYear(parsed.year);
      setSelectedMonth(parsed.month);
      setSelectedDay(parsed.day);
      const quarterValue = parsed.month <= 3 ? 'Q1' : parsed.month <= 6 ? 'Q2' : parsed.month <= 9 ? 'Q3' : 'Q4';
      setSelectedQuarter(quarterValue);
    }
    setActiveStep('snapshot');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('new');
    params.set('submissionId', submission.id);
    router.replace(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  const startNewStatement = (type: BalanceSheetData['statementType']) => {
    if (submissions.length >= MAX_STATEMENTS) {
      setLocalMessage('Maximum of 5 balance sheets reached.');
      return;
    }

    setSubmissionId(null);
    setPdfUrl(null);
    setErrors({});
    setActiveStep('snapshot');
    const nextForm = defaultBalanceSheetForm(type);
    const parsed = parseIsoDate(nextForm.asOfDate);
    setForm(nextForm);
    if (parsed) {
      setSelectedYear(parsed.year);
      setSelectedMonth(parsed.month);
      setSelectedDay(parsed.day);
      const quarterValue = parsed.month <= 3 ? 'Q1' : parsed.month <= 6 ? 'Q2' : parsed.month <= 9 ? 'Q3' : 'Q4';
      setSelectedQuarter(quarterValue);
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete('submissionId');
    params.set('new', '1');
    router.replace(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    let isActive = true;

    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const sessionUser = session?.user ?? null;

      if (!sessionUser) {
        router.replace(`/login?redirectTo=${encodeURIComponent(pathname)}`);
        return;
      }

      const access = await checkUserTemplateAccess(sessionUser.id, 'balance_sheet');
      if (!access.allowed) {
        router.replace(access.redirectUrl || '/services/templates-bundle');
        return;
      }

      const existingSubmissions = await loadSubmissions(sessionUser.id);
      const profile = await getTemplateSharedProfile(sessionUser.id);
      let hydratedFromSubmission = false;

      if (!isActive) return;

      if (requestedSubmissionId) {
        const requested = existingSubmissions.find((item) => item.id === requestedSubmissionId);
        if (requested) {
          loadSubmissionIntoForm(requested);
          hydratedFromSubmission = true;
        } else if (!forceNew && existingSubmissions[0]) {
          loadSubmissionIntoForm(existingSubmissions[0]);
          hydratedFromSubmission = true;
        }
      } else if (!forceNew && existingSubmissions[0]) {
        loadSubmissionIntoForm(existingSubmissions[0]);
        hydratedFromSubmission = true;
      }

      const sharedBusinessName = profile.businessLegalName || profile.businessName || '';
      if (sharedBusinessName) {
        setForm((prev) => ({
          ...prev,
          businessInfo: {
            ...prev.businessInfo,
            legalName: prev.businessInfo.legalName || sharedBusinessName,
          },
        }));
      }

      setUser(sessionUser);
    };

    checkAuth()
      .catch((error) => {
        console.error('Failed loading balance sheet page:', error);
      })
      .finally(() => {
        if (isActive) setIsAuthChecking(false);
      });

    return () => {
      isActive = false;
    };
  }, [forceNew, loadSubmissionIntoForm, loadSubmissions, pathname, requestedSubmissionId, router]);

  const saveDraft = useCallback(async (): Promise<string | null> => {
    if (!user) return submissionId;

    if (!submissionId && submissions.length >= MAX_STATEMENTS) {
      setLocalMessage('Maximum of 5 balance sheets reached.');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2500);
      return null;
    }

    setSaveStatus('saving');
    try {
      if (!submissionId) {
        const { data, error } = await supabase
          .from('template_submissions')
          .insert({
            user_id: user.id,
            template_type: 'balance_sheet',
            form_data: formWithCalculatedRetainedEarnings,
          })
          .select('id,pdf_url')
          .single();

        if (error) throw error;
        if (data) {
          setSubmissionId(data.id);
          setPdfUrl(data.pdf_url);
          await loadSubmissions(user.id);

          const params = new URLSearchParams(searchParams.toString());
          params.delete('new');
          params.set('submissionId', data.id);
          router.replace(`${pathname}?${params.toString()}`);

          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
          return data.id;
        }
      } else {
        const { error } = await supabase
          .from('template_submissions')
          .update({ form_data: formWithCalculatedRetainedEarnings })
          .eq('id', submissionId)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      await loadSubmissions(user.id);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return submissionId;
    } catch (error) {
      console.error('Error saving draft:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return submissionId;
    }
  }, [formWithCalculatedRetainedEarnings, loadSubmissions, pathname, router, searchParams, submissionId, submissions.length, user]);

  const queueSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveDraft();
    }, 1200);
  }, [saveDraft]);

  const validateForm = () => {
    try {
      BalanceSheetSchema.parse(formWithCalculatedRetainedEarnings);
      setErrors({});
      return true;
    } catch (error: unknown) {
      const newErrors: Record<string, string> = {};
      if (error instanceof ZodError) {
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
      }
      setErrors(newErrors);
      return false;
    }
  };

  const onGenerate = async () => {
    if (!validateForm()) {
      setActiveStep('snapshot');
      alert('Please fix the validation errors before generating PDF.');
      return;
    }

    setLoading(true);
    try {
      const resolvedSubmissionId = await saveDraft();

      if (!resolvedSubmissionId) throw new Error('Failed to save submission');

      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          submissionId: resolvedSubmissionId,
          templateType: 'balance_sheet',
          loanRequestId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'PDF generation failed');
      }

      const json = await res.json();
      setPdfUrl(json.pdfUrl);

      if (json.pdfUrl) {
        if (!user) throw new Error('User session expired');
        await supabase
          .from('template_submissions')
          .update({ pdf_url: json.pdfUrl })
          .eq('id', resolvedSubmissionId)
          .eq('user_id', user.id);
        await loadSubmissions(user.id);
      }
    } catch (error: unknown) {
      console.error('PDF generation error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate PDF: ${message}`);
    } finally {
      setLoading(false);
    }
  };
  const updateForm = (path: string, value: unknown) => {
    const keys = path.split('.');
    setForm((prev) => {
      const updated = { ...prev };
      let current: Record<string, unknown> = updated as unknown as Record<string, unknown>;

      for (let i = 0; i < keys.length - 1; i += 1) {
        const key = keys[i];
        if (key) {
          const child = (current[key] as Record<string, unknown> | undefined) ?? {};
          current[key] = { ...child };
          current = current[key] as Record<string, unknown>;
        }
      }

      const lastKey = keys[keys.length - 1];
      if (lastKey) current[lastKey] = value === '' ? undefined : value;
      return updated;
    });
    queueSave();
  };
  const updateFixedAssetBreakdown = (field: FixedAssetField, value: number) => {
    setForm((prev) => {
      const nextBreakdown = {
        ...(prev.assets.fixedAssetBreakdown ?? {}),
        [field]: value,
      };
      return {
        ...prev,
        assets: {
          ...prev.assets,
          fixedAssetBreakdown: nextBreakdown,
          grossFixedAssets: sumFixedAssetBreakdown(nextBreakdown),
        },
      };
    });
    queueSave();
  };

  const handleStatementTypeChange = (nextType: 'year_end' | 'ytd') => {
    updateForm('statementType', nextType);
    if (nextType === 'ytd') {
      setSelectedYear(currentYear);
      setSelectedMonth(currentMonth);
      setSelectedDay(currentDay);
    }
  };
  const handleUseTodayAsOfDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    updateForm('statementType', 'ytd');
    setSelectedYear(year);
    setSelectedMonth(month);
    setSelectedDay(day);
  };

  useEffect(() => {
    const statementType = form.statementType || 'ytd';

    let nextDate = form.asOfDate;
    let nextStart = form.periodStartDate;
    if (statementType === 'year_end') {
      nextDate = toIsoDate(selectedYear, 12, 31);
      nextStart = toIsoDate(selectedYear, 1, 1);
    }
    if (statementType === 'interim') {
      const selected = QUARTERS.find((q) => q.value === selectedQuarter) || QUARTERS[0];
      if (selected) {
        nextDate = toIsoDate(selectedYear, selected.month, selected.day);
        const startMonth = selected.month - 2;
        nextStart = toIsoDate(selectedYear, startMonth, 1);
      }
    }
    if (statementType === 'ytd') {
      const maxDay = lastDayOfMonth(selectedYear, selectedMonth);
      const safeDay = Math.min(selectedDay, maxDay);
      if (safeDay !== selectedDay) setSelectedDay(safeDay);
      nextDate = toIsoDate(selectedYear, selectedMonth, safeDay);
      nextStart = toIsoDate(selectedYear, 1, 1);
    }

    const nextStatementLabel = deriveBalanceSheetStatementLabel({
      ...form,
      asOfDate: nextDate,
      periodStartDate: nextStart,
      periodEndDate: nextDate,
    });
    const needsStartUpdate = nextStart !== form.periodStartDate;
    const needsEndUpdate = nextDate !== form.periodEndDate;
    const needsAsOfUpdate = nextDate !== form.asOfDate;
    const needsStatementLabelUpdate = nextStatementLabel !== (form.statementLabel || '');

    if (needsStartUpdate || needsEndUpdate || needsAsOfUpdate || needsStatementLabelUpdate) {
      setForm((prev) => ({
        ...prev,
        periodStartDate: needsStartUpdate ? nextStart : prev.periodStartDate,
        periodEndDate: needsEndUpdate ? nextDate : prev.periodEndDate,
        asOfDate: needsAsOfUpdate ? nextDate : prev.asOfDate,
        statementLabel: needsStatementLabelUpdate ? nextStatementLabel : prev.statementLabel,
      }));
      queueSave();
    }
  }, [form, queueSave, selectedYear, selectedQuarter, selectedMonth, selectedDay]);

  useEffect(() => {
    if ((form.statementType || 'ytd') === 'year_end' && selectedYear >= currentYear) {
      setSelectedYear(currentYear - 1);
    }
  }, [currentYear, form.statementType, selectedYear]);

  useEffect(() => {
    if (activeStep !== 'review' && previewConfirmed) {
      setPreviewConfirmed(false);
    }
  }, [activeStep, previewConfirmed]);

  const sectionCardClassName = 'rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-5';
  const statusTone =
    saveStatus === 'saving'
      ? 'saving'
      : saveStatus === 'saved'
      ? 'saved'
      : saveStatus === 'error'
      ? 'error'
      : 'neutral';
  const statusLabel =
    saveStatus === 'saving'
      ? 'Saving changes...'
      : saveStatus === 'saved'
      ? 'All changes saved'
      : saveStatus === 'error'
      ? 'Save failed'
      : 'Ready to edit';

  const asOfLongDate = useMemo(() => formatLongDate(form.asOfDate), [form.asOfDate]);
  const pageTitle = useMemo(() => deriveBalanceSheetTitle(form), [form]);
  const reviewFields = useMemo<ReviewField[]>(
    () => [
      { label: 'Cash in Bank', value: zero(form.assets.cashAndCashEquivalents), step: 'current_assets', side: 'asset', onChange: (value) => updateForm('assets.cashAndCashEquivalents', value) },
      { label: 'Unpaid Customer Invoices', value: zero(form.assets.accountsReceivable), step: 'current_assets', side: 'asset', onChange: (value) => updateForm('assets.accountsReceivable', value) },
      { label: 'Inventory', value: zero(form.assets.inventory), step: 'current_assets', side: 'asset', onChange: (value) => updateForm('assets.inventory', value) },
      { label: 'Other Short-Term Assets', value: zero(form.assets.otherCurrentAssets), step: 'current_assets', side: 'asset', onChange: (value) => updateForm('assets.otherCurrentAssets', value) },
      { label: 'Business Real Estate', value: zero(form.assets.fixedAssetBreakdown?.businessRealEstate), step: 'noncurrent_assets', side: 'asset', onChange: (value) => updateFixedAssetBreakdown('businessRealEstate', value || 0) },
      { label: 'Business Vehicles', value: zero(form.assets.fixedAssetBreakdown?.vehicles), step: 'noncurrent_assets', side: 'asset', onChange: (value) => updateFixedAssetBreakdown('vehicles', value || 0) },
      { label: 'Machinery & Equipment', value: zero(form.assets.fixedAssetBreakdown?.machineryEquipment), step: 'noncurrent_assets', side: 'asset', onChange: (value) => updateFixedAssetBreakdown('machineryEquipment', value || 0) },
      { label: 'Furniture & Fixtures', value: zero(form.assets.fixedAssetBreakdown?.furnitureFixtures), step: 'noncurrent_assets', side: 'asset', onChange: (value) => updateFixedAssetBreakdown('furnitureFixtures', value || 0) },
      { label: 'Leasehold Improvements', value: zero(form.assets.fixedAssetBreakdown?.leaseholdImprovements), step: 'noncurrent_assets', side: 'asset', onChange: (value) => updateFixedAssetBreakdown('leaseholdImprovements', value || 0) },
      { label: 'Long-Term Notes Receivable', value: zero(form.assets.notesReceivable), step: 'noncurrent_assets', side: 'asset', onChange: (value) => updateForm('assets.notesReceivable', value) },
      { label: 'Intangible Assets', value: zero(form.assets.intangibleAssets), step: 'noncurrent_assets', side: 'asset', onChange: (value) => updateForm('assets.intangibleAssets', value) },
      { label: 'Long-Term Investments', value: zero(form.assets.investments), step: 'noncurrent_assets', side: 'asset', onChange: (value) => updateForm('assets.investments', value) },
      { label: 'Other Long-Term Assets', value: zero(form.assets.otherNonCurrentAssets), step: 'noncurrent_assets', side: 'asset', onChange: (value) => updateForm('assets.otherNonCurrentAssets', value) },
      { label: 'Vendor Bills Not Yet Paid', value: zero(form.liabilities.accountsPayable), step: 'current_liabilities', side: 'liability', onChange: (value) => updateForm('liabilities.accountsPayable', value) },
      { label: 'Expenses Incurred But Not Yet Paid', value: zero(form.liabilities.accruedExpenses), step: 'current_liabilities', side: 'liability', onChange: (value) => updateForm('liabilities.accruedExpenses', value) },
      { label: 'Taxes Payable', value: zero(form.liabilities.taxesPayable), step: 'current_liabilities', side: 'liability', onChange: (value) => updateForm('liabilities.taxesPayable', value) },
      { label: 'Loan Principal Due in Next 12 Months', value: zero(form.liabilities.currentPortionLongTermDebt), step: 'current_liabilities', side: 'liability', onChange: (value) => updateForm('liabilities.currentPortionLongTermDebt', value) },
      { label: 'Credit Cards and Lines of Credit', value: zero(form.liabilities.creditCardsAndLines), step: 'current_liabilities', side: 'liability', onChange: (value) => updateForm('liabilities.creditCardsAndLines', value) },
      { label: 'Customer Payments Received in Advance', value: zero(form.liabilities.deferredRevenue), step: 'current_liabilities', side: 'liability', onChange: (value) => updateForm('liabilities.deferredRevenue', value) },
      { label: 'Other Short-Term Liabilities', value: zero(form.liabilities.otherCurrentLiabilities), step: 'current_liabilities', side: 'liability', onChange: (value) => updateForm('liabilities.otherCurrentLiabilities', value) },
      { label: 'Long-Term Debt', value: zero(form.liabilities.longTermDebt), step: 'longterm_liabilities', side: 'liability', onChange: (value) => updateForm('liabilities.longTermDebt', value) },
      { label: 'Loans from Owners or Shareholders', value: zero(form.liabilities.shareholderLoans), step: 'longterm_liabilities', side: 'liability', onChange: (value) => updateForm('liabilities.shareholderLoans', value) },
      { label: 'Other Long-Term Liabilities', value: zero(form.liabilities.otherLongTermLiabilities), step: 'longterm_liabilities', side: 'liability', onChange: (value) => updateForm('liabilities.otherLongTermLiabilities', value) },
      { label: 'Owner Contributions', value: zero(form.equity.ownerContributions), step: 'equity', side: 'equity', onChange: (value) => updateForm('equity.ownerContributions', value) },
      { label: 'Owner Distributions', value: zero(form.equity.ownerDistributions), step: 'equity', side: 'equity', onChange: (value) => updateForm('equity.ownerDistributions', value) },
      { label: 'Other Equity', value: zero(form.equity.otherEquity), step: 'equity', side: 'equity', onChange: (value) => updateForm('equity.otherEquity', value) },
    ],
    [form, updateFixedAssetBreakdown],
  );
  const topAssetReviewFields = useMemo(
    () =>
      reviewFields
        .filter((field) => field.side === 'asset')
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    [reviewFields],
  );
  const topLiabilityEquityReviewFields = useMemo(
    () =>
      reviewFields
        .filter((field) => field.side !== 'asset')
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    [reviewFields],
  );

  const activeStepIndex = STEPS.findIndex((step) => step.id === activeStep);
  const canGoBack = activeStepIndex > 0;
  const canGoNext = activeStepIndex < STEPS.length - 1;
  const balanceSheetProgress = useMemo(
    () => getBalanceSheetProgress(form, { reviewConfirmed: previewConfirmed }),
    [form, previewConfirmed],
  );
  const { percent: progressPercent, completedRequiredItems, totalRequiredItems, allDataFieldsComplete } = balanceSheetProgress;
  const allSectionsComplete = allDataFieldsComplete;
  const reviewReadyForPdf = allSectionsComplete && previewConfirmed;

  const handleBackStep = () => {
    const prevStep = STEPS[activeStepIndex - 1];
    if (canGoBack && prevStep) {
      setActiveStep(prevStep.id);
    }
  };

  const handleContinueStep = () => {
    const nextStep = STEPS[activeStepIndex + 1];
    if (canGoNext && nextStep) {
      setActiveStep(nextStep.id);
    }
  };
  if (isAuthChecking || !user) return <div className="mx-auto max-w-7xl px-4 py-8">Loading...</div>;

  return (
    <TemplatePageShell
      title={pageTitle}
      subtitle="Small-business lender format for companies under $10M annual revenue."
      description="Clean, guided input with only the context that matters so owners can finish quickly with confidence."
      compactHero
      metricLabel="Balance Sheet Snapshot"
      metricValue=""
      metricContent={
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Balance Sheet Snapshot</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-700/70 bg-slate-950/50 px-2.5 py-2">
              <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Assets</p>
              <p className="mt-1 text-sm font-semibold text-white">${totalAssets.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-slate-700/70 bg-slate-950/50 px-2.5 py-2">
              <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Liabilities</p>
              <p className="mt-1 text-sm font-semibold text-white">${totalLiabilities.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-slate-700/70 bg-slate-950/50 px-2.5 py-2">
              <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Equity</p>
              <p className="mt-1 text-sm font-semibold text-white">${totalEquity.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-slate-700/70 bg-slate-950/50 px-2.5 py-2">
              <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Net Worth</p>
              <p className="mt-1 text-sm font-semibold text-white">${netWorth.toLocaleString()}</p>
            </div>
          </div>
        </div>
      }
      statusLabel={statusLabel}
      statusTone={statusTone}
      fullWidthBelowHero={
        <TemplateHeroProgressBar
          label={`Form progress: ${completedRequiredItems} of ${totalRequiredItems} required items completed`}
          percent={progressPercent}
        />
      }
    >
      {localMessage ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {localMessage}
        </section>
      ) : null}

      <section className={sectionCardClassName}>
        <div className="mb-3 md:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {STEPS.map((step, idx) => {
              const active = step.id === activeStep;
              const done = idx < activeStepIndex;
              return (
                <button
                  key={`mobile-${step.id}`}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={`flex-none whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : done
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                      : 'border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {done && !active ? '✓ ' : ''}
                  {step.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4 hidden gap-3 md:grid md:grid-cols-[1.2fr_1.15fr_1.22fr_1.22fr_1.42fr_0.86fr_1.18fr]">
          {STEPS.map((step, idx) => {
            const active = step.id === activeStep;
            const done = idx < activeStepIndex;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`min-w-0 rounded-xl border px-3 py-2 text-left transition-colors ${
                  active
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : done
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold uppercase tracking-wide">{active ? 'Current' : done ? 'Complete' : 'Pending'}</div>
                <div className={`font-semibold ${step.id === 'longterm_liabilities' ? 'whitespace-nowrap text-[0.95rem]' : 'text-sm'}`}>
                  {step.title}
                </div>
              </button>
            );
          })}
        </div>

        {activeStep === 'snapshot' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Business legal name" required help="Use the exact legal entity name from tax returns or formation documents." error={errors['businessInfo.legalName']}>
              <Input
                type="text"
                value={form.businessInfo.legalName || ''}
                placeholder="Example: Apex Plumbing LLC"
                onChange={(e) => updateForm('businessInfo.legalName', e.target.value)}
                onBlur={() => {
                  if (!user) return;
                  const nextName = (form.businessInfo.legalName || '').trim();
                  void upsertTemplateSharedProfile(user.id, { businessLegalName: nextName, businessName: nextName });
                }}
              />
            </FormField>
            <div />

            <div className="sm:col-span-2">
              <FormField label="Statement Type">
                <div className="flex flex-wrap gap-2">
                  {STATEMENT_TYPE_OPTIONS.map((option) => {
                    const active = (form.statementType || 'ytd') === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleStatementTypeChange(option.value)}
                        className={`flex h-14 w-full items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition-colors sm:w-[240px] ${
                          active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {option.label}
                          <HelpTip text={STATEMENT_TYPE_HELP[option.value]} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField
                label={(form.statementType || 'ytd') === 'year_end' ? 'Year-End Date' : 'As of Date'}
                required
                help={
                  (form.statementType || 'ytd') === 'year_end'
                    ? 'Year-end statements use December 31 for the selected year.'
                    : 'Select the month/day/year this statement is accurate as of.'
                }
                error={errors['asOfDate']}
              >
                <div className="flex flex-wrap items-center gap-2">
                    {(form.statementType || 'ytd') === 'interim' ? (
                      <select
                        value={selectedQuarter}
                        onChange={(e) => setSelectedQuarter(e.target.value as (typeof QUARTERS)[number]['value'])}
                        className="h-10 w-auto min-w-[170px] rounded-md border border-slate-300 bg-white px-3 text-sm"
                      >
                        {QUARTERS.map((quarter) => (
                          <option key={quarter.value} value={quarter.value}>{quarter.label}</option>
                        ))}
                      </select>
                    ) : null}

                    {(form.statementType || 'ytd') === 'ytd' ? (
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="h-10 w-auto min-w-[130px] rounded-md border border-slate-300 bg-white px-3 text-sm"
                      >
                        {MONTH_OPTIONS.map((month) => (
                          <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                      </select>
                    ) : null}
                    {(form.statementType || 'ytd') === 'ytd' ? (
                      <select
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(Number(e.target.value))}
                        className="h-10 w-auto min-w-[90px] rounded-md border border-slate-300 bg-white px-3 text-sm"
                      >
                        {Array.from({ length: lastDayOfMonth(selectedYear, selectedMonth) }, (_, i) => i + 1).map((day) => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    ) : null}
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="h-10 w-auto min-w-[110px] rounded-md border border-slate-300 bg-white px-3 text-sm"
                    >
                      {((form.statementType || 'ytd') === 'year_end'
                        ? YEAR_OPTIONS.filter((year) => year < currentYear)
                        : YEAR_OPTIONS
                      ).map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>

                    <div className="flex h-10 items-center rounded-md border border-slate-300 bg-slate-100 px-3 text-sm font-medium text-slate-700">
                      {(form.statementType || 'ytd') === 'year_end' ? (
                        <>Range: {formatIsoDate(form.periodStartDate)} - {formatIsoDate(form.asOfDate)}</>
                      ) : null}
                      {(form.statementType || 'ytd') === 'interim' ? (
                        <>Quarter: {formatIsoDate(form.periodStartDate)} - {formatIsoDate(form.asOfDate)}</>
                      ) : null}
                      {(form.statementType || 'ytd') === 'ytd' ? (
                        <>YTD: {formatIsoDate(form.periodStartDate)} - {formatIsoDate(form.asOfDate)}</>
                      ) : null}
                    </div>
                    {(form.statementType || 'ytd') === 'ytd' ? (
                      <button
                        type="button"
                        onClick={handleUseTodayAsOfDate}
                        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Use Today
                      </button>
                    ) : null}
                  </div>
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField
                label="Accounting Method"
                help="Choose the method your business uses."
              >
                <div className="flex flex-wrap gap-2">
                  {REPORT_BASIS_OPTIONS.map((option) => {
                    const active = (form.businessInfo.reportBasis || 'accrual') === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateForm('businessInfo.reportBasis', option.value)}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition-colors md:max-w-[430px] ${
                          active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{option.label}</p>
                          <div className="inline-flex items-center gap-1.5">
                            {active ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : null}
                            <HelpTip text={BASIS_HELP[option.value]} />
                          </div>
                        </div>
                        <p className={`mt-1 text-xs ${active ? 'text-slate-200' : 'text-slate-600'}`}>
                          {option.value === 'accrual'
                            ? 'You record income when invoiced and expenses when incurred, even before cash moves.'
                            : 'You record income when cash is received and expenses when cash is paid.'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </FormField>
            </div>
          </div>
        ) : null}

        {activeStep === 'current_assets' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900">Current Assets</h2>
              <p className="text-sm text-slate-600">
                This section captures what your business <span className="font-semibold text-slate-800">owned or was owed on {asOfLongDate}</span>.
              </p>
              <p className="text-sm text-slate-600">
                Think of this as a <span className="font-semibold text-slate-800">financial snapshot of your business on that exact date</span>, not activity throughout the year.
              </p>
              <p className="text-xs text-slate-500">
                Only enter the balances that existed on {asOfLongDate}, even if the amounts changed later.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <CurrentAssetCard
                title="Cash in Bank"
                question={`As of ${asOfLongDate}, how much cash did your business have across all accounts?`}
                explanation="Include the total business cash you had available on that date."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Include money held in:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Business checking accounts</li>
                      <li>Business savings accounts</li>
                      <li>Money market accounts</li>
                      <li>Stripe, PayPal, Square, or other payment processors</li>
                      <li>Undeposited funds</li>
                      <li>Physical cash used by the business</li>
                    </ul>
                    <p className="mt-3 text-xs font-medium text-slate-700">Do not include personal accounts.</p>
                    <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
                      <span className="font-semibold">Tip:</span> You can usually find this by adding the balances from your business bank accounts and payment processors on {asOfLongDate}.
                    </div>
                  </>
                }
                value={form.assets.cashAndCashEquivalents}
                onChange={(v) => updateForm('assets.cashAndCashEquivalents', v)}
              />
              <CurrentAssetCard
                title="Unpaid Customer Invoices (Money Owed to Your Business)"
                question={`As of ${asOfLongDate}, how much money did customers still owe your business for invoices already sent?`}
                explanation="This includes invoices that were sent but not yet paid as of that date."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Include:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Invoices that were sent but not yet paid as of {asOfLongDate}</li>
                    </ul>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Do not include:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Invoices that had already been paid</li>
                      <li>Invoices you had not sent yet</li>
                    </ul>
                    <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
                      <span className="font-semibold">Tip:</span> Look at your invoice list or accounting software and add up any invoices that were still unpaid on {asOfLongDate}.
                    </div>
                    <p className="mt-3 text-xs text-slate-600">
                      If you do not send invoices or had none outstanding, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.assets.accountsReceivable}
                onChange={(v) => updateForm('assets.accountsReceivable', v)}
              />
              <CurrentAssetCard
                title="Inventory on hand"
                question={`As of ${asOfLongDate}, what was the total cost value of inventory your business had in stock?`}
                explanation="Inventory includes products or materials you purchased that were still unsold or unused on that date."
                subtext="Enter the amount you paid to acquire the inventory, not the price you plan to sell it for."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Examples of inventory:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Retail products for sale</li>
                      <li>Raw materials used to produce goods</li>
                      <li>Finished products waiting to be sold</li>
                    </ul>
                    <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
                      <span className="font-semibold">Tip:</span> Look at your inventory system, purchase records, or accounting software and total the cost of items still in stock on {asOfLongDate}.
                    </div>
                    <p className="mt-3 text-xs text-slate-600">
                      If your business does not sell physical products, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.assets.inventory}
                onChange={(v) => updateForm('assets.inventory', v)}
              />
              <CurrentAssetCard
                title="Prepaid Expenses (Optional)"
                question={`As of ${asOfLongDate}, had your business already paid for expenses that cover future periods?`}
                explanation="These are payments made in advance for services you will receive later."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Common examples include:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Annual insurance policies paid upfront</li>
                      <li>Yearly software subscriptions</li>
                      <li>Rent or leases paid ahead of schedule</li>
                      <li>Prepaid service contracts</li>
                    </ul>
                    <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
                      <span className="font-semibold">Tip:</span> If you paid for something in {selectedYear} that covers part of {selectedYear + 1}, the unused portion may count as a prepaid expense.
                    </div>
                    <p className="mt-3 text-xs text-slate-600">
                      If you did not prepay any expenses, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.assets.prepaidExpenses}
                onChange={(v) => updateForm('assets.prepaidExpenses', v)}
              />
              <CurrentAssetCard
                title="Other short-term assets (optional)"
                question={`As of ${asOfLongDate}, did your business have any other short-term assets that were not already listed above?`}
                explanation="Use this only if you have a short-term business asset that does not fit Cash, Invoices, Inventory, or Prepaid Expenses."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Examples may include:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Refundable security deposits</li>
                      <li>Employee advances that will be repaid</li>
                      <li>Short-term notes receivable</li>
                      <li>Refunds owed to your business</li>
                      <li>Retainers held by third parties</li>
                    </ul>
                    <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
                      <span className="font-semibold">Tip:</span> If nothing clearly fits here, it is usually fine to enter $0.
                    </div>
                    <p className="mt-3 text-xs text-slate-600">
                      If none apply, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.assets.otherCurrentAssets}
                onChange={(v) => updateForm('assets.otherCurrentAssets', v)}
              />
            </div>
          </div>
        ) : null}

        {activeStep === 'noncurrent_assets' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900">Long-Term Assets</h2>
              <p className="text-sm text-slate-600">
                Now list assets your business owns and expects to keep for more than one year, as of <span className="font-semibold text-slate-800">{asOfLongDate}</span>.
              </p>
              <p className="text-sm text-slate-600">
                These are typically larger or long-lasting items used to operate the business, such as property, vehicles, or equipment.
              </p>
              <p className="text-xs text-slate-500">
                Only include assets the business still owned on that date.
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900">Important</p>
              <p className="mt-1 text-xs text-amber-800">
                Enter the original purchase price your business paid for these assets, not the current resale or market value.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <CurrentAssetCard
                title="Business Real Estate (if owned)"
                question={`As of ${asOfLongDate}, what was the total original purchase price your business paid for all real estate it owned?`}
                explanation="Add together all business-owned real estate in this category, such as office buildings, warehouses, retail locations, or land used for the business."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Include property owned by the business, such as:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Office buildings</li>
                      <li>Warehouses</li>
                      <li>Retail locations</li>
                      <li>Land used for the business</li>
                    </ul>
                    <p className="mt-3 text-xs text-slate-600">
                      Enter the original purchase price, not the current market value.
                    </p>
                    <p className="mt-2 text-xs text-slate-600">
                      Do not include property owned personally, even if the business operates there.
                    </p>
                    <p className="mt-3 text-xs text-slate-600">
                      If the business does not own real estate, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.assets.fixedAssetBreakdown?.businessRealEstate}
                onChange={(v) => updateFixedAssetBreakdown('businessRealEstate', v || 0)}
              />
              <CurrentAssetCard
                title="Business Vehicles"
                question={`As of ${asOfLongDate}, what was the total original purchase price your business paid for all vehicles it owned and used in operations?`}
                explanation="Add together all business-owned vehicles in this category."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Include vehicles owned by the business, such as:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Company cars</li>
                      <li>Trucks</li>
                      <li>Vans</li>
                      <li>Delivery vehicles</li>
                    </ul>
                    <p className="mt-3 text-xs text-slate-600">
                      Enter the amount originally paid for the vehicles, not their current resale value.
                    </p>
                    <p className="mt-2 text-xs text-slate-600">
                      Do not include personally owned vehicles, even if occasionally used for the business.
                    </p>
                    <p className="mt-3 text-xs text-slate-600">
                      If the business does not own vehicles, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.assets.fixedAssetBreakdown?.vehicles}
                onChange={(v) => updateFixedAssetBreakdown('vehicles', v || 0)}
              />
              <CurrentAssetCard
                title="Machinery & Equipment"
                question={`As of ${asOfLongDate}, what was the total original purchase price your business paid for all machinery and equipment it owned?`}
                explanation="Add together all business equipment in this category that your company used to operate."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Include business equipment such as:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Production equipment</li>
                      <li>Tools and machinery</li>
                      <li>Computers and technology hardware</li>
                      <li>Kitchen or service equipment</li>
                      <li>Office equipment used for operations</li>
                    </ul>
                    <p className="mt-3 text-xs text-slate-600">
                      Enter the original purchase price, not the current value.
                    </p>
                    <p className="mt-3 text-xs text-slate-600">
                      If your business does not own machinery or equipment, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.assets.fixedAssetBreakdown?.machineryEquipment}
                onChange={(v) => updateFixedAssetBreakdown('machineryEquipment', v || 0)}
              />
              <CurrentAssetCard
                title="Furniture & Fixtures"
                question={`As of ${asOfLongDate}, what was the total original purchase price your business paid for all furniture and fixtures it owned?`}
                explanation="Add together all furniture and built-in items your business used in day-to-day operations."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Examples may include:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Desks and chairs</li>
                      <li>Shelving and storage units</li>
                      <li>Counters and display fixtures</li>
                      <li>Built-in furnishings used by the business</li>
                    </ul>
                    <p className="mt-3 text-xs text-slate-600">
                      Enter the original purchase price, not what these items would sell for today.
                    </p>
                    <p className="mt-3 text-xs text-slate-600">
                      If your business does not own furniture or fixtures, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.assets.fixedAssetBreakdown?.furnitureFixtures}
                onChange={(v) => updateFixedAssetBreakdown('furnitureFixtures', v || 0)}
              />
              <CurrentAssetCard
                title="Leasehold Improvements"
                question={`As of ${asOfLongDate}, what was the total original amount your business paid for all permanent improvements made to rented business space?`}
                explanation="Add together all buildouts or improvements made to locations your business leases rather than owns."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Examples may include:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Tenant buildouts</li>
                      <li>Remodels to leased space</li>
                      <li>Permanent walls, counters, or flooring added by the business</li>
                      <li>Other permanent upgrades to a rented location</li>
                    </ul>
                    <p className="mt-3 text-xs text-slate-600">
                      Enter the original amount paid for these improvements, not what they are worth today.
                    </p>
                    <p className="mt-3 text-xs text-slate-600">
                      If your business did not make permanent improvements to leased space, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.assets.fixedAssetBreakdown?.leaseholdImprovements}
                onChange={(v) => updateFixedAssetBreakdown('leaseholdImprovements', v || 0)}
              />
              <CurrentAssetCard
                title="Total depreciation recorded to date"
                question={`As of ${asOfLongDate}, how much total depreciation had your business recorded on these long-term assets?`}
                explanation="This is the total amount your business has already written off over time for assets like real estate, vehicles, equipment, furniture, and leasehold improvements."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
                      <span className="font-semibold">Tip:</span> You can usually find this on your depreciation schedule or in your accounting software under accumulated depreciation.
                    </div>
                    <p className="mt-3 text-xs text-slate-600">
                      If your business has not recorded depreciation or you do not have depreciable assets, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.assets.accumulatedDepreciation}
                onChange={(v) => updateForm('assets.accumulatedDepreciation', v)}
              />
              <CurrentAssetCard
                title="Long-term notes receivable (money owed to your business)"
                question={`As of ${asOfLongDate}, did anyone owe your business money under a formal written note that will be repaid over more than one year?`}
                explanation="Use this only for formal loans owed to your business that are documented in writing."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Examples may include:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>A loan your business made to another party</li>
                      <li>A formal note receivable from a buyer, partner, or related business</li>
                    </ul>
                    <p className="mt-3 text-xs text-slate-600">
                      Do not include regular unpaid customer invoices here.
                    </p>
                    <p className="mt-3 text-xs text-slate-600">
                      If no one owes your business money under a long-term note, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.assets.notesReceivable}
                onChange={(v) => updateForm('assets.notesReceivable', v)}
              />
              <CurrentAssetCard
                title="Intangible assets (optional)"
                question={`As of ${asOfLongDate}, did your business have any intangible assets recorded on its books?`}
                explanation="These are non-physical business assets that still have value."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Examples may include:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Capitalized software</li>
                      <li>Patents</li>
                      <li>Trademarks</li>
                      <li>Licenses or franchise rights</li>
                      <li>Goodwill recorded on your books</li>
                    </ul>
                    <p className="mt-3 text-xs text-slate-600">
                      If your accounting records do not show intangible assets, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.assets.intangibleAssets}
                onChange={(v) => updateForm('assets.intangibleAssets', v)}
              />
              <CurrentAssetCard
                title="Long-term investments"
                question={`As of ${asOfLongDate}, did your business hold any investments meant to be kept for more than one year?`}
                explanation="Include investments owned by the business that are not part of day-to-day operations."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Examples may include:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Investment account balances</li>
                      <li>Long-term stocks, bonds, or securities</li>
                      <li>Ownership stakes in other businesses</li>
                    </ul>
                    <p className="mt-3 text-xs text-slate-600">
                      Do not include normal business checking, savings, or operating cash here.
                    </p>
                    <p className="mt-3 text-xs text-slate-600">
                      If your business does not hold long-term investments, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.assets.investments}
                onChange={(v) => updateForm('assets.investments', v)}
              />
              <CurrentAssetCard
                title="Other long-term assets (optional)"
                question={`As of ${asOfLongDate}, did your business have any other long-term assets that were not already listed above?`}
                explanation="Use this only if you have another business asset expected to stay with the business for more than one year that does not fit the sections above."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Examples may include:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Long-term security deposits</li>
                      <li>Deferred financing costs</li>
                      <li>Other non-current assets shown on your books</li>
                    </ul>
                    <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
                      <span className="font-semibold">Tip:</span> If nothing clearly fits here, it is usually fine to enter $0.
                    </div>
                    <p className="mt-3 text-xs text-slate-600">
                      If none apply, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.assets.otherNonCurrentAssets}
                onChange={(v) => updateForm('assets.otherNonCurrentAssets', v)}
              />
            </div>
          </div>
        ) : null}

        {activeStep === 'current_liabilities' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900">Current Liabilities</h2>
              <p className="text-sm text-slate-600">
                Now list what your business owed and needed to pay within the next 12 months, as of <span className="font-semibold text-slate-800">{asOfLongDate}</span>.
              </p>
              <p className="text-sm text-slate-600">
                These are short-term amounts the business still owed on that exact date.
              </p>
              <p className="text-xs text-slate-500">
                Only include balances that were still unpaid as of {asOfLongDate}.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <CurrentAssetCard
                title="Vendor bills not yet paid"
                question={`As of ${asOfLongDate}, how much did your business still owe vendors for bills it had already received?`}
                explanation="Include unpaid bills from suppliers, contractors, or service providers."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Examples may include:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Supplier invoices</li>
                      <li>Contractor bills</li>
                      <li>Utility or service bills already received but not yet paid</li>
                    </ul>
                    <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
                      <span className="font-semibold">Tip:</span> If you use accounting software, this is often your Accounts Payable or unpaid bills total.
                    </div>
                    <p className="mt-3 text-xs text-slate-600">
                      If your business did not have unpaid vendor bills, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.liabilities.accountsPayable}
                onChange={(v) => updateForm('liabilities.accountsPayable', v)}
              />
              <CurrentAssetCard
                title="Expenses incurred but not yet paid"
                question={`As of ${asOfLongDate}, had your business already incurred any expenses that had not been paid yet?`}
                explanation="Use this for expenses your business had already built up by that date, even if the bill was not paid until later."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Examples may include:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Payroll owed</li>
                      <li>Payroll taxes accrued</li>
                      <li>Interest that had built up but was not paid yet</li>
                      <li>Utilities already used but not yet paid</li>
                    </ul>
                    <p className="mt-3 text-xs text-slate-600">
                      If you do not track accrual entries in your books, it is usually fine to enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.liabilities.accruedExpenses}
                onChange={(v) => updateForm('liabilities.accruedExpenses', v)}
              />
              <CurrentAssetCard
                title="Taxes payable"
                question={`As of ${asOfLongDate}, how much business tax did your business still owe but had not yet paid?`}
                explanation="Include unpaid business taxes that were still due on that date."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">This may include:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Payroll taxes</li>
                      <li>Sales taxes</li>
                      <li>Federal, state, or local business taxes</li>
                    </ul>
                    <p className="mt-3 text-xs text-slate-600">
                      Do not include tax amounts that were already paid.
                    </p>
                    <p className="mt-3 text-xs text-slate-600">
                      If no taxes were still owed, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.liabilities.taxesPayable}
                onChange={(v) => updateForm('liabilities.taxesPayable', v)}
              />
              <CurrentAssetCard
                title="Loan principal due in the next 12 months"
                question={`As of ${asOfLongDate}, how much principal on long-term business loans was due within the next 12 months?`}
                explanation="Enter only the portion due in the next year, not the full remaining loan balance."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs text-slate-600">
                      This usually comes from a loan amortization schedule or from your accountant&apos;s current portion of long-term debt entry.
                    </p>
                    <p className="mt-3 text-xs text-slate-600">
                      Do not include interest or loan amounts due after the next 12 months here.
                    </p>
                    <p className="mt-3 text-xs text-slate-600">
                      If none of your business loans had principal due within the next year, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.liabilities.currentPortionLongTermDebt}
                onChange={(v) => updateForm('liabilities.currentPortionLongTermDebt', v)}
              />
              <CurrentAssetCard
                title="Credit cards and lines of credit"
                question={`As of ${asOfLongDate}, what was the total balance your business still owed on business credit cards and lines of credit?`}
                explanation="Include all revolving business debt balances that were outstanding on that date."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Include balances from:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Business credit cards</li>
                      <li>Business lines of credit</li>
                      <li>Other revolving business borrowing accounts</li>
                    </ul>
                    <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
                      <span className="font-semibold">Tip:</span> Use the statement balances closest to {asOfLongDate}.
                    </div>
                    <p className="mt-3 text-xs text-slate-600">
                      If your business had no credit cards or lines of credit outstanding, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.liabilities.creditCardsAndLines}
                onChange={(v) => updateForm('liabilities.creditCardsAndLines', v)}
              />
              <CurrentAssetCard
                title="Customer payments received in advance"
                question={`As of ${asOfLongDate}, how much money had your business already collected for work or products it had not delivered yet?`}
                explanation="Use this for customer prepayments your business still owed work, service, or product for."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Examples may include:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Customer deposits</li>
                      <li>Prepaid retainers</li>
                      <li>Money collected for future work</li>
                      <li>Cash received for products not yet delivered</li>
                    </ul>
                    <p className="mt-3 text-xs text-slate-600">
                      If your books do not track deferred or unearned revenue, it is usually fine to enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.liabilities.deferredRevenue}
                onChange={(v) => updateForm('liabilities.deferredRevenue', v)}
              />
              <CurrentAssetCard
                title="Other short-term liabilities (optional)"
                question={`As of ${asOfLongDate}, did your business have any other short-term amounts owed within the next 12 months that were not already listed above?`}
                explanation="Use this only for short-term liabilities that do not fit the categories above."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Examples may include:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Short-term notes payable</li>
                      <li>Customer deposits due soon</li>
                      <li>Other short-term obligations on your books</li>
                    </ul>
                    <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
                      <span className="font-semibold">Tip:</span> If nothing clearly fits here, it is usually fine to enter $0.
                    </div>
                    <p className="mt-3 text-xs text-slate-600">
                      If none apply, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.liabilities.otherCurrentLiabilities}
                onChange={(v) => updateForm('liabilities.otherCurrentLiabilities', v)}
              />
            </div>
          </div>
        ) : null}

        {activeStep === 'longterm_liabilities' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900">Long-Term Liabilities</h2>
              <p className="text-sm text-slate-600">
                Now list what your business still owed after the next 12 months, as of <span className="font-semibold text-slate-800">{asOfLongDate}</span>.
              </p>
              <p className="text-sm text-slate-600">
                These are longer-term debts or obligations that were not due within the next year.
              </p>
              <p className="text-xs text-slate-500">
                If you already entered the amount due in the next 12 months on the previous step, only enter the remaining long-term portion here.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <CurrentAssetCard
                title="Long-term debt"
                question={`As of ${asOfLongDate}, what was the remaining balance on business loans that was due after the next 12 months?`}
                explanation="Include the longer-term portion of business loans that was not due within the next year."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Examples may include:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Term loans</li>
                      <li>Business mortgages</li>
                      <li>Equipment loans with more than one year remaining</li>
                    </ul>
                    <p className="mt-3 text-xs text-slate-600">
                      Do not include the amount due within the next 12 months if you already entered it on the previous page.
                    </p>
                    <p className="mt-3 text-xs text-slate-600">
                      If your business had no long-term debt remaining, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.liabilities.longTermDebt}
                onChange={(v) => updateForm('liabilities.longTermDebt', v)}
              />
              <CurrentAssetCard
                title="Loans from owners or shareholders"
                question={`As of ${asOfLongDate}, how much did the business owe owners, partners, members, or shareholders under loan arrangements due after the next 12 months?`}
                explanation="Use this for money owners or related parties loaned to the business that is meant to be repaid later."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs text-slate-600">
                      Include formal or documented loans from owners, members, partners, or shareholders.
                    </p>
                    <p className="mt-3 text-xs text-slate-600">
                      If you track these balances as due to owner, shareholder loan, or member loan on your books, they usually belong here.
                    </p>
                    <p className="mt-3 text-xs text-slate-600">
                      If the business does not owe owners or shareholders under long-term loan arrangements, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.liabilities.shareholderLoans}
                onChange={(v) => updateForm('liabilities.shareholderLoans', v)}
              />
              <CurrentAssetCard
                title="Other long-term liabilities (optional)"
                question={`As of ${asOfLongDate}, did your business have any other long-term amounts owed that were not already listed above?`}
                explanation="Use this only for other obligations due after more than one year that do not fit the categories above."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Examples may include:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Long-term lease liabilities</li>
                      <li>Deferred tax liabilities</li>
                      <li>Other non-current obligations on your books</li>
                    </ul>
                    <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
                      <span className="font-semibold">Tip:</span> If nothing clearly fits here, it is usually fine to enter $0.
                    </div>
                    <p className="mt-3 text-xs text-slate-600">
                      If none apply, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.liabilities.otherLongTermLiabilities}
                onChange={(v) => updateForm('liabilities.otherLongTermLiabilities', v)}
              />
            </div>
          </div>
        ) : null}

        {activeStep === 'equity' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900">Equity</h2>
              <p className="text-sm text-slate-600">
                Last, enter the owner-related balances for the business as of <span className="font-semibold text-slate-800">{asOfLongDate}</span>.
              </p>
              <p className="text-sm text-slate-600">
                Equity is the value left in the business after subtracting liabilities from assets.
              </p>
              <p className="text-sm text-slate-600">
                Retained earnings is calculated automatically at the end of this step so the sheet stays balanced after your other equity inputs.
              </p>
              <p className="text-xs text-slate-500">
                If your accounting system has an Equity section, those balances usually map directly here.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <CurrentAssetCard
                title="Owner contributions"
                question={`As of ${asOfLongDate}, how much money or value had owners contributed to the business?`}
                explanation="Include owner capital contributions recorded on your books."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs text-slate-600">
                      This may be called owner contributions, paid-in capital, member contributions, or partner capital in your accounting records.
                    </p>
                    <p className="mt-3 text-xs text-slate-600">
                      If no owner contribution balance is recorded separately, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.equity.ownerContributions}
                onChange={(v) => updateForm('equity.ownerContributions', v)}
              />
              <CurrentAssetCard
                title="Owner distributions or draws"
                question={`As of ${asOfLongDate}, how much had owners taken out of the business in distributions or draws?`}
                explanation="Include withdrawals by owners that reduce the business's equity."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs text-slate-600">
                      This may be labeled owner draws, distributions, partner draws, or shareholder distributions.
                    </p>
                    <p className="mt-3 text-xs text-slate-600">
                      If distributions are already netted somewhere else in your books, follow that same presentation here.
                    </p>
                    <p className="mt-3 text-xs text-slate-600">
                      If there were no owner draws or distributions, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.equity.ownerDistributions}
                onChange={(v) => updateForm('equity.ownerDistributions', v)}
              />
              <CurrentAssetCard
                title="Other equity (optional)"
                question={`As of ${asOfLongDate}, did your business have any other equity balances that were not already listed above?`}
                explanation="Use this only for other equity amounts on your books that do not fit the categories above."
                placeholder="Enter 0 if none"
                details={
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Examples may include:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Partner adjustments</li>
                      <li>Other equity balances shown in your accounting system</li>
                      <li>Additional owner-related equity accounts</li>
                    </ul>
                    <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
                      <span className="font-semibold">Tip:</span> If nothing clearly fits here, it is usually fine to enter $0.
                    </div>
                    <p className="mt-3 text-xs text-slate-600">
                      If none apply, enter <span className="font-semibold text-slate-800">$0</span>.
                    </p>
                  </>
                }
                value={form.equity.otherEquity}
                onChange={(v) => updateForm('equity.otherEquity', v)}
              />
              <CurrentAssetCard
                title="Retained earnings"
                question={`As of ${asOfLongDate}, the retained earnings balancing amount is shown below.`}
                explanation="This line auto-calculates as the balancing figure so Assets always equal Liabilities plus Equity."
                placeholder="Calculated automatically"
                details={
                  <>
                    <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
                      <span className="font-semibold">Note:</span> We use retained earnings as the balance sheet adjuster. If this amount does not look right, double-check your assets, liabilities, owner contributions, owner distributions, and other equity entries.
                    </div>
                    <p className="mt-3 text-xs text-slate-600">
                      When you update owner contributions, distributions, or other equity above, this amount recalculates automatically so the balance sheet stays in balance.
                    </p>
                  </>
                }
                value={calculatedRetainedEarnings}
                onChange={() => {}}
                readOnly
              />
            </div>
          </div>
        ) : null}

        {activeStep === 'review' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900">Review & Notes</h2>
              <p className="text-sm text-slate-600">
                Review the totals below to make sure everything looks reasonable for {asOfLongDate}.
              </p>
              <p className="text-xs text-slate-500">
                Retained earnings is auto-calculated as the balancing line. If that number looks unusual, something may have been missed or entered in the wrong section.
              </p>
            </div>

            <div className={`rounded-2xl border px-4 py-4 ${balanceDelta === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-white/80 p-4 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Assets</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">${totalAssets.toLocaleString()}</div>
                </div>
                <div className="rounded-xl bg-white/80 p-4 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Liabilities + Equity</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">${(totalLiabilities + totalEquity).toLocaleString()}</div>
                </div>
                <div className={`rounded-xl p-4 text-center ${balanceDelta === 0 ? 'bg-white/80 text-emerald-900' : 'bg-white/80 text-amber-900'}`}>
                  <div className="text-xs font-semibold uppercase tracking-wide">Out of Balance</div>
                  <div className="mt-1 text-2xl font-bold">${Math.abs(balanceDelta).toLocaleString()}</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl">
                  <p className={`text-sm font-semibold ${balanceDelta === 0 ? 'text-emerald-900' : 'text-amber-900'}`}>Balance Sheet Adjuster</p>
                  <p className={`mt-1 text-sm ${balanceDelta === 0 ? 'text-emerald-800' : 'text-amber-800'}`}>
                    A balance sheet should balance because <span className="font-semibold">Assets must equal Liabilities + Equity</span>.
                  </p>
                  {balanceDelta === 0 ? (
                    <>
                      <p className="mt-2 text-xs text-emerald-800">
                        Retained earnings is currently auto-calculated at <span className="font-semibold">${calculatedRetainedEarnings.toLocaleString()}</span> so the sheet stays balanced after owner contributions, distributions, and other equity.
                      </p>
                      <p className="mt-1 text-xs text-emerald-800">
                        If that retained earnings number looks off compared with the books, review the assets, liabilities, contributions, distributions, and other equity amounts before generating the PDF.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-2 text-xs text-amber-800">
                        Right now the sheet is off by <span className="font-semibold">${Math.abs(balanceDelta).toLocaleString()}</span>.
                      </p>
                      <p className="mt-1 text-xs text-amber-800">
                        {balanceDelta > 0
                          ? 'Assets are currently higher than liabilities plus equity. To balance it, either reduce asset amounts or increase liability/equity amounts by that difference.'
                          : 'Liabilities plus equity are currently higher than assets. To balance it, either reduce liability/equity amounts or increase asset amounts by that difference.'}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Biggest Asset Inputs
                    {balanceDelta > 0 ? ` (Need $${Math.abs(balanceDelta).toLocaleString()} Less)` : balanceDelta < 0 ? ` (Need $${Math.abs(balanceDelta).toLocaleString()} More)` : ''}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">You can edit these amounts right here without leaving the review page.</p>
                  <div className="mt-3 space-y-2">
                    {topAssetReviewFields.map((field) => (
                      <div
                        key={`asset-review-${field.label}`}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{field.label}</div>
                            <button
                              type="button"
                              onClick={() => setActiveStep(field.step)}
                              className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
                            >
                              Open {STEPS.find((step) => step.id === field.step)?.title}
                            </button>
                          </div>
                          <CurrencyInput
                            value={field.value}
                            onValueChange={field.onChange}
                            withDollarPrefix
                            placeholder="0"
                            className="w-[170px]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Biggest Liability & Equity Inputs
                    {balanceDelta > 0 ? ` (Need $${Math.abs(balanceDelta).toLocaleString()} More)` : balanceDelta < 0 ? ` (Need $${Math.abs(balanceDelta).toLocaleString()} Less)` : ''}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">You can edit these amounts right here too as you work toward balancing the sheet.</p>
                  <div className="mt-3 space-y-2">
                    {topLiabilityEquityReviewFields.map((field) => (
                      <div
                        key={`liability-review-${field.label}`}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{field.label}</div>
                            <button
                              type="button"
                              onClick={() => setActiveStep(field.step)}
                              className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
                            >
                              Open {STEPS.find((step) => step.id === field.step)?.title}
                            </button>
                          </div>
                          <CurrencyInput
                            value={field.value}
                            onValueChange={field.onChange}
                            withDollarPrefix
                            placeholder="0"
                            className="w-[170px]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-100 p-2 sm:p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Live PDF Preview</p>
                  <p className="text-xs text-slate-600">This is the lender-facing balance sheet generated from your answers and calculations.</p>
                </div>
                {pdfUrl ? (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-700 underline hover:text-blue-900"
                  >
                    Open last PDF
                  </a>
                ) : null}
              </div>
              <div className="mx-auto w-full max-w-[816px] bg-white shadow-lg">
                <BalanceSheetSvgTemplate data={formWithCalculatedRetainedEarnings} />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                  checked={previewConfirmed}
                  onChange={(event) => setPreviewConfirmed(event.target.checked)}
                />
                <span>I have reviewed this preview and confirm everything looks accurate before generating the PDF.</span>
              </label>
            </div>
          </div>
        ) : null}

      </section>
      <section className={`${sectionCardClassName} sticky bottom-0 z-30 border-t-2 border-slate-200 bg-white/95 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur`}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-600">Changes save automatically as you type. No manual save needed.</p>
            <div className={`text-sm font-semibold ${allSectionsComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
              {allSectionsComplete ? (previewConfirmed ? 'Preview confirmed. Generate PDF when ready.' : 'Review the preview and confirm accuracy to enable Generate PDF.') : 'Continue to the next step when ready.'}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackStep}
                disabled={!canGoBack}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Back
              </button>
            </div>
            <div className="flex items-center gap-4">
              {pdfUrl ? (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-700 underline hover:text-blue-900"
                >
                  Open PDF
                </a>
              ) : null}
              {canGoNext ? (
                <button
                  type="button"
                  onClick={handleContinueStep}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Continue
                </button>
              ) : null}
              {allSectionsComplete ? (
                <button
                  type="button"
                  onClick={onGenerate}
                  className={`rounded-lg px-5 py-2 text-sm font-semibold text-white ${
                    reviewReadyForPdf ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-400 hover:bg-slate-500'
                  }`}
                  disabled={!reviewReadyForPdf || loading}
                >
                  {loading ? 'Generating PDF...' : 'Generate PDF'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>
      {loading ? <PdfGenerationOverlay templateLabel="balance sheet" /> : null}
    </TemplatePageShell>
  );
}
