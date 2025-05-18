'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/supabase/helpers/client';
import { ChevronDown } from 'lucide-react';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

import { usePathname } from 'next/navigation';

import { useRouter } from 'next/navigation';

const Header = () => {
  const router = useRouter();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  // Hide header on print/PDF pages
  if (pathname.startsWith('/report/print/')) return null;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error checking auth status:', error);
        setIsLoggedIn(false);
        setUserEmail(null);
      } else if (data?.session?.user?.email) {
        setIsLoggedIn(true);
        setUserEmail(data.session.user.email);
      } else {
        setIsLoggedIn(false);
        setUserEmail(null);
      }
      setIsLoading(false);
    };

    checkUser();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' && session?.user?.email) {
          setIsLoggedIn(true);
          setUserEmail(session.user.email);
        } else if (event === 'SIGNED_OUT') {
          setIsLoggedIn(false);
          setUserEmail(null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex-shrink-0">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/BusLendAdv_Final_4c.jpg"
              alt="Business Lending Advisors Logo"
              width={150}
              height={58}
              className="object-contain"
              priority
            />
          </Link>
        </div>

        {/* Hamburger menu button for mobile */}
        <button
          className="md:hidden flex items-center justify-center p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#002c55]"
          aria-label="Open navigation menu"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <span className="sr-only">Open navigation menu</span>
          <svg className="h-7 w-7 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center space-x-8">
          <Link 
            href="/cash-flow-analysis?showCalculator=true"
            className="bg-[#002c55] text-white px-6 py-2 rounded-md hover:bg-[#002c55]/90 transition-colors font-medium"
          >
            Can You Afford A Loan? - Find Out for FREE
          </Link>
          <Link 
            href="/cash-flow-analysis"
            className="text-gray-700 hover:text-gray-900 font-medium"
          >
            Cash Flow Analysis
          </Link>
          <Link 
            href="/loan-services" 
            className="text-gray-700 hover:text-gray-900 font-medium"
          >
            Loan Services
          </Link>
          
          {isLoading ? (
            <div className="w-24 h-10 bg-gray-100 animate-pulse rounded-md"></div>
          ) : isLoggedIn ? (
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-[#002c55] to-[#002c55]/80 text-white font-bold rounded-lg shadow-lg border-2 border-[#002c55] hover:from-[#002c55]/80 hover:to-[#002c55]/70 transition-all duration-200 outline-none focus:ring-2 focus:ring-[#002c55]/50"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
                style={{ boxShadow: '0 2px 8px rgba(30,64,175,0.10)' }}
              >
                <span>My Services</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                  onBlur={closeDropdown}
                >
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <Link 
                      href="/comprehensive-cash-flow-analysis" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      onClick={closeDropdown}
                      role="menuitem"
                    >
                      Cash Flow Analysis (DSCR)
                    </Link>

                    <button 
                      onClick={async () => {
                        await supabase.auth.signOut();
                        closeDropdown();
                        router.push('/login');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 hover:text-red-700"
                      role="menuitem"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/login"
              className="text-[#002c55] hover:text-[#002c55]/80 border border-[#002c55] px-4 py-2 rounded-md hover:bg-blue-50 transition-colors font-medium"
            >
              Login / Sign Up
            </Link>
          )}
        </div>
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end md:hidden"
          aria-modal="true"
          role="dialog"
        >
          {/* Sidebar menu */}
          <div className="bg-white w-4/5 max-w-xs h-full shadow-2xl flex flex-col relative rounded-l-2xl animate-slide-in-right overflow-y-auto">
            {/* Sticky header with logo and close button */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 bg-white/80 backdrop-blur border-b border-gray-100">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center">
                <Image
                  src="/images/BusLendAdv_Final_4c.jpg"
                  alt="Business Lending Advisors Logo"
                  width={110}
                  height={42}
                  className="object-contain"
                  priority
                />
              </Link>
              <button
                className="p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#002c55]"
                aria-label="Close navigation menu"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu content */}
            <nav className="flex flex-col gap-2 px-4 pt-2 pb-8">
              {/* CTA Section */}
              <Link
                href="/cash-flow-analysis?showCalculator=true"
                className="mt-2 mb-4 bg-gradient-to-r from-[#002c55] to-[#002c55]/80 text-white px-4 py-3 rounded-xl text-base font-bold text-center shadow-md hover:from-[#002c55]/80 hover:to-[#002c55]/70 transition-colors focus:outline-none focus:ring-2 focus:ring-[#002c55]/50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Can You Afford A Loan? - Find Out for FREE
              </Link>

              <hr className="my-2 border-gray-200" />

              {/* Main Navigation */}
              <MenuItem
                href="/cash-flow-analysis"
                label="Cash Flow Analysis"
                onClick={() => setIsMobileMenuOpen(false)}
                large
              />
              <MenuItem
                href="/loan-services"
                label="Loan Services"
                onClick={() => setIsMobileMenuOpen(false)}
                large
              />

              {/* My Services Dropdown (only if logged in) */}
              {isLoading ? (
                <div className="w-24 h-10 bg-gray-100 animate-pulse rounded-md mt-2" />
              ) : isLoggedIn ? (
                <MyServicesDropdown
                  setIsMobileMenuOpen={setIsMobileMenuOpen}
                  router={router}
                />
              ) : null}

              <hr className="my-2 border-gray-200" />

              {/* Account Section */}
              {isLoading ? null : !isLoggedIn ? (
                <MenuItem
                  href="/login"
                  label="Login / Sign Up"
                  onClick={() => setIsMobileMenuOpen(false)}
                  large
                />
              ) : null}
            </nav>
          </div>
          {/* Overlay click closes menu */}
          <div
            className="flex-1"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        </div>
      )}
    </nav>
  </header>
);
};

// MenuItem component for DRYness and larger font
// (useState already imported at the top)

type MenuItemProps = {
  href: string;
  label: string;
  onClick?: () => void;
  small?: boolean;
  large?: boolean;
};
const MenuItem = ({ href, label, onClick, small, large }: MenuItemProps) => (
  <Link
    href={href}
    className={`flex items-center px-3 py-4 rounded-lg transition-colors ${large ? 'text-xl font-semibold' : small ? 'text-base pl-6' : 'text-lg font-medium'} text-gray-700 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200`}
    onClick={onClick}
  >
    {label}
  </Link>
);

// MyServicesDropdown for mobile menu
const MyServicesDropdown = ({ setIsMobileMenuOpen, router }: { setIsMobileMenuOpen: (open: boolean) => void; router: any }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col">
      <button
        className="flex items-center justify-between w-full px-3 py-4 rounded-lg text-xl font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="my-services-dropdown"
      >
        <span>My Services</span>
        <svg className={`w-6 h-6 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div id="my-services-dropdown" className="flex flex-col gap-1 pb-2">
          <MenuItem
            href="/comprehensive-cash-flow-analysis"
            label="Cash Flow Analysis (DSCR)"
            onClick={() => setIsMobileMenuOpen(false)}
            small
          />

          <button
            onClick={async () => {
              // @ts-ignore
              await supabase.auth.signOut();
              setIsMobileMenuOpen(false);
              router.push('/login');
            }}
            className="flex items-center px-3 py-3 rounded-lg text-base pl-6 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-200 text-left"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;

