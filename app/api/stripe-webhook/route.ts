import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('[WEBHOOK] SUPABASE_URL present:', !!SUPABASE_URL);
console.log('[WEBHOOK] SUPABASE_SERVICE_ROLE_KEY present:', !!SUPABASE_SERVICE_ROLE_KEY);
console.log('[WEBHOOK] STRIPE_SECRET_KEY present:', !!process.env.STRIPE_SECRET_KEY);
console.log('[WEBHOOK] STRIPE_WEBHOOK_SECRET present:', !!process.env.STRIPE_WEBHOOK_SECRET);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[WEBHOOK] Missing required Supabase env vars');
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  console.log('[WEBHOOK] Stripe webhook received');
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[WEBHOOK] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  const buf = await req.arrayBuffer();
  const body = Buffer.from(buf);

  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
    console.log('[WEBHOOK] Stripe event type:', event.type);
    console.log('[WEBHOOK] Stripe event payload:', JSON.stringify(event.data.object));
  } catch (err) {
    console.error('[WEBHOOK] Stripe signature verification failed:', (err as Error).message);
    return NextResponse.json({ error: `Webhook signature verification failed: ${(err as Error).message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};
    console.log('[WEBHOOK] Stripe session metadata:', metadata);
    const user_id = metadata.user_id;
    const product_type = metadata.product_type;
    const product_id = metadata.product_id;
    const stripe_session_id = session.id;

    if (!user_id || !product_id || !product_type) {
      console.error('[WEBHOOK] Missing metadata in Stripe session', { user_id, product_id, product_type });
      return NextResponse.json({ error: 'Missing metadata in Stripe session' }, { status: 400 });
    }

    // Upsert into purchases
    const { error: purchaseError } = await supabase.from('purchases').upsert([
      {
        user_id,
        product_id,
        product_type,
        stripe_session_id,
        paid: true,
      }
    ], {
      onConflict: 'user_id,product_id,product_type',
    });
    if (purchaseError) {
      console.error('[WEBHOOK] Failed to upsert purchase:', purchaseError, {
        user_id,
        product_id,
        product_type,
        stripe_session_id
      });
      return NextResponse.json({ error: 'Failed to upsert purchase: ' + purchaseError.message }, { status: 500 });
    }
    console.log('[WEBHOOK] Purchase upserted successfully for user:', user_id);
  }

  // Always return 200 so Stripe doesn't retry unnecessarily
  return NextResponse.json({ received: true });
}

