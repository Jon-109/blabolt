"use client";
export const dynamic = 'force-dynamic';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/supabase/helpers/client';

// Temporarily remove complex components to isolate the issue
import Testimonials from '@/app/(components)/shared/Testimonials';
import FundingProcessSteps from '@/app/(components)/shared/FundingProcessSteps';
import LoanPaymentCalculator from '@/app/(components)/LoanPaymentCalculator';

import {
  BarChart3,
  Clock,
  FileCheck,
  HandshakeIcon,
  CheckCircle,
  XCircle,
  ArrowRight,
  DollarSign,
  Users,
  Award,
  HelpCircle,
  ArrowRight as ArrowRightIcon
} from 'lucide-react';

function HomeContent() {
  // Simplify client-side functionality
  const scrollToCalculator = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // Temporarily disable scrolling functionality
    console.log('Scroll to calculator clicked');
  };

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for Supabase login callback with code param
    const code = searchParams.get('code');
    if (code && typeof window !== 'undefined') {
      const redirectFlag = localStorage.getItem('redirectToComprehensive');
      if (redirectFlag === 'true') {
        // Clear the flag so it doesn't trigger again
        localStorage.removeItem('redirectToComprehensive');
        // Complete the Supabase session and redirect
        supabase.auth.getSession().then(({ data }: { data: { session: any } }) => {
          const { session } = data;
          if (session) {
            router.replace('/comprehensive-cash-flow-analysis');
          } else {
            // If no session, stay on the page or handle error
          }
        });
      }
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen">
      {/* Hero Section - Simplified */}
      <section className="relative min-h-[50vh] md:min-h-[70vh] flex items-center justify-center text-white bg-[url('/images/hero.png')] bg-cover bg-center bg-no-repeat">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
        {/* Content */}
        <div className="container mx-auto px-2 py-4 md:px-4 md:py-8 relative z-20">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl md:text-6xl font-extrabold mb-4 drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
              Secure the Business Funding You Need<br className="block sm:hidden" /> — Faster and Easier
            </h1>
            <p className="text-base md:text-2xl mb-6 text-white font-normal drop-shadow-md" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.20)' }}>
              Get expert help to package your loan application, connect with top lenders, and grow your business with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-4 justify-center items-stretch md:items-center">
              <Link
                href="/cash-flow-analysis?showCalculator=true#dscr-calculator"
                className="px-6 py-3 min-h-[44px] min-w-[220px] bg-[#002c55] hover:bg-[#001a33] rounded-xl font-bold text-lg shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#002c55] border border-white border-[0.5px] w-full sm:w-auto"
                id="home-hero-cta-check-afford-loan"
              >
                Check If You Can Afford Loan
              </Link>
              <Link href="/loan-services" className="focus:outline-none w-full sm:w-auto" id="home-hero-link-loan-services">
                <button className="px-6 py-3 min-h-[44px] min-w-[220px] bg-white text-[#002c55] rounded-xl font-bold text-lg border border-[#002c55] shadow-md hover:bg-gray-50 transition-colors w-full sm:w-auto" id="home-hero-btn-loan-services">
                  Explore Loan Services
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Getting funded shouldn't feel impossible section */}
      <div className="w-full bg-[#002c55] py-1 md:py-3">
      <section className="w-full flex justify-center py-2 md:py-6 px-2 md:px-0 bg-white rounded-3xl max-w-5xl mx-auto mt-6 mb-10 shadow-xl border border-muted/40">
        <div className="w-full flex flex-col gap-3">
          {/* Heading and subheadline */}
          <div className="text-center px-6">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-0.5 md:mb-1 text-[#002c55] tracking-tight drop-shadow-sm">Getting funded shouldn’t feel impossible.</h2>
            <p className="text-base md:text-lg text-gray-700 font-normal w-full mx-auto mb-0.5 md:mb-0 text-center">
              Most small business owners struggle with paperwork, unclear loan terms, and radio silence from lenders. We bring structure, strategy, and support to move you forward with confidence.
            </p>
          </div>
          {/* Problem vs Solution Grid */}
          <div className="relative grid grid-cols-1 md:grid-cols-2 bg-white border border-muted/30 rounded-xl shadow-lg px-2 md:px-12 pt-2 pb-3 md:pt-3 md:pb-5 gap-y-3 md:gap-y-0 md:gap-x-12">
            {/* Vertical divider for desktop */}
            <div className="hidden md:block absolute top-4 bottom-8 left-1/2 -translate-x-1/2 w-px bg-muted/30" aria-hidden="true"></div>
            {/* Problem Column */}
            <div className="flex flex-col md:pr-0">
              <h3 className="text-lg font-semibold text-red-700 mb-4 underline">The Problem</h3>
              <ul className="flex flex-col gap-3">
                <li className="inline-flex items-start gap-2 group text-base">
                  <span className="mt-0.5"><XCircle className="w-5 h-5 text-red-500 group-hover:scale-110 group-hover:text-red-600 transition-transform" /></span>
                  <span className="text-gray-800">Unclear what lenders are actually looking for</span>
                </li>
                <li className="inline-flex items-start gap-2 group text-base">
                  <span className="mt-0.5"><XCircle className="w-5 h-5 text-red-500 group-hover:scale-110 group-hover:text-red-600 transition-transform" /></span>
                  <span className="text-gray-800">Don't know if you can qualify for loan</span>
                </li>
                <li className="inline-flex items-start gap-2 group text-base">
                  <span className="mt-0.5"><XCircle className="w-5 h-5 text-red-500 group-hover:scale-110 group-hover:text-red-600 transition-transform" /></span>
                  <span className="text-gray-800">Applications are time-consuming and frustrating</span>
                </li>
                <li className="inline-flex items-start gap-2 group text-base">
                  <span className="mt-0.5"><XCircle className="w-5 h-5 text-red-500 group-hover:scale-110 group-hover:text-red-600 transition-transform" /></span>
                  <span className="text-gray-800">Financial paperwork is hard to gather and organize</span>
                </li>
              </ul>
            </div>
            {/* Mobile divider */}
            <div className="block md:hidden my-3 h-px bg-muted/30 rounded-full" />
            {/* Solution Column */}
            <div className="flex flex-col md:pl-0">
              <h3 className="text-lg font-semibold text-green-700 mb-4 underline">Our Solution</h3>
              <ul className="flex flex-col gap-3">
                <li className="inline-flex items-start gap-2 group text-base">
                  <span className="mt-0.5"><CheckCircle className="w-5 h-5 text-green-500 group-hover:scale-110 group-hover:text-green-600 transition-transform" /></span>
                  <span className="text-gray-800">Step-by-step guidance through the entire process</span>
                </li>
                <li className="inline-flex items-start gap-2 group text-base">
                  <span className="mt-0.5"><CheckCircle className="w-5 h-5 text-green-500 group-hover:scale-110 group-hover:text-green-600 transition-transform" /></span>
                  <span className="text-gray-800">Cash flow analysis tailored to lender expectations</span>
                </li>
                <li className="inline-flex items-start gap-2 group text-base">
                  <span className="mt-0.5"><CheckCircle className="w-5 h-5 text-green-500 group-hover:scale-110 group-hover:text-green-600 transition-transform" /></span>
                  <span className="text-gray-800">We handle and prepare your financial documents</span>
                </li>
                <li className="inline-flex items-start gap-2 group text-base">
                  <span className="mt-0.5"><CheckCircle className="w-5 h-5 text-green-500 group-hover:scale-110 group-hover:text-green-600 transition-transform" /></span>
                  <span className="text-gray-800">We connect you to vetted, relevant lending partners</span>
                </li>
              </ul>
            </div>
          </div>
          {/* CTA / Scroll prompt */}
          <div className="flex justify-center mt-1">
            <a href="#funding-process" className="text-[#002c55] text-base md:text-lg font-medium hover:underline hover:text-[#001a33] transition-colors opacity-80 flex items-center gap-2" id="home-problem-solution-scroll-funding-process">
              See how it works <span className="animate-bounce-slow">↓</span>
            </a>
          </div>
        </div>
      </section>
      </div>

      {/* Funding Process Steps */}
      <FundingProcessSteps />

      {/* Enhanced CTA */}
      <section className="py-8 bg-[#002c55] text-white">
        <div className="container mx-auto px-4">
          <div className="w-full mx-auto rounded-3xl shadow-2xl border border-white/10 bg-white/5 backdrop-blur-md px-4 sm:px-8 md:px-16 lg:px-32 py-6 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-br from-white/20 via-blue-300/10 to-transparent rounded-full blur-3xl opacity-60 pointer-events-none" />
            <h2 className="text-4xl md:text-5xl font-extrabold mb-2 drop-shadow-lg tracking-tight">
  Lenders Look at One Number First — <span className="text-blue-200">Your DSCR</span>
</h2>
<p className="text-xl md:text-2xl mb-4 text-white/90 font-semibold max-w-2xl mx-auto">
  Find Out Where You Stand in Under 2 Minutes
</p>
<p className="text-lg md:text-xl mb-8 text-white/90 font-medium max-w-2xl mx-auto">
  Your Debt Service Coverage Ratio (DSCR) tells lenders if your business can afford a loan. Our free check gives you a quick snapshot — no credit pull, no obligations, just clarity.
</p>
<Link
  href="/cash-flow-analysis?showCalculator=true#dscr-calculator"
  className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-white text-[#002c55] font-bold text-xl shadow-xl border-2 border-white/70 hover:bg-gray-100 hover:scale-105 focus-visible:ring-4 focus-visible:ring-white/60 transition-all duration-200 ease-out drop-shadow-lg group"
  aria-label="Get Your Free DSCR Check"
  id="home-dscr-cta-get-free-check"
>
  <span className="text-2xl">→</span> Get Your Free DSCR Check
</Link>
<span className="block mt-5 text-base text-white/70 font-light">Instant results. No credit impact.</span>
          </div>
        </div>
      </section>

      {/* Moved LoanPaymentCalculator above Testimonials */}
      <LoanPaymentCalculator />
      
      {/* Add Testimonials back */}
      <Testimonials />

      {/* FAQ Section - Enhanced */}
      <section className="py-8 bg-gradient-to-br from-[#e6ecf2] to-[#c9d7e6]">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="w-8 h-8 text-primary-blue" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Have Questions?
            </h2>
          </div>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            We've compiled answers to the most common questions about our services and the business lending process. Find the information you need quickly and easily.
          </p>
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary-blue hover:bg-primary-blue/90 text-white rounded-lg font-semibold text-lg transition-colors shadow-md"
            id="home-faq-link"
          >
            Visit Our FAQ Page
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>
      </section>

    </div>
  );
}

import { Suspense } from 'react';
export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
