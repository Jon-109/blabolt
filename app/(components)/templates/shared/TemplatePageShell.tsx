'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import ContextAssistant from '@/app/(components)/ai/ContextAssistant';
import { TEMPLATE_KEYS, type TemplateKey } from '@/lib/loan-packaging/constants';

type StatusTone = 'neutral' | 'saving' | 'saved' | 'error';

interface TemplatePageShellProps {
  title: string;
  subtitle: string;
  description: string;
  metricLabel: string;
  metricValue: string;
  metricSubvalue?: string;
  metricContent?: ReactNode;
  statusLabel?: string;
  statusTone?: StatusTone;
  hideStatusOnMobile?: boolean;
  hideMetricOnMobile?: boolean;
  compactHero?: boolean;
  fullWidthBelowHero?: ReactNode;
  children: ReactNode;
}

const statusToneClassName: Record<StatusTone, string> = {
  neutral: 'bg-slate-300',
  saving: 'bg-amber-500 animate-pulse',
  saved: 'bg-emerald-500',
  error: 'bg-rose-500',
};

export default function TemplatePageShell({
  title,
  subtitle,
  description,
  metricLabel,
  metricValue,
  metricSubvalue,
  metricContent,
  statusLabel,
  statusTone = 'neutral',
  hideStatusOnMobile = false,
  hideMetricOnMobile = false,
  compactHero = false,
  fullWidthBelowHero,
  children,
}: TemplatePageShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const source = searchParams.get('source');
  const loanRequestId = searchParams.get('loanRequestId');
  const submissionId = searchParams.get('submissionId');
  const pathSegments = pathname.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1];
  const templateKey =
    typeof lastSegment === 'string' && (TEMPLATE_KEYS as readonly string[]).includes(lastSegment)
      ? (lastSegment as TemplateKey)
      : null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fafc_36%,_#f3f4f6_100%)] text-slate-900">
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-slate-100">
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(120deg,_#ffffff1a_0%,_transparent_52%)]" />
        <div className={`relative mx-auto max-w-7xl px-4 sm:px-6 ${compactHero ? 'py-6 sm:py-7' : 'py-8 sm:py-10'}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-3xl space-y-2.5">
              <p className="inline-flex items-center rounded-full border border-blue-300/40 bg-blue-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]">
                Guided Template
              </p>
              <h1 className="overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.08rem,5.4vw,1.45rem)] font-semibold tracking-tight sm:text-4xl">
                {title}
              </h1>
              {subtitle ? <p className="text-sm text-slate-300 sm:text-base">{subtitle}</p> : null}
              <p className="hidden text-xs text-slate-300/90 sm:block sm:text-sm">{description}</p>
              {statusLabel ? (
                <div
                  className={`${hideStatusOnMobile ? 'hidden sm:inline-flex ' : 'inline-flex '}items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200`}
                >
                  <span className={`h-2 w-2 rounded-full ${statusToneClassName[statusTone]}`} />
                  {statusLabel}
                </div>
              ) : null}
            </div>

            <div className={`${hideMetricOnMobile ? 'hidden md:block ' : ''}w-full max-w-xs rounded-2xl border border-slate-700 bg-slate-900/60 p-4`}>
              {metricContent ? (
                metricContent
              ) : (
                <>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">{metricLabel}</p>
                  <p className="mt-2 text-3xl font-bold text-white">{metricValue}</p>
                  {metricSubvalue ? <p className="mt-1 text-xs text-slate-300">{metricSubvalue}</p> : null}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
      {fullWidthBelowHero}
      {source === 'loan-packaging' ? (
        <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 flex items-center justify-between gap-3">
            <span>Opened from Loan Packaging.</span>
            <Link
              href={loanRequestId ? `/loan-packaging?loanRequestId=${loanRequestId}` : '/loan-packaging'}
              className="inline-flex items-center rounded-md border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              Return to Loan Packaging
            </Link>
          </div>
        </div>
      ) : null}
      {templateKey ? (
        <ContextAssistant
          scope="template"
          templateKey={templateKey}
          loanRequestId={loanRequestId}
          submissionId={submissionId}
        />
      ) : null}

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 sm:py-6">{children}</main>
    </div>
  );
}
