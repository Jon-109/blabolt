"use client";

import React from 'react';
import { Plus, Minus, Search, MessageCircle, Mail, Phone } from 'lucide-react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  const categories = [
    {
      name: "Loan Process",
      icon: "🔄",
      faqs: [
        {
          question: "How long does the loan application process take?",
          answer: "The timeline varies depending on the loan type and lender, but typically ranges from 2-8 weeks. SBA loans usually take longer (60-90 days), while some alternative lending options can be completed in as little as a week. We'll provide a more specific timeline based on your situation during our consultation."
        },
        {
          question: "What documents do I need to apply for a business loan?",
          answer: "Common requirements include: 3 years of business tax returns, 3 years of personal tax returns, year-to-date financial statements, bank statements, business licenses, and a business plan. The exact requirements vary by lender and loan type. We'll provide a detailed checklist based on your specific situation."
        }
      ]
    },
    {
      name: "Financial Terms",
      icon: "💰",
      faqs: [
        {
          question: "What is a DSCR and why is it important?",
          answer: "The Debt Service Coverage Ratio (DSCR) is a measure of your business's ability to pay its debt obligations. It's calculated by dividing your net operating income by your total debt service. Lenders typically look for a DSCR of 1.25 or higher, as it indicates your business generates enough income to comfortably cover loan payments."
        }
      ]
    },
    {
      name: "Our Services",
      icon: "🤝",
      faqs: [
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
        }
      ]
    },
    {
      name: "Lender Relations",
      icon: "🏦",
      faqs: [
        {
          question: "How do you choose which lenders to work with?",
          answer: "We maintain relationships with a diverse network of reputable lenders. We select lenders based on: their track record, competitive rates and terms, industry expertise, and reliability. We match you with lenders that best fit your specific needs and situation."
        },
        {
          question: "What if my business has less-than-perfect credit?",
          answer: "We work with businesses across the credit spectrum. While perfect credit isn't always required, we'll help you understand your options and may recommend steps to improve your credit profile. We have experience with lenders who focus more on business performance and cash flow than credit scores."
        }
      ]
    }
  ];

  const filteredCategories = categories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              How Can We Help You?
            </h1>
            <p className="text-xl mb-8">
              Find answers to common questions about our services and the business
              lending process.
            </p>
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search for answers..."
                className="w-full px-6 py-4 rounded-lg text-gray-900 bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {filteredCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">{category.icon}</span>
                  <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                </div>
                <div className="space-y-4">
                  {category.faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:border-blue-200 transition-colors"
                    >
                      <button
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                      >
                        <span className="text-lg font-semibold text-gray-900 pr-8">
                          {faq.question}
                        </span>
                        {openIndex === index ? (
                          <Minus className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        ) : (
                          <Plus className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
                      </button>
                      <div
                        className={`transition-all duration-300 ease-in-out ${
                          openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        } overflow-hidden`}
                      >
                        <div className="p-6 bg-gray-50 border-t border-gray-100">
                          <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">
              Still Have Questions?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-8 rounded-xl">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Live Chat</h3>
                <p className="text-gray-600 mb-4">Chat with our team in real-time</p>
                <button className="text-blue-600 font-semibold hover:text-blue-700">
                  Start Chat
                </button>
              </div>
              <div className="bg-gray-50 p-8 rounded-xl">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Email Us</h3>
                <p className="text-gray-600 mb-4">Get a response within 24 hours</p>
                <button className="text-blue-600 font-semibold hover:text-blue-700">
                  Send Email
                </button>
              </div>
              <div className="bg-gray-50 p-8 rounded-xl">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Call Us</h3>
                <p className="text-gray-600 mb-4">Mon-Fri from 9am to 5pm</p>
                <button className="text-blue-600 font-semibold hover:text-blue-700">
                  (555) 123-4567
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}