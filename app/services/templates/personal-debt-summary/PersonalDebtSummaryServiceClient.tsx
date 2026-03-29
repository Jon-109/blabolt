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
import PersonalDebtSummarySvgTemplate from '@/app/(components)/templates/PersonalDebtSummarySvgTemplate';
import AuthAwareCheckoutButton from '@/app/services/components/AuthAwareCheckoutButton';
import useServicePageMotion from '@/app/services/components/useServicePageMotion';
import { personalDebtSummaryPreviewData } from '@/lib/templates/preview-data';
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
    title: 'Lender-ready debt schedule',
    text: 'One polished summary of balances, monthly payments, and exposure so an underwriter can evaluate repayment pressure quickly, then download it as a PDF.',
    icon: FileCheck2,
  },
  {
    title: 'Debt grouped the way lenders review it',
    text: 'Revolving, installment, and real-estate debt are organized into practical groups for cleaner credit analysis.',
    icon: Layers,
  },
  {
    title: 'Clear payment burden visibility',
    text: 'Monthly debt service totals and grouped breakdowns make your obligations obvious and easier to defend in conversations with lenders.',
    icon: BarChart3,
  },
];

const steps = [
  {
    title: 'Answer guided prompts in plain English',
    body: 'The form walks you debt category by debt category so you are never guessing what lenders need.',
  },
  {
    title: 'Enter balances and payments once',
    body: 'Structured fields capture exactly what lenders ask for while automatically organizing debts into a lender-friendly format.',
  },
  {
    title: 'Generate your polished PDF instantly',
    body: 'Your Personal Debt Summary is immediately available as a clean PDF download, ready to attach to your loan file.',
  },
];

const categories = [
  'Credit Cards',
  'Personal Line of Credit',
  'Real Estate Debt',
  'Student Debt',
  'Vehicle Loans',
  'Other Personal Debt',
];

const faqs = [
  {
    q: 'What exactly is this service?',
    a: 'This is a guided template service that helps you produce a lender-ready Personal Debt Summary without building the structure yourself. You answer prompts, enter debt details, and get a professional output you can use in financing conversations.',
  },
  {
    q: `What do I receive for ${singleTemplatePriceLabel}?`,
    a: `You receive access to complete the Personal Debt Summary workflow, generate a polished PDF ready for immediate download and lender review, and create up to ${TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE} separate builds of this template. That gives you room for multiple reporting dates, updated debt snapshots, revised lender-requested versions, or different owner/guarantor scenarios when needed.`,
  },
  {
    q: 'How many versions can I create with this template?',
    a: `You can create up to ${TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE} separate builds of the Personal Debt Summary template. That is helpful when you need multiple dates, cleaner updated drafts, or different guarantor debt versions for the same file.`,
  },
  {
    q: 'How hard is it to complete?',
    a: 'It is designed to feel straightforward. The form is step-based, category-driven, and prompts you through every major debt type so you can finish fast even if you are not a finance expert.',
  },
  {
    q: 'Can I buy only this template without the bundle?',
    a: `Yes. This page is for the single Personal Debt Summary template at ${singleTemplatePriceLabel}. If you later want everything, the full bundle is ${bundlePriceLabel} one-time.`,
  },
  {
    q: 'Will this replace my accountant or lender?',
    a: 'No. This helps you present debt information in a cleaner, lender-friendly format. It improves readiness and communication but does not replace professional tax or legal advice.',
  },
];

export default function PersonalDebtSummaryServiceClient() {
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
              Personal Debt Summary Template Service
            </p>

            <h1 className="service-reveal max-w-3xl text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
              Turn Scattered Personal Debts Into a Single Lender-Ready Summary
            </h1>

            <p className="service-reveal max-w-3xl text-base text-slate-200 sm:text-lg">
              Stop piecing together debt details from spreadsheets and statements. This service guides you step by step and produces a clean, professional Personal Debt Summary PDF you can download instantly.
            </p>

            <div className="service-reveal grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-300/20 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.11em] text-cyan-200">What You Get</p>
                <p className="mt-1 text-sm text-slate-100">A structured debt profile plus an instant, polished PDF download ready for lender sharing.</p>
              </div>
              <div className="rounded-2xl border border-slate-300/20 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.11em] text-emerald-200">Why It Converts Better</p>
                <p className="mt-1 text-sm text-slate-100">Underwriters can understand your obligations faster, reducing friction in early review.</p>
              </div>
            </div>
          </div>

          <aside className="service-reveal lg:sticky lg:top-24 lg:self-start" data-service-reveal>
            <div className="service-lift rounded-3xl border border-cyan-200/30 bg-slate-950/65 p-6 shadow-2xl backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-200">Single Template Access</p>
              <p className="mt-2 text-5xl font-black text-white">{singleTemplatePriceLabel}</p>
              <p className="mt-2 text-sm text-slate-300">One-time purchase for the Personal Debt Summary template service.</p>

              <ul className="mt-5 space-y-2 text-sm text-slate-100">
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />Guided form experience from first field to final output</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />Debt grouped in underwriter-friendly structure</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />Up to {TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE} builds for different dates, revisions, or guarantor scenarios</li>
              </ul>

              <div className="mt-6 space-y-3">
                <AuthAwareCheckoutButton
                  className="service-magnetic h-12 w-full rounded-xl bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200"
                  data-service-magnetic
                  id="personal-debt-service-hero-cta-start"
                  productType="personal_debt_summary"
                >
                  Start Personal Debt Summary for {singleTemplatePriceLabel}
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
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">See the exact style of PDF you get</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
            <FileDown className="h-3.5 w-3.5" />
            Instant PDF download
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.34fr_0.66fr]">
          <div className="service-reveal space-y-3">
            <div className="service-lift rounded-2xl border border-slate-300/20 bg-white/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-cyan-100"><Download className="h-4 w-4 text-cyan-200" />Immediate PDF Output</p>
              <p className="mt-1 text-sm text-slate-200">Once complete, your polished Personal Debt Summary PDF is ready instantly.</p>
            </div>
            <div className="service-lift rounded-2xl border border-slate-300/20 bg-white/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-cyan-100"><Layers className="h-4 w-4 text-cyan-200" />Grouped for Underwriting</p>
              <p className="mt-1 text-sm text-slate-200">Debt categories and totals are organized in a format lenders can review quickly.</p>
            </div>
            <div className="service-lift rounded-2xl border border-slate-300/20 bg-white/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-cyan-100"><FileCheck2 className="h-4 w-4 text-cyan-200" />Clean, Professional Layout</p>
              <p className="mt-1 text-sm text-slate-200">No messy spreadsheets. You get a polished document designed for financing files.</p>
            </div>
          </div>

          <div className="service-reveal rounded-2xl border border-slate-300/20 bg-slate-950/45 p-3 sm:p-4">
            <div className="mx-auto w-full max-w-[816px] rounded-xl bg-white shadow-[0_20px_55px_-35px_rgba(56,189,248,0.7)]">
              <PersonalDebtSummarySvgTemplate data={personalDebtSummaryPreviewData} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16" data-service-reveal>
        <div className="mb-8 service-reveal">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-200">What This Service Is</p>
          <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">A guided debt-intake workflow built for lender conversations</h2>
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
          <h2 className="service-reveal mt-2 text-2xl font-black text-white md:text-3xl">A polished PDF you can download immediately</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="service-reveal rounded-2xl border border-white/20 bg-slate-950/45 p-4">
              <p className="text-sm font-semibold text-cyan-200">Primary Deliverable</p>
              <p className="mt-1 text-sm text-slate-100">Personal Debt Summary PDF with category-level and account-level detail.</p>
            </div>
            <div className="service-reveal rounded-2xl border border-white/20 bg-slate-950/45 p-4">
              <p className="text-sm font-semibold text-cyan-200">Financial Clarity</p>
              <p className="mt-1 text-sm text-slate-100">Monthly debt service totals and grouped exposure for cleaner underwriting review.</p>
            </div>
            <div className="service-reveal rounded-2xl border border-white/20 bg-slate-950/45 p-4">
              <p className="text-sm font-semibold text-cyan-200">Operational Benefit</p>
              <p className="mt-1 text-sm text-slate-100">Eliminates ad-hoc debt explanations and improves how you present obligations.</p>
            </div>
            <div className="service-reveal rounded-2xl border border-white/20 bg-slate-950/45 p-4">
              <p className="text-sm font-semibold text-cyan-200">Use Case</p>
              <p className="mt-1 text-sm text-slate-100">Download and attach instantly to lender package, underwriting follow-up, or internal loan-readiness review.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-2 md:pb-16" data-service-reveal>
        <article className="service-reveal rounded-3xl border border-slate-300/20 bg-white/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-200">How Easy It Is</p>
          <h2 className="mt-2 text-2xl font-black text-white">Three steps from zero to downloadable PDF</h2>
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
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-200">Debt Coverage</p>
          <h2 className="mt-2 text-2xl font-black text-white">Every major category your lender asks about</h2>

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
            The form flow ensures category completeness so you can submit with fewer missing details and fewer lender callbacks.
          </div>
        </article>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 md:pb-16" data-service-reveal>
        <div className="service-reveal rounded-3xl border border-slate-300/20 bg-white/5 p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-200">Before vs After</p>
          <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">From scattered debt notes to bank-ready clarity</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-rose-200/30 bg-rose-200/10 p-4">
              <p className="text-sm font-semibold text-rose-100">Before</p>
              <ul className="mt-2 space-y-2 text-sm text-rose-50">
                <li className="flex gap-2"><CircleHelp className="mt-0.5 h-4 w-4" />Debt details spread across statements and spreadsheets</li>
                <li className="flex gap-2"><CircleHelp className="mt-0.5 h-4 w-4" />No consistent category grouping for underwriter review</li>
                <li className="flex gap-2"><CircleHelp className="mt-0.5 h-4 w-4" />Hard to explain total monthly payment burden quickly</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-emerald-200/30 bg-emerald-300/10 p-4">
              <p className="text-sm font-semibold text-emerald-100">After</p>
              <ul className="mt-2 space-y-2 text-sm text-emerald-50">
                <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4" />Single professional debt summary lenders can scan fast</li>
                <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4" />Structured by revolving, installment, and real-estate debt</li>
                <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4" />Clear monthly debt service profile for financing discussions</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 md:pb-16" data-service-reveal>
        <div className="service-reveal rounded-3xl border border-slate-300/20 bg-white/5 p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-200">FAQ</p>
          <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">Common questions before you start</h2>

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
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-200">Ready to move faster with lenders?</p>
            <h2 className="mt-2 text-2xl font-black text-white">Build your Personal Debt Summary now</h2>
            <p className="mt-1 text-sm text-slate-200">Or unlock all 5 templates in the full bundle for stronger end-to-end readiness.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <AuthAwareCheckoutButton
              className="service-magnetic h-11 rounded-xl bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200"
              data-service-magnetic
              id="personal-debt-service-final-cta-start"
              productType="personal_debt_summary"
            >
              Start for {singleTemplatePriceLabel}
            </AuthAwareCheckoutButton>
            <Button asChild variant="outline" className="h-11 rounded-xl border-cyan-200/35 bg-transparent text-cyan-100 hover:bg-cyan-300/10 hover:text-cyan-50">
              <Link id="personal-debt-service-final-cta-bundle" href="/services/templates-bundle">
                See Full Templates Bundle
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-300/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-slate-300 sm:px-6">
          <p className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-cyan-200" />Built for owners and guarantors preparing for financing review.</p>
          <p className="flex items-center gap-1.5"><Banknote className="h-3.5 w-3.5 text-cyan-200" />Practical formatting for lender communication clarity.</p>
          <p className="flex items-center gap-1.5"><LineChart className="h-3.5 w-3.5 text-cyan-200" />Structured debt visibility for better decision conversations.</p>
          <p className="flex items-center gap-1.5"><ListChecks className="h-3.5 w-3.5 text-cyan-200" />Start with this template now, upgrade to bundle anytime.</p>
        </div>
      </section>
    </div>
  );
}
