import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { syncClientAccountForAuthUser } from '@/lib/server/client-account-sync';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export const dynamic = 'force-dynamic';

function safeRedirectPath(value: string | null): string {
  if (!value) return '/';
  if (!value.startsWith('/')) return '/';
  if (value.startsWith('//')) return '/';
  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const requestedRedirect = safeRedirectPath(requestUrl.searchParams.get('redirectTo'));
  const redirectUrl = requestedRedirect.includes('checkout=true')
    ? '/cash-flow-analysis?checkout=true'
    : requestedRedirect;

  if (code) {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          },
        },
      });

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        try {
          const { data } = await supabase.auth.getUser();
          await syncClientAccountForAuthUser(getSupabaseAdmin(), data.user ?? null);
        } catch (syncError) {
          console.error('Failed to sync client account during auth callback:', syncError);
        }
      }
    }
  }

  return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin));
}
