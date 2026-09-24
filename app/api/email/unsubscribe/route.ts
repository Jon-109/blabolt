import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashToken } from '@/lib/email';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

const requestSchema = z.object({
  token: z.string().trim().min(20).max(200),
});

export async function POST(req: NextRequest) {
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid unsubscribe request' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const tokenHash = hashToken(parsed.data.token);
  const { data: lead, error: findError } = await admin
    .from('financing_leads')
    .select('email')
    .eq('unsubscribe_token_hash', tokenHash)
    .maybeSingle();

  if (findError) {
    console.error('[email-unsubscribe] Lookup failed:', findError);
    return NextResponse.json({ error: 'Unable to update email preferences' }, { status: 500 });
  }

  if (!lead?.email) {
    return NextResponse.json({ success: true });
  }

  const nowIso = new Date().toISOString();
  const { error: updateError } = await admin
    .from('financing_leads')
    .update({
      status: 'unsubscribed',
      marketing_consent: false,
      consent_text_version: null,
      consented_at: null,
      unsubscribed_at: nowIso,
      last_email_event: 'email.unsubscribed',
      last_email_event_at: nowIso,
    })
    .eq('email', String(lead.email).toLowerCase());

  if (updateError) {
    console.error('[email-unsubscribe] Update failed:', updateError);
    return NextResponse.json({ error: 'Unable to update email preferences' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
