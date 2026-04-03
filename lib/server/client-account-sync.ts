import type { User } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import {
  normalizeSharedProfilePatch,
  type SharedProfilePatch,
  type SharedProfileSnapshot,
  upsertSharedProfileAndSync,
} from '@/lib/server/shared-profile';

type AnyRow = Record<string, unknown>;

function asTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = Number(value.replace(/[$,%\s,]/g, '').trim());
    return Number.isFinite(normalized) ? normalized : undefined;
  }

  return undefined;
}

function asObject(value: unknown): AnyRow | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as AnyRow;
}

function readPendingSharedProfilePayload(account: AnyRow | null): Record<string, string | number | null> {
  const pending = asObject(account?.pending_shared_profile);
  if (!pending) {
    return {};
  }

  const normalized: Record<string, string | number | null> = {};

  const personalName = asTrimmedString(pending.personal_name ?? pending.personalName);
  if (personalName !== undefined) normalized.personal_name = personalName;

  const businessName = asTrimmedString(pending.business_name ?? pending.businessName);
  if (businessName !== undefined) normalized.business_name = businessName;

  const businessLegalName = asTrimmedString(pending.business_legal_name ?? pending.businessLegalName);
  if (businessLegalName !== undefined) normalized.business_legal_name = businessLegalName;

  const loanPurpose = asTrimmedString(pending.loan_purpose ?? pending.loanPurpose);
  if (loanPurpose !== undefined) normalized.loan_purpose = loanPurpose;

  const loanAmount = asFiniteNumber(pending.loan_amount ?? pending.loanAmount);
  if (loanAmount !== undefined) normalized.loan_amount = loanAmount;

  const annualRevenue = asFiniteNumber(pending.annual_revenue ?? pending.annualRevenue);
  if (annualRevenue !== undefined) normalized.annual_revenue = annualRevenue;

  const yearsInBusiness = asFiniteNumber(pending.years_in_business ?? pending.yearsInBusiness);
  if (yearsInBusiness !== undefined) normalized.years_in_business = yearsInBusiness;

  const businessDescription = asTrimmedString(pending.business_description ?? pending.businessDescription);
  if (businessDescription !== undefined) normalized.business_description = businessDescription;

  return normalized;
}

function toSharedProfilePatch(
  payload: Record<string, string | number | null>,
): SharedProfilePatch {
  return {
    personalName: 'personal_name' in payload ? (payload.personal_name as string | null) : undefined,
    businessName: 'business_name' in payload ? (payload.business_name as string | null) : undefined,
    businessLegalName: 'business_legal_name' in payload ? (payload.business_legal_name as string | null) : undefined,
    loanPurpose: 'loan_purpose' in payload ? (payload.loan_purpose as string | null) : undefined,
    loanAmount: 'loan_amount' in payload ? (payload.loan_amount as number | null) : undefined,
    annualRevenue: 'annual_revenue' in payload ? (payload.annual_revenue as number | null) : undefined,
    yearsInBusiness: 'years_in_business' in payload ? (payload.years_in_business as number | null) : undefined,
    businessDescription: 'business_description' in payload
      ? (payload.business_description as string | null)
      : undefined,
  };
}

export function getPendingSharedProfileSnapshot(account: AnyRow | null): SharedProfileSnapshot {
  const payload = readPendingSharedProfilePayload(account);

  return {
    personalName: typeof payload.personal_name === 'string' ? payload.personal_name : undefined,
    businessName: typeof payload.business_name === 'string' ? payload.business_name : undefined,
    businessLegalName: typeof payload.business_legal_name === 'string' ? payload.business_legal_name : undefined,
    loanPurpose: typeof payload.loan_purpose === 'string' ? payload.loan_purpose : undefined,
    loanAmount: typeof payload.loan_amount === 'number' ? payload.loan_amount : undefined,
    annualRevenue: typeof payload.annual_revenue === 'number' ? payload.annual_revenue : undefined,
    yearsInBusiness: typeof payload.years_in_business === 'number' ? payload.years_in_business : undefined,
    businessDescription: typeof payload.business_description === 'string' ? payload.business_description : undefined,
  };
}

export async function stagePendingSharedProfile(
  admin: ReturnType<typeof getSupabaseAdmin>,
  account: AnyRow,
  patch: SharedProfilePatch,
) {
  const nextPending = {
    ...readPendingSharedProfilePayload(account),
    ...normalizeSharedProfilePatch(patch),
  };

  const { data, error } = await admin
    .from('client_accounts')
    .update({
      pending_shared_profile: nextPending,
      updated_at: new Date().toISOString(),
    })
    .eq('id', String(account.id))
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return (data as AnyRow | null) ?? null;
}

export async function syncClientAccountForAuthUser(
  admin: ReturnType<typeof getSupabaseAdmin>,
  user: Pick<User, 'id' | 'email' | 'user_metadata'> | null,
) {
  if (!user?.id || !user.email) {
    return null;
  }

  const normalizedEmail = user.email.toLowerCase();
  const accountResult = await admin
    .from('client_accounts')
    .select('*')
    .or(`user_id.eq.${user.id},email.eq.${normalizedEmail}`)
    .order('updated_at', { ascending: false })
    .limit(10);

  const accounts = (accountResult.data ?? []) as AnyRow[];
  const matchedAccount =
    accounts.find((row) => String(row.user_id ?? '') === user.id) ??
    accounts.find((row) => String(row.email ?? '').toLowerCase() === normalizedEmail) ??
    null;

  if (!matchedAccount) {
    return null;
  }

  const accountUpdates: AnyRow = {};
  const accountName = asTrimmedString(matchedAccount.full_name);
  const userName = asTrimmedString(user.user_metadata?.full_name) ?? asTrimmedString(user.user_metadata?.name);

  if (String(matchedAccount.user_id ?? '') !== user.id) {
    accountUpdates.user_id = user.id;
  }

  if (String(matchedAccount.email ?? '').toLowerCase() !== normalizedEmail) {
    accountUpdates.email = normalizedEmail;
  }

  if (!accountName && userName) {
    accountUpdates.full_name = userName;
  }

  let account = matchedAccount;

  if (Object.keys(accountUpdates).length > 0) {
    const { data, error } = await admin
      .from('client_accounts')
      .update({
        ...accountUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', String(matchedAccount.id))
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    account = (data as AnyRow | null) ?? matchedAccount;
  }

  const pendingSharedProfile = readPendingSharedProfilePayload(account);
  if (Object.keys(pendingSharedProfile).length > 0) {
    await upsertSharedProfileAndSync(admin, user.id, toSharedProfilePatch(pendingSharedProfile));

    const { data, error } = await admin
      .from('client_accounts')
      .update({
        pending_shared_profile: {},
        updated_at: new Date().toISOString(),
      })
      .eq('id', String(account.id))
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    account = (data as AnyRow | null) ?? account;
  }

  return account;
}
