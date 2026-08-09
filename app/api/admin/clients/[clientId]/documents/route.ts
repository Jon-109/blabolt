import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApiIdentity } from '@/lib/server/admin-api-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

const actionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('set_included'),
    loanRequestId: z.string().uuid(),
    requirementKey: z.string().min(1).max(160),
    included: z.boolean(),
    custom: z.boolean().optional(),
  }),
  z.object({
    action: z.literal('add_custom'),
    loanRequestId: z.string().uuid(),
    displayName: z.string().trim().min(2).max(180),
    description: z.string().trim().max(1000).optional().nullable(),
    category: z.enum(['financial_statement', 'debt_schedule', 'tax_return', 'bank_statement', 'cover_letter', 'other']).default('other'),
    required: z.boolean().default(true),
  }),
]);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'custom_document';
}

async function resolveClientUserId(admin: ReturnType<typeof getSupabaseAdmin>, clientId: string): Promise<string | null> {
  const { data: user } = await admin.auth.admin.getUserById(clientId);
  if (user?.user?.id) return user.user.id;

  const { data: account } = await admin
    .from('client_accounts')
    .select('user_id')
    .eq('id', clientId)
    .maybeSingle();

  return typeof account?.user_id === 'string' ? account.user_id : null;
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ clientId: string }> },
) {
  const adminIdentity = await requireAdminApiIdentity(req);
  if (!adminIdentity.ok) return adminIdentity.response;

  const parsed = actionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const { clientId } = await context.params;
  const admin = getSupabaseAdmin();
  const userId = await resolveClientUserId(admin, clientId);

  if (!userId) {
    return NextResponse.json({ error: 'Client must have a linked auth user before package documents can be customized.' }, { status: 400 });
  }

  const { data: loanRequest } = await admin
    .from('loan_requests')
    .select('id,user_id')
    .eq('id', parsed.data.loanRequestId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!loanRequest) {
    return NextResponse.json({ error: 'Loan request not found for this client.' }, { status: 404 });
  }

  if (parsed.data.action === 'set_included') {
    if (parsed.data.custom) {
      const { error } = await admin
        .from('loan_request_document_customizations')
        .update({ required: parsed.data.included, is_active: true })
        .eq('loan_request_id', parsed.data.loanRequestId)
        .eq('user_id', userId)
        .eq('requirement_key', parsed.data.requirementKey);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    const { error } = await admin
      .from('loan_request_documents')
      .upsert({
        loan_request_id: parsed.data.loanRequestId,
        user_id: userId,
        requirement_key: parsed.data.requirementKey,
        status: 'not_started',
        source: ['cover_letter', 'broker_fee_agreement'].includes(parsed.data.requirementKey) ? 'generated' : 'upload',
        excluded_from_package: !parsed.data.included,
        excluded_at: parsed.data.included ? null : new Date().toISOString(),
      }, {
        onConflict: 'loan_request_id,requirement_key',
      });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const baseKey = `custom_${slugify(parsed.data.displayName)}`;
  const requirementKey = `${baseKey}_${Date.now().toString(36)}`;

  const { error } = await admin
    .from('loan_request_document_customizations')
    .insert({
      loan_request_id: parsed.data.loanRequestId,
      user_id: userId,
      requirement_key: requirementKey,
      display_name: parsed.data.displayName,
      description: parsed.data.description ?? '',
      category: parsed.data.category,
      required: parsed.data.required,
      sort_order: 1000,
      is_active: true,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, requirementKey });
}
