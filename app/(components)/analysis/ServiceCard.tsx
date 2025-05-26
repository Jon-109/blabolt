import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/app/(components)/ui/card';
import { Check } from 'lucide-react';

const checklist = [
  'Custom cover letter that tells your business story and clearly explains your funding request',
  'Clear list of required documents based on your loan purpose',
  'Templates and help gathering financials, tax docs, and other paperwork',
  'Final package you can confidently bring to your bank or any lender',
];

const brokeringChecklist = [
  'Full Loan Packaging service included',
  'We match you with lenders who fit your needs',
  'We negotiate rates & terms and guide you through underwriting',
  'We only get paid if you get funded (via closing costs—no upfront fees)',
  'We help speed up the process so you get funded faster.',
];

const ServiceCard = () => (
  <div className="flex flex-col md:flex-row gap-8">
    {/* Loan Packaging Card */}
    <Card className="flex-1 shadow-lg border-2 border-gray-100">
      <CardContent className="pt-8 pb-4 px-6 md:px-8 flex flex-col h-full">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Loan Packaging</h2>
        <p className="text-gray-700 text-base mb-2 font-bold">
          For business owners who need a loan but don’t know where to start.
        </p>
        <p className="text-gray-600 mb-4">
          We’ll guide you step-by-step to build a professional, lender-ready loan application package—so you don’t have to figure it out alone.
        </p>
        <ul className="mb-4 space-y-2">
          {checklist.map((item, i) => (
            <li key={i} className="flex items-start text-gray-800 text-base">
              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <span className="block text-gray-700 text-sm mb-1"><span className="font-semibold">Perfect for businesses with at least 2 years of history who want to look polished, credible, and ready in the eyes of lenders.</span></span>
        </div>
        <div className="mt-auto">
          <div className="mb-5 text-center">
            <span className="block text-3xl font-extrabold text-primary mb-1">$499</span>
            <span className="block text-sm text-gray-600 font-medium">One-time fee</span>
          </div>
          <div className="flex justify-center">
            <Link
              href="#get-guidance"
              className="inline-block bg-[#002c55] text-white font-semibold rounded px-5 py-2 shadow hover:bg-[#002c55]/90 transition"
            >
              Get Step-by-Step Guidance →
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Loan Brokering Card */}
    <Card className="flex-1 shadow-lg border-2 border-gray-100">
      <CardContent className="pt-8 pb-4 px-6 md:px-8 flex flex-col h-full">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Loan Brokering</h2>
        <p className="text-left text-gray-700 text-base mb-2 font-bold">
          Want us to find the right lender for you? We’ll handle it.
        </p>

        <p className="text-gray-600 mb-4">
          This includes everything in our Loan Packaging service—for free—plus we actively reach out to our lender network and negotiate on your behalf.
        </p>
        <ul className="mb-4 space-y-2">
          {brokeringChecklist.map((item, i) => (
            <li key={i} className="flex items-start text-gray-800 text-base">
              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <span className="block text-gray-700 text-sm mb-1"><span className="font-semibold">We work for you, not the bank. You’ll have a loan expert by your side the entire time, increasing your chances of approval.</span></span>
        </div>
        <div className="mt-auto">
          <div className="mb-5 text-center">
            <span className="block text-3xl font-extrabold text-primary mb-1">1% of funded loan</span>
            <span className="block text-sm text-gray-600 font-medium">Only if you’re approved</span>
          </div>
          <div className="flex justify-center">
            <Link
              href="#find-offer"
              className="inline-block bg-[#002c55] text-white font-semibold rounded px-5 py-2 shadow hover:bg-[#002c55]/90 transition"
            >
              Find My Best Loan Offer →
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default ServiceCard;
