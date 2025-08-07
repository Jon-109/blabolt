/** lib/templates/access.ts */

import type { TemplateType } from './types';

export interface AccessResult {
  allowed: boolean;
  reason: string;
  redirectUrl?: string;
}

/**
 * Check if a user has access to a specific template type.
 * In dev mode, all authenticated users have access to all templates.
 * Later, this will check for:
 * - Loan packaging subscription
 * - Template bundle purchase
 * - Individual template purchase
 */
export async function checkUserTemplateAccess(
  userId: string, 
  templateType: TemplateType
): Promise<AccessResult> {
  // DEV MODE: no paywall, all authenticated users have access
  if (userId) {
    return { 
      allowed: true, 
      reason: 'dev-mode' 
    };
  }

  // User not authenticated
  return {
    allowed: false,
    reason: 'not-authenticated',
    redirectUrl: '/login'
  };
}

/**
 * Check if a user has access to the templates hub.
 * In dev mode, all authenticated users have access.
 */
export async function checkTemplatesHubAccess(userId: string): Promise<AccessResult> {
  return checkUserTemplateAccess(userId, 'balance_sheet'); // Use any template for hub access
}

/**
 * Get available templates for a user.
 * In dev mode, returns all templates.
 * Later, will filter based on user's purchases/subscriptions.
 */
export async function getAvailableTemplates(userId: string): Promise<TemplateType[]> {
  const access = await checkTemplatesHubAccess(userId);
  
  if (!access.allowed) {
    return [];
  }

  // DEV MODE: return all templates
  return [
    'balance_sheet',
    'income_statement', 
    'personal_financial_statement',
    'personal_debt_summary',
    'business_debt_summary'
  ];
}
