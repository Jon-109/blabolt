'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/supabase/helpers/client';
import type { IncomeStatementData } from '@/lib/templates/types';
import { IncomeStatementSchema } from '@/lib/templates/validate';
import { Input } from '@/app/(components)/ui/input';
import { FormField } from '@/app/(components)/templates/shared/FormField';
import CurrencyInput from '@/app/(components)/templates/shared/CurrencyInput';
import IncomeStatementSvgTemplate from '@/app/(components)/templates/IncomeStatementSvgTemplate';
import PdfGenerationOverlay from '@/app/(components)/templates/shared/PdfGenerationOverlay';
import TemplateHeroProgressBar from '@/app/(components)/templates/shared/TemplateHeroProgressBar';
import TemplatePageShell from '@/app/(components)/templates/shared/TemplatePageShell';
import { checkUserTemplateAccess } from '@/lib/templates/access';
import { getIncomeStatementTotals } from '@/lib/templates/income-statement-calculations';
import {
  getIncomeStatementMissingFields,
  getIncomeStatementProgress,
  INCOME_STATEMENT_REQUIRED_FIELDS_BY_STEP,
  type IncomeStatementRequiredFieldDescriptor,
} from '@/lib/templates/income-statement-progress';
import {
  deriveIncomeStatementLabel,
  deriveIncomeStatementTitle,
  normalizeIncomeStatementType,
} from '@/lib/templates/income-statement-labels';
import { getTemplateSharedProfile, upsertTemplateSharedProfile } from '@/lib/templates/profile';

type IncomeStatementSubmission = {
  id: string;
  form_data: IncomeStatementData | null;
  pdf_url: string | null;
  updated_at: string;
};

const MAX_STATEMENTS = 5;
const INCOME_STATEMENT_TYPE_OPTIONS: Array<{ value: 'annual' | 'ytd'; label: string }> = [
  { value: 'annual', label: 'Year-End' },
  { value: 'ytd', label: 'Year-to-Date' },
];
const MONTH_OPTIONS = [
  { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' }, { value: 4, label: 'Apr' },
  { value: 5, label: 'May' }, { value: 6, label: 'Jun' }, { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' }, { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' },
];
const YEAR_OPTIONS = Array.from({ length: 12 }, (_, i) => new Date().getFullYear() - i);
const CURRENCY_INPUT_PLACEHOLDER = 'Enter 0 if none';

const STEPS = [
  { id: 'statement_period', title: 'Statement Period', subtitle: 'Set business name and reporting dates.' },
  { id: 'revenue', title: 'Revenue', subtitle: 'Income your business earned during the selected period before expenses.' },
  { id: 'cogs', title: 'Cost of Goods Sold', subtitle: 'Direct costs required to produce or purchase the goods you sell.' },
  { id: 'expenses', title: 'Operating Expenses', subtitle: 'Everyday costs required to run your business.' },
  { id: 'review', title: 'Review', subtitle: 'Check your totals and generate the PDF when ready.' },
] as const;

const toIsoDate = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
const lastDayOfMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
const parseIsoDate = (value?: string) => {
  if (!value) return null;
  const [y, m, d] = value.split('-').map((part) => Number(part));
  if (!y || !m || !d) return null;
  return { year: y, month: m, day: d };
};
const formatIsoDate = (value?: string) => {
  const parsed = parseIsoDate(value);
  if (!parsed) return value || '-';
  return `${String(parsed.month).padStart(2, '0')}/${String(parsed.day).padStart(2, '0')}/${parsed.year}`;
};

function FieldHelpCard({
  summary,
  examples,
  avoid,
}: {
  summary: string;
  examples: string[];
  avoid: string[];
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] leading-5 text-slate-600">
      <p className="text-slate-700">{summary}</p>
      <div className="mt-2">
        <p className="font-semibold uppercase tracking-[0.06em] text-slate-500">Examples</p>
        <ul className="mt-1 space-y-1">
          {examples.map((example) => (
            <li key={example} className="flex gap-2">
              <span className="text-slate-400">•</span>
              <span>{example}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-2">
        <p className="font-semibold uppercase tracking-[0.06em] text-slate-500">Do not include</p>
        <ul className="mt-1 space-y-1">
          {avoid.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-slate-400">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function HelperBanner({
  title,
  body,
  tone = 'slate',
}: {
  title: string;
  body: string;
  tone?: 'blue' | 'amber' | 'slate';
}) {
  const toneClassName =
    tone === 'blue'
      ? 'border-sky-200 bg-sky-50 text-sky-900'
      : tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-slate-200 bg-slate-50 text-slate-700';

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${toneClassName}`}>
      <span className="font-semibold">{title}</span> {body}
    </div>
  );
}

const defaultIncomeForm = (
  statementType: IncomeStatementData['statementType'] = 'ytd',
  statementLabel = '',
): IncomeStatementData => {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 31);

  let periodStart = yearStart.toISOString().split('T')[0] as string;
  let periodEnd = now.toISOString().split('T')[0] as string;

  if (statementType === 'annual') {
    periodEnd = yearEnd.toISOString().split('T')[0] as string;
  }

  return {
    statementLabel: statementLabel || deriveIncomeStatementLabel({ statementType, periodEnd }),
    statementType: normalizeIncomeStatementType(statementType, periodStart, periodEnd),
    periodStart,
    periodEnd,
    businessInfo: {
      name: '',
    },
    revenue: { grossSales: undefined, serviceRevenue: undefined, otherRevenue: undefined },
    cogs: {
      inventoryMaterialsCost: undefined,
      directLabor: undefined,
      shippingPackaging: undefined,
      otherDirectCosts: undefined,
    },
    operatingExpenses: {
      payrollContractorPayments: undefined,
      rentFacilityCosts: undefined,
      utilitiesInternet: undefined,
      marketingAdvertising: undefined,
      softwareSubscriptions: undefined,
      professionalServices: undefined,
      insurance: undefined,
      officeAdministrative: undefined,
      vehicleTravel: undefined,
      otherOperatingExpenses: undefined,
    },
    interestExpense: undefined,
    notes: '',
  };
};

const normalizeIncomeForm = (raw: unknown): IncomeStatementData => {
  const base = defaultIncomeForm();
  if (!raw || typeof raw !== 'object') return base;

  const candidate = raw as Partial<IncomeStatementData>;
  const merged = {
    ...base,
    ...candidate,
    businessInfo: { ...base.businessInfo, ...(candidate.businessInfo ?? {}) },
    revenue: { ...base.revenue, ...(candidate.revenue ?? {}) },
    cogs: { ...base.cogs, ...(candidate.cogs ?? {}) },
    operatingExpenses: { ...base.operatingExpenses, ...(candidate.operatingExpenses ?? {}) },
    expenses: { ...(candidate.expenses ?? {}) },
  };
  const statementType = normalizeIncomeStatementType(merged.statementType, merged.periodStart, merged.periodEnd);
  const legacyExpenses = candidate.expenses ?? {};
  const hasLegacyOtherOperating = legacyExpenses.otherExpenses != null || legacyExpenses.depreciation != null;

  return {
    ...merged,
    statementType,
    statementLabel: merged.statementLabel || deriveIncomeStatementLabel({ statementType, periodEnd: merged.periodEnd }),
    cogs: {
      ...merged.cogs,
      inventoryMaterialsCost: merged.cogs?.inventoryMaterialsCost ?? legacyExpenses.costOfGoodsSold,
    },
    operatingExpenses: {
      ...merged.operatingExpenses,
      payrollContractorPayments: merged.operatingExpenses?.payrollContractorPayments ?? legacyExpenses.salariesWages,
      rentFacilityCosts: merged.operatingExpenses?.rentFacilityCosts ?? legacyExpenses.rent,
      utilitiesInternet: merged.operatingExpenses?.utilitiesInternet ?? legacyExpenses.utilities,
      marketingAdvertising: merged.operatingExpenses?.marketingAdvertising ?? legacyExpenses.marketing,
      insurance: merged.operatingExpenses?.insurance ?? legacyExpenses.insurance,
      otherOperatingExpenses:
        merged.operatingExpenses?.otherOperatingExpenses ??
        (hasLegacyOtherOperating
          ? (legacyExpenses.otherExpenses || 0) + (legacyExpenses.depreciation || 0)
          : undefined),
    },
    interestExpense: merged.interestExpense ?? legacyExpenses.interestExpense,
  };
};

export default function IncomeStatementFormPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedSubmissionId = searchParams.get('submissionId');
  const loanRequestId = searchParams.get('loanRequestId');
  const forceNew = searchParams.get('new') === '1';

  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<IncomeStatementSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [previewConfirmed, setPreviewConfirmed] = useState(false);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDay, setSelectedDay] = useState(currentDay);

  const [form, setForm] = useState<IncomeStatementData>(defaultIncomeForm());

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const loadSubmissions = async (userId: string) => {
    const { data, error } = await supabase
      .from('template_submissions')
      .select('id,form_data,pdf_url,updated_at')
      .eq('user_id', userId)
      .eq('template_type', 'income_statement')
      .is('archived_at', null)
      .order('updated_at', { ascending: false })
      .limit(MAX_STATEMENTS);

    if (error) throw error;
    const rows = (data ?? []) as IncomeStatementSubmission[];
    setSubmissions(rows);
    return rows;
  };

  const loadSubmissionIntoForm = (submission: IncomeStatementSubmission) => {
    const normalized = normalizeIncomeForm(submission.form_data);
    const parsedEnd = parseIsoDate(normalized.periodEnd);
    setSubmissionId(submission.id);
    setPdfUrl(submission.pdf_url);
    setForm(normalized);
    if (parsedEnd) {
      setSelectedYear(parsedEnd.year);
      setSelectedMonth(parsedEnd.month);
      setSelectedDay(parsedEnd.day);
    }
    setActiveStepIndex(0);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('new');
    params.set('submissionId', submission.id);
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

      const access = await checkUserTemplateAccess(sessionUser.id, 'income_statement');
      if (!access.allowed) {
        router.replace(access.redirectUrl || '/services/templates-bundle');
        return;
      }

      const existingSubmissions = await loadSubmissions(sessionUser.id);
      const profile = await getTemplateSharedProfile(sessionUser.id);
      const sharedBusinessName = profile.businessName || profile.businessLegalName || '';

      if (!isActive) return;

      if (requestedSubmissionId) {
        const requested = existingSubmissions.find((item) => item.id === requestedSubmissionId);
        if (requested) {
          loadSubmissionIntoForm(requested);
        } else if (!forceNew && existingSubmissions[0]) {
          loadSubmissionIntoForm(existingSubmissions[0]);
        }
      } else if (!forceNew && existingSubmissions[0]) {
        loadSubmissionIntoForm(existingSubmissions[0]);
      }

      if (sharedBusinessName) {
        setForm((prev) => ({
          ...prev,
          businessInfo: {
            ...(prev.businessInfo ?? {}),
            name: prev.businessInfo?.name || sharedBusinessName,
          },
        }));
      }

      setUser(sessionUser);
    };

    checkAuth()
      .catch((error) => {
        console.error('Failed loading income statement page:', error);
      })
      .finally(() => {
        if (isActive) setIsAuthChecking(false);
      });

    return () => {
      isActive = false;
    };
  }, [forceNew, pathname, requestedSubmissionId, router]);

  const queueSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveDraft();
    }, 1500);
  };

  const saveDraft = async (): Promise<string | null> => {
    if (!user) return submissionId;
    if (!submissionId && submissions.length >= MAX_STATEMENTS) {
      setLocalMessage('Maximum of 5 income statements reached.');
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
            template_type: 'income_statement',
            form_data: form,
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
          .update({ form_data: form })
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
  };

  const validateForm = () => {
    const firstIncompleteStepIndex = INCOME_STATEMENT_REQUIRED_FIELDS_BY_STEP.findIndex((_, index) => getMissingFieldsForStep(index).length > 0);
    if (firstIncompleteStepIndex !== -1) {
      const missingFields = getMissingFieldsForStep(firstIncompleteStepIndex);
      setActiveStepIndex(firstIncompleteStepIndex);
      setTimeout(() => {
        promptForMissingField(firstIncompleteStepIndex, missingFields);
      }, 0);
      return false;
    }

    try {
      IncomeStatementSchema.parse(form);
      setErrors({});
      return true;
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
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
      alert('Please fix the validation errors before generating PDF.');
      return;
    }

    setLoading(true);
    try {
      let resolvedSubmissionId = submissionId;
      if (!resolvedSubmissionId) {
        resolvedSubmissionId = await saveDraft();
      }

      if (!resolvedSubmissionId) throw new Error('Failed to save submission');

      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          submissionId: resolvedSubmissionId,
          templateType: 'income_statement',
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
        await supabase
          .from('template_submissions')
          .update({ pdf_url: json.pdfUrl })
          .eq('id', resolvedSubmissionId)
          .eq('user_id', user.id);
        await loadSubmissions(user.id);
      }
    } catch (error: any) {
      console.error('PDF generation error:', error);
      alert(`Failed to generate PDF: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (path: string, value: any) => {
    const keys = path.split('.');
    setForm((prev) => {
      const updated = { ...prev };
      let current: any = updated;
      for (let i = 0; i < keys.length - 1; i += 1) {
        const key = keys[i];
        if (key) {
          current[key] = { ...current[key] };
          current = current[key];
        }
      }
      const lastKey = keys[keys.length - 1];
      if (lastKey) current[lastKey] = value === '' ? undefined : value;
      return updated;
    });
    setLocalMessage(null);
    setErrors((prev) => {
      if (!prev[path]) return prev;
      const next = { ...prev };
      delete next[path];
      return next;
    });
    queueSave();
  };

  const handleStatementTypeChange = (nextType: 'annual' | 'ytd') => {
    updateForm('statementType', nextType);
    if (nextType === 'ytd') {
      setSelectedYear(currentYear);
      setSelectedMonth(currentMonth);
      setSelectedDay(currentDay);
    }
  };

  const handleUseTodayPeriodEnd = () => {
    const today = new Date();
    updateForm('statementType', 'ytd');
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth() + 1);
    setSelectedDay(today.getDate());
  };

  useEffect(() => {
    if ((form.statementType || 'ytd') === 'annual' && selectedYear >= currentYear) {
      setSelectedYear(currentYear - 1);
    }
  }, [currentYear, form.statementType, selectedYear]);

  useEffect(() => {
    const statementType = normalizeIncomeStatementType(form.statementType, form.periodStart, form.periodEnd);
    const maxDay = lastDayOfMonth(selectedYear, selectedMonth);
    const safeDay = Math.min(selectedDay, maxDay);

    if (safeDay !== selectedDay) {
      setSelectedDay(safeDay);
      return;
    }

    const nextPeriodStart = toIsoDate(selectedYear, 1, 1);
    const nextPeriodEnd =
      statementType === 'annual' ? toIsoDate(selectedYear, 12, 31) : toIsoDate(selectedYear, selectedMonth, safeDay);
    const nextStatementLabel = deriveIncomeStatementLabel({ statementType, periodEnd: nextPeriodEnd });
    const needsTypeUpdate = statementType !== (form.statementType || 'ytd');
    const needsStartUpdate = nextPeriodStart !== form.periodStart;
    const needsEndUpdate = nextPeriodEnd !== form.periodEnd;
    const needsLabelUpdate = nextStatementLabel !== (form.statementLabel || '');

    if (needsTypeUpdate || needsStartUpdate || needsEndUpdate || needsLabelUpdate) {
      setForm((prev) => ({
        ...prev,
        statementType: needsTypeUpdate ? statementType : prev.statementType,
        periodStart: needsStartUpdate ? nextPeriodStart : prev.periodStart,
        periodEnd: needsEndUpdate ? nextPeriodEnd : prev.periodEnd,
        statementLabel: needsLabelUpdate ? nextStatementLabel : prev.statementLabel,
      }));
      queueSave();
    }
  }, [form.periodEnd, form.periodStart, form.statementLabel, form.statementType, queueSave, selectedDay, selectedMonth, selectedYear]);

  const {
    totalRevenue,
    totalCogs,
    grossProfit,
    totalOperatingExpenses,
    operatingProfit,
    netProfit,
  } = useMemo(() => getIncomeStatementTotals(form), [form]);
  const currentStatementType = normalizeIncomeStatementType(form.statementType, form.periodStart, form.periodEnd);
  const pageTitle = useMemo(() => deriveIncomeStatementTitle(form), [form]);

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

  const activeSubmissionLabel = useMemo(() => {
    if (form.statementLabel) return form.statementLabel;
    if (!submissionId) return 'New Draft';
    return deriveIncomeStatementLabel({ statementType: currentStatementType, periodEnd: form.periodEnd });
  }, [currentStatementType, form.periodEnd, form.statementLabel, submissionId]);
  const statementPeriodRange = `${formatIsoDate(form.periodStart)} - ${formatIsoDate(form.periodEnd)}`;
  const revenuePeriodGuidance = `For this statement, only include income earned between ${statementPeriodRange}. Do not include revenue from before or after that range.`;
  const cogsPeriodGuidance = `For this statement, only include direct product costs tied to goods sold between ${statementPeriodRange}. Leave these at $0 if you do not sell physical products.`;
  const expensesPeriodGuidance = `For this statement, only include operating expenses paid or incurred between ${statementPeriodRange}. Do not include costs from outside that date range.`;
  const registerFieldRef = (path: string) => (element: HTMLElement | null) => {
    fieldRefs.current[path] = element;
  };
  const focusField = (path: string) => {
    const element = fieldRefs.current[path];
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.focus();
    if (element instanceof HTMLInputElement) {
      element.select();
    }
  };
  const getMissingFieldsForStep = (stepIndex: number) =>
    getIncomeStatementMissingFields(form, STEPS[stepIndex]?.id ?? 'statement_period', { reviewConfirmed: previewConfirmed });
  const stepCompletionStates = STEPS.map(
    (step) => getIncomeStatementMissingFields(form, step.id, { reviewConfirmed: previewConfirmed }).length === 0,
  );
  const progressState = getIncomeStatementProgress(form, { reviewConfirmed: previewConfirmed });
  const {
    percent: progressPercent,
    totalRequiredItems: totalRequiredFields,
    completedRequiredItems: completedRequiredFields,
    allDataFieldsComplete: allDataStepsComplete,
  } = progressState;
  const activeStep = STEPS[activeStepIndex] ?? STEPS[0];
  const canGoBack = activeStepIndex > 0;
  const canGoNext = activeStepIndex < STEPS.length - 1;
  const allSectionsComplete = allDataStepsComplete;
  const reviewReadyForPdf = allDataStepsComplete && previewConfirmed;
  const setStepErrors = (stepIndex: number, missingFields: IncomeStatementRequiredFieldDescriptor[]) => {
    const stepFields = INCOME_STATEMENT_REQUIRED_FIELDS_BY_STEP[stepIndex]?.fields ?? [];
    setErrors((prev) => {
      const next = { ...prev };
      stepFields.forEach((field) => {
        delete next[field.path];
      });
      missingFields.forEach((field) => {
        next[field.path] =
          field.type === 'currency'
            ? 'Enter an amount. Type 0 if none.'
            : field.type === 'checkbox'
            ? 'Please confirm the review checkbox.'
            : 'This field is required.';
      });
      return next;
    });
  };
  const promptForMissingField = (stepIndex: number, missingFields: IncomeStatementRequiredFieldDescriptor[]) => {
    if (!missingFields.length) return;
    const [firstMissing] = missingFields;
    if (!firstMissing) return;
    setStepErrors(stepIndex, missingFields);
    setLocalMessage(
      firstMissing.type === 'currency'
        ? `Please enter an amount for ${firstMissing.label}. Enter 0 if none applies.`
        : firstMissing.type === 'checkbox'
        ? 'Please confirm that you reviewed the preview before generating the PDF.'
        : `Please enter ${firstMissing.label} before continuing.`,
    );
    requestAnimationFrame(() => {
      focusField(firstMissing.path);
    });
  };

  const handleBackStep = () => {
    setActiveStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleContinueStep = () => {
    const missingFields = getMissingFieldsForStep(activeStepIndex);
    if (missingFields.length > 0) {
      promptForMissingField(activeStepIndex, missingFields);
      return;
    }
    setLocalMessage(null);
    setActiveStepIndex((prev) => Math.min(STEPS.length - 1, prev + 1));
  };

  useEffect(() => {
    if (activeStepIndex !== STEPS.length - 1 && previewConfirmed) {
      setPreviewConfirmed(false);
    }
  }, [activeStepIndex, previewConfirmed]);

  const stepTabs = (
    <>
      <div className="mb-3 md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STEPS.map((step, idx) => {
            const active = idx === activeStepIndex;
            const done = stepCompletionStates[idx];
            return (
              <button
                key={`mobile-${step.id}`}
                type="button"
                onClick={() => setActiveStepIndex(idx)}
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

      <div
        className="mb-4 hidden gap-3 md:grid"
        style={{ gridTemplateColumns: `repeat(${STEPS.length}, minmax(0, 1fr))` }}
      >
        {STEPS.map((step, idx) => {
          const active = idx === activeStepIndex;
          const done = stepCompletionStates[idx];
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStepIndex(idx)}
              className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                active
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : done
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-semibold uppercase tracking-wide">{active ? 'Current' : done ? 'Complete' : 'Pending'}</div>
              <div className="text-sm font-semibold">{step.title}</div>
            </button>
          );
        })}
      </div>
    </>
  );

  if (isAuthChecking || !user) return <div className="mx-auto max-w-7xl px-4 py-8">Loading...</div>;

  return (
    <TemplatePageShell
      title={pageTitle}
      subtitle="Profit and loss statement for lender underwriting."
      description="Complete your lender-ready income statement and generate a polished PDF."
      metricLabel={netProfit >= 0 ? 'Net Profit' : 'Net Loss'}
      metricValue={`$${Math.abs(netProfit).toLocaleString()}`}
      metricSubvalue={activeSubmissionLabel}
      statusLabel={statusLabel}
      statusTone={statusTone}
      fullWidthBelowHero={
        <TemplateHeroProgressBar
          label={`Form progress: ${completedRequiredFields} of ${totalRequiredFields} required items completed`}
          percent={progressPercent}
        />
      }
    >
      {localMessage ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {localMessage}
        </section>
      ) : null}

      {activeStepIndex === 0 ? (
      <section className={sectionCardClassName}>
        {stepTabs}
        <h2 className="mb-6 flex items-center text-xl font-bold text-gray-900">
          <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">📅</div>
          Statement Period
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            label="Business Name"
            htmlFor="businessInfo.name"
            required
            help="Used across your templates and loan profile."
            error={errors['businessInfo.name']}
          >
            <Input
              ref={registerFieldRef('businessInfo.name')}
              type="text"
              maxLength={180}
              value={form.businessInfo?.name || ''}
              onChange={(e) => updateForm('businessInfo.name', e.target.value)}
              onBlur={() => {
                if (!user) return;
                const nextName = (form.businessInfo?.name || '').trim();
                void upsertTemplateSharedProfile(user.id, { businessName: nextName, businessLegalName: nextName });
              }}
              placeholder="Acme Manufacturing LLC"
            />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Statement Type" help="Choose the same year-end or YTD view lenders usually request.">
              <div className="flex flex-wrap gap-2">
                {INCOME_STATEMENT_TYPE_OPTIONS.map((option) => {
                  const active = currentStatementType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleStatementTypeChange(option.value)}
                      className={`flex h-14 w-full items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition-colors sm:w-[240px] ${
                        active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </FormField>
          </div>
          <div className="md:col-span-2">
            <FormField
              label={currentStatementType === 'annual' ? 'Year-End Period' : 'Period End Date'}
              required
              help={
                currentStatementType === 'annual'
                  ? 'Year-end statements use January 1 through December 31 of the selected year.'
                  : 'Select the month, day, and year for your YTD period ending date.'
              }
              error={errors.periodStart || errors.periodEnd}
            >
              <div className="flex flex-wrap items-center gap-2">
                {currentStatementType === 'ytd' ? (
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
                {currentStatementType === 'ytd' ? (
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
                  {(currentStatementType === 'annual'
                    ? YEAR_OPTIONS.filter((year) => year < currentYear)
                    : YEAR_OPTIONS
                  ).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <div className="flex h-10 items-center rounded-md border border-slate-300 bg-slate-100 px-3 text-sm font-medium text-slate-700">
                  {currentStatementType === 'annual' ? (
                    <>Range: {formatIsoDate(form.periodStart)} - {formatIsoDate(form.periodEnd)}</>
                  ) : (
                    <>YTD: {formatIsoDate(form.periodStart)} - {formatIsoDate(form.periodEnd)}</>
                  )}
                </div>
                {currentStatementType === 'ytd' ? (
                  <button
                    type="button"
                    onClick={handleUseTodayPeriodEnd}
                    className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Use Today
                  </button>
                ) : null}
              </div>
            </FormField>
          </div>
        </div>
      </section>
      ) : null}

      {activeStepIndex === 1 ? (
      <section className={sectionCardClassName}>
        {stepTabs}
        <div className="mb-6 flex flex-wrap items-start gap-3">
          <div className="flex min-w-0 flex-1 items-start">
            <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">💰</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Revenue</h2>
              <p className="mt-1 text-sm text-slate-600">
                Income your business earned during the selected period before expenses.
              </p>
            </div>
          </div>
          <div className="rounded-full bg-green-50 px-3 py-1">
            <span className="text-sm font-semibold text-green-700">Total Revenue: ${totalRevenue.toLocaleString()}</span>
          </div>
        </div>
        <div className="mb-6 space-y-3">
          <HelperBanner
            title="Tip:"
            body="If you do not track your finances in these exact categories, use your best estimate based on bank statements or accounting software."
            tone="blue"
          />
          <HelperBanner
            title="Keep it in period:"
            body={revenuePeriodGuidance}
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            label="Product Sales Revenue"
            htmlFor="revenue.grossSales"
            required
            help={
              <FieldHelpCard
                summary="Money earned from selling physical goods or inventory."
                examples={[
                  'Retail sales',
                  'Merchandise or packaged products',
                  'Wholesale goods',
                  'Items sold online or in store',
                ]}
                avoid={[
                  'Service fees',
                  'Labor or consulting charges',
                  'One-time reimbursements',
                ]}
              />
            }
            error={errors['revenue.grossSales']}
          >
            <CurrencyInput
              id="revenue.grossSales"
              inputRef={registerFieldRef('revenue.grossSales')}
              value={form.revenue.grossSales}
              placeholder={CURRENCY_INPUT_PLACEHOLDER}
              withDollarPrefix
              onValueChange={(value) => updateForm('revenue.grossSales', value)}
            />
          </FormField>
          <FormField
            label="Service Revenue"
            htmlFor="revenue.serviceRevenue"
            required
            help={
              <FieldHelpCard
                summary="Money earned from providing services directly to customers."
                examples={[
                  'Consulting or professional services',
                  'Labor charges or installation fees',
                  'Subscription services',
                  'Project-based client work',
                ]}
                avoid={[
                  'Product sales',
                  'Interest income',
                  'Loans or owner contributions',
                ]}
              />
            }
            error={errors['revenue.serviceRevenue']}
          >
            <CurrencyInput
              id="revenue.serviceRevenue"
              inputRef={registerFieldRef('revenue.serviceRevenue')}
              value={form.revenue.serviceRevenue}
              placeholder={CURRENCY_INPUT_PLACEHOLDER}
              withDollarPrefix
              onValueChange={(value) => updateForm('revenue.serviceRevenue', value)}
            />
          </FormField>
          <FormField
            label="Other Revenue"
            htmlFor="revenue.otherRevenue"
            required
            help={
              <FieldHelpCard
                summary="Income your business received that does not come from product sales or client services."
                examples={[
                  'Interest earned from business bank accounts',
                  'Rental income from business property or equipment',
                  'Affiliate income or referral commissions',
                  'Insurance reimbursements, grants, or business awards',
                ]}
                avoid={[
                  'Loans',
                  'Owner investments',
                  'Credit line draws',
                ]}
              />
            }
            error={errors['revenue.otherRevenue']}
          >
            <CurrencyInput
              id="revenue.otherRevenue"
              inputRef={registerFieldRef('revenue.otherRevenue')}
              value={form.revenue.otherRevenue}
              placeholder={CURRENCY_INPUT_PLACEHOLDER}
              withDollarPrefix
              onValueChange={(value) => updateForm('revenue.otherRevenue', value)}
            />
          </FormField>
        </div>
      </section>
      ) : null}

      {activeStepIndex === 2 ? (
      <section className={sectionCardClassName}>
        {stepTabs}
        <div className="mb-6 flex flex-wrap items-start gap-3">
          <div className="flex min-w-0 flex-1 items-start">
            <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">📦</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cost of Goods Sold</h2>
              <p className="mt-1 text-sm text-slate-600">
                Direct costs required to produce or purchase the goods you sell.
              </p>
            </div>
          </div>
          <div className="rounded-full bg-amber-50 px-3 py-1">
            <span className="text-sm font-semibold text-amber-700">Total COGS: ${totalCogs.toLocaleString()}</span>
          </div>
        </div>
        <div className="mb-6 space-y-3">
          <HelperBanner
            title="Tip:"
            body="If you do not track your finances in these exact categories, use your best estimate based on bank statements or accounting software."
            tone="blue"
          />
          <HelperBanner
            title="Use this date range:"
            body={cogsPeriodGuidance}
            tone="amber"
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              key: 'inventoryMaterialsCost',
              label: 'Inventory or Materials Cost',
              help: (
                <FieldHelpCard
                  summary="What you paid to purchase or produce the products sold during this period."
                  examples={[
                    'Inventory purchased for resale',
                    'Raw materials used in products',
                    'Component parts or supplies used in production',
                  ]}
                  avoid={[
                    'Office supplies',
                    'General overhead',
                    'Products still in inventory if not counted in your books here',
                  ]}
                />
              ),
            },
            {
              key: 'directLabor',
              label: 'Direct Labor',
              help: (
                <FieldHelpCard
                  summary="Labor directly tied to making products or fulfilling product orders."
                  examples={[
                    'Production staff pay',
                    'Assembly labor',
                    'Packaging or fulfillment labor tied to goods sold',
                  ]}
                  avoid={[
                    'Office staff payroll',
                    'Administrative payroll',
                    'Owner draws',
                  ]}
                />
              ),
            },
            {
              key: 'shippingPackaging',
              label: 'Shipping and Packaging',
              help: (
                <FieldHelpCard
                  summary="Shipping, freight, or packaging costs related to inventory or product orders."
                  examples={[
                    'Boxes and packing materials',
                    'Freight-in on inventory',
                    'Shipping cost directly tied to sold goods',
                  ]}
                  avoid={[
                    'General postage',
                    'Office deliveries',
                    'Travel expenses',
                  ]}
                />
              ),
            },
            {
              key: 'otherDirectCosts',
              label: 'Other Direct Costs',
              help: (
                <FieldHelpCard
                  summary="Any additional cost directly tied to producing or selling products."
                  examples={[
                    'Production supplies',
                    'Small manufacturing fees',
                    'Other direct product costs not listed above',
                  ]}
                  avoid={[
                    'Marketing',
                    'Administrative costs',
                    'Anything already entered above',
                  ]}
                />
              ),
            },
          ].map(({ key, label, help }) => {
            const path = `cogs.${key}`;
            return (
            <FormField key={key} label={label} htmlFor={path} required help={help} error={errors[path]}>
              <CurrencyInput
                id={path}
                inputRef={registerFieldRef(path)}
                value={(form.cogs as any)?.[key]}
                placeholder={CURRENCY_INPUT_PLACEHOLDER}
                withDollarPrefix
                onValueChange={(value) => updateForm(path, value)}
              />
            </FormField>
          )})}
        </div>
      </section>
      ) : null}

      {activeStepIndex === 3 ? (
      <section className={sectionCardClassName}>
        {stepTabs}
        <div className="mb-6 flex flex-wrap items-start gap-3">
          <div className="flex min-w-0 flex-1 items-start">
            <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">💸</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Operating Expenses</h2>
              <p className="mt-1 text-sm text-slate-600">
                Everyday costs required to run your business.
              </p>
            </div>
          </div>
          <div className="rounded-full bg-red-50 px-3 py-1">
            <span className="text-sm font-semibold text-red-700">Total Operating Expenses: ${totalOperatingExpenses.toLocaleString()}</span>
          </div>
        </div>
        <div className="mb-6 space-y-3">
          <HelperBanner
            title="Tip:"
            body="If you do not track your finances in these exact categories, use your best estimate based on bank statements or accounting software."
            tone="blue"
          />
          <HelperBanner
            title="Use this date range:"
            body={expensesPeriodGuidance}
            tone="amber"
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              key: 'payrollContractorPayments',
              label: 'Payroll and Contractor Payments',
              help: (
                <FieldHelpCard
                  summary="Employee wages, contractor payments, and payroll-related costs."
                  examples={[
                    'Employee payroll',
                    'Contractor payments',
                    'Payroll taxes or related payroll costs',
                  ]}
                  avoid={[
                    'Owner draws',
                    'Product labor already counted in COGS',
                    'Loan payments',
                  ]}
                />
              ),
            },
            {
              key: 'rentFacilityCosts',
              label: 'Rent or Facility Costs',
              help: (
                <FieldHelpCard
                  summary="What the business paid to use office, retail, warehouse, or work space."
                  examples={[
                    'Office rent',
                    'Warehouse rent',
                    'Coworking or facility fees',
                  ]}
                  avoid={[
                    'Utilities',
                    'Mortgage principal',
                    'Repairs already tracked elsewhere',
                  ]}
                />
              ),
            },
            {
              key: 'utilitiesInternet',
              label: 'Utilities and Internet',
              help: (
                <FieldHelpCard
                  summary="Routine service costs needed to keep the business operating."
                  examples={[
                    'Electricity and water',
                    'Internet and phone service',
                    'Gas or trash service',
                  ]}
                  avoid={[
                    'Rent',
                    'Equipment purchases',
                    'Travel costs',
                  ]}
                />
              ),
            },
            {
              key: 'marketingAdvertising',
              label: 'Marketing and Advertising',
              help: (
                <FieldHelpCard
                  summary="Money spent to promote the business and attract customers."
                  examples={[
                    'Online ads',
                    'Social media promotions',
                    'Printed flyers or sponsorships',
                  ]}
                  avoid={[
                    'Sales discounts',
                    'Software tools',
                    'General payroll',
                  ]}
                />
              ),
            },
            {
              key: 'softwareSubscriptions',
              label: 'Software and Subscriptions',
              help: (
                <FieldHelpCard
                  summary="Business software, SaaS tools, and recurring subscriptions used to run the company."
                  examples={[
                    'Accounting software',
                    'CRM subscriptions',
                    'Project management or business apps',
                  ]}
                  avoid={[
                    'Website ad spend',
                    'Hardware purchases',
                    'Personal subscriptions',
                  ]}
                />
              ),
            },
            {
              key: 'professionalServices',
              label: 'Professional Services',
              help: (
                <FieldHelpCard
                  summary="Outside experts paid to support the business."
                  examples={[
                    'Legal fees',
                    'Accounting fees',
                    'Consulting fees',
                  ]}
                  avoid={[
                    'Internal payroll',
                    'Product labor already counted in COGS',
                    'Marketing agencies if tracked under marketing',
                  ]}
                />
              ),
            },
            {
              key: 'insurance',
              label: 'Insurance',
              help: (
                <FieldHelpCard
                  summary="Premiums paid for business insurance coverage."
                  examples={[
                    'General liability insurance',
                    'Commercial property insurance',
                    'Workers compensation or business auto insurance',
                  ]}
                  avoid={[
                    'Personal insurance',
                    'Loan protection products',
                    'Taxes or license fees',
                  ]}
                />
              ),
            },
            {
              key: 'officeAdministrative',
              label: 'Office and Administrative',
              help: (
                <FieldHelpCard
                  summary="General office and back-office costs that keep the business organized."
                  examples={[
                    'Office supplies',
                    'Bank fees',
                    'Postage, dues, or admin expenses',
                  ]}
                  avoid={[
                    'Payroll',
                    'Marketing',
                    'Interest expense',
                  ]}
                />
              ),
            },
            {
              key: 'vehicleTravel',
              label: 'Vehicle and Travel',
              help: (
                <FieldHelpCard
                  summary="Business driving, travel, and transportation costs."
                  examples={[
                    'Fuel for business vehicles',
                    'Hotels or airfare for business trips',
                    'Mileage or vehicle maintenance if tracked here',
                  ]}
                  avoid={[
                    'Personal travel',
                    'Vehicle purchases',
                    'Loan principal on vehicles',
                  ]}
                />
              ),
            },
            {
              key: 'otherOperatingExpenses',
              label: 'Other Operating Expenses',
              help: (
                <FieldHelpCard
                  summary="Anything that does not clearly fit in the categories above."
                  examples={[
                    'Miscellaneous operating costs',
                    'Small recurring business expenses',
                    'Depreciation if you want to include it in this simplified bucket',
                  ]}
                  avoid={[
                    'Anything already entered above',
                    'Interest expense',
                    'Owner draws or loan proceeds',
                  ]}
                />
              ),
            },
          ].map(({ key, label, help }) => {
            const path = `operatingExpenses.${key}`;
            return (
            <FormField key={key} label={label} htmlFor={path} required help={help} error={errors[path]}>
              <CurrencyInput
                id={path}
                inputRef={registerFieldRef(path)}
                value={(form.operatingExpenses as any)?.[key]}
                placeholder={CURRENCY_INPUT_PLACEHOLDER}
                withDollarPrefix
                onValueChange={(value) => updateForm(path, value)}
              />
            </FormField>
          )})}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Interest Expense</h3>
              <p className="mt-1 text-sm text-slate-600">Enter the interest portion paid on business debt during this period. Enter 0 if there was none.</p>
            </div>
            <div className="rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-700">
              Net Profit: ${netProfit.toLocaleString()}
            </div>
          </div>
          <FormField
            label="Interest Expense"
            htmlFor="interestExpense"
            required
            error={errors['interestExpense']}
            help={
              <FieldHelpCard
                summary="Enter 0 if your business had no borrowing costs during the selected period."
                examples={[
                  'Interest on term loans',
                  'Interest on lines of credit',
                  'Business credit card interest',
                ]}
                avoid={[
                  'Principal payments',
                  'New loan proceeds',
                  'Owner contributions',
                ]}
              />
            }
          >
            <CurrencyInput
              id="interestExpense"
              inputRef={registerFieldRef('interestExpense')}
              value={form.interestExpense}
              placeholder={CURRENCY_INPUT_PLACEHOLDER}
              withDollarPrefix
              onValueChange={(value) => updateForm('interestExpense', value)}
            />
          </FormField>
        </div>
      </section>
      ) : null}

      {activeStepIndex === 4 ? (
      <section className={sectionCardClassName}>
        {stepTabs}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Review & Generate</h2>
          <div className="text-right">
            <div className="text-sm text-gray-600">Net Profit</div>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(netProfit).toLocaleString()} {netProfit < 0 && '(Loss)'}
            </div>
          </div>
        </div>
        <p className="mb-6 text-sm text-slate-600">
          Review the totals and live preview below to make sure everything looks accurate before generating your PDF.
        </p>
        <div className="rounded-xl border border-slate-200 bg-slate-100 p-2 sm:p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Live PDF Preview</p>
              <p className="text-xs text-slate-600">This is the lender-facing income statement generated from your answers and calculations.</p>
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
            <IncomeStatementSvgTemplate data={form} />
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              ref={registerFieldRef('previewConfirmed')}
              id="previewConfirmed"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              checked={previewConfirmed}
              onChange={(event) => {
                setPreviewConfirmed(event.target.checked);
                setLocalMessage(null);
                setErrors((prev) => {
                  if (!prev.previewConfirmed) return prev;
                  const next = { ...prev };
                  delete next.previewConfirmed;
                  return next;
                });
              }}
            />
            <span>I have reviewed this preview and confirm everything looks accurate before generating the PDF.</span>
          </label>
          {errors.previewConfirmed ? (
            <p className="mt-2 text-xs text-red-600">{errors.previewConfirmed}</p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
          <p className={`text-sm font-semibold ${reviewReadyForPdf ? 'text-emerald-700' : 'text-amber-700'}`}>
            {reviewReadyForPdf ? 'Preview confirmed. Generate PDF when ready.' : 'Review the preview and confirm accuracy to enable Generate PDF.'}
          </p>
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
        </div>
      </section>
      ) : null}

      <section className={`${sectionCardClassName} sticky bottom-0 z-30 border-t-2 border-slate-200 bg-white/95 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur`}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-600">Changes save automatically as you type. No manual save needed.</p>
            <div className={`text-sm font-semibold ${allSectionsComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
              {allSectionsComplete ? 'All fields are entered. Review the preview and confirm accuracy to finish.' : 'Complete every field on this page before continuing.'}
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
              {canGoNext ? (
                <button
                  type="button"
                  onClick={handleContinueStep}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Continue
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>
      {loading ? <PdfGenerationOverlay templateLabel="income statement" /> : null}
    </TemplatePageShell>
  );
}
