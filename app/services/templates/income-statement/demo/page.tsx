import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Eye, FileText, Layers3, TrendingUp } from 'lucide-react';

import IncomeStatementTemplate from '@/app/(components)/templates/IncomeStatement';
import type { IncomeStatementData } from '@/lib/templates/types';
import {
  INCOME_STATEMENT_TEMPLATE_LOGIN_REDIRECT,
  TEMPLATE_BUNDLE_PRICE_CENTS,
  formatUsd,
} from '@/lib/template-offers';

export const metadata: Metadata = {
  title: 'Income Statement Demo | Preview Template Output',
  description:
    'Preview a lender-ready Income Statement output with realistic mock data. See the statement format before you start.',
  alternates: {
    canonical: '/services/templates/income-statement/demo',
  },
};

const sampleData: IncomeStatementData = {
  statementLabel: 'FY 2025 Year-End',
  statementType: 'annual',
  periodStart: '2025-01-01',
  periodEnd: '2025-12-31',
  businessInfo: {
    name: 'Summit Ridge Contracting LLC',
  },
  revenue: {
    grossSales: 2280000,
    serviceRevenue: 340000,
    otherRevenue: 26500,
  },
  cogs: {
    inventoryMaterialsCost: 1185000,
    directLabor: 82000,
    shippingPackaging: 26000,
    otherDirectCosts: 17000,
  },
  operatingExpenses: {
    payrollContractorPayments: 420000,
    rentFacilityCosts: 98000,
    utilitiesInternet: 27500,
    marketingAdvertising: 46000,
    softwareSubscriptions: 18800,
    professionalServices: 24400,
    insurance: 38800,
    officeAdministrative: 22100,
    vehicleTravel: 29800,
    otherOperatingExpenses: 41200,
  },
  interestExpense: 41800,
  notes: '',
};

const insights = [
  'Revenue, expense, and net income hierarchy in one clean statement.',
  'Line-item format lenders and underwriters can evaluate quickly.',
  'Clear profitability presentation for repayment-capacity discussions.',
  'Consistent P&L output suitable for loan packaging workflows.',
];

export default function IncomeStatementDemoPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_16%_8%,#0d3355_0%,#081324_36%,#030712_72%)] text-slate-100">
      <header className="border-b border-cyan-200/20 bg-slate-950/55 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/35 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-100">
              <Eye className="h-3.5 w-3.5" />
              Output Demo
            </p>
            <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">Income Statement: Live Mock Preview</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-200 sm:text-base">
              This demo shows the same lender-ready income statement structure you can generate from the guided template workflow.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              id="income-statement-demo-header-cta-start"
              href={INCOME_STATEMENT_TEMPLATE_LOGIN_REDIRECT}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-cyan-300 px-5 text-sm font-bold text-slate-900 hover:bg-cyan-200"
            >
              Start This Template
            </Link>
            <Link
              id="income-statement-demo-header-cta-bundle"
              href="/services/templates-bundle"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-cyan-200/35 px-5 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/10"
            >
              See Bundle ({formatUsd(TEMPLATE_BUNDLE_PRICE_CENTS)})
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.36fr_0.64fr]">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-slate-300/20 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-200">What You Are Seeing</p>
            <h2 className="mt-2 text-xl font-black text-white">Realistic lender-facing structure</h2>

            <ul className="mt-4 space-y-3 text-sm text-slate-100">
              {insights.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-xl border border-cyan-200/25 bg-cyan-300/10 p-4">
              <p className="text-sm font-semibold text-cyan-100">Why this matters</p>
              <p className="mt-1 text-sm text-slate-200">
                Cleaner P&L presentation helps underwriters evaluate profitability and repayment capacity faster.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-200/30 bg-amber-200/10 p-4 text-sm text-amber-50">
            <p className="font-semibold">Demo data only</p>
            <p className="mt-1">Your final output is generated from your actual financial statement inputs.</p>
          </div>
        </aside>

        <section>
          <div className="rounded-2xl border border-slate-300/20 bg-slate-950/45 p-3 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-300/20 bg-slate-800/70 px-2.5 py-1">
                <FileText className="h-3.5 w-3.5 text-cyan-200" />
                Lender-ready output
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-300/20 bg-slate-800/70 px-2.5 py-1">
                <Layers3 className="h-3.5 w-3.5 text-cyan-200" />
                Structured categories
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-300/20 bg-slate-800/70 px-2.5 py-1">
                <TrendingUp className="h-3.5 w-3.5 text-cyan-200" />
                Underwriting ready
              </span>
            </div>

            <div className="max-h-[72vh] overflow-y-auto rounded-lg bg-white p-4 shadow-[0_20px_60px_-35px_rgba(14,165,233,0.75)]">
              <IncomeStatementTemplate data={sampleData} />
            </div>
          </div>
        </section>
      </main>

      <div className="sticky bottom-4 z-30 mx-auto mb-4 w-[min(96%,900px)] rounded-2xl border border-cyan-200/30 bg-slate-950/90 p-3 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-100">Ready to create your own Income Statement?</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              id="income-statement-demo-sticky-cta-start"
              href={INCOME_STATEMENT_TEMPLATE_LOGIN_REDIRECT}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-cyan-300 px-4 text-sm font-bold text-slate-900 hover:bg-cyan-200"
            >
              Start Now
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
            <Link
              id="income-statement-demo-sticky-cta-bundle"
              href="/services/templates-bundle"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-cyan-200/35 px-4 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/10"
            >
              View Full Bundle
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
