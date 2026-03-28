import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApiIdentity } from '@/lib/server/admin-api-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

const createTaskSchema = z.object({
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  dueDate: z.string().date().optional(),
});

const updateTaskSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['todo', 'in_progress', 'blocked', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  title: z.string().trim().min(3).max(180).optional(),
  description: z.string().trim().max(2000).optional(),
});

export async function GET(req: NextRequest) {
  const adminIdentity = await requireAdminApiIdentity(req);
  if (!adminIdentity.ok) {
    return adminIdentity.response;
  }

  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from('admin_tasks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(req: NextRequest) {
  const adminIdentity = await requireAdminApiIdentity(req);
  if (!adminIdentity.ok) {
    return adminIdentity.response;
  }

  const admin = getSupabaseAdmin();

  const parsed = createTaskSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = {
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    priority: parsed.data.priority,
    due_date: parsed.data.dueDate ?? null,
    created_by_user_id: adminIdentity.identity.id,
  };

  const { data, error } = await admin
    .from('admin_tasks')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task: data });
}

export async function PATCH(req: NextRequest) {
  const adminIdentity = await requireAdminApiIdentity(req);
  if (!adminIdentity.ok) {
    return adminIdentity.response;
  }

  const admin = getSupabaseAdmin();

  const parsed = updateTaskSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...rest } = parsed.data;
  const updates: Record<string, unknown> = {};

  if (rest.status) updates.status = rest.status;
  if (rest.priority) updates.priority = rest.priority;
  if (rest.title) updates.title = rest.title;
  if (rest.description !== undefined) updates.description = rest.description;

  const { data, error } = await admin
    .from('admin_tasks')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task: data });
}
