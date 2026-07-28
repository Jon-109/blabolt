import type { User } from '@supabase/supabase-js';
import { TEMPLATE_TYPES } from '@/lib/stripe/catalog';
import type { TemplateType } from '@/lib/templates/types';
import {
  type AnyRow,
  buildPackagingProgress,
  computeTemplateProgress,
  deriveAccessFlags,
  filterApplicableRequirements,
  formatRequirementDisplayName,
  getGrantedTemplateTypes,
  normalizeDscrSnapshot,
} from '@/lib/admin/client-dashboard';
import { isDocumentExcludedFromPackage } from '@/lib/loan-packaging/document-state';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export type CustomerDashboardService = {
  key: 'comprehensive' | 'templates' | 'packaging' | 'brokering';
  title: string;
  description: string;
  href: string;
  status: string;
  progressPct: number;
  nextStep: string;
  enabled: boolean;
  accent: 'blue' | 'emerald' | 'amber' | 'purple';
};

export type CustomerDashboardPayload = {
  client: {
    id: string;
    clientAccountId: string | null;
    userId: string | null;
    fullName: string;
    businessName: string;
    email: string;
    portalMessage: string | null;
    portalEnabled: boolean;
  };
  isAdminPreview: boolean;
  services: CustomerDashboardService[];
  templates: Array<{ type: TemplateType; label: string; href: string; isAvailable: boolean; isStarted: boolean; isComplete: boolean }>;
  summary: {
    dscr: number | null;
    dscrYear: string | null;
    latestReportId: string | null;
    packageProgressPct: number | null;
    templateProgressPct: number;
    nextRequiredDocuments: Array<{ requirementKey: string; displayName: string; description: string }>;
  };
};

function coerceString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatTemplateTypeLabel(type: string): string {
  return type.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

async function resolveDashboardIdentity(args: { user?: Pick<User, 'id' | 'email' | 'user_metadata'> | null; clientId?: string | null }) {
  const admin = getSupabaseAdmin();
  const normalizedEmail = args.user?.email?.toLowerCase() ?? null;

  const accountResult = args.clientId
    ? await admin
        .from('client_accounts')
        .select('*')
        .or(`id.eq.${args.clientId},user_id.eq.${args.clientId}`)
        .maybeSingle()
    : normalizedEmail || args.user?.id
      ? await admin
          .from('client_accounts')
          .select('*')
          .or(`user_id.eq.${args.user?.id ?? '00000000-0000-0000-0000-000000000000'},email.eq.${normalizedEmail}`)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };

  const account = (accountResult.data as AnyRow | null) ?? null;
  let user: User | null = null;

  if (args.clientId) {
    const directUser = await admin.auth.admin.getUserById(args.clientId);
    user = directUser.data.user ?? null;
  }

  if (!user && account?.user_id) {
    const accountUser = await admin.auth.admin.getUserById(String(account.user_id));
    user = accountUser.data.user ?? null;
  }

  if (!user && args.user?.id) {
    const sessionUser = await admin.auth.admin.getUserById(args.user.id);
    user = sessionUser.data.user ?? null;
  }

  if (account?.id && user?.id && !account.user_id) {
    await admin.from('client_accounts').update({ user_id: user.id, updated_at: new Date().toISOString() }).eq('id', account.id);
  }

  return { account, user };
}

export async function buildCustomerDashboardPayload(args: {
  user?: Pick<User, 'id' | 'email' | 'user_metadata'> | null;
  clientId?: string | null;
  isAdminPreview?: boolean;
}): Promise<CustomerDashboardPayload | null> {
  const admin = getSupabaseAdmin();
  const { account, user } = await resolveDashboardIdentity(args);

  if (!account && !user) {
    return null;
  }

  const userId = user?.id ?? (typeof account?.user_id === 'string' ? account.user_id : null);
  const email = String(account?.email ?? user?.email ?? '').toLowerCase();

  let latestLoanRequest: AnyRow | null = null;
  let latestCashFlowAnalysis: AnyRow | null = null;
  let templateRows: AnyRow[] = [];
  let purchaseRows: AnyRow[] = [];
  let signedBrokerAgreement = false;
  let documentRows: AnyRow[] = [];
  let requirementRows: AnyRow[] = [];

  if (userId) {
    const [loanRequestResult, cashFlowResult, templatesResult, purchasesResult, brokerAgreementResult] = await Promise.all([
      admin
        .from('loan_requests')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['draft', 'in_progress', 'submitted', 'completed'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from('cash_flow_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from('template_submissions')
        .select('id,user_id,template_type,form_data,pdf_url,updated_at,archived_at,template_slot')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false }),
      admin
        .from('purchases')
        .select('product_type,paid')
        .eq('user_id', userId)
        .eq('paid', true),
      admin
        .from('broker_fee_agreements')
        .select('id,status')
        .eq('user_id', userId)
        .eq('status', 'signed')
        .limit(1)
        .maybeSingle(),
    ]);

    latestLoanRequest = (loanRequestResult.data as AnyRow | null) ?? null;
    latestCashFlowAnalysis = (cashFlowResult.data as AnyRow | null) ?? null;
    templateRows = (templatesResult.data ?? []) as AnyRow[];
    purchaseRows = (purchasesResult.data ?? []) as AnyRow[];
    signedBrokerAgreement = Boolean(brokerAgreementResult.data?.id);

    if (latestLoanRequest?.id) {
      const [documentsResult, requirementsResult] = await Promise.all([
        admin
          .from('loan_request_documents')
          .select('*')
          .eq('loan_request_id', String(latestLoanRequest.id))
          .eq('user_id', userId)
          .order('updated_at', { ascending: false }),
        admin
          .from('document_requirements')
          .select('requirement_key,service_type,loan_purpose,display_name,description,required,sort_order,is_active')
          .eq('is_active', true)
          .limit(500),
      ]);

      documentRows = (documentsResult.data ?? []) as AnyRow[];
      requirementRows = filterApplicableRequirements(
        (requirementsResult.data ?? []) as AnyRow[],
        String(latestLoanRequest.service_type ?? 'loan_packaging'),
        coerceString(latestLoanRequest.loan_purpose),
      );
    }
  }

  const purchaseTypes = new Set(purchaseRows.map((row) => String(row.product_type ?? '').trim()).filter(Boolean));
  const access = deriveAccessFlags(account, latestLoanRequest, purchaseTypes, signedBrokerAgreement);
  const dscr = normalizeDscrSnapshot(latestCashFlowAnalysis?.dscr ?? null);
  const templateSummary = computeTemplateProgress(templateRows);
  const packagingProgress = latestLoanRequest ? buildPackagingProgress(requirementRows, documentRows) : null;
  const availableTemplateTypes = access.hasLoanPackaging || access.hasLoanBrokering || access.hasTemplateAccess
    ? [...TEMPLATE_TYPES]
    : getGrantedTemplateTypes(account);
  const availableTemplateSet = new Set<TemplateType>(availableTemplateTypes);

  const activeTemplateRows = templateRows.filter((row) => !row.archived_at);
  const templates = TEMPLATE_TYPES.map((type) => {
    const row = activeTemplateRows.find((candidate) => String(candidate.template_type ?? '') === type);
    return {
      type,
      label: formatTemplateTypeLabel(type),
      href: `/templates/${type}`,
      isAvailable: availableTemplateSet.has(type),
      isStarted: Boolean(row),
      isComplete: Boolean(row?.pdf_url) || Boolean(row?.form_data && typeof row.form_data === 'object' && Object.keys(row.form_data as Record<string, unknown>).length > 0),
    };
  });

  const latestReportId = latestCashFlowAnalysis?.status === 'submitted' && latestCashFlowAnalysis?.id
    ? String(latestCashFlowAnalysis.id)
    : null;
  const documentByRequirement = new Map(documentRows.map((document) => [String(document.requirement_key ?? ''), document]));
  const nextRequiredDocuments = requirementRows
    .filter((requirement) => Boolean(requirement.required))
    .filter((requirement) => {
      const document = documentByRequirement.get(String(requirement.requirement_key ?? ''));
      if (isDocumentExcludedFromPackage(document)) return false;
      return !document || !['uploaded', 'generated', 'approved'].includes(String(document.status ?? ''));
    })
    .slice(0, 4)
    .map((requirement) => ({
      requirementKey: String(requirement.requirement_key ?? ''),
      displayName: formatRequirementDisplayName(String(requirement.requirement_key ?? ''), coerceString(requirement.display_name)),
      description: String(requirement.description ?? ''),
    }));

  const services: CustomerDashboardService[] = [
    {
      key: 'comprehensive',
      title: 'Comprehensive Cash Flow Analysis',
      description: 'Complete your DSCR analysis and review your lender-facing cash flow score.',
      href: latestReportId ? `/report-preview?id=${encodeURIComponent(latestReportId)}` : '/comprehensive-cash-flow-analysis',
      status: latestReportId ? 'Report Ready' : latestCashFlowAnalysis ? 'In Progress' : access.hasComprehensiveAccess ? 'Ready to Start' : 'Not Available',
      progressPct: latestReportId ? 100 : latestCashFlowAnalysis ? 60 : 0,
      nextStep: latestReportId ? 'View your completed report' : 'Complete your cash flow analysis',
      enabled: access.hasComprehensiveAccess,
      accent: 'blue',
    },
    {
      key: 'templates',
      title: 'Lender-Ready Templates',
      description: 'Fill out the templates your broker/admin assigned to your account.',
      href: '/templates',
      status: access.hasTemplateAccess ? `${templateSummary.progressPct}% Complete` : 'Not Available',
      progressPct: access.hasTemplateAccess ? templateSummary.progressPct : 0,
      nextStep: access.hasTemplateAccess ? templateSummary.nextStep : 'Ask your admin for template access',
      enabled: access.hasTemplateAccess,
      accent: 'emerald',
    },
    {
      key: 'packaging',
      title: 'Loan Packaging Workspace',
      description: 'Build a complete lender package with documents, templates, and loan details.',
      href: '/loan-packaging',
      status: access.hasLoanPackaging ? `${packagingProgress?.percentage ?? 0}% Complete` : 'Not Available',
      progressPct: access.hasLoanPackaging ? packagingProgress?.percentage ?? 0 : 0,
      nextStep: packagingProgress?.nextRequirement?.displayName ?? 'Start your loan package',
      enabled: access.hasLoanPackaging,
      accent: 'amber',
    },
    {
      key: 'brokering',
      title: 'Loan Brokering',
      description: 'Let Business Lending Advocate help match your lender-ready package with lender interest.',
      href: signedBrokerAgreement ? '/loan-packaging' : '/loan-brokering/agreement',
      status: access.hasLoanBrokering ? signedBrokerAgreement ? 'Agreement Signed' : 'Agreement Needed' : 'Not Available',
      progressPct: access.hasLoanBrokering ? signedBrokerAgreement ? 40 : 10 : 0,
      nextStep: signedBrokerAgreement ? 'Continue packaging for lender outreach' : 'Review and sign broker agreement',
      enabled: access.hasLoanBrokering,
      accent: 'purple',
    },
  ];

  return {
    client: {
      id: userId ?? String(account?.id ?? ''),
      clientAccountId: account?.id ? String(account.id) : null,
      userId,
      fullName: String(account?.full_name ?? user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? ''),
      businessName: String(account?.business_name ?? latestCashFlowAnalysis?.business_name ?? latestLoanRequest?.business_name ?? ''),
      email,
      portalMessage: coerceString(account?.portal_message),
      portalEnabled: account?.client_portal_enabled !== false,
    },
    isAdminPreview: Boolean(args.isAdminPreview),
    services,
    templates,
    summary: {
      dscr: dscr.currentValue,
      dscrYear: dscr.currentYear,
      latestReportId,
      packageProgressPct: packagingProgress?.percentage ?? null,
      templateProgressPct: templateSummary.progressPct,
      nextRequiredDocuments,
    },
  };
}
