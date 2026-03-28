'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { ZodError } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/supabase/helpers/client';
import type { BusinessDebtSummaryData } from '@/lib/templates/types';
import { BusinessDebtSummarySchema } from '@/lib/templates/validate';
import { Input } from '@/app/(components)/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/(components)/ui/dialog';
import CurrencyInput from '@/app/(components)/templates/shared/CurrencyInput';
import FormField from '@/app/(components)/templates/shared/FormField';
import PdfGenerationOverlay from '@/app/(components)/templates/shared/PdfGenerationOverlay';
import TemplatePageShell from '@/app/(components)/templates/shared/TemplatePageShell';
import BusinessDebtSummarySvgTemplate from '@/app/(components)/templates/BusinessDebtSummarySvgTemplate';
import { checkUserTemplateAccess } from '@/lib/templates/access';
import { getBusinessDebtSummaryProgress } from '@/lib/templates/business-debt-summary-progress';
import { getTemplateSharedProfile, upsertTemplateSharedProfile } from '@/lib/templates/profile';

type BusinessDebtCategoryId = 'credit_cards' | 'line_of_credit' | 'real_estate' | 'term_loans' | 'vehicle_equipment' | 'other_debt';

type BusinessDebtCategory = {
  id: BusinessDebtCategoryId;
  label: string;
  question: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  balanceLabel: string;
  balancePlaceholder: string;
  monthlyLabel: string;
  monthlyPlaceholder: string;
  limitLabel?: string;
  limitPlaceholder?: string;
};

const BUSINESS_DEBT_CATEGORIES: BusinessDebtCategory[] = [
  {
    id: 'credit_cards',
    label: 'Credit Cards',
    question: 'How many open business credit cards does your business have?',
    descriptionLabel: 'Card Name / Issuer',
    descriptionPlaceholder: 'Amex Business Gold - Main Ops',
    balanceLabel: 'Current Balance',
    balancePlaceholder: '2,150',
    monthlyLabel: 'Monthly Payment',
    monthlyPlaceholder: '95',
    limitLabel: 'Credit Limit',
    limitPlaceholder: '9000',
  },
  {
    id: 'line_of_credit',
    label: 'Line of Credit',
    question: 'How many active business lines of credit does your business have?',
    descriptionLabel: 'Lender / LOC Description',
    descriptionPlaceholder: 'Operating LOC - Regional Bank',
    balanceLabel: 'Current Drawn Balance',
    balancePlaceholder: '7800',
    monthlyLabel: 'Monthly Payment',
    monthlyPlaceholder: '210',
    limitLabel: 'Credit Limit',
    limitPlaceholder: '25000',
  },
  {
    id: 'real_estate',
    label: 'Real Estate',
    question: 'How many business real estate loans does your business have?',
    descriptionLabel: 'Property / Lender Description',
    descriptionPlaceholder: 'Warehouse mortgage - First National',
    balanceLabel: 'Current Balance',
    balancePlaceholder: '410000',
    monthlyLabel: 'Monthly Payment',
    monthlyPlaceholder: '2850',
  },
  {
    id: 'vehicle_equipment',
    label: 'Vehicle / Equipment',
    question: 'How many business vehicle or equipment loans does your business have?',
    descriptionLabel: 'Vehicle / Equipment Description',
    descriptionPlaceholder: '2023 Ford Transit van loan',
    balanceLabel: 'Current Balance',
    balancePlaceholder: '18200',
    monthlyLabel: 'Monthly Payment',
    monthlyPlaceholder: '460',
  },
  {
    id: 'term_loans',
    label: 'Term Loans',
    question:
      'How many business term loans does your business have? Include fixed-payment loans such as working capital, expansion, consolidation, or SBA 7(a) term loans.',
    descriptionLabel: 'Loan / Lender Description',
    descriptionPlaceholder: 'Working capital term loan - Lender name',
    balanceLabel: 'Current Balance',
    balancePlaceholder: '64000',
    monthlyLabel: 'Monthly Payment',
    monthlyPlaceholder: '1420',
  },
  {
    id: 'other_debt',
    label: 'Other Business Debts',
    question: 'You’re almost done! Let’s capture anything not already included.',
    descriptionLabel: 'Debt Description',
    descriptionPlaceholder: 'Merchant cash advance - Vendor name',
    balanceLabel: 'Current Balance',
    balancePlaceholder: '12000',
    monthlyLabel: 'Monthly Payment',
    monthlyPlaceholder: '340',
  },
];

const COUNT_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const OTHER_BUSINESS_DEBT_TYPES = [
  {
    key: 'merchantCashAdvance',
    label: 'Merchant Cash Advance',
    subtitle: 'Cash you received now and repay from daily or weekly business sales.',
    examples: [
      'Example: A company gave you money and now takes a % of your daily card sales.',
      'Example: A fixed ACH amount is pulled from your bank account every week.',
    ],
  },
  {
    key: 'taxPaymentPlan',
    label: 'Tax Payment Plan (IRS or State)',
    subtitle: 'A monthly payment plan for taxes your business still owes.',
    examples: [
      'Example: You owe IRS taxes and are paying them monthly.',
      'Example: You owe state sales/payroll taxes and are on a payment plan.',
    ],
  },
  {
    key: 'ownerShareholderLoan',
    label: 'Owner or Shareholder Loan Payable',
    subtitle: 'Money you or another owner put into the business that the business must pay back.',
    examples: [
      'Example: You covered payroll with personal funds and the business owes you back.',
      'Example: A partner loaned the business money that is being repaid over time.',
    ],
  },
  {
    key: 'otherBusinessLiability',
    label: 'Any Other Business Debt Not Listed',
    subtitle: 'Any other required business debt payment not listed above.',
    examples: [
      'Example: Court judgment or legal settlement paid monthly.',
      'Example: Past-due vendor bill on a payment schedule.',
      'Example: Any contract debt with required monthly payments.',
    ],
  },
] as const;
type OtherBusinessDebtTypeKey = (typeof OTHER_BUSINESS_DEBT_TYPES)[number]['key'];
type BusinessDebtUiState = {
  selectedCounts?: Partial<Record<BusinessDebtCategoryId, number>>;
  otherBusinessDebtSelections?: Record<OtherBusinessDebtTypeKey, 'unset' | 'yes' | 'no'>;
  activeCategoryIndex?: number;
};

function sanitizeOtherBusinessDebtSelections(
  selections?: Record<OtherBusinessDebtTypeKey, 'unset' | 'yes' | 'no'>,
): Record<OtherBusinessDebtTypeKey, 'yes' | 'no'> {
  return {
    merchantCashAdvance: selections?.merchantCashAdvance === 'yes' ? 'yes' : 'no',
    taxPaymentPlan: selections?.taxPaymentPlan === 'yes' ? 'yes' : 'no',
    ownerShareholderLoan: selections?.ownerShareholderLoan === 'yes' ? 'yes' : 'no',
    otherBusinessLiability: selections?.otherBusinessLiability === 'yes' ? 'yes' : 'no',
  };
}

const formatCurrency = (value: number) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatDisplayDate = (raw: string) => {
  if (!raw) return 'No date selected';
  const parts = raw.split('-');
  if (parts.length !== 3) return raw;
  const [year, month, day] = parts;
  if (!year || !month || !day) return raw;
  return `${month.padStart(2, '0')}-${day.padStart(2, '0')}-${year}`;
};

const createBusinessDebt = (category: BusinessDebtCategoryId): BusinessDebtSummaryData['debts'][number] => ({
  category,
  creditor: '',
  accountNumber: '',
  originalAmount: 0,
  currentBalance: 0,
  monthlyPayment: 0,
  creditLimit: undefined,
  interestRate: undefined,
  maturityDate: '',
  collateral: '',
  personalGuarantee: false,
});

export default function BusinessDebtSummaryFormPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedSubmissionId = searchParams.get('submissionId');
  const loanRequestId = searchParams.get('loanRequestId');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [selectedCounts, setSelectedCounts] = useState<Partial<Record<BusinessDebtCategoryId, number>>>({});
  const [otherBusinessDebtSelections, setOtherBusinessDebtSelections] = useState<Record<OtherBusinessDebtTypeKey, 'yes' | 'no'>>({
    merchantCashAdvance: 'no',
    taxPaymentPlan: 'no',
    ownerShareholderLoan: 'no',
    otherBusinessLiability: 'no',
  });
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [businessInfoCollapsed, setBusinessInfoCollapsed] = useState(false);
  const [inlineCategoryNotice, setInlineCategoryNotice] = useState<string | null>(null);
  const [showCountRequiredHint, setShowCountRequiredHint] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewConfirmed, setPreviewConfirmed] = useState(false);

  const [form, setForm] = useState<BusinessDebtSummaryData>({
    asOfDate: new Date().toISOString().split('T')[0] as string,
    businessInfo: { name: '' },
    debts: [],
  });

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

      const access = await checkUserTemplateAccess(sessionUser.id, 'business_debt_summary');
      if (!access.allowed) {
        router.replace(access.redirectUrl || '/services/templates-bundle');
        return;
      }

      if (isActive) {
        const { data: requestedSubmission } = requestedSubmissionId
          ? await supabase
              .from('template_submissions')
              .select('id,form_data,pdf_url')
              .eq('user_id', sessionUser.id)
              .eq('template_type', 'business_debt_summary')
              .eq('id', requestedSubmissionId)
              .is('archived_at', null)
              .maybeSingle()
          : { data: null as { id: string; form_data: unknown; pdf_url: string | null } | null };

        let existingSubmission = requestedSubmission;
        if (!existingSubmission) {
          const { data: latestSubmission } = await supabase
            .from('template_submissions')
            .select('id,form_data,pdf_url')
            .eq('user_id', sessionUser.id)
            .eq('template_type', 'business_debt_summary')
            .is('archived_at', null)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          existingSubmission = latestSubmission;
        }

        const profile = await getTemplateSharedProfile(sessionUser.id);

        if (existingSubmission) {
          const submissionData = (existingSubmission.form_data ?? {}) as BusinessDebtSummaryData & { uiState?: BusinessDebtUiState };
          const savedForm: BusinessDebtSummaryData = {
            asOfDate: submissionData.asOfDate || new Date().toISOString().split('T')[0] || '',
            businessInfo: {
              name: submissionData.businessInfo?.name || profile.businessName || profile.businessLegalName || '',
              ein: submissionData.businessInfo?.ein,
              address: submissionData.businessInfo?.address,
            },
            debts: submissionData.debts ?? [],
            notes: submissionData.notes,
          };

          setForm(savedForm);
          setSubmissionId(existingSubmission.id);
          setPdfUrl(existingSubmission.pdf_url);

          const uiState = submissionData.uiState;
          const derivedCounts = savedForm.debts.reduce((acc, debt) => {
            const category = (debt.category || 'other_debt') as BusinessDebtCategoryId;
            acc[category] = (acc[category] || 0) + 1;
            return acc;
          }, {} as Partial<Record<BusinessDebtCategoryId, number>>);

          if (uiState?.selectedCounts) setSelectedCounts(uiState.selectedCounts);
          else setSelectedCounts(derivedCounts);
          setOtherBusinessDebtSelections(sanitizeOtherBusinessDebtSelections(uiState?.otherBusinessDebtSelections));
          if (typeof uiState?.activeCategoryIndex === 'number') setActiveCategoryIndex(uiState.activeCategoryIndex);
        } else if (profile.businessName || profile.businessLegalName) {
          setForm((prev) => ({
            ...prev,
            businessInfo: {
              ...prev.businessInfo,
              name: prev.businessInfo.name || profile.businessName || profile.businessLegalName || '',
            },
          }));
        }

        setUser(sessionUser);
      }
    };

    checkAuth().finally(() => {
      if (isActive) {
        setIsAuthChecking(false);
      }
    });

    return () => {
      isActive = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [pathname, requestedSubmissionId, router]);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const businessInfoCardRef = useRef<HTMLElement | null>(null);
  const businessInfoSectionRef = useRef<HTMLDivElement | null>(null);
  const businessNameInputRef = useRef<HTMLInputElement | null>(null);
  const debtSectionRef = useRef<HTMLElement | null>(null);
  const queueSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveDraft, 1200);
  };

  const saveDraft = async (): Promise<string | null> => {
    if (!user) return submissionId;
    const formDataToSave: BusinessDebtSummaryData & { uiState: BusinessDebtUiState } = {
      ...form,
      uiState: {
        selectedCounts,
        otherBusinessDebtSelections,
        activeCategoryIndex,
      },
    };
    setSaveStatus('saving');
    try {
      if (!submissionId) {
        const { data, error } = await supabase
          .from('template_submissions')
          .insert({
            user_id: user.id,
            template_type: 'business_debt_summary',
            form_data: formDataToSave,
          })
          .select('id,pdf_url')
          .single();
        if (error) throw error;
        if (data) {
          setSubmissionId(data.id);
          setPdfUrl(data.pdf_url);
          const params = new URLSearchParams(searchParams.toString());
          params.set('submissionId', data.id);
          router.replace(`${pathname}?${params.toString()}`);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
          return data.id;
        }
      } else {
        const { error } = await supabase
          .from('template_submissions')
          .update({ form_data: formDataToSave })
          .eq('id', submissionId)
          .eq('user_id', user.id);
        if (error) throw error;
      }
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
    try {
      BusinessDebtSummarySchema.parse(form);
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
    if (!allCategoriesComplete) {
      const firstIncompleteIndex = BUSINESS_DEBT_CATEGORIES.findIndex((category) => !isCategoryComplete(category));
      if (firstIncompleteIndex >= 0) {
        setActiveCategoryIndex(firstIncompleteIndex);
        requestAnimationFrame(() => {
          debtSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
      setInlineCategoryNotice('Complete this category first, then continue. We moved you to the next required section.');
      return;
    }
    setInlineCategoryNotice(null);
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          submissionId: resolvedSubmissionId,
          templateType: 'business_debt_summary',
          accessToken: session?.access_token ?? null,
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
      }
      router.push('/templates');
    } catch (error: unknown) {
      console.error('PDF generation error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate PDF: ${message}`);
    } finally {
      setLoading(false);
    }
  };
  const openSubmitPreview = () => {
    if (!form.businessInfo.name.trim()) {
      setErrors((prev) => ({ ...prev, 'businessInfo.name': 'Name is required' }));
      setBusinessInfoCollapsed(false);
      requestAnimationFrame(() => {
        businessInfoCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        requestAnimationFrame(() => {
          businessNameInputRef.current?.focus();
        });
      });
      return;
    }
    if (!allCategoriesComplete) {
      const firstIncompleteIndex = BUSINESS_DEBT_CATEGORIES.findIndex((category) => !isCategoryComplete(category));
      if (firstIncompleteIndex >= 0) {
        setActiveCategoryIndex(firstIncompleteIndex);
        requestAnimationFrame(() => {
          debtSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
      setInlineCategoryNotice('Complete this category first, then continue. We moved you to the next required section.');
      return;
    }
    setInlineCategoryNotice(null);
    setPreviewConfirmed(false);
    setPreviewOpen(true);
  };

  const updateForm = (path: string, value: unknown) => {
    const keys = path.split('.');
    setForm((prev) => {
      const updated = { ...prev };
      let current: Record<string, unknown> = updated as unknown as Record<string, unknown>;
      for (let i = 0; i < keys.length - 1; i += 1) {
        const key = keys[i];
        if (key) {
          const nextValue = current[key];
          const nextObject: Record<string, unknown> =
            typeof nextValue === 'object' && nextValue !== null ? { ...(nextValue as Record<string, unknown>) } : {};
          current[key] = nextObject;
          current = nextObject;
        }
      }
      const lastKey = keys[keys.length - 1];
      if (lastKey) current[lastKey] = value;
      return updated;
    });
    queueSave();
  };

  const setCategoryCount = (categoryId: BusinessDebtCategoryId, count: number) => {
    const boundedCount = Math.max(0, Math.min(10, count));
    setSelectedCounts((prev) => ({ ...prev, [categoryId]: boundedCount }));

    setForm((prev) => {
      const existingForCategory = prev.debts.filter((debt) => debt.category === categoryId);
      const keepDebts = prev.debts.filter((debt) => debt.category !== categoryId);

      const nextForCategory = Array.from({ length: boundedCount }, (_, index) => {
        const existing = existingForCategory[index];
        return existing ?? createBusinessDebt(categoryId);
      });

      return {
        ...prev,
        debts: [...keepDebts, ...nextForCategory],
      };
    });

    queueSave();
  };

  const syncOtherBusinessDebtState = (nextSelections: Record<OtherBusinessDebtTypeKey, 'yes' | 'no'>) => {
    const selectedLabels = OTHER_BUSINESS_DEBT_TYPES.filter((type) => nextSelections[type.key] === 'yes').map((type) => type.label);
    setSelectedCounts((prev) => ({ ...prev, other_debt: selectedLabels.length }));

    setForm((prev) => {
      const existingForCategory = prev.debts.filter((debt) => debt.category === 'other_debt');
      const keepDebts = prev.debts.filter((debt) => debt.category !== 'other_debt');

      const nextForCategory: BusinessDebtSummaryData['debts'] = selectedLabels.map((label, index) => {
        const existing = existingForCategory[index] ?? createBusinessDebt('other_debt');
        return {
          ...existing,
          creditor: existing.creditor?.trim() ? existing.creditor : label,
        };
      });

      return {
        ...prev,
        debts: [...keepDebts, ...nextForCategory],
      };
    });

    queueSave();
  };

  const setOtherBusinessDebtSelection = (key: OtherBusinessDebtTypeKey, value: 'yes' | 'no') => {
    setOtherBusinessDebtSelections((prev) => {
      const next = { ...prev, [key]: value };
      syncOtherBusinessDebtState(next);
      return next;
    });
  };

  const updateDebt = (categoryId: BusinessDebtCategoryId, indexWithinCategory: number, patch: Partial<BusinessDebtSummaryData['debts'][number]>) => {
    setForm((prev) => {
      let seen = -1;
      const debts = prev.debts.map((debt) => {
        if (debt.category !== categoryId) return debt;
        seen += 1;
        if (seen !== indexWithinCategory) return debt;
        const merged = { ...debt, ...patch };
        if (patch.currentBalance !== undefined && patch.originalAmount === undefined) {
          merged.originalAmount = patch.currentBalance;
        }
        return merged;
      });
      return { ...prev, debts };
    });
    queueSave();
  };

  const removeDebtEntry = (categoryId: BusinessDebtCategoryId, indexWithinCategory: number) => {
    setForm((prev) => {
      let seen = -1;
      const debts = prev.debts.filter((debt) => {
        if (debt.category !== categoryId) return true;
        seen += 1;
        return seen !== indexWithinCategory;
      });
      return { ...prev, debts };
    });

    setSelectedCounts((prev) => {
      const current = prev[categoryId] ?? 0;
      return { ...prev, [categoryId]: Math.max(0, current - 1) };
    });

    queueSave();
  };

  const addDebtEntry = (categoryId: BusinessDebtCategoryId) => {
    if (categoryId === 'other_debt') return;

    setForm((prev) => ({
      ...prev,
      debts: [...prev.debts, createBusinessDebt(categoryId)],
    }));

    setSelectedCounts((prev) => {
      const current = prev[categoryId] ?? 0;
      return { ...prev, [categoryId]: Math.min(10, current + 1) };
    });

    queueSave();
  };

  const debtsByCategory = useMemo(() => {
    const grouped: Record<BusinessDebtCategoryId, BusinessDebtSummaryData['debts']> = {
      credit_cards: [],
      line_of_credit: [],
      real_estate: [],
      term_loans: [],
      vehicle_equipment: [],
      other_debt: [],
    };

    for (const debt of form.debts) {
      const category = debt.category ?? 'other_debt';
      grouped[category].push(debt);
    }

    return grouped;
  }, [form.debts]);

  const isDebtFilled = (category: BusinessDebtCategory, debt: BusinessDebtSummaryData['debts'][number]) => {
    if (!debt.creditor?.trim()) return false;
    if ((debt.currentBalance ?? 0) < 0 || (debt.monthlyPayment ?? 0) < 0) return false;
    if ((category.id === 'credit_cards' || category.id === 'line_of_credit') && (debt.creditLimit ?? 0) <= 0) return false;
    return true;
  };

  const isCategoryComplete = (category: BusinessDebtCategory) => {
    if (category.id === 'other_debt') {
      const effectiveCount =
        selectedCounts[category.id] ??
        OTHER_BUSINESS_DEBT_TYPES.filter((type) => otherBusinessDebtSelections[type.key] === 'yes').length;
      if (effectiveCount === 0) return true;
      const debts = debtsByCategory[category.id];
      if (debts.length !== effectiveCount) return false;
      return debts.every((debt) => isDebtFilled(category, debt));
    }
    const count = selectedCounts[category.id];
    if (count === undefined) return false;
    if (count === 0) return true;
    const debts = debtsByCategory[category.id];
    if (debts.length !== count) return false;
    return debts.every((debt) => isDebtFilled(category, debt));
  };

  const currentCategory = BUSINESS_DEBT_CATEGORIES[activeCategoryIndex];
  const currentCategoryDebts = currentCategory ? debtsByCategory[currentCategory.id] : [];
  const currentCount = currentCategory ? selectedCounts[currentCategory.id] : undefined;
  const canContinueCurrent = currentCategory ? isCategoryComplete(currentCategory) : false;
  const allCategoriesComplete = BUSINESS_DEBT_CATEGORIES.every((category) => isCategoryComplete(category));
  const { completedCategoryCount, totalCategories, percent: completionPercent } = useMemo(
    () =>
      getBusinessDebtSummaryProgress({
        ...form,
        uiState: {
          selectedCounts,
          otherBusinessDebtSelections,
          activeCategoryIndex,
        },
      }),
    [activeCategoryIndex, form, otherBusinessDebtSelections, selectedCounts],
  );
  const handleContinueCategory = () => {
    if (!currentCategory) return;
    if (currentCount === undefined) {
      setShowCountRequiredHint(true);
      return;
    }
    if (!canContinueCurrent) {
      setInlineCategoryNotice('Complete this category first, then continue.');
      return;
    }
    setShowCountRequiredHint(false);
    setInlineCategoryNotice(null);
    setActiveCategoryIndex((prev) => Math.min(BUSINESS_DEBT_CATEGORIES.length - 1, prev + 1));
    requestAnimationFrame(() => {
      if (!debtSectionRef.current) return;
      const top = debtSectionRef.current.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    });
  };

  const handleBackCategory = () => {
    setActiveCategoryIndex((prev) => Math.max(0, prev - 1));
    requestAnimationFrame(() => {
      if (!debtSectionRef.current) return;
      const top = debtSectionRef.current.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    });
  };

  const categorySummary = BUSINESS_DEBT_CATEGORIES.map((category) => {
    const debts = debtsByCategory[category.id] ?? [];
    const monthlyPayment = debts.reduce((sum, debt) => sum + (debt.monthlyPayment || 0), 0);
    const yearlyPayment = monthlyPayment * 12;
    const totalBalance = debts.reduce((sum, debt) => sum + (debt.currentBalance || 0), 0);
    const totalLimit = debts.reduce((sum, debt) => sum + (debt.creditLimit || 0), 0);
    const utilization = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : null;

    return {
      category,
      accounts: debts.length,
      monthlyPayment,
      yearlyPayment,
      totalBalance,
      totalLimit,
      utilization,
    };
  });

  const totals = categorySummary.reduce(
    (acc, row) => {
      acc.accounts += row.accounts;
      acc.monthlyPayment += row.monthlyPayment;
      acc.yearlyPayment += row.yearlyPayment;
      acc.totalBalance += row.totalBalance;
      acc.totalLimit += row.totalLimit;
      return acc;
    },
    { accounts: 0, monthlyPayment: 0, yearlyPayment: 0, totalBalance: 0, totalLimit: 0 },
  );

  const revolvingTotals = categorySummary
    .filter((row) => row.category.id === 'credit_cards' || row.category.id === 'line_of_credit')
    .reduce(
      (acc, row) => {
        acc.totalBalance += row.totalBalance;
        acc.totalLimit += row.totalLimit;
        return acc;
      },
      { totalBalance: 0, totalLimit: 0 },
    );
  const overallUtilization = revolvingTotals.totalLimit > 0 ? (revolvingTotals.totalBalance / revolvingTotals.totalLimit) * 100 : null;
  const isBusinessInfoComplete = form.businessInfo.name.trim().length > 0 && Boolean(form.asOfDate);
  const handleBusinessInfoSectionBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!isBusinessInfoComplete) return;
    const nextFocused = event.relatedTarget as Node | null;
    if (nextFocused && event.currentTarget.contains(nextFocused)) return;
    setBusinessInfoCollapsed(true);
  };
  const handleEditBusinessInfo = () => {
    setBusinessInfoCollapsed(false);
    requestAnimationFrame(() => {
      businessNameInputRef.current?.focus();
      businessNameInputRef.current?.select();
    });
  };
  const sectionCardClassName = 'rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-5';
  const statusTone = saveStatus === 'saving' ? 'saving' : saveStatus === 'saved' ? 'saved' : saveStatus === 'error' ? 'error' : 'neutral';
  const statusLabel =
    saveStatus === 'saving'
      ? 'Saving changes...'
      : saveStatus === 'saved'
      ? 'All changes saved'
      : saveStatus === 'error'
      ? 'Save failed'
      : 'Ready to edit';

  if (isAuthChecking || !user) return <div className="mx-auto max-w-7xl px-4 py-8">Loading...</div>;

  return (
    <TemplatePageShell
      title="Business Debt Summary"
      subtitle=""
      description="Complete each section to prepare a lender-ready business debt summary."
      metricLabel="Total Monthly Debt Service"
      metricValue={`$${formatCurrency(totals.monthlyPayment)}`}
      metricSubvalue={`${totals.accounts} accounts${overallUtilization !== null ? ` • ${overallUtilization.toFixed(1)}% utilization` : ''}`}
      statusLabel={statusLabel}
      statusTone={statusTone}
      hideStatusOnMobile
      hideMetricOnMobile
      fullWidthBelowHero={
        <section className="border-y border-sky-300/40 bg-gradient-to-r from-cyan-100/90 via-white to-emerald-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
            <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]" />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="truncate text-xs font-semibold text-slate-900 sm:text-sm">
                  Form completion: {completedCategoryCount}/{totalCategories} categories complete
                </div>
                <div className="text-xs font-bold text-slate-900 sm:text-sm">{completionPercent}%</div>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-slate-300/70">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#0284c7_0%,#14b8a6_50%,#16a34a_100%)] shadow-[0_0_12px_rgba(20,184,166,0.35)] transition-all duration-500 ease-out"
                  style={{ width: `${completionPercent}%` }}
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white/35 to-transparent" />
              </div>
            </div>
          </div>
        </section>
      }
    >

      <section ref={businessInfoCardRef} className={`${sectionCardClassName} ${businessInfoCollapsed ? '!py-3 sm:!py-3' : ''}`}>
        <div className={`${businessInfoCollapsed ? 'mb-0' : 'mb-4'} flex min-w-0 items-center justify-between gap-3`}>
          <h2 className="flex min-w-0 items-center text-lg font-bold text-gray-900 sm:text-xl">
            <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">👤</div>
            <span className="truncate whitespace-nowrap">Business Information</span>
            {isBusinessInfoComplete && <span className="ml-2 text-base text-emerald-600">✓</span>}
          </h2>
          {businessInfoCollapsed ? (
            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className="text-sm font-semibold text-slate-900">{form.businessInfo.name || 'Name not provided'}</div>
                <div className="text-xs text-slate-600">As of {formatDisplayDate(form.asOfDate || '')}</div>
              </div>
              <button
                type="button"
                onClick={handleEditBusinessInfo}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Edit
              </button>
            </div>
          ) : null}
        </div>
        {businessInfoCollapsed ? (
          <div className="flex min-w-0 items-center justify-between gap-2 pt-1 sm:hidden">
            <div className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">{form.businessInfo.name || 'Name not provided'}</div>
            <div className="shrink-0 whitespace-nowrap text-right text-xs text-slate-600">As of {formatDisplayDate(form.asOfDate || '')}</div>
          </div>
        ) : (
          <div ref={businessInfoSectionRef} onBlur={handleBusinessInfoSectionBlur} className="grid gap-6 md:grid-cols-2">
            <FormField label="Business Name" required help="Your legal business name." error={errors['businessInfo.name']}>
              <Input
                ref={businessNameInputRef}
                type="text"
                placeholder="Enter your legal business name"
                className="w-full"
                value={form.businessInfo.name}
                onChange={(e) => updateForm('businessInfo.name', e.target.value)}
                onBlur={() => {
                  if (!user) return;
                  const nextName = form.businessInfo.name.trim();
                  void upsertTemplateSharedProfile(user.id, { businessName: nextName, businessLegalName: nextName });
                }}
              />
            </FormField>
            <FormField label="As of Date" required help="Date these balances are accurate." error={errors['asOfDate']}>
              <div className="w-fit">
                <Input
                  type="date"
                  className="w-[150px] min-w-[150px]"
                  value={form.asOfDate}
                  onChange={(e) => updateForm('asOfDate', e.target.value)}
                />
              </div>
            </FormField>
          </div>
        )}
      </section>

      <section ref={debtSectionRef} className={sectionCardClassName}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center text-xl font-bold text-gray-900">
            <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">💳</div>
            Business Debts
            {allCategoriesComplete && <span className="ml-2 text-base text-emerald-600">✓</span>}
          </h2>
          <div className="text-sm text-gray-600">Step {activeCategoryIndex + 1} of {BUSINESS_DEBT_CATEGORIES.length}</div>
        </div>
        <p className="mb-4 text-sm text-slate-600">Capture essential debt service fields with one clear category at a time.</p>
        {inlineCategoryNotice && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            {inlineCategoryNotice}
          </div>
        )}

        <div className="mb-4 md:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {BUSINESS_DEBT_CATEGORIES.map((category, index) => {
              const active = index === activeCategoryIndex;
              const done = isCategoryComplete(category);
              return (
                <button
                  key={`mobile-${category.id}`}
                  type="button"
                  onClick={() => {
                    setActiveCategoryIndex(index);
                    setInlineCategoryNotice(null);
                    setShowCountRequiredHint(false);
                  }}
                  className={`flex-none whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : done
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                      : 'border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {done && !active ? '✓ ' : ''}
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6 hidden gap-3 md:grid md:grid-cols-6">
          {BUSINESS_DEBT_CATEGORIES.map((category, index) => {
            const active = index === activeCategoryIndex;
            const done = isCategoryComplete(category);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setActiveCategoryIndex(index);
                  setInlineCategoryNotice(null);
                  setShowCountRequiredHint(false);
                }}
                className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                  active
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : done
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold uppercase tracking-wide">{active ? 'Current' : done ? 'Complete' : 'Pending'}</div>
                <div className="text-sm font-semibold">{category.label}</div>
              </button>
            );
          })}
        </div>

        {currentCategory && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">{currentCategory.label}</h3>
            <p className="mt-1 text-sm text-slate-700">{currentCategory.question}</p>
            {currentCategory.id === 'term_loans' && (
              <p className="mt-1 text-xs font-medium leading-5 text-amber-700">
                Do not include real estate or vehicle/equipment loans already entered.
              </p>
            )}

            {currentCategory.id === 'other_debt' ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">Other Business Debts</div>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Answer each item below. If you select <span className="font-semibold">Yes</span>, we will add it to your debt schedule automatically.
                  If <span className="font-semibold">No</span>, we will leave it out.
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {OTHER_BUSINESS_DEBT_TYPES.map((type) => {
                    const selected = otherBusinessDebtSelections[type.key];
                    return (
                      <div key={type.key} className="rounded-lg border border-slate-200 p-3">
                        <div className="text-sm font-semibold text-slate-900">{type.label}</div>
                        <p className="mt-1 text-xs leading-5 text-slate-700">{type.subtitle}</p>
                        <div className="mt-2 space-y-1">
                          {type.examples.map((example) => (
                            <p key={example} className="text-[11px] leading-5 text-slate-600">
                              {example}
                            </p>
                          ))}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setOtherBusinessDebtSelection(type.key, 'yes')}
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                              selected === 'yes' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setOtherBusinessDebtSelection(type.key, 'no')}
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                              selected === 'no' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
                  {COUNT_OPTIONS.map((count) => {
                    const selected = currentCount === count;
                    return (
                      <button
                        key={`${currentCategory.id}-${count}`}
                        type="button"
                        onClick={() => {
                          setCategoryCount(currentCategory.id, count);
                          setShowCountRequiredHint(false);
                        }}
                        className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold transition ${
                          selected
                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                            : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {count}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {showCountRequiredHint && currentCategory.id !== 'other_debt' && currentCount === undefined && (
              <p className="mt-4 text-sm font-medium text-amber-700">Select a number to continue this category.</p>
            )}

            {currentCount !== undefined && currentCount > 0 && (
              <div className="mt-4 space-y-4">
                {currentCategoryDebts.map((debt, index) => (
                  <div key={`${currentCategory.id}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {currentCategory.label} #{index + 1}
                      </h4>
                      {currentCategory.id !== 'other_debt' ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => addDebtEntry(currentCategory.id)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                            aria-label={`Add ${currentCategory.label} entry`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add entry
                          </button>
                          <button
                            type="button"
                            onClick={() => removeDebtEntry(currentCategory.id, index)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                            aria-label={`Delete ${currentCategory.label} entry ${index + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete entry
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        label={currentCategory.descriptionLabel}
                        required
                        help={
                          currentCategory.id === 'credit_cards'
                            ? 'Keep this short and specific (max 55 characters).'
                            : 'Short identifier so this debt is clear in the summary.'
                        }
                      >
                        <Input
                          type="text"
                          maxLength={currentCategory.id === 'credit_cards' ? 55 : 90}
                          placeholder={currentCategory.descriptionPlaceholder}
                          className="w-full md:max-w-[420px]"
                          value={debt.creditor}
                          onChange={(e) => updateDebt(currentCategory.id, index, { creditor: e.target.value })}
                        />
                      </FormField>
                      <FormField label={currentCategory.balanceLabel} required help="Current amount owed.">
                        <div className="relative w-full md:max-w-[220px]">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">$</span>
                          <CurrencyInput
                            min={0}
                            placeholder="0"
                            className="pl-7"
                            value={debt.currentBalance > 0 ? debt.currentBalance : undefined}
                            onValueChange={(value) =>
                              updateDebt(currentCategory.id, index, {
                                currentBalance: value ?? 0,
                              })
                            }
                          />
                        </div>
                      </FormField>
                      <FormField label={currentCategory.monthlyLabel} required help="Current required monthly payment.">
                        <div className="relative w-full md:max-w-[220px]">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">$</span>
                          <CurrencyInput
                            min={0}
                            placeholder="0"
                            className="pl-7"
                            value={debt.monthlyPayment > 0 ? debt.monthlyPayment : undefined}
                            onValueChange={(value) =>
                              updateDebt(currentCategory.id, index, {
                                monthlyPayment: value ?? 0,
                              })
                            }
                          />
                        </div>
                      </FormField>

                      {currentCategory.limitLabel && (
                        <FormField label={currentCategory.limitLabel} required help="Needed to calculate utilization.">
                          <div className="relative w-full md:max-w-[220px]">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">$</span>
                            <CurrencyInput
                              min={0}
                              allowDecimal={false}
                              placeholder="0"
                              className="pl-7"
                              value={debt.creditLimit && debt.creditLimit > 0 ? debt.creditLimit : undefined}
                              onValueChange={(value) =>
                                updateDebt(currentCategory.id, index, {
                                  creditLimit: value,
                                })
                              }
                            />
                          </div>
                        </FormField>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}
      </section>

      <section className={`${sectionCardClassName} hidden md:block`}>
        <h2 className="mb-6 text-xl font-bold text-gray-900">Debt Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm md:min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-2 py-2">Category</th>
                <th className="hidden px-2 py-2 text-right md:table-cell">Accounts</th>
                <th className="px-2 py-2 text-right">Monthly Payment</th>
                <th className="hidden px-2 py-2 text-right md:table-cell">Yearly Payment</th>
                <th className="px-2 py-2 text-right">Total Balance</th>
                <th className="px-2 py-2 text-right">Total Limit</th>
                <th className="px-2 py-2 text-right">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {categorySummary.map((row) => (
                <tr key={row.category.id} className="border-b border-slate-100">
                  <td className="px-2 py-2 font-medium text-slate-900">{row.category.label}</td>
                  <td className="hidden px-2 py-2 text-right text-slate-700 md:table-cell">{row.accounts}</td>
                  <td className="px-2 py-2 text-right text-slate-700">${formatCurrency(row.monthlyPayment)}</td>
                  <td className="hidden px-2 py-2 text-right text-slate-700 md:table-cell">${formatCurrency(row.yearlyPayment)}</td>
                  <td className="px-2 py-2 text-right text-slate-700">${formatCurrency(row.totalBalance)}</td>
                  <td className="px-2 py-2 text-right text-slate-700">{row.totalLimit > 0 ? `$${formatCurrency(row.totalLimit)}` : '—'}</td>
                  <td className="px-2 py-2 text-right text-slate-700">{row.utilization !== null ? `${row.utilization.toFixed(1)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-300 bg-slate-50 text-sm font-semibold text-slate-900">
                <td className="px-2 py-2">Total</td>
                <td className="hidden px-2 py-2 text-right md:table-cell">{totals.accounts}</td>
                <td className="px-2 py-2 text-right">${formatCurrency(totals.monthlyPayment)}</td>
                <td className="hidden px-2 py-2 text-right md:table-cell">${formatCurrency(totals.yearlyPayment)}</td>
                <td className="px-2 py-2 text-right">${formatCurrency(totals.totalBalance)}</td>
                <td className="px-2 py-2 text-right">{totals.totalLimit > 0 ? `$${formatCurrency(totals.totalLimit)}` : '—'}</td>
                <td className="px-2 py-2 text-right">{overallUtilization !== null ? `${overallUtilization.toFixed(1)}%` : '—'}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <div className="rounded-xl bg-blue-50 p-4 text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">Total Monthly Payment</div>
            <div className="mt-1 text-xl font-bold text-blue-800">${formatCurrency(totals.monthlyPayment)}</div>
          </div>
          <div className="rounded-xl bg-indigo-50 p-4 text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Total Yearly Payment</div>
            <div className="mt-1 text-xl font-bold text-indigo-800">${formatCurrency(totals.yearlyPayment)}</div>
          </div>
          <div className="rounded-xl bg-red-50 p-4 text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-red-700">Total Balance</div>
            <div className="mt-1 text-xl font-bold text-red-800">${formatCurrency(totals.totalBalance)}</div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4 text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Credit Utilization Rate</div>
            <div className="mt-1 text-xl font-bold text-emerald-800">
              {overallUtilization !== null ? `${overallUtilization.toFixed(1)}%` : '—'}
            </div>
          </div>
        </div>
      </section>

      <section className={`${sectionCardClassName} sticky bottom-0 z-30 border-t-2 border-slate-200 bg-white/95 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur`}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-600">
              Changes save automatically as you type. No manual save needed.
            </p>
            <div className={`text-sm font-semibold ${allCategoriesComplete ? 'text-emerald-700' : canContinueCurrent ? 'text-amber-700' : 'text-rose-700'}`}>
              {allCategoriesComplete
                ? 'All categories are complete. Submit when ready.'
                : canContinueCurrent
                ? 'This category is complete. Continue to the next step.'
                : 'Complete the current category to continue.'}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackCategory}
                disabled={activeCategoryIndex === 0}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Back
              </button>
            </div>
            <div className="flex items-center gap-4">
              {pdfUrl && (
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-700 underline hover:text-blue-900">
                  Open PDF
                </a>
              )}
              {activeCategoryIndex < BUSINESS_DEBT_CATEGORIES.length - 1 ? (
                <button
                  type="button"
                  onClick={handleContinueCategory}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Continue
                </button>
              ) : null}
              <button
                onClick={openSubmitPreview}
                className={`rounded-lg px-5 py-2 text-sm font-semibold text-white ${
                  allCategoriesComplete ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-400 hover:bg-slate-500'
                }`}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <Dialog
        open={previewOpen}
        onOpenChange={(nextOpen) => {
          if (loading) return;
          setPreviewOpen(nextOpen);
          if (!nextOpen) {
            setPreviewConfirmed(false);
          }
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Review Your Business Debt Summary</DialogTitle>
            <DialogDescription>
              Confirm this preview matches your information. Check the box below, then generate your PDF.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-slate-200 bg-slate-100 p-2 sm:p-3">
            <div className="mx-auto w-full max-w-[816px] bg-white shadow-lg">
              <BusinessDebtSummarySvgTemplate data={form} />
            </div>
          </div>

          <div className="sticky bottom-0 -mx-4 mt-2 border-t border-slate-200 bg-white px-4 pb-1 pt-3 sm:-mx-6 sm:px-6">
            <div className="flex flex-col items-end gap-2">
              <label className="flex items-start justify-end gap-2 text-right text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                  checked={previewConfirmed}
                  onChange={(event) => setPreviewConfirmed(event.target.checked)}
                />
                <span>I have reviewed this preview and confirm everything looks correct.</span>
              </label>

              <DialogFooter className="w-full flex-row justify-end gap-2 space-x-0">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onGenerate}
                  disabled={!previewConfirmed || loading}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Generating PDF...' : 'Generate PDF'}
                </button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {loading ? <PdfGenerationOverlay templateLabel="business debt summary" /> : null}
    </TemplatePageShell>
  );
}
