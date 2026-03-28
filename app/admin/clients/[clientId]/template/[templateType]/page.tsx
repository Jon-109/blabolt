'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase/helpers/client';

type AnyRow = Record<string, unknown>;

export default function AdminClientTemplatePage() {
  const router = useRouter();
  const params = useParams<{ clientId: string; templateType: string }>();
  const clientId = params?.clientId;
  const templateType = params?.templateType;

  const [clientName, setClientName] = useState('');
  const [submissions, setSubmissions] = useState<AnyRow[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>('');
  const [editorJson, setEditorJson] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const load = async () => {
    setErrorMessage(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/clients/${clientId}/template?type=${templateType}`, {
        cache: 'no-store',
        headers,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || 'Failed to load template data');
      }

      setClientName(String(json.client?.full_name || json.client?.email || 'Client'));
      const rows = (json.submissions || []) as AnyRow[];
      setSubmissions(rows);

      if (rows.length > 0) {
        const firstId = String(rows[0]?.id || '');
        setSelectedSubmissionId(firstId);
        setEditorJson(JSON.stringify(rows[0]?.form_data || {}, null, 2));
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load data');
    }
  };

  useEffect(() => {
    if (clientId && templateType) {
      void load();
    }
  }, [clientId, templateType]);

  const selectedSubmission = useMemo(
    () => submissions.find((row) => String(row.id) === selectedSubmissionId),
    [submissions, selectedSubmissionId],
  );

  const save = async () => {
    if (!selectedSubmissionId) return;

    setIsSaving(true);
    setErrorMessage(null);
    try {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(editorJson);
      } catch {
        throw new Error('Form data JSON is invalid.');
      }

      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/clients/${clientId}/template`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: selectedSubmissionId, formData: parsed }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || 'Failed to save');
      }

      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-6xl">
        <button onClick={() => router.back()} className="mb-2 rounded border border-slate-300 bg-white px-3 py-1 text-sm">Back</button>
        <h1 className="text-2xl font-bold text-slate-900">{clientName} • {templateType.replaceAll('_', ' ')}</h1>
        {errorMessage ? <div className="mt-2 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</div> : null}

        {submissions.length === 0 ? (
          <div className="mt-4 rounded border border-slate-200 bg-white p-4 text-sm text-slate-600">No submissions yet for this template.</div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-[260px_1fr]">
            <div className="rounded border border-slate-200 bg-white p-2">
              {submissions.map((row) => (
                <button
                  key={String(row.id)}
                  onClick={() => {
                    setSelectedSubmissionId(String(row.id));
                    setEditorJson(JSON.stringify(row.form_data || {}, null, 2));
                  }}
                  className={`mb-1 w-full rounded px-2 py-2 text-left text-xs ${selectedSubmissionId === String(row.id) ? 'bg-sky-100 text-sky-900' : 'bg-slate-50 text-slate-700'}`}
                >
                  Submission {String(row.id).slice(0, 8)}
                </button>
              ))}
            </div>
            <div className="rounded border border-slate-200 bg-white p-3">
              <p className="mb-2 text-xs text-slate-500">Form Data JSON (Admin Editable)</p>
              <textarea
                value={editorJson}
                onChange={(event) => setEditorJson(event.target.value)}
                rows={22}
                className="w-full rounded border border-slate-200 p-2 font-mono text-xs"
              />
              <button disabled={isSaving || !selectedSubmission} onClick={() => void save()} className="mt-2 rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
