"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Sora } from 'next/font/google';
import {
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  FileSpreadsheet,
  FolderKanban,
  HandCoins,
  Handshake,
  LayoutDashboard,
  LineChart,
  Rocket,
  ShieldCheck,
  Upload,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import LoanPaymentCalculator from '@/app/(components)/LoanPaymentCalculator';
import Testimonials from '@/app/(components)/shared/Testimonials';
import LoanPackagingExplainer from '@/app/(components)/shared/LoanPackagingExplainer';
import ContactFormModal from '@/app/(components)/shared/ContactFormModal';
import AuthAwareCheckoutButton from '@/app/services/components/AuthAwareCheckoutButton';
import AuthAwareRouteButton from '@/app/services/components/AuthAwareRouteButton';
import type { StripeCheckoutProductType } from '@/lib/stripe/catalog';

const headingFont = Sora({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
});

type FeatureCard = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type TemplateCard = {
  title: string;
  description: string;
  category: 'Business' | 'Personal';
};

type OfferCard = {
  eyebrow: string;
  title: string;
  price: string;
  priceNote: string;
  summary: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  checkoutProductType?: StripeCheckoutProductType;
  authRoute?: string;
  accentClassName: string;
  panelClassName: string;
};

const marqueeItems = [
  'Loan Packaging Dashboard',
  'Guided Financial Templates',
  'Checklist Workflow',
  'Cover Letter Builder',
  'Secure Lender Links',
  'ZIP Package Export',
  'Loan Brokering Support',
  'Underwriting Follow-Up',
];

const differenceCards: FeatureCard[] = [
  {
    title: 'A real packaging dashboard, not just advice',
    description:
      'Instead of sending you a checklist and wishing you luck, we give you a structured workflow that keeps the request, documents, cover letter, and lender delivery in one place.',
    icon: LayoutDashboard,
  },
  {
    title: 'Templates that remove guesswork',
    description:
      'Our guided templates help turn missing or messy financials into cleaner lender-ready PDFs, which is one of the biggest friction points for borrowers.',
    icon: FileSpreadsheet,
  },
  {
    title: 'Brokering that builds on the same system',
    description:
      'When you want lender outreach too, we do not start over. Loan Brokering includes everything in Loan Packaging, then adds lender matching and deal support on top.',
    icon: Handshake,
  },
];

const templateCards: TemplateCard[] = [
  {
    title: 'Balance Sheet',
    description: 'Shows what the business owns and owes in a lender-friendly snapshot of assets, liabilities, and equity.',
    category: 'Business',
  },
  {
    title: 'Income Statement',
    description: 'Turns revenue and expenses into a cleaner profit-and-loss view that is easier for lenders to follow.',
    category: 'Business',
  },
  {
    title: 'Business Debt Summary',
    description: 'Organizes all business debt payments in one place so monthly obligations are easy to review and explain.',
    category: 'Business',
  },
  {
    title: 'Personal Financial Statement',
    description: 'Builds the guarantor net-worth picture lenders often expect when they evaluate personal support strength.',
    category: 'Personal',
  },
  {
    title: 'Personal Debt Summary',
    description: 'Puts personal obligations into a clean lender-facing schedule instead of scattered balances and notes.',
    category: 'Personal',
  },
];

const offerCards: OfferCard[] = [
  {
    eyebrow: 'Done-With-You System',
    title: 'Loan Packaging',
    price: '$499',
    priceNote: 'One-time fee',
    summary:
      'For borrowers who want the software, templates, cover letter workflow, and lender-ready package without being left to figure it out alone.',
    bullets: [
      'Full loan packaging dashboard access',
      'All five guided templates included',
      'Checklist-driven document workflow',
      'Cover letter drafting and package organization',
      'Cleaner lender-ready output and exports',
    ],
    ctaLabel: 'Begin Loan Packaging',
    ctaHref: '/checkout/loan_packaging',
    checkoutProductType: 'loan_packaging',
    accentClassName: 'text-cyan-800',
    panelClassName: 'border-slate-200 bg-white',
  },
  {
    eyebrow: 'Done-With-You + Done-With-Us',
    title: 'Loan Brokering',
    price: '1%',
    priceNote: 'Of funded loan amount at closing only',
    summary:
      'Everything in Loan Packaging is included, but instead of paying $499 upfront, this path keeps your upfront cost at $0 and gets paid only if the loan actually closes.',
    bullets: [
      'No money upfront to get started',
      'Includes all of Loan Packaging without a separate $499 packaging charge',
      'Broker Fee Agreement is signed online before lender outreach begins',
      'Lender matching based on the request and profile',
      'Guidance through lender follow-up and underwriting',
      'Support on terms, positioning, and next-step decisions',
      'You only pay if the loan closes',
    ],
    ctaLabel: 'Begin Loan Brokering',
    ctaHref: '/loan-brokering/agreement',
    authRoute: '/loan-brokering/agreement',
    accentClassName: 'text-emerald-800',
    panelClassName: 'border-emerald-200 bg-emerald-50/70',
  },
];

const workflowSteps = [
  {
    step: '01',
    title: 'Build the loan profile once',
    description: 'Capture the request, amount, purpose, business basics, and use-of-funds story in one place so the rest of the file stays consistent.',
    icon: FolderKanban,
  },
  {
    step: '02',
    title: 'Complete the checklist and templates',
    description: 'Upload what you already have and use guided templates where you still need polished lender-ready financial documents.',
    icon: Upload,
  },
  {
    step: '03',
    title: 'Generate the cover letter and package',
    description: 'Frame the request clearly, organize the supporting file, and prepare something much easier for a lender to review.',
    icon: FileSpreadsheet,
  },
  {
    step: '04',
    title: 'Add brokering if you want lender help too',
    description: 'If you want support beyond software, we use that finished package as the starting point for real lender outreach and follow-up.',
    icon: HandCoins,
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

export default function LoanServicesPage() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const calculatorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('[data-loanservices-reveal], [data-reveal]'),
    );
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
    const magnets = Array.from(document.querySelectorAll<HTMLElement>('[data-loanservices-magnetic]'));
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
    const hero = document.querySelector<HTMLElement>('[data-loanservices-hero]');
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

  const scrollToCalculator = () => {
    calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section
        data-loanservices-hero
        className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#155e75_0%,#0b2640_32%,#07111d_74%,#020617_100%)] text-white"
      >
        <div className="home-hero-mesh pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.10)_1px,transparent_1px)] [background-size:68px_68px]" />
        <div className="home-parallax-soft pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-cyan-400/18 blur-3xl" />
        <div className="home-parallax-soft-reverse pointer-events-none absolute right-[-6rem] top-8 h-80 w-80 rounded-full bg-amber-300/[0.14] blur-3xl" />
        <div className="home-float pointer-events-none absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-sky-400/12 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-9 sm:px-6 sm:pb-12 sm:pt-12 lg:pb-16 lg:pt-16">
          <div className="home-reveal home-reveal-visible mx-auto max-w-6xl text-center">
            <div className="mx-auto max-w-5xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.16] bg-white/[0.08] px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-100 backdrop-blur-sm sm:text-xs">
                <ShieldCheck className="h-4 w-4 text-cyan-200" />
                Loan packaging dashboard + brokering support
              </div>

              <h1
                className={`${headingFont.className} mx-auto mt-5 max-w-[22ch] text-[2.55rem] font-extrabold leading-[1] text-white sm:max-w-[24ch] sm:text-[3.1rem] lg:max-w-[24ch] lg:text-[3.75rem]`}
              >
                Build a lender-ready package without the guesswork.
              </h1>

              <p className="mx-auto mt-4 max-w-4xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7 lg:text-lg lg:leading-8">
                Our Loan Packaging service is not just guidance. It is a real dashboard that helps you organize the
                request, complete lender-ready templates, build the cover letter, and prepare a cleaner package lenders
                can review with less friction.
              </p>

              <p className="mx-auto mt-3 max-w-4xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                Loan Packaging is <span className="font-semibold text-white">$499</span> and includes all templates.
                Loan Brokering is <span className="font-semibold text-white">1% of the funded loan amount only if the
                deal closes</span>, includes everything in Loan Packaging, and lets borrowers avoid paying the $499
                packaging fee upfront.
              </p>

              <div className="mx-auto mt-6 flex w-full max-w-4xl flex-col gap-2.5 sm:w-auto sm:flex-row sm:justify-center">
                <AuthAwareCheckoutButton
                  className="home-magnetic group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 shadow-[0_20px_45px_-28px_rgba(255,255,255,0.85)] transition hover:-translate-y-0.5 hover:bg-slate-100 sm:w-auto sm:text-base"
                  id="loanservices-page-hero-cta-packaging"
                  data-loanservices-magnetic
                  productType="loan_packaging"
                >
                  Begin Loan Packaging
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </AuthAwareCheckoutButton>
                <button
                  type="button"
                  onClick={scrollToCalculator}
                  className="home-magnetic inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.18] bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/[0.16] sm:w-auto sm:text-base"
                  id="loanservices-page-hero-cta-calculator"
                  data-loanservices-magnetic
                >
                  See What Payments Could Look Like
                  <LineChart className="h-4 w-4" />
                </button>
              </div>

              <div className="mx-auto mt-5 flex max-w-5xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[13px] text-slate-200 sm:text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Dashboard included
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  All templates included in packaging
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Brokering includes packaging
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-3" data-loanservices-reveal>
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

      <section className="bg-slate-50 py-9 sm:py-12" data-loanservices-reveal>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="home-reveal max-w-6xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Why This Matters</p>
            <h2 className="mt-2 max-w-[28ch] text-2xl font-black text-slate-900 sm:max-w-none sm:text-4xl">
              Most borrowers lose momentum because the file is messy, not because they want funding.
            </h2>
            <p className="mt-3 max-w-5xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              The dashboard, templates, cover letter, and package workflow are designed to solve that problem. This is
              the difference between chasing documents across folders and building a cleaner lender-facing package on purpose.
            </p>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {differenceCards.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="home-tilt home-stagger group rounded-[1.9rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 transition group-hover:bg-cyan-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold tracking-[-0.03em] text-slate-950 sm:text-xl">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <div data-loanservices-reveal className="home-reveal">
        <LoanPackagingExplainer />
      </div>

      <section className="bg-white py-9 sm:py-12" data-loanservices-reveal>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="home-reveal grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Templates Matter</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-4xl">
                The templates are one of the biggest difference makers in the whole system.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                A lot of owners are not missing effort. They are missing a clean format lenders actually know how to
                review. Our templates help turn scattered financial information into structured lender-ready PDFs without
                forcing you to start from a blank spreadsheet.
              </p>

              <div className="mt-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">What That Means For You</p>
                <div className="mt-3 space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-sm leading-6 text-slate-700">You do not have to guess which financial statements lenders expect to see.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-sm leading-6 text-slate-700">Missing statements stop being a dead end because the software helps you build them.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-sm leading-6 text-slate-700">The finished package looks more organized, more credible, and easier for underwriting to digest.</p>
                  </div>
                </div>

                <Link
                  href="/templates"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-800 transition hover:text-cyan-600 sm:text-base"
                >
                  Explore The Templates Tool
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {templateCards.map((item) => (
                <article
                  key={item.title}
                  className="home-tilt home-stagger rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-sm transition hover:border-slate-300 hover:shadow-lg sm:p-5"
                >
                  <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                    {item.category}
                  </div>
                  <h3 className="mt-3 text-base font-extrabold tracking-[-0.03em] text-slate-950 sm:text-lg">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-9 text-white sm:py-12" data-loanservices-reveal>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="home-reveal max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Pricing + Support Paths</p>
            <h2 className="mt-2 text-2xl font-black sm:text-4xl">Choose whether you just want the system, or the system plus lender help.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
              Both paths start with better organization. Brokering simply adds our hands-on support after the package is built.
            </p>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {offerCards.map((offer) => (
              <article
                key={offer.title}
                className={`home-stagger flex h-full flex-col rounded-[2rem] border p-5 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.8)] backdrop-blur sm:p-6 ${offer.panelClassName}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{offer.eyebrow}</p>
                    <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">{offer.title}</h3>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/60 bg-white/80 px-4 py-3 text-right shadow-sm">
                    <p className={`text-3xl font-black tracking-[-0.05em] ${offer.accentClassName}`}>{offer.price}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{offer.priceNote}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-700">{offer.summary}</p>

                <div className="mt-4 grid gap-2.5">
                  {offer.bullets.map((bullet) => (
                    <div
                      key={bullet}
                      className="rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <p className="text-sm leading-6 text-slate-700">{bullet}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  {offer.checkoutProductType ? (
                    <AuthAwareCheckoutButton
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 sm:text-base"
                      productType={offer.checkoutProductType}
                    >
                      {offer.ctaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </AuthAwareCheckoutButton>
                  ) : offer.authRoute ? (
                    <AuthAwareRouteButton
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 sm:text-base"
                      route={offer.authRoute}
                    >
                      {offer.ctaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </AuthAwareRouteButton>
                  ) : (
                    <Link
                      href={offer.ctaHref}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 sm:text-base"
                    >
                      {offer.ctaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 home-stagger rounded-[1.75rem] border border-emerald-300/15 bg-emerald-300/10 px-4 py-4 text-sm leading-6 text-emerald-50 sm:px-5">
            <span className="font-semibold text-white">Why many borrowers choose brokering:</span> there is no money
            upfront to start. The 1% fee is due only if the loan closes, and Loan Packaging is already included in that
            path, so you are not paying the separate $499 packaging fee first.
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-9 sm:py-12" data-loanservices-reveal>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="home-reveal max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">How It Works</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-4xl">
              From messy file to lender-ready package in four cleaner steps.
            </h2>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-4">
            {workflowSteps.map((step) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.step}
                  className="home-tilt home-stagger rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-lg sm:p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{step.step}</span>
                  </div>
                  <h3 className="mt-4 text-base font-extrabold tracking-[-0.03em] text-slate-950 sm:text-lg">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <div data-loanservices-reveal className="home-reveal">
        <Testimonials />
      </div>

      <section
        id="loan-calculator"
        ref={calculatorRef}
        className="scroll-mt-24 bg-white py-9 sm:py-12"
        data-loanservices-reveal
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="home-reveal max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Plan The Payment</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-4xl">Pressure-test the payment while you build the package.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              If you are exploring a real request, use the calculator below to sense-check the monthly payment while you work through packaging and qualification.
            </p>
          </div>

          <div className="mt-5 home-stagger overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_28px_70px_-44px_rgba(15,23,42,0.28)]">
            <LoanPaymentCalculator />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-950 py-9 text-white sm:py-12" data-loanservices-reveal>
        <div className="pointer-events-none absolute inset-0 opacity-55 [background-image:radial-gradient(circle_at_16%_20%,rgba(6,182,212,0.18),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(251,191,36,0.14),transparent_22%),radial-gradient(circle_at_72%_84%,rgba(16,185,129,0.14),transparent_28%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr] xl:items-center">
            <div className="home-reveal">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Ready To Move?</p>
              <h2 className="mt-2 text-2xl font-black sm:text-4xl">Sell the lender on the strength of the file before you ever send it.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                The dashboard helps you get organized. The templates help you fill the gaps. The cover letter helps frame
                the request. And if you want it, brokering helps carry that finished package into lender conversations.
              </p>
            </div>

            <div className="home-reveal rounded-[2rem] border border-white/10 bg-white/[0.05] p-4 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.82)] backdrop-blur-md sm:p-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Packaging</p>
                  <p className="mt-2 text-sm font-semibold text-white">$499 with all templates included</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Brokering</p>
                  <p className="mt-2 text-sm font-semibold text-white">No money upfront • 1% only at closing</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Templates</p>
                  <p className="mt-2 text-sm font-semibold text-white">Five guided lender-ready forms</p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <AuthAwareRouteButton
                  className="home-magnetic inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-slate-100 sm:text-base"
                  data-loanservices-magnetic
                  route="/loan-brokering/agreement"
                >
                  Begin Loan Brokering
                  <Rocket className="h-4 w-4" />
                </AuthAwareRouteButton>
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(true)}
                  className="home-magnetic inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-[0_18px_50px_-30px_rgba(52,211,153,0.9)] transition hover:bg-emerald-300 sm:text-base"
                  data-loanservices-magnetic
                >
                  Talk Through The Best Path
                  <BadgeDollarSign className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row">
                <Link
                  href="/templates"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:text-base"
                >
                  Explore Templates
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/cash-flow-analysis"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/15 sm:text-base"
                >
                  Check DSCR First
                  <Wallet className="h-4 w-4" />
                </Link>
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
