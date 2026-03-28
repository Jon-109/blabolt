'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { CheckCircle2, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { isTemplateType } from '@/lib/stripe/catalog';
import { supabase } from '@/supabase/helpers/client';

type LoginFlow = {
  badge: string;
  steps: [string, string, string];
  subtitle: string;
  title: string;
};

type AuthMethod = 'email' | 'google' | null;

function normalizeRedirectTarget(target: string | null): string {
  if (!target) {
    return '/';
  }

  try {
    return decodeURIComponent(target);
  } catch {
    return target;
  }
}

function getSafeRedirectPath(target: string | null): string {
  const normalized = normalizeRedirectTarget(target);
  if (!normalized.startsWith('/') || normalized.startsWith('//')) {
    return '/';
  }

  return normalized;
}

function getLoginFlow(redirectTo: string | null): LoginFlow {
  const normalizedPath = getSafeRedirectPath(redirectTo);
  const pathWithoutQuery = (normalizedPath.split('?')[0] ?? '/').toLowerCase();
  const isCheckout = pathWithoutQuery.startsWith('/checkout/');
  const checkoutProductType = isCheckout
    ? (pathWithoutQuery.slice('/checkout/'.length).split('/')[0] ?? null)
    : null;
  const isTemplateFlow =
    pathWithoutQuery === '/templates' ||
    pathWithoutQuery.startsWith('/templates/') ||
    pathWithoutQuery.startsWith('/services/templates') ||
    checkoutProductType === 'templates_bundle' ||
    (checkoutProductType ? isTemplateType(checkoutProductType) : false);

  if (pathWithoutQuery.startsWith('/loan-brokering')) {
    return {
      badge: 'Loan Brokering',
      title: 'Sign in to continue',
      subtitle: 'Secure access for your brokering flow.',
      steps: ['Sign in', 'Sign Broker Agreement', 'Loan Packaging'],
    };
  }

  if (checkoutProductType === 'loan_packaging' || pathWithoutQuery.startsWith('/loan-packaging')) {
    const isPaymentFlow = checkoutProductType === 'loan_packaging';

    return {
      badge: 'Loan Packaging',
      title: isPaymentFlow ? 'Sign in before payment' : 'Sign in to continue',
      subtitle: isPaymentFlow ? 'Login first, then complete payment for packaging.' : 'Resume your packaging workspace.',
      steps: isPaymentFlow
        ? ['Sign in', 'Complete payment', 'Open packaging']
        : ['Sign in', 'Return to packaging', 'Continue'],
    };
  }

  if (
    checkoutProductType === 'cash_flow_analysis' ||
    pathWithoutQuery.startsWith('/comprehensive-cash-flow-analysis')
  ) {
    const isPaymentFlow = checkoutProductType === 'cash_flow_analysis';

    return {
      badge: 'Comprehensive Analysis',
      title: isPaymentFlow ? 'Sign in before payment' : 'Sign in to continue',
      subtitle: isPaymentFlow ? 'Login first, then complete payment for access.' : 'Resume your analysis workspace.',
      steps: isPaymentFlow
        ? ['Sign in', 'Complete payment', 'Open analysis']
        : ['Sign in', 'Return to analysis', 'Continue'],
    };
  }

  if (isTemplateFlow) {
    const isPaymentFlow =
      checkoutProductType === 'templates_bundle' ||
      (checkoutProductType ? isTemplateType(checkoutProductType) : false);

    return {
      badge: 'Templates',
      title: isPaymentFlow ? 'Sign in before payment' : 'Sign in to continue',
      subtitle: isPaymentFlow ? 'Login first, then complete payment for templates.' : 'Resume your templates workspace.',
      steps: isPaymentFlow
        ? ['Sign in', 'Complete payment', 'Open templates']
        : ['Sign in', 'Return to templates', 'Continue'],
    };
  }

  return {
    badge: 'Account Access',
    title: 'Sign in to your workspace',
    subtitle: 'Pick up where you left off.',
    steps: ['Sign in', 'Return to page', 'Continue'],
  };
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 18 18">
      <path
        d="M17.64 9.20455c0-.63818-.05727-1.25182-.16364-1.84091H9v3.48182h4.84364c-.20864 1.125-.84273 2.07955-1.79591 2.71818v2.25818h2.90864c1.70182-1.56681 2.68363-3.87682 2.68363-6.61727Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.46727-.80591 5.95636-2.17818l-2.90864-2.25818c-.80591.54-1.83682.85909-3.04772.85909-2.34409 0-4.32818-1.58318-5.03636-3.70909H.95636v2.33182A8.9986 8.9986 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.96364 10.71364A5.4109 5.4109 0 0 1 3.68182 9c0-.59591.10227-1.17409.28182-1.71364V4.95455H.95636A8.99868 8.99868 0 0 0 0 9c0 1.45091.34773 2.82409.95636 4.04591l3.00728-2.33227Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.57727c1.32136 0 2.50773.45409 3.44182 1.34591l2.58136-2.58136C13.46318.89091 11.42636 0 9 0A8.9986 8.9986 0 0 0 .95636 4.95455l3.00728 2.33181C4.67182 5.16045 6.65591 3.57727 9 3.57727Z"
        fill="#EA4335"
      />
    </svg>
  );
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
  });
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeRedirectTo = getSafeRedirectPath(searchParams.get('redirectTo'));
  const loginFlow = getLoginFlow(safeRedirectTo);

  const [authMethod, setAuthMethod] = useState<AuthMethod>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');

  const isSubmitting = authMethod !== null;

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      if (event === 'SIGNED_IN' && session) {
        await syncServerSession(session);
        router.replace(safeRedirectTo);
      }
    });

    if (searchParams.get('error')) {
      setError('Authentication failed. Please try again.');
    }

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        await syncServerSession(data.session);
        router.replace(safeRedirectTo);
        return;
      }

      setIsLoading(false);
    };

    void checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [router, safeRedirectTo, searchParams]);

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthMethod('email');
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (!data.session) {
        throw new Error('Login succeeded but no session was created.');
      }

      await syncServerSession(data.session);
      router.replace(safeRedirectTo);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      setError(message);
      setAuthMethod(null);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthMethod('google');
    setError(null);

    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectUrl}?redirectTo=${encodeURIComponent(safeRedirectTo)}`,
          skipBrowserRedirect: false,
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(message);
      setAuthMethod(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center bg-[linear-gradient(180deg,#eef4ff_0%,#f8fbff_100%)] px-4">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          Preparing sign-in...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100svh-4rem)] overflow-hidden bg-[linear-gradient(180deg,#eef4ff_0%,#edf4ff_24%,#f8fbff_60%,#eef4ff_100%)] px-4 py-0 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.10),transparent_72%)]" />
      <div className="pointer-events-none absolute left-[-4rem] top-12 h-28 w-28 rounded-full bg-blue-100/40 blur-3xl" />
      <div className="pointer-events-none absolute right-[-4rem] top-8 h-32 w-32 rounded-full bg-cyan-100/45 blur-3xl" />

      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full flex-col justify-start py-2 sm:py-3">
        <div className="mb-3 w-full">
          <div className="flex w-full items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full border border-emerald-200 bg-white/85 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-800 shadow-sm backdrop-blur sm:text-xs">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Secure Account Access</span>
            <span className="shrink-0 text-slate-300">•</span>
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Protected Sign-In</span>
            <span className="shrink-0 text-slate-300">•</span>
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Encrypted Session</span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-lg">
          <div className="w-full rounded-[30px] border border-blue-100 bg-white p-4 shadow-[0_24px_90px_-40px_rgba(30,64,175,0.28)] sm:p-6">
            <div className="-mx-4 -mt-4 mb-4 rounded-t-[30px] border-b border-blue-100 bg-[linear-gradient(180deg,rgba(59,130,246,0.18)_0%,rgba(191,219,254,0.72)_100%)] px-4 pt-4 pb-4 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 backdrop-blur">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {loginFlow.badge}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <Lock className="h-3.5 w-3.5 text-emerald-600" />
                  Secure
                </div>
              </div>

              <div className="text-center">
                <h1 className="text-[1.9rem] font-black tracking-tight text-slate-950 sm:text-[2rem]">
                  {loginFlow.title}
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {loginFlow.subtitle}
                </p>
              </div>
            </div>

            <div className="mt-4">
            <div className="grid grid-cols-3 gap-2">
              {loginFlow.steps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-2 py-2.5 text-center shadow-sm"
                >
                  <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-blue-700 text-[11px] font-bold text-white">
                    {index + 1}
                  </div>
                  <p className="mt-2 text-[11px] font-semibold leading-4 text-slate-800 sm:text-xs">
                    {step}
                  </p>
                </div>
              ))}
            </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-5 space-y-4">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={handleGoogleLogin}
                className="h-12 w-full rounded-2xl border-slate-300 bg-white text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
              >
                <span className="mr-3 flex h-5 w-5 items-center justify-center">
                  <GoogleIcon />
                </span>
                {authMethod === 'google' ? 'Connecting...' : 'Continue with Google'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    or
                  </span>
                </div>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 rounded-2xl border-slate-300 bg-slate-50 px-4 text-slate-950 placeholder:text-slate-400"
                    placeholder="name@company.com"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 rounded-2xl border-slate-300 bg-slate-50 px-4 text-slate-950 placeholder:text-slate-400"
                    autoComplete="current-password"
                    placeholder="Enter password"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-2xl bg-blue-700 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
                >
                  {authMethod === 'email' ? 'Signing in...' : 'Continue with Email'}
                </Button>
              </form>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 border-t border-slate-100 pt-4 text-center text-[11px] font-medium leading-4 text-slate-600 sm:text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span>
                {loginFlow.steps[1] === 'Complete payment'
                  ? 'After sign-in, you go to payment next.'
                  : 'After sign-in, you go right back to your flow.'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center bg-[linear-gradient(180deg,#eef4ff_0%,#f8fbff_100%)] px-4 text-sm font-medium text-slate-700">
          Loading sign-in...
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
