import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Eye, FileText, Layers3, TrendingUp } from 'lucide-react';

import SBAForm413SvgTemplate from '@/app/(components)/templates/SBAForm413SvgTemplate';
import type { PersonalFinancialStatementData } from '@/lib/templates/types';
import {
  PERSONAL_FINANCIAL_STATEMENT_TEMPLATE_LOGIN_REDIRECT,
  TEMPLATE_BUNDLE_PRICE_CENTS,
  formatUsd,
} from '@/lib/template-offers';

export const metadata: Metadata = {
  title: 'SBA Form 413 Demo | Personal Financial Statement Preview',
  description:
    'Preview a complete SBA Form 413 Personal Financial Statement output with realistic mock data. See the lender-preferred format before you start.',
  alternates: {
    canonical: '/services/templates/personal-financial-statement/demo',
  },
};

const sampleData: PersonalFinancialStatementData = {
  asOfDate: '2026-03-01',
  personalInfo: {
    name: 'Jordan Rivera',
    address: '1824 Cedar Bluff Dr, San Antonio, TX 78258',
    phone: '(210) 555-3984',
    email: 'jordan.rivera@example.com',
  },
  businessInfo: {
    applicantBusinessName: 'Rivera Industrial Services LLC',
    applicantBusinessPhone: '(210) 555-3984',
  },
  declarations: {
    isMarried: 'yes',
    isUsCitizen: 'yes',
    hasContingentLiability: 'no',
    hasLawsuitOrJudgment: 'no',
    hasTaxDelinquency: 'no',
    hasGuarantees: 'yes',
    guaranteesNotes: 'Personal guaranty on operating line of credit.',
  },
  assets: {
    cashChecking: 45200,
    cashSavings: 38800,
    accountsNotesReceivable: 12000,
    lifeInsuranceCashSurrender: 18500,
    stocksBonds: 74200,
    realEstate: 465000,
    automobiles: 42000,
    personalProperty: 27000,
    otherAssets: 16000,
  },
  liabilities: {
    creditCards: 18400,
    mortgages: 286000,
    autoLoans: 24500,
    studentLoans: 19800,
    otherDebts: 15600,
  },
  annualIncome: {
    salary: 148000,
    netInvestmentIncome: 9200,
    realEstateIncome: 16800,
    otherIncome: 4200,
  },
  realEstateOwned: [
    {
      propertyType: 'primary_residence',
      propertyAddress: '1824 Cedar Bluff Dr, San Antonio, TX 78258',
      originalCost: 392000,
      presentMarketValue: 465000,
      mortgageHolderName: 'First National Mortgage',
      mortgageBalance: 286000,
      amountOfPaymentPerMonth: 2590,
      status: 'current',
    },
  ],
  retirementAccounts: [
    {
      accountType: '401k',
      institutionName: 'Fidelity',
      currentEstimatedValue: 126000,
      pledgedAsCollateral: 'no',
    },
  ],
  vehiclesOwned: [
    {
      year: 2023,
      make: 'Toyota',
      model: 'Highlander',
      currentEstimatedValue: 42000,
      loanBalance: 24500,
      monthlyPayment: 690,
    },
  ],
  stocksAndBonds: [
    {
      symbol: 'VTI',
      issuerName: 'Vanguard Total Stock Market ETF',
      numberOfShares: 280,
      marketValue: 74200,
      dateOfQuote: '2026-03-01',
    },
  ],
  sba413Page3Entries: [
    { section: 'Retirement', description: '401(k) - Fidelity', amount: 126000 },
    { section: 'Securities', description: 'VTI ETF Holdings', amount: 74200 },
    { section: 'Other Assets', description: 'Cash value life insurance', amount: 18500 },
    { section: 'Real Estate', description: 'Primary residence equity', amount: 179000 },
  ],
  notes: '',
};

const insights = [
  'Complete Personal Financial Statement, not a debt-only output.',
  'Delivered in SBA Form 413 format familiar to lenders and SBA teams.',
  'Assets, liabilities, and net-worth view clearly presented for underwriting.',
  'Structured output designed for immediate loan package use.',
];

export default function PersonalFinancialStatementDemoPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_16%_8%,#0d3355_0%,#081324_36%,#030712_72%)] text-slate-100">
      <header className="border-b border-cyan-200/20 bg-slate-950/55 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/35 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-100">
              <Eye className="h-3.5 w-3.5" />
              SBA Form 413 Demo
            </p>
            <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">Personal Financial Statement: Live SBA Form 413 Preview</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-200 sm:text-base">
              This demo shows the same SBA Form 413-style Personal Financial Statement PDF structure you can generate from the guided template flow.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              id="pfs-demo-header-cta-start"
              href={PERSONAL_FINANCIAL_STATEMENT_TEMPLATE_LOGIN_REDIRECT}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-cyan-300 px-5 text-sm font-bold text-slate-900 hover:bg-cyan-200"
            >
              Start This Template
            </Link>
            <Link
              id="pfs-demo-header-cta-bundle"
              href="/services/templates-bundle"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-cyan-200/35 px-5 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/10"
            >
              See Bundle ({formatUsd(TEMPLATE_BUNDLE_PRICE_CENTS)})
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.34fr_0.66fr]">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-slate-300/20 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-200">What You Are Seeing</p>
            <h2 className="mt-2 text-xl font-black text-white">Complete SBA Form 413 output structure</h2>

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
                Submitting an SBA Form 413-style personal statement improves clarity and speeds lender review for guarantor financial strength.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-200/30 bg-amber-200/10 p-4 text-sm text-amber-50">
            <p className="font-semibold">Demo data only</p>
            <p className="mt-1">Your final output is generated from your actual personal financial data and declarations.</p>
          </div>
        </aside>

        <section>
          <div className="rounded-2xl border border-slate-300/20 bg-slate-950/45 p-3 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-300/20 bg-slate-800/70 px-2.5 py-1">
                <FileText className="h-3.5 w-3.5 text-cyan-200" />
                Complete PFS output
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-300/20 bg-slate-800/70 px-2.5 py-1">
                <Layers3 className="h-3.5 w-3.5 text-cyan-200" />
                SBA Form 413 format
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-300/20 bg-slate-800/70 px-2.5 py-1">
                <TrendingUp className="h-3.5 w-3.5 text-cyan-200" />
                Underwriting ready
              </span>
            </div>

            <div className="max-h-[75vh] overflow-y-auto rounded-lg bg-white p-3 shadow-[0_20px_60px_-35px_rgba(14,165,233,0.75)]">
              <SBAForm413SvgTemplate data={sampleData} />
            </div>
          </div>
        </section>
      </main>

      <div className="sticky bottom-4 z-30 mx-auto mb-4 w-[min(96%,900px)] rounded-2xl border border-cyan-200/30 bg-slate-950/90 p-3 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-100">Ready to generate your own SBA Form 413 PDF?</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              id="pfs-demo-sticky-cta-start"
              href={PERSONAL_FINANCIAL_STATEMENT_TEMPLATE_LOGIN_REDIRECT}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-cyan-300 px-4 text-sm font-bold text-slate-900 hover:bg-cyan-200"
            >
              Start Now
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
            <Link
              id="pfs-demo-sticky-cta-bundle"
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
