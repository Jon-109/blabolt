'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  faqs: FAQ[];
}

export default function FAQAccordion({ faqs }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
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
  );
}