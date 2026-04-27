import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApiIdentity } from '@/lib/server/admin-api-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import {
  type AnyRow,
  buildPackagingProgress,
  computeTemplateProgress,
  deriveAccessFlags,
  derivePrimaryServiceLabel,
  deriveServicePills,
  filterApplicableRequirements,
  getGrantedTemplateTypes,
  normalizeDscrSnapshot,
} from '@/lib/admin/client-dashboard';

const templateTypeSchema = z.enum([
  'balance_sheet',
  'income_statement',
  'business_debt_summary',
  'personal_financial_statement',
  'personal_debt_summary',
]);

export const runtime = 'nodejs';

const optionalNameSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  },
  z.string().min(2).max(180).optional(),
);

const optionalEmailSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim().toLowerCase();
    return trimmed.length > 0 ? trimmed : undefined;
  },
  z.string().email().optional(),
);

const createClientSchema = z.object({
  fullName: optionalNameSchema,
  email: optionalEmailSchema,
}).superRefine((value, ctx) => {
  if (!value.fullName && !value.email) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Either a client name or email is required.',
      path: ['fullName'],
    });
  }
});

const actionSchema = z.object({
  clientId: z.string(),
  action: z.enum([
    'grant_templates',
    'revoke_templates',
    'grant_template',
    'revoke_template',
    'grant_packaging',
    'revoke_packaging',
    'grant_comprehensive',
    'revoke_comprehensive',
  ]),
  templateType: templateTypeSchema.optional(),
});

function latestIsoDate(...values: unknown[]): string {
  const latest = values.reduce<number>((current, value) => {
    if (typeof value !== 'string' && !(value instanceof Date)) {
      return current;
    }

    const parsed = new Date(value).getTime();
    if (Number.isNaN(parsed)) {
      return current;
    }

    return Math.max(current, parsed);
  }, 0);

  return latest > 0 ? new Date(latest).toISOString() : new Date().toISOString();
}

async function ensureClientAccountRow(admin: ReturnType<typeof getSupabaseAdmin>, clientId: string) {
  const existing = await admin
    .from('client_accounts')
    .select('*')
    .or(`id.eq.${clientId},user_id.eq.${clientId}`)
    .maybeSingle();

  if (existing.data) {
    return existing.data as AnyRow;
  }

  const authUserResult = await admin.auth.admin.getUserById(clientId);
  const authUser = authUserResult.data.user;

  if (!authUser?.email) {
    return null;
  }

  const { data } = await admin
    .from('client_accounts')
    .upsert(
      {
        user_id: authUser.id,
        email: authUser.email.toLowerCase(),
        full_name:
          (typeof authUser.user_metadata?.full_name === 'string' && authUser.user_metadata.full_name) ||
          (typeof authUser.user_metadata?.name === 'string' && authUser.user_metadata.name) ||
          null,
      },
      { onConflict: 'email' },
    )
    .select('*')
    .single();

  return (data as AnyRow | null) ?? null;
}

export async function GET(req: NextRequest) {
  const adminIdentity = await requireAdminApiIdentity(req);
  if (!adminIdentity.ok) return adminIdentity.response;

  const admin = getSupabaseAdmin();

  const [
    clientsResult,
    usersPage,
    loanRequestsResult,
    templateSubmissionsResult,
    documentsResult,
    purchasesResult,
    cashFlowResult,
    requirementsResult,
    brokerAgreementResult,
  ] = await Promise.all([
    admin
      .from('client_accounts')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(2000),
    admin.auth.admin.listUsers({ page: 1, perPage: 2000 }),
    admin
      .from('loan_requests')
      .select('id,user_id,service_type,status,business_name,loan_purpose,loan_amount,updated_at')
      .order('updated_at', { ascending: false })
      .limit(10000),
    admin
      .from('template_submissions')
      .select('id,user_id,template_type,form_data,pdf_url,updated_at,archived_at')
      .order('updated_at', { ascending: false })
      .limit(20000),
    admin
      .from('loan_request_documents')
      .select('loan_request_id,user_id,requirement_key,status,updated_at,uploaded_at,excluded_from_package,excluded_at')
      .order('updated_at', { ascending: false })
      .limit(20000),
    admin
      .from('purchases')
      .select('user_id,product_type,paid')
      .eq('paid', true)
      .limit(20000),
    admin
      .from('cash_flow_analyses')
      .select('id,user_id,status,dscr,updated_at')
      .order('updated_at', { ascending: false })
      .limit(5000),
    admin
      .from('document_requirements')
      .select('requirement_key,service_type,loan_purpose,display_name,description,required,sort_order,is_active')
      .eq('is_active', true)
      .limit(500),
    admin
      .from('broker_fee_agreements')
      .select('user_id,status')
      .eq('status', 'signed')
      .limit(5000),
  ]);

  if (
    clientsResult.error ||
    loanRequestsResult.error ||
    templateSubmissionsResult.error ||
    documentsResult.error ||
    purchasesResult.error ||
    cashFlowResult.error ||
    requirementsResult.error ||
    brokerAgreementResult.error
  ) {
    return NextResponse.json({
      error:
        clientsResult.error?.message ||
        loanRequestsResult.error?.message ||
        templateSubmissionsResult.error?.message ||
        documentsResult.error?.message ||
        purchasesResult.error?.message ||
        cashFlowResult.error?.message ||
        requirementsResult.error?.message ||
        brokerAgreementResult.error?.message ||
        'Failed to load clients.',
    }, { status: 500 });
  }

  const users = usersPage.data?.users ?? [];
  const accountRows = (clientsResult.data ?? []) as AnyRow[];
  const loanRequests = (loanRequestsResult.data ?? []) as AnyRow[];
  const templateSubmissions = (templateSubmissionsResult.data ?? []) as AnyRow[];
  const documents = (documentsResult.data ?? []) as AnyRow[];
  const purchases = (purchasesResult.data ?? []) as AnyRow[];
  const cashFlowAnalyses = (cashFlowResult.data ?? []) as AnyRow[];
  const requirements = (requirementsResult.data ?? []) as AnyRow[];
  const brokerAgreements = (brokerAgreementResult.data ?? []) as AnyRow[];

  const accountByEmail = new Map(accountRows.map((row) => [String(row.email ?? '').toLowerCase(), row]));

  const latestLoanRequestByUser = new Map<string, AnyRow>();
  for (const row of loanRequests) {
    const key = String(row.user_id ?? '');
    if (!key || latestLoanRequestByUser.has(key)) continue;
    latestLoanRequestByUser.set(key, row);
  }

  const templatesByUser = new Map<string, AnyRow[]>();
  for (const row of templateSubmissions) {
    const key = String(row.user_id ?? '');
    if (!key) continue;
    if (!templatesByUser.has(key)) templatesByUser.set(key, []);
    templatesByUser.get(key)!.push(row);
  }

  const documentsByLoanRequest = new Map<string, AnyRow[]>();
  for (const row of documents) {
    const key = String(row.loan_request_id ?? '');
    if (!key) continue;
    if (!documentsByLoanRequest.has(key)) documentsByLoanRequest.set(key, []);
    documentsByLoanRequest.get(key)!.push(row);
  }

  const purchaseTypesByUser = new Map<string, Set<string>>();
  for (const row of purchases) {
    const key = String(row.user_id ?? '');
    const productType = String(row.product_type ?? '').trim();
    if (!key || !productType) continue;
    if (!purchaseTypesByUser.has(key)) purchaseTypesByUser.set(key, new Set<string>());
    purchaseTypesByUser.get(key)!.add(productType);
  }

  const latestCashFlowByUser = new Map<string, AnyRow>();
  for (const row of cashFlowAnalyses) {
    const key = String(row.user_id ?? '');
    if (!key || latestCashFlowByUser.has(key)) continue;
    latestCashFlowByUser.set(key, row);
  }

  const signedBrokerAgreementUsers = new Set(
    brokerAgreements
      .map((row) => String(row.user_id ?? ''))
      .filter(Boolean),
  );

  const clientsFromUsers = users
    .filter((user) => Boolean(user.email))
    .map((user) => {
      const email = String(user.email).toLowerCase();
      const accountRow = accountByEmail.get(email);
      const userId = String(user.id);
      const latestLoanRequest = latestLoanRequestByUser.get(userId) ?? null;
      const userTemplates = templatesByUser.get(userId) ?? [];
      const purchaseTypes = purchaseTypesByUser.get(userId) ?? new Set<string>();
      const latestCashFlow = latestCashFlowByUser.get(userId) ?? null;
      const hasSignedBrokerAgreement = signedBrokerAgreementUsers.has(userId);

      const access = deriveAccessFlags(accountRow, latestLoanRequest, purchaseTypes, hasSignedBrokerAgreement);
      const services = deriveServicePills({
        accountRow,
        latestLoanRequest,
        purchaseTypes,
        hasSignedBrokerAgreement,
      });

      let progressPct = 0;
      let nextStep = 'No active service';

      if (access.hasLoanPackaging && latestLoanRequest) {
        const applicableRequirements = filterApplicableRequirements(
          requirements,
          String(latestLoanRequest.service_type ?? 'loan_packaging'),
          typeof latestLoanRequest.loan_purpose === 'string' ? latestLoanRequest.loan_purpose : null,
        );
        const packagingProgress = buildPackagingProgress(
          applicableRequirements,
          documentsByLoanRequest.get(String(latestLoanRequest.id ?? '')) ?? [],
        );
        progressPct = packagingProgress.percentage;
        nextStep = packagingProgress.nextRequirement?.displayName ?? 'Package Complete';
      } else if (access.hasTemplateAccess) {
        const templateProgress = computeTemplateProgress(userTemplates);
        progressPct = templateProgress.progressPct;
        nextStep = templateProgress.nextStep;
      } else if (latestCashFlow) {
        progressPct = String(latestCashFlow.status ?? '') === 'submitted' ? 100 : 70;
        nextStep = String(latestCashFlow.status ?? '') === 'submitted'
          ? 'Analysis Submitted'
          : 'Finish Comprehensive Cash Flow Analysis';
      } else if (access.hasComprehensiveAccess) {
        progressPct = 10;
        nextStep = 'Complete DSCR Check';
      }

      if (typeof accountRow?.next_step === 'string' && accountRow.next_step.trim()) {
        nextStep = accountRow.next_step.trim();
      }

      const dscr = normalizeDscrSnapshot(latestCashFlow?.dscr ?? null);

      return {
        id: userId,
        fullName: String(accountRow?.full_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''),
        email,
        service: derivePrimaryServiceLabel(services),
        services,
        grantedTemplateTypes: getGrantedTemplateTypes(accountRow),
        dscr: dscr.currentValue,
        dscrYear: dscr.currentYear,
        nextStep,
        progressPct,
        lastUpdate: latestIsoDate(
          accountRow?.updated_at,
          latestLoanRequest?.updated_at,
          latestCashFlow?.updated_at,
          user.last_sign_in_at,
          user.created_at,
        ),
        hasAccount: true,
        hasTemplateAccess: access.hasTemplateAccess,
        hasPackagingAccess: access.hasLoanPackaging,
        hasComprehensiveAccess: access.hasComprehensiveAccess,
        hasTemplateBundleGrant: Boolean(accountRow?.access_templates),
        hasPackagingGrant: Boolean(accountRow?.access_packaging),
        hasComprehensiveGrant: Boolean(accountRow?.access_comprehensive),
      };
    });

  const userEmailSet = new Set(
    users.filter((user) => Boolean(user.email)).map((user) => String(user.email).toLowerCase()),
  );
  const userIdSet = new Set(users.map((user) => String(user.id)));

  const clientsWithoutAuthUser = accountRows
    .filter((row) => {
      const userId = String(row.user_id ?? '');
      const email = String(row.email ?? '').toLowerCase();
      if (userId) {
        return !userIdSet.has(userId);
      }

      if (email) {
        return !userEmailSet.has(email);
      }

      return true;
    })
    .map((row) => {
      const purchaseTypes = new Set<string>();
      const latestLoanRequest = null;
      const access = deriveAccessFlags(row, latestLoanRequest, purchaseTypes, false);
      const services = deriveServicePills({ accountRow: row, latestLoanRequest, purchaseTypes });

      let nextStep = 'Invite client to sign in';
      let progressPct = 0;

      if (access.hasLoanPackaging) nextStep = 'Loan Details';
      else if (access.hasTemplateAccess) nextStep = 'Start Personal Debt Summary';
      else if (access.hasComprehensiveAccess) nextStep = 'Complete DSCR Check';

      if (typeof row.next_step === 'string' && row.next_step.trim()) {
        nextStep = row.next_step.trim();
      }

      return {
        id: String(row.id),
        fullName: String(row.full_name ?? ''),
        email: String(row.email ?? '').toLowerCase(),
        service: derivePrimaryServiceLabel(services),
        services,
        grantedTemplateTypes: getGrantedTemplateTypes(row),
        dscr: null,
        dscrYear: null,
        nextStep,
        progressPct,
        lastUpdate: latestIsoDate(row.updated_at, row.created_at),
        hasAccount: false,
        hasTemplateAccess: access.hasTemplateAccess,
        hasPackagingAccess: access.hasLoanPackaging,
        hasComprehensiveAccess: access.hasComprehensiveAccess,
        hasTemplateBundleGrant: Boolean(row.access_templates),
        hasPackagingGrant: Boolean(row.access_packaging),
        hasComprehensiveGrant: Boolean(row.access_comprehensive),
      };
    });

  const clients = [...clientsFromUsers, ...clientsWithoutAuthUser].sort(
    (left, right) => new Date(right.lastUpdate).getTime() - new Date(left.lastUpdate).getTime(),
  );

  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  const adminIdentity = await requireAdminApiIdentity(req);
  if (!adminIdentity.ok) return adminIdentity.response;

  const parsed = createClientSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { fullName, email } = parsed.data;

  const mutation = email
    ? admin
        .from('client_accounts')
        .upsert(
          {
            email,
            full_name: fullName ?? null,
          },
          { onConflict: 'email' },
        )
    : admin
        .from('client_accounts')
        .insert({
          full_name: fullName ?? null,
        });

  const { data, error } = await mutation
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ client: data });
}

export async function PATCH(req: NextRequest) {
  const adminIdentity = await requireAdminApiIdentity(req);
  if (!adminIdentity.ok) return adminIdentity.response;

  const parsed = actionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { clientId, action, templateType } = parsed.data;

  if ((action === 'grant_template' || action === 'revoke_template') && !templateType) {
    return NextResponse.json({ error: 'templateType is required for template grant actions.' }, { status: 400 });
  }

  const accountRow = await ensureClientAccountRow(admin, clientId);
  if (!accountRow) {
    return NextResponse.json({ error: 'Client account not found.' }, { status: 404 });
  }

  const updates: AnyRow = {
    updated_at: new Date().toISOString(),
  };
  const grantedTemplateTypes = getGrantedTemplateTypes(accountRow);

  if (action === 'grant_templates') updates.access_templates = true;
  if (action === 'revoke_templates') updates.access_templates = false;
  if (action === 'grant_packaging') updates.access_packaging = true;
  if (action === 'revoke_packaging') updates.access_packaging = false;
  if (action === 'grant_comprehensive') updates.access_comprehensive = true;
  if (action === 'revoke_comprehensive') updates.access_comprehensive = false;
  if (action === 'grant_template' && templateType) {
    updates.granted_template_types = Array.from(new Set([...grantedTemplateTypes, templateType]));
  }
  if (action === 'revoke_template' && templateType) {
    updates.granted_template_types = grantedTemplateTypes.filter((value) => value !== templateType);
  }

  const { data, error } = await admin
    .from('client_accounts')
    .update(updates)
    .eq('id', String(accountRow.id))
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ client: data });
}
