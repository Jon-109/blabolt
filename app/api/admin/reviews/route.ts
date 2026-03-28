import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApiIdentity } from '@/lib/server/admin-api-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

const createReviewSchema = z.object({
  title: z.string().trim().min(3).max(180),
  summary: z.string().trim().max(2000).optional(),
  reviewType: z.enum(['deal', 'user', 'template', 'compliance', 'other']).default('deal'),
});

const updateReviewSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['open', 'in_progress', 'resolved']).optional(),
  title: z.string().trim().min(3).max(180).optional(),
  summary: z.string().trim().max(2000).optional(),
});

export async function GET(req: NextRequest) {
  const adminIdentity = await requireAdminApiIdentity(req);
  if (!adminIdentity.ok) {
    return adminIdentity.response;
  }

  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from('admin_reviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reviews: data ?? [] });
}

export async function POST(req: NextRequest) {
  const adminIdentity = await requireAdminApiIdentity(req);
  if (!adminIdentity.ok) {
    return adminIdentity.response;
  }

  const admin = getSupabaseAdmin();

  const parsed = createReviewSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = {
    title: parsed.data.title,
    summary: parsed.data.summary ?? null,
    review_type: parsed.data.reviewType,
    created_by_user_id: adminIdentity.identity.id,
  };

  const { data, error } = await admin
    .from('admin_reviews')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review: data });
}

export async function PATCH(req: NextRequest) {
  const adminIdentity = await requireAdminApiIdentity(req);
  if (!adminIdentity.ok) {
    return adminIdentity.response;
  }

  const admin = getSupabaseAdmin();

  const parsed = updateReviewSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...rest } = parsed.data;
  const updates: Record<string, unknown> = {};

  if (rest.status) updates.status = rest.status;
  if (rest.title) updates.title = rest.title;
  if (rest.summary !== undefined) updates.summary = rest.summary;

  const { data, error } = await admin
    .from('admin_reviews')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review: data });
}
