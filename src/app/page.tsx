"use client";

import React from 'react';
import Link from 'next/link';
import Testimonials from '@/components/Testimonials';
import FundingProcessSteps from '@/components/FundingProcessSteps'; // Add this import

import {
  BarChart3,
  Clock,
  FileCheck,
  HandshakeIcon,
  CheckCircle,
  ArrowRight,
  DollarSign,
  Users,
  Award
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] mt-24 flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/50 z-10"></div>
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80")',
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        ></div>
        <div className="container mx-auto px-6 py-8 relative z-20">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-3xl md:text-6xl font-bold mb-6 [text-shadow:_0_2px_10px_rgb(0_0_0_/_40%)]">
              Empowering Small Businesses to Secure the Funding They Deserve
            </h1>
            <p className="text-2xl md:text-3xl mb-4 text-white font-bold italic [text-shadow:_0_2px_8px_rgb(0_0_0_/_40%)]">
              Expert Guidance, Simplified Processes, Proven Results.
            </p>
            <p className="text-2xl md:text-2xl mb-8 text-white/90 max-w-5xl mx-auto [text-shadow:_0_2px_8px_rgb(0_0_0_/_40%)]">
              At Business Lending Advocate (BLA), we simplify securing small business loans by offering expert loan packaging, connecting you with the right lenders, and analyzing your cash flow to ensure you can afford financing. Our services help businesses confidently access the funding they need to grow, expand, or tackle challenges.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://form.jotform.com/223035998535061"
                className="px-8 py-4 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold text-lg transition-colors shadow-lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                Check If You Can Afford a Loan—Free & Fast
              </a>
              <Link href="/cash-flow-analysis" className="px-8 py-4 bg-white hover:bg-gray-100 rounded-lg font-semibold text-lg transition-colors shadow-lg text-blue-900">
                Explore Our Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Businesses Choose Us Section */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
            Why Businesses Choose Us
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FileCheck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Funding Can Be Overwhelming</h3>
              <p className="text-gray-600">
                Loan applications are often complex, time-consuming, and full of confusing jargon. We simplify the process so you can focus on running your business.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Time Is Money</h3>
              <p className="text-gray-600">
                You need funding now – not months from now – and mistakes can slow the process. Our efficient process ensures you get the answers—and funding—you need, fast.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Lenders Require Precision</h3>
              <p className="text-gray-600">
              A strong loan application is the key to securing the best terms and rates. Preparing one takes time, attention to detail, and expertise—let us handle it for you to maximize your chances of success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Help Section */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Who We Help
            </h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <p className="ml-4 text-lg text-gray-700">
                  Business owners seeking funding for growth, expansion, or financial assistance.
                </p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <p className="ml-4 text-lg text-gray-700">
                  Anyone feeling unsure about how to present their finances to lenders.
                </p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <p className="ml-4 text-lg text-gray-700">
                  Entrepreneurs who want to avoid the hassle of navigating the loan process alone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
            Our Benefits
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Clear Guidance</h3>
              <p className="text-gray-600">
                Step-by-step guidance through the loan process so you always know what to expect.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Tailored Support</h3>
              <p className="text-gray-600">
                Services customized to fit your unique needs, from analysis to brokering.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileCheck className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Stronger Applications</h3>
              <p className="text-gray-600">
                Expert preparation to increase your chances of loan approval.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Faster Results</h3>
              <p className="text-gray-600">
                Save time while we handle the details and you focus on your business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* Funding Process Steps Section */}
      <FundingProcessSteps />

      <section className="py-12 bg-blue-900 text-white">
        {/* CTA Section */}
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Secure the Funding Your Business Deserves?
            </h2>
            <h2 className="text-xl mb-8">Find out if you can afford a loan today with our free assessment tool</h2>
            <Link href="/assessment" className="inline-block px-8 py-4 bg-white text-blue-900 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg">
                Start Your Free Assessment
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
