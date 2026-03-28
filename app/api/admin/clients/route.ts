import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApiIdentity } from '@/lib/server/admin-api-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

type AnyRow = Record<string, unknown>;

const TEMPLATE_ORDER = [
  'personal_debt_summary',
  'personal_financial_statement',
  'business_debt_summary',
  'balance_sheet',
  'income_statement',
] as const;

const createClientSchema = z.object({
  fullName: z.string().trim().min(2).max(180),
  email: z.string().email().transform((value) => value.toLowerCase()),
});

const actionSchema = z.object({
  clientId: z.string(),
  action: z.enum([
    'grant_templates',
    'revoke_templates',
    'grant_packaging',
    'revoke_packaging',
    'grant_comprehensive',
    'revoke_comprehensive',
  ]),
});

function hasMeaningfulFormData(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  return Object.keys(value as Record<string, unknown>).length > 0;
}

function deriveServiceLabel(row: AnyRow): string {
  if (row.access_packaging || row.service_level === 'packaging') return 'Loan Packaging';
  if (row.service_level === 'brokering') return 'Loan Brokering';
  if (row.access_templates || row.service_level === 'templates') return 'Templates';
  if (row.access_comprehensive || row.service_level === 'comprehensive') return 'Comprehensive Only';
  return 'No Access';
}

function computeTemplateProgress(templateRows: AnyRow[]): { progressPct: number; nextStep: string } {
  if (!templateRows.length) {
    return { progressPct: 0, nextStep: 'Start Personal Debt Summary' };
  }

  const byType = new Map<string, AnyRow>();
  for (const row of templateRows) {
    const type = String(row.template_type ?? '');
    if (!type || byType.has(type)) continue;
    byType.set(type, row);
  }

  let completed = 0;
  for (const type of TEMPLATE_ORDER) {
    const row = byType.get(type);
    const done = Boolean(row?.pdf_url) || hasMeaningfulFormData(row?.form_data);
    if (done) completed += 1;
  }

  const progressPct = Math.round((completed / TEMPLATE_ORDER.length) * 100);

  for (const type of TEMPLATE_ORDER) {
    const row = byType.get(type);
    const done = Boolean(row?.pdf_url) || hasMeaningfulFormData(row?.form_data);
    if (!done) {
      const label = type.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return { progressPct, nextStep: `Complete ${label}` };
    }
  }

  return { progressPct: 100, nextStep: 'Templates Completed' };
}

function computePackagingProgress(loanRequest: AnyRow | null, uploadedDocsCount: number): { progressPct: number; nextStep: string } {
  if (!loanRequest) {
    return { progressPct: 0, nextStep: 'Loan Details' };
  }

  const hasLoanDetails = Boolean(loanRequest.business_name) && Boolean(loanRequest.loan_purpose) && Number(loanRequest.loan_amount ?? 0) > 0;
  const status = String(loanRequest.status ?? 'draft');

  if (!hasLoanDetails) {
    return { progressPct: 15, nextStep: 'Loan Details' };
  }

  if (uploadedDocsCount === 0) {
    return { progressPct: 35, nextStep: 'Upload Required Documents' };
  }

  if (status === 'submitted') {
    return { progressPct: 90, nextStep: 'Review Submission + Lender Outreach' };
  }

  if (status === 'completed') {
    return { progressPct: 100, nextStep: 'Package Complete' };
  }

  return { progressPct: Math.min(85, 35 + uploadedDocsCount * 10), nextStep: 'Finalize Package' };
}

export async function GET(req: NextRequest) {
  const adminIdentity = await requireAdminApiIdentity(req);
  if (!adminIdentity.ok) return adminIdentity.response;

  const admin = getSupabaseAdmin();

  const [clientsResult, usersPage, loanRequestsResult, templateSubmissionsResult, documentsResult] = await Promise.all([
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
      .select('id,user_id,template_type,form_data,pdf_url,updated_at')
      .order('updated_at', { ascending: false })
      .limit(20000),
    admin
      .from('loan_request_documents')
      .select('loan_request_id,user_id,status,updated_at')
      .order('updated_at', { ascending: false })
      .limit(20000),
  ]);

  if (clientsResult.error) {
    return NextResponse.json({ error: clientsResult.error.message }, { status: 500 });
  }

  const users = usersPage.data?.users ?? [];
  const rows = (clientsResult.data ?? []) as AnyRow[];
  const loanRequests = (loanRequestsResult.data ?? []) as AnyRow[];
  const templateSubmissions = (templateSubmissionsResult.data ?? []) as AnyRow[];
  const documents = (documentsResult.data ?? []) as AnyRow[];

  const rowsByEmail = new Map(rows.map((row) => [String(row.email ?? '').toLowerCase(), row]));

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

  const docsByLoanRequest = new Map<string, number>();
  for (const row of documents) {
    const key = String(row.loan_request_id ?? '');
    if (!key) continue;
    const status = String(row.status ?? '');
    if (status === 'uploaded' || status === 'generated' || status === 'approved') {
      docsByLoanRequest.set(key, (docsByLoanRequest.get(key) ?? 0) + 1);
    }
  }

  const clientsFromUsers = users
    .filter((u) => Boolean(u.email))
    .map((u) => {
      const email = String(u.email).toLowerCase();
      const row = rowsByEmail.get(email);
      const userId = String(u.id);
      const latestLoanRequest = latestLoanRequestByUser.get(userId) ?? null;
      const userTemplates = templatesByUser.get(userId) ?? [];

      const merged: AnyRow = { ...(row ?? {}) };
      if (!merged.service_level && latestLoanRequest?.service_type === 'loan_packaging') merged.service_level = 'packaging';
      if (!merged.service_level && latestLoanRequest?.service_type === 'loan_brokering') merged.service_level = 'brokering';

      const hasTemplateAccess = Boolean(
        row?.access_templates ||
          merged.service_level === 'templates' ||
          merged.service_level === 'packaging' ||
          merged.service_level === 'brokering',
      );
      const hasPackagingAccess = Boolean(
        row?.access_packaging ||
          merged.service_level === 'packaging' ||
          merged.service_level === 'brokering',
      );
      const hasComprehensiveAccess = Boolean(
        row?.access_comprehensive ||
          merged.service_level === 'comprehensive' ||
          merged.service_level === 'templates' ||
          merged.service_level === 'packaging' ||
          merged.service_level === 'brokering',
      );

      let progressPct = 0;
      let nextStep = 'No active service';

      if (hasPackagingAccess) {
        const uploadedDocsCount = latestLoanRequest ? docsByLoanRequest.get(String(latestLoanRequest.id)) ?? 0 : 0;
        const packaging = computePackagingProgress(latestLoanRequest, uploadedDocsCount);
        progressPct = packaging.progressPct;
        nextStep = packaging.nextStep;
      } else if (hasTemplateAccess) {
        const template = computeTemplateProgress(userTemplates);
        progressPct = template.progressPct;
        nextStep = template.nextStep;
      } else if (hasComprehensiveAccess) {
        progressPct = 10;
        nextStep = 'Complete DSCR Check';
      }

      const updatedAt = String(
        row?.updated_at ?? latestLoanRequest?.updated_at ?? u.last_sign_in_at ?? u.created_at ?? new Date().toISOString(),
      );

      return {
        id: String(row?.id ?? userId),
        fullName: String(row?.full_name ?? u.user_metadata?.full_name ?? u.user_metadata?.name ?? ''),
        email,
        service: deriveServiceLabel(merged),
        nextStep,
        progressPct,
        lastUpdate: updatedAt,
        hasAccount: true,
        hasTemplateAccess,
        hasPackagingAccess,
        hasComprehensiveAccess,
      };
    });

  const userEmailSet = new Set(users.filter((u) => Boolean(u.email)).map((u) => String(u.email).toLowerCase()));

  const clientsWithoutAuthUser = rows
    .filter((row) => {
      const email = String(row.email ?? '').toLowerCase();
      return email && !userEmailSet.has(email);
    })
    .map((row) => {
      const hasTemplateAccess = Boolean(
        row.access_templates ||
          row.service_level === 'templates' ||
          row.service_level === 'packaging' ||
          row.service_level === 'brokering',
      );
      const hasPackagingAccess = Boolean(
        row.access_packaging ||
          row.service_level === 'packaging' ||
          row.service_level === 'brokering',
      );
      const hasComprehensiveAccess = Boolean(
        row.access_comprehensive ||
          row.service_level === 'comprehensive' ||
          row.service_level === 'templates' ||
          row.service_level === 'packaging' ||
          row.service_level === 'brokering',
      );

      let nextStep = 'Invite client to sign in';
      let progressPct = 0;

      if (hasPackagingAccess) nextStep = 'Loan Details';
      else if (hasTemplateAccess) nextStep = 'Start Personal Debt Summary';
      else if (hasComprehensiveAccess) nextStep = 'Complete DSCR Check';

      return {
        id: String(row.id),
        fullName: String(row.full_name ?? ''),
        email: String(row.email ?? '').toLowerCase(),
        service: deriveServiceLabel(row),
        nextStep,
        progressPct,
        lastUpdate: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
        hasAccount: false,
        hasTemplateAccess,
        hasPackagingAccess,
        hasComprehensiveAccess,
      };
    });

  const clients = [...clientsFromUsers, ...clientsWithoutAuthUser].sort(
    (a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime(),
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

  const { data, error } = await admin
    .from('client_accounts')
    .upsert(
      {
        email,
        full_name: fullName,
      },
      { onConflict: 'email' },
    )
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
  const { clientId, action } = parsed.data;

  const updates: AnyRow = {
    updated_at: new Date().toISOString(),
  };

  if (action === 'grant_templates') updates.access_templates = true;
  if (action === 'revoke_templates') updates.access_templates = false;
  if (action === 'grant_packaging') updates.access_packaging = true;
  if (action === 'revoke_packaging') updates.access_packaging = false;
  if (action === 'grant_comprehensive') updates.access_comprehensive = true;
  if (action === 'revoke_comprehensive') updates.access_comprehensive = false;

  const { data, error } = await admin
    .from('client_accounts')
    .update(updates)
    .or(`id.eq.${clientId},user_id.eq.${clientId}`)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ client: data });
}
