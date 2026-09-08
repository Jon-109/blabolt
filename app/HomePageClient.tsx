"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Sora } from 'next/font/google';
import { useEffect, useRef } from 'react';
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Check,
  CircleDollarSign,
  FileCheck2,
  FileStack,
  FileText,
  FolderCheck,
  Handshake,
  Landmark,
  LineChart,
  LockKeyhole,
  PenLine,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import DscrQuickCalculator from '@/app/(components)/cash-flow/DscrQuickCalculator';
import GuidedTemplateDemo from '@/app/(components)/GuidedTemplateDemo';
import LoanPackagingDemo from '@/app/(components)/LoanPackagingDemo';
import LoanServiceReadinessModal from '@/app/(components)/LoanServiceReadinessModal';
import TemplateLinkGrid from '@/app/(components)/TemplateLinkGrid';
import { trackCtaClick, trackSectionView } from '@/lib/analytics';

const headingFont = Sora({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
});

const journey = [
  { number: '01', label: 'Analyze', title: 'Know what the payment demands', description: 'Check DSCR quickly or complete the full bank-level cash-flow review.', icon: LineChart },
  { number: '02', label: 'Prepare', title: 'Create the required documents', description: 'Use guided forms to generate clean lender-ready financial PDFs.', icon: FileCheck2 },
  { number: '03', label: 'Package', title: 'Build one organized lender file', description: 'Bring the request, documents, cover letter, and exports together.', icon: FolderCheck },
  { number: '04', label: 'Connect', title: 'Get lender help when needed', description: 'Add matching, outreach, and deal support without starting over.', icon: Handshake },
];

const testimonials = [
  {
    quote: 'Their knowledge of the banking industry, attention to detail, and accountability have consistently helped me achieve major business milestones.',
    name: 'Timothy N. Ramon',
    role: 'President, JR Ramon & Sons',
    image: '/images/TimothyRamon.png',
  },
  {
    quote: 'They listened to my needs, created tailored solutions, and successfully closed the loans I needed to grow my business.',
    name: 'Skylar Moon',
    role: 'President, Boost Mobile Authorized Dealer',
    image: '/images/SkylarMoonProfilePicture.png',
  },
  {
    quote: 'Their guidance helped us secure funding that directly supported our organization’s growth.',
    name: 'Gerald M. Gonzales',
    role: 'Attorney at Law',
    image: '/images/GeraldPicture.png',
  },
];

function trackHomeCta(sectionId: string, ctaId: string, ctaLabel: string, destinationUrl: string) {
  trackCtaClick({ page_template: 'home', section_id: sectionId, cta_id: ctaId, cta_label: ctaLabel, destination_url: destinationUrl });
}

function SectionHeading({ eyebrow, title, description, light = false, centered = false }: { eyebrow: string; title: string; description: string; light?: boolean; centered?: boolean }) {
  return (
    <div className={`w-full ${centered ? 'text-center' : ''}`}>
      <p className={`text-xs font-black uppercase tracking-[0.2em] ${light ? 'text-amber-300' : 'text-cyan-800'}`}>{eyebrow}</p>
      <h2 className={`${headingFont.className} mt-2 text-3xl font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-4xl ${light ? 'text-white' : 'text-slate-950'}`}>{title}</h2>
      <p className={`mt-3 w-full text-sm leading-6 sm:text-base ${light ? 'text-slate-300' : 'text-slate-600'}`}>{description}</p>
    </div>
  );
}

export default function Home() {
  const seenSectionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    trackSectionView({ page_template: 'home', section_id: 'hero', section_label: 'Hero' });
    seenSectionsRef.current.add('hero');
  }, []);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-home-reveal]'));
    const reveal = (section: HTMLElement) => {
      section.classList.add('home-reveal-visible');
      const sectionId = section.dataset.analyticsSection;
      if (sectionId && !seenSectionsRef.current.has(sectionId)) {
        seenSectionsRef.current.add(sectionId);
        trackSectionView({ page_template: 'home', section_id: sectionId, section_label: section.dataset.analyticsLabel });
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

  return (
    <div className="overflow-hidden bg-[#f7f8f6] text-slate-950">
      <section className="home-dossier-bg relative isolate overflow-hidden bg-[#071824] text-white">
        <div className="home-noise pointer-events-none absolute inset-0 opacity-[0.12]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/70 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-11 lg:px-8 lg:py-12">
          <div className="mx-auto max-w-6xl text-center">
            <div className="inline-flex items-center gap-2 border-x-2 border-amber-300 px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-100 sm:text-xs">
              <Landmark className="h-4 w-4" />Loan readiness, built like a lender file
            </div>
            <h1 className={`${headingFont.className} mx-auto mt-4 max-w-[30ch] text-[2.25rem] font-extrabold leading-[1] tracking-[-0.045em] text-white text-balance sm:text-5xl lg:text-[3.35rem]`}>
              Know what lenders will see—and build a stronger loan request before you apply.
            </h1>
            <p className="mx-auto mt-4 max-w-5xl text-[15px] leading-6 text-slate-300 sm:text-lg sm:leading-7">Analyze repayment strength, create the financial documents most loan applications require, and build one organized business loan package in a guided workspace.</p>
            <div className="mx-auto mt-5 grid max-w-2xl gap-2.5 sm:grid-cols-2">
              <Link href="#loan-readiness-check" onClick={() => trackHomeCta('hero', 'home_hero_readiness', 'Check My Loan Readiness', '#loan-readiness-check')} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f5c86a] px-5 py-3 text-sm font-extrabold text-[#071824] shadow-[0_16px_35px_-18px_rgba(245,200,106,0.8)] transition hover:-translate-y-0.5 hover:bg-[#ffda88] sm:text-base">Check My Loan Readiness <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link>
              <Link href="/loan-services" onClick={() => trackHomeCta('hero', 'home_hero_packaging', 'Explore Loan Packaging', '/loan-services')} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:border-white/35 hover:bg-white/[0.1] sm:text-base">Explore Loan Packaging <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-300 sm:text-sm">
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-300" />Free cash-flow tools</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-300" />No credit pull</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-300" />Optional expert help</span>
            </div>
            <Link href="/sba-7a-loans" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100 transition hover:text-white">Preparing for an SBA 7(a) loan? <span className="border-b border-cyan-200/40 pb-0.5">Explore SBA support</span><ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white" aria-label="Platform capabilities">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-slate-200 px-4 sm:grid-cols-4 sm:divide-y-0 sm:px-6 lg:px-8">
          {[
            ['Free bank-level analysis', LineChart],
            ['Five guided templates', PenLine],
            ['Secure package workspace', LockKeyhole],
            ['Optional lender support', Users],
          ].map(([label, icon]) => {
            const Icon = icon as LucideIcon;
            return <div key={label as string} className="flex min-h-14 items-center justify-center gap-2 px-2 py-3 text-center text-[11px] font-bold text-slate-700 sm:text-xs"><Icon className="h-4 w-4 shrink-0 text-cyan-800" />{label as string}</div>;
          })}
        </div>
      </section>

      <section className="bg-[#f7f8f6] py-9 sm:py-11" data-home-reveal data-analytics-section="journey" data-analytics-label="Borrower Journey">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="One connected process" title="A clearer path from loan idea to lender review." description="Stop piecing the request together across calculators, spreadsheets, email, and folders. Each stage builds on the work before it." />
          <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="pointer-events-none absolute left-[8%] right-[8%] top-8 hidden h-px bg-gradient-to-r from-transparent via-cyan-700/30 to-transparent lg:block" />
            {journey.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.number} className="home-stagger relative rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_35px_-30px_rgba(15,23,42,0.5)] transition hover:-translate-y-1 hover:border-cyan-300">
                  <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b3345] text-white"><Icon className="h-4 w-4" /></span><p className="text-sm font-black uppercase tracking-[0.12em] text-cyan-800">{item.label}</p></div><span className="text-[11px] font-black tracking-[0.2em] text-slate-400">{item.number}</span></div>
                  <h3 className="mt-3 text-base font-extrabold leading-5 text-slate-950">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-5 text-slate-600">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="loan-readiness-check" className="scroll-mt-20 bg-white pb-9 pt-6 sm:pb-11 sm:pt-8" data-home-reveal data-analytics-section="free_analysis" data-analytics-label="Free Analysis">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="px-1 sm:px-0">
            <SectionHeading centered eyebrow="Free cash-flow analysis" title="Start fast. Go deeper when the deal deserves it." description="Use the quick check for a directional read, or complete the bank-level workflow when you need historical context and lender-ready reports. Both paths are free." />
            <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row sm:items-stretch">
              <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 sm:w-auto sm:min-w-[250px]"><p className="text-xs font-extrabold text-slate-950">Quick DSCR check</p><p className="mt-1 text-xs leading-5 text-slate-600">60 seconds • Current snapshot • Directional estimate</p></div>
              <Link href="/comprehensive-cash-flow-analysis?new=1" onClick={() => trackHomeCta('free_analysis', 'home_full_analysis', 'Run Free Bank-Level Analysis', '/comprehensive-cash-flow-analysis?new=1')} className="group relative w-full overflow-hidden rounded-xl border border-cyan-300 bg-[#0b3345] p-3 text-white shadow-[0_16px_34px_-24px_rgba(8,145,178,0.7)] transition hover:-translate-y-0.5 hover:bg-[#0d4056] sm:w-auto sm:min-w-[390px]"><span className="absolute right-3 top-3 rounded-full bg-emerald-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-emerald-950">Most complete</span><p className="flex items-center gap-2 pr-24 text-xs font-extrabold">Bank-level cash-flow analysis <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></p><p className="mt-1 text-xs leading-5 text-slate-200">Multi-year financials • Existing debts • Lender-style DSCR • Two PDF reports</p></Link>
            </div>
          </div>
          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#f8faf9] shadow-[0_24px_70px_-45px_rgba(15,23,42,0.35)] sm:rounded-[1.75rem]">
            <div className="border-b border-slate-200 bg-[#0a2231] px-4 py-3 text-white sm:flex sm:items-center sm:justify-between sm:px-5"><div className="flex items-center gap-2"><CircleDollarSign className="h-4 w-4 text-amber-300" /><p className="text-sm font-extrabold">Test a real loan request now</p></div><p className="mt-1 text-xs text-slate-300 sm:mt-0">No credit pull • No documents • Private estimate</p></div>
            <div className="p-1.5 sm:p-3"><DscrQuickCalculator embedded compactMobileLayout analyticsPageTemplate="home" analyticsPlacement="home_embedded_calculator" /></div>
          </div>
        </div>
      </section>

      <section className="home-ink-panel relative overflow-hidden bg-[#081b28] py-9 text-white sm:py-11" data-home-reveal data-analytics-section="packaging" data-analytics-label="Loan Packaging">
        <div className="home-noise pointer-events-none absolute inset-0 opacity-[0.08]" />
        <div className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="px-1 sm:px-0">
            <SectionHeading light eyebrow="Loan packaging dashboard" title="Build a complete lender-ready package through one guided workflow." description="Loan packaging is the work of turning a funding request into a file a lender can efficiently review. The dashboard guides you through the loan profile, required documents, financial templates, banker-facing cover letter, and secure package delivery—so the final request is organized, consistent, and ready for lender conversations." />
          </div>
          <div className="mt-5"><LoanPackagingDemo compact /></div>
        </div>
      </section>

      <section className="bg-[#f3f1ea] py-9 sm:py-11" data-home-reveal data-analytics-section="templates" data-analytics-label="Guided Templates">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="px-1 sm:px-0">
            <SectionHeading eyebrow="The financial foundation" title="Five guided documents that support a stronger loan application." description="Most lenders need a clear view of the business and each guarantor. These guided workflows collect the underlying information, check the totals, and generate consistently formatted PDFs for the package." />
          </div>

          <div className="mt-5"><GuidedTemplateDemo compact /></div>

          <div className="mt-4"><TemplateLinkGrid /></div>
        </div>
      </section>

      <section className="bg-white py-9 sm:py-11" data-home-reveal data-analytics-section="sba_support" data-analytics-label="SBA Support">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#f8faf9] shadow-[0_20px_55px_-42px_rgba(15,23,42,0.4)]">
            <div className="bg-[#0b3345] p-5 text-white sm:p-6">
              <div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-amber-300"><Building2 className="h-4 w-4" />SBA 7(a) preparation</div><h2 className={`${headingFont.className} mt-2 text-2xl font-extrabold leading-tight tracking-[-0.035em] sm:text-3xl`}>SBA 7(a) can help a strong business qualify for more flexible financing.</h2><p className="mt-2 max-w-6xl text-sm leading-6 text-slate-300">You still borrow from a bank or participating lender. The SBA guarantees part of the lender’s risk, which can make longer repayment terms or a broader range of loan purposes possible. You still need enough cash flow to repay the loan and a complete borrower file.</p><div className="mt-4 flex justify-center"><Link href="/sba-7a-loans" onClick={() => trackHomeCta('sba_support', 'home_sba_support', 'Explore SBA Loan Support', '/sba-7a-loans')} className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-slate-950">Understand SBA 7(a) <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link></div></div>
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-semibold text-cyan-50"><span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">Up to $5 million</span><span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">Up to 10 or 25 years by purpose</span><span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">Lender-issued • SBA-guaranteed portion</span></div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-4">
              {[["Test repayment capacity", BarChart3], ["Complete SBA Form 413", FileText], ["Organize business financials", FileStack], ["Build the lender package", BriefcaseBusiness]].map(([label, icon]) => {
                const Icon = icon as LucideIcon;
                return <div key={label as string} className="flex min-h-20 items-center gap-3 bg-white p-3 sm:p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800"><Icon className="h-4 w-4" /></span><p className="text-xs font-extrabold leading-4 text-slate-900 sm:text-sm sm:leading-5">{label as string}</p></div>;
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f8f6] py-9 sm:py-11" data-home-reveal data-analytics-section="client_proof" data-analytics-label="Client Proof">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Real borrower perspective" title="Experience that moves the request forward." description="Practical lending guidance, careful preparation, and support grounded in real banking experience." />
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <figure key={testimonial.name} className="home-stagger flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_35px_-30px_rgba(15,23,42,0.45)] sm:p-5">
                <div className="flex items-center gap-1 text-amber-600" aria-label="Five star testimonial">{Array.from({ length: 5 }).map((_, index) => <span key={index} className="text-sm">★</span>)}</div>
                <blockquote className="mt-3 flex-1 text-sm font-medium leading-6 text-slate-700">“{testimonial.quote}”</blockquote>
                <figcaption className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3"><div><p className="text-sm font-extrabold text-slate-950">{testimonial.name}</p><p className="mt-0.5 text-xs text-slate-500">{testimonial.role}</p></div><div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"><Image src={testimonial.image} alt={testimonial.name} fill sizes="48px" className="object-cover" /></div></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#071824] py-9 text-white sm:py-11" data-home-reveal data-analytics-section="bottom_cta" data-analytics-label="Bottom CTA">
        <div className="home-noise pointer-events-none absolute inset-0 opacity-[0.1]" />
        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Your next best step</p>
          <h2 className={`${headingFont.className} mx-auto mt-2 text-3xl font-extrabold leading-[1.04] tracking-[-0.04em] sm:text-4xl lg:whitespace-nowrap lg:text-[2.3rem]`}>Make your loan request clear before you send it.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Start with the numbers for free. When the deal makes sense, build the package or bring us in to help move it toward lenders.</p>
          <div className="mx-auto mt-5 grid max-w-2xl gap-2 sm:grid-cols-2">
            <Link href="/comprehensive-cash-flow-analysis?new=1" onClick={() => trackHomeCta('bottom_cta', 'home_bottom_analysis', 'Run Free Bank-Level Analysis', '/comprehensive-cash-flow-analysis?new=1')} className="group flex min-h-14 items-center justify-between rounded-xl bg-[#f5c86a] px-4 py-3 text-left font-extrabold text-[#071824] transition hover:bg-[#ffda88]"><span><span className="block text-[11px] uppercase tracking-[0.13em] opacity-70">Free account</span>Run Bank-Level Analysis</span><ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link>
            <LoanServiceReadinessModal className="group flex min-h-14 w-full items-center justify-between rounded-xl border border-white/20 bg-white/[0.06] px-4 py-3 text-left font-extrabold text-white transition hover:bg-white/[0.1]"><span><span className="block text-[11px] uppercase tracking-[0.13em] text-cyan-200">Packaging or brokering</span>Start My Loan Process</span><ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></LoanServiceReadinessModal>
          </div>
        </div>
      </section>
    </div>
  );
}
