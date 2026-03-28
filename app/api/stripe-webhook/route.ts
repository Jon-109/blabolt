import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import {
  getCheckoutPurchasesFromMetadata,
  upsertCheckoutPurchases,
} from '@/lib/stripe/checkout-session-purchases';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: 'Webhook server is not fully configured' }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-06-30.basil',
  });
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  let event: Stripe.Event;
  try {
    const body = Buffer.from(await req.arrayBuffer());
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown signature verification error';
    console.error('[WEBHOOK] Signature verification failed:', message);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata || {};
  const user_id = metadata.user_id;
  const purchases = getCheckoutPurchasesFromMetadata(metadata);

  if (!user_id || purchases.length === 0) {
    return NextResponse.json({ error: 'Missing metadata in Stripe session' }, { status: 400 });
  }

  const { error: purchaseError } = await upsertCheckoutPurchases({
    session,
    supabase,
    purchases,
    userId: user_id,
  });

  if (purchaseError) {
    console.error('[WEBHOOK] Failed to upsert purchase:', purchaseError.message);
    return NextResponse.json({ error: 'Failed to record purchase' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
