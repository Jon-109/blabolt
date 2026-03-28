import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

type AnyRow = Record<string, unknown>;

export interface SharedProfileSnapshot {
  personalName?: string;
  businessName?: string;
  businessLegalName?: string;
  loanPurpose?: string;
  loanAmount?: number;
  annualRevenue?: number;
  yearsInBusiness?: number;
  businessDescription?: string;
}

export interface SharedProfilePatch {
  personalName?: string | null;
  businessName?: string | null;
  businessLegalName?: string | null;
  loanPurpose?: string | null;
  loanAmount?: number | string | null;
  annualRevenue?: number | string | null;
  yearsInBusiness?: number | string | null;
  businessDescription?: string | null;
}

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
    const normalized = Number(value.replace(/,/g, '').trim());
    return Number.isFinite(normalized) ? normalized : undefined;
  }

  return undefined;
}

function normalizeStringPatch(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return asTrimmedString(value) ?? null;
}

function normalizeNumberPatch(value: unknown): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  return asFiniteNumber(value) ?? null;
}

function pickFirstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    const next = asTrimmedString(value);
    if (next) {
      return next;
    }
  }

  return undefined;
}

function pickFirstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    const next = asFiniteNumber(value);
    if (next !== undefined) {
      return next;
    }
  }

  return undefined;
}

function mapSharedProfileRow(row: AnyRow | null): SharedProfileSnapshot {
  if (!row) {
    return {};
  }

  return {
    personalName: pickFirstString(row.personal_name),
    businessName: pickFirstString(row.business_name),
    businessLegalName: pickFirstString(row.business_legal_name),
    loanPurpose: pickFirstString(row.loan_purpose),
    loanAmount: pickFirstNumber(row.loan_amount),
    annualRevenue: pickFirstNumber(row.annual_revenue),
    yearsInBusiness: pickFirstNumber(row.years_in_business),
    businessDescription: pickFirstString(row.business_description),
  };
}

export function normalizeSharedProfilePatch(
  patch: SharedProfilePatch,
): Record<string, string | number | null> {
  const normalized: Record<string, string | number | null> = {};

  const personalName = normalizeStringPatch(patch.personalName);
  if (personalName !== undefined) normalized.personal_name = personalName;

  const businessName = normalizeStringPatch(patch.businessName);
  if (businessName !== undefined) normalized.business_name = businessName;

  const businessLegalName = normalizeStringPatch(patch.businessLegalName);
  if (businessLegalName !== undefined) normalized.business_legal_name = businessLegalName;

  const loanPurpose = normalizeStringPatch(patch.loanPurpose);
  if (loanPurpose !== undefined) normalized.loan_purpose = loanPurpose;

  const loanAmount = normalizeNumberPatch(patch.loanAmount);
  if (loanAmount !== undefined) normalized.loan_amount = loanAmount;

  const annualRevenue = normalizeNumberPatch(patch.annualRevenue);
  if (annualRevenue !== undefined) normalized.annual_revenue = annualRevenue;

  const yearsInBusiness = normalizeNumberPatch(patch.yearsInBusiness);
  if (yearsInBusiness !== undefined) normalized.years_in_business = yearsInBusiness;

  const businessDescription = normalizeStringPatch(patch.businessDescription);
  if (businessDescription !== undefined) normalized.business_description = businessDescription;

  return normalized;
}

export async function getSharedProfileSnapshot(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
): Promise<SharedProfileSnapshot> {
  const [profileResult, loanRequestResult, cashFlowResult] = await Promise.all([
    admin
      .from('user_template_profiles')
      .select(
        'personal_name,business_name,business_legal_name,loan_purpose,loan_amount,annual_revenue,years_in_business,business_description',
      )
      .eq('user_id', userId)
      .maybeSingle(),
    admin
      .from('loan_requests')
      .select(
        'business_name,loan_purpose,loan_amount,annual_revenue,years_in_business,business_description,updated_at',
      )
      .eq('user_id', userId)
      .in('status', ['draft', 'in_progress', 'submitted', 'completed'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('cash_flow_analyses')
      .select('business_name,loan_purpose,desired_amount,updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const profile = mapSharedProfileRow((profileResult.data as AnyRow | null) ?? null);
  const loanRequest = (loanRequestResult.data as AnyRow | null) ?? null;
  const cashFlow = (cashFlowResult.data as AnyRow | null) ?? null;

  return {
    personalName: profile.personalName,
    businessName: pickFirstString(
      profile.businessName,
      profile.businessLegalName,
      loanRequest?.business_name,
      cashFlow?.business_name,
    ),
    businessLegalName: pickFirstString(
      profile.businessLegalName,
      profile.businessName,
      loanRequest?.business_name,
      cashFlow?.business_name,
    ),
    loanPurpose: pickFirstString(
      profile.loanPurpose,
      loanRequest?.loan_purpose,
      cashFlow?.loan_purpose,
    ),
    loanAmount: pickFirstNumber(
      profile.loanAmount,
      loanRequest?.loan_amount,
      cashFlow?.desired_amount,
    ),
    annualRevenue: pickFirstNumber(profile.annualRevenue, loanRequest?.annual_revenue),
    yearsInBusiness: pickFirstNumber(profile.yearsInBusiness, loanRequest?.years_in_business),
    businessDescription: pickFirstString(
      profile.businessDescription,
      loanRequest?.business_description,
    ),
  };
}

export async function upsertSharedProfileAndSync(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  patch: SharedProfilePatch,
): Promise<SharedProfileSnapshot> {
  const normalized = normalizeSharedProfilePatch(patch);

  if (Object.keys(normalized).length === 0) {
    return getSharedProfileSnapshot(admin, userId);
  }

  const nowIso = new Date().toISOString();

  await admin.from('user_template_profiles').upsert(
    {
      user_id: userId,
      ...normalized,
      updated_at: nowIso,
    },
    {
      onConflict: 'user_id',
    },
  );

  const loanRequestUpdates: AnyRow = {
    updated_at: nowIso,
  };

  if ('business_name' in normalized) loanRequestUpdates.business_name = normalized.business_name;
  if ('loan_purpose' in normalized) loanRequestUpdates.loan_purpose = normalized.loan_purpose;
  if ('loan_amount' in normalized) loanRequestUpdates.loan_amount = normalized.loan_amount;
  if ('annual_revenue' in normalized) loanRequestUpdates.annual_revenue = normalized.annual_revenue;
  if ('years_in_business' in normalized) {
    loanRequestUpdates.years_in_business = normalized.years_in_business;
  }
  if ('business_description' in normalized) {
    loanRequestUpdates.business_description = normalized.business_description;
  }

  if (Object.keys(loanRequestUpdates).length > 1) {
    await admin
      .from('loan_requests')
      .update(loanRequestUpdates)
      .eq('user_id', userId)
      .in('status', ['draft', 'in_progress', 'submitted', 'completed']);
  }

  if ('business_name' in normalized) {
    await admin
      .from('cash_flow_analyses')
      .update({
        business_name: normalized.business_name,
        updated_at: nowIso,
      })
      .eq('user_id', userId)
      .eq('status', 'inprogress');
  }

  return getSharedProfileSnapshot(admin, userId);
}
