import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApiIdentity } from '@/lib/server/admin-api-auth';
import { isAllowedAdminEmail } from '@/lib/server/admin-access';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

const upsertAdminSchema = z.object({
  emails: z.array(z.string().email().transform((value) => value.toLowerCase())).min(1).max(50),
});

export async function GET(req: NextRequest) {
  const adminIdentity = await requireAdminApiIdentity(req);
  if (!adminIdentity.ok) {
    return adminIdentity.response;
  }

  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from('admin_users')
    .select('id, email, user_id, display_name, is_active, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ admins: data ?? [] });
}

export async function POST(req: NextRequest) {
  const adminIdentity = await requireAdminApiIdentity(req);
  if (!adminIdentity.ok) {
    return adminIdentity.response;
  }

  const admin = getSupabaseAdmin();

  const parsed = upsertAdminSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const rows = parsed.data.emails.map((email) => ({ email, is_active: true }));
  const disallowed = rows.filter((row) => !isAllowedAdminEmail(row.email));
  if (disallowed.length > 0) {
    return NextResponse.json(
      { error: 'Only the approved internal admin emails can be granted admin access.' },
      { status: 403 },
    );
  }

  const { error } = await admin
    .from('admin_users')
    .upsert(rows, { onConflict: 'email' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, added: rows.length });
}
