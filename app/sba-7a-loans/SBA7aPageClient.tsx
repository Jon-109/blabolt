'use client';

import Link from 'next/link';
import { Sora } from 'next/font/google';
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Handshake,
  Landmark,
  LineChart,
  LockKeyhole,
  Minus,
  Percent,
  Scale,
  ShieldCheck,
  Store,
  Wallet,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import GuidedTemplateDemo from '@/app/(components)/GuidedTemplateDemo';
import LoanPackagingDemo from '@/app/(components)/LoanPackagingDemo';
import LoanServiceReadinessModal from '@/app/(components)/LoanServiceReadinessModal';
import TemplateLinkGrid from '@/app/(components)/TemplateLinkGrid';

const headingFont = Sora({ subsets: ['latin'], weight: ['600', '700', '800'], display: 'swap' });

const uses: Array<{ title: string; text: string; icon: LucideIcon }> = [
  { title: 'Working capital', text: 'Support payroll, inventory, operating expenses, or seasonal needs.', icon: Wallet },
  { title: 'Equipment', text: 'Purchase and install machinery, vehicles, technology, or other business equipment.', icon: Wrench },
  { title: 'Commercial real estate', text: 'Acquire, refinance, improve, or build owner-occupied business property.', icon: Building2 },
  { title: 'Business acquisition', text: 'Finance a complete or partial change of ownership and related project costs.', icon: Store },
  { title: 'Debt refinancing', text: 'Refinance eligible business debt when the new structure improves the business position.', icon: Percent },
  { title: 'Mixed-use requests', text: 'Combine multiple eligible purposes into one properly documented loan request.', icon: CircleDollarSign },
];

const benefits = [
  ['Longer repayment terms', 'Up to 10 years for many business purposes and up to 25 years for qualifying real estate can reduce the monthly payment compared with shorter-term financing.'],
  ['Lender risk sharing', 'The SBA guarantee covers part of the lender’s loss—not the borrower’s obligation—which can give participating lenders more flexibility on an otherwise sound request.'],
  ['Broad use of proceeds', 'One program can support working capital, equipment, real estate, refinancing, ownership changes, or a combination of eligible purposes.'],
  ['Negotiated, capped rates', 'Rates are negotiated with the lender and may be fixed or variable, but SBA rules establish maximums.'],
  ['Equity flexibility', 'There is no universal 10% down rule for every 7(a) request. The required injection depends on the transaction and lender policy.'],
  ['Up to $5 million', 'Most standard 7(a) loans can reach $5 million, while certain delivery methods such as SBA Express have lower limits.'],
];

const tradeoffs = [
  ['More documentation', 'Expect business and personal financials, tax returns, debt details, ownership information, and a precise use-of-funds explanation.'],
  ['Longer, variable process', 'Timing depends on the lender, loan size, complexity, and whether SBA review is required. A complete package helps, but no universal closing timeline applies.'],
  ['Personal guarantees', 'Owners of 20% or more are generally required to provide an unlimited personal guaranty.'],
  ['Fees may apply', 'SBA guaranty fees and lender charges vary by loan size, maturity, program, and federal fiscal year. Request a written fee schedule.'],
  ['Collateral may be required', 'Requirements vary by loan size and lender policy. Insufficient collateral alone does not always end an otherwise supportable request.'],
  ['Approval is not guaranteed', 'The business must still be creditworthy and demonstrate reasonable repayment ability. The SBA guarantee is not a substitute for cash flow.'],
];

const processSteps = [
  ['Define the request', 'Clarify the amount, purpose, total project cost, equity contribution, and exactly how every dollar will be used.'],
  ['Test repayment capacity', 'Review historical and year-to-date cash flow, existing debt, and the proposed payment before approaching lenders.'],
  ['Build the borrower file', 'Prepare business financials, tax returns, ownership records, debt schedules, and supporting transaction documents.'],
  ['Prepare guarantor information', 'Owners commonly provide personal tax returns, a personal debt summary, and SBA Form 413 or equivalent financial information.'],
  ['Choose a participating lender', 'You apply through an SBA-approved lender—not directly to SBA. Lender fit matters because credit standards and preferred industries differ.'],
  ['Underwriting, approval, and closing', 'The lender verifies eligibility, repayment, management, collateral, and documentation before approval and disbursement.'],
];

const eligibilityItems = [
  'The business is operating and for profit.',
  'The business is located in the United States.',
  'The business meets SBA size standards for its industry.',
  'The business is not an ineligible business type.',
  'The desired credit is not available on reasonable terms elsewhere.',
  'The owners and business can demonstrate creditworthiness and repayment ability.',
];

const faqs = [
  ['Does the SBA lend the money directly?', 'No. You apply directly through a participating bank, credit union, or other SBA-approved lender. SBA provides a guaranty to the lender.'],
  ['Does the guarantee protect me if the business cannot pay?', 'No. The guaranty protects the lender for an eligible portion of its loss. The business and guarantors remain responsible for the debt.'],
  ['Is 10% down always required?', 'No. There is no universal 10% equity requirement for every 7(a) loan. Complete changes of ownership commonly require at least a 10% injection, while other requests depend on SBA rules and lender policy.'],
  ['What interest rate will I receive?', 'Your lender negotiates the rate within SBA maximums. The exact rate depends on loan size, term, fixed or variable structure, the permitted base rate, and lender assessment.'],
  ['Do I need collateral?', 'Possibly. Requirements depend on the amount and lender policy. For many loans, SBA rules tell lenders how to apply their standard collateral practices. Cash flow and repayment ability remain central.'],
  ['What is SBA Form 413?', 'SBA Form 413 is a personal financial statement used to evaluate the financial condition of owners or guarantors. It summarizes personal assets, liabilities, income, and net worth.'],
  ['How long does an SBA 7(a) loan take?', 'There is no single timeline. A smaller delegated loan may move faster than a complex acquisition or real-estate request. Lender responsiveness and a complete package are major variables.'],
];

function SectionHeading({ eyebrow, title, description, light = false }: { eyebrow: string; title: string; description: string; light?: boolean }) {
  return <div className="w-full"><p className={`text-xs font-black uppercase tracking-[0.2em] ${light ? 'text-amber-300' : 'text-cyan-800'}`}>{eyebrow}</p><h2 className={`${headingFont.className} mt-2 text-3xl font-extrabold leading-[1.05] tracking-[-0.04em] text-balance sm:text-4xl ${light ? 'text-white' : 'text-slate-950'}`}>{title}</h2><p className={`mt-3 w-full text-sm leading-6 sm:text-base ${light ? 'text-slate-300' : 'text-slate-600'}`}>{description}</p></div>;
}

export default function SBA7aPageClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [eligibilityOpen, setEligibilityOpen] = useState(false);
  const [checkedEligibility, setCheckedEligibility] = useState<boolean[]>(Array(eligibilityItems.length).fill(false));
  const eligibilityCount = checkedEligibility.filter(Boolean).length;
  const eligibilityMessage = useMemo(() => {
    if (eligibilityCount === eligibilityItems.length) return 'Your answers align with the core federal eligibility factors. A lender must still evaluate credit, repayment, structure, and documentation.';
    if (eligibilityCount >= 4) return 'Several fundamentals appear aligned, but the unchecked items need clarification before choosing an SBA lender.';
    return 'This does not mean you are ineligible. Review the unchecked items with an SBA lender or advisor before relying on the program.';
  }, [eligibilityCount]);

  return (
    <div className="overflow-hidden bg-[#f7f8f6] text-slate-950">
      <section className="home-dossier-bg relative overflow-hidden bg-[#071824] text-white">
        <div className="home-noise pointer-events-none absolute inset-0 opacity-[0.12]" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 border-x-2 border-amber-300 px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-100 sm:text-xs"><Landmark className="h-4 w-4" />SBA 7(a) borrower guide</div>
            <h1 className={`${headingFont.className} mx-auto mt-4 max-w-[22ch] text-[2.35rem] font-extrabold leading-[0.98] tracking-[-0.045em] sm:text-5xl lg:text-[3.45rem]`}>Understand the loan before you build the application.</h1>
            <p className="mx-auto mt-4 max-w-3xl text-[15px] leading-6 text-slate-300 sm:text-lg sm:leading-7">Learn how the SBA guarantee changes lender risk, where 7(a) financing can help, what it costs in time and documentation, and how to prepare a stronger borrower file.</p>
            <div className="mx-auto mt-6 grid max-w-2xl gap-2.5 sm:grid-cols-2"><LoanServiceReadinessModal className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f5c86a] px-5 py-3 text-sm font-extrabold text-[#071824] transition hover:bg-[#ffda88]">Begin SBA Loan Process <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></LoanServiceReadinessModal><Link href="/#loan-readiness-check" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.1]">Run Free DSCR Check <LineChart className="h-4 w-4" /></Link></div>
          </div>
          <div className="mx-auto mt-7 grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
            {[["Up to $5M", "Most standard 7(a) loans"], ["Up to 10 years", "Many business purposes"], ["Up to 25 years", "Qualifying real estate"], ["Lender-issued", "SBA partially guarantees"]].map(([value, label]) => <div key={value} className="bg-[#0a2231] p-3 text-center sm:p-4"><p className="text-lg font-black text-white sm:text-xl">{value}</p><p className="mt-1 text-[11px] font-semibold leading-4 text-slate-400 sm:text-xs">{label}</p></div>)}
          </div>
          <div className="mx-auto mt-3 flex max-w-5xl flex-col items-center justify-between gap-2 text-center text-[11px] text-slate-400 sm:flex-row sm:text-left"><span>Independent borrower education • Business Lending Advocate is not affiliated with or endorsed by the SBA.</span><a href="https://www.sba.gov/funding-programs/loans/7a-loans" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-bold text-cyan-200 hover:text-white"><ShieldCheck className="h-3.5 w-3.5" />Verified against SBA.gov <ArrowRight className="h-3 w-3" /></a></div>
        </div>
      </section>

      <section className="bg-white py-9 sm:py-11">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="The core idea" title="A bank makes the loan. SBA shares part of the lender’s risk." description="The 7(a) program is SBA’s primary business-loan program. You work directly with a participating lender; SBA does not hand the borrower a check." />
          <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
            {[
              ['1', 'You apply to a lender', 'The lender evaluates the request, credit, cash flow, owners, and documents.', Building2],
              ['2', 'SBA provides a guaranty', 'If program rules are met, SBA guarantees an eligible portion of the lender’s exposure.', ShieldCheck],
              ['3', 'You owe the full loan', 'The guarantee protects the lender—not the borrower. Repayment and guarantees still apply.', Handshake],
            ].map(([number, title, text, icon], index) => {
              const Icon = icon as LucideIcon;
              return <div key={number as string} className="contents"><article className="rounded-2xl border border-slate-200 bg-[#f8faf9] p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b3345] text-white"><Icon className="h-4 w-4" /></span><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-800">Step {number as string}</p><h3 className="mt-0.5 text-base font-extrabold text-slate-950">{title as string}</h3></div></div><p className="mt-2 text-sm leading-6 text-slate-600">{text as string}</p></article>{index < 2 ? <ArrowRight className="mx-auto hidden h-5 w-5 text-slate-300 lg:block" /> : null}</div>;
            })}
          </div>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"><strong>Why this can help:</strong> reducing lender loss exposure can support longer terms or credit flexibility for a sound business that cannot obtain the requested credit on reasonable conventional terms. It does not turn a weak repayment case into an approvable loan.</div>
        </div>
      </section>

      <section className="bg-[#f3f1ea] py-9 sm:py-11">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Eligible uses" title="One program, several ways to finance a business." description="The approved use of proceeds controls the structure, term, equity requirement, collateral analysis, and documents a lender may request." />
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{uses.map((item) => { const Icon = item.icon; return <article key={item.title} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800"><Icon className="h-4 w-4" /></span><div><h3 className="text-sm font-extrabold text-slate-950">{item.title}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{item.text}</p></div></article>; })}</div>
        </div>
      </section>

      <section className="bg-white py-9 sm:py-11">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="The honest comparison" title="Why borrowers choose 7(a)—and what they accept in return." description="The program can improve structure and access, but the trade is a more documented, rules-driven underwriting process." />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/45"><div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-4 py-3"><CheckCircle2 className="h-5 w-5 text-emerald-700" /><h3 className="font-extrabold text-emerald-950">Potential advantages</h3></div><div className="grid gap-px bg-emerald-100 sm:grid-cols-2">{benefits.map(([title, text]) => <div key={title} className="bg-white p-4"><p className="text-sm font-extrabold text-slate-950">{title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{text}</p></div>)}</div></div>
            <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/45"><div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-3"><Scale className="h-5 w-5 text-amber-800" /><h3 className="font-extrabold text-amber-950">Practical tradeoffs</h3></div><div className="grid gap-px bg-amber-100 sm:grid-cols-2">{tradeoffs.map(([title, text]) => <div key={title} className="bg-white p-4"><p className="text-sm font-extrabold text-slate-950">{title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{text}</p></div>)}</div></div>
          </div>
        </div>
      </section>

      <section className="home-ink-panel relative overflow-hidden bg-[#081b28] py-9 text-white sm:py-11">
        <div className="home-noise pointer-events-none absolute inset-0 opacity-[0.08]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading light eyebrow="Structure and cost" title="The headline terms need context." description="Your actual loan depends on purpose, useful life, amount, lender policy, fixed or variable structure, and current SBA rules." />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Maximum amount', '$5 million', 'Most standard 7(a) loans; specialized delivery methods may have lower caps.', BadgeDollarSign],
              ['Maturity', '10 or 25 years', 'Generally up to 10 years for many purposes and up to 25 years for qualifying real estate.', Clock3],
              ['Interest rate', 'Negotiated + capped', 'Fixed or variable rates are negotiated with the lender within SBA maximums.', Percent],
              ['Equity injection', 'Transaction-specific', 'No universal 10% rule; ownership changes and lender policies can require an injection.', Banknote],
            ].map(([label, value, text, icon]) => { const Icon = icon as LucideIcon; return <article key={label as string} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"><Icon className="h-4 w-4 text-cyan-200" /></span><p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-300">{label as string}</p></div><p className="mt-3 text-xl font-black text-white">{value as string}</p><p className="mt-2 text-xs leading-5 text-slate-300">{text as string}</p></article>; })}
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><p className="flex items-center gap-2 text-sm font-extrabold"><LockKeyhole className="h-4 w-4 text-amber-300" />Collateral</p><p className="mt-2 text-xs leading-5 text-slate-300">Requirements vary by loan size and lender policy. The assets financed and available business assets may be pledged. Collateral does not replace repayment ability.</p></div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><p className="flex items-center gap-2 text-sm font-extrabold"><Handshake className="h-4 w-4 text-amber-300" />Personal guarantees</p><p className="mt-2 text-xs leading-5 text-slate-300">Individuals owning 20% or more are generally required to provide an unlimited personal guaranty. Other owners may also be asked to guarantee.</p></div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><p className="flex items-center gap-2 text-sm font-extrabold"><CircleDollarSign className="h-4 w-4 text-amber-300" />Fees</p><p className="mt-2 text-xs leading-5 text-slate-300">SBA guaranty fees can change by federal fiscal year and transaction. Lenders may charge permitted fees. Ask for the full fee schedule before proceeding.</p></div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f8f6] py-9 sm:py-11">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="From idea to closing" title="What the SBA 7(a) process actually looks like." description="The best preparation happens before the lender application: define the request, prove repayment, and make the file easy to underwrite." />
          <div className="mt-5 grid gap-2 md:grid-cols-2 lg:grid-cols-3">{processSteps.map(([title, text], index) => <article key={title} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0b3345] text-xs font-black text-white">{String(index + 1).padStart(2, '0')}</span><h3 className="text-sm font-extrabold text-slate-950">{title}</h3></div><p className="mt-2 text-xs leading-5 text-slate-600">{text}</p></article>)}</div>
        </div>
      </section>

      <section className="home-ink-panel relative overflow-hidden bg-[#081b28] py-9 text-white sm:py-11">
        <div className="home-noise pointer-events-none absolute inset-0 opacity-[0.08]" />
        <div className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <SectionHeading light eyebrow="Simplify the document burden" title="See the SBA document workflow in one workspace." description="SBA requests can involve business financials, personal financial information, debt schedules, tax returns, transaction documents, and a clear repayment story. This sample shows how the dashboard keeps that work in one guided sequence." />
          <div className="mt-5"><LoanPackagingDemo compact /></div>
        </div>
      </section>

      <section className="bg-white py-9 sm:py-11">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="The borrower and guarantor file" title="Build the borrower and guarantor file in one guided flow." description="Requirements vary by lender and transaction, but these common foundations explain business performance, existing obligations, guarantor strength, and the requested use of funds." />
          <div className="mt-5"><GuidedTemplateDemo compact /></div>
          <div className="mt-4"><TemplateLinkGrid /></div>
        </div>
      </section>

      <section id="eligibility" className="scroll-mt-20 bg-[#f3f1ea] py-9 sm:py-11">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <button type="button" onClick={() => setEligibilityOpen((current) => !current)} aria-expanded={eligibilityOpen} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm sm:p-5"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">SBA 7(a) eligibility check</p><h2 className={`${headingFont.className} mt-1 text-2xl font-extrabold tracking-[-0.035em] text-slate-950 sm:text-3xl`}>Could your business be eligible for an SBA 7(a) loan?</h2><p className="mt-1 text-sm text-slate-600">Answer six quick questions to identify whether the basic program requirements appear to fit. This is educational—not a lender decision or approval.</p></div><ChevronDown className={`h-5 w-5 shrink-0 text-slate-500 transition ${eligibilityOpen ? 'rotate-180' : ''}`} /></button>
          {eligibilityOpen ? <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="grid gap-2 sm:grid-cols-2">{eligibilityItems.map((item, index) => <button key={item} type="button" onClick={() => setCheckedEligibility((current) => current.map((checked, itemIndex) => itemIndex === index ? !checked : checked))} aria-pressed={checkedEligibility[index]} className={`flex items-start gap-3 rounded-xl border p-3 text-left text-xs font-semibold leading-5 transition ${checkedEligibility[index] ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-slate-200 bg-slate-50 text-slate-700'}`}><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checkedEligibility[index] ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'}`}>{checkedEligibility[index] ? <Check className="h-3 w-3" /> : null}</span>{item}</button>)}</div><div className={`mt-4 rounded-xl border p-3 text-sm leading-6 ${eligibilityCount === eligibilityItems.length ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-amber-200 bg-amber-50 text-amber-950'}`}><strong>{eligibilityCount} of {eligibilityItems.length} fundamentals selected.</strong> {eligibilityMessage}</div></div> : null}
        </div>
      </section>

      <section className="bg-white py-9 sm:py-11">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <SectionHeading eyebrow="Common questions" title="Important details borrowers often misunderstand." description="Use these answers as preparation for a lender conversation, not as a substitute for current SBA policy or lender underwriting." />
          <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">{faqs.map(([question, answer], index) => <div key={question}><button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index} className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-extrabold text-slate-950"><span>{question}</span><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100">{openFaq === index ? <Minus className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</span></button>{openFaq === index ? <p className="max-w-3xl pb-4 text-sm leading-6 text-slate-600">{answer}</p> : null}</div>)}</div>
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-blue-800" /><p className="text-xs leading-5 text-blue-950"><strong>Keep the numbers current.</strong> SBA rates, fees, and program rules can change. Confirm the latest terms with a participating lender and the official <a href="https://www.sba.gov/funding-programs/loans/7a-loans" target="_blank" rel="noreferrer" className="font-bold underline">SBA 7(a) program page</a> before applying.</p></div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#071824] py-9 text-white sm:py-11">
        <div className="home-noise pointer-events-none absolute inset-0 opacity-[0.1]" />
        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6"><p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Prepare before you apply</p><h2 className={`${headingFont.className} mx-auto mt-2 max-w-[22ch] text-3xl font-extrabold leading-[1.04] tracking-[-0.04em] sm:text-4xl`}>A stronger SBA request starts with repayment and documentation.</h2><p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Check the proposed payment for free, then use the readiness screen to decide whether self-directed packaging or no-upfront brokering is the better next step.</p><div className="mx-auto mt-5 grid max-w-2xl gap-2 sm:grid-cols-2"><Link href="/#loan-readiness-check" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f5c86a] px-4 py-3 text-sm font-extrabold text-[#071824]">Run Free DSCR Check <LineChart className="h-4 w-4" /></Link><LoanServiceReadinessModal className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white hover:bg-white/[0.1]">Begin Loan Process <ArrowRight className="h-4 w-4" /></LoanServiceReadinessModal></div></div>
      </section>
    </div>
  );
}
