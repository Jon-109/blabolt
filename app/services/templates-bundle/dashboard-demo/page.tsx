import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock3, Download, FolderKanban, Sparkles } from 'lucide-react';

import {
  TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE,
  TEMPLATE_BUNDLE_PRICE_CENTS,
  TEMPLATE_LOGIN_REDIRECT,
  TEMPLATE_OFFERS,
  formatUsd,
} from '@/lib/template-offers';

export const metadata: Metadata = {
  title: 'Templates Bundle Dashboard Demo | Workspace Preview',
  description:
    'Preview a mock templates dashboard with progress states, output counters, and generated file visibility for the full templates bundle.',
  alternates: {
    canonical: '/services/templates-bundle/dashboard-demo',
  },
};

const demoRows = [
  {
    slug: 'business_debt_summary',
    progress: 100,
    status: 'Completed',
    outputsUsed: 3,
    lastUpdated: 'Today',
  },
  {
    slug: 'balance_sheet',
    progress: 72,
    status: 'In Progress',
    outputsUsed: 2,
    lastUpdated: 'Today',
  },
  {
    slug: 'income_statement',
    progress: 56,
    status: 'In Progress',
    outputsUsed: 2,
    lastUpdated: 'Yesterday',
  },
  {
    slug: 'personal_financial_statement',
    progress: 22,
    status: 'Started',
    outputsUsed: 1,
    lastUpdated: 'Yesterday',
  },
  {
    slug: 'personal_debt_summary',
    progress: 100,
    status: 'Completed',
    outputsUsed: 1,
    lastUpdated: 'Today',
  },
] as const;

function statusTone(status: string): string {
  if (status === 'Completed') return 'text-emerald-200 bg-emerald-300/15 border-emerald-200/35';
  if (status === 'In Progress') return 'text-amber-100 bg-amber-300/15 border-amber-200/35';
  return 'text-cyan-100 bg-cyan-300/15 border-cyan-200/35';
}

export default function TemplatesBundleDashboardDemoPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_8%_8%,#17385c_0%,#0b1424_36%,#020617_74%)] text-slate-100">
      <header className="border-b border-cyan-200/20 bg-slate-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/35 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              Dashboard Demo
            </p>
            <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">Templates Bundle Workspace Preview</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-200 sm:text-base">
              Mock view of how your bundle dashboard can track template progress, outputs used, and readiness status across all five documents.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              id="templates-bundle-dashboard-demo-header-cta-start"
              href={TEMPLATE_LOGIN_REDIRECT}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-cyan-300 px-5 text-sm font-bold text-slate-900 hover:bg-cyan-200"
            >
              Start Bundle Flow
            </Link>
            <Link
              id="templates-bundle-dashboard-demo-header-cta-back"
              href="/services/templates-bundle"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-cyan-200/35 px-5 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/10"
            >
              Back to Bundle Page
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-300/20 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-200">Bundle Price</p>
            <p className="mt-1 text-3xl font-black text-white">{formatUsd(TEMPLATE_BUNDLE_PRICE_CENTS)}</p>
            <p className="mt-1 text-sm text-slate-200">One-time for all templates in one workspace.</p>
          </article>
          <article className="rounded-2xl border border-slate-300/20 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-200">Template Coverage</p>
            <p className="mt-1 text-3xl font-black text-white">{TEMPLATE_OFFERS.length}</p>
            <p className="mt-1 text-sm text-slate-200">Business and personal template set included.</p>
          </article>
          <article className="rounded-2xl border border-slate-300/20 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-200">Output Policy</p>
            <p className="mt-1 text-3xl font-black text-white">{TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE}</p>
            <p className="mt-1 text-sm text-slate-200">Outputs per template under the bundle policy.</p>
          </article>
        </section>

        <section className="rounded-2xl border border-cyan-200/20 bg-slate-950/45 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-white">Template Progress Board</h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-300/20 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-200">
              <FolderKanban className="h-3.5 w-3.5 text-cyan-200" />
              Mock dashboard data
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {demoRows.map((row) => {
              const template = TEMPLATE_OFFERS.find((item) => item.slug === row.slug);
              const name = template?.name ?? row.slug;
              return (
                <article key={row.slug} className="rounded-xl border border-slate-300/20 bg-slate-900/45 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-bold text-white">{name}</p>
                      <p className="mt-0.5 text-xs text-slate-300">Last updated: {row.lastUpdated}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(row.status)}`}>
                        {row.status}
                      </span>
                      <span className="rounded-full border border-slate-300/20 bg-slate-800/70 px-2.5 py-1 text-xs font-semibold text-slate-200">
                        {row.outputsUsed}/{TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE} outputs used
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300" style={{ width: `${row.progress}%` }} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                    <span>{row.progress}% complete</span>
                    <span className="inline-flex items-center gap-1"><Download className="h-3.5 w-3.5 text-cyan-200" />Generated files visible here</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-300/20 bg-white/5 p-5">
            <h3 className="text-lg font-bold text-white">What this dashboard view communicates</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />Which templates are complete vs still in progress</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />How close each document is to lender-ready completion</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />How many outputs have been generated per template</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-300/20 bg-white/5 p-5">
            <h3 className="text-lg font-bold text-white">Next actions in real flow</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              <li className="flex gap-2"><Clock3 className="mt-0.5 h-4 w-4 text-cyan-200" />Continue unfinished templates from progress cards</li>
              <li className="flex gap-2"><Clock3 className="mt-0.5 h-4 w-4 text-cyan-200" />Generate updated outputs within policy limits</li>
              <li className="flex gap-2"><Clock3 className="mt-0.5 h-4 w-4 text-cyan-200" />Use files in packaging or direct lender submissions</li>
            </ul>
          </article>
        </section>
      </main>

      <footer className="border-t border-cyan-200/20 bg-slate-950/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-200">Ready to build your full template stack?</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              id="templates-bundle-dashboard-demo-footer-cta-start"
              href={TEMPLATE_LOGIN_REDIRECT}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-cyan-300 px-4 text-sm font-bold text-slate-900 hover:bg-cyan-200"
            >
              Start Bundle Flow
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
            <Link
              id="templates-bundle-dashboard-demo-footer-cta-business-debt"
              href="/services/templates/business-debt-summary"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-cyan-200/35 px-4 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/10"
            >
              View Business Debt Service
            </Link>
            <Link
              id="templates-bundle-dashboard-demo-footer-cta-bundle"
              href="/services/templates-bundle"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-cyan-200/35 px-4 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/10"
            >
              Back to Bundle Offer
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
