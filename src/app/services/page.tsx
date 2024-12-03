'use client'

import React from 'react'
import { 
  Calculator, 
  FileCheck, 
  HandshakeIcon, 
  CheckCircle, 
  DollarSign, 
  Building2, 
  BarChart,
  TrendingUp,
  FileText,
  PieChart,
  Shield,
  Clock
} from 'lucide-react'
import Testimonials from '@/components/Testimonials'
import Link from 'next/link'

export default function Services() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-8">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block bg-white/10 text-white px-6 py-2 rounded-full mb-3">
              Expert Financial Solutions for Your Business
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              Comprehensive Business Financial Services
            </h1>
            <p className="text-xl mb-4">
              From securing the right financing to optimizing your cash flow, we provide the expertise you need to make informed financial decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Main Services Overview */}
      <section className="py-6 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Loan Services */}
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <HandshakeIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Loan Services</h3>
                <p className="text-gray-600 mb-4">
                  Expert guidance in securing business loans with competitive terms and streamlined application processes.
                </p>
                <Link href="/loan-services">
                  <button className="text-blue-600 font-semibold hover:text-blue-700">
                    Learn More →
                  </button>
                </Link>
              </div>

              {/* Cash Flow Analysis */}
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <BarChart className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Cash Flow Analysis</h3>
                <p className="text-gray-600 mb-4">
                  Detailed analysis and optimization of your business's cash flow for improved financial health.
                </p>
                <Link href="/cash-flow-analysis">
                  <button className="text-blue-600 font-semibold hover:text-blue-700">
                    Learn More →
                  </button>
                </Link>
              </div>

              {/* SBA 7(a) Loans */}
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">SBA 7(a) Loans</h3>
                <p className="text-gray-600 mb-4">
                  Specialized assistance with SBA 7(a) loan applications and government-backed financing.
                </p>
                <Link href="/sba-7a-loans">
                  <button className="text-blue-600 font-semibold hover:text-blue-700">
                    Learn More 
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cash Flow Analysis Detail */}
      <section className="py-6">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Cash Flow Analysis Services</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Quick Analysis */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="bg-blue-100 text-blue-600 px-4 py-1 rounded-full inline-block mb-4">
                  FREE
                </div>
                <h3 className="text-2xl font-bold mb-2">Quick Cash Flow Analysis</h3>
                <p className="text-lg text-blue-600 mb-6">Fast Financial Insights in Less Than 5 Minutes</p>
                
                <div className="space-y-6 mb-8">
                  <div>
                    <h4 className="font-semibold mb-2">Purpose:</h4>
                    <p className="text-gray-600">A simple, high-level overview of your cash flow designed to quickly assess your ability to take on financing.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Outcome:</h4>
                    <p className="text-gray-600">Immediate insights into your financial standing to identify if you need further analysis.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Perfect For:</h4>
                    <p className="text-gray-600">Business owners seeking a quick check-up on cash flow health without diving into the details.</p>
                  </div>
                </div>
                
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Start Free Analysis
                </button>
              </div>

              {/* Comprehensive Analysis */}
              <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-blue-600">
                <div className="bg-blue-600 text-white px-4 py-1 rounded-full inline-block mb-4">
                  RECOMMENDED
                </div>
                <h3 className="text-2xl font-bold mb-2">Comprehensive Cash Flow Analysis</h3>
                <p className="text-lg text-blue-600 mb-6">Bank-Level Analysis with a Detailed PDF Report</p>
                
                <div className="space-y-6 mb-8">
                  <div>
                    <h4 className="font-semibold mb-2">Purpose:</h4>
                    <p className="text-gray-600">A professional-grade cash flow analysis designed to match the exacting standards of banks and lenders.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Outcome:</h4>
                    <p className="text-gray-600">A downloadable, lender-ready PDF report that breaks down your inflows, outflows, and key financial metrics like DTI and DSCR.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Perfect For:</h4>
                    <p className="text-gray-600">Businesses preparing to secure funding, apply for loans, or gain a deeper understanding of their financial health.</p>
                  </div>
                </div>
                
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Get Started at $99
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Loan Services Detail */}
      <section className="py-6 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Loan Services</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Loan Packaging */}
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <FileCheck className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Loan Packaging</h3>
                <p className="text-blue-600 mb-4">$499 (due at closing)</p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                    <span>Professional cover letter highlighting your strengths</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                    <span>Comprehensive document preparation and review</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                    <span>Lender-ready formatting and presentation</span>
                  </li>
                </ul>
              </div>

              {/* Loan Brokering */}
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <HandshakeIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Loan Brokering</h3>
                <p className="text-blue-600 mb-4">1% of loan amount (due at closing)</p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                    <span>Access to our network of trusted lenders</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                    <span>Expert negotiation for best terms</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                    <span>Support until funding is complete</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-6 bg-gradient-to-br from-blue-900 to-blue-800">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center text-white">Why Choose Us</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2 text-white">Fast Process</h3>
                <p className="text-white/80">Quick turnaround times for all services</p>
              </div>
              
              <div className="text-center bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2 text-white">Expert Team</h3>
                <p className="text-white/80">Decades of combined experience</p>
              </div>
              
              <div className="text-center bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2 text-white">Competitive Rates</h3>
                <p className="text-white/80">Transparent, value-based pricing</p>
              </div>
              
              <div className="text-center bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HandshakeIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2 text-white">Dedicated Support</h3>
                <p className="text-white/80">Personal attention throughout</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-6 bg-gray-50">
        <div className="container mx-auto px-6">
          <Testimonials />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-8">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-3">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-6">
              Let's discuss how we can help your business thrive.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://form.jotform.com/223035998535061"
                className="px-8 py-4 bg-white text-blue-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Check If You Can Afford a Loan—Free & Fast
              </a>
              <button className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors border border-white">
                Begin Loan Packaging
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 