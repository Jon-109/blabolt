import { createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildDscrResultEmail, buildInternalDscrLeadEmail, type DscrEmailBand } from '@/lib/dscr-email-templates';
import { createUnsubscribeToken, getEmailConfig, getResendClient } from '@/lib/email';
import { getDscrBand, loanPurposes } from '@/lib/financial/dscr';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

const CONSENT_TEXT_VERSION = 'dscr-followup-v1';
const BURST_WINDOW_SECONDS = 60;

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  firstName: z.string().trim().max(100).optional().default(''),
  businessName: z.string().trim().max(200).optional().default(''),
  website: z.string().max(200).optional().default(''),
  marketingConsent: z.boolean().optional().default(false),
  result: z.object({
    dscr: z.number().finite().positive().max(1000),
    loanPurpose: z.string().trim().min(1).max(120),
    requestedAmount: z.number().finite().positive().max(10_000_000),
    monthlyNetIncome: z.number().finite().positive().max(10_000_000),
    currentMonthlyDebtService: z.number().finite().nonnegative().max(10_000_000),
    proposedMonthlyPayment: z.number().finite().nonnegative().max(10_000_000),
    totalMonthlyDebtService: z.number().finite().positive().max(10_000_000),
    interestRatePct: z.number().finite().nonnegative().max(100),
    termMonths: z.number().int().min(1).max(600),
    downPaymentPct: z.number().finite().nonnegative().max(100),
    recommendedAction: z.enum(['analysis', 'packaging']).optional(),
  }),
  attribution: z.object({
    source: z.string().trim().max(120).optional(),
    pageTemplate: z.string().trim().max(120).optional(),
    placement: z.string().trim().max(120).optional(),
    utmSource: z.string().trim().max(200).optional(),
    utmMedium: z.string().trim().max(200).optional(),
    utmCampaign: z.string().trim().max(200).optional(),
  }).optional().default({}),
});

type QuotaResult = {
  allowed: boolean;
  remaining: number;
  retry_after_seconds: number;
  reason: string | null;
};

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

function hashIdentity(value: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error('Lead identity hashing is not configured');
  }
  return createHmac('sha256', secret).update(value).digest('hex');
}

async function consumeQuota(
  admin: ReturnType<typeof getSupabaseAdmin>,
  key: string,
  dailyLimit: number,
  burstLimit: number,
): Promise<QuotaResult> {
  const { data, error } = await admin.rpc('consume_dscr_email_quota', {
    p_usage_key_hash: hashIdentity(key),
    p_daily_limit: dailyLimit,
    p_burst_limit: burstLimit,
    p_burst_window_seconds: BURST_WINDOW_SECONDS,
  });
  if (error) {
    throw new Error(`DSCR email quota failed: ${error.message}`);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row.allowed !== 'boolean') {
    throw new Error('DSCR email quota returned an invalid response');
  }
  return row as QuotaResult;
}

export async function POST(req: NextRequest) {
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please check the email address and calculator result.', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.website) {
    return NextResponse.json({ success: true });
  }

  const payload = parsed.data;
  if (!(payload.result.loanPurpose in loanPurposes)) {
    return NextResponse.json({ error: 'Invalid loan purpose' }, { status: 400 });
  }

  const calculatedDscr = payload.result.monthlyNetIncome / payload.result.totalMonthlyDebtService;
  if (Math.abs(calculatedDscr - payload.result.dscr) > 0.02) {
    return NextResponse.json({ error: 'The calculator result no longer matches the supplied inputs.' }, { status: 400 });
  }

  const band = getDscrBand(calculatedDscr);
  const ip = getClientIp(req);
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const admin = getSupabaseAdmin();

  try {
    const quotas = await Promise.all([
      consumeQuota(admin, `ip:${ip}`, 10, 3),
      consumeQuota(admin, `email:${payload.email}`, 5, 2),
      consumeQuota(admin, 'global', 1000, 100),
    ]);
    const blocked = quotas.find((quota) => !quota.allowed);
    if (blocked) {
      return NextResponse.json(
        { error: 'Too many result emails were requested. Please wait and try again.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.max(1, Number(blocked.retry_after_seconds || 60))) },
        },
      );
    }
  } catch (error) {
    console.error('[dscr-result-email] Quota check failed:', error);
    return NextResponse.json({ error: 'Email delivery is temporarily unavailable.' }, { status: 503 });
  }

  const { data: suppressionRows, error: suppressionError } = await admin
    .from('financing_leads')
    .select('status')
    .eq('email', payload.email)
    .in('status', ['unsubscribed', 'bounced', 'complained'])
    .limit(10);
  if (suppressionError) {
    console.error('[dscr-result-email] Suppression check failed:', suppressionError);
    return NextResponse.json({ error: 'Email delivery is temporarily unavailable.' }, { status: 503 });
  }
  const suppressedStatuses = new Set((suppressionRows ?? []).map((row) => String(row.status)));
  if (suppressedStatuses.has('bounced') || suppressedStatuses.has('complained')) {
    return NextResponse.json({ error: 'We cannot send to this email address. Please use a different address.' }, { status: 400 });
  }

  const marketingConsent = payload.marketingConsent;
  const { token: unsubscribeToken, hash: unsubscribeTokenHash } = createUnsubscribeToken();
  const nowIso = new Date().toISOString();
  const leadInput = {
    firstName: payload.firstName,
    businessName: payload.businessName,
    email: payload.email,
    dscr: Number(calculatedDscr.toFixed(4)),
    dscrBand: band.id as DscrEmailBand,
    loanPurpose: payload.result.loanPurpose,
    requestedAmount: payload.result.requestedAmount,
    monthlyNetIncome: payload.result.monthlyNetIncome,
    currentMonthlyDebtService: payload.result.currentMonthlyDebtService,
    proposedMonthlyPayment: payload.result.proposedMonthlyPayment,
    totalMonthlyDebtService: payload.result.totalMonthlyDebtService,
    interestRatePct: payload.result.interestRatePct,
    termMonths: payload.result.termMonths,
    downPaymentPct: payload.result.downPaymentPct,
    recommendedAction: payload.result.recommendedAction,
    marketingConsent,
    unsubscribeToken,
  };

  const { data: lead, error: insertError } = await admin
    .from('financing_leads')
    .insert({
      email: payload.email,
      first_name: payload.firstName || null,
      business_name: payload.businessName || null,
      source: payload.attribution.source || 'dscr_quick_calculator',
      status: 'active',
      dscr: leadInput.dscr,
      dscr_band: leadInput.dscrBand,
      loan_purpose: payload.result.loanPurpose,
      requested_amount: payload.result.requestedAmount,
      monthly_net_income: payload.result.monthlyNetIncome,
      current_monthly_debt_service: payload.result.currentMonthlyDebtService,
      proposed_monthly_payment: payload.result.proposedMonthlyPayment,
      total_monthly_debt_service: payload.result.totalMonthlyDebtService,
      interest_rate_pct: payload.result.interestRatePct,
      term_months: payload.result.termMonths,
      down_payment_pct: payload.result.downPaymentPct,
      recommended_action: payload.result.recommendedAction || null,
      result_email_requested: true,
      marketing_consent: marketingConsent,
      consent_text_version: marketingConsent ? CONSENT_TEXT_VERSION : null,
      consented_at: marketingConsent ? nowIso : null,
      unsubscribe_token_hash: unsubscribeTokenHash,
      request_identity_hash: hashIdentity(`${ip}|${userAgent}`),
      attribution: payload.attribution,
      result_email_status: 'pending',
    })
    .select('id')
    .single();

  if (insertError || !lead) {
    console.error('[dscr-result-email] Failed to persist lead:', insertError);
    return NextResponse.json({ error: 'We could not save the result request.' }, { status: 500 });
  }

  const resend = getResendClient();
  const emailConfig = getEmailConfig();
  const customerEmail = buildDscrResultEmail(leadInput);

  const customerResult = await resend.emails.send({
    from: emailConfig.from,
    to: [payload.email],
    replyTo: emailConfig.replyTo,
    subject: customerEmail.subject,
    html: customerEmail.html,
    text: customerEmail.text,
    tags: [
      { name: 'category', value: 'dscr_result' },
      { name: 'dscr_band', value: leadInput.dscrBand },
    ],
  });

  if (customerResult.error || !customerResult.data?.id) {
    const message = customerResult.error?.message || 'Resend did not return an email ID';
    await admin.from('financing_leads').update({
      result_email_status: 'failed',
      result_email_failed_at: new Date().toISOString(),
      result_email_error: message.slice(0, 1000),
    }).eq('id', String(lead.id));
    console.error('[dscr-result-email] Customer email failed:', customerResult.error);
    return NextResponse.json({ error: 'We saved your result but could not send the email.' }, { status: 502 });
  }

  await admin.from('financing_leads').update({
    result_email_status: 'sent',
    result_email_id: customerResult.data.id,
    result_email_sent_at: new Date().toISOString(),
    last_email_event: 'email.sent',
    last_email_event_at: new Date().toISOString(),
  }).eq('id', String(lead.id));

  const internalEmail = buildInternalDscrLeadEmail(leadInput);
  const internalResult = await resend.emails.send({
    from: emailConfig.from,
    to: [emailConfig.internalTo],
    replyTo: payload.email,
    subject: internalEmail.subject,
    html: internalEmail.html,
    text: internalEmail.text,
    tags: [{ name: 'category', value: 'internal_dscr_lead' }],
  });
  if (internalResult.error) {
    console.error('[dscr-result-email] Internal notification failed:', internalResult.error);
  }

  return NextResponse.json({
    success: true,
    message: 'Your DSCR result is on its way.',
    marketingConsent,
  });
}
