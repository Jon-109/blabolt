import React from 'react';
import Link from 'next/link';

const FAQPrompt: React.FC = () => {
  return (
    <div className="mt-10 p-6 bg-gray-50 rounded-lg border border-gray-200 max-w-2xl mx-auto">
      <h3 className="text-lg font-medium text-gray-700 mb-2">Have Questions?</h3>
      <p className="text-gray-600 mb-4">
        Find answers to common questions about our services and the loan process.
      </p>
      <Link href="/faq" className="text-blue-600 hover:underline font-medium">
         Visit our FAQ Page →
      </Link>
       <p className="text-sm text-gray-500 mt-4">
         Or call us directly at <a href="tel:2105552274" className="underline hover:text-blue-700">(210) 555-CASH</a> for immediate assistance.
       </p>
    </div>
  );
};

export default FAQPrompt;
