import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword } from '@/lib/server/password-hash';
import { resolveServiceAccessForUser } from '@/lib/server/service-access';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { isApiUserFailure, requireApiUser } from '@/lib/server/request-auth';

export const runtime = 'nodejs';

const createLinkSchema = z.object({
  loanRequestId: z.string().uuid(),
  password: z.string().min(8).max(128),
  title: z.string().trim().max(180).optional().nullable(),
  expiresInDays: z.number().int().min(1).max(90).default(14),
});

const updateLinkSchema = z.object({
  linkId: z.string().uuid(),
  revoke: z.boolean().default(true),
});

async function ensureLoanPackagingApiAccess(user: { id: string; email?: string | null }) {
  const access = await resolveServiceAccessForUser({
    id: user.id,
    email: user.email ?? undefined,
  });

  return access.canAccessLoanPackaging;
}

function getBaseUrl(req: NextRequest): string {
  return (
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    req.nextUrl.origin
  );
}

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiUserFailure(auth)) {
    return auth.response;
  }
  if (!(await ensureLoanPackagingApiAccess(auth.user))) {
    return NextResponse.json({ error: 'Loan packaging access is required' }, { status: 403 });
  }

  const loanRequestId = req.nextUrl.searchParams.get('loanRequestId');
  if (!loanRequestId) {
    return NextResponse.json({ error: 'loanRequestId is required' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: links, error } = await admin
    .from('lender_access_links')
    .select('*')
    .eq('loan_request_id', loanRequestId)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const baseUrl = getBaseUrl(req);

  return NextResponse.json({
    links: (links ?? []).map((link) => ({
      ...link,
      shareUrl: `${baseUrl}/lender/${link.token}`,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiUserFailure(auth)) {
    return auth.response;
  }
  if (!(await ensureLoanPackagingApiAccess(auth.user))) {
    return NextResponse.json({ error: 'Loan packaging access is required' }, { status: 403 });
  }

  const parsed = createLinkSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();
  const payload = parsed.data;

  const { data: loanRequest } = await admin
    .from('loan_requests')
    .select('id,user_id')
    .eq('id', payload.loanRequestId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (!loanRequest) {
    return NextResponse.json({ error: 'Loan request not found' }, { status: 404 });
  }

  const token = randomBytes(24).toString('hex');
  const passwordHash = hashPassword(payload.password);
  const expiresAt = new Date(Date.now() + payload.expiresInDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: link, error } = await admin
    .from('lender_access_links')
    .insert({
      loan_request_id: payload.loanRequestId,
      user_id: auth.user.id,
      token,
      password_hash: passwordHash,
      title: payload.title ?? null,
      expires_at: expiresAt,
    })
    .select('*')
    .single();

  if (error || !link) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create lender link' }, { status: 500 });
  }

  const baseUrl = getBaseUrl(req);

  return NextResponse.json({
    link,
    shareUrl: `${baseUrl}/lender/${token}`,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiUserFailure(auth)) {
    return auth.response;
  }
  if (!(await ensureLoanPackagingApiAccess(auth.user))) {
    return NextResponse.json({ error: 'Loan packaging access is required' }, { status: 403 });
  }

  const parsed = updateLinkSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();

  const { data: updatedLink, error } = await admin
    .from('lender_access_links')
    .update({
      is_revoked: parsed.data.revoke,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.linkId)
    .eq('user_id', auth.user.id)
    .select('*')
    .single();

  if (error || !updatedLink) {
    return NextResponse.json({ error: error?.message ?? 'Failed to update lender link' }, { status: 500 });
  }

  return NextResponse.json({ link: updatedLink });
}
