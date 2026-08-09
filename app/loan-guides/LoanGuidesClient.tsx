"use client";

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BookOpenCheck,
  Calculator,
  ChevronDown,
  ClipboardCheck,
  FileSearch,
  Handshake,
  PackageCheck,
  Route,
  SearchCheck,
  WalletCards,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { LoanGuide } from '@/lib/loanGuides';
import { trackCtaClick, trackSectionView } from '@/lib/analytics';

type LoanGuidesClientProps = {
  guides: LoanGuide[];
};

const heroFeatureCards: Array<{ label: string; detail: string; icon: LucideIcon }> = [
  { label: 'Pick the loan purpose', detail: 'Learn the lender lens for the exact reason you need funding.', icon: SearchCheck },
  { label: 'Check the payment', detail: 'Estimate whether the cash flow can support the request.', icon: Calculator },
  { label: 'Package it correctly', detail: 'Prepare the story and documents lenders expect.', icon: PackageCheck },
];

const fundingPath = [
  {
    label: 'Start with the need',
    title: 'Choose the loan purpose',
    description: 'The purpose controls the lender questions. Equipment, working capital, acquisitions, and real estate all get reviewed differently.',
    icon: Route,
  },
  {
    label: 'Check affordability',
    title: 'See if the payment works',
    description: 'Before applying, estimate whether business cash flow can support the new debt payment with enough cushion.',
    icon: Calculator,
    cta: { label: 'Run the free payment check', href: '/#dscr-calculator', id: 'loan_guides_path_dscr' },
  },
  {
    label: 'Prepare the file',
    title: 'Build the loan package',
    description: 'Organize financials, debt schedules, use of funds, templates, and the borrower story so the lender can review faster.',
    icon: ClipboardCheck,
    cta: { label: 'Explore loan packaging', href: '/loan-services', id: 'loan_guides_path_packaging' },
  },
  {
    label: 'Find lender fit',
    title: 'Approach the right lenders',
    description: 'A cleaner package makes lender outreach more focused and reduces random applications to lenders that may not fit.',
    icon: Handshake,
    cta: { label: 'Explore lender help', href: '/loan-services', id: 'loan_guides_path_brokering' },
  },
  {
    label: 'Underwriting',
    title: 'Answer lender follow-up',
    description: 'The lender verifies documents, asks questions, reviews cash flow, collateral, credit, use of funds, and approval conditions.',
    icon: FileSearch,
  },
  {
    label: 'Funding',
    title: 'Close and receive funds',
    description: 'If the request clears underwriting and closing conditions, documents are signed and funds are disbursed according to the loan structure.',
    icon: Banknote,
  },
];

function trackGuideCta(sectionId: string, ctaId: string, ctaLabel: string, destinationUrl: string) {
  trackCtaClick({
    page_template: 'loan_guides_index',
    section_id: sectionId,
    cta_id: ctaId,
    cta_label: ctaLabel,
    destination_url: destinationUrl,
  });
}

export default function LoanGuidesClient({ guides }: LoanGuidesClientProps) {
  const [selectedSlug, setSelectedSlug] = useState(guides[0]?.slug ?? '');
  const seenSectionsRef = useRef<Set<string>>(new Set());
  const selectedGuide = useMemo(() => guides.find((guide) => guide.slug === selectedSlug) ?? guides[0], [guides, selectedSlug]);

  useEffect(() => {
    if (seenSectionsRef.current.has('hero')) return;
    seenSectionsRef.current.add('hero');
    trackSectionView({ page_template: 'loan_guides_index', section_id: 'hero', section_label: 'Hero' });
  }, []);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-loan-guide-section]'));
    if (!sections.length) return;

    const reveal = (section: HTMLElement) => {
      const sectionId = section.dataset.analyticsSection;
      const sectionLabel = section.dataset.analyticsLabel;
      if (sectionId && !seenSectionsRef.current.has(sectionId)) {
        seenSectionsRef.current.add(sectionId);
        trackSectionView({ page_template: 'loan_guides_index', section_id: sectionId, section_label: sectionLabel });
      }
    };

    if (!('IntersectionObserver' in window)) {
      sections.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -10% 0px' },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  if (!selectedGuide) return null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,0.30),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(251,191,36,0.20),transparent_30%),linear-gradient(135deg,#020617_0%,#082f49_46%,#0f172a_100%)]" />
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:54px_54px]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-100/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-100 backdrop-blur sm:px-4 sm:py-2 sm:text-xs">
              <BookOpenCheck className="h-4 w-4" />
              Business loan guide by purpose
            </div>
            <h1 className="mt-5 max-w-4xl text-[2.4rem] font-black leading-[0.98] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
              Know the loan process before you start applying.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-200 sm:text-xl sm:leading-8">
              Pick your funding need, learn what lenders care about, check whether the payment makes sense, then prepare a cleaner package before lender outreach.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="#choose-loan-purpose"
                onClick={() => trackGuideCta('hero', 'loan_guides_hero_choose_purpose', 'Choose My Loan Purpose', '#choose-loan-purpose')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-2xl shadow-cyan-950/20 transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Choose My Loan Purpose
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/#dscr-calculator"
                onClick={() => trackGuideCta('hero', 'loan_guides_hero_dscr', 'See If the Payment Works', '/#dscr-calculator')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                See If the Payment Works
                <Calculator className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold text-slate-200">
              <span className="rounded-full bg-white/10 px-3 py-1.5">Free education</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5">Plain English</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5">Built for business owners</span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-2xl shadow-slate-950/30 backdrop-blur sm:p-5">
            <div className="rounded-[1.5rem] bg-white p-4 text-slate-950 sm:p-5">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Funding roadmap</p>
                  <h2 className="mt-1 text-xl font-black tracking-[-0.03em]">From need to funded</h2>
                </div>
                <WalletCards className="h-8 w-8 text-cyan-700" />
              </div>
              <div className="mt-4 space-y-3">
                {fundingPath.slice(0, 4).map((step, index) => (
                  <div key={step.title} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-white">{index + 1}</div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-700">{step.label}</p>
                      <p className="mt-0.5 text-sm font-black text-slate-950">{step.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white" data-loan-guide-section data-analytics-section="hero_features" data-analytics-label="Hero Features">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-4 sm:grid-cols-3 sm:px-6">
          {heroFeatureCards.map(({ label, detail, icon: Icon }) => (
            <div key={label} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" />
              <div>
                <p className="text-sm font-black text-slate-950">{label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14" data-loan-guide-section data-analytics-section="loan_process_overview" data-analytics-label="Loan Process Overview">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-700">The big picture</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">The loan purpose is the starting point, not a small detail.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Lenders do not review every business loan the same way. First they ask what the money is for. Then they ask whether the business can afford it, whether the documents support the story, and whether the lender is a fit.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {fundingPath.map((step, index) => (
              <div key={step.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-sm font-black text-cyan-800">{index + 1}</div>
                  <step.icon className="h-5 w-5 text-slate-400" />
                </div>
                <p className="mt-4 text-[11px] font-black uppercase tracking-[0.16em] text-cyan-700">{step.label}</p>
                <h3 className="mt-1 text-lg font-black tracking-[-0.02em] text-slate-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                {step.cta ? (
                  <Link
                    href={step.cta.href}
                    onClick={() => trackGuideCta('loan_process_overview', step.cta.id, step.cta.label, step.cta.href)}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-black text-cyan-800 transition hover:text-cyan-950"
                  >
                    {step.cta.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="choose-loan-purpose" className="scroll-mt-24 bg-white" data-loan-guide-section data-analytics-section="choose_loan_purpose" data-analytics-label="Choose Loan Purpose">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-700">Choose your loan type</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">Pick the need. Get the exact guide.</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Instead of showing every loan as a huge wall of cards, choose one purpose and preview the most important lender concerns before opening the full guide.
              </p>
              <div className="relative mt-6">
                <select
                  value={selectedSlug}
                  onChange={(event) => setSelectedSlug(event.target.value)}
                  className="w-full appearance-none rounded-2xl border border-slate-300 bg-white px-4 py-4 pr-12 text-base font-black text-slate-950 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  aria-label="Choose a loan purpose"
                >
                  {guides.map((guide) => (
                    <option key={guide.slug} value={guide.slug}>{guide.shortTitle}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {guides.slice(0, 8).map((guide) => (
                  <button
                    key={guide.slug}
                    type="button"
                    onClick={() => setSelectedSlug(guide.slug)}
                    className={`rounded-full px-3 py-1.5 text-xs font-black transition ${selectedSlug === guide.slug ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    {guide.shortTitle}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-6">
              <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Selected guide</p>
                    <h3 className="mt-2 text-2xl font-black tracking-[-0.035em] text-slate-950 sm:text-3xl">{selectedGuide.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{selectedGuide.purpose}</p>
                  </div>
                  <Link
                    href={`/loan-guides/${selectedGuide.slug}`}
                    onClick={() => trackGuideCta('choose_loan_purpose', 'loan_guides_open_selected', `Open ${selectedGuide.shortTitle}`, `/loan-guides/${selectedGuide.slug}`)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    Open guide
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {selectedGuide.lenderFocus.slice(0, 3).map((item) => (
                    <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <BadgeCheck className="h-5 w-5 text-emerald-600" />
                      <p className="mt-2 text-xs font-bold leading-5 text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white" data-loan-guide-section data-analytics-section="service_next_steps" data-analytics-label="Service Next Steps">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">When you are ready to move</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Education is step one. A cleaner funding request is the next advantage.</h2>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {[
              { title: 'Free payment check', text: 'Estimate whether the proposed payment is realistic before spending time applying.', icon: Calculator, href: '/#dscr-calculator', label: 'See if the payment works', id: 'loan_guides_service_dscr' },
              { title: 'Loan packaging', text: 'Turn documents, templates, use of funds, and the borrower story into a cleaner lender-ready package.', icon: PackageCheck, href: '/loan-services', label: 'Explore packaging', id: 'loan_guides_service_packaging' },
              { title: 'Loan brokering', text: 'When you want lender help too, use the package as the base for more focused lender outreach.', icon: Handshake, href: '/loan-services', label: 'Explore lender help', id: 'loan_guides_service_brokering' },
            ].map((card) => (
              <div key={card.title} className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
                <card.icon className="h-7 w-7 text-cyan-200" />
                <h3 className="mt-4 text-xl font-black tracking-[-0.03em]">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{card.text}</p>
                <Link
                  href={card.href}
                  onClick={() => trackGuideCta('service_next_steps', card.id, card.label, card.href)}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-black text-cyan-100 transition hover:text-white"
                >
                  {card.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
