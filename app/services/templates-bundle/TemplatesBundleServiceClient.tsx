'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Boxes,
  CheckCircle2,
  Crown,
  FileText,
  Gauge,
  Layers,
  LayoutDashboard,
  Rocket,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/app/(components)/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/(components)/ui/accordion';
import AuthAwareCheckoutButton from '@/app/services/components/AuthAwareCheckoutButton';
import useServicePageMotion from '@/app/services/components/useServicePageMotion';
import {
  TEMPLATE_A_LA_CARTE_FULL_SET_CENTS,
  TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE,
  TEMPLATE_BUNDLE_PRICE_CENTS,
  TEMPLATE_BUNDLE_SAVINGS_CENTS,
  TEMPLATE_COUNT,
  TEMPLATE_OFFERS,
  TEMPLATE_UNIT_PRICE_CENTS,
  formatUsd,
} from '@/lib/template-offers';

const bundleFaqs = [
  {
    q: 'What is included in the Templates Bundle?',
    a: 'You get access to all five templates: Business Debt Summary, Balance Sheet, Income Statement, Personal Financial Statement, and Personal Debt Summary.',
  },
  {
    q: 'How many outputs can I produce?',
    a: `Bundle policy includes up to ${TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE} outputs per template. That gives you room to create updated versions as your deal evolves.`,
  },
  {
    q: 'Can I still buy templates individually?',
    a: `Yes. Each template is available a la carte for ${formatUsd(TEMPLATE_UNIT_PRICE_CENTS)} if you only need a few specific documents.`,
  },
  {
    q: 'Who should buy the bundle?',
    a: 'Buy the bundle if you want a complete lender-ready document stack, expect multiple lender conversations, or want to avoid switching between one-off purchases.',
  },
  {
    q: 'How does bundle checkout work?',
    a: 'Users sign in first, then go to secure Stripe checkout for the live Templates Bundle product. After payment, they land in the Templates dashboard with all five templates unlocked.',
  },
];

const workflow = [
  {
    title: 'Log in and access your template workspace',
    body: 'Enter one place where all core template workflows live, instead of bouncing between disconnected files.',
    icon: LayoutDashboard,
  },
  {
    title: 'Complete guided forms with lender context',
    body: 'Each template asks for exactly what is needed in a structured format lenders can evaluate quickly.',
    icon: Gauge,
  },
  {
    title: 'Generate clean outputs across all categories',
    body: 'Business and personal documents stay aligned, so your full package tells one coherent financial story.',
    icon: Layers,
  },
  {
    title: 'Iterate as needed with output limits included',
    body: `Bundle policy supports up to ${TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE} outputs per template so you can update and refine without friction.`,
    icon: Rocket,
  },
];

const dashboardPreview = [
  { label: 'Business Debt Summary', status: 'Completed', generated: '3/5 outputs used' },
  { label: 'Balance Sheet', status: 'In Progress', generated: '2/5 outputs used' },
  { label: 'Income Statement', status: 'In Progress', generated: '2/5 outputs used' },
  { label: 'Personal Financial Statement', status: 'Ready to Start', generated: '0/5 outputs used' },
  { label: 'Personal Debt Summary', status: 'Completed', generated: '1/5 outputs used' },
];

export default function TemplatesBundleServiceClient() {
  useServicePageMotion();

  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    TEMPLATE_OFFERS.reduce<Record<string, boolean>>((acc, template, index) => {
      acc[template.slug] = index < 2;
      return acc;
    }, {}),
  );

  const selectedTemplates = useMemo(
    () => TEMPLATE_OFFERS.filter((template) => selected[template.slug]),
    [selected],
  );

  const selectedCount = selectedTemplates.length;
  const selectedAlaCarteTotalCents = selectedCount * TEMPLATE_UNIT_PRICE_CENTS;
  const selectedSavingsCents = selectedAlaCarteTotalCents - TEMPLATE_BUNDLE_PRICE_CENTS;
  const bundleIsBetter = selectedSavingsCents > 0;
  const almostBreakEven = selectedSavingsCents >= -50 && selectedSavingsCents <= 0;

  const toggleTemplate = (slug: string) => {
    setSelected((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_6%,#17385c_0%,#0a1528_36%,#030712_72%)] text-slate-100">
      <section data-service-hero className="relative overflow-hidden border-b border-cyan-200/20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(45,212,191,0.10)_0%,rgba(251,191,36,0.08)_40%,transparent_74%)]" />
        <div className="pointer-events-none absolute -left-20 top-12 h-56 w-56 rounded-full bg-teal-300/20 blur-3xl service-glow service-hero-parallax" />
        <div className="pointer-events-none absolute right-4 top-10 h-52 w-52 rounded-full bg-amber-300/20 blur-3xl service-glow-delayed service-hero-parallax-reverse" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.14fr_0.86fr] lg:gap-10">
          <div className="service-reveal space-y-6" data-service-reveal>
            <p className="service-reveal inline-flex items-center gap-2 rounded-full border border-teal-200/35 bg-teal-200/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.11em] text-teal-100">
              <Sparkles className="h-3.5 w-3.5" />
              Templates Bundle Service
            </p>
            <h1 className="service-reveal max-w-3xl text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
              Get All 5 Lender-Ready Templates in One Bundle
            </h1>
            <p className="service-reveal max-w-3xl text-base text-slate-200 sm:text-lg">
              Build a complete financing document stack faster. Instead of buying templates one by one, unlock the full suite once and keep your package aligned from debt summaries to financial statements.
            </p>

            <div className="service-reveal grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-teal-200">Bundle Price</p>
                <p className="mt-1 text-2xl font-black text-white">{formatUsd(TEMPLATE_BUNDLE_PRICE_CENTS)} one-time</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-200">Value Math</p>
                <p className="mt-1 text-sm text-slate-100">{TEMPLATE_COUNT} templates a la carte = {formatUsd(TEMPLATE_A_LA_CARTE_FULL_SET_CENTS)}. Bundle saves {formatUsd(TEMPLATE_BUNDLE_SAVINGS_CENTS)}.</p>
              </div>
            </div>
          </div>

          <aside className="service-reveal lg:sticky lg:top-24 lg:self-start" data-service-reveal>
            <div className="service-lift rounded-3xl border border-teal-200/25 bg-slate-950/65 p-6 shadow-2xl backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.11em] text-teal-200">Full Access Bundle</p>
              <p className="mt-2 text-5xl font-black text-white">{formatUsd(TEMPLATE_BUNDLE_PRICE_CENTS)}</p>
              <p className="mt-2 text-sm text-slate-300">One purchase, full templates workspace access.</p>

              <ul className="mt-5 space-y-2 text-sm text-slate-100">
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />All 5 lender-oriented templates included</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />Up to {TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE} outputs per template (bundle policy)</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />Single workflow for business and personal supporting docs</li>
              </ul>

              <div className="mt-6 space-y-3">
                <AuthAwareCheckoutButton
                  className="service-magnetic h-12 w-full rounded-xl bg-teal-300 font-bold text-slate-950 hover:bg-teal-200"
                  data-service-magnetic
                  id="templates-bundle-hero-cta-start"
                  productType="templates_bundle"
                >
                  Get Full Bundle Access
                </AuthAwareCheckoutButton>
                <Button asChild variant="outline" className="h-11 w-full rounded-xl border-teal-200/35 bg-transparent font-semibold text-teal-100 hover:bg-teal-300/10 hover:text-teal-50">
                  <Link id="templates-bundle-hero-cta-dashboard-demo" href="/services/templates-bundle/dashboard-demo">
                    View Dashboard Demo
                  </Link>
                </Button>
              </div>

              <p className="mt-4 text-xs text-slate-300">
                Need only one template right now? A la carte starts at {formatUsd(TEMPLATE_UNIT_PRICE_CENTS)} each.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16" data-service-reveal>
        <div className="service-reveal mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-teal-200">A La Carte vs Bundle</p>
          <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Choose templates and compare value instantly</h2>
          <p className="mt-2 text-sm text-slate-200">Toggle what you need now. The calculator shows when bundle value is strongest.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="service-reveal rounded-2xl border border-slate-300/20 bg-white/5 p-5 md:p-6">
            <p className="text-sm font-semibold text-teal-200">Select templates (1-5)</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {TEMPLATE_OFFERS.map((template) => {
                const active = selected[template.slug];
                return (
                  <button
                    key={template.slug}
                    type="button"
                    onClick={() => toggleTemplate(template.slug)}
                    className={`service-lift rounded-xl border p-4 text-left transition ${
                      active
                        ? 'border-teal-200/45 bg-teal-300/10'
                        : 'border-slate-300/20 bg-slate-950/35 hover:border-slate-300/35'
                    }`}
                    aria-pressed={active}
                  >
                    <p className="flex items-center justify-between text-sm font-bold text-white">
                      {template.name}
                      {active ? <BadgeCheck className="h-4 w-4 text-teal-200" /> : null}
                    </p>
                    <p className="mt-1 text-xs text-slate-300">{template.shortDescription}</p>
                  </button>
                );
              })}
            </div>
          </article>

          <article className="service-reveal rounded-2xl border border-teal-200/25 bg-gradient-to-br from-slate-950/75 via-teal-900/25 to-slate-900/70 p-5 md:p-6">
            <p className="text-sm font-semibold text-teal-200">Live pricing comparison</p>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-xl border border-slate-300/20 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Selected Templates</p>
                <p className="mt-1 text-3xl font-black text-white">{selectedCount}</p>
              </div>
              <div className="rounded-xl border border-slate-300/20 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.1em] text-slate-400">A la carte total</p>
                <p className="mt-1 text-2xl font-black text-white">{formatUsd(selectedAlaCarteTotalCents)}</p>
              </div>
              <div className="rounded-xl border border-amber-200/30 bg-amber-200/10 p-4">
                <p className="text-xs uppercase tracking-[0.1em] text-amber-100">Bundle total</p>
                <p className="mt-1 text-2xl font-black text-amber-50">{formatUsd(TEMPLATE_BUNDLE_PRICE_CENTS)}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/20 bg-white/10 p-4 text-sm text-slate-100">
              {selectedCount === 0 ? (
                <p>Select one or more templates to compare against bundle pricing.</p>
              ) : bundleIsBetter ? (
                <p>
                  <span className="font-bold text-emerald-200">Bundle saves you {formatUsd(selectedSavingsCents)}</span> for your current selection.
                </p>
              ) : almostBreakEven ? (
                <p>
                  You are near break-even. If you may need more templates later, bundle can still reduce future friction.
                </p>
              ) : (
                <p>
                  A la carte is currently lower for this selection. Bundle becomes stronger as your document needs expand.
                </p>
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 md:pb-16" data-service-reveal>
        <div className="service-reveal mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-teal-200">What Is Included</p>
          <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Five templates that complete the lender story</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TEMPLATE_OFFERS.map((template) => (
            <article key={template.slug} className="service-reveal service-tilt rounded-2xl border border-slate-300/20 bg-white/5 p-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/20 bg-slate-900/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-300">
                <FileText className="h-3.5 w-3.5 text-teal-200" />
                {template.category}
              </div>
              <h3 className="mt-3 text-lg font-bold text-white">{template.name}</h3>
              <p className="mt-1 text-sm text-slate-200">{template.shortDescription}</p>
              <p className="mt-3 text-sm text-teal-100">{template.outcome}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 md:pb-16" data-service-reveal>
        <div className="rounded-3xl border border-slate-300/20 bg-white/5 p-6 md:p-8">
          <div className="service-reveal mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-teal-200">How The Bundle Works</p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">One workflow, complete document stack</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {workflow.map((step) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="service-reveal rounded-2xl border border-white/15 bg-slate-950/45 p-5">
                  <Icon className="h-6 w-6 text-teal-200" />
                  <h3 className="mt-2 text-lg font-bold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm text-slate-200">{step.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 md:pb-16" data-service-reveal>
        <div className="service-reveal rounded-3xl border border-teal-200/20 bg-gradient-to-r from-slate-950/70 to-teal-950/35 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-teal-200">Dashboard Preview</p>
              <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">See what your templates workspace can look like</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-200">Preview output counters, progress states, and template completion flow in the bundle dashboard mock.</p>
            </div>
            <Button asChild className="service-magnetic h-11 rounded-xl bg-white text-slate-900 hover:bg-slate-100" data-service-magnetic>
              <Link id="templates-bundle-dashboard-demo-cta" href="/services/templates-bundle/dashboard-demo">
                Open Dashboard Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {dashboardPreview.map((item) => (
              <div key={item.label} className="service-lift rounded-xl border border-white/20 bg-slate-950/50 p-4">
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="mt-1 text-xs text-teal-200">{item.status}</p>
                <p className="mt-1 text-xs text-slate-300">{item.generated}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 md:pb-16" data-service-reveal>
        <div className="service-reveal rounded-3xl border border-slate-300/20 bg-white/5 p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-teal-200">FAQ</p>
          <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">Bundle questions answered clearly</h2>

          <Accordion type="single" collapsible className="mt-4">
            {bundleFaqs.map((faq, index) => (
              <AccordionItem key={faq.q} value={`faq-${index}`} className="border-slate-300/20">
                <AccordionTrigger className="text-left text-sm font-semibold text-slate-100 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-6 text-slate-200">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="border-t border-teal-200/20 bg-slate-950/55">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-teal-200">Build the complete lender-ready set</p>
            <h2 className="mt-2 text-2xl font-black text-white">Get all 5 templates in one bundle</h2>
            <p className="mt-1 text-sm text-slate-200">Need just one first? Start with Business Debt Summary and scale up later.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <AuthAwareCheckoutButton
              className="service-magnetic h-11 rounded-xl bg-teal-300 font-semibold text-slate-950 hover:bg-teal-200"
              data-service-magnetic
              id="templates-bundle-final-cta-start"
              productType="templates_bundle"
            >
              Get Bundle for {formatUsd(TEMPLATE_BUNDLE_PRICE_CENTS)}
            </AuthAwareCheckoutButton>
            <Button asChild variant="outline" className="h-11 rounded-xl border-teal-200/35 bg-transparent text-teal-100 hover:bg-teal-300/10 hover:text-teal-50">
              <Link id="templates-bundle-final-cta-business-debt" href="/services/templates/business-debt-summary">
                View Business Debt Summary
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-300/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-slate-300 sm:px-6">
          <p className="flex items-center gap-1.5"><Crown className="h-3.5 w-3.5 text-teal-200" />Complete 5-template workspace in one purchase.</p>
          <p className="flex items-center gap-1.5"><Boxes className="h-3.5 w-3.5 text-teal-200" />Business + personal coverage in one flow.</p>
          <p className="flex items-center gap-1.5"><Banknote className="h-3.5 w-3.5 text-teal-200" />{formatUsd(TEMPLATE_BUNDLE_SAVINGS_CENTS)} savings vs full a la carte set.</p>
          <p className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-teal-200" />Up to {TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE} outputs per template.</p>
          <p className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-teal-200" />Designed for financing file readiness.</p>
        </div>
      </section>
    </div>
  );
}
