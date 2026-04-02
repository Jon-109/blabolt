import { supabase } from '@/supabase/helpers/client';

export type TemplateSharedProfile = {
  personalName?: string;
  businessName?: string;
  businessLegalName?: string;
  loanPurpose?: string;
  loanAmount?: number;
  annualRevenue?: number;
  yearsInBusiness?: number;
  businessDescription?: string;
};

async function getSharedProfileAuthHeaders(): Promise<HeadersInit | undefined> {
  const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
  const accessToken = data.session?.access_token;

  if (!accessToken) {
    return undefined;
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function requestSharedProfile<T>(path: string, options?: RequestInit): Promise<T> {
  const authHeaders = await getSharedProfileAuthHeaders();

  const response = await fetch(path, {
    cache: 'no-store',
    ...options,
    headers: {
      ...(authHeaders ?? {}),
      ...(options?.headers ?? {}),
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error?: unknown }).error ?? 'Shared profile request failed')
        : 'Shared profile request failed';
    throw new Error(message);
  }

  return payload as T;
}

export async function getTemplateSharedProfile(userId: string): Promise<TemplateSharedProfile> {
  void userId;

  try {
    return await requestSharedProfile<TemplateSharedProfile>('/api/shared-profile');
  } catch (error) {
    console.error('Failed to load template shared profile:', error);
    return {};
  }
}

export async function upsertTemplateSharedProfile(
  userId: string,
  patch: TemplateSharedProfile,
): Promise<void> {
  void userId;

  try {
    await requestSharedProfile<TemplateSharedProfile>('/api/shared-profile', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  } catch (error) {
    console.error('Failed to upsert template shared profile:', error);
  }
}
