import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

type ResendWebhookEvent = {
  type?: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[];
  };
};

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 500 });
  }

  const id = req.headers.get('svix-id');
  const timestamp = req.headers.get('svix-timestamp');
  const signature = req.headers.get('svix-signature');
  if (!id || !timestamp || !signature) {
    return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 });
  }

  const payload = await req.text();
  let event: ResendWebhookEvent;
  try {
    new Webhook(webhookSecret).verify(payload, {
      'svix-id': id,
      'svix-timestamp': timestamp,
      'svix-signature': signature,
    });
    event = JSON.parse(payload) as ResendWebhookEvent;
  } catch (error) {
    console.error('[resend-webhook] Signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  const emailId = event.data?.email_id;
  const eventType = event.type;
  if (!emailId || !eventType) {
    return NextResponse.json({ received: true });
  }

  const nowIso = event.created_at || new Date().toISOString();
  const update: Record<string, unknown> = {
    last_email_event: eventType,
    last_email_event_at: nowIso,
  };

  if (eventType === 'email.delivered') {
    update.result_email_status = 'delivered';
    update.result_email_delivered_at = nowIso;
  } else if (eventType === 'email.bounced') {
    update.result_email_status = 'bounced';
    update.result_email_failed_at = nowIso;
    update.status = 'bounced';
    update.marketing_consent = false;
    update.consent_text_version = null;
    update.consented_at = null;
  } else if (eventType === 'email.complained') {
    update.result_email_status = 'complained';
    update.result_email_failed_at = nowIso;
    update.status = 'complained';
    update.marketing_consent = false;
    update.consent_text_version = null;
    update.consented_at = null;
  } else if (eventType === 'email.failed') {
    update.result_email_status = 'failed';
    update.result_email_failed_at = nowIso;
  }

  const admin = getSupabaseAdmin();
  const { data: matchedLead, error: lookupError } = await admin
    .from('financing_leads')
    .select('email')
    .eq('result_email_id', emailId)
    .maybeSingle();
  if (lookupError) {
    console.error('[resend-webhook] Lead lookup failed:', lookupError);
    return NextResponse.json({ error: 'Webhook persistence failed' }, { status: 500 });
  }

  if (!matchedLead?.email) {
    return NextResponse.json({ received: true });
  }

  const terminalStatus = eventType === 'email.bounced'
    ? 'bounced'
    : eventType === 'email.complained'
      ? 'complained'
      : null;
  const mutation = terminalStatus
    ? admin.from('financing_leads').update(update).eq('email', String(matchedLead.email).toLowerCase())
    : admin.from('financing_leads').update(update).eq('result_email_id', emailId);
  const { error: updateError } = await mutation;
  if (updateError) {
    console.error('[resend-webhook] Lead update failed:', updateError);
    return NextResponse.json({ error: 'Webhook persistence failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
