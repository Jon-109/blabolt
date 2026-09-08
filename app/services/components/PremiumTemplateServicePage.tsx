'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Sora } from 'next/font/google';
import { ArrowRight, Check, CheckCircle2, Download, FileCheck2, PenLine, ShieldCheck, Sparkles } from 'lucide-react';

import AuthAwareCheckoutButton from '@/app/services/components/AuthAwareCheckoutButton';
import TemplateLinkGrid from '@/app/(components)/TemplateLinkGrid';
import BalanceSheetSvgTemplate from '@/app/(components)/templates/BalanceSheetSvgTemplate';
import BusinessDebtSummarySvgTemplate from '@/app/(components)/templates/BusinessDebtSummarySvgTemplate';
import IncomeStatementSvgTemplate from '@/app/(components)/templates/IncomeStatementSvgTemplate';
import PersonalDebtSummarySvgTemplate from '@/app/(components)/templates/PersonalDebtSummarySvgTemplate';
import SBAForm413SvgTemplate from '@/app/(components)/templates/SBAForm413SvgTemplate';
import {
  balanceSheetPreviewData,
  businessDebtSummaryPreviewData,
  incomeStatementPreviewData,
  personalDebtSummaryPreviewData,
  personalFinancialStatementPreviewData,
} from '@/lib/templates/preview-data';
import {
  TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE,
  TEMPLATE_BUNDLE_PRICE_CENTS,
  TEMPLATE_UNIT_PRICE_CENTS,
  formatUsd,
  type TemplateOfferSlug,
} from '@/lib/template-offers';

const headingFont = Sora({ subsets: ['latin'], weight: ['600', '700', '800'], display: 'swap' });

const configs: Record<TemplateOfferSlug, {
  title: string;
  eyebrow: string;
  headline: string;
  description: string;
  why: string;
  questions: Array<[string, string]>;
  categories: string[];
  output: ReactNode;
  outputLabel: string;
}> = {
  balance_sheet: {
    title: 'Balance Sheet', eyebrow: 'Business financial template', headline: 'Turn account balances into a lender-ready Balance Sheet.', description: 'Answer guided questions about what the business owns, owes, and retains as equity. The workflow organizes each value, validates the accounting equation, and generates a clean PDF.', why: 'Lenders use the Balance Sheet to evaluate liquidity, leverage, net worth, and the financial position supporting the request.', questions: [['Cash and bank balances', '$118,400'], ['Accounts receivable', '$94,200'], ['Vehicles and equipment', '$400,000'], ['Current and long-term debt', '$574,200']], categories: ['Current and non-current assets', 'Current and long-term liabilities', 'Owner equity and retained earnings', 'Automatic balance validation'], output: <BalanceSheetSvgTemplate data={balanceSheetPreviewData} />, outputLabel: 'Completed Balance Sheet',
  },
  income_statement: {
    title: 'Income Statement', eyebrow: 'Business financial template', headline: 'Present revenue, expenses, and profit in a format lenders can follow.', description: 'Enter the business activity for the reporting period through guided categories. The workflow calculates gross profit, operating performance, and net income in one consistent statement.', why: 'Lenders use Income Statements to understand profitability, cash-generation trends, margins, and the earnings available to support debt.', questions: [['Gross sales', '$2,280,000'], ['Materials and direct costs', '$1,310,000'], ['Payroll and operating expenses', '$767,400'], ['Interest expense', '$41,800']], categories: ['Revenue and other income', 'Cost of goods sold', 'Operating expenses', 'Calculated profit and net income'], output: <IncomeStatementSvgTemplate data={incomeStatementPreviewData} />, outputLabel: 'Completed Income Statement',
  },
  business_debt_summary: {
    title: 'Business Debt Summary', eyebrow: 'Business debt template', headline: 'Give lenders one complete view of every business obligation.', description: 'Organize lenders, balances, payment amounts, credit limits, maturity details, and guarantees without building a debt schedule from scratch.', why: 'A complete debt schedule helps underwriters calculate existing debt service, verify liabilities, and understand how much repayment capacity is already committed.', questions: [['Business credit cards', '$29,820'], ['Operating line of credit', '$24,850'], ['Term and equipment loans', '$186,200'], ['Monthly debt payments', '$12,800']], categories: ['Credit cards and lines of credit', 'Term, equipment, and vehicle debt', 'Real-estate obligations', 'Monthly payments and guarantees'], output: <BusinessDebtSummarySvgTemplate data={businessDebtSummaryPreviewData} />, outputLabel: 'Completed Business Debt Summary',
  },
  personal_financial_statement: {
    title: 'SBA Form 413', eyebrow: 'Personal financial statement', headline: 'Complete SBA Form 413 without wrestling with the government PDF.', description: 'Answer plain-English questions about personal assets, liabilities, income, property, and guarantees. The workflow maps those answers into the actual SBA-aligned Personal Financial Statement.', why: 'SBA and conventional lenders use the Personal Financial Statement to evaluate each guarantor’s liquidity, net worth, obligations, and financial support.', questions: [['Cash and savings', '$84,000'], ['Real estate owned', '$623,000'], ['Retirement accounts', '$154,500'], ['Personal liabilities', '$477,700']], categories: ['Personal assets and liabilities', 'Real estate and investment detail', 'Income and contingent liabilities', 'Electronic signature and SBA output'], output: <div className="guided-sba-page-two"><SBAForm413SvgTemplate data={personalFinancialStatementPreviewData} /></div>, outputLabel: 'Completed Personal Financial Statement',
  },
  personal_debt_summary: {
    title: 'Personal Debt Summary', eyebrow: 'Guarantor debt template', headline: 'Organize personal obligations into one lender-readable schedule.', description: 'List personal mortgages, cards, vehicle loans, student debt, lines, and other obligations through a guided workflow that totals balances and monthly payments.', why: 'Lenders review guarantor debt to understand personal repayment pressure, recurring obligations, and the financial capacity behind a guarantee.', questions: [['Mortgage balances', '$346,000'], ['Credit cards and lines', '$20,200'], ['Vehicle and student loans', '$56,600'], ['Monthly personal payments', '$4,730']], categories: ['Mortgages and real-estate debt', 'Credit cards and personal lines', 'Vehicle, student, and other loans', 'Balances and monthly payments'], output: <PersonalDebtSummarySvgTemplate data={personalDebtSummaryPreviewData} />, outputLabel: 'Completed Personal Debt Summary',
  },
};

export default function PremiumTemplateServicePage({ template }: { template: TemplateOfferSlug }) {
  const config = configs[template];
  const singlePrice = formatUsd(TEMPLATE_UNIT_PRICE_CENTS);
  const bundlePrice = formatUsd(TEMPLATE_BUNDLE_PRICE_CENTS);

  return (
    <div className="overflow-hidden bg-[#f7f8f6] text-slate-950">
      <section className="home-dossier-bg relative overflow-hidden bg-[#071824] text-white">
        <div className="home-noise pointer-events-none absolute inset-0 opacity-[0.12]" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="mx-auto max-w-6xl text-center"><div className="inline-flex items-center gap-2 border-x-2 border-amber-300 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100"><Sparkles className="h-4 w-4" />{config.eyebrow}</div><h1 className={`${headingFont.className} mx-auto mt-4 max-w-[28ch] text-[2.3rem] font-extrabold leading-[1] tracking-[-0.045em] sm:text-5xl lg:text-[3.3rem]`}>{config.headline}</h1><p className="mx-auto mt-4 max-w-5xl text-[15px] leading-6 text-slate-300 sm:text-lg sm:leading-7">{config.description}</p><div className="mx-auto mt-6 grid max-w-2xl gap-2 sm:grid-cols-2"><AuthAwareCheckoutButton productType={template} className="h-12 rounded-xl bg-[#f5c86a] text-sm font-extrabold text-[#071824] hover:bg-[#ffda88]">Start for {singlePrice} <ArrowRight className="ml-1 h-4 w-4" /></AuthAwareCheckoutButton><Link href="/services/templates-bundle" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-4 text-sm font-bold text-white hover:bg-white/[0.1]">Compare All Five Templates <ArrowRight className="h-4 w-4" /></Link></div><div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-300"><span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-300" />Guided questions</span><span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-300" />Instant PDF output</span><span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-300" />Up to {TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE} builds</span></div></div>
        </div>
      </section>

      <section className="bg-white py-9 sm:py-11"><div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8"><div className="w-full"><p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-800">Guided input → lender-ready output</p><h2 className={`${headingFont.className} mt-2 text-3xl font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-4xl`}>See how the document comes together.</h2><p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">The real workflow asks for the information in manageable sections, calculates the totals, and places everything into the final lender-facing format.</p></div><div className="mt-5 grid gap-4 lg:grid-cols-[0.72fr_1.28fr]"><div className="rounded-2xl border border-slate-200 bg-[#f8faf9] p-4"><div className="flex items-center gap-2"><PenLine className="h-4 w-4 text-cyan-800" /><h3 className="text-sm font-extrabold">Sample guided answers</h3></div><div className="mt-3 space-y-2">{config.questions.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[11px] font-bold text-slate-500">{label}</p><p className="mt-1 text-sm font-extrabold text-slate-950">{value}</p></div>)}</div><div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3"><p className="flex items-center gap-2 text-xs font-extrabold text-emerald-900"><CheckCircle2 className="h-4 w-4" />Totals checked and ready to generate</p></div></div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-3"><div className="mb-3 flex items-center justify-between"><div><p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-800">Actual output</p><p className="mt-1 text-sm font-extrabold">{config.outputLabel}</p></div><span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-extrabold text-white"><Download className="h-3.5 w-3.5" />PDF ready</span></div><div className="mx-auto max-h-[520px] max-w-[816px] overflow-y-auto rounded-xl bg-white shadow-sm">{config.output}</div></div></div></div></section>

      <section className="bg-[#f3f1ea] py-9 sm:py-11"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-800">Why lenders request it</p><h2 className={`${headingFont.className} mt-2 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl`}>{config.why}</h2><div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{config.categories.map((category) => <div key={category} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-800"><FileCheck2 className="h-4 w-4 shrink-0 text-emerald-600" />{category}</div>)}</div></div></section>

      <section className="bg-white py-9 sm:py-11"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-800">All five document tools</p><h2 className={`${headingFont.className} mt-2 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl`}>Build only what you need—or unlock the complete set.</h2><p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Each single template is {singlePrice}. The complete five-template bundle is {bundlePrice} and keeps every core financial document in one workspace.</p><div className="mt-5"><TemplateLinkGrid /></div></div></section>

      <section className="bg-[#071824] py-9 text-white sm:py-11"><div className="mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 lg:grid-cols-[1fr_0.7fr] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Create {config.title}</p><h2 className={`${headingFont.className} mt-2 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl`}>Stop formatting. Start answering guided questions.</h2><p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">Purchase once, create up to {TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE} versions, and download the polished document whenever the lender needs it.</p></div><div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"><div className="flex items-center justify-between"><span className="text-sm font-bold">Single template</span><span className="text-2xl font-black">{singlePrice}</span></div><AuthAwareCheckoutButton productType={template} className="mt-4 h-12 w-full rounded-xl bg-[#f5c86a] text-sm font-extrabold text-[#071824] hover:bg-[#ffda88]">Start {config.title} <ArrowRight className="ml-1 h-4 w-4" /></AuthAwareCheckoutButton><p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-300"><ShieldCheck className="h-3.5 w-3.5" />Secure checkout • account access after purchase</p></div></div></section>
    </div>
  );
}
