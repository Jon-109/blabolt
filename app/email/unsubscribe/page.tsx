'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, MailX } from 'lucide-react';

export default function EmailUnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const unsubscribe = async () => {
    if (!token) {
      setStatus('error');
      setError('This unsubscribe link is not valid.');
      return;
    }

    setStatus('loading');
    setError('');
    const response = await fetch('/api/email/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setStatus('error');
      setError(payload?.error || 'Unable to update your email preferences.');
      return;
    }
    setStatus('success');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl sm:p-9">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          {status === 'success' ? <CheckCircle2 className="h-7 w-7 text-emerald-600" /> : <MailX className="h-7 w-7" />}
        </div>
        <h1 className="mt-5 text-2xl font-black tracking-tight">
          {status === 'success' ? 'You are unsubscribed' : 'Email preferences'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {status === 'success'
            ? 'You will no longer receive financing-readiness follow-up emails from this subscription.'
            : 'Confirm below to stop financing-readiness follow-up emails. Emails you specifically request, such as a new calculator result, may still be sent.'}
        </p>
        {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {status !== 'success' ? (
          <button
            type="button"
            onClick={() => void unsubscribe()}
            disabled={status === 'loading'}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {status === 'loading' ? 'Updating...' : 'Unsubscribe'}
          </button>
        ) : null}
        <Link href="/" className="mt-4 inline-flex text-sm font-semibold text-cyan-800 hover:text-cyan-950">
          Return to Business Lending Advocate
        </Link>
      </section>
    </main>
  );
}
