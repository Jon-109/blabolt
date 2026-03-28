'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase/helpers/client';

type AnyRow = Record<string, unknown>;

export default function AdminClientPackagingPage() {
  const router = useRouter();
  const params = useParams<{ clientId: string }>();
  const clientId = params?.clientId;

  const [clientName, setClientName] = useState('');
  const [loanRequests, setLoanRequests] = useState<AnyRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const load = async () => {
      setErrorMessage(null);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/admin/clients/${clientId}/packaging`, { cache: 'no-store', headers });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json.error || 'Failed to load packaging dashboard');
        }

        setClientName(String(json.client?.full_name || json.client?.email || 'Client'));
        setLoanRequests((json.loanRequests || []) as AnyRow[]);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load');
      }
    };

    if (clientId) {
      void load();
    }
  }, [clientId]);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-6xl">
        <button onClick={() => router.back()} className="mb-2 rounded border border-slate-300 bg-white px-3 py-1 text-sm">Back</button>
        <h1 className="text-2xl font-bold text-slate-900">{clientName} • Loan Package Dashboard (Admin View)</h1>
        {errorMessage ? <div className="mt-2 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</div> : null}

        <div className="mt-4 overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                <th className="px-3 py-2">Business</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Service</th>
                <th className="px-3 py-2">Loan Amount</th>
                <th className="px-3 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {loanRequests.map((row) => (
                <tr key={String(row.id)} className="border-b border-slate-100 text-slate-700">
                  <td className="px-3 py-2 font-medium">{String(row.business_name || 'Untitled deal')}</td>
                  <td className="px-3 py-2">{String(row.status || '-')}</td>
                  <td className="px-3 py-2">{String(row.service_type || '-')}</td>
                  <td className="px-3 py-2">{Number(row.loan_amount || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</td>
                  <td className="px-3 py-2">{String(row.updated_at || '-').slice(0, 10)}</td>
                </tr>
              ))}
              {loanRequests.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={5}>No loan package records yet for this client.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
