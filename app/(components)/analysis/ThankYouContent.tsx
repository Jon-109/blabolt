'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';

import SuccessBanner from '@/components/analysis/SuccessBanner';
import DSCRCard from '@/components/analysis/DSCRCard';
import FundingProgress from '@/components/analysis/FundingProgress';
import NextStepsTimeline from '@/components/analysis/NextStepsTimeline';
import ServiceCard from '@/components/analysis/ServiceCard';

interface ThankYouContentProps {
  userEmail: string | null;
}

export default function ThankYouContent({ userEmail }: ThankYouContentProps) {
  const searchParams = useSearchParams();
  const dscrParam = searchParams.get('dscr');

  const dscr = dscrParam ? parseFloat(dscrParam) : null;

  // Validation for DSCR value
  if (dscr === null || isNaN(dscr)) {
    console.error('Invalid or missing DSCR parameter');
    // Render an error state or fallback UI
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16 text-center">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="text-gray-700 mt-2">Invalid or missing DSCR value provided in the URL.</p>
        {/* Optionally add a link back or further instructions */}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
      <section className="mb-8 md:mb-12">
        <SuccessBanner userEmail={userEmail} /> 
      </section>

      <section className="mb-8 md:mb-12 flex justify-center">
        <DSCRCard value={dscr} /> 
      </section>

      <section className="mb-8 md:mb-12"> 
        <h2 className="text-xl md:text-2xl font-semibold text-center mb-4 text-gray-700">Your Funding Journey</h2> 
        <FundingProgress currentStep={2} /> 
      </section>

      <section className="mb-8 md:mb-12">
        <NextStepsTimeline />
      </section>

      <section className="mb-8 md:mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-6 md:mb-8 text-gray-800">Ready for the Next Step?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          <ServiceCard variant="packaging" className="flex-1" />
          <ServiceCard variant="brokering" className="flex-1" />
        </div>
      </section>

      {/* Removed FAQPrompt section */}
    </div>
  );
}
