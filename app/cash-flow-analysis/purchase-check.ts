import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function hasUserPurchasedCashFlowAnalysis(userId: string): Promise<boolean> {
  // Check the purchases table for a paid cash_flow_analysis for this user
  const { data, error } = await supabase
    .from('purchases')
    .select('paid')
    .eq('user_id', userId)
    .eq('product_type', 'cash_flow_analysis')
    .eq('product_id', 'prod_RPjWBW6yTN629z')
    .eq('paid', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[purchase-check] Error checking purchase:', error);
    return false;
  }

  return !!data;
}
