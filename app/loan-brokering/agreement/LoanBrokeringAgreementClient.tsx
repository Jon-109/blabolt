'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, FileText, Loader2, ShieldCheck } from 'lucide-react';
import { renderBrokerFeeAgreementSvg } from '@/lib/loan-packaging/broker-fee-agreement-svg';
import { supabase } from '@/supabase/helpers/client';

interface LoanBrokeringAgreementClientProps {
  headingClassName: string;
  bodyClassName: string;
}

interface AgreementPayload {
  agreement: {
    id: string;
    loanRequestId: string | null;
    status: 'draft' | 'signed';
    businessName: string | null;
    signerName: string | null;
    agreedToTerms: boolean;
    signedAt: string | null;
    pdfUrl: string | null;
  } | null;
  defaults: {
    businessName: string;
    signerName: string;
  };
}

export default function LoanBrokeringAgreementClient({
  headingClassName,
  bodyClassName,
}: LoanBrokeringAgreementClientProps) {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [signerName, setSignerName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const [agreementPdfUrl, setAgreementPdfUrl] = useState<string | null>(null);
  const [isAlreadySigned, setIsAlreadySigned] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAgreement() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        const token = session?.access_token ?? null;
        if (!token) {
          router.replace('/login?redirectTo=/loan-brokering/agreement');
          return;
        }

        if (!isMounted) {
          return;
        }

        setAccessToken(token);

        const response = await fetch('/api/loan-brokering/agreement', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = (await response.json().catch(() => null)) as AgreementPayload | { error?: string } | null;
        if (!response.ok) {
          const message =
            payload && typeof payload === 'object' && 'error' in payload
              ? String(payload.error ?? 'Failed to load broker agreement')
              : 'Failed to load broker agreement';
          throw new Error(message);
        }

        const agreementPayload = payload as AgreementPayload;
        const agreement = agreementPayload.agreement;
        const nextBusinessName = agreement?.businessName ?? agreementPayload.defaults.businessName ?? '';
        const nextSignerName = agreement?.signerName ?? agreementPayload.defaults.signerName ?? '';

        if (!isMounted) {
          return;
        }

        setBusinessName(nextBusinessName);
        setSignerName(nextSignerName);
        setAgreedToTerms(Boolean(agreement?.agreedToTerms));
        setSignedAt(agreement?.signedAt ?? null);
        setAgreementPdfUrl(agreement?.pdfUrl ?? null);
        setIsAlreadySigned(agreement?.status === 'signed');
        if (agreement?.status === 'signed') {
          setStatusMessage('Your broker fee agreement is already signed and your dashboard access is active.');
        }
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Failed to load broker agreement');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAgreement();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const signatureName = signerName.trim();
  const businessLabel = businessName.trim();
  const canSubmit =
    businessLabel.length >= 2 &&
    signatureName.length >= 2 &&
    agreedToTerms &&
    !submitting;

  const previewSvg = useMemo(
    () =>
      renderBrokerFeeAgreementSvg({
        businessName: businessLabel || 'Business Applicant',
        signerName: signatureName || 'Authorized Signer',
        signedAt: signedAt ?? (agreedToTerms && signatureName ? new Date().toISOString() : null),
      }),
    [agreedToTerms, businessLabel, signatureName, signedAt],
  );

  const handleSubmit = async () => {
    if (!accessToken || !canSubmit) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/loan-brokering/agreement', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: businessLabel,
          signerName: signatureName,
          agreedToTerms: true,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          payload && typeof payload === 'object' && 'error' in payload
            ? String((payload as { error?: unknown }).error ?? 'Failed to sign broker agreement')
            : 'Failed to sign broker agreement';
        throw new Error(message);
      }

      const nextSignedAt =
        payload && typeof payload === 'object' && 'agreement' in payload && payload.agreement && typeof payload.agreement === 'object' && 'signedAt' in payload.agreement
          ? String(payload.agreement.signedAt ?? new Date().toISOString())
          : new Date().toISOString();

      const nextPdfUrl =
        payload && typeof payload === 'object' && 'agreement' in payload && payload.agreement && typeof payload.agreement === 'object' && 'pdfUrl' in payload.agreement
          ? (payload.agreement.pdfUrl ? String(payload.agreement.pdfUrl) : null)
          : null;

      setSignedAt(nextSignedAt);
      setAgreementPdfUrl(nextPdfUrl);
      setIsAlreadySigned(true);
      setStatusMessage('Broker agreement signed. Taking you to the Loan Packaging dashboard now.');
      router.push('/loan-packaging');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to sign broker agreement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 ${bodyClassName}`}>
      <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,#dcfce7_0%,#f8fafc_40%,#ffffff_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-emerald-800">
              <ShieldCheck className="h-4 w-4" />
              Loan Brokering Agreement
            </div>
            <h1 className={`${headingClassName} mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl`}>
              Review and sign the Broker Fee Agreement before brokering begins.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              This path keeps your upfront cost at $0. Once you sign, we activate your Loan Packaging dashboard, include all five templates immediately, and store the signed agreement inside your loan package.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-700">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                No upfront broker fee
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Loan Packaging included
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Signed PDF saved to your file
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.94fr_1.06fr] lg:px-8">
        <section className="rounded-[1.9rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Signer Details</p>
              <h2 className={`${headingClassName} mt-2 text-2xl font-black text-slate-950`}>Complete the agreement</h2>
            </div>
            {isAlreadySigned ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                Signed
              </span>
            ) : null}
          </div>

          {statusMessage ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {statusMessage}
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {error}
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Business Name</span>
              <input
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="Enter the business name"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                disabled={loading || submitting}
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Your Personal Full Name</span>
              <input
                value={signerName}
                onChange={(event) => setSignerName(event.target.value)}
                placeholder="Type your full legal name"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                disabled={loading || submitting}
              />
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                checked={agreedToTerms}
                onChange={(event) => setAgreedToTerms(event.target.checked)}
                disabled={loading || submitting}
              />
              <span>
                I have reviewed this Broker Fee Agreement, I am authorized to sign on behalf of the business, and I agree to the terms including the 1% broker fee due only if the financing closes.
              </span>
            </label>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <FileText className="h-4 w-4" />
                Signature Preview
              </div>
              <div className="mt-3 rounded-2xl border border-white bg-white p-4 shadow-sm">
                <div className="border-b border-dashed border-slate-300 pb-3 text-[1.9rem] italic leading-none text-slate-900">
                  {signatureName || 'Your typed signature will appear here.'}
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Your typed name becomes the signature placed onto the agreement PDF.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing Agreement...
                </>
              ) : (
                <>
                  Sign Broker Agreement
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {isAlreadySigned ? (
              <Link
                href="/loan-packaging"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                Continue to Loan Packaging
              </Link>
            ) : null}

            {agreementPdfUrl ? (
              <a
                href={agreementPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-3.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                View Signed PDF
              </a>
            ) : null}
          </div>
        </section>

        <section className="rounded-[1.9rem] border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3 px-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Agreement Preview</p>
              <h2 className={`${headingClassName} mt-1 text-2xl font-black text-slate-950`}>Broker Fee Agreement PDF</h2>
            </div>
            {signedAt ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Signed {new Date(signedAt).toLocaleDateString('en-US')}
              </span>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-slate-100 p-2">
            <div className="mx-auto w-full max-w-[816px] bg-white shadow-[0_22px_60px_-38px_rgba(15,23,42,0.45)]">
              <div dangerouslySetInnerHTML={{ __html: previewSvg }} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
