'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, ShieldCheck } from 'lucide-react';
import { supabase } from '@/supabase/helpers/client';
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

const KNOWN_ADMIN_EMAILS = new Set([
  'jonathan@businesslendingadvocate.com',
  'rosantina@businesslendingadvocate.com',
  'jonathanfaranda@gmail.com',
]);

function isKnownAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return KNOWN_ADMIN_EMAILS.has(email.toLowerCase());
}

function prettifyName(raw: string): string {
  return raw
    .trim()
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function getDisplayName(user: User | null): string | null {
  if (!user) return null;

  const meta = user.user_metadata ?? {};
  const candidate =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    (typeof meta.preferred_username === 'string' && meta.preferred_username) ||
    (typeof user.email === 'string' ? user.email.split('@')[0] : null);

  if (!candidate) return null;
  const fullName = prettifyName(candidate);
  const firstName = fullName.split(' ')[0]?.trim();
  return firstName || fullName;
}

async function syncServerSession(session: Session | null) {
  if (!session?.access_token || !session.refresh_token) {
    return;
  }

  await fetch('/api/auth/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
    }),
  }).catch(() => undefined);
}

async function clearServerSession() {
  await fetch('/api/auth/session', {
    method: 'DELETE',
  }).catch(() => undefined);
}

const Header = () => {
  const router = useRouter();
  const pathname = usePathname() ?? '';

  const isPackagingWorkspace =
    pathname === '/templates' ||
    pathname.startsWith('/templates/') ||
    pathname === '/loan-packaging' ||
    pathname.startsWith('/loan-packaging/');

  const hideAffordabilityCta =
    isPackagingWorkspace || pathname.startsWith('/comprehensive-cash-flow-analysis');

  if (pathname.startsWith('/report/print/')) return null;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canAccessComprehensive, setCanAccessComprehensive] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAccessStatus = async (fallbackAdmin = false, fallbackLoggedIn = false) => {
    try {
      const res = await fetch('/api/access/me', { cache: 'no-store' });
      if (!res.ok) {
        setIsLoggedIn(fallbackLoggedIn);
        setIsAdmin(fallbackAdmin);
        setCanAccessComprehensive(false);
        return;
      }

      const json = await res.json();
      setIsLoggedIn(Boolean(json?.isAuthenticated) || fallbackLoggedIn);
      setIsAdmin(Boolean(json?.isAdmin) || fallbackAdmin);
      setCanAccessComprehensive(Boolean(json?.canAccessComprehensive));
    } catch {
      setIsLoggedIn(fallbackLoggedIn);
      setIsAdmin(fallbackAdmin);
      setCanAccessComprehensive(false);
    }
  };

  const applyUserState = async (user: User | null) => {
    if (!user) {
      setIsLoggedIn(false);
      setIsAdmin(false);
      setCanAccessComprehensive(false);
      setDisplayName(null);
      return;
    }

    const localAdmin = isKnownAdminEmail(user.email);
    setIsLoggedIn(true);
    setIsAdmin(localAdmin);
    setDisplayName(getDisplayName(user));
    await checkAccessStatus(localAdmin, true);
  };

  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data?.session?.user) {
          setDisplayName(null);
          await checkAccessStatus(false, false);
        } else {
          await syncServerSession(data.session);
          await applyUserState(data.session.user);
        }
      } catch {
        await applyUserState(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await syncServerSession(session);
          await applyUserState(session.user);
        } else if (event === 'SIGNED_OUT') {
          await clearServerSession();
          await applyUserState(null);
        }
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    await clearServerSession();
    setIsMobileMenuOpen(false);
    router.push('/login');
  };

  const greeting = useMemo(() => {
    if (!displayName) return 'Hi';
    return `Hi, ${displayName}`;
  }, [displayName]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center" id="header-logo-link">
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

        <button
          className="md:hidden flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          aria-label="Open navigation menu"
          id="header-mobile-menu-open"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <span className="sr-only">Open navigation menu</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="hidden items-center gap-2 md:flex">
          {isPackagingWorkspace ? (
            <>
              {isLoggedIn && isAdmin ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                  id="header-link-admin-dashboard"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </Link>
              ) : null}
              {isLoggedIn && canAccessComprehensive ? (
                <Link
                  href="/comprehensive-cash-flow-analysis"
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800"
                  id="header-link-dscr-check"
                >
                  DSCR Check
                </Link>
              ) : null}
              <Link
                href="/templates"
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800"
                id="header-link-templates"
              >
                Templates
              </Link>
              <Link
                href="/loan-packaging"
                className="rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                id="header-link-loan-packaging"
              >
                Loan Package
              </Link>
            </>
          ) : (
            <>
              {!hideAffordabilityCta ? (
                <Link
                  href="/cash-flow-analysis?showCalculator=true"
                  className="rounded-full bg-gradient-to-r from-slate-900 to-sky-900 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:from-slate-800 hover:to-sky-800"
                  id="header-cta-find-out-free"
                >
                  Free DSCR Check
                </Link>
              ) : null}
              <Link
                href="/cash-flow-analysis"
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                id="header-link-cash-flow-analysis"
              >
                Cash Flow Analysis
              </Link>
              <Link
                href="/loan-services"
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                id="header-link-loan-services"
              >
                Loan Services
              </Link>
              {isLoggedIn && isAdmin ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                  id="header-link-admin-dashboard"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </Link>
              ) : null}
            </>
          )}

          {isLoading ? (
            <div className="ml-2 h-10 w-28 animate-pulse rounded-full bg-slate-100" />
          ) : isLoggedIn ? (
            <div className="ml-2 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{greeting}</span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                id="header-button-logout"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 rounded-full border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white"
              id="header-link-login"
            >
              Login / Sign Up
            </Link>
          )}
        </div>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm md:hidden" aria-modal="true" role="dialog">
            <div className="relative flex h-full w-4/5 max-w-xs flex-col overflow-y-auto rounded-l-2xl bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-4 py-4 backdrop-blur">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center" id="header-mobile-logo-link">
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
                  className="rounded-lg border border-slate-200 p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  aria-label="Close navigation menu"
                  id="header-mobile-menu-close"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="flex flex-col gap-2 px-4 py-4">
                {!isPackagingWorkspace && !hideAffordabilityCta ? (
                  <Link
                    href="/cash-flow-analysis?showCalculator=true"
                    className="mb-2 rounded-xl bg-gradient-to-r from-slate-900 to-sky-900 px-4 py-3 text-center text-base font-bold text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                    id="header-mobile-cta-find-out-free"
                  >
                    Free DSCR Check
                  </Link>
                ) : null}

                {isPackagingWorkspace ? (
                  <>
                    {isLoggedIn && isAdmin ? (
                      <MenuItem href="/admin" label="Admin" onClick={() => setIsMobileMenuOpen(false)} id="header-mobile-link-admin-dashboard" />
                    ) : null}
                    {isLoggedIn && canAccessComprehensive ? (
                      <MenuItem href="/comprehensive-cash-flow-analysis" label="DSCR Check" onClick={() => setIsMobileMenuOpen(false)} id="header-mobile-link-dscr-check" />
                    ) : null}
                    <MenuItem href="/templates" label="Templates" onClick={() => setIsMobileMenuOpen(false)} id="header-mobile-link-templates" />
                    <MenuItem href="/loan-packaging" label="Loan Package" onClick={() => setIsMobileMenuOpen(false)} id="header-mobile-link-loan-packaging" />
                  </>
                ) : (
                  <>
                    <MenuItem href="/cash-flow-analysis" label="Cash Flow Analysis" onClick={() => setIsMobileMenuOpen(false)} id="header-mobile-link-cash-flow-analysis" />
                    <MenuItem href="/loan-services" label="Loan Services" onClick={() => setIsMobileMenuOpen(false)} id="header-mobile-link-loan-services" />
                  </>
                )}

                {isLoggedIn ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-700">{greeting}</p>
                    <button
                      onClick={handleSignOut}
                      className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                      id="header-mobile-button-logout"
                    >
                      <LogOut className="h-4 w-4" />
                      Log Out
                    </button>
                  </div>
                ) : (
                  <MenuItem href="/login" label="Login / Sign Up" onClick={() => setIsMobileMenuOpen(false)} id="header-mobile-link-login" />
                )}
              </nav>
            </div>
            <div className="flex-1" tabIndex={-1} aria-hidden="true" id="header-mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
          </div>
        )}
      </nav>
    </header>
  );
};

type MenuItemProps = {
  href: string;
  label: string;
  onClick?: () => void;
  id?: string;
};

const MenuItem = ({ href, label, onClick, id }: MenuItemProps) => (
  <Link
    href={href}
    className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-lg font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800"
    onClick={onClick}
    id={id}
  >
    {label}
  </Link>
);

export default Header;
