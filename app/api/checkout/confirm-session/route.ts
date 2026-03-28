import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import {
  getCheckoutPurchasesFromMetadata,
  upsertCheckoutPurchases,
} from '@/lib/stripe/checkout-session-purchases';

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  return authHeader.slice(7).trim() || null;
}

async function getUserFromToken(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase client configuration is missing');
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromToken(accessToken);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : '';
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe configuration is incomplete' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-06-30.basil',
    });
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Checkout session is not paid' }, { status: 409 });
    }

    const metadata = checkoutSession.metadata ?? {};
    const metadataUserId = String(metadata.user_id ?? checkoutSession.client_reference_id ?? '').trim();
    if (!metadataUserId || metadataUserId !== user.id) {
      return NextResponse.json({ error: 'Session does not belong to this user' }, { status: 403 });
    }

    const purchases = getCheckoutPurchasesFromMetadata(metadata);
    if (purchases.length === 0) {
      return NextResponse.json({ error: 'Stripe session metadata is incomplete' }, { status: 422 });
    }

    const admin = getSupabaseAdmin();
    const { error: purchaseError } = await upsertCheckoutPurchases({
      session: checkoutSession,
      supabase: admin,
      purchases,
      userId: user.id,
    });

    if (purchaseError) {
      console.error('[checkout-confirm] Failed to upsert purchase:', purchaseError.message);
      return NextResponse.json({ error: 'Failed to confirm checkout session' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[checkout-confirm] Error confirming checkout session:', message);
    return NextResponse.json({ error: 'Failed to confirm checkout session' }, { status: 500 });
  }
}
