import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiIdentity } from '@/lib/server/admin-api-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const adminIdentity = await requireAdminApiIdentity(req);
  if (!adminIdentity.ok) {
    return adminIdentity.response;
  }

  const admin = getSupabaseAdmin();

  const [usersPage, loanRequests, tasks, reviews, templates, clientAccounts] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin
      .from('loan_requests')
      .select('id, user_id, status, service_type, loan_amount, business_name, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(500),
    admin
      .from('admin_tasks')
      .select('id, title, status, priority, due_date, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    admin
      .from('admin_reviews')
      .select('id, title, status, review_type, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    admin
      .from('template_definitions')
      .select('template_key, display_name, is_active, updated_at')
      .order('updated_at', { ascending: false })
      .limit(100),
    admin
      .from('client_accounts')
      .select('user_id,email,service_level,access_templates,access_packaging,access_comprehensive')
      .limit(5000),
  ]);

  const allUsers = usersPage.data?.users ?? [];
  const loanRequestRows = loanRequests.data ?? [];
  const taskRows = tasks.data ?? [];
  const reviewRows = reviews.data ?? [];
  const templateRows = templates.data ?? [];
  const clientRows = clientAccounts.data ?? [];

  const templateUsers = new Set<string>();
  const packagingUsers = new Set<string>();
  const brokeringUsers = new Set<string>();
  let yearlyRevenue = 0;

  for (const row of clientRows) {
    const userKey = String(row.user_id ?? row.email ?? '').toLowerCase();
    if (!userKey) continue;

    const serviceLevel = String(row.service_level ?? '');
    const hasTemplate =
      Boolean(row.access_templates) ||
      serviceLevel === 'templates' ||
      serviceLevel === 'packaging' ||
      serviceLevel === 'brokering';
    const hasPackaging =
      Boolean(row.access_packaging) ||
      serviceLevel === 'packaging' ||
      serviceLevel === 'brokering';
    const hasBrokering = serviceLevel === 'brokering';

    if (hasTemplate) templateUsers.add(userKey);
    if (hasPackaging) {
      packagingUsers.add(userKey);
      yearlyRevenue += 499;
    }
    if (hasBrokering) brokeringUsers.add(userKey);
  }

  for (const row of loanRequestRows) {
    const userKey = String(row.user_id ?? '').toLowerCase();
    if (!userKey) continue;
    const serviceType = String(row.service_type ?? '');

    if (serviceType === 'loan_packaging') {
      if (!packagingUsers.has(userKey)) {
        packagingUsers.add(userKey);
        yearlyRevenue += 499;
      }
      templateUsers.add(userKey);
    }

    if (serviceType === 'loan_brokering') {
      brokeringUsers.add(userKey);
      templateUsers.add(userKey);
      const loanAmount = Number(row.loan_amount ?? 0);
      if (Number.isFinite(loanAmount) && loanAmount > 0) {
        yearlyRevenue += loanAmount * 0.01;
      }
    }
  }

  const tasksByStatus = taskRows.reduce<Record<string, number>>((acc, row) => {
    const key = String(row.status ?? 'unknown');
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const reviewsByStatus = reviewRows.reduce<Record<string, number>>((acc, row) => {
    const key = String(row.status ?? 'unknown');
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    kpis: {
      totalUsers: allUsers.length,
      templateUsers: templateUsers.size,
      loanPackagingUsers: packagingUsers.size,
      loanBrokeringUsers: brokeringUsers.size,
      yearlyRevenue,
      openTasks: taskRows.filter((task) => task.status !== 'done').length,
      openReviews: reviewRows.filter((review) => review.status !== 'resolved').length,
    },
    users: allUsers.slice(0, 50).map((user) => ({
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
      hasTemplateAccess: templateUsers.has(user.id),
      hasPackagingAccess: packagingUsers.has(user.id),
      hasBrokeringAccess: brokeringUsers.has(user.id),
    })),
    tasks: {
      summary: tasksByStatus,
      recent: taskRows.slice(0, 20),
    },
    reviews: {
      summary: reviewsByStatus,
      recent: reviewRows.slice(0, 20),
    },
    templates: templateRows,
  });
}
