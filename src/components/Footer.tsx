import React from 'react';
import { Phone, Mail, MapPin, Facebook, Linkedin, Twitter, Instagram } from 'lucide-react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center">
                <Phone className="w-5 h-5 mr-2 text-blue-400" />
                <span>210-903-3433</span>
              </li>
              <li className="flex items-start">
                <Mail className="w-5 h-5 mr-2 text-blue-400 mt-1" />
                <span className="break-all">jonathan@businesslendingadvocate.com</span>
              </li>
              <li className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-400" />
                <span>7113 San Pedro Ave., #200<br />San Antonio, TX, 78216</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-blue-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/cash-flow-analysis" className="hover:text-blue-400 transition-colors">
                  Cash Flow Analysis
                </Link>
              </li>
              <li>
                <Link href="/loan-services" className="hover:text-blue-400 transition-colors">
                  Loan Services
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-blue-400 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/businesslendingadvocate/" className="hover:text-blue-400 transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="https://www.linkedin.com/company/79665466/admin/dashboard/" className="hover:text-blue-400 transition-colors">
                <Linkedin className="w-6 h-6" />
              </a>
              <a href="https://x.com/lendingadvocate" className="hover:text-blue-400 transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="https://www.instagram.com/businesslendingadvocate?igsh=MXM1ZTBhMnl6YTI1bA==" className="hover:text-blue-400 transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Disclaimer</h3>
            <p className="text-sm text-gray-400">
              Business Lending Advocate is not a lender or bank. We provide expert guidance to help small businesses navigate the lending process and find the best solutions for their needs.
            </p>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Business Lending Advocate. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;