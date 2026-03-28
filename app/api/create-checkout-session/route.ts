import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import {
  buildCheckoutPurchaseMetadata,
  isMultiTemplateCheckoutSelection,
} from '@/lib/stripe/checkout-session-purchases';
import { isStripeCheckoutProductType, type StripeCheckoutProductType } from '@/lib/stripe/catalog';
import { getSiteUrl, getStripeCheckoutProductConfig } from '@/lib/stripe/server-products';

function buildCheckoutUrl(siteUrl: string, path: string, appendSessionId = false): string {
  const separator = path.includes('?') ? '&' : '?';
  return appendSessionId ? `${siteUrl}${path}${separator}session_id={CHECKOUT_SESSION_ID}` : `${siteUrl}${path}`;
}

function getRequestedProductTypes(body: unknown): StripeCheckoutProductType[] | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const maybeBody = body as {
    productType?: unknown;
    productTypes?: unknown;
  };

  if (Array.isArray(maybeBody.productTypes)) {
    const uniqueProductTypes: StripeCheckoutProductType[] = [];
    const seen = new Set<StripeCheckoutProductType>();

    for (const productType of maybeBody.productTypes) {
      if (typeof productType !== 'string' || !isStripeCheckoutProductType(productType)) {
        return null;
      }

      if (seen.has(productType)) {
        continue;
      }

      seen.add(productType);
      uniqueProductTypes.push(productType);
    }

    return uniqueProductTypes.length > 0 ? uniqueProductTypes : null;
  }

  if (typeof maybeBody.productType === 'string' && isStripeCheckoutProductType(maybeBody.productType)) {
    return [maybeBody.productType];
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const siteUrl = getSiteUrl();

    if (!stripeSecretKey || !supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Checkout configuration is incomplete' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-06-30.basil',
    });

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    const { loanPurpose, promoCode } = body;
    const productTypes = getRequestedProductTypes(body);
    if (!productTypes) {
      return NextResponse.json({ error: 'Invalid product type' }, { status: 400 });
    }

    if (productTypes.length > 1 && !isMultiTemplateCheckoutSelection(productTypes)) {
      return NextResponse.json(
        { error: 'Only template products can be purchased together in one checkout' },
        { status: 400 },
      );
    }

    const checkoutProducts = productTypes.map((productType) => ({
      ...getStripeCheckoutProductConfig(productType),
      productType,
    }));
    const firstCheckoutProduct = checkoutProducts[0];
    if (!firstCheckoutProduct) {
      return NextResponse.json({ error: 'Invalid product type' }, { status: 400 });
    }

    const metadata = buildCheckoutPurchaseMetadata(productTypes, userId, loanPurpose);
    const successPath =
      checkoutProducts.length === 1 ? firstCheckoutProduct.successPath : '/templates';
    const cancelPath =
      checkoutProducts.length === 1 ? firstCheckoutProduct.cancelPath : '/services/templates-bundle';

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: checkoutProducts.map((checkoutProduct) => ({
        price: checkoutProduct.priceId,
        quantity: 1,
      })),
      mode: 'payment',
      success_url: buildCheckoutUrl(siteUrl, successPath, true),
      cancel_url: buildCheckoutUrl(siteUrl, cancelPath),
      client_reference_id: userId,
      customer_email: userEmail,
      metadata,
      ...(promoCode
        ? { discounts: [{ promotion_code: promoCode }] }
        : { allow_promotion_codes: true }),
    });

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
