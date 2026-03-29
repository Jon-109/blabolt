'use client';

import Link from 'next/link';
import {
  BadgeCheck,
  Banknote,
  BarChart3,
  CheckCircle2,
  CircleHelp,
  Download,
  FileCheck2,
  FileDown,
  FileSpreadsheet,
  Layers,
  LineChart,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';

import { Button } from '@/app/(components)/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/(components)/ui/accordion';
import BalanceSheetSvgTemplate from '@/app/(components)/templates/BalanceSheetSvgTemplate';
import AuthAwareCheckoutButton from '@/app/services/components/AuthAwareCheckoutButton';
import useServicePageMotion from '@/app/services/components/useServicePageMotion';
import { balanceSheetPreviewData } from '@/lib/templates/preview-data';
import {
  TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE,
  TEMPLATE_BUNDLE_PRICE_CENTS,
  TEMPLATE_UNIT_PRICE_CENTS,
  formatUsd,
} from '@/lib/template-offers';

const singleTemplatePriceLabel = formatUsd(TEMPLATE_UNIT_PRICE_CENTS);
const bundlePriceLabel = formatUsd(TEMPLATE_BUNDLE_PRICE_CENTS);

const outcomes = [
  {
    title: 'Lender-ready balance sheet output',
    text: 'Generate a clean snapshot of assets, liabilities, and equity so lenders can assess leverage and financial position quickly.',
    icon: FileCheck2,
  },
  {
    title: 'Standardized structure lenders expect',
    text: 'Your statement follows a professional layout with categorized current/non-current accounts and balance checks.',
    icon: Layers,
  },
  {
    title: 'Instant PDF-style document preview',
    text: 'Complete the guided workflow and produce a polished downloadable balance sheet format instantly.',
    icon: BarChart3,
  },
];

const steps = [
  {
    title: 'Answer guided business and statement prompts',
    body: 'The form collects the exact metadata and account categories needed for lender review.',
  },
  {
    title: 'Enter assets, liabilities, and equity once',
    body: 'Structured fields map each value to the correct line item so your statement remains clear and consistent.',
  },
  {
    title: 'Generate your polished balance sheet output instantly',
    body: 'Your completed Balance Sheet is ready as a professional downloadable document format for loan files.',
  },
];

const categories = [
  'Current Assets',
  'Non-Current Assets',
  'Current Liabilities',
  'Long-Term Liabilities',
  'Owner Equity',
  'Balance Validation Check',
];

const faqs = [
  {
    q: 'What does this template service produce?',
    a: 'It produces a complete lender-ready Balance Sheet showing assets, liabilities, and equity in one structured statement output.',
  },
  {
    q: 'Why do lenders care about this?',
    a: 'Balance sheets show liquidity, leverage, and net position. Lenders use it to evaluate financial stability and risk before approving credit.',
  },
  {
    q: 'Is this hard to complete?',
    a: 'No. The form is guided and sectioned by account types so you can complete it without guessing how to format line items.',
  },
  {
    q: `What do I get for ${singleTemplatePriceLabel}?`,
    a: `You get access to the full Balance Sheet workflow, a polished downloadable statement output suitable for lender review, and room for up to ${TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE} separate builds of this template. That gives you flexibility for different years, updated numbers, revised lender-requested versions, or multiple owner scenarios when needed.`,
  },
  {
    q: 'How many versions can I create with this template?',
    a: `You can create up to ${TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE} separate builds of the Balance Sheet template. That is especially useful if you need multiple reporting periods, cleaner revised drafts, or different versions for the same financing file.`,
  },
  {
    q: 'Can I buy only this template?',
    a: `Yes. This page is for the single Balance Sheet template at ${singleTemplatePriceLabel}. Full 5-template bundle is ${bundlePriceLabel} one-time.`,
  },
];

export default function BalanceSheetServiceClient() {
  useServicePageMotion();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_10%,#0b2f4b_0%,#071224_38%,#030712_72%)] text-slate-100">
      <section data-service-hero className="relative overflow-hidden border-b border-cyan-300/20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(125,211,252,0.10)_0%,rgba(16,185,129,0.07)_42%,transparent_75%)]" />
        <div className="pointer-events-none absolute -left-16 top-16 h-56 w-56 rounded-full bg-cyan-400/25 blur-3xl service-glow service-hero-parallax" />
        <div className="pointer-events-none absolute right-2 top-10 h-52 w-52 rounded-full bg-emerald-400/20 blur-3xl service-glow-delayed service-hero-parallax-reverse" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.12fr_0.88fr] lg:gap-10">
          <div className="space-y-6 service-reveal" data-service-reveal>
            <p className="service-reveal inline-flex items-center gap-2 rounded-full border border-cyan-200/40 bg-cyan-200/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              Balance Sheet Template Service
            </p>

            <h1 className="service-reveal max-w-3xl text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
              Generate a Lender-Ready Balance Sheet in Minutes
            </h1>

            <p className="service-reveal max-w-3xl text-base text-slate-200 sm:text-lg">
              Turn raw account numbers into a clean professional statement lenders can read fast. This workflow guides you through each line item and produces a polished balance sheet output instantly.
            </p>

            <div className="service-reveal grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-300/20 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.11em] text-cyan-200">What You Get</p>
                <p className="mt-1 text-sm text-slate-100">A complete assets/liabilities/equity statement in a lender-friendly structure.</p>
              </div>
              <div className="rounded-2xl border border-slate-300/20 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.11em] text-emerald-200">Why It Matters</p>
                <p className="mt-1 text-sm text-slate-100">Lenders use this to evaluate leverage, liquidity, and overall financial strength.</p>
              </div>
            </div>
          </div>

          <aside className="service-reveal lg:sticky lg:top-24 lg:self-start" data-service-reveal>
            <div className="service-lift rounded-3xl border border-cyan-200/30 bg-slate-950/65 p-6 shadow-2xl backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-200">Single Template Access</p>
              <p className="mt-2 text-5xl font-black text-white">{singleTemplatePriceLabel}</p>
              <p className="mt-2 text-sm text-slate-300">One-time purchase for the Balance Sheet template service.</p>

              <ul className="mt-5 space-y-2 text-sm text-slate-100">
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />Guided statement setup and account mapping</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />Clean lender-ready structure and totals</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />Up to {TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE} builds for multiple years, revisions, or owner versions</li>
              </ul>

              <div className="mt-6 space-y-3">
                <AuthAwareCheckoutButton
                  className="service-magnetic h-12 w-full rounded-xl bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200"
                  data-service-magnetic
                  id="balance-sheet-service-hero-cta-start"
                  productType="balance_sheet"
                >
                  Start Balance Sheet for {singleTemplatePriceLabel}
                </AuthAwareCheckoutButton>
              </div>

              <p className="mt-4 text-xs text-slate-300">
                Need more than one template? Bundle all 5 for <span className="font-semibold text-amber-200">{bundlePriceLabel}</span>.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16" data-service-reveal>
        <div className="service-reveal mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-200">Visual Preview</p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">See the exact style of statement you get</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
            <FileDown className="h-3.5 w-3.5" />
            Instant downloadable output
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.34fr_0.66fr]">
          <div className="service-reveal space-y-3">
            <div className="service-lift rounded-2xl border border-slate-300/20 bg-white/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-cyan-100"><Download className="h-4 w-4 text-cyan-200" />Immediate Output</p>
              <p className="mt-1 text-sm text-slate-200">Once complete, your polished balance sheet output is ready instantly.</p>
            </div>
            <div className="service-lift rounded-2xl border border-slate-300/20 bg-white/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-cyan-100"><Layers className="h-4 w-4 text-cyan-200" />Lender-Friendly Layout</p>
              <p className="mt-1 text-sm text-slate-200">Current and non-current sections organized for faster lender review.</p>
            </div>
            <div className="service-lift rounded-2xl border border-slate-300/20 bg-white/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-cyan-100"><FileCheck2 className="h-4 w-4 text-cyan-200" />Balance Validation</p>
              <p className="mt-1 text-sm text-slate-200">Totals and balance checks help catch issues before submission.</p>
            </div>
          </div>

          <div className="service-reveal rounded-2xl border border-slate-300/20 bg-slate-950/45 p-3 sm:p-4">
            <div className="mx-auto w-full max-w-[816px] rounded-xl bg-white shadow-[0_20px_55px_-35px_rgba(56,189,248,0.7)]">
              <BalanceSheetSvgTemplate data={balanceSheetPreviewData} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16" data-service-reveal>
        <div className="mb-8 service-reveal">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-200">What This Service Is</p>
          <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">A guided balance sheet workflow built for underwriting</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {outcomes.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="service-reveal service-tilt rounded-2xl border border-slate-300/20 bg-white/5 p-5 backdrop-blur-sm">
                <Icon className="h-7 w-7 text-cyan-200" />
                <h3 className="mt-3 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-200">{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 md:pb-16" data-service-reveal>
        <div className="rounded-3xl border border-cyan-200/20 bg-gradient-to-br from-cyan-200/10 via-white/5 to-emerald-200/10 p-6 md:p-8">
          <div className="service-reveal flex items-center gap-2 text-cyan-100">
            <FileSpreadsheet className="h-5 w-5" />
            <p className="text-xs font-semibold uppercase tracking-[0.1em]">What It Produces</p>
          </div>
          <h2 className="service-reveal mt-2 text-2xl font-black text-white md:text-3xl">A complete balance sheet output lenders can review immediately</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="service-reveal rounded-2xl border border-white/20 bg-slate-950/45 p-4">
              <p className="text-sm font-semibold text-cyan-200">Primary Deliverable</p>
              <p className="mt-1 text-sm text-slate-100">Complete Balance Sheet with assets, liabilities, and equity.</p>
            </div>
            <div className="service-reveal rounded-2xl border border-white/20 bg-slate-950/45 p-4">
              <p className="text-sm font-semibold text-cyan-200">Financial Clarity</p>
              <p className="mt-1 text-sm text-slate-100">Total position and leverage visibility for lender decisioning.</p>
            </div>
            <div className="service-reveal rounded-2xl border border-white/20 bg-slate-950/45 p-4">
              <p className="text-sm font-semibold text-cyan-200">Operational Benefit</p>
              <p className="mt-1 text-sm text-slate-100">Removes formatting confusion and helps prevent missing sections.</p>
            </div>
            <div className="service-reveal rounded-2xl border border-white/20 bg-slate-950/45 p-4">
              <p className="text-sm font-semibold text-cyan-200">Use Case</p>
              <p className="mt-1 text-sm text-slate-100">Use in lender files, underwriting follow-up, and package readiness workflows.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-2 md:pb-16" data-service-reveal>
        <article className="service-reveal rounded-3xl border border-slate-300/20 bg-white/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-200">How Easy It Is</p>
          <h2 className="mt-2 text-2xl font-black text-white">Three steps from zero to lender-ready statement</h2>
          <ol className="mt-5 space-y-4">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-xl border border-white/15 bg-slate-950/40 p-4">
                <p className="text-sm font-semibold text-cyan-200">Step {index + 1}</p>
                <p className="mt-1 text-base font-bold text-white">{step.title}</p>
                <p className="mt-1 text-sm text-slate-200">{step.body}</p>
              </li>
            ))}
          </ol>
        </article>

        <article className="service-reveal rounded-3xl border border-slate-300/20 bg-white/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-200">Coverage</p>
          <h2 className="mt-2 text-2xl font-black text-white">Everything lenders expect in balance sheet format</h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {categories.map((category) => (
              <div key={category} className="service-lift rounded-xl border border-white/15 bg-slate-950/45 p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <BadgeCheck className="h-4 w-4 text-emerald-300" />
                  {category}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-200/20 bg-cyan-400/10 p-4 text-sm text-cyan-50">
            Structured inputs and auto totals help ensure your statement is complete before lender submission.
          </div>
        </article>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 md:pb-16" data-service-reveal>
        <div className="service-reveal rounded-3xl border border-slate-300/20 bg-white/5 p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-200">Before vs After</p>
          <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">From raw account dumps to lender-grade statement clarity</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-rose-200/30 bg-rose-200/10 p-4">
              <p className="text-sm font-semibold text-rose-100">Before</p>
              <ul className="mt-2 space-y-2 text-sm text-rose-50">
                <li className="flex gap-2"><CircleHelp className="mt-0.5 h-4 w-4" />Account balances scattered across multiple files</li>
                <li className="flex gap-2"><CircleHelp className="mt-0.5 h-4 w-4" />No clear current vs long-term structure</li>
                <li className="flex gap-2"><CircleHelp className="mt-0.5 h-4 w-4" />Harder lender review due to format inconsistency</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-emerald-200/30 bg-emerald-300/10 p-4">
              <p className="text-sm font-semibold text-emerald-100">After</p>
              <ul className="mt-2 space-y-2 text-sm text-emerald-50">
                <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4" />Single professional balance sheet output</li>
                <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4" />Clear assets, liabilities, and equity positioning</li>
                <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4" />Faster underwriting understanding of financial posture</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 md:pb-16" data-service-reveal>
        <div className="service-reveal rounded-3xl border border-slate-300/20 bg-white/5 p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-200">FAQ</p>
          <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">Common balance sheet questions answered</h2>

          <Accordion type="single" collapsible className="mt-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.q} value={`item-${index}`} className="border-slate-300/20">
                <AccordionTrigger className="text-left text-sm font-semibold text-slate-100 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-6 text-slate-200">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="border-t border-cyan-200/20 bg-slate-950/55">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-200">Ready to produce your Balance Sheet?</p>
            <h2 className="mt-2 text-2xl font-black text-white">Build your statement now</h2>
            <p className="mt-1 text-sm text-slate-200">Or unlock all 5 templates in the full bundle for complete document readiness.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <AuthAwareCheckoutButton
              className="service-magnetic h-11 rounded-xl bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200"
              data-service-magnetic
              id="balance-sheet-service-final-cta-start"
              productType="balance_sheet"
            >
              Start for {singleTemplatePriceLabel}
            </AuthAwareCheckoutButton>
            <Button asChild variant="outline" className="h-11 rounded-xl border-cyan-200/35 bg-transparent text-cyan-100 hover:bg-cyan-300/10 hover:text-cyan-50">
              <Link id="balance-sheet-service-final-cta-bundle" href="/services/templates-bundle">
                See Full Templates Bundle
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-300/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-slate-300 sm:px-6">
          <p className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-cyan-200" />Built for owners preparing lender files.</p>
          <p className="flex items-center gap-1.5"><Banknote className="h-3.5 w-3.5 text-cyan-200" />Professional balance sheet formatting without manual templates.</p>
          <p className="flex items-center gap-1.5"><LineChart className="h-3.5 w-3.5 text-cyan-200" />Clear leverage and position visibility for underwriting.</p>
          <p className="flex items-center gap-1.5"><ListChecks className="h-3.5 w-3.5 text-cyan-200" />Instant output for packaging and lender review.</p>
        </div>
      </section>
    </div>
  );
}
