'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, FileText, Loader2, Lock, ShieldCheck } from 'lucide-react';

interface LenderPortalClientProps {
  token: string;
  headingClassName: string;
  bodyClassName: string;
}

interface LenderPortalResponse {
  portal: {
    title: string;
    expiresAt: string;
  };
  loanRequest: {
    businessName: string | null;
    businessDescription: string | null;
    loanPurpose: string | null;
    loanAmount: number | null;
    annualRevenue: number | null;
    yearsInBusiness: number | null;
    coverLetterContent: string | null;
    packageZipUrl: string | null;
    documents: Array<{
      requirementKey: string;
      displayName: string;
      description: string;
      category: string | null;
      status: string;
      uploadedAt: string | null;
      downloadUrl: string | null;
    }>;
  };
}

function formatCurrency(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return 'N/A';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'N/A';
  }

  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function LenderPortalClient({
  token,
  headingClassName,
  bodyClassName,
}: LenderPortalClientProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LenderPortalResponse | null>(null);

  const hasExpired = useMemo(() => {
    if (!data?.portal.expiresAt) {
      return false;
    }

    return new Date(data.portal.expiresAt).getTime() <= Date.now();
  }, [data?.portal.expiresAt]);

  const unlockPortal = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/lender/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload && typeof payload === 'object' && 'error' in payload
          ? String((payload as { error?: unknown }).error ?? 'Access denied')
          : 'Access denied';
        throw new Error(message);
      }

      setData(payload as LenderPortalResponse);
    } catch (unlockError) {
      setError(unlockError instanceof Error ? unlockError.message : 'Failed to unlock portal');
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div className={`${bodyClassName} min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fafc_40%,_#f5f5f4_100%)] flex items-center justify-center px-4`}>
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white/95 shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-slate-900 text-white mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className={`${headingClassName} text-3xl text-slate-900`}>Secure Lender Portal</h1>
            <p className="mt-2 text-sm text-slate-600">
              Enter the portal password to access underwriting documents and package files.
            </p>
          </div>

          {error ? (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          ) : null}

          <label className="block space-y-1 text-sm">
            <span className="font-semibold text-slate-700">Portal Password</span>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
              />
            </div>
          </label>

          <button
            onClick={unlockPortal}
            disabled={loading || !password.trim()}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Unlock Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${bodyClassName} min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fafc_40%,_#f5f5f4_100%)] text-slate-900`}>
      <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-300/10 px-4 py-1 text-xs uppercase tracking-[0.08em]">
            <ShieldCheck className="h-4 w-4" />
            Credentialed Lender View
          </p>
          <h1 className={`${headingClassName} text-4xl mt-4`}>{data.portal.title}</h1>
          <p className="text-slate-300 mt-2 text-sm">
            Access expires on {formatDate(data.portal.expiresAt)}
            {hasExpired ? ' (expired)' : ''}
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Business</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{data.loanRequest.businessName || 'N/A'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Loan Purpose</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{data.loanRequest.loanPurpose || 'N/A'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Requested Amount</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(data.loanRequest.loanAmount)}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className={`${headingClassName} text-2xl mb-3`}>Loan Purpose Summary</h2>
          <p className="text-sm text-slate-700 leading-relaxed mb-3">
            {data.loanRequest.businessDescription || 'No loan purpose description provided.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-slate-500">Annual Revenue:</span>{' '}
              <span className="font-semibold text-slate-800">{formatCurrency(data.loanRequest.annualRevenue)}</span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-slate-500">Years In Business:</span>{' '}
              <span className="font-semibold text-slate-800">{data.loanRequest.yearsInBusiness ?? 'N/A'}</span>
            </div>
          </div>
        </div>

        {data.loanRequest.coverLetterContent ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className={`${headingClassName} text-2xl mb-3`}>Cover Letter</h2>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-4">
              {data.loanRequest.coverLetterContent}
            </pre>
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className={`${headingClassName} text-2xl`}>Document Room</h2>
            {data.loanRequest.packageZipUrl ? (
              <a
                href={data.loanRequest.packageZipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-400 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <FileText className="h-4 w-4" />
                Download Full Package ZIP
              </a>
            ) : null}
          </div>

          <div className="space-y-3">
            {data.loanRequest.documents.length === 0 ? (
              <p className="text-sm text-slate-500">No documents available in this package.</p>
            ) : (
              data.loanRequest.documents.map((document) => (
                <article
                  key={document.requirementKey}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{document.displayName}</p>
                    <p className="text-xs text-slate-500">{document.description}</p>
                  </div>
                  {document.downloadUrl ? (
                    <a
                      href={document.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-slate-400 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Download
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">Unavailable</span>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
