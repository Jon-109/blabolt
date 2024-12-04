'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { 
      path: 'https://form.jotform.com/223035998535061', 
      label: 'Can You Afford a Loan? Check Now—Free & Fast',
      isExternal: true  // Add this flag to identify external links
    },
    { path: '/cash-flow-analysis', label: 'Cash Flow Analysis' },
    { path: '/loan-services', label: 'Loan Services' },
    { path: '/faq', label: 'FAQ' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="text-2xl font-bold text-blue-900">
            <Image 
              src="/images/BusLendAdv_Final_4c.jpg"
              alt="Business Lending Advocate Logo"
              width={200}
              height={57}
              priority
              className="h-[40px] md:h-[57px] w-auto"
            />          
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              item.isExternal ? (
                <a
                  key={item.path}
                  href={item.path}
                  className={`font-semibold transition-colors ${
                    item.path === 'https://form.jotform.com/223035998535061'
                      ? 'bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 ml-4'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.path}
                  href={item.path}
                  className="font-semibold text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            {navItems.map((item) => (
              item.isExternal ? (
                <a
                  key={item.path}
                  href={item.path}
                  className={`block py-2 font-semibold ${
                    item.path === 'https://form.jotform.com/223035998535061'
                      ? 'bg-blue-500 text-white px-4 rounded-lg hover:bg-blue-600 my-2'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`block py-2 font-semibold ${
                    item.path === 'https://form.jotform.com/223035998535061'
                      ? 'bg-blue-500 text-white px-4 rounded-lg hover:bg-blue-600 my-2'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}