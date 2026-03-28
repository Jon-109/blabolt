import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/supabase/helpers/server';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export type AdminIdentity = {
  id: string;
  email: string;
};

const ALLOWED_ADMIN_EMAILS = new Set<string>([
  'jonathan@businesslendingadvocate.com',
  'rosantina@businesslendingadvocate.com',
  'jonathanfaranda@gmail.com',
]);

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWED_ADMIN_EMAILS.has(email.toLowerCase());
}

async function getSignedInUser() {
  const supabase = createClient(cookies());
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user?.id || !data.user.email) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email.toLowerCase(),
  };
}

async function tryBootstrapAdmin(identity: AdminIdentity): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { count } = await admin
    .from('admin_users')
    .select('id', { count: 'exact', head: true });

  if ((count ?? 0) > 0) {
    return false;
  }

  const bootstrap = (process.env.ADMIN_BOOTSTRAP_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (!bootstrap.includes(identity.email)) {
    return false;
  }

  await admin
    .from('admin_users')
    .upsert(
      {
        email: identity.email,
        user_id: identity.id,
        display_name: identity.email,
        is_active: true,
      },
      { onConflict: 'email' },
    );

  return true;
}

export async function getAdminIdentityOrNull(): Promise<AdminIdentity | null> {
  const identity = await getSignedInUser();
  if (!identity) {
    return null;
  }

  if (!isAllowedAdminEmail(identity.email)) {
    return null;
  }

  const admin = getSupabaseAdmin();
  const { data: byUserId } = await admin
    .from('admin_users')
    .select('id')
    .eq('is_active', true)
    .eq('user_id', identity.id)
    .limit(1)
    .maybeSingle();

  if (byUserId?.id) {
    return identity;
  }

  const { data: byEmail } = await admin
    .from('admin_users')
    .select('id')
    .eq('is_active', true)
    .eq('email', identity.email)
    .limit(1)
    .maybeSingle();

  if (byEmail?.id) {
    return identity;
  }

  const bootstrapped = await tryBootstrapAdmin(identity);
  if (bootstrapped) {
    return identity;
  }

  return null;
}

export async function requireAdminIdentity(): Promise<AdminIdentity> {
  const identity = await getAdminIdentityOrNull();
  if (!identity) {
    redirect('/login?redirectTo=/admin');
  }

  return identity;
}
