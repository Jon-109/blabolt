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
import SBAForm413SvgTemplate from '@/app/(components)/templates/SBAForm413SvgTemplate';
import AuthAwareCheckoutButton from '@/app/services/components/AuthAwareCheckoutButton';
import useServicePageMotion from '@/app/services/components/useServicePageMotion';
import { personalFinancialStatementPreviewData } from '@/lib/templates/preview-data';
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
    title: 'Complete Personal Financial Statement output',
    text: 'Produce a full personal financial statement, not just a debt list, with assets, liabilities, and net worth context in one professional document.',
    icon: FileCheck2,
  },
  {
    title: 'Delivered in SBA Form 413 format',
    text: 'Your final PDF is structured as SBA Form 413, the lender-preferred personal financial statement format and the SBA-required form for SBA loans.',
    icon: Layers,
  },
  {
    title: 'Built for real underwriting review',
    text: 'The output mirrors what lenders and SBA underwriters expect to see, helping you present guarantor financial strength with fewer clarification rounds.',
    icon: BarChart3,
  },
];

const steps = [
  {
    title: 'Answer guided profile prompts',
    body: 'The workflow walks you through personal, household, and guarantor-relevant details in clear language.',
  },
  {
    title: 'Enter assets, liabilities, and income details once',
    body: 'Structured sections capture the fields required for a complete lender-ready personal financial statement.',
  },
  {
    title: 'Generate your SBA Form 413 PDF instantly',
    body: 'Your complete Personal Financial Statement is immediately available as an SBA Form 413 PDF download.',
  },
];

const coverage = [
  'Personal and contact identification details',
  'Asset schedule (cash, securities, real estate, vehicles, other assets)',
  'Liability schedule (credit cards, mortgages, auto, student, other debt)',
  'Net worth position and annual income profile',
  'Real-estate, retirement, and supporting schedule detail',
  'Declarations and contingent liability context used in underwriting',
];

const faqs = [
  {
    q: 'Is this actually an SBA Form 413 generator-style output?',
    a: 'Yes. The final document is generated in SBA Form 413 format, which is what many lenders and SBA underwriters expect when reviewing guarantor financials.',
  },
  {
    q: 'Why should I care that it is SBA Form 413?',
    a: 'Because format matters in underwriting. SBA Form 413 is the recognized personal financial statement format for SBA deals and is widely familiar to lenders even outside SBA lending.',
  },
  {
    q: 'Is SBA Form 413 required for SBA loans?',
    a: 'For many SBA loan workflows, yes. Lenders frequently require SBA Form 413 from guarantors as part of the credit file, which makes having a polished 413-ready output highly valuable.',
  },
  {
    q: 'Is this just a personal debt summary?',
    a: 'No. A personal debt summary is only liabilities. This service produces a complete personal financial statement including assets, liabilities, income context, and the net-worth picture lenders evaluate.',
  },
  {
    q: `What do I receive for ${singleTemplatePriceLabel}?`,
    a: `You receive access to complete the Personal Financial Statement workflow, generate an instant downloadable SBA Form 413 PDF, and create up to ${TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE} separate builds of this template. That gives you room for multiple guarantors, updated financial snapshots, revised lender-requested versions, or different filing dates when needed.`,
  },
  {
    q: 'How many versions can I create with this template?',
    a: `You can create up to ${TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE} separate builds of the Personal Financial Statement template. That is especially useful when a deal involves multiple owners or guarantors, refreshed financial information, or revised versions for lender follow-up.`,
  },
  {
    q: 'Can I buy only this template without the bundle?',
    a: `Yes. This page is for the single Personal Financial Statement template at ${singleTemplatePriceLabel}. If you later want all templates, the full bundle is ${bundlePriceLabel} one-time.`,
  },
];

export default function PersonalFinancialStatementServiceClient() {
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
              Personal Financial Statement Template Service
            </p>

            <h1 className="service-reveal max-w-3xl text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
              Generate a Complete Personal Financial Statement in SBA Form 413 Format
            </h1>

            <p className="service-reveal max-w-3xl text-base text-slate-200 sm:text-lg">
              If users are searching for an SBA Form 413 generator, this is exactly what they need: a guided workflow that produces a complete Personal Financial Statement PDF in the format lenders prefer and the SBA requires for SBA loans.
            </p>

            <div className="service-reveal grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-300/20 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.11em] text-cyan-200">What You Get</p>
                <p className="mt-1 text-sm text-slate-100">A complete Personal Financial Statement plus an instant SBA Form 413 PDF download.</p>
              </div>
              <div className="rounded-2xl border border-slate-300/20 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.11em] text-emerald-200">Why It Wins</p>
                <p className="mt-1 text-sm text-slate-100">You submit the format lenders and SBA underwriters already expect, reducing review friction.</p>
              </div>
            </div>
          </div>

          <aside className="service-reveal lg:sticky lg:top-24 lg:self-start" data-service-reveal>
            <div className="service-lift rounded-3xl border border-cyan-200/30 bg-slate-950/65 p-6 shadow-2xl backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-200">Single Template Access</p>
              <p className="mt-2 text-5xl font-black text-white">{singleTemplatePriceLabel}</p>
              <p className="mt-2 text-sm text-slate-300">One-time purchase for the Personal Financial Statement template service.</p>

              <ul className="mt-5 space-y-2 text-sm text-slate-100">
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />Guided form flow from profile data to final statement</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />Complete personal financial statement, not just debt-only output</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />Up to {TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE} builds for multiple guarantors, dates, or revisions</li>
              </ul>

              <div className="mt-6 space-y-3">
                <AuthAwareCheckoutButton
                  className="service-magnetic h-12 w-full rounded-xl bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200"
                  data-service-magnetic
                  id="pfs-service-hero-cta-start"
                  productType="personal_financial_statement"
                >
                  Start Personal Financial Statement for {singleTemplatePriceLabel}
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
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">See the exact SBA Form 413-style PDF output</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
            <FileDown className="h-3.5 w-3.5" />
            Instant SBA Form 413 PDF download
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.34fr_0.66fr]">
          <div className="service-reveal space-y-3">
            <div className="service-lift rounded-2xl border border-slate-300/20 bg-white/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-cyan-100"><Download className="h-4 w-4 text-cyan-200" />Immediate PDF Output</p>
              <p className="mt-1 text-sm text-slate-200">Once complete, your full Personal Financial Statement SBA Form 413 PDF is ready instantly.</p>
            </div>
            <div className="service-lift rounded-2xl border border-slate-300/20 bg-white/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-cyan-100"><Layers className="h-4 w-4 text-cyan-200" />Complete Financial Picture</p>
              <p className="mt-1 text-sm text-slate-200">Captures assets, liabilities, income context, and required statement structure in one flow.</p>
            </div>
            <div className="service-lift rounded-2xl border border-slate-300/20 bg-white/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-cyan-100"><FileCheck2 className="h-4 w-4 text-cyan-200" />SBA/Lender-Ready Format</p>
              <p className="mt-1 text-sm text-slate-200">Output is aligned with SBA Form 413 expectations used by lenders during guarantor review.</p>
            </div>
          </div>

          <div className="service-reveal rounded-2xl border border-slate-300/20 bg-slate-950/45 p-3 sm:p-4">
            <div className="mx-auto w-full max-w-[816px] max-h-[680px] overflow-y-auto rounded-xl border border-slate-300/15 bg-white p-3 shadow-[0_20px_55px_-35px_rgba(56,189,248,0.7)]">
              <SBAForm413SvgTemplate data={personalFinancialStatementPreviewData} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16" data-service-reveal>
        <div className="mb-8 service-reveal">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-200">What This Service Is</p>
          <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">A guided SBA Form 413 personal statement workflow</h2>
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
          <h2 className="service-reveal mt-2 text-2xl font-black text-white md:text-3xl">A complete SBA Form 413 Personal Financial Statement PDF</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="service-reveal rounded-2xl border border-white/20 bg-slate-950/45 p-4">
              <p className="text-sm font-semibold text-cyan-200">Primary Deliverable</p>
              <p className="mt-1 text-sm text-slate-100">Complete personal financial statement PDF in SBA Form 413 format.</p>
            </div>
            <div className="service-reveal rounded-2xl border border-white/20 bg-slate-950/45 p-4">
              <p className="text-sm font-semibold text-cyan-200">Lender Preference</p>
              <p className="mt-1 text-sm text-slate-100">SBA Form 413 is the familiar personal statement format many lenders prefer to review.</p>
            </div>
            <div className="service-reveal rounded-2xl border border-white/20 bg-slate-950/45 p-4">
              <p className="text-sm font-semibold text-cyan-200">SBA Relevance</p>
              <p className="mt-1 text-sm text-slate-100">For SBA lending workflows, this form is commonly required for guarantor financial disclosure.</p>
            </div>
            <div className="service-reveal rounded-2xl border border-white/20 bg-slate-950/45 p-4">
              <p className="text-sm font-semibold text-cyan-200">Use Case</p>
              <p className="mt-1 text-sm text-slate-100">Download instantly and attach directly to lender packages and SBA credit files.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-2 md:pb-16" data-service-reveal>
        <article className="service-reveal rounded-3xl border border-slate-300/20 bg-white/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-200">How Easy It Is</p>
          <h2 className="mt-2 text-2xl font-black text-white">Three steps to a complete SBA Form 413 PDF</h2>
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
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-200">What It Covers</p>
          <h2 className="mt-2 text-2xl font-black text-white">The complete lender-facing personal statement scope</h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {coverage.map((item) => (
              <div key={item} className="service-lift rounded-xl border border-white/15 bg-slate-950/45 p-3">
                <p className="flex items-start gap-2 text-sm font-semibold text-slate-100">
                  <BadgeCheck className="mt-0.5 h-4 w-4 text-emerald-300" />
                  {item}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-200/20 bg-cyan-400/10 p-4 text-sm text-cyan-50">
            This workflow is designed to help you deliver the personal financial statement format lenders recognize fastest: SBA Form 413.
          </div>
        </article>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 md:pb-16" data-service-reveal>
        <div className="service-reveal rounded-3xl border border-slate-300/20 bg-white/5 p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-200">Before vs After</p>
          <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">From pieced-together statements to SBA Form 413 clarity</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-rose-200/30 bg-rose-200/10 p-4">
              <p className="text-sm font-semibold text-rose-100">Before</p>
              <ul className="mt-2 space-y-2 text-sm text-rose-50">
                <li className="flex gap-2"><CircleHelp className="mt-0.5 h-4 w-4" />Incomplete guarantor financial picture from disconnected docs</li>
                <li className="flex gap-2"><CircleHelp className="mt-0.5 h-4 w-4" />No standardized SBA/lender statement format</li>
                <li className="flex gap-2"><CircleHelp className="mt-0.5 h-4 w-4" />Higher risk of lender follow-up for missing personal financial details</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-emerald-200/30 bg-emerald-300/10 p-4">
              <p className="text-sm font-semibold text-emerald-100">After</p>
              <ul className="mt-2 space-y-2 text-sm text-emerald-50">
                <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4" />Single complete Personal Financial Statement PDF</li>
                <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4" />SBA Form 413 structure lenders and SBA teams recognize immediately</li>
                <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4" />Clearer guarantor strength profile for underwriting review</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 md:pb-16" data-service-reveal>
        <div className="service-reveal rounded-3xl border border-slate-300/20 bg-white/5 p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-200">FAQ</p>
          <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">Key SBA Form 413 questions answered</h2>

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
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-200">Ready to generate your SBA Form 413 PDF?</p>
            <h2 className="mt-2 text-2xl font-black text-white">Build your Personal Financial Statement now</h2>
            <p className="mt-1 text-sm text-slate-200">Or unlock all 5 templates in the full bundle for complete lender-readiness coverage.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <AuthAwareCheckoutButton
              className="service-magnetic h-11 rounded-xl bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200"
              data-service-magnetic
              id="pfs-service-final-cta-start"
              productType="personal_financial_statement"
            >
              Start for {singleTemplatePriceLabel}
            </AuthAwareCheckoutButton>
            <Button asChild variant="outline" className="h-11 rounded-xl border-cyan-200/35 bg-transparent text-cyan-100 hover:bg-cyan-300/10 hover:text-cyan-50">
              <Link id="pfs-service-final-cta-bundle" href="/services/templates-bundle">
                See Full Templates Bundle
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-300/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-slate-300 sm:px-6">
          <p className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-cyan-200" />Built for guarantors and owners preparing for lender review.</p>
          <p className="flex items-center gap-1.5"><Banknote className="h-3.5 w-3.5 text-cyan-200" />SBA Form 413 format aligned with common lender expectations.</p>
          <p className="flex items-center gap-1.5"><LineChart className="h-3.5 w-3.5 text-cyan-200" />Complete personal financial picture, not debt-only reporting.</p>
          <p className="flex items-center gap-1.5"><ListChecks className="h-3.5 w-3.5 text-cyan-200" />Instant downloadable SBA Form 413 PDF output.</p>
        </div>
      </section>
    </div>
  );
}
