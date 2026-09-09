'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart3, CreditCard, Handshake, ShieldCheck } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/(components)/ui/dialog';
import AuthAwareCheckoutButton from '@/app/services/components/AuthAwareCheckoutButton';
import AuthAwareRouteButton from '@/app/services/components/AuthAwareRouteButton';

type Props = {
  children: ReactNode;
  className?: string;
  initialIntent?: 'packaging' | 'brokering';
};

export default function LoanServiceReadinessModal({ children, className = '', initialIntent = 'packaging' }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>{children}</button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100dvh_-_0.75rem)] w-[calc(100%_-_0.75rem)] max-w-4xl gap-0 overflow-y-auto rounded-2xl border-0 bg-[#f7f8f6] p-0 shadow-2xl [&>button]:right-3 [&>button]:top-3 [&>button]:text-white [&>button]:opacity-90 sm:max-h-[calc(100dvh_-_2rem)] sm:w-[calc(100%_-_2rem)] sm:rounded-3xl sm:[&>button]:right-4 sm:[&>button]:top-4">
          <DialogHeader className="relative items-center overflow-hidden bg-[#071824] px-10 py-5 text-center text-white sm:px-14 sm:py-7">
            <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_85%_10%,rgba(34,211,238,0.22),transparent_28%)]" />
            <div className="relative flex flex-col items-center">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100"><ShieldCheck className="h-3.5 w-3.5" />Quick lender readiness guide</div>
              <DialogTitle className="mt-3 text-2xl font-black leading-tight tracking-[-0.035em] text-white sm:text-3xl">Know the two numbers lenders care about most.</DialogTitle>
              <DialogDescription className="mx-auto mt-2 max-w-3xl text-xs leading-5 text-slate-300 sm:text-sm sm:leading-6">Strong cash flow and workable personal credit are two of the clearest signs that you may be ready to move forward with loan packaging.</DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <section className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800"><BarChart3 className="h-4 w-4" /></span>
                  <div className="min-w-0">
                    <p className="text-sm font-black leading-5 text-slate-950">1. Banks typically want to see a DSCR of 1.25 or higher</p>
                    <p className="mt-1.5 text-xs leading-5 text-slate-600">This common lender benchmark means the business has about $1.25 in cash flow for every $1.00 of debt payments. Below 1.00 means cash flow is not covering the full debt load.</p>
                    <Link href="/#loan-readiness-check" onClick={() => setOpen(false)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-extrabold text-cyan-900 hover:text-cyan-700">Run Free DSCR Check <ArrowRight className="h-3.5 w-3.5" /></Link>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800"><CreditCard className="h-4 w-4" /></span>
                  <div>
                    <p className="text-sm font-black leading-5 text-slate-950">2. Ideally, personal credit should be 680 or higher</p>
                    <p className="mt-1.5 text-xs leading-5 text-slate-600">Consider 640 a practical minimum starting point. A 640–679 score may still qualify when supported by strong cash flow, time in business, collateral, or other strengths. Below 640 will make lender approval more difficult.</p>
                  </div>
                </div>
              </section>
            </div>

            <div>
              <p className="mb-3 text-center text-[11px] font-black uppercase tracking-[0.13em] text-slate-500">Choose how you want to move forward</p>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <article className={`flex flex-col rounded-2xl border bg-white p-4 sm:p-5 ${initialIntent === 'packaging' ? 'border-cyan-300 shadow-sm' : 'border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-800">Manage outreach yourself</p><h3 className="mt-1 text-xl font-black leading-tight text-slate-950">Loan Packaging</h3></div>
                    <div className="shrink-0 text-right"><p className="text-2xl font-black leading-none text-slate-950">$499</p><p className="mt-1 text-[10px] text-slate-500">One-time</p></div>
                  </div>
                  <p className="mt-2 flex-1 text-xs leading-5 text-slate-600">Get the complete dashboard, guided templates, document workflow, and lender-ready package.</p>
                  <AuthAwareCheckoutButton productType="loan_packaging" className="mt-3 h-10 w-full rounded-xl bg-slate-900 px-3 text-xs font-extrabold text-white hover:bg-slate-700">Continue to Packaging <ArrowRight className="ml-1 h-3.5 w-3.5" /></AuthAwareCheckoutButton>
                </article>

                <article className={`flex flex-col rounded-2xl border p-4 sm:p-5 ${initialIntent === 'brokering' ? 'border-emerald-400 bg-emerald-50/70 shadow-sm' : 'border-emerald-200 bg-emerald-50/50'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">Add matching and follow-up</p><h3 className="mt-1 text-xl font-black leading-tight text-slate-950">Loan Brokering</h3></div>
                    <div className="shrink-0 text-right"><p className="text-2xl font-black leading-none text-slate-950">1%</p><p className="mt-1 text-[10px] text-slate-500">If funded</p></div>
                  </div>
                  <p className="mt-2 flex-1 text-xs leading-5 text-slate-600">Get the complete package while we manage lender matching, outreach, and follow-up with no $499 upfront fee.</p>
                  <AuthAwareRouteButton route="/loan-brokering/agreement" className="mt-3 h-10 w-full rounded-xl bg-emerald-700 px-3 text-xs font-extrabold text-white hover:bg-emerald-600">Begin Loan Brokering <Handshake className="ml-1 h-3.5 w-3.5" /></AuthAwareRouteButton>
                </article>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
