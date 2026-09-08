'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  CreditCard,
  Handshake,
  Info,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/(components)/ui/dialog';
import AuthAwareCheckoutButton from '@/app/services/components/AuthAwareCheckoutButton';
import AuthAwareRouteButton from '@/app/services/components/AuthAwareRouteButton';

type CashFlowAnswer = 'strong' | 'borderline' | 'unsupported' | 'unknown' | '';
type CreditAnswer = 'strong' | 'workable' | 'challenged' | 'unknown' | '';
type ReadinessLevel = 'ready' | 'review' | 'pause';

type Props = {
  children: ReactNode;
  className?: string;
  initialIntent?: 'packaging' | 'brokering';
};

const cashFlowOptions: Array<{ value: CashFlowAnswer; title: string; detail: string }> = [
  { value: 'strong', title: 'DSCR is 1.25 or higher', detail: 'The requested payment appears to have a common lender-level cash-flow cushion.' },
  { value: 'borderline', title: 'DSCR is 1.00–1.24', detail: 'The payment may be covered, but the cushion is thinner than many lenders prefer.' },
  { value: 'unsupported', title: 'DSCR is below 1.00', detail: 'The cash flow entered does not currently cover the full debt load.' },
  { value: 'unknown', title: 'I have not checked yet', detail: 'Use the free 60-second check before paying for packaging.' },
];

const creditOptions: Array<{ value: CreditAnswer; title: string; detail: string }> = [
  { value: 'strong', title: 'Generally 680 or higher', detail: 'Often a stronger starting range, although every lender reviews the full credit history.' },
  { value: 'workable', title: 'Generally 640–679', detail: 'Can be workable with strong cash flow and a clean overall request; lender standards vary.' },
  { value: 'challenged', title: 'Below 640 or recent major issues', detail: 'A lender conversation should happen before paying for packaging.' },
  { value: 'unknown', title: 'I am not sure', detail: 'Review your personal credit and any late payments, collections, judgments, or recent bankruptcies first.' },
];

export default function LoanServiceReadinessModal({ children, className = '', initialIntent = 'packaging' }: Props) {
  const [open, setOpen] = useState(false);
  const [cashFlow, setCashFlow] = useState<CashFlowAnswer>('');
  const [credit, setCredit] = useState<CreditAnswer>('');

  const readiness = useMemo<ReadinessLevel>(() => {
    if (cashFlow === 'unsupported' || credit === 'challenged') return 'pause';
    if (cashFlow === 'strong' && (credit === 'strong' || credit === 'workable')) return 'ready';
    return 'review';
  }, [cashFlow, credit]);

  const answered = Boolean(cashFlow && credit);
  const packagingAllowed = answered && readiness === 'ready';

  const reset = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setCashFlow('');
      setCredit('');
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>{children}</button>
      <Dialog open={open} onOpenChange={reset}>
        <DialogContent className="max-h-[92vh] w-[calc(100%_-_1rem)] max-w-4xl gap-0 overflow-y-auto rounded-2xl border-0 bg-[#f7f8f6] p-0 shadow-2xl [&>button]:text-white [&>button]:opacity-90 sm:w-full sm:rounded-3xl">
          <DialogHeader className="relative overflow-hidden bg-[#071824] px-5 py-5 pr-12 text-left text-white sm:px-7 sm:py-6">
            <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_85%_10%,rgba(34,211,238,0.22),transparent_28%)]" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100"><ShieldCheck className="h-3.5 w-3.5" />One-minute readiness check</div>
              <DialogTitle className="mt-3 text-2xl font-black leading-tight tracking-[-0.035em] text-white sm:text-3xl">Before you pay, make sure packaging is the right next step.</DialogTitle>
              <DialogDescription className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">This is a practical screen—not an approval. It helps prevent you from buying the $499 dashboard when the payment or credit profile likely needs attention first.</DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-5 p-4 sm:p-6">
            <section>
              <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800"><BarChart3 className="h-4 w-4" /></span><div><p className="text-sm font-black text-slate-950">1. Does business cash flow support the proposed payment?</p><p className="text-xs text-slate-500">Use the result from the free DSCR check for the same requested amount and payment.</p></div></div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">{cashFlowOptions.map((option) => <button key={option.value} type="button" onClick={() => setCashFlow(option.value)} aria-pressed={cashFlow === option.value} className={`rounded-xl border p-3 text-left transition ${cashFlow === option.value ? 'border-cyan-700 bg-cyan-50 shadow-[0_0_0_1px_#0e7490]' : 'border-slate-200 bg-white hover:border-slate-300'}`}><span className="flex items-start gap-2"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${cashFlow === option.value ? 'border-cyan-700 bg-cyan-700 text-white' : 'border-slate-300'}`}>{cashFlow === option.value ? <Check className="h-3 w-3" /> : null}</span><span><span className="block text-xs font-extrabold text-slate-950">{option.title}</span><span className="mt-1 block text-[11px] leading-4 text-slate-600">{option.detail}</span></span></span></button>)}</div>
            </section>

            <section>
              <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-800"><CreditCard className="h-4 w-4" /></span><div><p className="text-sm font-black text-slate-950">2. Where is the primary owner’s personal credit generally?</p><p className="text-xs text-slate-500">There is no universal SBA or business-loan minimum. Individual lenders set their own standards.</p></div></div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">{creditOptions.map((option) => <button key={option.value} type="button" onClick={() => setCredit(option.value)} aria-pressed={credit === option.value} className={`rounded-xl border p-3 text-left transition ${credit === option.value ? 'border-amber-600 bg-amber-50 shadow-[0_0_0_1px_#d97706]' : 'border-slate-200 bg-white hover:border-slate-300'}`}><span className="flex items-start gap-2"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${credit === option.value ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'}`}>{credit === option.value ? <Check className="h-3 w-3" /> : null}</span><span><span className="block text-xs font-extrabold text-slate-950">{option.title}</span><span className="mt-1 block text-[11px] leading-4 text-slate-600">{option.detail}</span></span></span></button>)}</div>
            </section>

            {answered ? (
              <section className={`rounded-2xl border p-4 ${readiness === 'ready' ? 'border-emerald-300 bg-emerald-50' : readiness === 'pause' ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'}`} aria-live="polite">
                <div className="flex items-start gap-3">{readiness === 'ready' ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /> : readiness === 'pause' ? <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" /> : <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />}<div><h3 className="text-sm font-black text-slate-950">{readiness === 'ready' ? 'Packaging looks like a reasonable next step.' : readiness === 'pause' ? 'Pause before purchasing Loan Packaging.' : 'Validate the request before purchasing.'}</h3><p className="mt-1 text-xs leading-5 text-slate-700">{readiness === 'ready' ? 'Your self-reported DSCR and credit range clear this preliminary screen. Lenders will still review time in business, full credit history, liquidity, collateral, industry, and documentation.' : readiness === 'pause' ? 'The current answer suggests that structure or credit should be reviewed first. Use the free cash-flow tools or choose the no-upfront brokering path so the request can be discussed before a packaging purchase.' : 'One or both answers are uncertain or below the common packaging-ready starting point. Get the free DSCR result and review credit before paying for the dashboard.'}</p></div></div>
              </section>
            ) : null}

            <div className="grid gap-3 lg:grid-cols-2">
              <article className={`flex flex-col rounded-2xl border bg-white p-4 ${packagingAllowed ? 'border-cyan-300 shadow-sm' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-800">Manage lender outreach yourself</p><h3 className="mt-1 text-xl font-black text-slate-950">Loan Packaging</h3></div><div className="text-right"><p className="text-2xl font-black text-slate-950">$499</p><p className="text-[10px] text-slate-500">One-time</p></div></div>
                <p className="mt-2 flex-1 text-xs leading-5 text-slate-600">Dashboard, five guided templates, document workflow, lender cover-letter generator, ZIP package, and secure lender links.</p>
                {packagingAllowed ? <AuthAwareCheckoutButton productType="loan_packaging" className="mt-3 h-11 w-full rounded-xl bg-slate-900 text-xs font-extrabold text-white hover:bg-slate-700">Continue to Loan Packaging <ArrowRight className="ml-1 h-4 w-4" /></AuthAwareCheckoutButton> : <div className="mt-3 rounded-xl bg-slate-100 px-3 py-2.5 text-center text-[11px] font-bold text-slate-500">{answered ? 'Packaging purchase paused—use the guidance above first' : 'Complete the readiness check to unlock this path'}</div>}
              </article>

              <article className={`flex flex-col rounded-2xl border p-4 ${initialIntent === 'brokering' || !packagingAllowed ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">Add lender matching and follow-up</p><h3 className="mt-1 text-xl font-black text-slate-950">Loan Brokering</h3></div><div className="text-right"><p className="text-2xl font-black text-slate-950">1%</p><p className="max-w-[120px] text-[10px] leading-4 text-slate-500">Of funded amount, closing only</p></div></div>
                <p className="mt-2 flex-1 text-xs leading-5 text-slate-600">Includes the complete packaging system with no separate $499 upfront fee, plus lender matching, outreach, and deal support.</p>
                <AuthAwareRouteButton route="/loan-brokering/agreement" className="mt-3 h-11 w-full rounded-xl bg-emerald-700 text-xs font-extrabold text-white hover:bg-emerald-600">Explore No-Upfront Brokering <Handshake className="ml-1 h-4 w-4" /></AuthAwareRouteButton>
              </article>
            </div>

            {!packagingAllowed ? <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-3 sm:flex-row"><div><p className="text-xs font-extrabold text-cyan-950">Need the cash-flow answer first?</p><p className="mt-0.5 text-[11px] text-cyan-800">Run the free 60-second check, then return when you know the requested payment’s DSCR.</p></div><Link href="/#loan-readiness-check" onClick={() => setOpen(false)} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-cyan-900 px-3 py-2 text-xs font-bold text-white">Run Free DSCR Check <ArrowRight className="h-3.5 w-3.5" /></Link></div> : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
