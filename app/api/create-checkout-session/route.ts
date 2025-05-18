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
    
    // 5. Check for existing analysis in the database
    const { data: existingRows, error: existingError } = await supabase
      .from('cash_flow_analyses')
      .select('id, status, created_at')
      .eq('user_id', userId)
      .in('status', ['in_progress', 'submitted'])
      .order('created_at', { ascending: false });

    if (existingError) {
      console.error('[DB] Error checking for existing analysis:', existingError);
      return NextResponse.json(
        { error: 'Error checking existing analyses' },
        { status: 500 }
      );
    }

    // 6. If there's an existing analysis, return it
    if (existingRows && existingRows.length > 0) {
      const existingAnalysis = existingRows[0];
      if (existingAnalysis && existingAnalysis.id && existingAnalysis.status) {
        return NextResponse.json({
          analysisId: existingAnalysis.id,
          status: existingAnalysis.status,
          message: 'Analysis already exists'
        });
      } else {
        console.error('[DB] Invalid analysis data structure', existingAnalysis);
        return NextResponse.json(
          { error: 'Invalid analysis data found' },
          { status: 500 }
        );
      }
    }

    // 7. Create a new checkout session with Stripe
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Comprehensive Cash Flow Analysis',
              description: 'Detailed financial analysis with lender-ready report',
            },
            unit_amount: STRIPE_PRICE,
          },
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
    });

    // 8. Return the checkout URL
    return NextResponse.json({ url: checkoutSession.url });
    
  } catch (error) {
    console.error('[ERROR] Checkout session creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}