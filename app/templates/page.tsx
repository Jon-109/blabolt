'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, BriefcaseBusiness, CircleCheck, UserRound } from 'lucide-react';
import { supabase } from '@/supabase/helpers/client';
import { deriveBalanceSheetDashboardMeta, deriveBalanceSheetTitle } from '@/lib/templates/balance-sheet-labels';
import { getBalanceSheetProgress } from '@/lib/templates/balance-sheet-progress';
import { getBusinessDebtSummaryProgress } from '@/lib/templates/business-debt-summary-progress';
import { deriveIncomeStatementDashboardMeta, deriveIncomeStatementTitle } from '@/lib/templates/income-statement-labels';
import { getIncomeStatementProgress } from '@/lib/templates/income-statement-progress';
import { getPersonalDebtSummaryProgress } from '@/lib/templates/personal-debt-summary-progress';
import { getTemplateServicePagePath } from '@/lib/template-offers';
import type { BalanceSheetData, BusinessDebtSummaryData, IncomeStatementData, PersonalDebtSummaryData, PersonalFinancialStatementData, TemplateType } from '@/lib/templates/types';
import { getPersonalFinancialStatementProgress } from '@/lib/templates/personal-financial-statement-progress';

type TemplateCategory = 'Business' | 'Personal';

interface TemplateHubItem {
  slug: TemplateType;
  title: string;
  description: string;
  compactDescription: string;
  time: string;
  category: TemplateCategory;
}

interface TemplateSubmissionRow {
  id: string;
  template_type: TemplateType;
  template_slot: number | null;
  form_data: Record<string, unknown> | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

const MULTI_INSTANCE_TEMPLATES: TemplateType[] = [
  'balance_sheet',
  'income_statement',
  'business_debt_summary',
  'personal_financial_statement',
  'personal_debt_summary',
];
const MAX_MULTI_INSTANCE_SUBMISSIONS = 5;

const templates: TemplateHubItem[] = [
  {
    slug: 'balance_sheet',
    title: 'Balance Sheet',
    description: 'Lender-ready snapshot of assets, liabilities, and equity.',
    compactDescription: 'Assets, liabilities, equity.',
    time: '5-10 min',
    category: 'Business',
  },
  {
    slug: 'income_statement',
    title: 'Income Statement',
    description: 'Clear profit-and-loss view with revenue and expense breakdown.',
    compactDescription: 'Profit and loss view.',
    time: '8-12 min',
    category: 'Business',
  },
  {
    slug: 'business_debt_summary',
    title: 'Business Debt Summary',
    description: 'Detailed breakdown of your business debt obligations and payment for them.',
    compactDescription: 'All business debt obligations.',
    time: '8-12 min',
    category: 'Business',
  },
  {
    slug: 'personal_financial_statement',
    title: 'Personal Financial Statement',
    description: 'SBA-aligned net-worth statement for guarantor financial strength.',
    compactDescription: 'SBA net-worth summary.',
    time: '10-15 min',
    category: 'Personal',
  },
  {
    slug: 'personal_debt_summary',
    title: 'Personal Debt Summary',
    description: 'Organized list of personal debts, balances, and monthly obligations.',
    compactDescription: 'Personal debts and payments.',
    time: '5-8 min',
    category: 'Personal',
  },
];

function getLatestSubmission(rows: TemplateSubmissionRow[] | undefined): TemplateSubmissionRow | undefined {
  if (!rows || rows.length === 0) return undefined;
  return [...rows].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
}

function sortTemplateSubmissions(rows: TemplateSubmissionRow[] | undefined): TemplateSubmissionRow[] {
  return [...(rows ?? [])].sort((a, b) => {
    const slotA = a.template_slot ?? Number.MAX_SAFE_INTEGER;
    const slotB = b.template_slot ?? Number.MAX_SAFE_INTEGER;
    if (slotA !== slotB) return slotA - slotB;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

function buildDefaultFormData(templateType: TemplateType, sequenceNumber: number): Record<string, unknown> {
  void templateType;
  void sequenceNumber;
  return {};
}

function estimateTemplateProgress(
  templateType: TemplateType,
  submission?: TemplateSubmissionRow,
): number {
  if (!submission?.form_data) {
    return 0;
  }

  if (submission.pdf_url) {
    return 100;
  }

  if (templateType === 'business_debt_summary' || templateType === 'personal_debt_summary') {
    return templateType === 'business_debt_summary'
      ? getBusinessDebtSummaryProgress(submission.form_data as unknown as BusinessDebtSummaryData & { uiState?: unknown }).percent
      : getPersonalDebtSummaryProgress(submission.form_data as unknown as PersonalDebtSummaryData & { uiState?: unknown }).percent;
  }

  if (templateType === 'personal_financial_statement') {
    return getPersonalFinancialStatementProgress(
      submission.form_data as unknown as PersonalFinancialStatementData,
    ).percent;
  }

  if (templateType === 'income_statement') {
    return getIncomeStatementProgress(
      submission.form_data as unknown as IncomeStatementData,
      { hasPdf: Boolean(submission.pdf_url) },
    ).percent;
  }

  if (templateType === 'balance_sheet') {
    return getBalanceSheetProgress(
      submission.form_data as unknown as BalanceSheetData,
      { hasPdf: Boolean(submission.pdf_url) },
    ).percent;
  }

  return 0;
}

function mapProgressLabel(progress: number): string {
  if (progress >= 100) {
    return 'Completed';
  }
  if (progress >= 60) {
    return 'In Progress';
  }
  if (progress > 0) {
    return 'Started';
  }
  return 'Not Started';
}

function getBusinessStatementSubtitle(templateSlug: TemplateType): string | null {
  if (templateSlug === 'balance_sheet') {
    return 'Shows what the business owns and owes as of one date, so lenders can quickly judge financial strength and leverage.';
  }
  if (templateSlug === 'income_statement') {
    return 'Shows revenue, expenses, and profit for a period, so lenders can evaluate cash generation and repayment capacity.';
  }
  if (templateSlug === 'business_debt_summary') {
    return 'Organizes every business debt payment in one schedule, so lenders can quickly assess total debt burden and monthly obligations.';
  }
  if (templateSlug === 'personal_debt_summary') {
    return 'Summarizes personal debt balances and payments, so lenders can evaluate guarantor obligations and repayment pressure.';
  }
  if (templateSlug === 'personal_financial_statement') {
    return 'Provides a full guarantor net-worth snapshot of assets, liabilities, and income, which lenders use to evaluate personal strength and support.';
  }
  return null;
}

function sanitizeSingleInstanceStatementLabel(rawLabel: unknown, shouldStripSingleTag: boolean): string | null {
  if (typeof rawLabel !== 'string') return null;
  const trimmed = rawLabel.trim();
  if (!trimmed) return null;
  if (!shouldStripSingleTag) return trimmed;
  return trimmed.replace(/\s+#1$/i, '').trim();
}

export default function TemplatesHub() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submissionsByType, setSubmissionsByType] = useState<Partial<Record<TemplateType, TemplateSubmissionRow[]>>>({});
  const [availableTemplates, setAvailableTemplates] = useState<TemplateType[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [mutatingTemplate, setMutatingTemplate] = useState<TemplateType | null>(null);
  const [downloadingSubmissionId, setDownloadingSubmissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParamsString = searchParams.toString();
  const requestedTemplate = searchParams.get('template') as TemplateType | null;
  const source = searchParams.get('source');
  const loanRequestId = searchParams.get('loanRequestId');
  const pendingCheckoutSessionId = searchParams.get('session_id');
  const currentTemplatesRoute = useMemo(
    () => (searchParamsString ? `${pathname}?${searchParamsString}` : pathname),
    [pathname, searchParamsString],
  );

  useEffect(() => {
    if (!requestedTemplate) {
      return;
    }

    const knownTemplate = templates.some((item) => item.slug === requestedTemplate);
    if (!knownTemplate) {
      return;
    }

    const params = new URLSearchParams();
    if (source) {
      params.set('source', source);
    }
    if (loanRequestId) {
      params.set('loanRequestId', loanRequestId);
    }

    const query = params.toString();
    router.replace(`/templates/${requestedTemplate}${query ? `?${query}` : ''}`);
  }, [loanRequestId, requestedTemplate, router, source]);

  useEffect(() => {
    let active = true;

    const loadSubmissions = async () => {
      const redirectToLogin = () => {
        router.replace(`/login?redirectTo=${encodeURIComponent(currentTemplatesRoute)}`);
      };

      const fallbackTemplatesRoute =
        requestedTemplate && templates.some((item) => item.slug === requestedTemplate)
          ? getTemplateServicePagePath(requestedTemplate)
          : '/services/templates-bundle';

      const fetchAccessPayload = async (accessToken: string | undefined) => {
        const response = await fetch('/api/access/me', {
          cache: 'no-store',
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined,
        });

        if (!response.ok) {
          return { payload: null, responseOk: false };
        }

        return {
          payload: await response.json(),
          responseOk: true,
        };
      };

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          redirectToLogin();
          return;
        }

        const maxAccessChecks = pendingCheckoutSessionId ? 5 : 1;
        let accessPayload: {
          availableTemplates?: TemplateType[];
          canAccessTemplates?: boolean;
        } | null = null;
        let accessResponseOk = false;

        for (let attempt = 0; attempt < maxAccessChecks; attempt += 1) {
          const accessResult = await fetchAccessPayload(session.access_token);
          accessPayload = accessResult.payload;
          accessResponseOk = accessResult.responseOk;

          if (!active) {
            return;
          }

          if (!accessResponseOk) {
            break;
          }

          if (accessPayload?.canAccessTemplates) {
            break;
          }

          if (attempt < maxAccessChecks - 1) {
            await new Promise((resolve) => window.setTimeout(resolve, 900 * (attempt + 1)));
          }
        }

        if (!accessResponseOk) {
          redirectToLogin();
          return;
        }

        if (!accessPayload?.canAccessTemplates) {
          router.replace(fallbackTemplatesRoute);
          return;
        }
        setAvailableTemplates(Array.isArray(accessPayload?.availableTemplates) ? accessPayload.availableTemplates : []);

        if (pendingCheckoutSessionId && typeof window !== 'undefined') {
          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.delete('session_id');
          window.history.replaceState({}, '', nextUrl.toString());
        }

        setUserId(session.user.id);

        const { data, error } = await supabase
          .from('template_submissions')
          .select('id,template_type,template_slot,form_data,pdf_url,created_at,updated_at')
          .is('archived_at', null)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Failed loading template progress:', error.message);
          if (active) {
            setLoading(false);
          }
          return;
        }

        if (!active) {
          return;
        }

        const nextState: Partial<Record<TemplateType, TemplateSubmissionRow[]>> = {};
        for (const row of (data ?? []) as TemplateSubmissionRow[]) {
          if (!nextState[row.template_type]) nextState[row.template_type] = [];
          nextState[row.template_type]?.push(row);
        }

        setSubmissionsByType(nextState);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSubmissions();
    return () => {
      active = false;
    };
  }, [currentTemplatesRoute, pendingCheckoutSessionId, requestedTemplate, router]);

  const handleAddAnother = async (templateType: TemplateType) => {
    if (!userId || !MULTI_INSTANCE_TEMPLATES.includes(templateType)) return;
    const existingCount = submissionsByType[templateType]?.length ?? 0;
    if (existingCount >= MAX_MULTI_INSTANCE_SUBMISSIONS) return;

    setMutatingTemplate(templateType);
    try {
      const nextCount = existingCount + 1;
      const { data, error } = await supabase
        .from('template_submissions')
        .insert({
          user_id: userId,
          template_type: templateType,
          form_data: buildDefaultFormData(templateType, nextCount),
        })
        .select('id,template_type,template_slot,form_data,pdf_url,created_at,updated_at')
        .single();

      if (error || !data) throw error ?? new Error('Failed creating statement');

      setSubmissionsByType((previous) => {
        const current = previous[templateType] ?? [];
        return {
          ...previous,
          [templateType]: [...current, data as TemplateSubmissionRow],
        };
      });
    } catch (error) {
      console.error('Failed adding statement:', error);
      alert('Failed to add another statement. Please try again.');
    } finally {
      setMutatingTemplate(null);
    }
  };

  const handleDeleteSubmission = async (templateType: TemplateType, submissionId: string) => {
    if (!confirm('Delete this statement? This cannot be undone.')) return;
    setMutatingTemplate(templateType);
    try {
      const { error } = await supabase.from('template_submissions').delete().eq('id', submissionId);
      if (error) throw error;
      setSubmissionsByType((previous) => {
        const next = (previous[templateType] ?? []).filter((row) => row.id !== submissionId);
        return { ...previous, [templateType]: next };
      });
    } catch (error) {
      console.error('Failed deleting statement:', error);
      alert('Failed to delete statement. Please try again.');
    } finally {
      setMutatingTemplate(null);
    }
  };

  const groupedTemplates = useMemo(() => {
    const businessOrder: TemplateType[] = ['business_debt_summary', 'balance_sheet', 'income_statement'];
    const personalOrder: TemplateType[] = ['personal_debt_summary', 'personal_financial_statement'];
    const visibleTemplates = templates.filter((template) => availableTemplates.includes(template.slug));

    const byOrder = (items: TemplateHubItem[], order: TemplateType[]) =>
      [...items].sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));

    return {
      Business: byOrder(visibleTemplates.filter((template) => template.category === 'Business'), businessOrder),
      Personal: byOrder(visibleTemplates.filter((template) => template.category === 'Personal'), personalOrder),
    };
  }, [availableTemplates]);

  const handleDownloadTemplatePdf = async (pdfUrl: string, submissionId: string, title: string) => {
    setDownloadingSubmissionId(submissionId);
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`Failed to download PDF (${response.status})`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Failed downloading template PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingSubmissionId(null);
    }
  };

  const totalProgress = useMemo(() => {
    const activeTemplates = templates.filter((template) => availableTemplates.includes(template.slug));
    if (activeTemplates.length === 0) {
      return 0;
    }
    const percentages = activeTemplates.map((template) =>
      estimateTemplateProgress(template.slug, getLatestSubmission(submissionsByType[template.slug])),
    );
    const value = Math.round(percentages.reduce((sum, current) => sum + current, 0) / percentages.length);
    return Number.isFinite(value) ? value : 0;
  }, [availableTemplates, submissionsByType]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fafc_36%,_#f3f4f6_100%)] text-slate-900">
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-slate-100">
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(120deg,_#ffffff1a_0%,_transparent_52%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-2.5">
              <p className="inline-flex items-center rounded-full border border-blue-300/40 bg-blue-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]">
                Guided Financial Templates
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">Build lender-grade documents faster</h1>
              <p className="text-sm text-slate-300 sm:text-base">
                Complete Business and Personal sections with clear, structured templates.
              </p>
            </div>

            <div className="w-full max-w-xs rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Overall Progress</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-3xl font-bold text-white">{loading ? '--' : `${totalProgress}%`}</p>
                <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[11px] font-medium text-slate-200">
                  {loading ? 'Loading' : mapProgressLabel(totalProgress)}
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-300"
                  style={{ width: `${loading ? 0 : totalProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 sm:py-6">
        {source === 'loan-packaging' ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 flex items-center justify-between gap-3">
            <span>Opened from Loan Packaging. Complete templates, then return to continue checklist uploads.</span>
            <Link
              href={loanRequestId ? `/loan-packaging?loanRequestId=${loanRequestId}` : '/loan-packaging'}
              className="inline-flex items-center rounded-md border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              Return to Loan Packaging
            </Link>
          </div>
        ) : null}

        <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <BriefcaseBusiness className="h-4 w-4 text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Business Section</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
              3 templates
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {groupedTemplates.Business.map((template) => {
              const isMulti = MULTI_INSTANCE_TEMPLATES.includes(template.slug);
              const templateSubmissions = sortTemplateSubmissions(submissionsByType[template.slug]);
              const canAddMore = templateSubmissions.length < MAX_MULTI_INSTANCE_SUBMISSIONS;
              const cards =
                isMulti && templateSubmissions.length > 0
                  ? templateSubmissions.map((submission, index) => ({ submission, index }))
                  : [{ submission: getLatestSubmission(templateSubmissions), index: 0 }];

              return cards.map(({ submission, index }) => {
                const cardKey = submission ? `${template.slug}-${submission.id}` : `${template.slug}-base`;
                const progress = estimateTemplateProgress(template.slug, submission);
                const started = progress > 0;
                const isComplete = progress >= 100 && Boolean(submission?.pdf_url);
                const routeParams = new URLSearchParams();
                if (submission) {
                  routeParams.set('submissionId', submission.id);
                }
                if (source) {
                  routeParams.set('source', source);
                }
                if (loanRequestId) {
                  routeParams.set('loanRequestId', loanRequestId);
                }
                const continueHref = submission
                  ? `/templates/${template.slug}?${routeParams.toString()}`
                  : `/templates/${template.slug}${routeParams.toString() ? `?${routeParams.toString()}` : ''}`;
                const slotLabel = submission?.template_slot ?? index + 1;
                const showSequenceLabel = isMulti && templateSubmissions.length > 1 && Boolean(submission);
                const sequenceLabel = showSequenceLabel ? ` #${slotLabel}` : '';
                const formData = submission?.form_data ?? {};
                const shouldStripSingleTag = isMulti && templateSubmissions.length <= 1;
                const savedStatementLabel = sanitizeSingleInstanceStatementLabel(
                  formData.statementLabel,
                  shouldStripSingleTag,
                );
                const statementSubtitle = getBusinessStatementSubtitle(template.slug);
                const cardTitle =
                  template.slug === 'balance_sheet' && submission
                    ? deriveBalanceSheetTitle(formData)
                    : template.slug === 'income_statement' && submission
                    ? deriveIncomeStatementTitle(formData)
                    : template.title;
                const cardMeta =
                  template.slug === 'balance_sheet' && submission
                    ? deriveBalanceSheetDashboardMeta(formData, slotLabel)
                    : template.slug === 'income_statement' && submission
                    ? deriveIncomeStatementDashboardMeta(formData, slotLabel)
                    : null;
                const cardSubtitle =
                  isMulti && submission
                    ? statementSubtitle || savedStatementLabel || `${template.title}${sequenceLabel}`
                    : template.description;
                const periodHint =
                  typeof formData.asOfDate === 'string'
                    ? `As of ${formData.asOfDate}`
                    : typeof formData.periodStart === 'string' && typeof formData.periodEnd === 'string'
                      ? `${formData.periodStart} to ${formData.periodEnd}`
                      : null;

                return (
                  <div
                    key={cardKey}
                    className="group rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 transition-colors hover:border-blue-300 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-[15px] font-semibold text-slate-900">
                          {cardTitle}{template.slug === 'balance_sheet' || template.slug === 'income_statement' ? '' : sequenceLabel}
                        </h3>
                        {cardMeta ? <p className="mt-1 text-[11px] font-medium text-slate-500">{cardMeta}</p> : null}
                      </div>
                      <span className="text-[11px] font-medium text-slate-500">{template.time}</span>
                    </div>

                    {isMulti && submission ? (
                      <p className="mt-1.5 text-xs leading-5 text-slate-600">{cardSubtitle}</p>
                    ) : (
                      <>
                        <p className="mt-1.5 hidden text-xs leading-5 text-slate-600 sm:block">{template.description}</p>
                        <p className="mt-1.5 text-xs leading-5 text-slate-600 sm:hidden">{template.compactDescription}</p>
                      </>
                    )}

                    {periodHint ? <p className="mt-1 text-[11px] text-slate-500">{periodHint}</p> : null}

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-600">{progress}% complete</span>
                      {isMulti ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {templateSubmissions.length}/{MAX_MULTI_INSTANCE_SUBMISSIONS} statements
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={continueHref}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                        aria-label={`${started ? 'Continue' : 'Start'} ${template.title}${sequenceLabel}`}
                      >
                        {started ? 'Continue' : 'Start'}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                      {isMulti ? (
                        <button
                          type="button"
                          onClick={() => handleAddAnother(template.slug)}
                          disabled={!canAddMore || mutatingTemplate === template.slug}
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold ${
                            canAddMore
                              ? 'border-blue-300 text-blue-700 hover:bg-blue-50'
                              : 'cursor-not-allowed border-slate-200 text-slate-400'
                          }`}
                          aria-disabled={!canAddMore || mutatingTemplate === template.slug}
                        >
                          {mutatingTemplate === template.slug ? 'Adding...' : 'Add Another'}
                        </button>
                      ) : null}
                      {isMulti && submission ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteSubmission(template.slug, submission.id)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                          disabled={mutatingTemplate === template.slug}
                        >
                          Delete
                        </button>
                      ) : null}
                      {isComplete && submission?.pdf_url ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadTemplatePdf(submission.pdf_url as string, submission.id, template.title)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                          disabled={downloadingSubmissionId === submission.id}
                        >
                          {downloadingSubmissionId === submission.id ? 'Downloading...' : 'Download PDF'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <UserRound className="h-4 w-4 text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Personal Section</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
              2 templates
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {groupedTemplates.Personal.map((template) => {
              const isMulti = MULTI_INSTANCE_TEMPLATES.includes(template.slug);
              const templateSubmissions = sortTemplateSubmissions(submissionsByType[template.slug]);
              const canAddMore = templateSubmissions.length < MAX_MULTI_INSTANCE_SUBMISSIONS;
              const cards =
                isMulti && templateSubmissions.length > 0
                  ? templateSubmissions.map((submission, index) => ({ submission, index }))
                  : [{ submission: getLatestSubmission(templateSubmissions), index: 0 }];

              return cards.map(({ submission, index }) => {
                const progress = estimateTemplateProgress(template.slug, submission);
                const started = progress > 0;
                const isComplete = progress >= 100 && Boolean(submission?.pdf_url);
                const routeParams = new URLSearchParams();
                if (submission) routeParams.set('submissionId', submission.id);
                if (source) routeParams.set('source', source);
                if (loanRequestId) routeParams.set('loanRequestId', loanRequestId);
                const continueHref = `/templates/${template.slug}${routeParams.toString() ? `?${routeParams.toString()}` : ''}`;
                const slotLabel = submission?.template_slot ?? index + 1;
                const showSequenceLabel = isMulti && templateSubmissions.length > 1 && Boolean(submission);
                const sequenceLabel = showSequenceLabel ? ` #${slotLabel}` : '';
                const statementSubtitle = getBusinessStatementSubtitle(template.slug);

                return (
                  <div
                    key={`${template.slug}-${submission?.id ?? index}`}
                    className="group rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 transition-colors hover:border-blue-300 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[15px] font-semibold text-slate-900">{template.title}{sequenceLabel}</h3>
                      <span className="text-[11px] font-medium text-slate-500">{template.time}</span>
                    </div>

                    <p className="mt-1.5 hidden text-xs leading-5 text-slate-600 sm:block">{statementSubtitle || template.description}</p>
                    <p className="mt-1.5 text-xs leading-5 text-slate-600 sm:hidden">{statementSubtitle || template.compactDescription}</p>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-600">{progress}% complete</span>
                      {isMulti ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {templateSubmissions.length}/{MAX_MULTI_INSTANCE_SUBMISSIONS} statements
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                          {mapProgressLabel(progress)}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={continueHref}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                        aria-label={`${started ? 'Continue' : 'Start'} ${template.title}${sequenceLabel}`}
                      >
                        {started ? 'Continue' : 'Start'}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                      {isMulti ? (
                        <button
                          type="button"
                          onClick={() => handleAddAnother(template.slug)}
                          disabled={!canAddMore || mutatingTemplate === template.slug}
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold ${
                            canAddMore
                              ? 'border-blue-300 text-blue-700 hover:bg-blue-50'
                              : 'cursor-not-allowed border-slate-200 text-slate-400'
                          }`}
                          aria-disabled={!canAddMore || mutatingTemplate === template.slug}
                        >
                          {mutatingTemplate === template.slug ? 'Adding...' : 'Add Another'}
                        </button>
                      ) : null}
                      {isMulti && submission ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteSubmission(template.slug, submission.id)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                          disabled={mutatingTemplate === template.slug}
                        >
                          Delete
                        </button>
                      ) : null}
                      {isComplete && submission?.pdf_url ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadTemplatePdf(submission.pdf_url as string, submission.id, template.title)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                          disabled={downloadingSubmissionId === submission.id}
                        >
                          {downloadingSubmissionId === submission.id ? 'Downloading...' : 'Download PDF'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <CircleCheck className="h-4 w-4 text-emerald-600" />
            Progress updates automatically as you fill template fields.
          </div>
        </section>
      </main>
    </div>
  );
}
