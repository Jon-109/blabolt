import { createClient } from '@supabase/supabase-js';
import { getPublicStripeProductId } from '@/lib/stripe/public-products';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function hasUserPurchasedCashFlowAnalysis(userId: string, accessToken?: string): Promise<boolean> {
  const productId = getPublicStripeProductId('cash_flow_analysis');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    ...(accessToken
      ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
      : {}),
  });

  // Check the purchases table for a paid cash_flow_analysis for this user
  const { data, error } = await supabase
    .from('purchases')
    .select('paid')
    .eq('user_id', userId)
    .eq('product_type', 'cash_flow_analysis')
    .eq('product_id', productId)
    .eq('paid', true)
    .maybeSingle();

  if (error) {
    console.error('[purchase-check] Error checking purchase:', error);
    return false;
  }

  return !!data;
}
