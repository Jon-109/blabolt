import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Eye, FileText, Layers3, TrendingUp } from 'lucide-react';

import BalanceSheetSvgTemplate from '@/app/(components)/templates/BalanceSheetSvgTemplate';
import type { BalanceSheetData } from '@/lib/templates/types';
import {
  BALANCE_SHEET_TEMPLATE_LOGIN_REDIRECT,
  TEMPLATE_BUNDLE_PRICE_CENTS,
  formatUsd,
} from '@/lib/template-offers';

export const metadata: Metadata = {
  title: 'Balance Sheet Demo | Preview Template Output',
  description:
    'Preview a lender-ready Balance Sheet output with realistic mock data. See the exact statement format before you start.',
  alternates: {
    canonical: '/services/templates/balance-sheet/demo',
  },
};

const sampleData: BalanceSheetData = {
  statementLabel: 'FY 2025 Year-End',
  statementType: 'year_end',
  asOfDate: '2025-12-31',
  businessInfo: {
    legalName: 'Summit Ridge Contracting LLC',
    reportBasis: 'accrual',
  },
  assets: {
    cashAndCashEquivalents: 118400,
    accountsReceivable: 94200,
    inventory: 48200,
    prepaidExpenses: 10600,
    otherCurrentAssets: 7800,
    fixedAssetBreakdown: {
      businessRealEstate: 465000,
      vehicles: 162000,
      machineryEquipment: 238000,
      furnitureFixtures: 43000,
      leaseholdImprovements: 28000,
    },
    accumulatedDepreciation: 192000,
    notesReceivable: 22000,
    intangibleAssets: 9000,
    investments: 54000,
    otherNonCurrentAssets: 12500,
  },
  liabilities: {
    accountsPayable: 77200,
    accruedExpenses: 28600,
    taxesPayable: 12400,
    currentPortionLongTermDebt: 35800,
    creditCardsAndLines: 46200,
    deferredRevenue: 14000,
    otherCurrentLiabilities: 9800,
    longTermDebt: 392000,
    shareholderLoans: 64000,
    otherLongTermLiabilities: 21200,
  },
  equity: {
    ownerContributions: 310000,
    retainedEarnings: 196900,
    ownerDistributions: 126500,
    otherEquity: 15000,
  },
  notes: '',
};

const insights = [
  'Current and non-current account structure lenders expect.',
  'Total assets vs liabilities+equity validation built into the format.',
  'Professional line-item hierarchy for clearer underwriting review.',
  'Consistent statement layout suitable for loan packaging workflows.',
];

export default function BalanceSheetDemoPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_16%_8%,#0d3355_0%,#081324_36%,#030712_72%)] text-slate-100">
      <header className="border-b border-cyan-200/20 bg-slate-950/55 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/35 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-100">
              <Eye className="h-3.5 w-3.5" />
              Output Demo
            </p>
            <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">Balance Sheet: Live Mock Preview</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-200 sm:text-base">
              This demo shows the same lender-ready balance sheet structure you can generate from the guided template workflow.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              id="balance-sheet-demo-header-cta-start"
              href={BALANCE_SHEET_TEMPLATE_LOGIN_REDIRECT}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-cyan-300 px-5 text-sm font-bold text-slate-900 hover:bg-cyan-200"
            >
              Start This Template
            </Link>
            <Link
              id="balance-sheet-demo-header-cta-bundle"
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
                Cleaner statement presentation helps underwriters quickly evaluate leverage and financial position.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-200/30 bg-amber-200/10 p-4 text-sm text-amber-50">
            <p className="font-semibold">Demo data only</p>
            <p className="mt-1">Your final output is generated from your actual financial statement inputs.</p>
          </div>
        </aside>

        <section>
          <div className="overflow-x-auto rounded-2xl border border-slate-300/20 bg-slate-950/45 p-3 sm:p-5">
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

            <div className="mx-auto w-[816px] rounded-lg bg-white shadow-[0_20px_60px_-35px_rgba(14,165,233,0.75)]">
              <BalanceSheetSvgTemplate data={sampleData} />
            </div>
          </div>
        </section>
      </main>

      <div className="sticky bottom-4 z-30 mx-auto mb-4 w-[min(96%,900px)] rounded-2xl border border-cyan-200/30 bg-slate-950/90 p-3 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-100">Ready to create your own Balance Sheet?</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              id="balance-sheet-demo-sticky-cta-start"
              href={BALANCE_SHEET_TEMPLATE_LOGIN_REDIRECT}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-cyan-300 px-4 text-sm font-bold text-slate-900 hover:bg-cyan-200"
            >
              Start Now
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
            <Link
              id="balance-sheet-demo-sticky-cta-bundle"
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
