import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { syncClientAccountForAuthUser } from '@/lib/server/client-account-sync';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

function createAuthError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
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
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return createAuthError('Server auth configuration is missing', 500);
  }

  const body = await request.json().catch(() => null);
  const accessToken = typeof body?.accessToken === 'string' ? body.accessToken : '';
  const refreshToken = typeof body?.refreshToken === 'string' ? body.refreshToken : '';

  if (!accessToken || !refreshToken) {
    return createAuthError('Access token and refresh token are required');
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    return createAuthError(error.message, 401);
  }

  try {
    const { data } = await supabase.auth.getUser();
    await syncClientAccountForAuthUser(getSupabaseAdmin(), data.user ?? null);
  } catch (syncError) {
    console.error('Failed to sync client account during session sync:', syncError);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return createAuthError('Server auth configuration is missing', 500);
  }

  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
