import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.log('Auth callback triggered');
  
  const requestUrl = new URL(request.url);
  
  // Get both code and redirectTo parameters
  const code = requestUrl.searchParams.get('code');
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/';
  
  console.log('Code present:', !!code);
  console.log('RedirectTo:', redirectTo);
  
  // Check if this is a checkout flow
  const isCheckoutFlow = redirectTo.includes('checkout=true');
  const redirectUrl = isCheckoutFlow ? '/cash-flow-analysis?checkout=true' : redirectTo;
  
  // If there's a code, it means we're in an OAuth callback flow
  if (code) {
    console.log('Processing OAuth callback with code');
    // We don't need to do anything with the code - it will be automatically 
    // processed by the Supabase client on the client side
  }
  
  // Redirect to the final destination
  console.log('Redirecting to:', redirectUrl);
  return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin));
}
