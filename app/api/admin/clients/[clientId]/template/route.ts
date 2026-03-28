import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApiIdentity } from '@/lib/server/admin-api-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

const templateTypeSchema = z.enum([
  'balance_sheet',
  'income_statement',
  'personal_financial_statement',
  'personal_debt_summary',
  'business_debt_summary',
]);

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ clientId: string }> },
) {
  const adminIdentity = await requireAdminApiIdentity(req);
  if (!adminIdentity.ok) return adminIdentity.response;

  const { clientId } = await context.params;
  const templateType = templateTypeSchema.safeParse(req.nextUrl.searchParams.get('type'));
  if (!templateType.success) {
    return NextResponse.json({ error: 'Valid type query param is required' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: client } = await admin
    .from('client_accounts')
    .select('id,email,user_id,full_name')
    .or(`id.eq.${clientId},user_id.eq.${clientId}`)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  if (!client.user_id) {
    return NextResponse.json({ error: 'Client has not signed in yet with this email.' }, { status: 400 });
  }

  const { data: submissions, error } = await admin
    .from('template_submissions')
    .select('*')
    .eq('user_id', client.user_id)
    .eq('template_type', templateType.data)
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    client,
    templateType: templateType.data,
    submissions: submissions ?? [],
  });
}

const updateSchema = z.object({
  submissionId: z.string().uuid(),
  formData: z.record(z.unknown()),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ clientId: string }> },
) {
  const adminIdentity = await requireAdminApiIdentity(req);
  if (!adminIdentity.ok) return adminIdentity.response;

  const { clientId } = await context.params;
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: client } = await admin
    .from('client_accounts')
    .select('id,user_id')
    .or(`id.eq.${clientId},user_id.eq.${clientId}`)
    .maybeSingle();

  if (!client?.user_id) {
    return NextResponse.json({ error: 'Client not found or not linked to user.' }, { status: 404 });
  }

  const { data, error } = await admin
    .from('template_submissions')
    .update({ form_data: parsed.data.formData, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.submissionId)
    .eq('user_id', client.user_id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ submission: data });
}
