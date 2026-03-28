import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/supabase/helpers/server';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { isAllowedAdminEmail } from '@/lib/server/admin-access';
import { TEMPLATE_TYPES, isTemplateType } from '@/lib/stripe/catalog';
import type { TemplateType } from '@/lib/templates/types';

export type ServiceAccess = {
  availableTemplates: TemplateType[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasLoanPackaging: boolean;
  hasLoanBrokering: boolean;
  hasComprehensiveOnlyPurchase: boolean;
  canAccessLoanPackaging: boolean;
  canAccessTemplates: boolean;
  canAccessComprehensive: boolean;
  role: 'anonymous' | 'admin' | 'full_service' | 'comprehensive_only' | 'basic';
};

const FULL_ACCESS_PRODUCT_TYPES = new Set(['loan_packaging', 'loan_brokering']);

function freeComprehensiveEnabled(): boolean {
  return process.env.FREE_COMPREHENSIVE_ACCESS === 'true';
}

function baseAnonymousAccess(): ServiceAccess {
  return {
    availableTemplates: [],
    isAuthenticated: false,
    isAdmin: false,
    hasLoanPackaging: false,
    hasLoanBrokering: false,
    hasComprehensiveOnlyPurchase: false,
    canAccessLoanPackaging: false,
    canAccessTemplates: false,
    canAccessComprehensive: false,
    role: 'anonymous',
  };
}

export async function resolveServiceAccessForUser(user: Pick<User, 'id' | 'email'> | null): Promise<ServiceAccess> {
  if (!user?.id) {
    return baseAnonymousAccess();
  }

  const admin = getSupabaseAdmin();
  const normalizedEmail = user.email?.toLowerCase() ?? null;

  const [adminMatch, purchasesResult, loanRequestsResult, legacyPackagingResult, clientAccountResult, brokerAgreementResult] = await Promise.all([
    isAllowedAdminEmail(normalizedEmail)
      ? admin
          .from('admin_users')
          .select('id')
          .eq('is_active', true)
          .or(`user_id.eq.${user.id},email.eq.${normalizedEmail}`)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null } as { data: { id: number } | null }),
    admin
      .from('purchases')
      .select('product_type,paid')
      .eq('user_id', user.id)
      .eq('paid', true),
    admin
      .from('loan_requests')
      .select('service_type,status')
      .eq('user_id', user.id)
      .limit(25),
    admin
      .from('loan_packaging')
      .select('service_type,status,payment_status')
      .eq('user_id', user.id)
      .limit(25),
    admin
      .from('client_accounts')
      .select('service_level,access_comprehensive,access_templates,access_packaging')
      .or(`user_id.eq.${user.id},email.eq.${normalizedEmail}`)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('broker_fee_agreements')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'signed')
      .limit(1)
      .maybeSingle(),
  ]);

  const purchaseTypes = new Set(
    (purchasesResult.data ?? [])
      .map((row) => String(row.product_type ?? '').trim())
      .filter(Boolean),
  );
  const purchasedTemplateTypes = new Set(
    Array.from(purchaseTypes).filter((type): type is TemplateType => isTemplateType(type)),
  );

  const requestedServiceTypes = [
    ...(loanRequestsResult.data ?? []).map((row) => String(row.service_type ?? '').trim()),
    ...(legacyPackagingResult.data ?? []).map((row) => String(row.service_type ?? '').trim()),
  ].filter(Boolean);

  const hasLoanPackaging =
    purchaseTypes.has('loan_packaging') ||
    requestedServiceTypes.includes('loan_packaging');

  const hasSignedBrokerAgreement = Boolean(brokerAgreementResult.data?.id);
  const hasLoanBrokering =
    purchaseTypes.has('loan_brokering') ||
    hasSignedBrokerAgreement;

  const hasComprehensiveOnlyPurchase = purchaseTypes.has('cash_flow_analysis');
  const hasTemplatesBundlePurchase = purchaseTypes.has('templates_bundle');
  const clientAccount = clientAccountResult.data;
  const accountServiceLevel = String(clientAccount?.service_level ?? 'none');
  const accountComprehensive = Boolean(clientAccount?.access_comprehensive);
  const accountTemplates = Boolean(clientAccount?.access_templates);
  const accountPackaging = Boolean(clientAccount?.access_packaging);
  const isAdmin = Boolean(adminMatch.data?.id);
  const hasFullService =
    hasLoanPackaging ||
    hasLoanBrokering ||
    accountPackaging ||
    accountServiceLevel === 'packaging' ||
    accountServiceLevel === 'brokering' ||
    Array.from(purchaseTypes).some((type) => FULL_ACCESS_PRODUCT_TYPES.has(type));

  const canAccessLoanPackaging = isAdmin || hasFullService;
  // Loan Packaging and Loan Brokering both include the full templates bundle.
  const hasIncludedTemplatesBundleAccess = hasFullService;
  const availableTemplates =
    isAdmin ||
    hasIncludedTemplatesBundleAccess ||
    accountTemplates ||
    accountServiceLevel === 'templates' ||
    accountServiceLevel === 'packaging' ||
    accountServiceLevel === 'brokering' ||
    hasTemplatesBundlePurchase
      ? [...TEMPLATE_TYPES]
      : TEMPLATE_TYPES.filter((templateType) => purchasedTemplateTypes.has(templateType));
  const canAccessTemplates = availableTemplates.length > 0;
  const canAccessComprehensive =
    isAdmin ||
    hasFullService ||
    accountComprehensive ||
    accountServiceLevel === 'comprehensive' ||
    accountServiceLevel === 'packaging' ||
    accountServiceLevel === 'brokering' ||
    hasComprehensiveOnlyPurchase ||
    freeComprehensiveEnabled();

  let role: ServiceAccess['role'] = 'basic';
  if (isAdmin) {
    role = 'admin';
  } else if (hasFullService) {
    role = 'full_service';
  } else if (hasComprehensiveOnlyPurchase) {
    role = 'comprehensive_only';
  }

  return {
    availableTemplates,
    isAuthenticated: true,
    isAdmin,
    hasLoanPackaging,
    hasLoanBrokering,
    hasComprehensiveOnlyPurchase,
    canAccessLoanPackaging,
    canAccessTemplates,
    canAccessComprehensive,
    role,
  };
}

export async function getServiceAccessFromSession(): Promise<ServiceAccess> {
  const supabase = createClient(cookies());
  const { data } = await supabase.auth.getUser();
  return resolveServiceAccessForUser(data.user ?? null);
}

export async function requirePageServiceAccess(
  service: 'loan_packaging' | 'templates' | 'comprehensive',
): Promise<ServiceAccess> {
  const access = await getServiceAccessFromSession();
  const loginRedirect =
    service === 'loan_packaging'
      ? '/login?redirectTo=/loan-packaging'
      : service === 'templates'
        ? '/login?redirectTo=/templates'
        : '/login?redirectTo=/comprehensive-cash-flow-analysis';

  if (!access.isAuthenticated) {
    redirect(loginRedirect);
  }

  const allowed =
    service === 'loan_packaging'
      ? access.canAccessLoanPackaging
      : service === 'templates'
        ? access.canAccessTemplates
        : access.canAccessComprehensive;

  if (!allowed) {
    redirect('/cash-flow-analysis');
  }

  return access;
}
