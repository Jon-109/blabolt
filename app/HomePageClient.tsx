"use client";

import React, { Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sora } from 'next/font/google';
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  Building2,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Handshake,
  Info,
  Search,
  ShieldCheck,
  TrendingUp,
  Workflow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { supabase } from '@/supabase/helpers/client';
import DscrQuickCalculator from '@/app/(components)/cash-flow/DscrQuickCalculator';
import Testimonials from '@/app/(components)/shared/Testimonials';
import LoanPackagingExplainer from '@/app/(components)/shared/LoanPackagingExplainer';
import { trackCtaClick, trackSectionView } from '@/lib/analytics';

const headingFont = Sora({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
});

const marqueeItems = [
  'Free DSCR Check',
  'Comprehensive Cash Flow Review',
  'Loan Packaging Dashboard',
  'Guided Templates',
  'Cover Letter Drafting',
  'Package ZIP Export',
  'Secure Lender Links',
  'Loan Brokering',
];

const serviceCards = [
  {
    badge: 'FREE START',
    stage: 'Start here',
    title: 'Quick DSCR Check',
    description: 'DSCR stands for Debt Service Coverage Ratio, and it is one of the main numbers lenders use to decide whether your business cash flow can safely handle a loan payment.',
    bullets: [
      'Understand the number lenders look at to judge repayment ability',
      'See whether your cash flow looks strong, borderline, or risky before you go further',
      'Use a fast first-pass check to decide if the deal may be worth packaging and shopping',
    ],
    ctaLabel: 'Start Free Check',
    ctaHref: '#dscr-calculator',
    icon: BarChart3,
  },
  {
    badge: 'FULL ANALYSIS',
    stage: 'Go deeper',
    title: 'Comprehensive Cash Flow Review',
    description: 'A deeper financial review for owners who want a clearer picture of how lenders may evaluate cash flow, debt, and repayment capacity.',
    bullets: [
      'Review historical and year-to-date performance',
      'Analyze debt obligations and repayment capacity in more detail',
      'Get clearer lender-facing insights before moving forward',
    ],
    ctaLabel: 'Explore Full Analysis',
    ctaHref: '/cash-flow-analysis',
    icon: TrendingUp,
  },
  {
    badge: 'DONE-WITH-YOU',
    stage: 'Get organized',
    title: 'Loan Packaging Dashboard + Templates',
    description: 'Our guided packaging system helps you organize documents, complete lender-ready templates, and generate a professional cover letter for your loan request.',
    bullets: [
      'Guided checklist, uploads, and shared business profile data',
      'Five lender-ready templates with PDF generation',
      'AI-assisted cover letter generation, package exports, and secure lender links',
    ],
    ctaLabel: 'Explore Loan Packaging',
    ctaHref: '/loan-services',
    icon: Workflow,
  },
  {
    badge: 'BROKERING',
    stage: 'Reach the finish line',
    title: 'Loan Brokering',
    description: 'This is everything in Loan Packaging Dashboard + Templates, plus we help find a lender willing to take on your deal and keep it moving toward a real closing.',
    bullets: [
      'Includes the full dashboard, guided templates, cover letter, exports, and lender-ready package',
      'We help place your deal with lenders that fit the request instead of leaving you to cold-apply',
      'We stay in it through lender conversations, underwriting follow-up, and closing steps',
    ],
    ctaLabel: 'Explore Loan Brokering',
    ctaHref: '/loan-services',
    icon: Handshake,
  },
];

type ProcessStep = {
  step: string;
  summaryLabel: string;
  title: string;
  description: string;
  pain: string;
  icon: LucideIcon;
  featured?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
};

const processSteps: ProcessStep[] = [
  {
    step: '01',
    summaryLabel: 'Need',
    title: 'Find a business need worth financing',
    description: 'A loan can help you buy equipment, hire staff, expand, take on bigger jobs, or create more revenue if the opportunity is there.',
    pain: 'If you do not know what the money will help you do, it is hard to know whether borrowing makes sense.',
    icon: Search,
  },
  {
    step: '02',
    summaryLabel: 'Qualify',
    title: 'Know if you can afford a loan right now',
    description: 'Before applying, check whether your current cash flow can realistically handle another monthly payment.',
    pain: 'This helps you avoid applying too early or taking on a payment the business cannot support yet.',
    icon: Calculator,
    featured: true,
  },
  {
    step: '03',
    summaryLabel: 'Package',
    title: 'Build the complete loan package and cover letter',
    description: 'This can mean a lot of documents: tax returns, financials, bank statements, debt schedules, ownership info, and a cover letter explaining the request.',
    pain: 'This is where missing files, messy folders, and mismatched numbers slow people down.',
    icon: Workflow,
  },
  {
    step: '04',
    summaryLabel: 'Apply',
    title: 'Find banks and apply strategically',
    description: 'That could be your current business bank if you already have a relationship, or another lender that is a better fit for the deal.',
    pain: 'Not every bank wants every type of loan, so random outreach usually wastes time.',
    icon: Building2,
  },
  {
    step: '05',
    summaryLabel: 'Review',
    title: 'Work through underwriting',
    description: 'After you apply, lenders review the file and ask follow-up questions, updated documents, and explanations behind the numbers.',
    pain: 'Even good deals can stall here when replies are late, incomplete, or unorganized.',
    icon: ClipboardCheck,
  },
  {
    step: '06',
    summaryLabel: 'Fund',
    title: 'Close and get the funds',
    description: 'If approved, the last step is clearing final conditions, signing documents, and getting the money released.',
    pain: 'Approval is not the finish line. There is usually still paperwork before funds hit the account.',
    icon: BadgeDollarSign,
  },
];

function userPrefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function supportsInteractiveMotion() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(hover:hover) and (pointer:fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seenSectionsRef = useRef<Set<string>>(new Set());

  const trackHomeCta = (sectionId: string, ctaId: string, ctaLabel: string, destinationUrl: string) => {
    trackCtaClick({
      page_template: 'home',
      section_id: sectionId,
      cta_id: ctaId,
      cta_label: ctaLabel,
      destination_url: destinationUrl,
    });
  };

  useEffect(() => {
    const code = searchParams.get('code');
    if (code && typeof window !== 'undefined') {
      const redirectFlag = localStorage.getItem('redirectToComprehensive');
      if (redirectFlag === 'true') {
        localStorage.removeItem('redirectToComprehensive');
        supabase.auth
          .getSession()
          .then(({ data }: { data: { session: unknown } }) => {
            if (data.session) {
              router.replace('/comprehensive-cash-flow-analysis');
            }
          })
          .catch((error: unknown) => {
            console.error('Unable to read auth session during redirect check:', error);
          });
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (seenSectionsRef.current.has('hero')) return;
    seenSectionsRef.current.add('hero');
    trackSectionView({
      page_template: 'home',
      section_id: 'hero',
      section_label: 'Hero',
    });
  }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!elements.length) return;

    const revealElement = (root: HTMLElement) => {
      root.classList.add('home-reveal-visible');
      const sectionId = root.dataset.analyticsSection;
      const sectionLabel = root.dataset.analyticsLabel;
      if (sectionId && !seenSectionsRef.current.has(sectionId)) {
        seenSectionsRef.current.add(sectionId);
        trackSectionView({
          page_template: 'home',
          section_id: sectionId,
          section_label: sectionLabel,
        });
      }

      const revealNodes = Array.from(root.querySelectorAll<HTMLElement>('.home-reveal'));
      revealNodes.forEach((node, index) => {
        node.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
        node.classList.add('home-reveal-visible');
      });

      const staggerNodes = Array.from(root.querySelectorAll<HTMLElement>('.home-stagger'));
      staggerNodes.forEach((node, index) => {
        node.style.transitionDelay = `${Math.min(index * 75, 420)}ms`;
        node.classList.add('home-reveal-visible');
      });
    };

    if (userPrefersReducedMotion() || !('IntersectionObserver' in window)) {
      elements.forEach(revealElement);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealElement(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!supportsInteractiveMotion()) return;
    const magnets = Array.from(document.querySelectorAll<HTMLElement>('[data-magnetic]'));
    if (!magnets.length) return;

    const cleanups = magnets.map((element) => {
      const handleMove = (event: MouseEvent) => {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        const moveX = (x / rect.width) * 12;
        const moveY = (y / rect.height) * 10;
        element.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
      };

      const handleLeave = () => {
        element.style.transform = 'translate3d(0, 0, 0)';
      };

      element.addEventListener('mousemove', handleMove);
      element.addEventListener('mouseleave', handleLeave);

      return () => {
        element.removeEventListener('mousemove', handleMove);
        element.removeEventListener('mouseleave', handleLeave);
      };
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  useEffect(() => {
    if (!supportsInteractiveMotion()) return;
    const hero = document.querySelector<HTMLElement>('[data-hero]');
    if (!hero) return;

    const handleMove = (event: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 26;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 20;
      hero.style.setProperty('--hero-mx', `${x.toFixed(2)}px`);
      hero.style.setProperty('--hero-my', `${y.toFixed(2)}px`);
    };

    const handleLeave = () => {
      hero.style.setProperty('--hero-mx', '0px');
      hero.style.setProperty('--hero-my', '0px');
    };

    hero.addEventListener('mousemove', handleMove);
    hero.addEventListener('mouseleave', handleLeave);

    return () => {
      hero.removeEventListener('mousemove', handleMove);
      hero.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section
        data-hero
        className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#155e75_0%,#0b2640_32%,#07111d_72%,#020617_100%)] text-white"
      >
        <div className="home-hero-mesh pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.10)_1px,transparent_1px)] [background-size:66px_66px]" />
        <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl home-parallax-soft" />
        <div className="pointer-events-none absolute right-[-5rem] top-16 h-80 w-80 rounded-full bg-amber-300/[0.14] blur-3xl home-parallax-soft-reverse" />
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-sky-400/10 blur-3xl home-float" />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 sm:pb-12 sm:pt-12 md:pb-14 md:pt-14">
          <div className="mx-auto flex max-w-[52rem] flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.16] bg-white/[0.08] px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-100 backdrop-blur-sm sm:text-xs">
                <ShieldCheck className="h-4 w-4 text-cyan-200" />
                Business loan guidance for small-business owners
            </div>

            <h1
              className={`${headingFont.className} mt-5 max-w-[17ch] text-4xl font-extrabold leading-[1.02] text-white sm:max-w-[18ch] sm:text-[2.7rem] lg:max-w-[22ch] lg:text-[3rem]`}
            >
              Get your business approved for funding, without the guesswork.
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
              We help small business owners check repayment strength with a free DSCR calculator, organize their
              finances, build stronger loan packages, and move toward funding with clear, step-by-step guidance.
            </p>

            <div className="mt-8 flex w-full max-w-3xl flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
              <Link
                href="/loan-services"
                onClick={() => trackHomeCta('hero', 'home_hero_start_loan_process', 'Start Your Loan Process', '/loan-services')}
                className="home-magnetic group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 shadow-[0_20px_45px_-28px_rgba(255,255,255,0.85)] transition hover:-translate-y-0.5 hover:bg-slate-100 sm:w-auto sm:px-7 sm:text-base"
                id="home-hero-cta-loan-process"
                data-magnetic
              >
                Start Your Loan Process
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link
                href="#dscr-calculator"
                onClick={() => trackHomeCta('hero', 'home_hero_free_dscr', 'Check If You Qualify', '#dscr-calculator')}
                className="home-magnetic inline-flex w-full flex-col items-center justify-center rounded-2xl border border-white/[0.18] bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/[0.16] sm:w-auto sm:px-7"
                id="home-hero-cta-check-qualify"
                data-magnetic
              >
                <span className="text-sm font-semibold sm:text-base">Check If You Qualify</span>
                <span className="mt-0.5 text-[11px] font-medium text-cyan-200 sm:text-xs">Free • Takes 60 seconds</span>
              </Link>
            </div>

            <p className="mt-5 max-w-none text-sm leading-6 text-slate-300 sm:text-base md:whitespace-nowrap">
              Everything you need, from financial templates to a guided loan packaging dashboard, all in one place.
            </p>

            <div className="mt-4 flex max-w-4xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-200">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Guided loan packaging dashboard
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Built-in financial templates
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Optional expert help when you need it
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-3" data-reveal data-analytics-section="marquee" data-analytics-label="Marquee">
        <div className="home-marquee home-reveal">
          <div className="home-marquee-track">
            {[...marqueeItems, ...marqueeItems].map((item, index) => (
              <span key={`${item}-${index}`} className="home-marquee-item">
                <ShieldCheck className="h-4 w-4" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-10 sm:py-12" data-reveal data-analytics-section="what_we_offer" data-analytics-label="What We Offer">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 home-reveal">
          <div className="max-w-5xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">What We Offer</p>
            <h2 className="mt-2 max-w-none text-3xl font-black text-slate-900 sm:text-4xl lg:whitespace-nowrap">
              From quick loan-readiness checks to full funding support
            </h2>
            <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600 sm:text-lg">
              Start with a fast high-level check, move into deeper financial analysis, organize your documents in one
              place, and get hands-on help pursuing the right lenders when you&apos;re ready.
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {serviceCards.map((service) => {
              const Icon = service.icon;
              return (
                <article
                  key={service.title}
                  className="home-tilt home-stagger group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-lg sm:p-6"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                      {service.badge}
                    </span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-700">{service.stage}</p>
                  <h3 className="mt-4 max-w-md text-xl font-extrabold text-slate-900 sm:text-2xl">{service.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">{service.description}</p>

                  <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-700">
                    {service.bullets.map((point) => (
                      <li key={point} className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={service.ctaHref}
                    onClick={() => trackHomeCta('what_we_offer', `service_${service.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`, service.ctaLabel, service.ctaHref)}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-800 transition group-hover:text-cyan-600 sm:text-base"
                  >
                    {service.ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="dscr-calculator"
        className="scroll-mt-24 bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fafc_50%,#f8fafc_100%)] py-8 sm:py-10"
        data-reveal
        data-analytics-section="free_dscr_calculator"
        data-analytics-label="Free DSCR Calculator"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 home-reveal">
          <div className="relative overflow-hidden rounded-[2rem] border border-cyan-100 bg-white shadow-[0_32px_90px_-46px_rgba(14,116,144,0.35)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
            <div className="pointer-events-none absolute -left-12 top-8 h-40 w-40 rounded-full bg-cyan-200/45 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-amber-100/60 blur-3xl" />

            <div className="relative border-b border-cyan-100 bg-[linear-gradient(180deg,rgba(236,254,255,0.95)_0%,rgba(255,255,255,0.98)_100%)] px-5 py-5 sm:px-6 sm:py-6">
              <div className="mx-auto max-w-6xl text-center">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Free Tool</p>
                <div className="mt-2 flex justify-center gap-2">
                  <h2 className="max-w-4xl text-3xl font-black text-slate-900 sm:text-[2.2rem]">
                    Free High-Level DSCR Calculator
                  </h2>
                  <div className="group relative mt-1 shrink-0">
                    <button
                      type="button"
                      aria-label="What is DSCR?"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-cyan-200 bg-white/90 text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                    <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-100 opacity-0 shadow-2xl transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 translate-y-1">
                      DSCR compares your cash flow to your debt payments. It is one of the first ratios lenders use to decide whether a deal looks repayable.
                    </div>
                  </div>
                </div>
                <p className="mx-auto mt-2 max-w-5xl text-sm leading-6 text-slate-600 sm:text-base">
                  Start here to see the debt service coverage ratio lenders care about most. A weak DSCR can slow down or kill a business loan request early, while a strong one can tell you the deal is worth digging into further.
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <div className="rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-lg sm:text-sm">
                    100% Free • Instant Results • No Credit Impact
                  </div>
                  <div className="rounded-2xl border border-cyan-200 bg-white/80 px-4 py-2.5 text-xs font-semibold text-cyan-800 sm:text-sm">
                    Built for a fast first-pass qualification check
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Takes 30-60 seconds. No documents needed.
                  </div>
                </div>
              </div>
            </div>

            <div className="relative px-4 py-4 sm:px-6 sm:py-5">
              <DscrQuickCalculator embedded analyticsPageTemplate="home" analyticsPlacement="home_embedded_calculator" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-10 text-white sm:py-12" data-reveal data-analytics-section="loan_process" data-analytics-label="Loan Process">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 home-reveal">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Typical Loan Process</p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">What usually has to happen before a small business gets funded</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
              Most owners picture one application. In reality, there are several steps and a lot of follow-up.
            </p>
          </div>

          <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.04] px-2 py-4 shadow-[0_24px_50px_-34px_rgba(8,47,73,0.85)] backdrop-blur-sm sm:px-4">
            <div className="relative grid grid-cols-6 gap-1 sm:gap-2">
              <div className="pointer-events-none absolute left-[8.333%] right-[8.333%] top-9 h-px bg-gradient-to-r from-cyan-300/25 via-cyan-200/70 to-cyan-300/25 sm:top-10" />

              {processSteps.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={`summary-${item.step}`} className="relative flex min-w-0 flex-col items-center text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200 sm:text-[11px]">
                      {item.step}
                    </span>
                    <span
                      className={`relative mt-2 flex h-9 w-9 items-center justify-center rounded-2xl border sm:h-10 sm:w-10 ${
                        item.featured
                          ? 'border-cyan-200/30 bg-cyan-300/15 text-cyan-100 shadow-[0_0_0_6px_rgba(8,47,73,0.45)]'
                          : 'border-white/10 bg-slate-900 text-cyan-100 shadow-[0_0_0_6px_rgba(2,6,23,0.82)]'
                      }`}
                    >
                      <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                    </span>
                    <span className="mt-2 max-w-[5.25rem] text-[10px] font-semibold leading-tight text-slate-100 sm:max-w-none sm:text-xs">
                      {item.summaryLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {processSteps.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.step}
                  className={`home-stagger rounded-3xl border p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.8)] ${
                    item.featured
                      ? 'border-cyan-300/40 bg-[linear-gradient(180deg,rgba(34,211,238,0.14)_0%,rgba(255,255,255,0.06)_100%)]'
                      : 'border-white/[0.14] bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Step {item.step}</span>
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
                        item.featured
                          ? 'border-cyan-200/30 bg-cyan-300/15 text-cyan-100'
                          : 'border-white/10 bg-white/10 text-cyan-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{item.description}</p>

                  <div className="mt-3 rounded-2xl border border-amber-200/10 bg-amber-300/[0.07] px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-200">Tedious part</p>
                    <p className="mt-1.5 text-sm leading-6 text-slate-200">{item.pain}</p>
                  </div>

                  {item.ctaHref && item.ctaLabel ? (
                    <Link
                      href={item.ctaHref}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                    >
                      {item.ctaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : null}
                </article>
              );
            })}
          </div>

        </div>
      </section>

      <div data-reveal data-analytics-section="loan_packaging_explainer" data-analytics-label="Loan Packaging Explainer">
        <LoanPackagingExplainer />
      </div>

      <section data-reveal data-analytics-section="testimonials" data-analytics-label="Testimonials">
        <div className="home-reveal">
          <Testimonials />
        </div>
      </section>

      <section
        className="relative overflow-hidden bg-[radial-gradient(circle_at_top,#164e63_0%,#0f172a_45%,#020617_100%)] py-6 text-white sm:py-8"
        data-reveal
        data-analytics-section="bottom_cta"
        data-analytics-label="Bottom CTA"
      >
        <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="pointer-events-none absolute -left-12 top-6 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-8 h-44 w-44 rounded-full bg-sky-400/12 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="home-reveal relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-white/[0.06] p-4 shadow-[0_36px_90px_-50px_rgba(8,47,73,0.95)] backdrop-blur-sm sm:p-5 lg:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-[0.64rem] font-bold uppercase tracking-[0.22em] text-cyan-100">
                  <ShieldCheck className="h-4 w-4" />
                  Ready To Move Forward
                </div>

                <h2 className="mt-4 max-w-[16ch] text-[1.9rem] font-black leading-[1.03] text-white sm:text-3xl lg:text-[2.65rem]">
                  Turn a maybe into a lender-ready file.
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
                  Start with a fast DSCR check if you want a first signal, or move straight into the guided loan
                  process when you are ready to organize documents, tighten the story, and approach lenders more
                  strategically.
                </p>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">Start Here</p>
                    <p className="mt-1.5 text-sm font-semibold text-white">Get a quick qualification read</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">Build Better</p>
                    <p className="mt-1.5 text-sm font-semibold text-white">Package the deal the right way</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">Move Forward</p>
                    <p className="mt-1.5 text-sm font-semibold text-white">Apply with more confidence</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-white/12 bg-slate-950/70 p-4 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.95)] sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Your Next Best Step</p>
                    <h3 className="mt-1.5 text-xl font-black text-white sm:text-[1.4rem]">Choose the path that matches where you are today.</h3>
                  </div>
                  <div className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 sm:flex">
                    <Workflow className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">Option 1</p>
                    <p className="mt-1 text-sm font-semibold text-white">Use the free DSCR calculator for a fast first-pass answer.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">Option 2</p>
                    <p className="mt-1 text-sm font-semibold text-white">Start the loan process and build a cleaner, stronger package.</p>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-300">
                  No guesswork. No messy handoff. Just a clearer path from qualification to lender review.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="#dscr-calculator"
                    onClick={() => trackHomeCta('bottom_cta', 'home_bottom_free_dscr', 'Start Free DSCR Check', '#dscr-calculator')}
                    className="home-magnetic group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100 sm:text-base"
                    id="home-bottom-cta-free-dscr"
                    data-magnetic
                  >
                    Start Free DSCR Check
                    <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/loan-services"
                    onClick={() => trackHomeCta('bottom_cta', 'home_bottom_start_loan_process', 'Start Loan Process', '/loan-services')}
                    className="home-magnetic inline-flex items-center justify-center rounded-2xl border border-white/80 bg-white/[0.06] px-6 py-3.5 text-sm font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28),0_18px_40px_-28px_rgba(255,255,255,0.35)] transition hover:-translate-y-0.5 hover:bg-white/[0.12] sm:text-base"
                    id="home-bottom-cta-contact"
                    data-magnetic
                  >
                    Start Loan Process
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <HomeContent />
    </Suspense>
  );
}
