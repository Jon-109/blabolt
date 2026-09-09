'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import ContactFormModal from '@/app/(components)/shared/ContactFormModal';

const Footer = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const pathname = usePathname();

  if (pathname.startsWith('/report/print/') || pathname.startsWith('/report/template/')) return null;

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Business Lending Advocate</h3>
            <p className="text-gray-400">
              Expert financial guidance for your business growth and success.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/cash-flow-analysis" className="text-gray-400 hover:text-white transition-colors">
                  Can You Afford A Loan?
                </Link>
              </li>
              <li>
                <Link href="/cash-flow-analysis" className="text-gray-400 hover:text-white transition-colors">
                  Cash Flow Analysis
                </Link>
              </li>
              <li>
                <Link href="/loan-services" className="text-gray-400 hover:text-white transition-colors">
                  Loan Packaging
                </Link>
              </li>
              <li>
                <Link href="/services/templates-bundle" className="text-gray-400 hover:text-white transition-colors">
                  Templates
                </Link>
              </li>
              <li>
                <Link href="/loan-services" className="text-gray-400 hover:text-white transition-colors">
                  Loan Brokering
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Email: jonathan@businesslendingadvocate.com</li>
              <li>Phone: <a href="tel:210-370-7402" className="hover:underline">210-370-7402</a></li>
              <li>
                <button type="button" onClick={() => setIsContactModalOpen(true)} className="text-gray-400 transition-colors hover:text-white hover:underline">
                  Contact Form
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Business Lending Advocate. All rights reserved.</p>
        </div>
      </div>
      <ContactFormModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} source="footer-funding-interest" />
    </footer>
  );
};

export default Footer;
