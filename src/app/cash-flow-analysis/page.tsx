import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  DollarSign,
  BarChart3,
  Users,
  ArrowRight
} from 'lucide-react';
import Testimonials from '@/components/Testimonials';

const ComparisonTable = () => {
  const features = [
    { name: 'Cost', quick: 'Free', comprehensive: '$99' },
    { name: 'Time to Complete', quick: 'Less than 5 minutes', comprehensive: '~30 minutes' },
    { name: 'Level of Detail', quick: 'High-level overview', comprehensive: 'In-depth, bank-level accuracy' },
    { name: 'Analysis Period', quick: 'Most recent full year', comprehensive: 'Last 2 years + Year-to-date (bank standard)' },
    { name: 'Downloadable PDF Report', quick: 'Yes - Basic', comprehensive: 'Yes - Comprehensive' },
    { name: 'Ideal For', quick: 'Fast financial check-up', comprehensive: 'Loan readiness, detailed insights' }
  ];

  return (
    <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-md">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left p-4 bg-gray-100 border-b border-gray-300">Feature</th>
            <th className="text-left p-4 bg-gray-100 border-b border-gray-300">Quick Cash Flow Analysis</th>
            <th className="text-left p-4 bg-gray-100 border-b border-gray-300">Comprehensive Cash Flow Analysis</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr key={index} className="border-t border-gray-300">
              <td className="p-4 font-medium">{feature.name}</td>
              <td className="p-4">{feature.quick}</td>
              <td className="p-4">{feature.comprehensive}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function CashFlowAnalysis() {
  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Unlock Financing Opportunities with Cash Flow Confidence!
            </h1>
            <p className="text-xl mb-4">
              We Make Understanding Your Loan Readiness Simple and Stress-Free.
            </p>
            <p className="text-lg mb-8">
              Our Cash Flow Analysis Services provide clarity and confidence. Discover if your finances meet funding requirements with ease. From quick assessments to comprehensive, lender-ready reports, we've got you covered.
            </p>
            <button className="px-8 py-4 bg-white text-blue-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Start Your Free Cash Flow Check Now
            </button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-8">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">
            Two Levels of Cash Flow Analysis
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
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
      </section>

      {/* Why It Matters Section */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Why Cash Flow Analysis Matters for Financing
            </h2>
            <p className="text-lg mb-6 text-center">
              Cash flow is the key to loan approval. Banks and lenders evaluate your ability to manage debt and maintain financial stability. With our services, you'll:
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Understand Your Standing</h3>
                <p className="text-gray-200">Get clear insights into your financial position</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowRight className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Spot Improvements</h3>
                <p className="text-gray-200">Identify areas that need attention</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Approach with Confidence</h3>
                <p className="text-gray-200">Face lenders with clarity and preparation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
      <section className="bg-blue-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-6">
              Empower your financing journey with clarity and confidence today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-blue-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Start Quick Analysis for Free
              </button>
              <button className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
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
    </div>
  );
}