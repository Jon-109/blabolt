"use client";

import React from 'react';
import { Plus, Minus } from 'lucide-react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const faqs = [
    {
      question: "What is a DSCR and why is it important?",
      answer: "The Debt Service Coverage Ratio (DSCR) is a measure of your business's ability to pay its debt obligations. It's calculated by dividing your net operating income by your total debt service. Lenders typically look for a DSCR of 1.25 or higher, as it indicates your business generates enough income to comfortably cover loan payments."
    },
    {
      question: "How long does the loan application process take?",
      answer: "The timeline varies depending on the loan type and lender, but typically ranges from 2-8 weeks. SBA loans usually take longer (60-90 days), while some alternative lending options can be completed in as little as a week. We'll provide a more specific timeline based on your situation during our consultation."
    },
    {
      question: "What documents do I need to apply for a business loan?",
      answer: "Common requirements include: 3 years of business tax returns, 3 years of personal tax returns, year-to-date financial statements, bank statements, business licenses, and a business plan. The exact requirements vary by lender and loan type. We'll provide a detailed checklist based on your specific situation."
    },
    {
      question: "What types of loans do you help with?",
      answer: "We assist with various loan types including: SBA loans, traditional bank loans, equipment financing, working capital loans, commercial real estate loans, and alternative lending options. We'll help determine the best type of financing based on your business needs and qualifications."
    },
    {
      question: "Do you guarantee loan approval?",
      answer: "While we can't guarantee approval, we significantly improve your chances by: preparing professional loan packages, matching you with appropriate lenders, and addressing potential issues before submission. Our experience helps optimize your application for the best possible outcome."
    },
    {
      question: "What are your fees?",
      answer: "Our fees vary based on the services provided. The initial consultation is free, and we'll provide a clear fee structure before beginning any work. For loan brokering, we typically earn a success fee only when your loan closes. For loan packaging and analysis services, we charge flat fees that we'll discuss upfront."
    },
    {
      question: "How do you choose which lenders to work with?",
      answer: "We maintain relationships with a diverse network of reputable lenders. We select lenders based on: their track record, competitive rates and terms, industry expertise, and reliability. We match you with lenders that best fit your specific needs and situation."
    },
    {
      question: "What if my business has less-than-perfect credit?",
      answer: "We work with businesses across the credit spectrum. While perfect credit isn't always required, we'll help you understand your options and may recommend steps to improve your credit profile. We have experience with lenders who focus more on business performance and cash flow than credit scores."
    }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl">
              Find answers to common questions about our services and the business
              lending process.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition-colors"
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  >
                    <span className="text-lg font-semibold text-gray-900">
                      {faq.question}
                    </span>
                    {openIndex === index ? (
                      <Minus className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    ) : (
                      <Plus className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                  {openIndex === index && (
                    <div className="p-6 bg-gray-50 border-t border-gray-200">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Still Have Questions?
            </h2>
            <p className="text-gray-600 mb-8">
              We're here to help. Contact us for a free consultation and get
              answers to your specific questions.
            </p>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Contact Us
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}