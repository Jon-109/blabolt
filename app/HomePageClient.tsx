"use client";

import React, { Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sora } from 'next/font/google';
import {
  ArrowRight,
  BarChart3,
  Calculator,
  CheckCircle2,
  Handshake,
  Info,
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
    description: 'A free 60-second check to see if your cash flow may support the loan payment.',
    bullets: [
      'See your estimated DSCR',
      'No credit pull',
      'No documents needed',
    ],
    ctaLabel: 'Start Free Check',
    ctaHref: '#dscr-calculator',
    icon: BarChart3,
  },
  {
    badge: 'FULL REVIEW',
    stage: 'Go deeper',
    title: 'Cash Flow Review',
    description: 'A deeper look at income, debt, and repayment strength before you move forward.',
    bullets: [
      'Review cash flow more closely',
      'Understand weak spots',
      'Get a clearer next step',
    ],
    ctaLabel: 'Explore Review',
    ctaHref: '/cash-flow-analysis',
    icon: TrendingUp,
  },
  {
    badge: 'PACKAGE',
    stage: 'Get organized',
    title: 'Loan Packaging',
    description: 'Organize your documents, complete templates, and build a cleaner lender-ready file.',
    bullets: [
      'Upload required documents',
      'Complete guided templates',
      'Generate a cover letter/package',
    ],
    ctaLabel: 'Explore Packaging',
    ctaHref: '/loan-services',
    icon: Workflow,
  },
  {
    badge: 'BROKERING',
    stage: 'Get lender help',
    title: 'Loan Brokering',
    description: 'Get help taking your package to lenders and moving the deal toward closing.',
    bullets: [
      'No upfront packaging fee',
      'Lender matching support',
      'Fee only if the loan closes',
    ],
    ctaLabel: 'Explore Brokering',
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
    summaryLabel: 'Check',
    title: 'See if the payment works',
    description: 'Start with a quick DSCR check so you know whether the requested loan payment looks realistic.',
    pain: 'This helps you avoid applying too early or chasing a loan the business cannot support yet.',
    icon: Calculator,
    featured: true,
  },
  {
    step: '02',
    summaryLabel: 'Package',
    title: 'Organize the lender file',
    description: 'Pull the documents, numbers, templates, and loan story into one cleaner package.',
    pain: 'This is where missing files, messy folders, and inconsistent numbers usually slow borrowers down.',
    icon: Workflow,
  },
  {
    step: '03',
    summaryLabel: 'Move',
    title: 'Approach lenders with confidence',
    description: 'Use the package to explain the request clearly and support lender follow-up more professionally.',
    pain: 'Random applications waste time when the file is not ready or the lender is not a fit.',
    icon: Handshake,
  },
];

const audienceFitItems = [
  'You want funding but are not sure what you may qualify for',
  'You have revenue but do not know how lenders will read the cash flow',
  'Your documents are scattered, missing, or not lender-ready yet',
  'You want guidance before spending time on applications or lender outreach',
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

        <div className="relative mx-auto max-w-7xl px-4 pb-4 pt-8 sm:px-6 sm:pb-12 sm:pt-12 md:pb-14 md:pt-14">
          <div className="mx-auto flex max-w-[52rem] flex-col items-center text-center lg:max-w-[76rem]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.16] bg-white/[0.08] px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-slate-100 backdrop-blur-sm sm:px-4 sm:py-2 sm:text-xs">
                <ShieldCheck className="h-4 w-4 text-cyan-200" />
                <span className="sm:hidden">Business loan guidance for owners</span>
                <span className="hidden sm:inline">Business loan guidance for small-business owners</span>
            </div>

            <h1
              className={`${headingFont.className} mt-4 max-w-[20ch] text-[1.7rem] font-extrabold leading-[1.02] text-white line-clamp-3 sm:mt-5 sm:max-w-[18ch] sm:text-[2.7rem] sm:line-clamp-none lg:max-w-[22ch] lg:text-[3rem]`}
            >
              Find out if your business is ready for funding.
            </h1>

            <p className="mt-3 max-w-none text-[13px] leading-5 text-slate-200 sm:mt-4 sm:max-w-5xl sm:text-lg sm:leading-8 lg:max-w-[64rem] xl:max-w-[70rem]">
              Use the free DSCR check to see if your cash flow can support a loan. If the numbers make sense, organize
              your documents and build a stronger lender-ready package.
            </p>

            <div className="mt-6 flex w-full max-w-3xl flex-col gap-2.5 sm:mt-8 sm:w-auto sm:flex-row sm:justify-center sm:gap-3">
              <Link
                href="#dscr-calculator"
                onClick={() => trackHomeCta('hero', 'home_hero_free_dscr', 'Check If You Qualify', '#dscr-calculator')}
                className="home-magnetic group inline-flex w-full flex-col items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_20px_45px_-28px_rgba(255,255,255,0.85)] transition hover:-translate-y-0.5 hover:bg-slate-100 sm:w-auto sm:px-7 sm:py-3.5"
                id="home-hero-cta-check-qualify"
                data-magnetic
              >
                <span className="flex items-center gap-2 text-sm font-bold sm:text-base">
                  Check If You Qualify
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
                <span className="mt-0.5 text-[11px] font-semibold text-cyan-700 sm:text-xs">Free • Takes 60 seconds</span>
              </Link>
            </div>

            <p className="mt-4 hidden max-w-none text-[13px] leading-5.5 text-slate-300 sm:mt-5 sm:block sm:text-base md:whitespace-nowrap">
              Everything you need, from financial templates to a guided loan packaging dashboard, all in one place.
            </p>

            <div className="mt-3 flex max-w-4xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[13px] text-slate-200 sm:mt-4 sm:gap-x-4 sm:gap-y-2 sm:text-sm">
              <span className="hidden items-center gap-1.5 sm:inline-flex">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Guided loan packaging dashboard
              </span>
              <span className="hidden items-center gap-1.5 sm:inline-flex">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Built-in financial templates
              </span>
              <span className="hidden items-center gap-1.5 sm:inline-flex">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Optional expert help when you need it
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-2.5 sm:py-3" data-reveal data-analytics-section="marquee" data-analytics-label="Marquee">
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

      <section
        className="bg-slate-50 py-4 sm:py-6 xl:py-5"
        data-reveal
        data-analytics-section="what_we_offer"
        data-analytics-label="What We Offer"
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-6 home-reveal">
          <div>
            <div className="max-w-6xl xl:mx-auto xl:text-center">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700 sm:text-base">What We Offer</p>
              <h2 className="mt-1.5 text-[1.95rem] font-black leading-[1.08] text-slate-900 sm:text-4xl xl:text-[2.55rem] xl:leading-none xl:whitespace-nowrap">
                Choose the path that fits where you are today
              </h2>
              <p className="mt-2 max-w-4xl text-sm leading-5.5 text-slate-600 sm:text-lg xl:mx-auto xl:max-w-5xl xl:text-[15px] xl:leading-5.5">
                Not sure where to start? Most owners should begin with the free DSCR check, then move deeper only if the
                numbers and timing make sense.
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3 xl:mt-3 xl:grid-cols-4 xl:gap-3">
            {serviceCards.map((service) => {
              const Icon = service.icon;
              return (
                <article
                  key={service.title}
                  className="home-tilt home-stagger group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-2.5 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-1.5 hover:border-cyan-300/70 hover:shadow-[0_28px_70px_-34px_rgba(8,145,178,0.32)] sm:rounded-3xl sm:p-5 xl:p-4"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="pointer-events-none absolute -right-10 top-3 h-24 w-24 rounded-full bg-cyan-100/0 blur-2xl transition duration-300 group-hover:bg-cyan-100/80" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-slate-900 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-white transition duration-300 group-hover:bg-cyan-900 sm:px-3 sm:text-[11px] sm:tracking-[0.18em]">
                      {service.badge}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 shadow-[inset_0_0_0_1px_rgba(8,145,178,0.08)] transition duration-300 group-hover:scale-110 group-hover:-rotate-3 group-hover:bg-cyan-100 group-hover:text-cyan-900 sm:h-11 sm:w-11 sm:rounded-2xl">
                      <Icon className="h-4 w-4 transition duration-300 group-hover:scale-105 sm:h-5 sm:w-5" />
                    </div>
                  </div>

                  <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-cyan-700 transition duration-300 group-hover:tracking-[0.18em] group-hover:text-cyan-800 sm:mt-3 sm:text-[11px] sm:tracking-[0.16em]">{service.stage}</p>
                  <h3 className="mt-2 max-w-md text-[13px] font-extrabold leading-4.5 text-slate-900 transition duration-300 group-hover:text-cyan-950 sm:mt-3 sm:text-xl xl:text-[1.02rem] xl:leading-5">{service.title}</h3>
                  <p className="mt-1.5 text-[12px] leading-4.5 text-slate-600 transition duration-300 group-hover:text-slate-700 sm:mt-2 sm:text-sm sm:leading-6 xl:text-[13px] xl:leading-5">{service.description}</p>

                  <ul className="mt-2 flex-1 space-y-1 text-[12px] leading-4.5 text-slate-700 sm:mt-3 sm:space-y-1.5 sm:text-sm sm:leading-6 xl:text-[13px] xl:leading-5">
                    {service.bullets.map((point) => (
                      <li key={point} className="flex items-start gap-1.5">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 transition duration-300 group-hover:translate-x-0.5 group-hover:text-cyan-700 sm:h-4 sm:w-4" />
                        <span className="transition duration-300 group-hover:text-slate-900">{point}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={service.ctaHref}
                    onClick={() => trackHomeCta('what_we_offer', `service_${service.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`, service.ctaLabel, service.ctaHref)}
                    className="group/cta mt-2.5 inline-flex w-full items-center justify-center self-stretch rounded-xl border border-cyan-200 bg-[linear-gradient(135deg,#ffffff_0%,#ecfeff_58%,#dbeafe_100%)] px-2.5 py-2 text-[11px] font-semibold text-cyan-900 shadow-[0_14px_35px_-24px_rgba(8,145,178,0.55)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-[linear-gradient(135deg,#ffffff_0%,#cffafe_55%,#bfdbfe_100%)] hover:shadow-[0_22px_50px_-24px_rgba(8,145,178,0.5)] active:translate-y-0 active:scale-[0.985] sm:mt-4 sm:min-w-[12rem] sm:w-auto sm:self-center sm:rounded-2xl sm:px-5 sm:py-3 sm:text-sm xl:mt-3"
                  >
                    <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/80 opacity-80" />
                    <span className="flex items-center gap-2">
                      {service.ctaLabel}
                      <ArrowRight className="h-4 w-4 transition duration-300 group-hover/cta:translate-x-1" />
                    </span>
                  </Link>
                </article>
              );
            })}
            </div>
          </div>
        </div>
      </section>

      <section
        id="dscr-calculator"
        className="scroll-mt-24 bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fafc_50%,#f8fafc_100%)] py-5 sm:py-8"
        data-reveal
        data-analytics-section="free_dscr_calculator"
        data-analytics-label="Free DSCR Calculator"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 home-reveal">
          <div className="relative overflow-hidden rounded-[2rem] border border-cyan-100 bg-white shadow-[0_32px_90px_-46px_rgba(14,116,144,0.35)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
            <div className="pointer-events-none absolute -left-12 top-8 h-40 w-40 rounded-full bg-cyan-200/45 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-amber-100/60 blur-3xl" />

            <div className="relative border-b border-cyan-100 bg-[linear-gradient(180deg,rgba(236,254,255,0.95)_0%,rgba(255,255,255,0.98)_100%)] px-2 py-2 sm:px-6 sm:py-5">
              <div className="mx-auto max-w-6xl text-center">
                <p className="hidden text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 sm:block">Free Tool</p>
                <div className="mt-1.5 flex justify-center gap-0 sm:gap-2">
                  <h2 className="max-w-full whitespace-nowrap text-[1.4rem] font-black leading-tight tracking-[-0.04em] text-slate-900 sm:max-w-4xl sm:text-[2rem] lg:text-[2.2rem]">
                    Free High-Level DSCR Calculator
                  </h2>
                  <div className="group relative mt-1 hidden shrink-0 sm:block">
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
                <p className="mx-auto mt-1 hidden max-w-5xl text-base leading-6 text-slate-600 sm:mt-2 sm:block">
                  Start here to see whether your cash flow may support the loan payment. You’ll get a quick first-pass view of how the request may look to a lender.
                </p>
                <p className="mx-auto mt-1 text-xs leading-4 text-slate-500 sm:hidden">
                  See what loan you may qualify for in 30 seconds.
                </p>
                <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:mt-3 sm:gap-2">
                  <div className="rounded-xl bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm">
                    100% Free • No Credit Impact • No Docs Needed
                  </div>
                  <div className="rounded-xl border border-cyan-200 bg-white/80 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm">
                    Quick estimate • Not a loan approval
                  </div>
                </div>
              </div>
            </div>

            <div className="relative px-1.5 py-1.5 sm:px-5 sm:py-4">
              <DscrQuickCalculator embedded compactMobileLayout analyticsPageTemplate="home" analyticsPlacement="home_embedded_calculator" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-8 sm:py-12" data-reveal data-analytics-section="audience_fit" data-analytics-label="Audience Fit">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 home-reveal">
          <div className="grid gap-5 rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f0fdfa_45%,#eff6ff_100%)] p-4 shadow-[0_26px_70px_-48px_rgba(15,23,42,0.36)] sm:p-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Who This Helps</p>
              <h2 className="mt-2 text-[1.8rem] font-black leading-[1.08] text-slate-900 sm:text-4xl">Built for owners who need a clearer answer before they apply.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                If business funding feels confusing, this gives you a practical starting point: check the numbers, organize the file, and move forward only when the request makes sense.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              {audienceFitItems.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm sm:p-4">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-sm font-semibold leading-5 text-slate-800 sm:text-[15px] sm:leading-6">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-8 text-white sm:py-12" data-reveal data-analytics-section="loan_process" data-analytics-label="Loan Process">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 home-reveal">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Simple Loan Path</p>
            <h2 className="mt-2 text-[1.95rem] font-black leading-[1.08] sm:text-4xl">From “Can I qualify?” to “Ready for lenders.”</h2>
            <p className="mt-2.5 text-sm leading-6 text-slate-300 sm:mt-3 sm:text-base sm:leading-6">
              Most owners do not need more confusion. They need a clear next step.
            </p>
          </div>

          <div className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] px-1.5 py-3 shadow-[0_24px_50px_-34px_rgba(8,47,73,0.85)] backdrop-blur-sm sm:px-4 sm:py-4">
            <div className="relative grid grid-cols-3 gap-1 sm:gap-2">
              <div className="pointer-events-none absolute left-[16.666%] right-[16.666%] top-8 h-px bg-gradient-to-r from-cyan-300/25 via-cyan-200/70 to-cyan-300/25 sm:top-10" />

              {processSteps.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={`summary-${item.step}`} className="relative flex min-w-0 flex-col items-center text-center">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-200 sm:text-[11px]">
                      {item.step}
                    </span>
                    <span
                      className={`relative mt-1.5 flex h-8 w-8 items-center justify-center rounded-2xl border sm:mt-2 sm:h-10 sm:w-10 ${
                        item.featured
                          ? 'border-cyan-200/30 bg-cyan-300/15 text-cyan-100 shadow-[0_0_0_6px_rgba(8,47,73,0.45)]'
                          : 'border-white/10 bg-slate-900 text-cyan-100 shadow-[0_0_0_6px_rgba(2,6,23,0.82)]'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 sm:h-[18px] sm:w-[18px]" />
                    </span>
                    <span className="mt-1.5 max-w-[4.75rem] text-[9px] font-semibold leading-tight text-slate-100 sm:mt-2 sm:max-w-none sm:text-xs">
                      {item.summaryLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-3 md:gap-2.5">
            {processSteps.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.step}
                  className={`home-stagger rounded-[1.4rem] border p-2.5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.8)] sm:rounded-3xl sm:p-4 ${
                    item.featured
                      ? 'border-cyan-300/40 bg-[linear-gradient(180deg,rgba(34,211,238,0.14)_0%,rgba(255,255,255,0.06)_100%)]'
                      : 'border-white/[0.14] bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-cyan-200 sm:text-xs sm:tracking-[0.16em]">Step {item.step}</span>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-xl border sm:h-11 sm:w-11 sm:rounded-2xl ${
                        item.featured
                          ? 'border-cyan-200/30 bg-cyan-300/15 text-cyan-100'
                          : 'border-white/10 bg-white/10 text-cyan-100'
                      }`}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </span>
                  </div>

                  <h3 className="mt-2.5 text-[13px] font-bold leading-4.5 text-white sm:mt-4 sm:text-lg sm:leading-5">{item.title}</h3>
                  <p className="mt-1.5 text-[12px] leading-5 text-slate-200 sm:mt-2 sm:text-sm sm:leading-6">{item.description}</p>

                  <div className="mt-2.5 rounded-xl border border-amber-200/10 bg-amber-300/[0.07] px-2.5 py-2 sm:mt-3 sm:rounded-2xl sm:px-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-200">Why it matters</p>
                    <p className="mt-1 text-[12px] leading-5 text-slate-200 sm:mt-1.5 sm:text-sm sm:leading-6">{item.pain}</p>
                  </div>

                  {item.ctaHref && item.ctaLabel ? (
                    <Link
                      href={item.ctaHref}
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[11px] font-semibold text-slate-950 transition hover:bg-slate-100 sm:mt-4 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
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
        className="relative overflow-hidden bg-[radial-gradient(circle_at_top,#164e63_0%,#0f172a_45%,#020617_100%)] py-5 text-white sm:py-8"
        data-reveal
        data-analytics-section="bottom_cta"
        data-analytics-label="Bottom CTA"
      >
        <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="pointer-events-none absolute -left-12 top-6 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-8 h-44 w-44 rounded-full bg-sky-400/12 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="home-reveal relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-white/[0.06] p-3.5 shadow-[0_36px_90px_-50px_rgba(8,47,73,0.95)] backdrop-blur-sm sm:p-5 lg:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-cyan-100 sm:text-[0.64rem] sm:tracking-[0.22em]">
                  <ShieldCheck className="h-4 w-4" />
                  Ready To Move Forward
                </div>

                <h2 className="mt-3 max-w-[16ch] text-[1.8rem] font-black leading-[1.03] text-white sm:mt-4 sm:text-3xl lg:text-[2.65rem]">
                  Turn a maybe into a lender-ready file.
                </h2>

                <p className="mt-2.5 max-w-2xl text-[13px] leading-5.5 text-slate-200 sm:mt-3 sm:text-base sm:leading-7">
                  Not sure if the loan makes sense yet? Start with the free DSCR check. Ready to move forward? Build the
                  package lenders need and approach the next step with more confidence.
                </p>

                <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-2.5">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-2.5 py-2.5 sm:px-3.5 sm:py-3">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-200 sm:text-[11px] sm:tracking-[0.16em]">Start Here</p>
                    <p className="mt-1 text-[11px] font-semibold leading-4 text-white sm:mt-1.5 sm:text-sm">Get a quick qualification read</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-2.5 py-2.5 sm:px-3.5 sm:py-3">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-200 sm:text-[11px] sm:tracking-[0.16em]">Build Better</p>
                    <p className="mt-1 text-[11px] font-semibold leading-4 text-white sm:mt-1.5 sm:text-sm">Package the deal the right way</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-2.5 py-2.5 sm:px-3.5 sm:py-3">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-200 sm:text-[11px] sm:tracking-[0.16em]">Move Forward</p>
                    <p className="mt-1 text-[11px] font-semibold leading-4 text-white sm:mt-1.5 sm:text-sm">Apply with more confidence</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-white/12 bg-slate-950/70 p-3.5 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.95)] sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Your Next Best Step</p>
                    <h3 className="mt-1 text-lg font-black leading-tight text-white sm:mt-1.5 sm:text-[1.4rem]">Choose the path that matches where you are today.</h3>
                  </div>
                  <div className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 sm:flex">
                    <Workflow className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:mt-4 sm:gap-2.5">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 sm:px-3.5 sm:py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">Option 1</p>
                    <p className="mt-1 text-[13px] font-semibold leading-5 text-white sm:text-sm">Use the free DSCR calculator for a fast first-pass answer.</p>
                    <Link
                      href="#dscr-calculator"
                      onClick={() => trackHomeCta('bottom_cta', 'home_bottom_free_dscr', 'Start Free DSCR Check', '#dscr-calculator')}
                      className="home-magnetic group mt-2 inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100 sm:text-sm"
                      id="home-bottom-cta-free-dscr"
                      data-magnetic
                    >
                      Start Free DSCR Check
                      <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-1" />
                    </Link>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 sm:px-3.5 sm:py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">Option 2</p>
                    <p className="mt-1 text-[13px] font-semibold leading-5 text-white sm:text-sm">Start the loan process and build a cleaner, stronger package.</p>
                    <Link
                      href="/loan-services"
                      onClick={() => trackHomeCta('bottom_cta', 'home_bottom_start_loan_process', 'Start Loan Process', '/loan-services')}
                      className="home-magnetic group mt-2 inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/80 bg-white/[0.06] px-3 py-2.5 text-xs font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28),0_18px_40px_-28px_rgba(255,255,255,0.35)] transition hover:-translate-y-0.5 hover:bg-white/[0.12] sm:text-sm"
                      id="home-bottom-cta-contact"
                      data-magnetic
                    >
                      Start Loan Process
                      <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>

              </div>
            </div>

            <p className="mx-auto mt-4 max-w-full whitespace-nowrap text-center text-[13px] font-semibold leading-6 text-slate-100 sm:mt-5 sm:text-base sm:leading-7 lg:text-lg">
              No guesswork. No messy handoff. Just a clearer path from qualification to lender review.
            </p>
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
