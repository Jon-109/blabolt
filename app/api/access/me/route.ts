import { NextResponse } from 'next/server';
import { createClient } from '@/supabase/helpers/server';
import { cookies } from 'next/headers';
import { resolveServiceAccessForUser } from '@/lib/server/service-access';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;
  return token.trim() || null;
}

async function getUserFromBearerToken(accessToken: string) {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = process.env;
  if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;

  const supabase = createSupabaseClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    },
  );

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user;
}

export async function GET(request: Request) {
  const supabase = createClient(cookies());
  const { data, error } = await supabase.auth.getUser();
  let user = data.user ?? null;

  if (!user) {
    const token = getBearerToken(request);
    if (token) {
      user = await getUserFromBearerToken(token);
    }
  }

  if ((error && !user) || !user) {
    return NextResponse.json(
      {
        availableTemplates: [],
        isAuthenticated: false,
        isAdmin: false,
        canAccessLoanPackaging: false,
        canAccessTemplates: false,
        canAccessComprehensive: false,
        role: 'anonymous',
      },
      { status: 401 },
    );
  }

  const access = await resolveServiceAccessForUser({
    id: user.id,
    email: user.email ?? undefined,
  });

  return NextResponse.json(access);
}
