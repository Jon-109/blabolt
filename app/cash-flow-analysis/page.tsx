"use client";

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  DollarSign,
  BarChart3,
  Users,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/helpers/client';
import Testimonials from '@/app/(components)/shared/Testimonials';
import LoanPaymentCalculator from '@/app/(components)/LoanPaymentCalculator';
import DscrQuickCalculator, { DscrFormValues } from '@/app/(components)/cash-flow/DscrQuickCalculator';

const ComparisonTable = () => {
  const features = [
    { name: 'Cost', quick: 'Free', comprehensive: '$99' },
    { name: 'Time to Complete', quick: 'Less than 5 minutes', comprehensive: '~30 minutes' },
    { name: 'Level of Detail', quick: 'High-level overview', comprehensive: 'Deep dive with bank-level accuracy' },
    { name: 'Analysis Period', quick: 'Most recent full year', comprehensive: 'Last 2 years + Year-to-date (bank standard)' },
    { name: 'Downloadable PDF Report', quick: 'No - Basic', comprehensive: 'Yes - Comprehensive' },
    { name: 'Business Debt Summary', quick: 'No', comprehensive: 'PDF Included Free - no extra work needed' },
    { name: 'Ideal For', quick: 'Fast financial check-up', comprehensive: 'Loan Applications, In-Depth Review' }
  ];

  return (
    <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-md">
      <table className="w-full table-fixed">
        <thead>
          <tr>
            <th className="text-left p-2 text-xs whitespace-normal bg-gray-100 border-b border-gray-300 sm:p-4 sm:text-base">Feature</th>
            <th className="text-left p-2 text-xs whitespace-normal bg-gray-100 border-b border-gray-300 sm:p-4 sm:text-base">Quick</th>
            <th className="text-left p-2 text-xs whitespace-normal bg-gray-100 border-b border-gray-300 sm:p-4 sm:text-base">Comprehensive</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr key={index} className="border-t border-gray-300">
              <td className="p-2 text-xs whitespace-normal font-medium sm:p-4 sm:text-base">{feature.name}</td>
              <td className="p-2 text-xs whitespace-normal sm:p-4 sm:text-base">{feature.quick}</td>
              <td className="p-2 text-xs whitespace-normal sm:p-4 sm:text-base">{feature.comprehensive}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};



function CashFlowAnalysisContent() {
  const [formValues, setFormValues] = useState<DscrFormValues>({
    monthlyNetIncome: 0,
    realEstateDebt: 0,
    creditCards: 0,
    vehicleEquipment: 0,
    linesOfCredit: 0,
    otherDebt: 0
  });
  const [showCalculator, setShowCalculator] = useState(false);
  const calculatorRef = useRef<HTMLDivElement>(null);
  const loanCalculatorRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Check if the URL has the showCalculator parameter
    if (searchParams.get('showCalculator') === 'true') {
      setShowCalculator(true);
      // Scroll to calculator section with a slight delay to ensure it's visible
      setTimeout(() => {
        calculatorRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    
    // Check if we need to start the checkout flow after login
    const handleCheckoutAfterLogin = async () => {
      if (searchParams.get('checkout') === 'true') {
        // Remove the query param to prevent infinite loops
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('checkout');
        window.history.replaceState({}, '', newUrl.toString());
        
        // Start the checkout process
        await handleStartCheckout();
      }
    };
    
    handleCheckoutAfterLogin();
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleShowCalculator = () => {
    setShowCalculator(true);
    // Scroll to calculator section with a slight delay to ensure it's visible
    setTimeout(() => {
      calculatorRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleScrollToLoanCalculator = () => {
    // Scroll to loan calculator section
    setTimeout(() => {
      loanCalculatorRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handler for the $99 CTA button (triggers login if needed, then checkout)
  const handleStartCheckout = async () => {
    try {
      // Check Supabase session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        // Store in sessionStorage that we want to checkout after login
        sessionStorage.setItem('returnToCheckout', 'true');
        
        // Redirect to login with a return URL that includes checkout=true
        const redirectTo = encodeURIComponent('/cash-flow-analysis?checkout=true');
        router.push(`/login?redirectTo=${redirectTo}`);
        return;
      }
      
      // Check if user has already purchased the comprehensive analysis
      try {
        const { hasUserPurchasedCashFlowAnalysis } = await import('./purchase-check');
        const hasPurchased = await hasUserPurchasedCashFlowAnalysis(session.user.id);
        if (hasPurchased) {
          // User has already purchased, redirect to the comprehensive form page
          router.replace('/comprehensive-cash-flow-analysis');
          return;
        }
      } catch (purchaseCheckError) {
        console.error('Error checking purchase status:', purchaseCheckError);
        // Optionally, allow fallback to checkout if purchase check fails
        // alert('Could not verify purchase status. Please try again later.');
        // return;
      }
      
      // Get the JWT token from the session
      const token = session.access_token;
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // If we get here, user is logged in and has not purchased - proceed to checkout
      const res = await fetch('/api/create-checkout-session', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Include JWT token
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const data = await res.json();
      
      if (data.url) {
        // Clear the checkout flag since we're proceeding to payment
        sessionStorage.removeItem('returnToCheckout');
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      // Show a more specific error message if available
      const errorMessage = error instanceof Error ? error.message : 'Unable to start checkout';
      alert(`Error: ${errorMessage}. Please try again.`);
    }
  };


  // (Retain handleComprehensiveAnalysis if used elsewhere, or remove if not needed)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-blue to-primary-blue/80 text-white py-6">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Know Your DSCR—and Demonstrate You Can Afford the Loan
            </h1>
            <p className="text-xl mb-4 max-w-3xl mx-auto">
            Lenders base approvals on your Debt Service Coverage Ratio (DSCR). Start with a quick, free check to see where you stand, then unlock a full cash flow analysis packaged into a lender-ready report for faster, more confident approval.            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              {/* Primary CTA */}
              <div className="flex flex-col items-center">
                <button 
                  className="px-8 py-3 bg-white text-primary-blue rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-md mb-1"
                  onClick={handleShowCalculator}
                >
                  Start Free DSCR Check
                </button>
                <sub className="text-xs text-blue-100">Takes 1 min · No credit pull</sub>
              </div>
              {/* Secondary CTA */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => {
                    const el = document.getElementById('two-levels');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
                >
                  See Comprehensive Analysis
                </button>
                <sub className="text-xs text-blue-100">Includes detailed ratios & lender-ready PDF</sub>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why It Matters Section */}
      <section className="bg-white py-4 md:py-6">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto rounded-2xl shadow-2xl bg-gradient-to-br from-primary-blue/90 to-blue-900/90 backdrop-blur-md border border-white/20 px-4 py-4 md:p-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-center text-white drop-shadow-lg">
              Why Cash Flow Analysis Matters for Financing
            </h2>
            <p className="text-lg md:text-xl mb-3 text-center text-blue-100 font-medium">
              Lenders don’t just care about your revenue — they care about how well your business manages debt. A clear cash flow analysis shows whether you can afford a loan, helping you qualify faster and with more confidence. With our services, you'll:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="transition-transform hover:scale-105 bg-white rounded-xl p-6 flex flex-col items-center text-center shadow-lg border border-white/10">
                <div className="w-16 h-16 flex items-center justify-center mb-4 bg-white/20 text-primary-blue shadow-lg ring-2 ring-white/30 rounded-full">
                  <BarChart3 className="w-8 h-8 text-primary-blue drop-shadow-md" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">Know Your Numbers</h3>
                <p className="text-base md:text-lg text-gray-700">See how your business performs financially—instantly.</p>
              </div>
              <div className="transition-transform hover:scale-105 bg-white rounded-xl p-6 flex flex-col items-center text-center shadow-lg border border-white/10">
                <div className="w-16 h-16 flex items-center justify-center mb-4 bg-white/20 text-primary-blue shadow-lg ring-2 ring-white/30 rounded-full">
                  <ArrowRight className="w-8 h-8 text-primary-blue drop-shadow-md" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">Understand Potential</h3>
                <p className="text-base md:text-lg text-gray-700">Learn how your cash flow impacts funding opportunities and lender decisions.</p>
              </div>
              <div className="transition-transform hover:scale-105 bg-white rounded-xl p-6 flex flex-col items-center text-center shadow-lg border border-white/10">
                <div className="w-16 h-16 flex items-center justify-center mb-4 bg-white/20 text-primary-blue shadow-lg ring-2 ring-white/30 rounded-full">
                  <Users className="w-8 h-8 text-primary-blue drop-shadow-md" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">Approach with Confidence</h3>
                <p className="text-base md:text-lg text-gray-700">Use a professional report to approach lenders prepared and ready.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="two-levels" className="py-8 bg-[#002c55]">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4 text-white">
            Two Levels of Cash Flow Analysis
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {/* Quick Analysis */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="bg-primary-blue/10 text-primary-blue px-4 py-1 rounded-full inline-block mb-4">
                FREE
              </div>
              <h3 className="text-2xl font-bold mb-2">Quick Cash Flow Analysis</h3>
              <p className="text-lg text-primary-blue mb-6">Fast Financial Insights in Less Than 2 Minutes</p>
              
              <div className="space-y-6 mb-8">
                <div>
                  <h4 className="font-semibold mb-2">Purpose:</h4>
                  <p className="text-gray-600">A high-level overview of your cash flow — designed to give you fast clarity on whether your business may qualify for financing.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Outcome:</h4>
                  <p className="text-gray-600">Immediate insights into your financial standing to identify if you need further analysis.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Perfect For:</h4>
                  <p className="text-gray-600">Business owners needing a quick, no-commitment checkup to decide if a deeper analysis is worth it.</p>
                </div>
              </div>
              
              <button 
                className="w-full bg-primary-blue text-white py-3 rounded-lg font-semibold hover:bg-primary-blue/80 transition-colors"
                onClick={handleShowCalculator}
              >
                Run a Free Quick Check
              </button>
            </div>

            {/* Comprehensive Analysis */}
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-primary-blue">
              <div className="bg-primary-blue text-white px-4 py-1 rounded-full inline-block mb-4">
                RECOMMENDED
              </div>
              <h3 className="text-2xl font-bold mb-2">Comprehensive Cash Flow Analysis</h3>
              <p className="text-lg text-primary-blue mb-6">Bank-Level Analysis with a Detailed PDF Report</p>
              
              <div className="space-y-6 mb-8">
                <div>
                  <h4 className="font-semibold mb-2">Purpose:</h4>
                  <p className="text-gray-600">A professional-grade analysis built using the same standards banks use — including Adjusted EBITDA and categorized debt analysis.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Outcome:</h4>
                  <p className="text-gray-600">A downloadable, polished PDF report covering your inflows, outflows, Adjusted EBITDA, DSCR, and a detailed Business Debt Summary formatted for lender review.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Perfect For:</h4>
                  <p className="text-gray-600">Businesses preparing to secure funding, apply for loans, or gain a deeper understanding of their financial health.</p>
                </div>
              </div>
              
              <button 
                onClick={handleStartCheckout}
                className="w-full bg-primary-blue text-white py-3 rounded-lg font-semibold hover:bg-primary-blue/80 transition-colors"
              >
                Get Started at $99
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* DSCR Calculator Section - Right after pricing */}
      {showCalculator && (
        <section id="dscr-calculator" className="py-12 bg-gray-50" ref={calculatorRef}>
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <DscrQuickCalculator
                  initialValues={formValues}
                  onValuesChange={setFormValues}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      

      {/* Comparison Table Section */}
      <section className="py-8">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4 text-center">
            Compare Our Services
          </h2>
          <div className="max-w-4xl mx-auto">
            <ComparisonTable />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#002c55] py-6">
  <div className="container mx-auto px-4">
    <div className="max-w-3xl mx-auto text-center rounded-2xl shadow-xl bg-white/10 backdrop-blur-sm border border-white/20 p-4">
      <h2 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">
        Ready to Get Started?
      </h2>
      <p className="text-lg md:text-xl mb-3 text-blue-100 font-medium">
        Empower your financing journey with clarity and confidence today.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
        <button
          className="w-full sm:w-auto px-8 py-4 bg-white text-primary-blue font-bold rounded-xl shadow-lg border-2 border-white/80 hover:bg-blue-50 hover:scale-[1.03] hover:shadow-2xl active:scale-100 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-150 mb-2 sm:mb-0 sm:mr-2"
          onClick={handleShowCalculator}
        >
          Start Quick Analysis for Free
        </button>
        <button
          onClick={handleStartCheckout}
          className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-700 to-primary-blue text-white font-semibold rounded-xl border-2 border-white/30 shadow-lg hover:from-blue-800 hover:to-primary-blue hover:scale-[1.03] hover:shadow-2xl active:scale-100 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-150"
        >
          Get Comprehensive Analysis ($99)
        </button>
      </div>
    </div>
  </div>
</section>

      {/* Testimonials Section - Moved below CTA */}
      <section className="py-6 bg-gray-50">
        <div className="container mx-auto px-6">
          <Testimonials />
        </div>
      </section>

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
            We've compiled answers to common questions about our services and the business lending process. Find the information you need quickly and easily.
          </p>
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary-blue hover:bg-primary-blue/90 text-white rounded-lg font-semibold text-lg transition-colors shadow-md"
          >
            Visit Our FAQ Page
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}