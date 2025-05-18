import React, { Suspense } from 'react';
import { cookies } from 'next/headers'; 
import { createServerClient, type CookieOptions } from '@supabase/ssr'; 
import { Database } from '@/types/supabase'; 
import ThankYouContent from '@/components/analysis/ThankYouContent';

export default async function ThankYouPage() {
  
  // Await cookies() as required by Next.js runtime
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Now that cookieStore is awaited, this should work correctly
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try { 
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try { 
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  let userEmail: string | null = null;
  let userData = null; // Renamed for clarity

  try {
    // Use getUser() for better security
    const { data: { user }, error } = await supabase.auth.getUser(); 
    userData = user; // Store user object
    
    if (error) {
       // Handle error (e.g., log it, maybe redirect)
       console.error('ThankYouPage: Error fetching user:', error.message);
    }

    if (user?.email) {
      userEmail = user.email;
    } else {
       // Handle case where user is not found or doesn't have an email
    }
  } catch (error: any) { 
     console.error('ThankYouPage: Exception fetching user data:', error.message); 
     userData = { error: error.message }; 
  }

  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">Loading report details...</div>}> 
      <ThankYouContent userEmail={userEmail} />
    </Suspense>
  );
}
