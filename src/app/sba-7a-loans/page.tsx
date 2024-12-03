'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { CheckCircle, Coffee, Leaf, DollarSign, FileCheck, Users, Building2 } from 'lucide-react'
import Testimonials from '@/components/Testimonials'
import SBAEligibilityCheck from '@/components/SBAEligibilityCheck'

type FAQItem = {
  question: string;
  answer: React.ReactNode;
}

const SBA7aLoans = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [showEligibilityCheck, setShowEligibilityCheck] = useState(false);
  const eligibilityRef = useRef<HTMLDivElement>(null);

  const scrollToEligibility = () => {
    setShowEligibilityCheck(true);
    setTimeout(() => {
      eligibilityRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const faqItems: FAQItem[] = [
    {
      question: "What can I use an SBA 7(a) loan for?",
      answer: (
        <div className="space-y-4">
          <p>SBA 7(a) loans are incredibly versatile. You can use them for:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><span className="font-semibold">Expanding Your Business:</span> Open new locations, hire staff, or launch new products.</li>
            <li><span className="font-semibold">Purchasing Equipment:</span> Invest in tools, machinery, or technology.</li>
            <li><span className="font-semibold">Real Estate:</span> Buy or renovate commercial properties.</li>
            <li><span className="font-semibold">Working Capital:</span> Cover day-to-day expenses like payroll or rent.</li>
            <li><span className="font-semibold">Refinancing Debt:</span> Replace high-interest loans with lower-cost financing.</li>
          </ul>
          <p>These loans are designed to give small businesses the financial flexibility they need to grow and thrive.</p>
        </div>
      )
    },
    {
      question: "How much can I borrow with an SBA 7(a) loan?",
      answer: (
        <p>You can borrow up to $5 million with an SBA 7(a) loan. The exact amount depends on your business's financial needs, your ability to repay, and the lender's assessment of your application.</p>
      )
    },
    {
      question: "What are the repayment terms and interest rates?",
      answer: (
        <div className="space-y-4">
          <ul className="space-y-2">
            <li><span className="font-semibold">Repayment Terms:</span> Up to 10 years for working capital or equipment loans and up to 25 years for real estate loans.</li>
            <li><span className="font-semibold">Interest Rates:</span> SBA 7(a) loans offer competitive variable rates, based on the prime rate plus a margin. These rates are typically lower than conventional business loans.</li>
          </ul>
          <p>Longer terms and lower rates make SBA 7(a) loans an affordable option for small business owners.</p>
        </div>
      )
    },
    {
      question: "Do I qualify for an SBA 7(a) loan?",
      answer: (
        <div className="space-y-4">
          <p>To qualify, your business must:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Be located in the U.S. or its territories.</li>
            <li><span className="font-semibold">Meet SBA size standards:</span> Your business must fall within the SBA's definition of a "small business," which varies by industry.</li>
            <li><span className="font-semibold">Have a sound purpose for the loan:</span> Funds must be used for eligible business purposes.</li>
            <li><span className="font-semibold">Show the ability to repay:</span> Lenders will review your financial history and cash flow.</li>
          </ul>
          <p>While strong credit and financials help, even businesses with challenges can qualify thanks to the SBA's government-backed guarantee.</p>
        </div>
      )
    },
    {
      question: "How do I apply for an SBA 7(a) loan?",
      answer: (
        <div className="space-y-4">
          <p>Applying for an SBA 7(a) loan can feel overwhelming—it's not as simple as filling out a quick form. The process involves multiple steps, significant documentation, and working with approved lenders.</p>
          
          <p className="font-semibold">Here's the typical process:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Find an SBA-approved lender: Research and identify lenders that participate in the SBA program.</li>
            <li>Prepare extensive documentation: This includes a business plan, tax returns, financial statements, cash flow projections, and a clear explanation of how you'll use the loan.</li>
            <li>Submit your application and wait: After everything is submitted, lenders and the SBA review your application, which can take 30–90 days to process.</li>
          </ul>

          <div className="bg-blue-50 p-4 rounded-lg mt-4">
            <p className="font-semibold text-blue-900 mb-2">How We Make It Easy for You</p>
            <ul className="list-disc pl-6 space-y-2 text-blue-900">
              <li>We Help Organize Your Documents: You don't have to worry about missing paperwork—we'll guide you step-by-step.</li>
              <li>Tap Into Our Network: We work with a wide network of SBA 7(a) lenders and can connect you with the right one for your business.</li>
              <li>Simplify the Process: We'll help you secure a loan proposal and handle the complicated details, ensuring you get the best chance of approval.</li>
              <li>Ongoing Support: From start to finish, we'll walk you through every step so you can focus on your business.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      question: "Why choose an SBA 7(a) loan over other types of financing?",
      answer: (
        <div className="space-y-4">
          <p>SBA 7(a) loans offer several advantages over traditional loans:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><span className="font-semibold">Lower Monthly Payments:</span> Thanks to long repayment terms, your payments will be smaller and more manageable.</li>
            <li><span className="font-semibold">Affordable Interest Rates:</span> SBA loans offer competitive rates, often lower than conventional business loans.</li>
            <li><span className="font-semibold">Higher Approval Chances:</span> The SBA guarantees part of the loan, making lenders more willing to approve small businesses—even those with limited credit or collateral.</li>
            <li><span className="font-semibold">Flexible Use:</span> These loans can be used for almost any business purpose.</li>
          </ul>
          <p>If you're looking for accessible, affordable financing tailored to small businesses, SBA 7(a) loans are an excellent choice.</p>
        </div>
      )
    },
    {
      question: "What happens if I don't have collateral?",
      answer: (
        <p>While collateral can improve your application, SBA 7(a) loans don't always require it. Lenders evaluate your overall financial situation, including your credit history, cash flow, and business plan. If you lack collateral, the SBA's guarantee still makes it possible to secure funding based on other factors.</p>
      )
    },
    {
      question: "Can I refinance existing debt with an SBA 7(a) loan?",
      answer: (
        <p>Yes, SBA 7(a) loans are a great option for refinancing high-interest debt. To qualify, you'll need to show that the refinancing will improve your financial position—for example, by lowering your monthly payments or reducing your interest rate.</p>
      )
    }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Fuel Your Business Dreams with SBA 7(a) Loans
            </h1>
            <p className="text-xl mb-8">
              The gold standard of business loans—designed by the U.S. Government to help small businesses succeed with affordable, flexible funding.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => eligibilityRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white text-blue-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Find Out If You Are Eligible
              </button>
              <button className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors border border-white">
                Start Your SBA 7(a) Loan Application
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Built to Support Small Business Owners Like You</h2>
            <p className="text-gray-600 mb-8">
              In 1953, the U.S. government established the Small Business Administration (SBA) to help small businesses thrive. They recognized that many small business owners struggle to get loans from traditional banks due to stricter requirements, lack of collateral, or limited credit history.
            </p>
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
              <h3 className="text-xl font-bold mb-4">The SBA 7(a) loan program was specifically designed to:</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1" />
                  <span>Make financing more accessible for small business owners.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1" />
                  <span>Reduce risks for lenders by guaranteeing a portion of the loan.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1" />
                  <span>Support local economies by helping businesses grow, hire, and innovate.</span>
                </li>
              </ul>
            </div>
            <div className="bg-blue-100 p-6 rounded-xl">
              <p className="text-blue-900 font-semibold text-center">
                Fun Fact: Small businesses create nearly two-thirds of all jobs in the U.S.—and the SBA 7(a) program ensures they get the support they need.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Are SBA 7(a) Loans Section */}
      <section className="py-8">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">A Smarter Way to Fund Your Business</h2>
            <p className="text-gray-600 text-center mb-12">
              SBA 7(a) loans are government-backed loans designed to meet the unique needs of small business owners. What makes them special? They're affordable, flexible, and accessible for businesses that might not qualify for traditional bank loans.
            </p>
            
            <h3 className="text-2xl font-bold mb-6">What Can SBA 7(a) Loans Be Used For?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <Building2 className="w-8 h-8 text-blue-600 mb-4" />
                <h4 className="font-bold mb-2">Expansion</h4>
                <p className="text-gray-600">Open a new location, hire more staff, or increase production.</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <FileCheck className="w-8 h-8 text-blue-600 mb-4" />
                <h4 className="font-bold mb-2">Equipment</h4>
                <p className="text-gray-600">Buy machinery, tools, or technology to operate more efficiently.</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <DollarSign className="w-8 h-8 text-blue-600 mb-4" />
                <h4 className="font-bold mb-2">Working Capital</h4>
                <p className="text-gray-600">Cover everyday expenses like payroll, rent, or inventory.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-8">
        <div className="container mx-auto px-6">
          <Testimonials />
        </div>
      </section>

      {/* FAQs */}
      <section className="py-8">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Your SBA 7(a) Questions, Answered</h2>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <button
                    className="w-full px-6 py-4 text-left font-bold flex justify-between items-center hover:bg-gray-50 transition-colors"
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  >
                    <span>{item.question}</span>
                    <span className={`transform transition-transform ${openFAQ === index ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  <div
                    className={`px-6 transition-all duration-300 ease-in-out ${
                      openFAQ === index ? 'py-4 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                    }`}
                  >
                    <div className="text-gray-600">
                      {item.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Is an SBA 7(a) Loan Right for You?</h2>
            <p className="text-xl mb-8">
              Get personalized guidance today! Whether you're looking to expand, refinance, or just get started, our team is here to help you through the process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => eligibilityRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white text-blue-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Check Eligibility Now
              </button>
              <button className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors border border-white">
              Start Your SBA 7(a) Loan Application
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility Check */}
      <section ref={eligibilityRef} className="py-8">
        <div className="container mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Check Your Eligibility</h2>
            <p className="text-gray-600">
              Answer a few simple questions to see if you might qualify for an SBA 7(a) loan.
            </p>
          </div>
          <SBAEligibilityCheck />
        </div>
      </section>
    </div>
  )
}

export default SBA7aLoans 