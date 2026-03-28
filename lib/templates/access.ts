/** lib/templates/access.ts */

import type { TemplateType } from './types';
import { supabase } from '@/supabase/helpers/client';
import { getTemplateServicePagePath } from '@/lib/template-offers';

export interface AccessResult {
  allowed: boolean;
  reason: string;
  redirectUrl?: string;
}

type AccessPayload = {
  availableTemplates: TemplateType[];
  isAuthenticated: boolean;
  canAccessTemplates: boolean;
};

async function getAccessPayload(): Promise<AccessPayload | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch('/api/access/me', {
      cache: 'no-store',
      headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : undefined,
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    return {
      availableTemplates: Array.isArray(json?.availableTemplates) ? json.availableTemplates : [],
      isAuthenticated: Boolean(json?.isAuthenticated),
      canAccessTemplates: Boolean(json?.canAccessTemplates),
    };
  } catch {
    return null;
  }
}

export async function checkUserTemplateAccess(
  userId: string,
  _templateType: TemplateType,
): Promise<AccessResult> {
  if (!userId) {
    return {
      allowed: false,
      reason: 'not-authenticated',
      redirectUrl: '/login',
    };
  }

  const access = await getAccessPayload();
  if (!access?.isAuthenticated) {
    return {
      allowed: false,
      reason: 'not-authenticated',
      redirectUrl: '/login',
    };
  }

  if (!access.canAccessTemplates) {
    return {
      allowed: false,
      reason: 'templates-access-required',
      redirectUrl: '/services/templates-bundle',
    };
  }

  if (!access.availableTemplates.includes(_templateType)) {
    return {
      allowed: false,
      reason: 'template-access-required',
      redirectUrl: getTemplateServicePagePath(_templateType),
    };
  }

  return {
    allowed: true,
    reason: 'templates-access-granted',
  };
}

export async function checkTemplatesHubAccess(userId: string): Promise<AccessResult> {
  if (!userId) {
    return {
      allowed: false,
      reason: 'not-authenticated',
      redirectUrl: '/login',
    };
  }

  const access = await getAccessPayload();
  if (!access?.isAuthenticated) {
    return {
      allowed: false,
      reason: 'not-authenticated',
      redirectUrl: '/login',
    };
  }

  if (!access.canAccessTemplates || access.availableTemplates.length === 0) {
    return {
      allowed: false,
      reason: 'templates-access-required',
      redirectUrl: '/services/templates-bundle',
    };
  }

  return {
    allowed: true,
    reason: 'templates-access-granted',
  };
}

export async function getAvailableTemplates(userId: string): Promise<TemplateType[]> {
  if (!userId) {
    return [];
  }

  const access = await getAccessPayload();
  if (!access?.isAuthenticated || !access.canAccessTemplates) {
    return [];
  }

  return access.availableTemplates;
}
