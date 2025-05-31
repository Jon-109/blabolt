import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function hasUserPurchasedCashFlowAnalysis(userId: string): Promise<boolean> {
  console.log("[DEBUG] Checking purchases for user ID:", userId);
  
  // Check if we have a valid userId
  if (!userId) {
    console.error("[DEBUG] No userId provided for purchase check!");
    return false;
  }

  try {
    // Debug the request itself
    console.log("[DEBUG] Making Supabase request with params:", {
      user_id: userId,
      product_type: 'cash_flow_analysis',
      product_id: 'prod_RPjWBW6yTN629z'
    });

    // Check the purchases table for a paid cash_flow_analysis for this user
    const { data, error } = await supabase
      .from('purchases')
      .select('paid')
      .eq('user_id', userId)
      .eq('product_type', 'cash_flow_analysis')
      .eq('product_id', 'prod_RPjWBW6yTN629z')
      .eq('paid', true)
      .maybeSingle(); // Changed from .single() to .maybeSingle() to handle not found case better

    if (error) {
      console.error('[DEBUG] Purchase check error details:', JSON.stringify(error));
      return false;
    }

    console.log("[DEBUG] Purchase check result:", data);
    return !!data;
  } catch (e) {
    console.error("[DEBUG] Exception in purchase check:", e);
    return false;
  }
}
