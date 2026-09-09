"use client";

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sora } from 'next/font/google';
import { Suspense, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  HelpCircle,
  Landmark,
  Layers3,
  LineChart,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import DscrQuickCalculator from '@/app/(components)/cash-flow/DscrQuickCalculator';
import ContactFormModal from '@/app/(components)/shared/ContactFormModal';
import { trackCtaClick, trackSectionView } from '@/lib/analytics';

const headingFont = Sora({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
});

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const bankLevelFeatures: Feature[] = [
  {
    title: 'Multi-period financial review',
    description: 'Review historical and year-to-date performance instead of relying on one current-month snapshot.',
    icon: BarChart3,
  },
  {
    title: 'Adjusted cash flow',
    description: 'Review supported add-backs—such as certain owner compensation, one-time costs, and non-cash expenses—that may increase qualifying cash flow when a lender accepts them.',
    icon: TrendingUp,
  },
  {
    title: 'Complete debt picture',
    description: 'Organize existing obligations and the proposed loan payment into one repayment view.',
    icon: Layers3,
  },
  {
    title: 'Two downloadable reports',
    description: 'Generate a cash-flow analysis and business debt summary you can include with a loan package to give the lender a clearer starting point.',
    icon: FileText,
  },
];

const faqItems = [
  {
    question: 'Is the comprehensive analysis really free?',
    answer: 'Yes. The complete bank-level workflow and both PDF reports are free with an account. There is no credit pull.',
  },
  {
    question: 'What does “bank-level” mean?',
    answer: 'It means the workflow uses the deeper inputs and repayment concepts commonly reviewed in business lending. It is not a loan approval or a substitute for a lender’s underwriting.',
  },
  {
    question: 'Why is the comprehensive analysis better than the quick check?',
    answer: 'The quick check uses a current snapshot and does not evaluate add-backs. The comprehensive analysis reviews multiple historical periods and year-to-date results, considers supported add-backs that may improve lender-adjusted cash flow and DSCR, and includes existing debts. That produces a more realistic lender-style view for a real loan request.',
  },
  {
    question: 'Can I submit the reports with a loan application?',
    answer: 'Yes. The cash-flow analysis and business debt summary can be included with your loan package. They help present the lender with an organized repayment picture upfront, although the lender will still verify the information and complete its own underwriting.',
  },
];

function SectionHeading({ eyebrow, title, description, light = false }: { eyebrow: string; title: string; description: string; light?: boolean }) {
  return (
    <div className="w-full">
      <p className={`text-xs font-black uppercase tracking-[0.2em] ${light ? 'text-amber-300' : 'text-cyan-800'}`}>{eyebrow}</p>
      <h2 className={`${headingFont.className} mt-2 text-2xl font-extrabold leading-[1.08] tracking-[-0.04em] sm:text-3xl ${light ? 'text-white' : 'text-slate-950'}`}>{title}</h2>
      <p className={`mt-3 text-sm leading-6 sm:text-base ${light ? 'text-slate-300' : 'text-slate-600'}`}>{description}</p>
    </div>
  );
}

function CashFlowAnalysisInner() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const calculatorRef = useRef<HTMLElement | null>(null);
  const seenSectionsRef = useRef<Set<string>>(new Set());
  const searchParams = useSearchParams();
  const router = useRouter();
  const comprehensiveAnalysisPath = '/comprehensive-cash-flow-analysis?new=1';

  const trackCashFlowCta = (sectionId: string, ctaId: string, ctaLabel: string, destinationUrl: string) => {
    trackCtaClick({
      page_template: 'cash_flow_analysis',
      section_id: sectionId,
      cta_id: ctaId,
      cta_label: ctaLabel,
      destination_url: destinationUrl,
    });
  };

  useEffect(() => {
    trackSectionView({ page_template: 'cash_flow_analysis', section_id: 'hero', section_label: 'Hero' });
    seenSectionsRef.current.add('hero');
  }, []);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-cashflow-reveal]'));
    const reveal = (section: HTMLElement) => {
      section.classList.add('home-reveal-visible');
      const sectionId = section.dataset.analyticsSection;
      if (sectionId && !seenSectionsRef.current.has(sectionId)) {
        seenSectionsRef.current.add(sectionId);
        trackSectionView({
          page_template: 'cash_flow_analysis',
          section_id: sectionId,
          section_label: section.dataset.analyticsLabel,
        });
      }
      section.querySelectorAll<HTMLElement>('.home-stagger').forEach((node, index) => {
        node.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
        node.classList.add('home-reveal-visible');
      });
    };

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sections.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      reveal(entry.target as HTMLElement);
      observer.unobserve(entry.target);
    }), { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (searchParams.get('showCalculator') === 'true') {
      window.setTimeout(() => calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 140);
    }
    if (searchParams.get('comprehensive') === 'true') {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete('comprehensive');
      window.history.replaceState({}, '', nextUrl.toString());
      router.push(comprehensiveAnalysisPath);
    }
  }, [comprehensiveAnalysisPath, router, searchParams]);

  const startComprehensive = (sectionId: string, ctaId: string) => {
    trackCashFlowCta(sectionId, ctaId, 'Start Free Bank-Level Analysis', comprehensiveAnalysisPath);
    router.push(comprehensiveAnalysisPath);
  };

  const showCalculator = (sectionId: string, ctaId: string) => {
    trackCashFlowCta(sectionId, ctaId, 'Use Quick DSCR Check', '#dscr-calculator');
    calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="overflow-hidden bg-[#f7f8f6] text-slate-950">
      <section className="home-dossier-bg relative isolate overflow-hidden bg-[#071824] text-white">
        <div className="home-noise pointer-events-none absolute inset-0 opacity-[0.12]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/70 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-11 lg:px-8 lg:py-12">
          <div className="mx-auto max-w-6xl text-center">
            <div className="inline-flex items-center gap-2 border-x-2 border-amber-300 px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-100 sm:text-xs">
              <Landmark className="h-4 w-4" />Free bank-level cash-flow analysis
            </div>
            <h1 className={`${headingFont.className} mx-auto mt-4 max-w-[27ch] text-[2.25rem] font-extrabold leading-[1] tracking-[-0.045em] text-balance sm:text-5xl lg:text-[3.35rem]`}>
              See how a lender may evaluate your ability to repay.
            </h1>
            <p className="mx-auto mt-4 max-w-4xl text-[15px] leading-6 text-slate-300 sm:text-lg sm:leading-7">
              Complete a deeper analysis using multi-period financials, adjusted cash flow, existing debts, and the proposed loan payment—then generate two lender-ready PDF reports.
            </p>
            <div className="mx-auto mt-5 grid max-w-2xl gap-2.5 sm:grid-cols-[1.15fr_0.85fr]">
              <button type="button" onClick={() => startComprehensive('hero', 'cashflow_hero_comprehensive')} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f5c86a] px-5 py-3 text-sm font-extrabold text-[#071824] shadow-[0_16px_35px_-18px_rgba(245,200,106,0.8)] transition hover:-translate-y-0.5 hover:bg-[#ffda88] sm:text-base">
                Start Free Bank-Level Analysis <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
              <button type="button" onClick={() => showCalculator('hero', 'cashflow_hero_quick')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:border-white/35 hover:bg-white/[0.1] sm:text-base">
                Use Quick DSCR Check
              </button>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-300 sm:text-sm">
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-300" />Comprehensive analysis is free</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-300" />Two PDF reports included</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-300" />No credit pull</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white" aria-label="Analysis capabilities">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-slate-200 px-4 sm:grid-cols-4 sm:divide-y-0 sm:px-6 lg:px-8">
          {[
            ['Multi-period review', BarChart3],
            ['Adjusted cash flow', TrendingUp],
            ['Business debt analysis', Layers3],
            ['Downloadable reports', FileText],
          ].map(([label, icon]) => {
            const Icon = icon as LucideIcon;
            return <div key={label as string} className="flex min-h-14 items-center justify-center gap-2 px-2 py-3 text-center text-[11px] font-bold text-slate-700 sm:text-xs"><Icon className="h-4 w-4 shrink-0 text-cyan-800" />{label as string}</div>;
          })}
        </div>
      </section>

      <section className="bg-[#f7f8f6] py-9 sm:py-11" data-cashflow-reveal data-analytics-section="choose_analysis" data-analytics-label="Choose Analysis">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Choose the right depth" title="A quick estimate is useful. A real funding decision deserves the full picture." description="Both tools are free. Choose based on how much confidence and detail you need—not based on price." />
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="home-stagger relative overflow-hidden rounded-2xl border border-cyan-300 bg-[#0b3345] p-5 text-white shadow-[0_20px_55px_-35px_rgba(8,145,178,0.75)] sm:p-6">
              <span className="absolute right-4 top-4 rounded-full bg-emerald-300 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-950">Recommended</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><LineChart className="h-5 w-5 text-amber-300" /></div>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Comprehensive analysis</p>
              <h3 className={`${headingFont.className} mt-1.5 pr-24 text-xl font-extrabold tracking-[-0.03em] sm:text-2xl`}>Bank-level depth, free with an account.</h3>
              <p className="mt-2 text-sm leading-6 text-slate-200">Best for a real loan request. It follows the deeper cash-flow process a bank would use by reviewing multiple periods, year-to-date performance, existing debts, and supported adjustments—not just one current snapshot.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {['Historical + year-to-date review', 'Supported add-backs and adjusted cash flow', 'Existing and proposed debt', 'Two downloadable loan-package reports'].map((item) => <span key={item} className="inline-flex items-start gap-2 text-sm font-semibold text-slate-100"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />{item}</span>)}
              </div>
              <button type="button" onClick={() => startComprehensive('choose_analysis', 'cashflow_choose_comprehensive')} className="group mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#f5c86a] px-5 py-3 text-sm font-extrabold text-[#071824] transition hover:bg-[#ffda88] sm:w-auto">
                Start Comprehensive Analysis <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
            </article>

            <article className="home-stagger rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_35px_-30px_rgba(15,23,42,0.5)] sm:p-6">
              <div className="flex items-center justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-cyan-800"><Clock3 className="h-5 w-5" /></div><span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">About 60 seconds</span></div>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-cyan-800">Quick DSCR check</p>
              <h3 className={`${headingFont.className} mt-1.5 text-xl font-extrabold tracking-[-0.03em] sm:text-2xl`}>A directional first pass.</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Best when you want to test a rough request quickly using current income, debt payments, and estimated new loan terms.</p>
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600"><strong className="text-slate-950">Output:</strong> an on-screen estimate—not a full lender-style review or approval.</div>
              <button type="button" onClick={() => showCalculator('choose_analysis', 'cashflow_choose_quick')} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-900 transition hover:border-cyan-500 hover:bg-cyan-50">
                Open Quick Calculator <ArrowRight className="h-4 w-4" />
              </button>
            </article>
          </div>
        </div>
      </section>

      <section id="dscr-calculator" ref={calculatorRef} className="scroll-mt-20 bg-white pb-9 pt-6 sm:pb-11 sm:pt-8" data-cashflow-reveal data-analytics-section="quick_calculator" data-analytics-label="Quick Calculator">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-800">Free directional tool</p>
            <h2 className={`${headingFont.className} mt-2 text-2xl font-extrabold tracking-[-0.04em] text-slate-950 sm:text-3xl`}>Run a quick high-level DSCR check.</h2>
            <p className="mx-auto mt-2 max-w-3xl text-sm leading-6 text-slate-600">Get an immediate estimate with no documents and no credit impact. For a real funding plan, use the comprehensive analysis above.</p>
          </div>
          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#f8faf9] shadow-[0_24px_70px_-45px_rgba(15,23,42,0.35)] sm:rounded-[1.75rem]">
            <div className="border-b border-slate-200 bg-[#0a2231] px-4 py-3 text-white sm:flex sm:items-center sm:justify-between sm:px-5"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-300" /><p className="text-sm font-extrabold">Test a loan request</p></div><p className="mt-1 text-xs text-slate-300 sm:mt-0">Free • No credit pull • No documents</p></div>
            <div className="p-1.5 sm:p-3"><DscrQuickCalculator embedded compactMobileLayout analyticsPageTemplate="cash_flow_analysis" analyticsPlacement="cash_flow_embedded_calculator" /></div>
          </div>
        </div>
      </section>

      <section className="home-ink-panel relative overflow-hidden bg-[#081b28] py-9 text-white sm:py-11" data-cashflow-reveal data-analytics-section="bank_level_detail" data-analytics-label="Bank-Level Detail">
        <div className="home-noise pointer-events-none absolute inset-0 opacity-[0.08]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading light eyebrow="What bank-level means" title="The kind of cash-flow analysis a bank would run for a business loan." description="Banks do not evaluate repayment strength from one month or one unadjusted number. They review historical and year-to-date performance, verify existing debt, calculate the proposed payment, and consider documented add-backs to arrive at lender-adjusted cash flow and DSCR. Our comprehensive workflow guides you through that same type of analysis and organizes the results before you apply. It does not guarantee approval, but it helps you present a much clearer starting picture." />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {bankLevelFeatures.map((item) => {
              const Icon = item.icon;
              return <article key={item.title} className="home-stagger rounded-2xl border border-white/10 bg-white/[0.05] p-4"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-amber-300"><Icon className="h-4 w-4" /></div><h3 className="mt-3 text-base font-extrabold text-white">{item.title}</h3><p className="mt-1.5 text-sm leading-5 text-slate-300">{item.description}</p></article>;
            })}
          </div>
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-extrabold text-white">The full analysis is free.</p><p className="mt-1 text-sm text-slate-300">Create an account, complete the guided inputs, and download both reports.</p></div>
            <button type="button" onClick={() => startComprehensive('bank_level_detail', 'cashflow_detail_comprehensive')} className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f5c86a] px-5 py-3 text-sm font-extrabold text-[#071824] transition hover:bg-[#ffda88]">Start Free Analysis <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></button>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f8f6] py-9 sm:py-11" data-cashflow-reveal data-analytics-section="faq" data-analytics-label="FAQ">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-800"><HelpCircle className="h-4 w-4" />Clear answers</div>
              <h2 className={`${headingFont.className} mt-2 text-2xl font-extrabold tracking-[-0.04em] text-slate-950 sm:text-3xl`}>Know what you are getting before you begin.</h2>
              <Link href="/faq" onClick={() => trackCashFlowCta('faq', 'cashflow_full_faq', 'View All FAQs', '/faq')} className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-cyan-800 hover:text-cyan-950">View all FAQs <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid gap-3">
              {faqItems.map((item) => <article key={item.question} className="home-stagger rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_35px_-30px_rgba(15,23,42,0.5)]"><h3 className="text-sm font-extrabold text-slate-950 sm:text-base">{item.question}</h3><p className="mt-1.5 text-sm leading-6 text-slate-600">{item.answer}</p></article>)}
            </div>
          </div>

          <div className="mt-7 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_55px_-42px_rgba(15,23,42,0.4)] sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div><p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">Ready for a clearer answer?</p><h2 className={`${headingFont.className} mt-2 text-xl font-extrabold tracking-[-0.03em] text-slate-950 sm:text-2xl`}>Run the free bank-level analysis or talk through your next step.</h2></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => startComprehensive('faq', 'cashflow_bottom_comprehensive')} className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0b3345] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#0d4056]">Start Free Analysis <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></button>
              <button type="button" onClick={() => { trackCashFlowCta('faq', 'cashflow_contact', 'Talk With Our Team', '#contact-modal'); setIsContactModalOpen(true); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-extrabold text-slate-900 transition hover:bg-slate-50"><Users className="h-4 w-4" />Talk With Our Team</button>
            </div>
          </div>
        </div>
      </section>

      <ContactFormModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} source="cash-flow-analysis-modal" />
    </div>
  );
}

export default function CashFlowAnalysisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f8f6] px-4 py-20 text-center text-slate-600">Loading cash flow analysis...</div>}>
      <CashFlowAnalysisInner />
    </Suspense>
  );
}
