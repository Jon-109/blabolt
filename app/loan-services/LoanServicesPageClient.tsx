'use client';

import Link from 'next/link';
import { Sora } from 'next/font/google';
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  FileCheck2,
  FileStack,
  FolderCheck,
  Handshake,
  LayoutDashboard,
  PenLine,
  Send,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import GuidedTemplateDemo from '@/app/(components)/GuidedTemplateDemo';
import LoanPackagingDemo from '@/app/(components)/LoanPackagingDemo';
import TemplateLinkGrid from '@/app/(components)/TemplateLinkGrid';
import LoanServiceReadinessModal from '@/app/(components)/LoanServiceReadinessModal';

const headingFont = Sora({ subsets: ['latin'], weight: ['600', '700', '800'], display: 'swap' });

const process = [
  ['Create the loan profile', 'Enter the business, request, amount, purpose, and use-of-funds breakdown once.'],
  ['Complete the checklist', 'Upload existing files and use guided templates where financial documents are missing.'],
  ['Generate the lender narrative', 'Answer guided questions about the business, use of funds, repayment, strengths, and weaknesses; the system converts them into an editable banker-facing cover letter.'],
  ['Export or add outreach', 'Download the organized package, share it securely, or add brokering and lender follow-up.'],
];

const faqs = [
  ['Is Loan Packaging just a checklist?', 'No. It is a working dashboard with a loan profile, purpose-specific requirements, guided financial templates, a cover-letter generator that builds the banker-facing deal narrative, package ZIP export, and secure lender links.'],
  ['What is included in the $499 packaging fee?', 'One-time access to the loan-packaging workflow for the request, including all five guided financial templates, document organization, cover-letter tools, and package delivery features.'],
  ['How is Loan Brokering different?', 'Brokering includes the packaging system and adds lender matching, outreach, follow-up, and deal support. There is no separate $499 upfront packaging charge on that path; the broker fee is 1% of the funded amount and is due only at closing.'],
  ['Does a complete package guarantee approval?', 'No. A strong package makes the request easier to evaluate, but every lender independently evaluates credit, repayment ability, collateral, eligibility, and fit.'],
];

function SectionHeading({ eyebrow, title, description, light = false, centered = false }: { eyebrow: string; title: string; description: string; light?: boolean; centered?: boolean }) {
  return <div className={`w-full ${centered ? 'text-center' : ''}`}><p className={`text-xs font-black uppercase tracking-[0.2em] ${light ? 'text-amber-300' : 'text-cyan-800'}`}>{eyebrow}</p><h2 className={`${headingFont.className} mt-2 text-3xl font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-4xl ${light ? 'text-white' : 'text-slate-950'}`}>{title}</h2><p className={`mt-3 w-full text-sm leading-6 sm:text-base ${light ? 'text-slate-300' : 'text-slate-600'}`}>{description}</p></div>;
}

export default function LoanServicesPageClient() {
  return (
    <div className="overflow-hidden bg-[#f7f8f6] text-slate-950">
      <section className="home-dossier-bg relative overflow-hidden bg-[#071824] text-white">
        <div className="home-noise pointer-events-none absolute inset-0 opacity-[0.12]" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="mx-auto max-w-6xl text-center">
            <div className="inline-flex items-center gap-2 border-x-2 border-amber-300 px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-100"><BriefcaseBusiness className="h-4 w-4" />Loan packaging and lender support</div>
            <h1 className={`${headingFont.className} mx-auto mt-4 max-w-[28ch] text-[2.35rem] font-extrabold leading-[0.98] tracking-[-0.045em] text-balance sm:text-5xl lg:text-[3.45rem]`}>Build the lender file before you ask a lender to believe the deal.</h1>
            <p className="mx-auto mt-4 max-w-5xl text-[15px] leading-6 text-slate-300 sm:text-lg sm:leading-7">Organize the request, complete the financial documents lenders expect, and turn your business details, use of funds, strengths, and repayment plan into a polished lender cover letter—then deliver one coherent package with optional lender matching and follow-up.</p>
            <div className="mx-auto mt-6 grid max-w-2xl gap-2.5 sm:grid-cols-2">
              <LoanServiceReadinessModal className="group inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#f5c86a] px-5 text-sm font-extrabold text-[#071824] hover:bg-[#ffda88]">Begin Loan Packaging <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></LoanServiceReadinessModal>
              <LoanServiceReadinessModal initialIntent="brokering" className="group inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/[0.06] px-5 text-sm font-bold text-white hover:bg-white/[0.1]">Explore Loan Brokering <Handshake className="h-4 w-4" /></LoanServiceReadinessModal>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-300 sm:text-sm"><span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-300" />Real dashboard access</span><span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-300" />All five templates included</span><span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-300" />Secure lender delivery</span></div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-slate-200 sm:grid-cols-4 sm:divide-y-0">
          {[["Profile once", LayoutDashboard], ["Documents guided", FileCheck2], ["Story organized", PenLine], ["Package delivered", Send]].map(([label, icon]) => { const Icon = icon as LucideIcon; return <div key={label as string} className="flex min-h-16 items-center justify-center gap-2 px-3 text-center text-xs font-extrabold text-slate-700"><Icon className="h-4 w-4 text-cyan-800" />{label as string}</div>; })}
        </div>
      </section>

      <section className="bg-[#f7f8f6] py-9 sm:py-11">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Why packaging matters" title="Lenders cannot approve what they cannot understand." description="Many requests lose momentum because numbers conflict, required files are missing, or the use of funds and repayment story are unclear. Packaging fixes the presentation before lender review begins." />
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[["Scattered information", "Tax returns, statements, debts, and request details live in different folders and emails.", FileStack], ["Missing financial formats", "The owner has the numbers but not the lender-ready balance sheet, income statement, or debt schedules.", FileCheck2], ["No coherent loan strategy", "A guided cover-letter generator turns the amount, use of funds, repayment source, business strengths, and potential weaknesses into one banker-friendly narrative.", BriefcaseBusiness]].map(([title, text, icon]) => { const Icon = icon as LucideIcon; return <article key={title as string} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800"><Icon className="h-4 w-4" /></span><h3 className="text-base font-extrabold text-slate-950">{title as string}</h3></div><p className="mt-2 text-sm leading-6 text-slate-600">{text as string}</p></article>; })}
          </div>
        </div>
      </section>

      <section className="home-ink-panel relative overflow-hidden bg-[#081b28] py-9 text-white sm:py-11">
        <div className="home-noise pointer-events-none absolute inset-0 opacity-[0.08]" />
        <div className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <SectionHeading light eyebrow="Interactive product tour" title="Explore the same four-part workflow used in the real dashboard." description="Edit the profile, complete sample documents, and see how a guided intake becomes an optimized lender cover letter that explains the deal before package delivery." />
          <div className="mt-5"><LoanPackagingDemo compact /></div>
        </div>
      </section>

      <section className="bg-[#f3f1ea] py-9 sm:py-11">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Built-in financial documents" title="Create the financial documents lenders expect." description="The five guided templates form the financial foundation of many business loan applications. Answer plain-English questions, verify the totals, and generate a consistent lender-ready PDF." />
          <div className="mt-5"><GuidedTemplateDemo compact /></div>
          <div className="mt-4"><TemplateLinkGrid /></div>
        </div>
      </section>

      <section className="bg-white py-9 sm:py-11">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="One workflow" title="The package develops in a deliberate order." description="Each stage reuses the information already entered, reducing duplicate work and keeping the request consistent." />
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{process.map(([title, text], index) => <article key={title} className="rounded-xl border border-slate-200 bg-[#f8faf9] p-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b3345] text-xs font-black text-white">{index + 1}</span><h3 className="text-sm font-extrabold text-slate-950">{title}</h3></div><p className="mt-2 text-xs leading-5 text-slate-600">{text}</p></article>)}</div>
        </div>
      </section>

      <section className="bg-[#f7f8f6] py-9 sm:py-11">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading centered eyebrow="Choose your support level" title="Use the dashboard yourself—or add lender outreach." description="Both paths begin with the same organized package. The difference is whether you want to take that file forward yourself or have us help manage lender conversations." />
          <div className="mx-auto mt-6 grid max-w-5xl gap-4 lg:grid-cols-2">
            <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-800">Done with you</p><h3 className="mt-2 text-2xl font-black text-slate-950">Loan Packaging</h3></div><div className="text-right"><p className="text-3xl font-black text-slate-950">$499</p><p className="text-xs text-slate-500">One-time fee</p></div></div><p className="mt-3 text-sm leading-6 text-slate-600">For owners who want the complete software workflow and plan to handle lender outreach themselves.</p><ul className="mt-4 flex-1 space-y-2">{['Full loan-packaging dashboard', 'All five guided templates', 'Purpose-specific document checklist', 'Guided lender cover-letter generator', 'Package ZIP and secure lender links'].map((item) => <li key={item} className="flex items-start gap-2 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>)}</ul><LoanServiceReadinessModal className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-extrabold text-white hover:bg-slate-700">Begin Loan Packaging <ArrowRight className="h-4 w-4" /></LoanServiceReadinessModal></article>
            <article className="relative flex flex-col overflow-hidden rounded-2xl border border-emerald-300 bg-emerald-50/60 p-5 shadow-sm sm:p-6"><div className="absolute right-0 top-0 rounded-bl-xl bg-emerald-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white">No upfront packaging fee</div><div className="flex items-start justify-between gap-3 pt-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">Done with you + us</p><h3 className="mt-2 text-2xl font-black text-slate-950">Loan Brokering</h3></div><div className="text-right"><p className="text-3xl font-black text-slate-950">1%</p><p className="max-w-[130px] text-xs leading-4 text-slate-500">Of funded amount, at closing only</p></div></div><p className="mt-3 text-sm leading-6 text-slate-600">For owners who want the full package plus lender matching, outreach, and support through the deal process.</p><ul className="mt-4 flex-1 space-y-2">{['Everything included in Loan Packaging', 'No separate $499 upfront charge', 'Lender matching for the request', 'Outreach and underwriting follow-up', 'Fee due only if the loan closes'].map((item) => <li key={item} className="flex items-start gap-2 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>)}</ul><LoanServiceReadinessModal initialIntent="brokering" className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 text-sm font-extrabold text-white hover:bg-emerald-600">Begin Loan Brokering <Handshake className="h-4 w-4" /></LoanServiceReadinessModal></article>
          </div>
        </div>
      </section>

      <section className="bg-white py-9 sm:py-11">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <SectionHeading eyebrow="Questions before you begin" title="Know exactly what the service does." description="Clear expectations make it easier to choose the support path that fits your request." />
          <div className="mt-5 grid gap-2 sm:grid-cols-2">{faqs.map(([question, answer]) => <article key={question} className="rounded-xl border border-slate-200 bg-[#f8faf9] p-4"><h3 className="text-sm font-extrabold text-slate-950">{question}</h3><p className="mt-2 text-xs leading-5 text-slate-600">{answer}</p></article>)}</div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#071824] py-9 text-white sm:py-11">
        <div className="home-noise pointer-events-none absolute inset-0 opacity-[0.1]" />
        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6"><p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Start with a cleaner file</p><h2 className={`${headingFont.className} mx-auto mt-2 max-w-[24ch] text-3xl font-extrabold leading-[1.04] tracking-[-0.04em] text-balance sm:text-4xl`}>Give lenders one organized request instead of a trail of attachments.</h2><p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">Choose the dashboard if you want to manage outreach yourself, or choose brokering if you want lender matching and follow-up added to the same package.</p><div className="mx-auto mt-5 grid max-w-2xl gap-2 sm:grid-cols-2"><LoanServiceReadinessModal className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f5c86a] px-4 text-sm font-extrabold text-[#071824] hover:bg-[#ffda88]">Start Packaging <FolderCheck className="h-4 w-4" /></LoanServiceReadinessModal><Link href="/loan-packaging-demo" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-4 text-sm font-bold text-white hover:bg-white/[0.1]">Explore Interactive Demo <ArrowRight className="h-4 w-4" /></Link></div></div>
      </section>
    </div>
  );
}
