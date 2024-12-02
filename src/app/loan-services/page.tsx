import React from 'react';
import {
  FileCheck,
  HandshakeIcon,
  ChevronRight,
  CheckCircle,
  DollarSign,
  Clock,
  Award,
  Building2,
  Shield
} from 'lucide-react';
import DownloadButton from '@/components/DownloadButton';
import Testimonials from '@/components/Testimonials';

const PricingTable = () => {
  const services = [
    {
      name: 'Loan Packaging',
      description: 'Cover letter, document prep, lender-ready application',
      cost: '$499 (due at closing)'
    },
    {
      name: 'Loan Brokering',
      description: <span>Everything in Loan Packaging <span className="font-bold text-blue-600">(included at no extra cost)</span>, plus lender matchmaking, term negotiation, and ongoing support</span>,
      cost: '1% of loan amount (due at closing)'
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
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-8">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block bg-white/10 text-white px-6 py-2 rounded-full mb-4">
              No Upfront Costs — Pay Only When You Get Funded
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Expert Help to Package and Secure the Right Loan for Your Business.
            </h1>
            <p className="text-xl mb-6">
              We specialize in two services: preparing loan applications that get results and connecting you with the right lenders. Let us simplify the process so you can focus on growing your business.
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-gray-50 py-8">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-6">What We Offer</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Loan Packaging */}
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <FileCheck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Loan Packaging</h3>
              <p className="text-blue-600 mb-4">Starting at $499 (paid at closing)</p>
              <ul className="space-y-3 mb-8">
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
                  <span>Assistance with gathering necessary paperwork</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                  <span>Lender-ready formatting and presentation</span>
                </li>
              </ul>
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Start Your Application Now
              </button>
            </div>

            {/* Loan Brokering */}
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <HandshakeIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Loan Brokering</h3>
              <p className="text-blue-600 mb-4">1% of Loan Amount (paid at closing)</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                  <span>Access to our network of trusted lenders</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                  <span>Personalized advice and lender matching</span>
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
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Find Your Perfect Lender
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SBA 7(a) Section */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-8">
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
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="text-gray-900 text-xl font-semibold mb-2">Government-Backed Security</h4>
                  <p className="text-gray-600">
                    Loans partially guaranteed by the SBA, increasing approval chances
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="text-gray-900 text-xl font-semibold mb-2">Affordable Financing</h4>
                  <p className="text-gray-600">
                    Lower interest rates and longer repayment terms
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Building2 className="w-6 h-6 text-blue-600" />
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
              <button className="px-8 py-4 bg-white text-blue-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Learn More About SBA 7(a) Loans
              </button>
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
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Ensure You Qualify</h3>
              <p className="text-gray-600 mb-4">We help you understand how banks will evaluate your business using the 5 C's of Credit: Character, Capacity, Capital, Collateral, and Conditions</p>
              <DownloadButton />
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileCheck className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Loan Packaging</h3>
              <p className="text-gray-600">We prepare your application with a compelling narrative, organized financials, and complete documentation that meets lender requirements</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Lender Matching</h3>
              <p className="text-gray-600">We match you with lenders who specialize in your industry and loan type, leveraging our network of banks and financial institutions</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-blue-600" />
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
                Zero Upfront Costs: You Only Pay at Loan Closing
              </p>
              <p className="text-gray-600 text-sm max-w-2xl mx-auto">
                This means you don't pay us until your loan is approved and funded. Our fee is simply included in your closing costs, just like other standard loan fees. If you don't get approved for a loan, you don't owe us anything.
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
      <section className="bg-blue-900 text-white py-8">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-6">
              Choose your path to funding success
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-blue-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Start Your Application Now
              </button>
              <button className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors border border-white">
                Find Your Perfect Lender
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}