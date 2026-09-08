import type { Metadata } from 'next';
import { Sora } from 'next/font/google';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import LoanPackagingDemo from '@/app/(components)/LoanPackagingDemo';

const headingFont = Sora({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Interactive Loan Packaging Dashboard Demo',
  description: 'Explore a sample Business Lending Advocate loan packaging workspace, including the loan profile, document checklist, lender cover letter, and secure package delivery flow.',
  alternates: { canonical: '/loan-packaging-demo' },
};

export default function LoanPackagingDemoPage() {
  return (
    <div className="min-h-screen bg-[#f5f6f3] text-slate-950">
      <section className="home-dossier-bg relative overflow-hidden bg-[#071824] px-4 py-9 text-white sm:px-6 sm:py-11">
        <div className="home-noise pointer-events-none absolute inset-0 opacity-[0.1]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 border-l-2 border-amber-300 pl-3 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100">
            <ShieldCheck className="h-4 w-4" />Interactive product tour
          </div>
          <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className={`${headingFont.className} max-w-[20ch] text-3xl font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-5xl`}>See how a lender-ready package comes together.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Use sample borrower data to explore the same four-part workflow as the real dashboard. Demo changes remain on this page and never touch a customer account.</p>
            </div>
            <Link href="/loan-services" className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#f5c86a] px-5 py-3 text-sm font-extrabold text-[#071824] transition hover:bg-[#ffda88]">Explore Loan Packaging <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1500px] px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        <LoanPackagingDemo />
      </section>
    </div>
  );
}
