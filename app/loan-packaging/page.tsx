'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/supabase/helpers/client'

export default function LoanPackagingPage() {
  // All hooks must be called before any return!
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const router = useRouter()

  // Combined effect for fetch and redirect
  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      setLoadingUser(true);
      const { data, error } = await supabase.auth.getSession();
      console.log('[DEBUG] fetchUser: data=', data, 'error=', error);
      let email = null;
      if (error) {
        email = null;
      } else if (data?.session?.user?.email) {
        email = data.session.user.email;
      }
      if (mounted) setUserEmail(email);
      setLoadingUser(false);
      console.log('[DEBUG] fetchUser: setLoadingUser(false)');
      if (mounted && email === null) {
        console.log('[DEBUG] Redirecting to /login because userEmail is null (inside fetchUser)');
        router.replace('/login');
      }
    };
    fetchUser();
    return () => { mounted = false };
  }, [router]);

  if (loadingUser) {
    console.log('[DEBUG] Loading user...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-lg text-gray-600">Checking authentication...</span>
      </div>
    )
  }

  if (!userEmail) {
    console.log('[DEBUG] Not loading, but userEmail is null. Likely redirecting.');
    // Don't render anything while redirecting
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Loan Packaging Services</h1>
          <p className="text-lg text-gray-700 mb-8">
            This page is currently under development. Soon, you'll be able to access our comprehensive loan packaging services here.
          </p>
          <div className="p-6 bg-blue-50 rounded-lg border border-blue-100">
            <h2 className="text-xl font-semibold text-blue-800 mb-3">Coming Soon</h2>
            <p className="text-gray-700">
              Our loan packaging services will help you prepare all necessary documentation and information required by lenders, increasing your chances of loan approval.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
