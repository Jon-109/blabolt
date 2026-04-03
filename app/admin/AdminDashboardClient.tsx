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

type ClientRow = {
  id: string;
  fullName: string;
  email: string;
  service: string;
  services: ClientServicePill[];
  grantedTemplateTypes: TemplateType[];
  dscr: number | null;
  dscrYear: CashFlowYearKey | null;
  nextStep: string;
  progressPct: number;
  lastUpdate: string;
  hasAccount: boolean;
  hasTemplateAccess: boolean;
  hasPackagingAccess: boolean;
  hasComprehensiveAccess: boolean;
  hasTemplateBundleGrant: boolean;
  hasPackagingGrant: boolean;
  hasComprehensiveGrant: boolean;
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
    lastUpdate: string;
    dscr: {
      values: Record<CashFlowYearKey, number | null>;
      currentValue: number | null;
      currentYear: CashFlowYearKey | null;
    };
  };
  account: {
    fullName: string | null;
    notes: string | null;
    nextStep: string | null;
    serviceLevel: 'none' | 'comprehensive' | 'templates' | 'packaging' | 'brokering';
    accessTemplates: boolean;
    accessPackaging: boolean;
    accessComprehensive: boolean;
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
  };
};

type PackagingLoanRequest = NonNullable<ClientDetail['packaging']>['loanRequest'];
type CashFlowAnalysisDetail = NonNullable<ClientDetail['cashFlowAnalysis']>;

type ClientDetailDraft = {
  account: {
    fullName: string | null;
    email: string;
    notes: string | null;
    nextStep: string | null;
    serviceLevel: 'none' | 'comprehensive' | 'templates' | 'packaging' | 'brokering';
    accessTemplates: boolean;
    accessPackaging: boolean;
    accessComprehensive: boolean;
  };
  sharedProfile: SharedProfile;
  loanRequest: PackagingLoanRequest | null;
  cashFlowAnalysis: CashFlowAnalysisDetail | null;
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

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

function formatDscr(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '-';
  return value.toFixed(2);
}

function formatTemplateTypeLabel(value: TemplateType): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function cloneDraft(detail: ClientDetail): ClientDetailDraft {
  return {
    account: {
      fullName: detail.account.fullName,
      email: detail.account.email,
      notes: detail.account.notes,
      nextStep: detail.account.nextStep,
      serviceLevel: detail.account.serviceLevel,
      accessTemplates: detail.account.accessTemplates,
      accessPackaging: detail.account.accessPackaging,
      accessComprehensive: detail.account.accessComprehensive,
    },
    sharedProfile: JSON.parse(JSON.stringify(detail.sharedProfile)),
    loanRequest: detail.packaging ? JSON.parse(JSON.stringify(detail.packaging.loanRequest)) : null,
    cashFlowAnalysis: detail.cashFlowAnalysis ? JSON.parse(JSON.stringify(detail.cashFlowAnalysis)) : null,
  };
}

export default function AdminDashboardClient() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingTarget, setSavingTarget] = useState<string | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [detailsByClientId, setDetailsByClientId] = useState<Record<string, ClientDetail>>({});
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
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
    const trimmedEmail = newClientEmail.trim().toLowerCase();

    if (!trimmedName && !trimmedEmail) {
      setErrorMessage('Enter at least a client name or email.');
      return;
    }

    setSavingTarget('create_client');
    setErrorMessage(null);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: trimmedName, email: trimmedEmail }),
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
      setNewClientEmail('');
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
      setEditingClientId((current) => (current === clientId ? null : current));
      return;
    }

    setExpandedClientId(clientId);
    await loadClientDetail(clientId);
  };

  const beginEditing = async (clientId: string) => {
    const detail = detailsByClientId[clientId] ?? await loadClientDetail(clientId);
    if (!detail) return;

    setDraftsByClientId((current) => ({ ...current, [clientId]: cloneDraft(detail) }));
    setEditingClientId(clientId);
  };

  const cancelEditing = (clientId: string) => {
    setEditingClientId((current) => (current === clientId ? null : current));
    setDraftsByClientId((current) => {
      const next = { ...current };
      delete next[clientId];
      return next;
    });
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
            notes: draft.account.notes,
            nextStep: draft.account.nextStep,
            serviceLevel: draft.account.serviceLevel,
            accessTemplates: draft.account.accessTemplates,
            accessPackaging: draft.account.accessPackaging,
            accessComprehensive: draft.account.accessComprehensive,
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
              interestRate: draft.cashFlowAnalysis.loanInfo.interestRate,
              downPayment: draft.cashFlowAnalysis.loanInfo.downPayment,
              downPayment293: draft.cashFlowAnalysis.loanInfo.downPayment293,
              proposedLoan: draft.cashFlowAnalysis.loanInfo.proposedLoan,
              financials: draft.cashFlowAnalysis.financials,
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
      setEditingClientId(null);
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
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Email</th>
                  <th className="px-2 py-2">Services</th>
                  <th className="px-2 py-2">DSCR</th>
                  <th className="px-2 py-2">Next Step</th>
                  <th className="px-2 py-2">Progress</th>
                  <th className="px-2 py-2">Last Update</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => {
                  const isExpanded = expandedClientId === client.id;
                  const detail = detailsByClientId[client.id];
                  const draft = draftsByClientId[client.id];
                  const isEditing = editingClientId === client.id;
                  const detailError = detailErrors[client.id];

                  const hasManualTemplateGrant = (templateType: TemplateType) => client.grantedTemplateTypes.includes(templateType);
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
                            <span>{client.fullName || '-'}</span>
                            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                              {isExpanded ? 'Open' : 'View'}
                            </span>
                          </div>
                        </td>
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
                          <p className="font-semibold text-slate-900">{formatDscr(client.dscr)}</p>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500">{client.dscrYear ?? ''}</p>
                        </td>
                        <td className="max-w-[220px] px-2 py-2">{client.nextStep || '-'}</td>
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
                        <td className="px-2 py-2">{formatDate(client.lastUpdate)}</td>
                        <td className="px-2 py-2" onClick={(event) => event.stopPropagation()}>
                          <details className="group relative">
                            <summary className="cursor-pointer list-none rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700">
                              More Actions
                            </summary>
                            <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                              <ActionButton
                                label={client.hasPackagingAccess ? 'Remove Packaging Access' : 'Give Packaging Access'}
                                onClick={() => void runClientAction(client.id, client.hasPackagingAccess ? 'revoke_packaging' : 'grant_packaging')}
                              />
                              {showTemplateActions ? (
                                <ActionButton
                                  label={client.hasTemplateBundleGrant ? 'Remove Template Bundle Grant' : 'Give Template Bundle Access'}
                                  onClick={() => void runClientAction(client.id, client.hasTemplateBundleGrant ? 'revoke_templates' : 'grant_templates')}
                                />
                              ) : null}
                              {showComprehensiveAction ? (
                                <ActionButton
                                  label={client.hasComprehensiveAccess ? 'Remove Comprehensive Access' : 'Give Comprehensive Access'}
                                  onClick={() => void runClientAction(client.id, client.hasComprehensiveAccess ? 'revoke_comprehensive' : 'grant_comprehensive')}
                                />
                              ) : null}

                              {showTemplateActions ? (
                                <div className="mt-2 border-t border-slate-100 pt-2">
                                  <p className="mb-1 px-2 text-[10px] uppercase tracking-[0.12em] text-slate-500">Template Grants</p>
                                  {TEMPLATE_TYPES.map((templateType) => (
                                    <ActionButton
                                      key={`${client.id}:${templateType}`}
                                      label={
                                        hasManualTemplateGrant(templateType)
                                          ? `Remove ${formatTemplateTypeLabel(templateType)} Grant`
                                          : `Give ${formatTemplateTypeLabel(templateType)} Access`
                                      }
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
                              ) : null}
                            </div>
                          </details>
                        </td>
                      </tr>

                      {isExpanded ? (
                        <tr>
                          <td colSpan={8} className="border-b border-slate-200 bg-slate-50/70 px-2 py-3">
                            {loadingDetailId === client.id && !detail ? (
                              <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">Loading client workspace...</div>
                            ) : detail ? (
                              <ClientDetailPanel
                                detail={detail}
                                draft={draft ?? cloneDraft(detail)}
                                isEditing={isEditing}
                                isSaving={savingTarget === `detail:${client.id}`}
                                detailError={detailError}
                                onEdit={() => void beginEditing(client.id)}
                                onCancel={() => cancelEditing(client.id)}
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
                value={newClientEmail}
                onChange={(event) => setNewClientEmail(event.target.value.toLowerCase())}
                placeholder="client@email.com"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Only one field is required. Add an email whenever you want this row to auto-link on the client&apos;s first login.</p>
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
  onEdit,
  onCancel,
  onSave,
  onDraftChange,
}: {
  detail: ClientDetail;
  draft: ClientDetailDraft;
  isEditing: boolean;
  isSaving: boolean;
  detailError?: string;
  onEdit: () => void;
  onCancel: () => void;
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

  const updateAccount = <K extends keyof ClientDetailDraft['account']>(key: K, value: ClientDetailDraft['account'][K]) => {
    onDraftChange({
      ...draft,
      account: { ...draft.account, [key]: value },
    });
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

  const updateCashFlowLoanInfo = (key: keyof NonNullable<ClientDetailDraft['cashFlowAnalysis']>['loanInfo'], value: unknown) => {
    if (!draft.cashFlowAnalysis) return;
    onDraftChange({
      ...draft,
      cashFlowAnalysis: {
        ...draft.cashFlowAnalysis,
        loanInfo: { ...draft.cashFlowAnalysis.loanInfo, [key]: value },
      },
    });
  };

  const updateFinancialInput = (
    year: keyof NonNullable<ClientDetailDraft['cashFlowAnalysis']>['financials'],
    field: keyof FinancialInput,
    value: string,
  ) => {
    if (!draft.cashFlowAnalysis) return;
    onDraftChange({
      ...draft,
      cashFlowAnalysis: {
        ...draft.cashFlowAnalysis,
        financials: {
          ...draft.cashFlowAnalysis.financials,
          [year]: {
            ...draft.cashFlowAnalysis.financials[year],
            input: {
              ...draft.cashFlowAnalysis.financials[year].input,
              [field]: value,
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
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isSaving}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onEdit}
                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
              >
                Edit Client
              </button>
            )}
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

      <div className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle title="Client Profile" subtitle="Admin-editable account and shared-profile fields." />
          <div className="mt-3 grid gap-3 md:grid-cols-2">
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
            <LabeledField label="Next Step">
              {isEditing ? (
                <input
                  value={draft.account.nextStep ?? ''}
                  onChange={(event) => updateAccount('nextStep', event.target.value || null)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.account.nextStep || '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Service Level">
              {isEditing ? (
                <select
                  value={draft.account.serviceLevel}
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
                <StaticValue>{detail.account.serviceLevel}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Personal Name">
              {isEditing ? (
                <input
                  value={draft.sharedProfile.personalName ?? ''}
                  onChange={(event) => updateSharedProfile('personalName', event.target.value || null)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.sharedProfile.personalName || '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Business Name">
              {isEditing ? (
                <input
                  value={draft.sharedProfile.businessName ?? ''}
                  onChange={(event) => updateSharedProfile('businessName', event.target.value || null)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.sharedProfile.businessName || '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Business Legal Name">
              {isEditing ? (
                <input
                  value={draft.sharedProfile.businessLegalName ?? ''}
                  onChange={(event) => updateSharedProfile('businessLegalName', event.target.value || null)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.sharedProfile.businessLegalName || '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Loan Purpose">
              {isEditing ? (
                <input
                  value={draft.sharedProfile.loanPurpose ?? ''}
                  onChange={(event) => updateSharedProfile('loanPurpose', event.target.value || null)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.sharedProfile.loanPurpose || '-'}</StaticValue>
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
            <LabeledField label="Years In Business">
              {isEditing ? (
                <input
                  value={draft.sharedProfile.yearsInBusiness ?? ''}
                  onChange={(event) => updateSharedProfile('yearsInBusiness', event.target.value === '' ? null : Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.sharedProfile.yearsInBusiness ?? '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Access Toggles">
              {isEditing ? (
                <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
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
            <LabeledField label="Admin Notes">
              {isEditing ? (
                <textarea
                  value={draft.account.notes ?? ''}
                  onChange={(event) => updateAccount('notes', event.target.value || null)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.account.notes || '-'}</StaticValue>
              )}
            </LabeledField>
          </div>
        </section>

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
                <input
                  value={draft.cashFlowAnalysis?.loanInfo.loanPurpose ?? ''}
                  onChange={(event) => updateCashFlowLoanInfo('loanPurpose', event.target.value || null)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.cashFlowAnalysis.loanInfo.loanPurpose || '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Desired Amount">
              {isEditing ? (
                <input
                  value={draft.cashFlowAnalysis?.loanInfo.desiredAmount ?? ''}
                  onChange={(event) => updateCashFlowLoanInfo('desiredAmount', event.target.value === '' ? null : Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{formatMoney(detail.cashFlowAnalysis.loanInfo.desiredAmount)}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Estimated Payment">
              {isEditing ? (
                <input
                  value={draft.cashFlowAnalysis?.loanInfo.estimatedPayment ?? ''}
                  onChange={(event) => updateCashFlowLoanInfo('estimatedPayment', event.target.value === '' ? null : Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{formatMoney(detail.cashFlowAnalysis.loanInfo.estimatedPayment)}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Annualized Loan">
              {isEditing ? (
                <input
                  value={draft.cashFlowAnalysis?.loanInfo.annualizedLoan ?? ''}
                  onChange={(event) => updateCashFlowLoanInfo('annualizedLoan', event.target.value === '' ? null : Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{formatMoney(detail.cashFlowAnalysis.loanInfo.annualizedLoan)}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Loan Term (months)">
              {isEditing ? (
                <input
                  value={draft.cashFlowAnalysis?.loanInfo.term ?? ''}
                  onChange={(event) => updateCashFlowLoanInfo('term', event.target.value || null)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.cashFlowAnalysis.loanInfo.term || '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Interest Rate">
              {isEditing ? (
                <input
                  value={draft.cashFlowAnalysis?.loanInfo.interestRate ?? ''}
                  onChange={(event) => updateCashFlowLoanInfo('interestRate', event.target.value === '' ? null : Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.cashFlowAnalysis.loanInfo.interestRate != null ? `${detail.cashFlowAnalysis.loanInfo.interestRate}%` : '-'}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="Down Payment">
              {isEditing ? (
                <input
                  value={draft.cashFlowAnalysis?.loanInfo.downPayment ?? ''}
                  onChange={(event) => updateCashFlowLoanInfo('downPayment', event.target.value === '' ? null : Number(event.target.value))}
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
                  value={draft.cashFlowAnalysis?.loanInfo.proposedLoan ?? ''}
                  onChange={(event) => updateCashFlowLoanInfo('proposedLoan', event.target.value === '' ? null : Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{formatMoney(detail.cashFlowAnalysis.loanInfo.proposedLoan)}</StaticValue>
              )}
            </LabeledField>
            <LabeledField label="2026 YTD Month">
              {isEditing ? (
                <input
                  value={draft.cashFlowAnalysis?.financials.year2026YTD.ytdMonth ?? ''}
                  onChange={(event) => updateYtdMonth(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              ) : (
                <StaticValue>{detail.cashFlowAnalysis.financials.year2026YTD.ytdMonth || '-'}</StaticValue>
              )}
            </LabeledField>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Cash Flow Input</th>
                  {yearColumns.map(([year, label]) => (
                    <th key={year} className="px-3 py-2 text-right font-semibold">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(Object.keys(CASH_FLOW_FIELD_LABELS) as Array<keyof FinancialInput>).map((field) => (
                  <tr key={field} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-900">{CASH_FLOW_FIELD_LABELS[field]}</td>
                    {yearColumns.map(([year]) => (
                      <td key={`${field}:${year}`} className="px-3 py-2 text-right">
                        {isEditing ? (
                          <input
                            value={draft.cashFlowAnalysis?.financials[year].input[field] ?? ''}
                            onChange={(event) => updateFinancialInput(year, field, event.target.value)}
                            className="w-full min-w-[120px] rounded-lg border border-slate-200 px-2 py-1 text-right text-sm"
                          />
                        ) : (
                          <span className="font-medium text-slate-700">
                            {draft.cashFlowAnalysis?.financials[year].input[field]
                              ? draft.cashFlowAnalysis.financials[year].input[field]
                              : '$0'}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-slate-200 bg-slate-50/70">
                  <td className="px-3 py-2 font-semibold text-slate-900">Adjusted EBITDA</td>
                  {yearColumns.map(([year]) => (
                    <td key={`ebitda:${year}`} className="px-3 py-2 text-right font-semibold text-slate-900">
                      {formatMoney(detail.cashFlowAnalysis?.financials[year].summary.adjustedEbitda)}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-slate-200 bg-slate-50/70">
                  <td className="px-3 py-2 font-semibold text-slate-900">DSCR</td>
                  {(['2024', '2025', '2026YTD'] as CashFlowYearKey[]).map((year) => (
                    <td key={`dscr:${year}`} className="px-3 py-2 text-right font-semibold text-slate-900">
                      {formatDscr(detail.cashFlowAnalysis?.dscr.values[year])}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
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
