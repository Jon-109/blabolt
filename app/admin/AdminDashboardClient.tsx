'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Manrope, Space_Grotesk } from 'next/font/google';
import { supabase } from '@/supabase/helpers/client';

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
  nextStep: string;
  progressPct: number;
  lastUpdate: string;
  hasAccount: boolean;
  hasTemplateAccess: boolean;
  hasPackagingAccess: boolean;
  hasComprehensiveAccess: boolean;
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminDashboardClient() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [showAddClientModal, setShowAddClientModal] = useState(false);

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

  const createClient = async () => {
    if (newClientName.trim().length < 2 || newClientEmail.trim().length < 5) {
      setErrorMessage('Enter a valid client name and email.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: newClientName, email: newClientEmail }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to create client');
      }

      setNewClientName('');
      setNewClientEmail('');
      setShowAddClientModal(false);
      await loadEverything();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create client');
    } finally {
      setIsSaving(false);
    }
  };

  const runClientAction = async (clientId: string, action: string) => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/admin/clients', {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, action }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed client action');
      }

      await loadEverything();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed client action');
    } finally {
      setIsSaving(false);
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
              <span className="text-[11px] text-slate-500">Ultimate access controls and direct views</span>
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
                  <th className="px-2 py-2">Service</th>
                  <th className="px-2 py-2">Next Step</th>
                  <th className="px-2 py-2">Progress</th>
                  <th className="px-2 py-2">Last Update</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-slate-100 align-top text-slate-700">
                    <td className="px-2 py-2 font-semibold text-slate-900">{client.fullName || '-'}</td>
                    <td className="px-2 py-2">{client.email}</td>
                    <td className="px-2 py-2">
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                        {client.service}
                      </span>
                    </td>
                    <td className="px-2 py-2 max-w-[220px]">{client.nextStep || '-'}</td>
                    <td className="px-2 py-2 min-w-[150px]">
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
                    <td className="px-2 py-2">
                      <details className="group relative">
                        <summary className="cursor-pointer list-none rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700">
                          More Actions
                        </summary>
                        <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                          <ActionButton label={client.hasTemplateAccess ? 'Revoke Template Access' : 'Give Template Access'} onClick={() => void runClientAction(client.id, client.hasTemplateAccess ? 'revoke_templates' : 'grant_templates')} />
                          <ActionButton label={client.hasPackagingAccess ? 'Revoke Packaging Access' : 'Give Packaging Access'} onClick={() => void runClientAction(client.id, client.hasPackagingAccess ? 'revoke_packaging' : 'grant_packaging')} />
                          <ActionButton label={client.hasComprehensiveAccess ? 'Revoke DSCR Access' : 'Give DSCR Access'} onClick={() => void runClientAction(client.id, client.hasComprehensiveAccess ? 'revoke_comprehensive' : 'grant_comprehensive')} />

                          {client.hasTemplateAccess ? (
                            <div className="mt-2 border-t border-slate-100 pt-2">
                              <p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">Template Views</p>
                              {[
                                ['balance_sheet', 'View Balance Sheet'],
                                ['income_statement', 'View Income Statement'],
                                ['personal_financial_statement', 'View Personal FS'],
                                ['personal_debt_summary', 'View Personal Debt'],
                                ['business_debt_summary', 'View Business Debt'],
                              ].map(([templateType, label]) => (
                                <Link key={templateType} href={`/admin/clients/${client.id}/template/${templateType}`} className="mb-1 block rounded px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-100">
                                  {label}
                                </Link>
                              ))}
                            </div>
                          ) : null}

                          {client.hasPackagingAccess ? (
                            <div className="mt-2 border-t border-slate-100 pt-2">
                              <Link href={`/admin/clients/${client.id}/packaging`} className="block rounded px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-100">
                                Loan Package Dashboard
                              </Link>
                            </div>
                          ) : null}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
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
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                disabled={isSaving}
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
