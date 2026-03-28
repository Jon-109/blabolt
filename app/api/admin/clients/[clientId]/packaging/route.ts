import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiIdentity } from '@/lib/server/admin-api-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ clientId: string }> },
) {
  const adminIdentity = await requireAdminApiIdentity(req);
  if (!adminIdentity.ok) return adminIdentity.response;

  const { clientId } = await context.params;
  const admin = getSupabaseAdmin();

  const { data: client } = await admin
    .from('client_accounts')
    .select('id,email,user_id,full_name')
    .or(`id.eq.${clientId},user_id.eq.${clientId}`)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  if (!client.user_id) {
    return NextResponse.json({ error: 'Client has not signed in yet with this email.' }, { status: 400 });
  }

  const { data: loanRequests, error } = await admin
    .from('loan_requests')
    .select('*')
    .eq('user_id', client.user_id)
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    client,
    loanRequests: loanRequests ?? [],
  });
}
