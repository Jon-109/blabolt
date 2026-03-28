import { NextRequest, NextResponse } from 'next/server';
import { getAdminIdentityOrNull, isAllowedAdminEmail } from '@/lib/server/admin-access';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { isApiUserFailure, requireApiUser } from '@/lib/server/request-auth';

export type AdminApiIdentity = {
  id: string;
  email: string;
};

export async function requireAdminApiIdentity(req: NextRequest): Promise<
  | { ok: true; identity: AdminApiIdentity }
  | { ok: false; response: NextResponse }
> {
  const cookieIdentity = await getAdminIdentityOrNull();
  if (cookieIdentity) {
    return { ok: true, identity: cookieIdentity };
  }

  const apiUser = await requireApiUser(req);
  if (isApiUserFailure(apiUser)) {
    return { ok: false, response: apiUser.response };
  }

  const email = apiUser.user.email?.toLowerCase() ?? '';
  if (!isAllowedAdminEmail(email)) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from('admin_users')
    .select('id')
    .eq('is_active', true)
    .or(`user_id.eq.${apiUser.user.id},email.eq.${email}`)
    .limit(1)
    .maybeSingle();

  if (!data?.id) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return {
    ok: true,
    identity: {
      id: apiUser.user.id,
      email,
    },
  };
}
