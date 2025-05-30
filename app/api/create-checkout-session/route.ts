import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const STRIPE_PRICE = 9900; // $99.00 in cents
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';

// Validate environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase env vars');
}

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
});

// Initialize a direct Supabase client (not using cookies)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // 1. Extract the auth token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[AUTH] No authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. Get the token
    const token = authHeader.split(' ')[1];
    
    // 3. Initialize Supabase client with the session token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    // 4. Validate user
    if (userError || !user) {
      console.error('[AUTH] User error:', userError?.message || 'No user found');
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }
    
    const userId = user.id;
    const userEmail = user.email;
    
    // 5. Parse request body for product type and promo code
    const body = await req.json();
    const { productType, loanPurpose, promoCode } = body;

    // 6. Conditional logic for loan packaging or cash flow analysis
    let checkoutSession;
    if (productType === 'loan_packaging') {
      // Loan Packaging checkout
      checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_1QWsfeBT7qyj5Bco1lgWTNpN', // Loan Packaging Price ID
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${SITE_URL}/loan-packaging?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE_URL}/loan-packaging?cancelled=true`,
        client_reference_id: userId,
        customer_email: userEmail,
        metadata: {
          user_id: userId,
          product_type: 'loan_packaging',
          product_id: 'prod_RPi5e24PCy1D1p',
          loan_purpose: loanPurpose || '',
        },
        // If a promo code is provided, restrict to that code, else allow all
        ...(promoCode
          ? { discounts: [{ promotion_code: promoCode }] }
          : { allow_promotion_codes: true }),
      });
    } else {
      // Default: Cash Flow Analysis checkout (legacy)
      checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_1RPyhHBT7qyj5BcoebrwMMhr',
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${SITE_URL}/comprehensive-cash-flow-analysis?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE_URL}/cash-flow-analysis?cancelled=true`,
        client_reference_id: userId,
        customer_email: userEmail,
        metadata: {
          user_id: userId,
          product_type: 'cash_flow_analysis',
          product_id: 'prod_RPjWBW6yTN629z',
        },
        allow_promotion_codes: true,
      });
    }

    // 7. Return the checkout URL
    return NextResponse.json({ url: checkoutSession.url });
    
  } catch (error) {
    console.error('[ERROR] Checkout session creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}