import type { Metadata } from 'next';
import { Sora } from 'next/font/google';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import LoanPackagingDashboardDemo from '@/app/(components)/LoanPackagingDashboardDemo';

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
      <section className="home-dossier-bg relative overflow-hidden bg-[#071824] px-4 py-6 text-white sm:px-6 sm:py-8">
        <div className="home-noise pointer-events-none absolute inset-0 opacity-[0.1]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 border-l-2 border-amber-300 pl-3 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100">
            <ShieldCheck className="h-4 w-4" />See the dashboard before you start
          </div>
          <div className="mt-3">
            <h1 className={`${headingFont.className} w-full text-3xl font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-4xl`}>See exactly how you’ll build a complete, lender-ready loan package.</h1>
            <p className="mt-3 w-full max-w-6xl text-sm leading-6 text-slate-300 sm:text-base">This is the workspace you’ll use to organize your loan request, see exactly which documents a lender needs, upload the files you already have, complete guided financial templates, create a professional lender cover letter, and package everything for secure sharing. Explore the sample below to see how the entire process works before you begin.</p>
            <Link href="/loan-services" className="group mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#f5c86a] px-4 py-2.5 text-sm font-extrabold text-[#071824] transition hover:bg-[#ffda88]">Explore Loan Packaging <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1600px] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <LoanPackagingDashboardDemo />
      </section>
    </div>
  );
}
