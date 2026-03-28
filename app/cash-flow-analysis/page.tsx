"use client";

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sora } from 'next/font/google';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileSearch,
  FileText,
  HandCoins,
  HelpCircle,
  Layers3,
  LineChart,
  Rocket,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import DscrQuickCalculator from '@/app/(components)/cash-flow/DscrQuickCalculator';
import ContactFormModal from '@/app/(components)/shared/ContactFormModal';
import Testimonials from '@/app/(components)/shared/Testimonials';
import { supabase } from '@/supabase/helpers/client';

const headingFont = Sora({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
});

type IconCard = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type ComparisonRow = {
  feature: string;
  quick: string;
  comprehensive: string;
};

const marqueeItems = [
  'Free DSCR Check',
  'Bank-Level Cash Flow Review',
  'EBITDA Adjustments',
  'Debt Summary PDF',
  'Lender-Facing Guidance',
  'No Credit Impact',
  'Fast Qualification Read',
  'Clear Next-Step Direction',
];

const whyItMatters: IconCard[] = [
  {
    title: 'See the ratio lenders look at first',
    description:
      'Debt Service Coverage Ratio is often one of the first numbers a lender uses to decide whether a payment looks supportable.',
    icon: BarChart3,
  },
  {
    title: 'Avoid wasting time on the wrong structure',
    description:
      'A fast read helps you spot when the request size, payment, or timing probably needs work before you start applying.',
    icon: ShieldCheck,
  },
  {
    title: 'Move forward with sharper lender-facing support',
    description:
      'When the deal looks promising, the deeper review gives you cleaner numbers, better context, and a stronger story.',
    icon: FileSearch,
  },
];

const fullAnalysisDetails: IconCard[] = [
  {
    title: 'Adjusted EBITDA review',
    description:
      'We look beyond a simple quick estimate and review the income picture the way lenders usually discuss repayment strength.',
    icon: TrendingUp,
  },
  {
    title: 'Detailed debt breakdown',
    description:
      'Current obligations are organized into a clearer business debt summary so the repayment picture is easier to explain.',
    icon: Layers3,
  },
  {
    title: 'Lender-ready PDF output',
    description:
      'You leave with a polished report that is easier to share, reference, and build around if you keep moving toward financing.',
    icon: FileText,
  },
  {
    title: 'Better next-step clarity',
    description:
      'You can decide whether to move forward, lower the request, change structure, or package the deal more carefully.',
    icon: HandCoins,
  },
];

const comparisonRows: ComparisonRow[] = [
  {
    feature: 'Cost',
    quick: 'Free',
    comprehensive: '$49.99 one-time',
  },
  {
    feature: 'Time to complete',
    quick: 'About 1 minute',
    comprehensive: 'About 30 minutes',
  },
  {
    feature: 'Depth of review',
    quick: 'Fast first-pass estimate',
    comprehensive: 'Much deeper bank-style review',
  },
  {
    feature: 'Periods reviewed',
    quick: 'Current monthly snapshot',
    comprehensive: 'Historical + year-to-date context',
  },
  {
    feature: 'Report output',
    quick: 'On-screen result only',
    comprehensive: 'Downloadable PDF report',
  },
  {
    feature: 'Debt summary',
    quick: 'Not included',
    comprehensive: 'Included as a clean PDF summary',
  },
  {
    feature: 'Best for',
    quick: 'Checking whether the request feels close',
    comprehensive: 'Pressure-testing a real funding plan',
  },
];

const faqItems = [
  {
    question: 'Will this affect my credit?',
    answer: 'No. The quick DSCR check is only a financial estimate and does not trigger a credit pull.',
  },
  {
    question: 'When should I use the full analysis?',
    answer:
      'Use it when the request looks close, when you want a more lender-like read, or when you need a stronger report before packaging or applying.',
  },
  {
    question: 'What happens after the analysis?',
    answer:
      'If the numbers support it, the next smart move is usually organizing the file, tightening the story, and preparing the package lenders expect.',
  },
];

const closingSteps = [
  {
    label: '01',
    title: 'Run the quick DSCR check',
    description: 'Start with the fast estimate to see whether the request looks weak, borderline, or strong.',
  },
  {
    label: '02',
    title: 'Upgrade to the deeper review if needed',
    description: 'Use the full analysis when you need more accuracy, more context, and a better lender-facing read.',
  },
  {
    label: '03',
    title: 'Move into packaging with more confidence',
    description: 'Once the deal looks supportable, you can package it more cleanly and approach financing strategically.',
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

function ComparisonTable() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_70px_-44px_rgba(15,23,42,0.28)]">
      <div className="grid gap-3 border-b border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,1)_0%,rgba(255,255,255,1)_100%)] px-5 py-5 sm:grid-cols-2 sm:px-6">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Quick Check</p>
          <h3 className="mt-2 text-xl font-black tracking-[-0.03em] text-slate-950">Fast and free first pass</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Best when you want to know whether a deal feels obviously weak, close, or worth investigating further.
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/70 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Full Analysis</p>
          <h3 className="mt-2 text-xl font-black tracking-[-0.03em] text-slate-950">More depth, cleaner lender context</h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Best when you need a more complete repayment read, better structure guidance, and a report you can actually use.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-950 text-left text-white">
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] sm:px-6">Feature</th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] sm:px-6">Quick</th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] sm:px-6">Comprehensive</th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, index) => (
              <tr
                key={row.feature}
                className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/65'}
              >
                <td className="border-b border-slate-200 px-5 py-4 text-sm font-semibold text-slate-950 sm:px-6">
                  {row.feature}
                </td>
                <td className="border-b border-slate-200 px-5 py-4 text-sm leading-6 text-slate-600 sm:px-6">
                  {row.quick}
                </td>
                <td className="border-b border-slate-200 px-5 py-4 text-sm leading-6 text-slate-700 sm:px-6">
                  <span className="font-semibold text-slate-950">{row.comprehensive}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CashFlowAnalysisInner() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const calculatorRef = useRef<HTMLElement | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const comprehensiveCheckoutPath = '/checkout/cash_flow_analysis';

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-cashflow-reveal]'));
    if (!sections.length) return;

    const reveal = (root: HTMLElement) => {
      root.classList.add('home-reveal-visible');

      const revealNodes = Array.from(root.querySelectorAll<HTMLElement>('.home-reveal'));
      revealNodes.forEach((node, index) => {
        node.style.transitionDelay = `${Math.min(index * 65, 320)}ms`;
        node.classList.add('home-reveal-visible');
      });

      const staggerNodes = Array.from(root.querySelectorAll<HTMLElement>('.home-stagger'));
      staggerNodes.forEach((node, index) => {
        node.style.transitionDelay = `${Math.min(index * 80, 420)}ms`;
        node.classList.add('home-reveal-visible');
      });
    };

    if (userPrefersReducedMotion() || !('IntersectionObserver' in window)) {
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
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!supportsInteractiveMotion()) return;
    const magnets = Array.from(document.querySelectorAll<HTMLElement>('[data-cashflow-magnetic]'));
    if (!magnets.length) return;

    const cleanups = magnets.map((element) => {
      const handleMove = (event: MouseEvent) => {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        const moveX = (x / rect.width) * 12;
        const moveY = (y / rect.height) * 9;
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
    const hero = document.querySelector<HTMLElement>('[data-cashflow-hero]');
    if (!hero) return;

    const handleMove = (event: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 28;
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

  useEffect(() => {
    const shouldScrollToCalculator = searchParams.get('showCalculator') === 'true';
    if (shouldScrollToCalculator) {
      window.setTimeout(() => {
        calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 140);
    }

    const shouldStartComprehensive = searchParams.get('comprehensive') === 'true';
    if (shouldStartComprehensive) {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete('comprehensive');
      window.history.replaceState({}, '', nextUrl.toString());
      router.push(comprehensiveCheckoutPath);
    }
  }, [comprehensiveCheckoutPath, searchParams, router]);

  const handleScrollToCalculator = () => {
    calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleStartComprehensiveAnalysis = () => {
    router.push(comprehensiveCheckoutPath);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section
        data-cashflow-hero
        className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#155e75_0%,#0b2640_32%,#07111d_74%,#020617_100%)] text-white"
      >
        <div className="home-hero-mesh pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.10)_1px,transparent_1px)] [background-size:68px_68px]" />
        <div className="home-parallax-soft pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-cyan-400/18 blur-3xl" />
        <div className="home-parallax-soft-reverse pointer-events-none absolute right-[-6rem] top-10 h-80 w-80 rounded-full bg-amber-300/[0.14] blur-3xl" />
        <div className="home-float pointer-events-none absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-sky-400/12 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:pb-16 lg:pt-16">
          <div className="home-reveal home-reveal-visible mx-auto max-w-6xl text-center">
            <div className="mx-auto max-w-5xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.16] bg-white/[0.08] px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-100 backdrop-blur-sm sm:px-4 sm:py-2 sm:text-xs">
                <ShieldCheck className="h-4 w-4 text-cyan-200" />
                Funding-readiness cash flow review
              </div>

              <h1
                className={`${headingFont.className} mx-auto mt-4 max-w-[18ch] text-[2.2rem] font-extrabold leading-[1.02] text-white sm:max-w-[19ch] sm:text-[2.75rem] lg:max-w-[19ch] lg:text-[3.35rem]`}
              >
                Know your DSCR before a lender does.
              </h1>

              <p className="mx-auto mt-3 max-w-4xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
                DSCR stands for Debt Service Coverage Ratio. It shows whether your business cash flow can comfortably
                cover its debt payments, and it is one of the first things lenders look at when deciding if a request
                feels financeable.
              </p>

              <p className="mx-auto mt-3 max-w-4xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                Start with a free check to find your number fast. If the deal looks close, you can go deeper with a
                more complete lender-style cash flow review.
              </p>

              <div className="mx-auto mt-5 flex w-full max-w-4xl flex-col gap-2.5 sm:w-auto sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={handleScrollToCalculator}
                  className="home-magnetic group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_20px_45px_-28px_rgba(255,255,255,0.85)] transition hover:-translate-y-0.5 hover:bg-slate-100 sm:w-auto sm:px-6 sm:py-3.5 sm:text-base"
                  id="cashflow-page-hero-cta-dscr"
                  data-cashflow-magnetic
                >
                  Start Free DSCR Check
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </button>
                <button
                  type="button"
                  onClick={handleStartComprehensiveAnalysis}
                  className="home-magnetic inline-flex w-full flex-col items-center justify-center rounded-2xl border border-white/[0.18] bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/[0.16] sm:w-auto sm:px-6"
                  id="cashflow-page-hero-cta-comprehensive"
                  data-cashflow-magnetic
                >
                  <span className="text-sm font-semibold sm:text-base">Start Comprehensive Analysis</span>
                  <span className="mt-0.5 text-[11px] font-medium text-cyan-200 sm:text-xs">
                    One-time $49.99 • PDF report included
                  </span>
                </button>
              </div>

              <div className="mx-auto mt-4 flex max-w-4xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[13px] text-slate-200 sm:text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Free first-pass read
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  No credit pull
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Lender-focused ratio
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-3" data-cashflow-reveal>
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

      <section className="bg-slate-50 py-8 sm:py-12" data-cashflow-reveal>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="home-reveal max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Why It Matters</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-4xl">
              Cash flow analysis is not just about revenue. It is about repayment comfort.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              Lenders care about whether your business can actually carry the requested payment while still leaving room
              for normal operating pressure. That is why DSCR matters so much up front.
            </p>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {whyItMatters.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="home-tilt home-stagger group flex h-full flex-col rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-lg sm:p-5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 transition group-hover:bg-cyan-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-lg font-extrabold tracking-[-0.03em] text-slate-950 sm:text-xl">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-950 py-8 text-white sm:py-12" data-cashflow-reveal>
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_16%_18%,rgba(6,182,212,0.18),transparent_24%),radial-gradient(circle_at_82%_14%,rgba(14,165,233,0.16),transparent_22%),radial-gradient(circle_at_76%_82%,rgba(251,191,36,0.12),transparent_26%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="home-reveal max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Two Paths</p>
            <h2 className="mt-2 text-2xl font-black sm:text-4xl">Start with the fast read, then go deeper when the deal deserves it.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
              The page should make the ladder obvious: quick first-pass qualification on one side, deeper lender-facing
              review on the other.
            </p>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <article className="home-stagger group flex h-full flex-col rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.8)] backdrop-blur sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
                  Free Start
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Clock3 className="h-5 w-5" />
                </div>
              </div>
              <h3 className="mt-3 text-xl font-black tracking-[-0.04em] text-white sm:text-2xl">Quick DSCR Check</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Best for getting a clean answer fast on whether the request looks weak, tight, or reasonably supportable.
              </p>
              <div className="mt-3 grid gap-2.5">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-sm font-semibold text-white">What it does</p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-300">
                    Estimates DSCR using your monthly income, current debt payments, and the loan request you want to test.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-sm font-semibold text-white">Best when</p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-300">
                    You want to know whether it is worth spending more time on this deal before doing deeper work.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-sm font-semibold text-white">What you need</p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-300">Just your monthly net income, debt payments, and loan request. No documents.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleScrollToCalculator}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100 sm:text-base"
                id="cashflow-page-quick-path-cta"
              >
                Run The Free Check
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
            </article>

            <article className="home-stagger relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-emerald-300/25 bg-[linear-gradient(135deg,rgba(16,185,129,0.18)_0%,rgba(255,255,255,0.06)_42%,rgba(14,165,233,0.08)_100%)] p-4 shadow-[0_30px_80px_-44px_rgba(16,185,129,0.4)] backdrop-blur sm:p-5">
              <div className="absolute right-4 top-4 rounded-full bg-emerald-300 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-950">
                $49.99 One-Time
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                  Full Review
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <LineChart className="h-5 w-5" />
                </div>
              </div>
              <h3 className="mt-3 text-xl font-black tracking-[-0.04em] text-white sm:text-2xl">Comprehensive Cash Flow Analysis</h3>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Best for borrowers who want a stronger lender-style read, more context around repayment strength, and a report they can actually build around.
              </p>

              <div className="mt-3 rounded-[1.5rem] border border-emerald-300/20 bg-black/15 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">Current price</p>
                    <p className="mt-1 text-3xl font-black tracking-[-0.05em] text-white">$49.99</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-200">One-time purchase</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-100">Includes debt summary PDF</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-2.5">
                {fullAnalysisDetails.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-emerald-200">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="mt-1.5 text-sm leading-6 text-slate-200">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleStartComprehensiveAnalysis}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100 sm:text-base"
                id="cashflow-page-full-path-cta"
              >
                Start Comprehensive Analysis
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </article>
          </div>
        </div>
      </section>

      <section
        id="dscr-calculator"
        ref={calculatorRef}
        className="scroll-mt-24 bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fafc_50%,#f8fafc_100%)] py-8 sm:py-12"
        data-cashflow-reveal
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="home-reveal relative overflow-hidden rounded-[2rem] border border-cyan-100 bg-white shadow-[0_32px_90px_-46px_rgba(14,116,144,0.35)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
            <div className="pointer-events-none absolute -left-12 top-8 h-40 w-40 rounded-full bg-cyan-200/45 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-amber-100/60 blur-3xl" />

            <div className="relative border-b border-cyan-100 bg-[linear-gradient(180deg,rgba(236,254,255,0.95)_0%,rgba(255,255,255,0.98)_100%)] px-4 py-4 sm:px-6 sm:py-6">
              <div className="mx-auto max-w-6xl text-center">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Free Tool</p>
                <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-[2.2rem]">Free High-Level DSCR Calculator</h2>
                <p className="mx-auto mt-2.5 max-w-4xl text-sm leading-6 text-slate-600 sm:text-base">
                  This is the clean first move. Test the request quickly, see the ratio lenders care about most, and get
                  an immediate sense of whether the deal looks weak, tight, or comfortably supportable.
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <div className="rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-lg sm:text-sm">
                    100% Free • Instant Results • No Credit Impact
                  </div>
                  <div className="rounded-2xl border border-cyan-200 bg-white/80 px-4 py-2.5 text-xs font-semibold text-cyan-800 sm:text-sm">
                    Designed for a fast first-pass qualification check
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700">
                    <Clock3 className="h-4 w-4 text-cyan-700" />
                    Usually takes under a minute
                  </div>
                </div>
              </div>
            </div>

            <div className="relative px-3 py-3 sm:px-6 sm:py-5">
              <DscrQuickCalculator embedded />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-8 sm:py-12" data-cashflow-reveal>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="home-reveal grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">What Changes In The Full Review</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-4xl">
                The deeper analysis gives you more than a score.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                If the deal is close or worth pursuing, the comprehensive version helps you understand the repayment story
                more like a lender would and gives you something more usable than a single on-screen number.
              </p>
              <div className="mt-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Best Use Cases</p>
                <div className="mt-3 space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-sm leading-6 text-slate-700">Your quick result is close enough that structure and detail may change the read.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-sm leading-6 text-slate-700">You want clearer guidance before spending time packaging or approaching lenders.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-sm leading-6 text-slate-700">You need a more polished output that is easier to reference and share internally.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {fullAnalysisDetails.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="home-tilt home-stagger group rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-sm transition hover:border-slate-300 hover:shadow-lg sm:p-5"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 transition group-hover:bg-cyan-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 text-base font-extrabold tracking-[-0.03em] text-slate-950 sm:text-lg">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-8 sm:py-12" data-cashflow-reveal>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="home-reveal max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Compare The Paths</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-4xl">Quick estimate versus full lender-facing review.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              Both matter, but they solve different problems. One tells you whether the deal feels close. The other helps
              you decide what to actually do next.
            </p>
          </div>

          <div className="mt-5 home-stagger">
            <ComparisonTable />
          </div>
        </div>
      </section>

      <div data-cashflow-reveal className="home-reveal">
        <Testimonials />
      </div>

      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] py-8 sm:py-12" data-cashflow-reveal>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="home-reveal flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-800 shadow-sm backdrop-blur">
                <HelpCircle className="h-4 w-4" />
                Common Questions
              </p>
              <h2 className="mt-3 text-2xl font-black text-slate-900 sm:text-4xl">A few fast answers before you move forward.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                This page should answer the practical questions quickly, then give you a clear path into the full FAQ if
                you want more detail.
              </p>
            </div>

            <Link
              href="/faq"
              className="home-magnetic inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:w-fit sm:text-base"
              data-cashflow-magnetic
            >
              Visit Full FAQ
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {faqItems.map((item) => (
              <article
                key={item.question}
                className="home-tilt home-stagger rounded-[1.75rem] border border-slate-200 bg-white/92 p-4 shadow-sm backdrop-blur transition hover:border-slate-300 hover:shadow-lg sm:p-5"
              >
                <h3 className="text-base font-extrabold tracking-[-0.03em] text-slate-950 sm:text-lg">{item.question}</h3>
                <p className="mt-2.5 text-sm leading-6 text-slate-600">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-950 py-8 text-white sm:py-12" data-cashflow-reveal>
        <div className="pointer-events-none absolute inset-0 opacity-55 [background-image:radial-gradient(circle_at_16%_20%,rgba(6,182,212,0.18),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(251,191,36,0.14),transparent_22%),radial-gradient(circle_at_72%_84%,rgba(16,185,129,0.14),transparent_28%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr] xl:items-start">
            <div className="home-reveal">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Next Move</p>
              <h2 className="mt-2 text-2xl font-black sm:text-4xl">Turn the analysis into momentum.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                The goal is not just to calculate a number. It is to understand the request, decide whether it works, and
                take the smartest next step toward financing.
              </p>

              <div className="mt-5 grid gap-2.5">
                {closingSteps.map((step) => (
                  <div
                    key={step.label}
                    className="home-stagger rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-3.5 backdrop-blur-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold text-cyan-200">
                        {step.label}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{step.title}</h3>
                        <p className="mt-1.5 text-sm leading-6 text-slate-300">{step.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="home-reveal rounded-[2rem] border border-white/10 bg-white/[0.05] p-4 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.82)] backdrop-blur-md sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">Ready To Move?</p>
                  <h3 className="mt-2 text-xl font-black tracking-[-0.04em] text-white sm:text-2xl">Pick the next step that matches your situation.</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Rocket className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Fastest move</p>
                  <p className="mt-2 text-sm font-semibold text-white">Run the free calculator now</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Best upgrade</p>
                  <p className="mt-2 text-sm font-semibold text-white">Use the full analysis for deeper clarity</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Human help</p>
                  <p className="mt-2 text-sm font-semibold text-white">Talk with us if you want support navigating it</p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={handleScrollToCalculator}
                  className="home-magnetic inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-slate-100 sm:text-base"
                  id="cashflow-page-bottom-cta-calculator"
                  data-cashflow-magnetic
                >
                  Start Quick Analysis
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleStartComprehensiveAnalysis}
                  className="home-magnetic inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-[0_18px_50px_-30px_rgba(52,211,153,0.9)] transition hover:bg-emerald-300 sm:text-base"
                  id="cashflow-page-bottom-cta-full-analysis"
                  data-cashflow-magnetic
                >
                  Start Comprehensive Analysis
                  <BadgeDollarSign className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row">
                <Link
                  href="/loan-services"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:text-base"
                >
                  Explore Loan Packaging
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(true)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/15 sm:text-base"
                >
                  Talk With Our Team
                  <Wallet className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ContactFormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </div>
  );
}

export default function CashFlowAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 px-4 py-20 text-center text-slate-600">
          Loading cash flow analysis...
        </div>
      }
    >
      <CashFlowAnalysisInner />
    </Suspense>
  );
}
