'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';
import { getLeadSource, getStoredUTMParams, track } from '@/lib/analytics';

export type DscrEmailResultPayload = {
  dscr: number;
  dscrBand: string;
  loanPurpose: string;
  requestedAmount: number;
  monthlyNetIncome: number;
  currentMonthlyDebtService: number;
  proposedMonthlyPayment: number;
  totalMonthlyDebtService: number;
  interestRatePct: number;
  termMonths: number;
  downPaymentPct: number;
  recommendedAction?: 'analysis' | 'packaging';
};

type DscrEmailCaptureProps = {
  result: DscrEmailResultPayload;
  pageTemplate: string;
  placement: string;
};

export default function DscrEmailCapture({ result, pageTemplate, placement }: DscrEmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [website, setWebsite] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    setStatus('idle');
    setError('');
  }, [result.dscr, result.loanPurpose, result.requestedAmount]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    setStatus('sending');
    setError('');
    const utm = getStoredUTMParams();
    const response = await fetch('/api/dscr-results/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        firstName: firstName.trim(),
        businessName: businessName.trim(),
        website,
        marketingConsent,
        result,
        attribution: {
          source: getLeadSource() || 'direct',
          pageTemplate,
          placement,
          utmSource: utm.utm_source,
          utmMedium: utm.utm_medium,
          utmCampaign: utm.utm_campaign,
        },
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setStatus('idle');
      setError(payload?.error || 'We could not send the result. Please try again.');
      track('lead_submission_error', {
        form_id: 'dscr_result',
        error_stage: response.status >= 500 ? 'server' : 'validation',
        message: 'DSCR result email request failed',
      });
      return;
    }

    setStatus('sent');
    track('generate_lead', {
      form_id: 'dscr_result',
      submission_method: 'resend',
      loan_amount: result.requestedAmount,
      loan_purpose: result.loanPurpose,
      dscr_band: result.dscrBand,
      dscr_value: Number(result.dscr.toFixed(2)),
      lead_source: getLeadSource(),
      status: 'success',
    });
  };

  if (status === 'sent') {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div>
            <h3 className="font-bold text-emerald-950">Your DSCR result is on its way.</h3>
            <p className="mt-1 text-sm leading-6 text-emerald-800">Check {email.trim()} for the result, assumptions, and recommended next step.</p>
            <button type="button" onClick={() => setStatus('idle')} className="mt-2 text-xs font-bold text-emerald-900 underline">Send it to another email</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-cyan-200 bg-[linear-gradient(135deg,#ecfeff,#ffffff_55%,#f0fdf4)] p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-800 text-white"><Mail className="h-5 w-5" /></span>
        <div>
          <h3 className="text-base font-black text-slate-950">Email my DSCR result and recommended next steps</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">Get a copy of this result, the assumptions used, and a practical next step. No credit pull.</p>
        </div>
      </div>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700">First name <span className="font-normal text-slate-400">optional</span><input value={firstName} onChange={(event) => setFirstName(event.target.value)} maxLength={100} autoComplete="given-name" className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" /></label>
          <label className="text-xs font-semibold text-slate-700">Business name <span className="font-normal text-slate-400">optional</span><input value={businessName} onChange={(event) => setBusinessName(event.target.value)} maxLength={200} autoComplete="organization" className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" /></label>
        </div>
        <label className="block text-xs font-semibold text-slate-700">Email address<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} autoComplete="email" placeholder="you@business.com" className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" /></label>
        <label className="sr-only" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
        <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-3 text-xs leading-5 text-slate-600">
          <input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-600" />
          <span>Also send me occasional financing-readiness guidance and relevant Business Lending Advocate service updates. I can unsubscribe at any time.</span>
        </label>
        {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p> : null}
        <button type="submit" disabled={status === 'sending'} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
          {status === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          {status === 'sending' ? 'Sending Result...' : 'Email My Result'}
        </button>
        <p className="text-center text-[11px] leading-4 text-slate-500">By requesting the result, you agree to our <Link href="/privacy-policy" className="font-semibold underline">Privacy Policy</Link>. The optional checkbox controls future guidance emails.</p>
      </form>
    </section>
  );
}
