'use client';

import { Fragment, type ReactNode, useEffect, useMemo, useState } from 'react';
import { Manrope, Space_Grotesk } from 'next/font/google';
import { supabase } from '@/supabase/helpers/client';
import {
  CASH_FLOW_FIELD_LABELS,
  type CashFlowYearKey,
  type ClientServicePill,
} from '@/lib/admin/client-dashboard';
import { TEMPLATE_TYPES } from '@/lib/stripe/catalog';
import type { TemplateType } from '@/lib/templates/types';
import { loanPurposes } from '@/lib/financial/dscr';
import { calculateFinancialSummary } from '@/lib/financial/calculations';

const headingFont = Space_Grotesk({ subsets: ['latin'], weight: ['500', '700'] });
const bodyFont = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

type DashboardPayload = {
  kpis: {
    totalUsers: number;
    templateUsers: number;
    loanPackagingUsers: number;
    loanBrokeringUsers: number;
    yearlyRevenue: number;
    openTasks: number;
    openReviews: number;
  };
};

type DealStage = 'new_lead' | 'analysis_purchased' | 'analysis_complete' | 'package_started' | 'package_complete' | 'lender_feeler_ready' | 'lender_feeler_sent' | 'lender_interested' | 'connected_to_lender' | 'funded' | 'closed_lost' | 'nurture';
type Priority = 'low' | 'normal' | 'high' | 'urgent';
type SelectedPath = 'undecided' | 'self_serve_package' | 'lender_matching' | 'templates_only' | 'analysis_only';
type LenderStatus = 'not_started' | 'needs_package' | 'ready_for_feeler' | 'feeler_sent' | 'interested' | 'declined' | 'connected' | 'funded';

type ClientRow = {
  id: string;
  businessName: string;
  fullName: string;
  email: string;
  service: string;
  services: ClientServicePill[];
  grantedTemplateTypes: TemplateType[];
  dscr: number | null;
  dscrYear: CashFlowYearKey | null;
  nextStep: string;
  progressPct: number;
  dealStage: DealStage;
  priority: Priority;
  selectedPath: SelectedPath | null;
  lenderStatus: LenderStatus;
  estimatedBrokerFee: number | null;
  targetCloseDate: string | null;
  lastContactedAt: string | null;
  lastUpdate: string;
  hasAccount: boolean;
  hasTemplateAccess: boolean;
  hasPackagingAccess: boolean;
  hasComprehensiveAccess: boolean;
  hasTemplateBundleGrant: boolean;
  hasPackagingGrant: boolean;
  hasBrokeringGrant: boolean;
  hasComprehensiveGrant: boolean;
  hasCashFlowAnalysis: boolean;
};

type SharedProfile = {
  personalName?: string | null;
  businessName?: string | null;
  businessLegalName?: string | null;
  loanPurpose?: string | null;
  loanAmount?: number | null;
  annualRevenue?: number | null;
  yearsInBusiness?: number | null;
  businessDescription?: string | null;
};

type FinancialInput = {
  revenue: string;
  cogs: string;
  operatingExpenses: string;
  nonRecurringIncome: string;
  nonRecurringExpenses: string;
  depreciation: string;
  amortization: string;
  interest: string;
  taxes: string;
};

type FinancialYear = {
  input: FinancialInput;
  summary: Record<string, number>;
  skip?: boolean;
  ytdMonth?: string;
};

type ClientDetail = {
  client: {
    id: string;
    clientAccountId: string | null;
    userId: string | null;
    fullName: string;
    email: string;
    hasAccount: boolean;
    services: ClientServicePill[];
    hasTemplateAccess: boolean;
    hasPackagingAccess: boolean;
    hasComprehensiveAccess: boolean;
    grantedTemplateTypes: TemplateType[];
    lastUpdate: string;
    dscr: {
      values: Record<CashFlowYearKey, number | null>;
      currentValue: number | null;
      currentYear: CashFlowYearKey | null;
    };
  };
  account: {
    fullName: string | null;
    businessName: string | null;
    phone: string | null;
    companyRole: string | null;
    leadSource: string | null;
    dealStage: DealStage;
    priority: Priority;
    selectedPath: SelectedPath | null;
    lastContactedAt: string | null;
    targetCloseDate: string | null;
    estimatedBrokerFee: number | null;
    lenderStatus: LenderStatus;
    portalMessage: string | null;
    clientPortalEnabled: boolean;
    notes: string | null;
    nextStep: string | null;
    serviceLevel: 'none' | 'comprehensive' | 'templates' | 'packaging' | 'brokering';
    accessTemplates: boolean;
    accessPackaging: boolean;
    accessComprehensive: boolean;
    grantedTemplateTypes: TemplateType[];
    email: string;
  };
  sharedProfile: SharedProfile;
  templateSummary: {
    progressPct: number;
    nextStep: string;
    submissions: Array<{
      id: string;
      templateType: string;
      updatedAt: string;
      pdfUrl: string | null;
      slot: number | null;
    }>;
  };
  packaging: null | {
    loanRequest: {
      id: string;
      serviceType: string;
      status: string;
      businessName: string | null;
      businessDescription: string | null;
      loanPurpose: string | null;
      loanAmount: number | null;
      annualRevenue: number | null;
      yearsInBusiness: number | null;
      strengths: string | null;
      updatedAt: string;
    };
    progress: null | {
      completedRequired: number;
      totalRequired: number;
      percentage: number;
      nextRequirement: null | {
        requirementKey: string;
        displayName: string;
        description: string;
      };
    };
    uploadedDocuments: Array<{
      id: string;
      requirementKey: string;
      displayName: string;
      status: string;
      source: string;
      uploadedAt: string | null;
      updatedAt: string | null;
    }>;
    nextRequired: Array<{
      requirementKey: string;
      displayName: string;
      description: string;
    }>;
  };
  cashFlowAnalysis: null | {
    id: string;
    status: 'inprogress' | 'submitted';
    updatedAt: string;
    dscr: {
      values: Record<CashFlowYearKey, number | null>;
      currentValue: number | null;
      currentYear: CashFlowYearKey | null;
    };
    loanInfo: {
      firstName: string | null;
      lastName: string | null;
      businessName: string | null;
      loanPurpose: string | null;
      desiredAmount: number | null;
      estimatedPayment: number | null;
      annualizedLoan: number | null;
      term: string | null;
      amortization: string | null;
      interestRate: number | null;
      downPayment: number | null;
      downPayment293: string | null;
      proposedLoan: number | null;
    };
    financials: {
      year2024: FinancialYear;
      year2025: FinancialYear;
      year2026YTD: FinancialYear;
    };
    debts: Array<{
      category: string;
      description: string;
      monthlyPayment: string;
      originalLoanAmount: string;
      outstandingBalance: string;
      notes?: string;
    }>;
  };
};

type PackagingLoanRequest = NonNullable<ClientDetail['packaging']>['loanRequest'];
type CashFlowAnalysisDetail = NonNullable<ClientDetail['cashFlowAnalysis']>;

type ClientDetailDraft = {
  account: {
    fullName: string | null;
    businessName: string | null;
    email: string;
    phone: string | null;
    companyRole: string | null;
    leadSource: string | null;
    dealStage: DealStage;
    priority: Priority;
    selectedPath: SelectedPath | null;
    lastContactedAt: string | null;
    targetCloseDate: string | null;
    estimatedBrokerFee: number | null;
    lenderStatus: LenderStatus;
    portalMessage: string | null;
    clientPortalEnabled: boolean;
    notes: string | null;
    nextStep: string | null;
    serviceLevel: 'none' | 'comprehensive' | 'templates' | 'packaging' | 'brokering';
    accessTemplates: boolean;
    accessPackaging: boolean;
    accessComprehensive: boolean;
    grantedTemplateTypes: TemplateType[];
  };
  sharedProfile: SharedProfile;
  loanRequest: PackagingLoanRequest | null;
  cashFlowAnalysis: CashFlowAnalysisDetail | null;
  cashFlowDebts: Array<{
    category: string;
    description: string;
    monthlyPayment: string;
    originalLoanAmount: string;
    outstandingBalance: string;
    notes?: string;
  }>;
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const monthOptions = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const loanPurposeOptions = Object.keys(loanPurposes);

const termOptions = [
  { years: 1, months: 12 },
  { years: 2, months: 24 },
  { years: 3, months: 36 },
  { years: 4, months: 48 },
  { years: 5, months: 60 },
  { years: 6, months: 72 },
  { years: 7, months: 84 },
  { years: 8, months: 96 },
  { years: 9, months: 108 },
  { years: 10, months: 120 },
  { years: 15, months: 180 },
  { years: 20, months: 240 },
  { years: 25, months: 300 },
  { years: 30, months: 360 },
];

const amortizationOptions = termOptions;
const newClientServiceOptions = [
  ['comprehensive', 'Comprehensive'],
  ['packaging', 'Loan Packaging'],
  ['brokering', 'Loan Brokering'],
  ['templates', 'Templates'],
] as const;

const dealStageOptions: Array<[DealStage, string]> = [
  ['new_lead', 'New Lead'],
  ['analysis_purchased', 'Analysis Purchased'],
  ['analysis_complete', 'Analysis Complete'],
  ['package_started', 'Package Started'],
  ['package_complete', 'Package Complete'],
  ['lender_feeler_ready', 'Feeler Ready'],
  ['lender_feeler_sent', 'Feeler Sent'],
  ['lender_interested', 'Lender Interested'],
  ['connected_to_lender', 'Connected'],
  ['funded', 'Funded'],
  ['closed_lost', 'Closed Lost'],
  ['nurture', 'Nurture'],
];

const priorityOptions: Array<[Priority, string]> = [['low', 'Low'], ['normal', 'Normal'], ['high', 'High'], ['urgent', 'Urgent']];
const selectedPathOptions: Array<[SelectedPath, string]> = [['undecided', 'Undecided'], ['analysis_only', 'Analysis Only'], ['templates_only', 'Templates Only'], ['self_serve_package', 'Self-Serve Package'], ['lender_matching', 'Lender Matching']];
const lenderStatusOptions: Array<[LenderStatus, string]> = [['not_started', 'Not Started'], ['needs_package', 'Needs Package'], ['ready_for_feeler', 'Ready for Feeler'], ['feeler_sent', 'Feeler Sent'], ['interested', 'Interested'], ['declined', 'Declined'], ['connected', 'Connected'], ['funded', 'Funded']];

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMoney(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '-';
  return money.format(value);
}

function parseCurrencyNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = Number(String(value).replace(/[$,%\s,]/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrencyInput(value: string | number | null | undefined): string {
  const num = parseCurrencyNumber(value);
  if (!num) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function calculateMonthlyPayment(principal: number, annualRate: number, termMonths: number, paymentMode?: 'amortized' | 'interest_only'): number {
  if (!principal || !annualRate || !termMonths) return 0;
  const monthlyRate = annualRate / 12;
  if (paymentMode === 'interest_only') return principal * monthlyRate;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
}

function formatDscr(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '-';
  return value.toFixed(2);
}

function formatTemplateTypeLabel(value: TemplateType): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function splitFullName(value: string | null | undefined): { firstName: string | null; lastName: string | null } {
  const parts = (value ?? '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? null,
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : null,
  };
}

function toggleTemplateGrant(current: TemplateType[], templateType: TemplateType): TemplateType[] {
  return current.includes(templateType)
    ? current.filter((type) => type !== templateType)
    : [...current, templateType];
}

function cloneDraft(detail: ClientDetail): ClientDetailDraft {
  const cashFlowAnalysis = detail.cashFlowAnalysis ? JSON.parse(JSON.stringify(detail.cashFlowAnalysis)) : null;
  
  // Ensure financials have input field structure
  if (cashFlowAnalysis?.financials) {
    const years = ['year2024', 'year2025', 'year2026YTD'] as const;
    for (const year of years) {
      if (!cashFlowAnalysis.financials[year].input) {
        cashFlowAnalysis.financials[year] = {
          ...cashFlowAnalysis.financials[year],
          input: {
            revenue: '',
            cogs: '',
            operatingExpenses: '',
            otherIncome: '',
            interestIncome: '',
            nonRecurringIncome: '',
            nonRecurringExpenses: '',
            depreciation: '',
            amortization: '',
            interest: '',
            taxes: '',
          },
        };
      }
    }
  }
  
  return {
    account: {
      fullName: detail.account.fullName,
      businessName: detail.account.businessName,
      email: detail.account.email,
      phone: detail.account.phone,
      companyRole: detail.account.companyRole,
      leadSource: detail.account.leadSource,
      dealStage: detail.account.dealStage,
      priority: detail.account.priority,
      selectedPath: detail.account.selectedPath,
      lastContactedAt: detail.account.lastContactedAt,
      targetCloseDate: detail.account.targetCloseDate,
      estimatedBrokerFee: detail.account.estimatedBrokerFee,
      lenderStatus: detail.account.lenderStatus,
      portalMessage: detail.account.portalMessage,
      clientPortalEnabled: detail.account.clientPortalEnabled,
      notes: detail.account.notes,
      nextStep: detail.account.nextStep,
      serviceLevel: detail.account.serviceLevel,
      accessTemplates: detail.account.accessTemplates,
      accessPackaging: detail.account.accessPackaging,
      accessComprehensive: detail.account.accessComprehensive,
      grantedTemplateTypes: detail.client.grantedTemplateTypes ?? [],
    },
    sharedProfile: JSON.parse(JSON.stringify(detail.sharedProfile)),
    loanRequest: detail.packaging ? JSON.parse(JSON.stringify(detail.packaging.loanRequest)) : null,
    cashFlowAnalysis,
    cashFlowDebts: detail.cashFlowAnalysis?.debts ?? [],
  };
}

export default function AdminDashboardClient() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingTarget, setSavingTarget] = useState<string | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientBusinessName, setNewClientBusinessName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientAccess, setNewClientAccess] = useState({
    comprehensive: false,
    packaging: false,
    brokering: false,
    templates: false,
  });
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [detailsByClientId, setDetailsByClientId] = useState<Record<string, ClientDetail>>({});
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [draftsByClientId, setDraftsByClientId] = useState<Record<string, ClientDetailDraft>>({});

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadEverything = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const authHeaders = await getAuthHeaders();

      const [dashboardRes, clientsRes] = await Promise.all([
        fetch('/api/admin/dashboard', { cache: 'no-store', headers: authHeaders }),
        fetch('/api/admin/clients', { cache: 'no-store', headers: authHeaders }),
      ]);

      if (!dashboardRes.ok || !clientsRes.ok) {
        const dashboardErr = await dashboardRes.json().catch(() => ({}));
        const clientsErr = await clientsRes.json().catch(() => ({}));
        throw new Error(dashboardErr.error || clientsErr.error || 'Failed to load admin dashboard.');
      }

      const dashboardJson = await dashboardRes.json();
      const clientsJson = await clientsRes.json();

      setDashboard(dashboardJson);
      setClients(clientsJson.clients ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEverything();
  }, []);

  const loadClientDetail = async (clientId: string, force = false) => {
    if (!force && detailsByClientId[clientId]) {
      return detailsByClientId[clientId];
    }

    setLoadingDetailId(clientId);
    setDetailErrors((current) => ({ ...current, [clientId]: '' }));

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        cache: 'no-store',
        headers: authHeaders,
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || 'Failed to load client details.');
      }

      setDetailsByClientId((current) => ({ ...current, [clientId]: json as ClientDetail }));
      setDraftsByClientId((current) => ({ ...current, [clientId]: current[clientId] ?? cloneDraft(json as ClientDetail) }));
      return json as ClientDetail;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load client details.';
      setDetailErrors((current) => ({ ...current, [clientId]: message }));
      return null;
    } finally {
      setLoadingDetailId((current) => (current === clientId ? null : current));
    }
  };

  const createClient = async () => {
    const trimmedName = newClientName.trim();
    const trimmedBusinessName = newClientBusinessName.trim();
    const trimmedEmail = newClientEmail.trim().toLowerCase();

    if (!trimmedName && !trimmedBusinessName && !trimmedEmail) {
      setErrorMessage('Enter at least a client name, business name, or email.');
      return;
    }

    setSavingTarget('create_client');
    setErrorMessage(null);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: trimmedName,
          businessName: trimmedBusinessName,
          email: trimmedEmail,
          accessComprehensive: newClientAccess.comprehensive,
          accessPackaging: newClientAccess.packaging || newClientAccess.brokering,
          accessTemplates: newClientAccess.templates,
          grantedTemplateTypes: newClientAccess.templates ? [...TEMPLATE_TYPES] : [],
          serviceLevel: newClientAccess.brokering
            ? 'brokering'
            : newClientAccess.packaging
              ? 'packaging'
              : newClientAccess.comprehensive
                ? 'comprehensive'
                : newClientAccess.templates
                  ? 'templates'
                  : 'none',
        }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || 'Failed to create client');
      }

      const createdClientId = typeof json.client?.user_id === 'string'
        ? json.client.user_id
        : typeof json.client?.id === 'string'
          ? json.client.id
          : '';

      setNewClientName('');
      setNewClientBusinessName('');
      setNewClientEmail('');
      setNewClientAccess({ comprehensive: false, packaging: false, brokering: false, templates: false });
      setShowAddClientModal(false);
      await loadEverything();
      if (createdClientId) {
        setExpandedClientId(createdClientId);
        await loadClientDetail(createdClientId, true);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create client');
    } finally {
      setSavingTarget(null);
    }
  };

  const runClientAction = async (clientId: string, action: string, templateType?: TemplateType) => {
    setSavingTarget(`action:${clientId}`);
    setErrorMessage(null);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/admin/clients', {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, action, templateType }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed client action');
      }

      await Promise.all([
        loadEverything(),
        expandedClientId === clientId ? loadClientDetail(clientId, true) : Promise.resolve(null),
      ]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed client action');
    } finally {
      setSavingTarget(null);
    }
  };

  const toggleClient = async (clientId: string) => {
    if (expandedClientId === clientId) {
      setExpandedClientId(null);
      return;
    }

    setExpandedClientId(clientId);
    await loadClientDetail(clientId);
  };


  const saveDetail = async (clientId: string) => {
    const draft = draftsByClientId[clientId];
    if (!draft) return;
    const detail = detailsByClientId[clientId];

    setSavingTarget(`detail:${clientId}`);
    setDetailErrors((current) => ({ ...current, [clientId]: '' }));

    try {
      const authHeaders = await getAuthHeaders();
      const accountPayload = detail?.client.hasAccount
        ? {
            fullName: draft.account.fullName,
            businessName: draft.account.businessName,
            phone: draft.account.phone,
            companyRole: draft.account.companyRole,
            leadSource: draft.account.leadSource,
            dealStage: draft.account.dealStage,
            priority: draft.account.priority,
            selectedPath: draft.account.selectedPath,
            lastContactedAt: draft.account.lastContactedAt,
            targetCloseDate: draft.account.targetCloseDate,
            estimatedBrokerFee: draft.account.estimatedBrokerFee,
            lenderStatus: draft.account.lenderStatus,
            portalMessage: draft.account.portalMessage,
            clientPortalEnabled: draft.account.clientPortalEnabled,
            notes: draft.account.notes,
            nextStep: draft.account.nextStep,
            serviceLevel: draft.account.serviceLevel,
            accessTemplates: draft.account.accessTemplates,
            accessPackaging: draft.account.accessPackaging,
            accessComprehensive: draft.account.accessComprehensive,
            grantedTemplateTypes: draft.account.grantedTemplateTypes,
          }
        : draft.account;
      const payload = {
        account: accountPayload,
        sharedProfile: draft.sharedProfile,
        loanRequest: draft.loanRequest ?? undefined,
        cashFlowAnalysis: draft.cashFlowAnalysis
          ? {
              id: draft.cashFlowAnalysis.id,
              status: draft.cashFlowAnalysis.status,
              firstName: draft.cashFlowAnalysis.loanInfo.firstName,
              lastName: draft.cashFlowAnalysis.loanInfo.lastName,
              businessName: draft.cashFlowAnalysis.loanInfo.businessName,
              loanPurpose: draft.cashFlowAnalysis.loanInfo.loanPurpose,
              desiredAmount: draft.cashFlowAnalysis.loanInfo.desiredAmount,
              estimatedPayment: draft.cashFlowAnalysis.loanInfo.estimatedPayment,
              annualizedLoan: draft.cashFlowAnalysis.loanInfo.annualizedLoan,
              term: draft.cashFlowAnalysis.loanInfo.term,
              amortization: draft.cashFlowAnalysis.loanInfo.amortization,
              interestRate: draft.cashFlowAnalysis.loanInfo.interestRate,
              downPayment: draft.cashFlowAnalysis.loanInfo.downPayment,
              downPayment293: draft.cashFlowAnalysis.loanInfo.downPayment293,
              proposedLoan: draft.cashFlowAnalysis.loanInfo.proposedLoan,
              financials: draft.cashFlowAnalysis.financials,
              debts: draft.cashFlowDebts,
            }
          : undefined,
      };
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || 'Failed to save client updates.');
      }

      setDetailsByClientId((current) => ({ ...current, [clientId]: json as ClientDetail }));
      setDraftsByClientId((current) => {
        const next = { ...current };
        delete next[clientId];
        return next;
      });
      await loadEverything();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save client updates.';
      setDetailErrors((current) => ({ ...current, [clientId]: message }));
    } finally {
      setSavingTarget(null);
    }
  };

  return (
    <div className={`${bodyFont.className} min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe_0,_#f8fafc_35%,_#e2e8f0_100%)]`}>
      <div className="mx-auto max-w-[1500px] px-4 pb-5 md:px-5">
        <section className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Admin Operations</p>
              <h1 className={`${headingFont.className} text-2xl font-bold text-slate-900`}>Control Center</h1>
            </div>
            <button
              type="button"
              onClick={() => void loadEverything()}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
            >
              Refresh
            </button>
          </div>
        </section>

        {errorMessage ? (
          <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{errorMessage}</div>
        ) : null}

        <section className="mt-2 grid gap-2 md:grid-cols-5">
          <MiniCard label="Users" value={dashboard ? String(dashboard.kpis.totalUsers) : loading ? '...' : '0'} />
          <MiniCard label="Template Users" value={dashboard ? String(dashboard.kpis.templateUsers) : loading ? '...' : '0'} />
          <MiniCard label="Loan Packaging Users" value={dashboard ? String(dashboard.kpis.loanPackagingUsers) : loading ? '...' : '0'} />
          <MiniCard label="Loan Brokering Users" value={dashboard ? String(dashboard.kpis.loanBrokeringUsers) : loading ? '...' : '0'} />
          <MiniCard label="Yearly Revenue" value={dashboard ? money.format(dashboard.kpis.yearlyRevenue) : loading ? '...' : '$0'} />
        </section>

        <section className="mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Clients</h2>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Click a row to expand the client workspace</span>
              <button
                type="button"
                onClick={() => setShowAddClientModal(true)}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white"
              >
                Add Client
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="px-2 py-2">Business</th>
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Email</th>
                  <th className="px-2 py-2">Services</th>
                  <th className="px-2 py-2">Stage</th>
                  <th className="px-2 py-2">DSCR</th>
                  <th className="px-2 py-2">Progress</th>
                  <th className="px-2 py-2">Est. Fee</th>
                  <th className="px-2 py-2">Last Update</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => {
                  const isExpanded = expandedClientId === client.id;
                  const detail = detailsByClientId[client.id];
                  const draft = draftsByClientId[client.id];
                  const detailError = detailErrors[client.id];

                  const hasManualTemplateGrant = (templateType: TemplateType) => client.grantedTemplateTypes.includes(templateType);
                  const hasBrokeringService = client.services.some((service) => service.key === 'loan_brokering');
                  const hasHigherTierService = client.services.some(
                    (service) => service.key === 'loan_packaging' || service.key === 'loan_brokering',
                  );
                  const showComprehensiveAction = !hasHigherTierService;
                  const showTemplateActions = !hasHigherTierService;

                  return (
                    <Fragment key={client.id}>
                      <tr
                        onClick={() => void toggleClient(client.id)}
                        className={`cursor-pointer border-b border-slate-100 align-top text-slate-700 transition hover:bg-slate-50 ${
                          isExpanded ? 'bg-slate-50/60' : ''
                        }`}
                      >
                        <td className="px-2 py-2 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{client.businessName || '-'}</span>
                            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                              {isExpanded ? 'Open' : 'View'}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2 font-medium text-slate-800">{client.fullName || '-'}</td>
                        <td className="px-2 py-2">{client.email || '-'}</td>
                        <td className="px-2 py-2">
                          <div className="flex max-w-[260px] flex-wrap gap-1">
                            {client.services.length > 0 ? (
                              client.services.map((service) => (
                                <ServiceBadge key={`${client.id}:${service.key}`} label={service.label} />
                              ))
                            ) : (
                              <span className="text-slate-400">No Access</span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <p className="font-semibold text-slate-900">{dealStageOptions.find(([key]) => key === client.dealStage)?.[1] ?? client.dealStage}</p>
                          <p className={`text-[10px] font-semibold uppercase tracking-[0.1em] ${client.priority === 'urgent' ? 'text-rose-600' : client.priority === 'high' ? 'text-amber-600' : 'text-slate-500'}`}>{client.priority}</p>
                        </td>
                        <td className="px-2 py-2">
                          <p className="font-semibold text-slate-900">{formatDscr(client.dscr)}</p>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500">{client.dscrYear ?? ''}</p>
                        </td>
                        <td className="min-w-[150px] px-2 py-2">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
                              style={{ width: `${Math.max(0, Math.min(100, client.progressPct ?? 0))}%` }}
                            />
                          </div>
                          <p className="mt-1 text-[11px] font-semibold text-slate-600">
                            {Math.max(0, Math.min(100, Math.round(client.progressPct ?? 0)))}%
                          </p>
                        </td>
                        <td className="px-2 py-2">
                          <p className="font-semibold text-slate-900">{formatMoney(client.estimatedBrokerFee)}</p>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500">{lenderStatusOptions.find(([key]) => key === client.lenderStatus)?.[1] ?? client.lenderStatus}</p>
                        </td>
                        <td className="px-2 py-2">{formatDate(client.lastUpdate)}</td>
                        <td className="px-2 py-2" onClick={(event) => event.stopPropagation()}>
                          <div className="group relative inline-block">
                            <button type="button" className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700">
                              More Actions
                            </button>
                            <div className="invisible absolute right-0 z-20 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
                              <ActionButton
                                label="Preview Customer Dashboard"
                                onClick={() => window.open(`/customer-dashboard?clientId=${encodeURIComponent(client.id)}`, '_blank', 'noopener,noreferrer')}
                              />
                              {client.hasComprehensiveAccess ? (
                                <ActionButton
                                  label="View Comprehensive"
                                  onClick={() => window.open(`/comprehensive-cash-flow-analysis?adminClientId=${encodeURIComponent(client.id)}`, '_blank', 'noopener,noreferrer')}
                                />
                              ) : null}
                              <ActionButton
                                label={hasBrokeringService ? 'Remove Brokering Access' : 'Give Brokering Access'}
                                onClick={() => void runClientAction(client.id, hasBrokeringService ? 'revoke_brokering' : 'grant_brokering')}
                              />
                              {!hasBrokeringService ? (
                                <ActionButton
                                  label={client.hasPackagingAccess ? 'Remove Packaging Access' : 'Give Packaging Access'}
                                  onClick={() => void runClientAction(client.id, client.hasPackagingAccess ? 'revoke_packaging' : 'grant_packaging')}
                                />
                              ) : null}
                              {showTemplateActions ? (
                                <div className="group/templates relative">
                                  <button
                                    type="button"
                                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    <span>Template Access</span>
                                    <span>›</span>
                                  </button>
                                  <div className="invisible absolute right-full top-0 z-30 mr-1 w-64 rounded-lg border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition group-hover/templates:visible group-hover/templates:opacity-100">
                                    <ActionButton
                                      label={`${client.hasTemplateBundleGrant ? '✓ ' : ''}All Templates`}
                                      onClick={() => void runClientAction(client.id, client.hasTemplateBundleGrant ? 'revoke_templates' : 'grant_templates')}
                                    />
                                    {TEMPLATE_TYPES.map((templateType) => (
                                      <ActionButton
                                        key={`${client.id}:${templateType}`}
                                        label={`${hasManualTemplateGrant(templateType) ? '✓ ' : ''}${formatTemplateTypeLabel(templateType)}`}
                                        onClick={() =>
                                          void runClientAction(
                                            client.id,
                                            hasManualTemplateGrant(templateType) ? 'revoke_template' : 'grant_template',
                                            templateType,
                                          )
                                        }
                                      />
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                              {showComprehensiveAction ? (
                                <>
                                  <ActionButton
                                    label={client.hasComprehensiveAccess ? 'Remove Comprehensive Access' : 'Give Comprehensive Access'}
                                    onClick={() => void runClientAction(client.id, client.hasComprehensiveAccess ? 'revoke_comprehensive' : 'grant_comprehensive')}
                                  />
                                  {!client.hasComprehensiveAccess && !client.hasCashFlowAnalysis ? (
                                    <ActionButton
                                      label={savingTarget?.startsWith('create_cashflow:') ? 'Creating...' : 'Create Cash Flow Analysis'}
                                      onClick={async () => {
                                        if (savingTarget?.startsWith('create_cashflow:')) return;
                                        const createKey = `create_cashflow:${client.id}`;
                                        setSavingTarget(createKey);
                                        setErrorMessage(null);
                                        try {
                                          const authHeaders = await getAuthHeaders();
                                          const res = await fetch('/api/admin/clients/create-cash-flow-analysis', {
                                            method: 'POST',
                                            headers: { ...authHeaders, 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ clientId: client.id }),
                                          });
                                          const json = await res.json().catch(() => ({}));
                                          if (!res.ok) {
                                            throw new Error(json.error || 'Failed to create cash flow analysis');
                                          }
                                          await loadEverything();
                                          if (expandedClientId === client.id) {
                                            await loadClientDetail(client.id, true);
                                          }
                                        } catch (error) {
                                          setErrorMessage(error instanceof Error ? error.message : 'Failed to create cash flow analysis');
                                        } finally {
                                          setSavingTarget(null);
                                        }
                                      }}
                                    />
                                  ) : null}
                                </>
                              ) : null}
                            </div>
                          </div>
                        </td>
                      </tr>

                      {isExpanded ? (
                        <tr>
                          <td colSpan={10} className="border-b border-slate-200 bg-slate-50/70 px-2 py-3">
                            {loadingDetailId === client.id && !detail ? (
                              <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">Loading client workspace...</div>
                            ) : detail ? (
                              <ClientDetailPanel
                                detail={detail}
                                draft={draft ?? cloneDraft(detail)}
                                isEditing={true}
                                isSaving={savingTarget === `detail:${client.id}`}
                                detailError={detailError}
                                onSave={() => void saveDetail(client.id)}
                                onDraftChange={(nextDraft) => {
                                  setDraftsByClientId((current) => ({ ...current, [client.id]: nextDraft }));
                                }}
                              />
                            ) : (
                              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {detailError || 'Unable to load client details.'}
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showAddClientModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add New Client</h3>
              <button
                type="button"
                onClick={() => setShowAddClientModal(false)}
                className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600"
              >
                Close
              </button>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <input
                value={newClientName}
                onChange={(event) => setNewClientName(event.target.value)}
                placeholder="Client full name"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={newClientBusinessName}
                onChange={(event) => setNewClientBusinessName(event.target.value)}
                placeholder="Business name"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={newClientEmail}
                onChange={(event) => setNewClientEmail(event.target.value.toLowerCase())}
                placeholder="client@email.com"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2"
              />
            </div>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Services</p>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {newClientServiceOptions.map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={newClientAccess[key as keyof typeof newClientAccess]}
                      onChange={(event) => setNewClientAccess((current) => ({ ...current, [key]: event.target.checked }))}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Only one identity field is required. Add an email whenever you want this row to auto-link on the client&apos;s first login.</p>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                disabled={savingTarget === 'create_client'}
                onClick={() => void createClient()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Add Client
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ClientDetailPanel({
  detail,
  draft,
  isEditing,
  isSaving,
  detailError,
  onSave,
  onDraftChange,
}: {
  detail: ClientDetail;
  draft: ClientDetailDraft;
  isEditing: boolean;
  isSaving: boolean;
  detailError?: string;
  onSave: () => void;
  onDraftChange: (draft: ClientDetailDraft) => void;
}) {
  const yearColumns = useMemo(
    () => [
      ['year2024', '2024'],
      ['year2025', '2025'],
      ['year2026YTD', detail.cashFlowAnalysis?.financials.year2026YTD?.ytdMonth ? `2026 YTD (${detail.cashFlowAnalysis.financials.year2026YTD.ytdMonth})` : '2026 YTD'],
    ] as Array<['year2024' | 'year2025' | 'year2026YTD', string]>,
    [detail.cashFlowAnalysis],
  );

  const portalPath = '/customer-dashboard';
  const portalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/login?redirectTo=${encodeURIComponent(portalPath)}`
    : `/login?redirectTo=${encodeURIComponent(portalPath)}`;
  const previewUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/customer-dashboard?clientId=${encodeURIComponent(detail.client.id)}`
    : `/customer-dashboard?clientId=${encodeURIComponent(detail.client.id)}`;
  const comprehensiveUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/comprehensive-cash-flow-analysis?adminClientId=${encodeURIComponent(detail.client.id)}`
    : `/comprehensive-cash-flow-analysis?adminClientId=${encodeURIComponent(detail.client.id)}`;

  const copyToClipboard = async (value: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(value);
    }
  };

  const updateAccount = <K extends keyof ClientDetailDraft['account']>(key: K, value: ClientDetailDraft['account'][K]) => {
    const nextDraft: ClientDetailDraft = {
      ...draft,
      account: { ...draft.account, [key]: value },
    };

    if (key === 'fullName') {
      const fullName = typeof value === 'string' ? value : null;
      const { firstName, lastName } = splitFullName(fullName);
      nextDraft.sharedProfile = { ...nextDraft.sharedProfile, personalName: fullName };
      if (nextDraft.cashFlowAnalysis) {
        nextDraft.cashFlowAnalysis = {
          ...nextDraft.cashFlowAnalysis,
          loanInfo: { ...nextDraft.cashFlowAnalysis.loanInfo, firstName, lastName },
        };
      }
    }

    if (key === 'businessName') {
      const businessName = typeof value === 'string' ? value : null;
      nextDraft.sharedProfile = {
        ...nextDraft.sharedProfile,
        businessName,
        businessLegalName: businessName,
      };
      if (nextDraft.cashFlowAnalysis) {
        nextDraft.cashFlowAnalysis = {
          ...nextDraft.cashFlowAnalysis,
          loanInfo: { ...nextDraft.cashFlowAnalysis.loanInfo, businessName },
        };
      }
      if (nextDraft.loanRequest) {
        nextDraft.loanRequest = { ...nextDraft.loanRequest, businessName };
      }
    }

    onDraftChange(nextDraft);
  };

  const updateSharedProfile = <K extends keyof SharedProfile>(key: K, value: SharedProfile[K]) => {
    onDraftChange({
      ...draft,
      sharedProfile: { ...draft.sharedProfile, [key]: value },
    });
  };

  const updateLoanRequest = (key: keyof NonNullable<ClientDetailDraft['loanRequest']>, value: unknown) => {
    if (!draft.loanRequest) return;
    onDraftChange({
      ...draft,
      loanRequest: { ...draft.loanRequest, [key]: value } as ClientDetailDraft['loanRequest'],
    });
  };

  const applyLoanPurposeDefaults = (loanPurpose: string, desiredAmountOverride?: number | null) => {
    if (!draft.cashFlowAnalysis) return;
    const purpose = loanPurposes[loanPurpose as keyof typeof loanPurposes];
    const desiredAmount = desiredAmountOverride ?? draft.cashFlowAnalysis.loanInfo.desiredAmount ?? 0;

    if (!purpose) {
      onDraftChange({
        ...draft,
        cashFlowAnalysis: {
          ...draft.cashFlowAnalysis,
          loanInfo: { ...draft.cashFlowAnalysis.loanInfo, loanPurpose },
        },
      });
      return;
    }

    const downPaymentPct = purpose.defaultDownPaymentPct ?? 0;
    const downPayment = Math.round(desiredAmount * downPaymentPct);
    const proposedLoan = Math.max(0, desiredAmount - downPayment);
    const estimatedPayment = Math.round(calculateMonthlyPayment(proposedLoan, purpose.defaultRate, purpose.defaultTerm, purpose.paymentMode));

    onDraftChange({
      ...draft,
      cashFlowAnalysis: {
        ...draft.cashFlowAnalysis,
        loanInfo: {
          ...draft.cashFlowAnalysis.loanInfo,
          loanPurpose,
          term: String(purpose.defaultTerm),
          amortization: String(purpose.defaultTerm),
          interestRate: Number((purpose.defaultRate * 100).toFixed(2)),
          downPayment,
          downPayment293: `${Number((downPaymentPct * 100).toFixed(2))}%`,
          proposedLoan,
          estimatedPayment,
          annualizedLoan: estimatedPayment * 12,
        },
      },
    });
  };

  const recalculateLoanPayment = (updatedLoanInfo?: Partial<NonNullable<ClientDetailDraft['cashFlowAnalysis']>['loanInfo']>) => {
    if (!draft.cashFlowAnalysis) return;
    const loanInfo = updatedLoanInfo ? { ...draft.cashFlowAnalysis.loanInfo, ...updatedLoanInfo } : draft.cashFlowAnalysis.loanInfo;
    const { proposedLoan, interestRate, amortization } = loanInfo;
    const loanPurpose = loanInfo.loanPurpose;
    const config = loanPurposes[loanPurpose as keyof typeof loanPurposes];
    const paymentMode = config?.paymentMode ?? 'amortized';

    const principal = parseCurrencyNumber(proposedLoan);
    const rate = parseCurrencyNumber(interestRate) / 100;
    const months = parseCurrencyNumber(amortization);

    if (!principal || !rate || !months) return;

    const estimatedPayment = Math.round(calculateMonthlyPayment(principal, rate, months, paymentMode));
    const annualizedLoan = estimatedPayment * 12;

    onDraftChange({
      ...draft,
      cashFlowAnalysis: {
        ...draft.cashFlowAnalysis,
        id: draft.cashFlowAnalysis.id,
        status: draft.cashFlowAnalysis.status,
        updatedAt: draft.cashFlowAnalysis.updatedAt,
        dscr: draft.cashFlowAnalysis.dscr,
        loanInfo: {
          ...loanInfo,
          estimatedPayment,
          annualizedLoan,
        },
        financials: draft.cashFlowAnalysis.financials,
        debts: draft.cashFlowAnalysis.debts,
      },
    });
  };

  const updateCashFlowLoanInfo = (key: keyof NonNullable<ClientDetailDraft['cashFlowAnalysis']>['loanInfo'], value: unknown) => {
    if (!draft.cashFlowAnalysis) return;
    onDraftChange({
      ...draft,
      cashFlowAnalysis: {
        ...draft.cashFlowAnalysis,
        id: draft.cashFlowAnalysis.id,
        status: draft.cashFlowAnalysis.status,
        updatedAt: draft.cashFlowAnalysis.updatedAt,
        dscr: draft.cashFlowAnalysis.dscr,
        loanInfo: { ...draft.cashFlowAnalysis.loanInfo, [key]: value },
        financials: draft.cashFlowAnalysis.financials,
        debts: draft.cashFlowAnalysis.debts,
      },
    });
  };

  const updateFinancialInput = (
    year: keyof NonNullable<ClientDetailDraft['cashFlowAnalysis']>['financials'],
    field: keyof FinancialInput,
    value: string,
  ) => {
    if (!draft.cashFlowAnalysis) return;
    const currentInput = draft.cashFlowAnalysis.financials[year].input ?? {};
    onDraftChange({
      ...draft,
      cashFlowAnalysis: {
        ...draft.cashFlowAnalysis,
        financials: {
          ...draft.cashFlowAnalysis.financials,
          [year]: {
            ...draft.cashFlowAnalysis.financials[year],
            input: {
              ...currentInput,
              [field]: formatCurrencyInput(value),
            },
          },
        },
      },
    });
  };

  const updateYtdMonth = (value: string) => {
    if (!draft.cashFlowAnalysis) return;
    onDraftChange({
      ...draft,
      cashFlowAnalysis: {
        ...draft.cashFlowAnalysis,
        financials: {
          ...draft.cashFlowAnalysis.financials,
          year2026YTD: {
            ...draft.cashFlowAnalysis.financials.year2026YTD,
            ytdMonth: value,
          },
        },
      },
    });
  };

  const liveFinancialSummary = (year: keyof NonNullable<ClientDetailDraft['cashFlowAnalysis']>['financials']) => {
    const input = draft.cashFlowAnalysis?.financials[year].input ?? detail.cashFlowAnalysis?.financials[year].input;
    const summary = calculateFinancialSummary(input);
    return summary;
  };

  const annualizedLoanPayment = (year: keyof NonNullable<ClientDetailDraft['cashFlowAnalysis']>['financials']): number => {
    const annualizedLoan = draft.cashFlowAnalysis?.loanInfo.annualizedLoan ?? detail.cashFlowAnalysis?.loanInfo.annualizedLoan ?? 0;
    if (year === 'year2026YTD') {
      const month = draft.cashFlowAnalysis?.financials.year2026YTD.ytdMonth ?? detail.cashFlowAnalysis?.financials.year2026YTD.ytdMonth ?? '';
      const monthCount = Math.max(1, monthOptions.indexOf(month) + 1 || 12);
      return Math.round((annualizedLoan / 12) * monthCount);
    }
    return annualizedLoan;
  };

  const businessDebtServiceByCategory = (year: keyof NonNullable<ClientDetailDraft['cashFlowAnalysis']>['financials']) => {
    const debts = draft.cashFlowDebts ?? [];
    const categories = ['REAL_ESTATE', 'VEHICLE_EQUIPMENT', 'CREDIT_CARD', 'LINE_OF_CREDIT', 'OTHER'];
    const result: Record<string, number> = {};
    
    for (const category of categories) {
      const monthlyPayment = debts
        .filter((debt) => debt.category === category)
        .reduce((total, debt) => total + parseCurrencyNumber(debt.monthlyPayment), 0);
      
      if (year === 'year2026YTD') {
        const month = draft.cashFlowAnalysis?.financials.year2026YTD.ytdMonth ?? detail.cashFlowAnalysis?.financials.year2026YTD.ytdMonth ?? '';
        const monthCount = Math.max(1, monthOptions.indexOf(month) + 1 || 12);
        result[category] = Math.round(monthlyPayment * monthCount);
      } else {
        result[category] = monthlyPayment * 12;
      }
    }
    
    return result;
  };

  const totalBusinessDebtService = (year: keyof NonNullable<ClientDetailDraft['cashFlowAnalysis']>['financials']): number => {
    const categoryTotals = businessDebtServiceByCategory(year);
    return Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
  };

  const totalDebtService = (year: keyof NonNullable<ClientDetailDraft['cashFlowAnalysis']>['financials']): number => {
    return annualizedLoanPayment(year) + totalBusinessDebtService(year);
  };

  const liveDscr = (year: keyof NonNullable<ClientDetailDraft['cashFlowAnalysis']>['financials']): number | null => {
    const debtService = totalDebtService(year);
    if (!debtService) return null;
    return liveFinancialSummary(year).adjustedEbitda / debtService;
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{detail.client.fullName || detail.client.email || 'Untitled Client'}</h3>
              {detail.client.services.map((service) => (
                <ServiceBadge key={`detail:${service.key}`} label={service.label} />
              ))}
            </div>
            <p className="mt-1 text-sm text-slate-600">{detail.client.email || '-'}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-slate-500">
              {detail.client.hasAccount ? 'Linked Auth User' : 'Pre-Account Client Record'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {detailError ? (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{detailError}</div>
        ) : null}

        <div className="mt-4 grid gap-2 md:grid-cols-4">
          <InfoCard label="Current DSCR" value={formatDscr(detail.client.dscr.currentValue)} detail={detail.client.dscr.currentYear ?? '-'} />
          <InfoCard label="Last Update" value={formatDate(detail.client.lastUpdate)} detail="Latest touchpoint" />
          <InfoCard label="Template Progress" value={`${detail.templateSummary.progressPct}%`} detail={detail.templateSummary.nextStep} />
          <InfoCard
            label="Packaging Progress"
            value={detail.packaging?.progress ? `${detail.packaging.progress.percentage}%` : '-'}
            detail={detail.packaging?.progress?.nextRequirement?.displayName ?? 'No active package'}
          />
        </div>
      </div>

      <div className="space-y-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle title="White-Label Client Command Center" subtitle="Pipeline, lender matching, internal scoring, and client-facing access links for broker/consultant workflows." />
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <LabeledField label="Deal Stage">
              <select value={draft.account.dealStage} onChange={(event) => updateAccount('dealStage', event.target.value as DealStage)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {dealStageOptions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </LabeledField>
            <LabeledField label="Priority">
              <select value={draft.account.priority} onChange={(event) => updateAccount('priority', event.target.value as Priority)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {priorityOptions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </LabeledField>
            <LabeledField label="Selected Path">
              <select value={draft.account.selectedPath ?? 'undecided'} onChange={(event) => updateAccount('selectedPath', event.target.value as SelectedPath)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {selectedPathOptions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </LabeledField>
            <LabeledField label="Lender Status">
              <select value={draft.account.lenderStatus} onChange={(event) => updateAccount('lenderStatus', event.target.value as LenderStatus)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {lenderStatusOptions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </LabeledField>
            <LabeledField label="Estimated Broker Fee">
              <input value={draft.account.estimatedBrokerFee ?? ''} onChange={(event) => updateAccount('estimatedBrokerFee', event.target.value === '' ? null : Number(event.target.value))} placeholder="2500" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </LabeledField>
            <LabeledField label="Target Close Date">
              <input value={draft.account.targetCloseDate ?? ''} onChange={(event) => updateAccount('targetCloseDate', event.target.value || null)} type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </LabeledField>
            <LabeledField label="Last Contacted">
              <button type="button" onClick={() => updateAccount('lastContactedAt', new Date().toISOString())} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-700">{draft.account.lastContactedAt ? formatDate(draft.account.lastContactedAt) : 'Mark contacted now'}</button>
            </LabeledField>
          </div>
          <div className="mt-3 grid gap-3">
            <LabeledField label="Client Portal Message">
              <textarea value={draft.account.portalMessage ?? ''} onChange={(event) => updateAccount('portalMessage', event.target.value || null)} rows={4} placeholder="Tell the client what to complete next or answer a question they had." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </LabeledField>
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-900">Client Portal Link</p>
              <p className="mt-1 text-[11px] text-slate-500">Send this when the client should log in and continue their assigned services.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => void copyToClipboard(portalUrl)} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Copy Portal Link</button>
                <button type="button" onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">Preview</button>
              </div>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs font-bold text-blue-950">Admin Prefill Link</p>
              <p className="mt-1 text-[11px] text-blue-800">Open the comprehensive form as admin to prefill what you already know.</p>
              <button type="button" onClick={() => window.open(comprehensiveUrl, '_blank', 'noopener,noreferrer')} className="mt-3 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white">Open Prefill</button>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-bold text-emerald-950">Lender Matching Signal</p>
              <p className="mt-1 text-[11px] text-emerald-800">DSCR {formatDscr(detail.client.dscr.currentValue)} • Package {detail.packaging?.progress ? `${detail.packaging.progress.percentage}%` : 'not started'} • Fee {formatMoney(draft.account.estimatedBrokerFee)}</p>
              <button type="button" onClick={() => updateAccount('dealStage', 'lender_feeler_ready')} className="mt-3 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">Mark Feeler Ready</button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle title="Client Profile" subtitle="Admin-editable profile fields synced with the comprehensive cash flow page." />
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <LabeledField label="Full Name">
              {isEditing ? (
                <input
                  value={draft.account.fullName ?? ''}
                  onChange={(event) => updateAccount('fullName', event.target.value || null)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.account.fullName || '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Business Name">
              {isEditing ? (
                <input
                  value={draft.account.businessName ?? ''}
                  onChange={(event) => updateAccount('businessName', event.target.value || null)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.account.businessName || '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Email">
              {isEditing && !detail.client.hasAccount ? (
                <input
                  value={draft.account.email}
                  onChange={(event) => updateAccount('email', event.target.value.toLowerCase())}
                  placeholder="client@email.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.account.email || '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Phone">
              <input value={draft.account.phone ?? ''} onChange={(event) => updateAccount('phone', event.target.value || null)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </LabeledField>
            <LabeledField label="Client Role">
              <input value={draft.account.companyRole ?? ''} onChange={(event) => updateAccount('companyRole', event.target.value || null)} placeholder="Owner, CFO, partner" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </LabeledField>
            <LabeledField label="Lead Source">
              <input value={draft.account.leadSource ?? ''} onChange={(event) => updateAccount('leadSource', event.target.value || null)} placeholder="Google Ads, LinkedIn, referral" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </LabeledField>
            <LabeledField label="Service Level">
              {isEditing ? (
                <select
                  value={draft.account.serviceLevel !== 'none'
                    ? draft.account.serviceLevel
                    : draft.account.accessComprehensive
                      ? 'comprehensive'
                      : draft.account.accessPackaging
                        ? 'packaging'
                        : draft.account.accessTemplates
                          ? 'templates'
                          : 'none'}
                  onChange={(event) => updateAccount('serviceLevel', event.target.value as ClientDetailDraft['account']['serviceLevel'])}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="none">None</option>
                  <option value="comprehensive">Comprehensive</option>
                  <option value="templates">Templates</option>
                  <option value="packaging">Packaging</option>
                  <option value="brokering">Brokering</option>
                </select>
              ) : (
                <StaticValue>
                  {detail.account.serviceLevel !== 'none'
                    ? detail.account.serviceLevel
                    : detail.account.accessComprehensive
                      ? 'comprehensive'
                      : detail.account.accessPackaging
                        ? 'packaging'
                        : detail.account.accessTemplates
                          ? 'templates'
                          : 'none'}
                </StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Requested Loan Amount">
              {isEditing ? (
                <input
                  value={draft.sharedProfile.loanAmount ?? ''}
                  onChange={(event) => updateSharedProfile('loanAmount', event.target.value === '' ? null : Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{formatMoney(detail.sharedProfile.loanAmount)}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Annual Revenue">
              {isEditing ? (
                <input
                  value={draft.sharedProfile.annualRevenue ?? ''}
                  onChange={(event) => updateSharedProfile('annualRevenue', event.target.value === '' ? null : Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{formatMoney(detail.sharedProfile.annualRevenue)}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Access Toggles">
              {isEditing ? (
                <div className="space-y-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={draft.account.accessTemplates}
                        onChange={(event) => updateAccount('accessTemplates', event.target.checked)}
                      />
                      Templates
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={draft.account.accessPackaging}
                        onChange={(event) => updateAccount('accessPackaging', event.target.checked)}
                      />
                      Packaging
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={draft.account.accessComprehensive}
                        onChange={(event) => updateAccount('accessComprehensive', event.target.checked)}
                      />
                      Comprehensive
                    </label>
                  </div>
                  {draft.account.accessTemplates ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Template Access</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="flex items-center gap-2 font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={draft.account.grantedTemplateTypes.length === TEMPLATE_TYPES.length}
                            onChange={(event) => updateAccount('grantedTemplateTypes', event.target.checked ? [...TEMPLATE_TYPES] : [])}
                          />
                          All Templates
                        </label>
                        {TEMPLATE_TYPES.map((templateType) => (
                          <label key={templateType} className="flex items-center gap-2 text-slate-700">
                            <input
                              type="checkbox"
                              checked={draft.account.grantedTemplateTypes.includes(templateType)}
                              onChange={() => updateAccount('grantedTemplateTypes', toggleTemplateGrant(draft.account.grantedTemplateTypes, templateType))}
                            />
                            {formatTemplateTypeLabel(templateType)}
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <StaticValue>
                  {[
                    detail.account.accessTemplates ? 'Templates' : null,
                    detail.account.accessPackaging ? 'Packaging' : null,
                    detail.account.accessComprehensive ? 'Comprehensive' : null,
                  ].filter(Boolean).join(', ') || 'No manual overrides'}
                </StaticValue>
              )}
            </LabeledField>
          </div>

          <div className="mt-3 grid gap-3">
            <LabeledField label="Business Description">
              {isEditing ? (
                <textarea
                  value={draft.sharedProfile.businessDescription ?? ''}
                  onChange={(event) => updateSharedProfile('businessDescription', event.target.value || null)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.sharedProfile.businessDescription || '-'}</StaticValue>
              )}
            </LabeledField>
          </div>
        </section>

        {detail.client.services.some((service) => service.key === 'templates') ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle title="Templates Snapshot" subtitle="Legacy template submissions tied to this client." />
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-sm font-semibold text-slate-900">{detail.templateSummary.progressPct}% complete</p>
            <p className="mt-1 text-xs text-slate-600">{detail.templateSummary.nextStep}</p>
          </div>
          <div className="mt-3 space-y-2">
            {detail.templateSummary.submissions.length > 0 ? (
              detail.templateSummary.submissions.map((submission) => (
                <div key={submission.id} className="rounded-xl border border-slate-200 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {submission.templateType.replaceAll('_', ' ')}
                        {submission.slot ? ` • Slot ${submission.slot}` : ''}
                      </p>
                      <p className="text-[11px] text-slate-500">Updated {formatDate(submission.updatedAt)}</p>
                    </div>
                    {submission.pdfUrl ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        PDF Ready
                      </span>
                    ) : (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        Draft
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No template submissions yet.</p>
            )}
            </div>
          </section>
        ) : null}
      </div>

      {detail.cashFlowAnalysis ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle title="Comprehensive Cash Flow Analysis" subtitle="Year-over-year lender inputs with admin editing." />

          <div className="mt-3 grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            <LabeledField label="Analysis Status">
              {isEditing ? (
                <select
                  value={draft.cashFlowAnalysis?.status ?? detail.cashFlowAnalysis.status}
                  onChange={(event) => {
                    if (!draft.cashFlowAnalysis) return;
                    onDraftChange({
                      ...draft,
                      cashFlowAnalysis: { ...draft.cashFlowAnalysis, status: event.target.value as 'inprogress' | 'submitted' },
                    });
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="inprogress">In Progress</option>
                  <option value="submitted">Submitted</option>
                </select>
              ) : (
                <StaticValue>{detail.cashFlowAnalysis.status}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="First Name">
              {isEditing ? (
                <input
                  value={draft.cashFlowAnalysis?.loanInfo.firstName ?? ''}
                  onChange={(event) => updateCashFlowLoanInfo('firstName', event.target.value || null)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.cashFlowAnalysis.loanInfo.firstName || '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Last Name">
              {isEditing ? (
                <input
                  value={draft.cashFlowAnalysis?.loanInfo.lastName ?? ''}
                  onChange={(event) => updateCashFlowLoanInfo('lastName', event.target.value || null)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.cashFlowAnalysis.loanInfo.lastName || '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Business Name">
              {isEditing ? (
                <input
                  value={draft.cashFlowAnalysis?.loanInfo.businessName ?? ''}
                  onChange={(event) => updateCashFlowLoanInfo('businessName', event.target.value || null)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.cashFlowAnalysis.loanInfo.businessName || '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Loan Purpose">
              {isEditing ? (
                <select
                  value={draft.cashFlowAnalysis?.loanInfo.loanPurpose ?? ''}
                  onChange={(event) => applyLoanPurposeDefaults(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Select loan purpose</option>
                  {loanPurposeOptions.map((purpose) => (
                    <option key={purpose} value={purpose}>{purpose}</option>
                  ))}
                </select>
              ) : (
                <StaticValue>{detail.cashFlowAnalysis.loanInfo.loanPurpose || '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Desired Amount">
              {isEditing ? (
                <input
                  value={formatCurrencyInput(draft.cashFlowAnalysis?.loanInfo.desiredAmount)}
                  onChange={(event) => updateCashFlowLoanInfo('desiredAmount', event.target.value === '' ? null : parseCurrencyNumber(event.target.value))}
                  onBlur={() => {
                    const loanPurpose = draft.cashFlowAnalysis?.loanInfo.loanPurpose;
                    if (loanPurpose) {
                      applyLoanPurposeDefaults(loanPurpose, draft.cashFlowAnalysis?.loanInfo.desiredAmount ?? null);
                    }
                  }}
                  inputMode="decimal"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{formatMoney(detail.cashFlowAnalysis.loanInfo.desiredAmount)}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Estimated Payment">
              {isEditing ? (
                <input
                  value={formatCurrencyInput(draft.cashFlowAnalysis?.loanInfo.estimatedPayment)}
                  onChange={(event) => updateCashFlowLoanInfo('estimatedPayment', event.target.value === '' ? null : parseCurrencyNumber(event.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{formatMoney(detail.cashFlowAnalysis.loanInfo.estimatedPayment)}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Annualized Loan">
              {isEditing ? (
                <input
                  value={formatCurrencyInput(draft.cashFlowAnalysis?.loanInfo.annualizedLoan)}
                  onChange={(event) => updateCashFlowLoanInfo('annualizedLoan', event.target.value === '' ? null : parseCurrencyNumber(event.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{formatMoney(detail.cashFlowAnalysis.loanInfo.annualizedLoan)}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Loan Term">
              {isEditing ? (
                <select
                  value={draft.cashFlowAnalysis?.loanInfo.term ?? ''}
                  onChange={(event) => {
                    const value = event.target.value || null;
                    if (!draft.cashFlowAnalysis) return;
                    recalculateLoanPayment({ term: value, amortization: value });
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Select term</option>
                  {termOptions.map((opt) => (
                    <option key={opt.months} value={String(opt.months)}>
                      {opt.years} Year{opt.years !== 1 ? 's' : ''} ({opt.months} months)
                    </option>
                  ))}
                </select>
              ) : (
                <StaticValue>{detail.cashFlowAnalysis.loanInfo.term || '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Interest Rate">
              {isEditing ? (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft.cashFlowAnalysis?.loanInfo.interestRate ?? ''}
                  onChange={(event) => {
                    const rawValue = event.target.value;
                    if (!draft.cashFlowAnalysis) return;
                    
                    // Allow empty string or valid number format (including decimals)
                    if (rawValue === '') {
                      recalculateLoanPayment({ interestRate: null });
                      return;
                    }
                    
                    // Validate it's a number (allow decimals)
                    const numValue = Number(rawValue);
                    if (Number.isNaN(numValue)) {
                      return; // Don't update if invalid
                    }
                    
                    recalculateLoanPayment({ interestRate: numValue });
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.cashFlowAnalysis.loanInfo.interestRate != null ? `${detail.cashFlowAnalysis.loanInfo.interestRate}%` : '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Amortization">
              {isEditing ? (
                <select
                  value={draft.cashFlowAnalysis?.loanInfo.amortization ?? ''}
                  onChange={(event) => {
                    const value = event.target.value || null;
                    if (!draft.cashFlowAnalysis) return;
                    recalculateLoanPayment({ amortization: value });
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Select amortization</option>
                  {amortizationOptions.map((opt) => (
                    <option key={opt.months} value={String(opt.months)}>
                      {opt.years} Year{opt.years !== 1 ? 's' : ''} ({opt.months} months)
                    </option>
                  ))}
                </select>
              ) : (
                <StaticValue>{detail.cashFlowAnalysis.loanInfo.amortization || '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Down Payment">
              {isEditing ? (
                <input
                  value={formatCurrencyInput(draft.cashFlowAnalysis?.loanInfo.downPayment)}
                  onChange={(event) => {
                    updateCashFlowLoanInfo('downPayment', event.target.value === '' ? null : parseCurrencyNumber(event.target.value));
                    recalculateLoanPayment();
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{formatMoney(detail.cashFlowAnalysis.loanInfo.downPayment)}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Down Payment %">
              {isEditing ? (
                <input
                  value={draft.cashFlowAnalysis?.loanInfo.downPayment293 ?? ''}
                  onChange={(event) => updateCashFlowLoanInfo('downPayment293', event.target.value || null)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.cashFlowAnalysis.loanInfo.downPayment293 || '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Proposed Loan">
              {isEditing ? (
                <input
                  value={formatCurrencyInput(draft.cashFlowAnalysis?.loanInfo.proposedLoan)}
                  onChange={(event) => {
                    updateCashFlowLoanInfo('proposedLoan', event.target.value === '' ? null : parseCurrencyNumber(event.target.value));
                    recalculateLoanPayment();
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{formatMoney(detail.cashFlowAnalysis.loanInfo.proposedLoan)}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="2026 YTD Month">
              {isEditing ? (
                <select
                  value={draft.cashFlowAnalysis?.financials.year2026YTD.ytdMonth ?? ''}
                  onChange={(event) => updateYtdMonth(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Select month</option>
                  {monthOptions.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              ) : (
                <StaticValue>{detail.cashFlowAnalysis.financials.year2026YTD.ytdMonth || '-'}</StaticValue>
              )}
            </LabeledField>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[720px] table-fixed text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="w-[220px] px-3 py-2 text-left font-semibold">Cash Flow Input</th>
                  {yearColumns.map(([year, label]) => (
                    <th key={year} className="w-[165px] px-3 py-2 text-right font-semibold">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* OPERATIONS SECTION */}
                <tr className="border-t-2 border-slate-300 bg-slate-100">
                  <td className="px-3 py-2 font-bold text-slate-900 text-xs uppercase tracking-wide">Operations</td>
                  {yearColumns.map(([year]) => (
                    <td key={`ops-header:${year}`} className="px-3 py-2"></td>
                  ))}
                </tr>
                {['revenue', 'cogs'].map((field) => (
                  <tr key={field} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-900 flex items-center gap-1">
                      {field === 'cogs' ? <span className="text-rose-600">-</span> : null}
                      {CASH_FLOW_FIELD_LABELS[field as keyof FinancialInput]}
                    </td>
                    {yearColumns.map(([year]) => (
                      <td key={`${field}:${year}`} className="w-[165px] px-3 py-2 text-right">
                        {isEditing ? (
                          <input
                            value={draft.cashFlowAnalysis?.financials[year].input[field as keyof FinancialInput] ?? ''}
                            onChange={(event) => updateFinancialInput(year, field as keyof FinancialInput, event.target.value)}
                            className="w-[140px] rounded-lg border border-slate-200 px-2 py-1 text-right text-sm"
                          />
                        ) : (
                          <span className="font-medium text-slate-700">
                            {draft.cashFlowAnalysis?.financials[year].input[field as keyof FinancialInput]
                              ? draft.cashFlowAnalysis.financials[year].input[field as keyof FinancialInput]
                              : '$0'}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-slate-200 bg-blue-50/50">
                  <td className="px-3 py-2 font-semibold text-slate-900 flex items-center gap-1">
                    <span className="text-blue-600">=</span> Gross Profit
                  </td>
                  {yearColumns.map(([year]) => (
                    <td key={`gross-profit:${year}`} className="px-3 py-2 text-right font-semibold text-slate-900">
                      {formatMoney(liveFinancialSummary(year).grossProfit)}
                    </td>
                  ))}
                </tr>
                {['operatingExpenses'].map((field) => (
                  <tr key={field} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-900 flex items-center gap-1">
                      <span className="text-rose-600">-</span>
                      {CASH_FLOW_FIELD_LABELS[field as keyof FinancialInput]}
                    </td>
                    {yearColumns.map(([year]) => (
                      <td key={`${field}:${year}`} className="w-[165px] px-3 py-2 text-right">
                        {isEditing ? (
                          <input
                            value={draft.cashFlowAnalysis?.financials[year].input[field as keyof FinancialInput] ?? ''}
                            onChange={(event) => updateFinancialInput(year, field as keyof FinancialInput, event.target.value)}
                            className="w-[140px] rounded-lg border border-slate-200 px-2 py-1 text-right text-sm"
                          />
                        ) : (
                          <span className="font-medium text-slate-700">
                            {draft.cashFlowAnalysis?.financials[year].input[field as keyof FinancialInput]
                              ? draft.cashFlowAnalysis.financials[year].input[field as keyof FinancialInput]
                              : '$0'}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-slate-200 bg-blue-50/50">
                  <td className="px-3 py-2 font-semibold text-slate-900 flex items-center gap-1">
                    <span className="text-blue-600">=</span> Operating Income
                  </td>
                  {yearColumns.map(([year]) => (
                    <td key={`operating-income:${year}`} className="px-3 py-2 text-right font-semibold text-slate-900">
                      {formatMoney(liveFinancialSummary(year).operatingIncome)}
                    </td>
                  ))}
                </tr>

                {/* OTHER INCOME / EXPENSE SECTION */}
                <tr className="border-t-2 border-slate-300 bg-slate-100">
                  <td className="px-3 py-2 font-bold text-slate-900 text-xs uppercase tracking-wide">Other Income / Expense</td>
                  {yearColumns.map(([year]) => (
                    <td key={`other-header:${year}`} className="px-3 py-2"></td>
                  ))}
                </tr>
                {['otherIncome', 'interestIncome', 'interest', 'taxes'].map((field) => (
                  <tr key={field} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-900 flex items-center gap-1">
                      {field === 'otherIncome' || field === 'interestIncome' ? <span className="text-emerald-600">+</span> : null}
                      {field === 'interest' || field === 'taxes' ? <span className="text-rose-600">-</span> : null}
                      {CASH_FLOW_FIELD_LABELS[field as keyof FinancialInput]}
                    </td>
                    {yearColumns.map(([year]) => (
                      <td key={`${field}:${year}`} className="w-[165px] px-3 py-2 text-right">
                        {isEditing ? (
                          <input
                            value={draft.cashFlowAnalysis?.financials[year].input[field as keyof FinancialInput] ?? ''}
                            onChange={(event) => updateFinancialInput(year, field as keyof FinancialInput, event.target.value)}
                            className="w-[140px] rounded-lg border border-slate-200 px-2 py-1 text-right text-sm"
                          />
                        ) : (
                          <span className="font-medium text-slate-700">
                            {draft.cashFlowAnalysis?.financials[year].input[field as keyof FinancialInput]
                              ? draft.cashFlowAnalysis.financials[year].input[field as keyof FinancialInput]
                              : '$0'}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-slate-200 bg-blue-50/50">
                  <td className="px-3 py-2 font-semibold text-slate-900 flex items-center gap-1">
                    <span className="text-blue-600">=</span> Net Income
                  </td>
                  {yearColumns.map(([year]) => (
                    <td key={`net-income:${year}`} className="px-3 py-2 text-right font-semibold text-slate-900">
                      {formatMoney(liveFinancialSummary(year).netIncome)}
                    </td>
                  ))}
                </tr>

                {/* LENDER ADJUSTMENTS SECTION */}
                <tr className="border-t-2 border-slate-300 bg-slate-100">
                  <td className="px-3 py-2 font-bold text-slate-900 text-xs uppercase tracking-wide">Lender Adjustments</td>
                  {yearColumns.map(([year]) => (
                    <td key={`lender-header:${year}`} className="px-3 py-2"></td>
                  ))}
                </tr>
                {['depreciation', 'amortization'].map((field) => (
                  <tr key={field} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-900 flex items-center gap-1">
                      <span className="text-emerald-600">+</span>
                      {CASH_FLOW_FIELD_LABELS[field as keyof FinancialInput]}
                    </td>
                    {yearColumns.map(([year]) => (
                      <td key={`${field}:${year}`} className="w-[165px] px-3 py-2 text-right">
                        {isEditing ? (
                          <input
                            value={draft.cashFlowAnalysis?.financials[year].input[field as keyof FinancialInput] ?? ''}
                            onChange={(event) => updateFinancialInput(year, field as keyof FinancialInput, event.target.value)}
                            className="w-[140px] rounded-lg border border-slate-200 px-2 py-1 text-right text-sm"
                          />
                        ) : (
                          <span className="font-medium text-slate-700">
                            {draft.cashFlowAnalysis?.financials[year].input[field as keyof FinancialInput]
                              ? draft.cashFlowAnalysis.financials[year].input[field as keyof FinancialInput]
                              : '$0'}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-slate-200 bg-blue-50/50">
                  <td className="px-3 py-2 font-semibold text-slate-900 flex items-center gap-1">
                    <span className="text-blue-600">=</span> EBITDA
                  </td>
                  {yearColumns.map(([year]) => (
                    <td key={`ebitda:${year}`} className="px-3 py-2 text-right font-semibold text-slate-900">
                      {formatMoney(liveFinancialSummary(year).ebitda)}
                    </td>
                  ))}
                </tr>
                {['nonRecurringExpenses', 'nonRecurringIncome'].map((field) => (
                  <tr key={field} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-900 flex items-center gap-1">
                      {field === 'nonRecurringExpenses' ? <span className="text-emerald-600">+</span> : null}
                      {field === 'nonRecurringIncome' ? <span className="text-rose-600">-</span> : null}
                      {CASH_FLOW_FIELD_LABELS[field as keyof FinancialInput]}
                    </td>
                    {yearColumns.map(([year]) => (
                      <td key={`${field}:${year}`} className="w-[165px] px-3 py-2 text-right">
                        {isEditing ? (
                          <input
                            value={draft.cashFlowAnalysis?.financials[year].input[field as keyof FinancialInput] ?? ''}
                            onChange={(event) => updateFinancialInput(year, field as keyof FinancialInput, event.target.value)}
                            className="w-[140px] rounded-lg border border-slate-200 px-2 py-1 text-right text-sm"
                          />
                        ) : (
                          <span className="font-medium text-slate-700">
                            {draft.cashFlowAnalysis?.financials[year].input[field as keyof FinancialInput]
                              ? draft.cashFlowAnalysis.financials[year].input[field as keyof FinancialInput]
                              : '$0'}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-slate-200 bg-blue-50/50">
                  <td className="px-3 py-2 font-semibold text-slate-900 flex items-center gap-1">
                    <span className="text-blue-600">=</span> Adjusted EBITDA
                  </td>
                  {yearColumns.map(([year]) => (
                    <td key={`adjusted-ebitda:${year}`} className="px-3 py-2 text-right font-semibold text-slate-900">
                      {formatMoney(liveFinancialSummary(year).adjustedEbitda)}
                    </td>
                  ))}
                </tr>
                {/* DEBT COVERAGE SECTION */}
                <tr className="border-t-2 border-slate-300 bg-slate-100">
                  <td className="px-3 py-2 font-bold text-slate-900 text-xs uppercase tracking-wide">Debt Coverage</td>
                  {yearColumns.map(([year]) => (
                    <td key={`debt-header:${year}`} className="px-3 py-2"></td>
                  ))}
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="px-3 py-2 font-medium text-slate-700">Annualized Loan Payment</td>
                  {yearColumns.map(([year]) => (
                    <td key={`annualized-loan:${year}`} className="px-3 py-2 text-right text-slate-700">
                      {formatMoney(annualizedLoanPayment(year))}
                    </td>
                  ))}
                </tr>
                {['REAL_ESTATE', 'VEHICLE_EQUIPMENT', 'CREDIT_CARD', 'LINE_OF_CREDIT', 'OTHER'].map((category) => {
                  const categoryTotals = businessDebtServiceByCategory('year2024');
                  const hasDebts = (categoryTotals[category] ?? 0) > 0;
                  if (!hasDebts) return null;
                  const label = category.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <tr key={category} className="border-t border-slate-200">
                      <td className="px-3 py-2 font-medium text-slate-700">{label} Debt Service</td>
                      {yearColumns.map(([year]) => (
                        <td key={`${category}:${year}`} className="px-3 py-2 text-right text-slate-700">
                          {formatMoney(businessDebtServiceByCategory(year)[category] ?? 0)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                <tr className="border-t border-slate-200 bg-blue-50/50">
                  <td className="px-3 py-2 font-semibold text-slate-900 flex items-center gap-1">
                    <span className="text-blue-600">=</span> Total Debt Service
                  </td>
                  {yearColumns.map(([year]) => (
                    <td key={`debt-service:${year}`} className="px-3 py-2 text-right font-semibold text-slate-900">
                      {formatMoney(totalDebtService(year))}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-slate-200 bg-blue-50/50">
                  <td className="px-3 py-2 font-semibold text-slate-900 flex items-center gap-1">
                    <span className="text-blue-600">=</span> DSCR
                  </td>
                  {yearColumns.map(([year]) => (
                    <td key={`dscr:${year}`} className="px-3 py-2 text-right font-semibold text-slate-900">
                      {formatDscr(liveDscr(year))}
                    </td>
                  ))}
                </tr>
              </tbody>
              </table>
            </div>

            <div>
              <SectionTitle title="Business Debts" subtitle="Current business obligations by category." />
            {isEditing ? (
              <div className="mt-3 space-y-2">
                {(draft.cashFlowDebts ?? []).map((debt, index) => (
                  <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="grid gap-2 md:grid-cols-6">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Category</p>
                        <select
                          value={debt.category}
                          onChange={(event) => {
                            const updated = [...(draft.cashFlowDebts ?? [])];
                            updated[index] = { ...debt, category: event.target.value };
                            onDraftChange({ ...draft, cashFlowDebts: updated });
                          }}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
                        >
                          <option value="REAL_ESTATE">Real Estate</option>
                          <option value="VEHICLE_EQUIPMENT">Vehicle/Equipment</option>
                          <option value="CREDIT_CARD">Credit Card</option>
                          <option value="LINE_OF_CREDIT">Line of Credit</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Description</p>
                        <input
                          value={debt.description}
                          onChange={(event) => {
                            const updated = [...(draft.cashFlowDebts ?? [])];
                            updated[index] = { ...debt, description: event.target.value };
                            onDraftChange({ ...draft, cashFlowDebts: updated });
                          }}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Balance</p>
                        <input
                          value={formatCurrencyInput(debt.outstandingBalance)}
                          onChange={(event) => {
                            const updated = [...(draft.cashFlowDebts ?? [])];
                            updated[index] = { ...debt, outstandingBalance: formatCurrencyInput(event.target.value) };
                            onDraftChange({ ...draft, cashFlowDebts: updated });
                          }}
                          inputMode="decimal"
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Payment</p>
                        <input
                          value={formatCurrencyInput(debt.monthlyPayment)}
                          onChange={(event) => {
                            const updated = [...(draft.cashFlowDebts ?? [])];
                            updated[index] = { ...debt, monthlyPayment: formatCurrencyInput(event.target.value) };
                            onDraftChange({ ...draft, cashFlowDebts: updated });
                          }}
                          inputMode="decimal"
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Original</p>
                        <input
                          value={formatCurrencyInput(debt.originalLoanAmount)}
                          onChange={(event) => {
                            const updated = [...(draft.cashFlowDebts ?? [])];
                            updated[index] = { ...debt, originalLoanAmount: formatCurrencyInput(event.target.value) };
                            onDraftChange({ ...draft, cashFlowDebts: updated });
                          }}
                          inputMode="decimal"
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...(draft.cashFlowDebts ?? [])];
                            updated.splice(index, 1);
                            onDraftChange({ ...draft, cashFlowDebts: updated });
                          }}
                          className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const updated = [...(draft.cashFlowDebts ?? [])];
                    updated.push({
                      category: 'OTHER',
                      description: '',
                      monthlyPayment: '',
                      originalLoanAmount: '',
                      outstandingBalance: '',
                    });
                    onDraftChange({ ...draft, cashFlowDebts: updated });
                  }}
                  className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  + Add Debt Entry
                </button>
              </div>
            ) : (
              <>
                {detail.cashFlowAnalysis.debts && detail.cashFlowAnalysis.debts.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {detail.cashFlowAnalysis.debts.map((debt, index) => (
                      <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <div className="grid gap-2 md:grid-cols-5">
                          <div>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase">Category</p>
                            <p className="text-sm font-medium text-slate-900">{debt.category}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase">Description</p>
                            <p className="text-sm text-slate-700">{debt.description || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase">Balance</p>
                            <p className="text-sm text-slate-700">{debt.outstandingBalance || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase">Payment</p>
                            <p className="text-sm text-slate-700">{debt.monthlyPayment || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase">Original</p>
                            <p className="text-sm text-slate-700">{debt.originalLoanAmount || '-'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-sm text-slate-500">No business debts recorded.</p>
                  </div>
                )}
              </>
            )}
            </div>
          </div>
        </section>
      ) : null}

      {detail.packaging ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle title="Loan Packaging Workspace" subtitle="Uploaded files, missing requirements, and editable packaging fields." />

          <div className="mt-3 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            <LabeledField label="Service">
              <StaticValue>{detail.packaging.loanRequest.serviceType.replaceAll('_', ' ')}</StaticValue>
            </LabeledField>
            <LabeledField label="Status">
              {isEditing ? (
                <select
                  value={draft.loanRequest?.status ?? detail.packaging.loanRequest.status}
                  onChange={(event) => updateLoanRequest('status', event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="in_progress">In Progress</option>
                  <option value="submitted">Submitted</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              ) : (
                <StaticValue>{detail.packaging.loanRequest.status}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Business Name">
              {isEditing ? (
                <input
                  value={draft.loanRequest?.businessName ?? ''}
                  onChange={(event) => updateLoanRequest('businessName', event.target.value || null)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.packaging.loanRequest.businessName || '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Loan Purpose">
              {isEditing ? (
                <input
                  value={draft.loanRequest?.loanPurpose ?? ''}
                  onChange={(event) => updateLoanRequest('loanPurpose', event.target.value || null)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.packaging.loanRequest.loanPurpose || '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Loan Amount">
              {isEditing ? (
                <input
                  value={draft.loanRequest?.loanAmount ?? ''}
                  onChange={(event) => updateLoanRequest('loanAmount', event.target.value === '' ? null : Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{formatMoney(detail.packaging.loanRequest.loanAmount)}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Progress">
              <StaticValue>{detail.packaging.progress ? `${detail.packaging.progress.percentage}%` : '-'}</StaticValue>
            </LabeledField>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <LabeledField label="Annual Revenue">
              {isEditing ? (
                <input
                  value={draft.loanRequest?.annualRevenue ?? ''}
                  onChange={(event) => updateLoanRequest('annualRevenue', event.target.value === '' ? null : Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{formatMoney(detail.packaging.loanRequest.annualRevenue)}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Years In Business">
              {isEditing ? (
                <input
                  value={draft.loanRequest?.yearsInBusiness ?? ''}
                  onChange={(event) => updateLoanRequest('yearsInBusiness', event.target.value === '' ? null : Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.packaging.loanRequest.yearsInBusiness ?? '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Business Description">
              {isEditing ? (
                <textarea
                  value={draft.loanRequest?.businessDescription ?? ''}
                  onChange={(event) => updateLoanRequest('businessDescription', event.target.value || null)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.packaging.loanRequest.businessDescription || '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Strengths">
              {isEditing ? (
                <textarea
                  value={draft.loanRequest?.strengths ?? ''}
                  onChange={(event) => updateLoanRequest('strengths', event.target.value || null)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.packaging.loanRequest.strengths || '-'}</StaticValue>
              )}
            </LabeledField>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-3">
              <h4 className="text-sm font-bold text-slate-900">Uploaded / Completed</h4>
              <div className="mt-3 space-y-2">
                {detail.packaging.uploadedDocuments.length > 0 ? (
                  detail.packaging.uploadedDocuments.map((document) => (
                    <div key={document.id} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <p className="text-sm font-semibold text-emerald-900">{document.displayName}</p>
                      <p className="text-[11px] text-emerald-700">
                        {document.status} • {document.source} • {formatDate(document.updatedAt || document.uploadedAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No completed uploads yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <h4 className="text-sm font-bold text-slate-900">Needed Next</h4>
              <div className="mt-3 space-y-2">
                {detail.packaging.nextRequired.length > 0 ? (
                  detail.packaging.nextRequired.map((requirement) => (
                    <div key={requirement.requirementKey} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                      <p className="text-sm font-semibold text-amber-900">{requirement.displayName}</p>
                      <p className="text-[11px] text-amber-800">{requirement.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">All required packaging items are complete.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-1 block w-full rounded px-2 py-1 text-left text-[11px] text-slate-700 hover:bg-slate-100"
    >
      {label}
    </button>
  );
}

function ServiceBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
      {label}
    </span>
  );
}

function InfoCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-[11px] text-slate-600">{detail}</p>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
    </div>
  );
}

function LabeledField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      {children}
    </div>
  );
}

function StaticValue({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{children}</div>;
}
