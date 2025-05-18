'use client'

import { supabase } from '@/supabase/helpers/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Log for debugging
    console.log('Setting up auth state change listener');
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      console.log('Auth state changed:', event, !!session);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in, redirecting...');
        const redirectTo = searchParams.get('redirectTo') || '/';
        router.push(redirectTo);
      }
    });

    // Check for error from auth callback
    const errorMsg = searchParams.get('error');
    if (errorMsg) {
      console.log('Auth error detected:', errorMsg);
      setError('Authentication failed. Please try again.');
    }

    // Check if user is already logged in
    const checkSession = async () => {
      console.log('Checking for existing session...');
      const { data, error } = await supabase.auth.getSession();
      
      console.log('Session check result:', !!data.session, error);
      
      if (data.session) {
        console.log('Existing session found, redirecting...');
        const redirectTo = searchParams.get('redirectTo') || '/';
        router.push(redirectTo);
      } else {
        console.log('No session found, showing login form');
        setIsLoading(false);
      }
    };

    checkSession();
    
    // Clean up subscription
    return () => {
      console.log('Cleaning up auth subscription');
      subscription?.unsubscribe();
    };
  }, [router, searchParams]);

  // Handle email/password login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    console.log('Attempting email login for:', email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Email login result:', !!data.session, error);
      
      if (error) throw error;

      if (data.session) {
        console.log('Login successful, session created');
        // Redirect will happen automatically via onAuthStateChange
        const redirectTo = searchParams.get('redirectTo') || '/';
        console.log('Redirecting to:', redirectTo);
        router.push(redirectTo);
      } else {
        console.log('No session created after login');
        throw new Error('Login succeeded but no session was created');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in');
      setIsSubmitting(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError(null);
    console.log('Initiating Google login');

    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const redirectToParam = searchParams.get('redirectTo') || '/';
      
      console.log('Google redirect URL:', redirectUrl);
      console.log('Redirect param:', redirectToParam);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectUrl}?redirectTo=${encodeURIComponent(redirectToParam)}`,
          skipBrowserRedirect: false,
        },
      });

      console.log('Google OAuth result:', data, error);
      
      if (error) throw error;
      
      // This won't be reached for OAuth as it redirects the browser
      console.log('Google OAuth initiated, browser should redirect');
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Failed to sign in with Google');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bla-gradient flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-6 flex flex-col items-center border border-slate-100 mt-20 transition-all duration-300">
        <h1 className="text-3xl font-black text-slate-900 mb-1 tracking-tight text-center drop-shadow-sm">
          Sign in to Business Lending Advocate
        </h1>
        <p className="text-base text-slate-600 mb-4 text-center max-w-xs">
          Access your personalized cash flow analysis and loan services.
        </p>

        {error && (
          <div className="w-full p-3 mb-4 bg-red-50 text-red-700 text-sm rounded-md text-center">
            {error}
          </div>
        )}

        {/* Email/Password Login Form */}
        <form onSubmit={handleEmailLogin} className="w-full space-y-4 mb-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in with Email'}
          </button>
        </form>

        <div className="relative w-full mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1Z" fill="currentColor"></path>
            </g>
          </svg>
          Sign in with Google
        </button>
        
        <div className="mt-4 text-sm text-center text-slate-500">
          <p>Don't have an account? Signing in will create one automatically.</p>
        </div>
        
        <div className="mt-8 text-xs text-slate-400 text-center flex items-center justify-center gap-2">
          <Lock className="w-4 h-4 text-emerald-500" aria-label="Lock" />
          <span>256‑bit TLS encryption</span>
        </div>
        
        <div className="mt-4 text-slate-300 text-xs text-center max-w-md">
          <span>&copy; {new Date().getFullYear()} Business Lending Advocate. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}
