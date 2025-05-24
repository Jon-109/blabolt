"use client";

import React from 'react';
import ServiceCard from '@/app/(components)/analysis/ServiceCard';
import {
  FileCheck,
  HandshakeIcon,
  ChevronRight,
  CheckCircle,
  DollarSign,
  Clock,
  Award,
  Building2,
  Shield,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import LoanPaymentCalculator from '@/app/(components)/LoanPaymentCalculator';
import Testimonials from '@/app/(components)/shared/Testimonials';
import { Button } from '@/app/(components)/ui/button';

const PricingTable = () => {
  const services = [
    {
      name: 'Loan Packaging',
      description: 'Cover letter, document prep, lender-ready application',
      cost: '$499'
    },
    {
      name: 'Loan Brokering',
      description: <span>Everything in Loan Packaging <span className="font-bold text-primary-blue">(included at no extra cost)</span>, plus lender matchmaking, term negotiation, and ongoing support</span>,
      cost: '1% of loan amount (due at closing)*'
    },
    {
      name: 'SBA 7(a) Loan Matching',
      description: 'Connect you to SBA 7(a) lenders for low-interest, government-backed loans',
      cost: 'No cost'
    }
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left p-4 bg-gray-50">Service</th>
            <th className="text-left p-4 bg-gray-50">What You Get</th>
            <th className="text-left p-4 bg-gray-50">Cost</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service, index) => (
            <tr key={index} className="border-t">
              <td className="p-4 font-medium">{service.name}</td>
              <td className="p-4">{service.description}</td>
              <td className="p-4">{service.cost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function LoanServices() {
  const scrollToCalculator = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const calculator = document.getElementById('loan-calculator');
    calculator?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-blue to-primary-blue/80 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block bg-white/10 text-white px-6 py-2 rounded-full mb-4">
              Loan Brokering: Pay Only When You Get Funded
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Need Funding? We’ll Help You Get Loan-Ready and Funded
            </h1>
            <p className="text-xl mb-8">
            From packaging your loan application to finding the right lender — we handle everything for small businesses. Let us simplify the process so you can focus on growing your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="h-12 px-8 bg-white text-primary-blue rounded-lg font-semibold hover:bg-gray-100 transition-colors sm:flex-1 flex items-center justify-center text-base">
                <Link href="/get-funded">Start Your Application Now</Link>
              </Button>
              <a
                href="#loan-calculator"
                onClick={scrollToCalculator}
                className="h-12 px-8 bg-primary-blue hover:bg-primary-blue/80 text-white rounded-lg font-semibold transition-colors shadow-lg flex items-center justify-center gap-2 sm:flex-1 text-base"
              >
                See What Your Loan Could Cost
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Loan Services Section */}
      <section className="relative max-w-7xl mx-auto mt-4 mb-8 px-6 py-10 bg-gradient-to-br from-blue-50 via-white to-green-50 border border-blue-100 dark:border-gray-700 shadow-xl rounded-3xl overflow-hidden animate-fade-in">
        <div className="flex flex-col items-center">
          <div className="mb-4 flex items-center gap-3">
            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c1.657 0 3-1.343 3-3S13.657 2 12 2 9 3.343 9 5s1.343 3 3 3zm0 0v12m0 0c-4.418 0-8-1.79-8-4V7c0-2.21 3.582-4 8-4s8 1.79 8 4v9c0 2.21-3.582 4-8 4z" /></svg>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-900 dark:text-white tracking-tight drop-shadow-sm">Explore Our Business Loan Services</h2>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-200 mb-8 text-center max-w-4xl">
            Unlock funding opportunities tailored for your business. Discover flexible loan solutions, expert guidance, and dedicated support to help you grow and succeed.
          </p>
          <div className="flex flex-col md:flex-row gap-6 items-stretch w-full justify-center">
            <ServiceCard />
          </div>
        </div>
      </section>

      {/* SBA 7(a) Section */}
      <section className="bg-gradient-to-br from-primary-blue to-primary-blue/80 text-white py-8">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                Why Are SBA 7(a) Loans Called "The Gold Standard" of Business Financing?
              </h2>
              <p className="text-xl mb-6">
                The SBA 7(a) loan program is designed to help small businesses access affordable financing with flexible terms, backed by the U.S. Small Business Administration.
              </p>
            </div>

            {/* What Makes SBA 7(a) Loans Unique */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4">What Makes SBA 7(a) Loans Unique?</h3>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="w-12 h-12 bg-primary-blue/10 rounded-full flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-primary-blue" />
                  </div>
                  <h4 className="text-gray-900 text-xl font-semibold mb-2">Government-Backed Security</h4>
                  <p className="text-gray-600">
                    Loans partially guaranteed by the SBA, increasing approval chances
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="w-12 h-12 bg-primary-blue/10 rounded-full flex items-center justify-center mb-4">
                    <DollarSign className="w-6 h-6 text-primary-blue" />
                  </div>
                  <h4 className="text-gray-900 text-xl font-semibold mb-2">Affordable Financing</h4>
                  <p className="text-gray-600">
                    Lower interest rates and longer repayment terms
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="w-12 h-12 bg-primary-blue/10 rounded-full flex items-center justify-center mb-4">
                    <Building2 className="w-6 h-6 text-primary-blue" />
                  </div>
                  <h4 className="text-gray-900 text-xl font-semibold mb-2">Flexible Use</h4>
                  <p className="text-gray-600">
                    Use for expansion, equipment, refinancing, or real estate
                  </p>
                </div>
              </div>
            </div>

            {/* Why Consider Section */}
            <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Why Consider an SBA 7(a) Loan?</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1" />
                  <div>
                    <span className="font-semibold text-gray-900">Lower Monthly Payments: </span>
                    <span className="text-gray-600">Thanks to extended repayment terms (up to 25 years for real estate), monthly payments are more manageable.</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1" />
                  <div>
                    <span className="font-semibold text-gray-900">Access for Small Businesses: </span>
                    <span className="text-gray-600">Designed to help small businesses, even if you don't have perfect credit.</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1" />
                  <div>
                    <span className="font-semibold text-gray-900">A Path to Growth: </span>
                    <span className="text-gray-600">Perfect for established businesses ready to expand operations or refinance existing debt.</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-xl mb-6">Want to know if an SBA 7(a) loan is right for you?</p>
              <Link href="/sba-7a-loans">
                <button className="px-8 py-4 bg-white text-primary-blue rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Learn More About SBA 7(a) Loans
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="bg-gray-50 py-8">
        <div className="container mx-auto px-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">How Our Loan Process Works</h2>
            <p className="text-gray-600">Your journey from application to funding in four simple steps</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary-blue" />
              </div>
              <h3 className="font-semibold mb-2">Ensure You Qualify</h3>
              <p className="text-gray-600 mb-4">We help you understand how banks will evaluate your business using the 5 C's of Credit: Character, Capacity, Capital, Collateral, and Conditions</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileCheck className="w-8 h-8 text-primary-blue" />
              </div>
              <h3 className="font-semibold mb-2">Loan Packaging</h3>
              <p className="text-gray-600">We prepare your application with a compelling narrative, organized financials, and complete documentation that meets lender requirements</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-primary-blue" />
              </div>
              <h3 className="font-semibold mb-2">Lender Matching</h3>
              <p className="text-gray-600">We match you with lenders who specialize in your industry and loan type, leveraging our network of banks and financial institutions</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-primary-blue" />
              </div>
              <h3 className="font-semibold mb-2">Approval & Funding</h3>
              <p className="text-gray-600">We guide you through underwriting, negotiate terms on your behalf, and ensure a smooth closing process to get your funds faster</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-8">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-6">Pricing Overview</h2>
          <div className="max-w-4xl mx-auto">
            <PricingTable />
            <div className="text-center mt-4 space-y-2">
              <p className="text-gray-600 font-semibold">
                No Money Out of Pocket
              </p>
              <p className="text-gray-600 text-sm max-w-2xl mx-auto">
                * Our 1% loan brokering fee is simply added to your loan amount at closing. You don't pay anything until your loan is approved, and the fee comes from your loan funds - not your pocket. If you don't get approved, you don't pay a penny.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gray-50 py-8">
        <div className="container mx-auto px-6">
          <Testimonials />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-blue text-white py-8">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-6">
              Choose your path to funding success
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="px-8 py-4 bg-white text-primary-blue rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                <Link href="/get-funded">Start Your Application Now</Link>
              </Button>
              <Button asChild className="px-8 py-4 bg-primary-blue text-white rounded-lg font-semibold hover:bg-primary-blue/80 transition-colors border border-white">
                <Link href="/get-funded">Find Your Perfect Lender</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Add the calculator after your main content */}
      <LoanPaymentCalculator />
    </div>
  );
}