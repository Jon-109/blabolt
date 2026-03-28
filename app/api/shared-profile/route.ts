import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getSharedProfileSnapshot,
  upsertSharedProfileAndSync,
} from '@/lib/server/shared-profile';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

const sharedProfilePatchSchema = z.object({
  personalName: z.string().trim().max(180).optional().nullable(),
  businessName: z.string().trim().max(180).optional().nullable(),
  businessLegalName: z.string().trim().max(180).optional().nullable(),
  loanPurpose: z.string().trim().max(240).optional().nullable(),
  loanAmount: z.number().finite().nonnegative().optional().nullable(),
  annualRevenue: z.number().finite().nonnegative().optional().nullable(),
  yearsInBusiness: z.number().finite().nonnegative().optional().nullable(),
  businessDescription: z.string().trim().max(5000).optional().nullable(),
});

async function createCookieClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Server auth configuration is missing');
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        cookieStore.set(name, value, options);
      },
      remove(name: string, options: Record<string, unknown>) {
        cookieStore.set(name, '', { ...options, maxAge: 0 });
      },
    },
  });
}

async function requireSessionUser() {
  const supabase = await createCookieClient();
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.user) {
    return null;
  }

  return data.session.user;
}

export async function GET() {
  try {
    const user = await requireSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const sharedProfile = await getSharedProfileSnapshot(admin, user.id);

    return NextResponse.json(sharedProfile);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to load shared profile',
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = sharedProfilePatchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid shared profile payload', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();
    const sharedProfile = await upsertSharedProfileAndSync(admin, user.id, parsed.data);

    return NextResponse.json(sharedProfile);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to save shared profile',
      },
      { status: 500 },
    );
  }
}
