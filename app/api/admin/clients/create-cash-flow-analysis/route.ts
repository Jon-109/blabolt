import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApiIdentity } from '@/lib/server/admin-api-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { createEmptyFinancialPayload } from '@/lib/admin/client-dashboard';

export const runtime = 'nodejs';

const createCashFlowSchema = z.object({
  clientId: z.string(),
});

export async function POST(req: NextRequest) {
  const adminIdentity = await requireAdminApiIdentity(req);
  if (!adminIdentity.ok) return adminIdentity.response;

  const parsed = createCashFlowSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const { clientId } = parsed.data;
  const admin = getSupabaseAdmin();

  // Resolve client identity
  const accountResult = await admin
    .from('client_accounts')
    .select('*')
    .or(`id.eq.${clientId},user_id.eq.${clientId}`)
    .maybeSingle();

  let account = accountResult.data;
  let userId = account?.user_id;

  // If no account, try to get user directly
  if (!account) {
    const userResult = await admin.auth.admin.getUserById(clientId);
    if (userResult.data.user) {
      userId = userResult.data.user.id;
      // Create account record
      const { data: newAccount } = await admin
        .from('client_accounts')
        .upsert({
          user_id: userId,
          email: userResult.data.user.email?.toLowerCase(),
          full_name: userResult.data.user.user_metadata?.full_name || userResult.data.user.user_metadata?.name || null,
        })
        .select('*')
        .single();
      account = newAccount;
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'Client not found or no user ID' }, { status: 404 });
  }

  // Check if cash flow analysis already exists
  const existingAnalysis = await admin
    .from('cash_flow_analyses')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingAnalysis.data) {
    return NextResponse.json({ error: 'Cash flow analysis already exists for this client' }, { status: 400 });
  }

  // Create new cash flow analysis
  const { data: newAnalysis, error } = await admin
    .from('cash_flow_analyses')
    .insert({
      user_id: userId,
      status: 'inprogress',
      financials: createEmptyFinancialPayload(),
      dscr: { '2024': null, '2025': null, '2026YTD': null },
      debts: [],
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ analysis: newAnalysis });
}
