import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { resolveServiceAccessForUser } from '@/lib/server/service-access';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { isApiUserFailure, requireApiUser } from '@/lib/server/request-auth';

export const runtime = 'nodejs';

type AnyRow = Record<string, unknown>;

interface CoverLetterInput {
  businessName: string;
  loanPurpose: string;
  loanAmount: number | null;
  annualRevenue: number | null;
  foundedYear: number | null;
  yearsInBusiness: number | null;
  businessDescription: string;
  businessOverview: string;
  targetCustomers: string;
  competitiveAdvantage: string;
  fundUseDetails: string;
  urgencyReason: string;
  noLoanConsequence: string;
  expectedOutcome: string;
  recentPerformance: string;
  recentChanges: string;
  revenueCashflowImpact: string;
  repaymentConfidence: string;
  ownerStrengths: string;
  riskManagement: string;
  additionalContext: string;
  priorDebtExperience: string;
  priorDebtExperienceDetails: string;
  purposeSpecificAnswers: Record<string, string>;
}

const nullableNumberSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'string') {
      const normalized = Number(value.replace(/,/g, ''));
      return Number.isFinite(normalized) ? normalized : value;
    }

    return value;
  },
  z.number().finite().nonnegative().nullable(),
);

const coverLetterGenerateSchema = z.object({
  loanRequestId: z.string().uuid(),
  businessName: z.string().trim().max(200).optional().nullable(),
  loanPurpose: z.string().trim().max(300).optional().nullable(),
  loanAmount: nullableNumberSchema.optional(),
  annualRevenue: nullableNumberSchema.optional(),
  foundedYear: nullableNumberSchema.optional(),
  yearsInBusiness: nullableNumberSchema.optional(),
  businessDescription: z.string().trim().max(5000).optional().nullable(),
  businessOverview: z.string().trim().max(3000).optional().nullable(),
  targetCustomers: z.string().trim().max(2000).optional().nullable(),
  competitiveAdvantage: z.string().trim().max(3000).optional().nullable(),
  fundUseDetails: z.string().trim().max(3000).optional().nullable(),
  urgencyReason: z.string().trim().max(3000).optional().nullable(),
  noLoanConsequence: z.string().trim().max(3000).optional().nullable(),
  expectedOutcome: z.string().trim().max(3000).optional().nullable(),
  recentPerformance: z.string().trim().max(3000).optional().nullable(),
  recentChanges: z.string().trim().max(3000).optional().nullable(),
  revenueCashflowImpact: z.string().trim().max(3000).optional().nullable(),
  repaymentConfidence: z.string().trim().max(3000).optional().nullable(),
  ownerStrengths: z.string().trim().max(3000).optional().nullable(),
  riskManagement: z.string().trim().max(3000).optional().nullable(),
  additionalContext: z.string().trim().max(4000).optional().nullable(),
  priorDebtExperience: z.enum(['yes', 'no']).optional().nullable(),
  priorDebtExperienceDetails: z.string().trim().max(3000).optional().nullable(),
  purposeSpecificAnswers: z.record(z.string(), z.string().trim().max(3000)).optional(),
});

const coverLetterUpdateSchema = z.object({
  loanRequestId: z.string().uuid(),
  content: z.string().trim().min(50).max(20000),
});

async function ensureLoanPackagingApiAccess(user: { id: string; email?: string | null }) {
  const access = await resolveServiceAccessForUser({
    id: user.id,
    email: user.email ?? undefined,
  });

  return access.canAccessLoanPackaging;
}

function getOrigin(req: NextRequest): string {
  const configuredOrigin = process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configuredOrigin) {
    return configuredOrigin;
  }

  const forwardedProto = req.headers.get('x-forwarded-proto');
  const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (forwardedProto && forwardedHost) {
    const forwardedOrigin = `${forwardedProto}://${forwardedHost}`;
    if (!forwardedOrigin.includes('localhost') && !forwardedOrigin.includes('127.0.0.1')) {
      return forwardedOrigin;
    }
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const origin = req.nextUrl.origin;
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    throw new Error(
      'Localhost is not reachable by Browserless. Set SITE_URL (or NEXT_PUBLIC_APP_URL) to a public tunnel URL and retry approval.',
    );
  }

  return origin;
}

function getBrowserlessApiKey(): string {
  const apiKey = process.env.BROWSERLESS_API_KEY;
  if (!apiKey) {
    throw new Error('PDF generation service is not configured');
  }

  return apiKey;
}

async function generatePdfBuffer(printUrl: string): Promise<Buffer> {
  const browserlessApiKey = getBrowserlessApiKey();
  const browserlessUrl = `https://production-sfo.browserless.io/pdf?token=${browserlessApiKey}`;
  const response = await fetch(browserlessUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: printUrl,
      options: {
        format: 'Letter',
        printBackground: true,
        margin: { top: '16px', bottom: '16px', left: '10px', right: '10px' },
      },
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    throw new Error(`Browserless PDF generation failed: ${response.status} ${await response.text()}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

function formatCurrency(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizePurposeSpecificAnswers(value: unknown): Record<string, string> {
  const source = asRecord(value);

  return Object.fromEntries(
    Object.entries(source).flatMap(([key, entryValue]) => {
      if (typeof entryValue !== 'string') {
        return [];
      }

      const trimmed = entryValue.trim();
      return trimmed.length > 0 ? [[key, trimmed]] : [];
    }),
  );
}

function formatPurposeSpecificAnswers(value: Record<string, string>): string {
  const entries = Object.entries(value);
  if (entries.length === 0) {
    return '';
  }

  return entries
    .map(([key, answer]) => `${key.replace(/_/g, ' ')}: ${answer}`)
    .join(' ');
}

function formatPurposeSpecificAnswersForPrompt(value: Record<string, string>): string {
  const entries = Object.entries(value);
  if (entries.length === 0) {
    return 'None provided.';
  }

  return entries
    .map(([key, answer]) => `- ${key.replace(/_/g, ' ')}: ${answer}`)
    .join('\n');
}

function deriveYearsInBusiness(foundedYear: number | null): number | null {
  if (typeof foundedYear !== 'number' || !Number.isFinite(foundedYear)) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  if (foundedYear < 1800 || foundedYear > currentYear) {
    return null;
  }

  return Math.max(currentYear - foundedYear, 0);
}

function generateFallbackCoverLetter(input: CoverLetterInput): string {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return [
    today,
    '',
    'Credit Committee',
    '',
    `Re: Loan Request for ${input.businessName}`,
    '',
    'Dear Credit Committee,',
    '',
    'Introduction',
    '',
    `${input.businessName} is requesting ${formatCurrency(input.loanAmount)} for ${input.loanPurpose}. ${input.businessDescription}`,
    '',
    'Business Overview',
    '',
    `${input.businessOverview} The business primarily serves ${input.targetCustomers}. ${input.competitiveAdvantage}`,
    '',
    'Use of Funds',
    '',
    `Funds will be used for ${input.fundUseDetails} This financing is needed now because ${input.urgencyReason} If financing is not secured, ${input.noLoanConsequence} The expected outcome is ${input.expectedOutcome}`,
    '',
    'Financial Position',
    '',
    `Current annual revenue is approximately ${formatCurrency(input.annualRevenue)}, and the business was founded in ${input.foundedYear ?? 'an earlier year'}${input.yearsInBusiness != null ? `, representing about ${input.yearsInBusiness} years in operation` : ''}. Recent performance: ${input.recentPerformance} ${input.recentChanges ? `Additional context: ${input.recentChanges}` : ''}`,
    '',
    'Impact of Loan',
    '',
    `${input.revenueCashflowImpact} ${input.expectedOutcome ? `Expected outcome: ${input.expectedOutcome}` : ''} ${input.noLoanConsequence ? `Without financing: ${input.noLoanConsequence}` : ''}`.trim(),
    '',
    'Repayment Confidence',
    '',
    `${input.repaymentConfidence} ${formatPurposeSpecificAnswers(input.purposeSpecificAnswers)} ${input.priorDebtExperience ? `Debt track record: ${input.priorDebtExperience === 'yes' ? 'The business owner reports prior successful debt repayment.' : 'The business owner reports limited prior debt history.'}` : ''} ${input.priorDebtExperienceDetails}`.trim(),
    '',
    'Closing',
    '',
    `Management strengths include ${input.ownerStrengths} Risk is managed through ${input.riskManagement} ${input.additionalContext ? `${input.additionalContext} ` : ''}We appreciate your consideration and welcome any additional diligence requests.`,
    '',
    'Sincerely,',
    input.businessName,
  ].join('\n');
}

async function generateAiCoverLetter(input: CoverLetterInput): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
  const client = new OpenAI({ apiKey });

  const systemPrompt = [
    'You are a senior small-business lending advisor.',
    'Write a lender-facing business loan cover letter.',
    'Tone must be factual, professional, and conservative.',
    'Do not promise approval and do not use hype language.',
    'Do not mention AI or automation.',
    'Use the exact section headings: Introduction, Business Overview, Use of Funds, Financial Position, Impact of Loan, Repayment Confidence, Closing.',
    'Treat any purpose-specific answers as important lender diligence points and weave them into the appropriate sections naturally.',
    'Make the narrative persuasive but lender-credible, with clean plain-text formatting.',
  ].join(' ');

  const userPrompt = [
    'Generate a formal cover letter for a business loan package using this data:',
    JSON.stringify(input, null, 2),
    '',
    'Purpose-specific lender context:',
    formatPurposeSpecificAnswersForPrompt(input.purposeSpecificAnswers),
    'Output plain text only.',
  ].join('\n\n');

  const response = await client.responses.create({
    model,
    temperature: 0.2,
    input: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  const generated = response.output_text?.trim();
  return generated || null;
}

async function ensureLoanRequestAccess(
  admin: ReturnType<typeof getSupabaseAdmin>,
  loanRequestId: string,
  userId: string,
): Promise<AnyRow | null> {
  const { data } = await admin
    .from('loan_requests')
    .select('*')
    .eq('id', loanRequestId)
    .eq('user_id', userId)
    .maybeSingle();

  return (data as AnyRow | null) ?? null;
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
  const loanRequest = await ensureLoanRequestAccess(admin, loanRequestId, auth.user.id);

  if (!loanRequest) {
    return NextResponse.json({ error: 'Loan request not found' }, { status: 404 });
  }

  return NextResponse.json({
    coverLetterStatus: loanRequest.cover_letter_status,
    coverLetterContent: loanRequest.cover_letter_content,
    coverLetterInputs: loanRequest.cover_letter_inputs,
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

  const parsed = coverLetterGenerateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();
  const payload = parsed.data;

  const loanRequest = await ensureLoanRequestAccess(admin, payload.loanRequestId, auth.user.id);
  if (!loanRequest) {
    return NextResponse.json({ error: 'Loan request not found' }, { status: 404 });
  }

  const existingInputs = asRecord(loanRequest.cover_letter_inputs);
  const purposeSpecificAnswers = {
    ...normalizePurposeSpecificAnswers(existingInputs.purposeSpecificAnswers),
    ...normalizePurposeSpecificAnswers(payload.purposeSpecificAnswers),
  };
  const foundedYear =
    payload.foundedYear ??
    asNullableNumber(existingInputs.foundedYear);
  const derivedYearsInBusiness = deriveYearsInBusiness(foundedYear);

  const coverLetterInput: CoverLetterInput = {
    businessName:
      payload.businessName?.trim() ||
      asString(loanRequest.business_name, 'Business Applicant'),
    loanPurpose:
      payload.loanPurpose?.trim() ||
      asString(loanRequest.loan_purpose, 'working capital and strategic growth'),
    loanAmount:
      payload.loanAmount ??
      asNullableNumber(loanRequest.loan_amount),
    annualRevenue:
      payload.annualRevenue ??
      asNullableNumber(loanRequest.annual_revenue),
    foundedYear,
    yearsInBusiness:
      payload.yearsInBusiness ??
      derivedYearsInBusiness ??
      asNullableNumber(loanRequest.years_in_business),
    businessDescription:
      payload.businessDescription?.trim() ||
      asString(
        loanRequest.business_description,
        'The business has an established operating history and verifiable cash flow.',
      ),
    businessOverview:
      payload.businessOverview?.trim() ||
      asString(existingInputs.businessOverview, 'The business operates in an established market with a clearly defined offering.'),
    targetCustomers:
      payload.targetCustomers?.trim() ||
      asString(existingInputs.targetCustomers, 'a stable base of customers within its target market.'),
    competitiveAdvantage:
      payload.competitiveAdvantage?.trim() ||
      asString(existingInputs.competitiveAdvantage, 'The business benefits from experience, market familiarity, and customer relationships.'),
    fundUseDetails:
      payload.fundUseDetails?.trim() ||
      asString(existingInputs.fundUseDetails, 'supporting operations, working capital needs, and near-term growth initiatives.'),
    urgencyReason:
      payload.urgencyReason?.trim() ||
      asString(existingInputs.urgencyReason, 'the timing aligns with current business needs and active growth opportunities.'),
    noLoanConsequence:
      payload.noLoanConsequence?.trim() ||
      asString(existingInputs.noLoanConsequence, 'the business may need to delay planned initiatives and operate with reduced flexibility.'),
    expectedOutcome:
      payload.expectedOutcome?.trim() ||
      asString(existingInputs.expectedOutcome, 'improved efficiency, stronger liquidity, and support for sustainable growth.'),
    recentPerformance:
      payload.recentPerformance?.trim() ||
      asString(existingInputs.recentPerformance, 'The business has continued operating with measurable revenue activity and ongoing customer demand.'),
    recentChanges:
      payload.recentChanges?.trim() ||
      asString(existingInputs.recentChanges, ''),
    revenueCashflowImpact:
      payload.revenueCashflowImpact?.trim() ||
      asString(existingInputs.revenueCashflowImpact, 'The requested financing is expected to support revenue continuity and strengthen cash flow coverage.'),
    repaymentConfidence:
      payload.repaymentConfidence?.trim() ||
      asString(existingInputs.repaymentConfidence, 'The requested structure is intended to match business performance, cash flow, and a realistic repayment plan.'),
    ownerStrengths:
      payload.ownerStrengths?.trim() ||
      asString(
        existingInputs.ownerStrengths || loanRequest.strengths,
        'experienced management, disciplined execution, and close attention to business operations.',
      ),
    riskManagement:
      payload.riskManagement?.trim() ||
      asString(existingInputs.riskManagement, 'maintaining operating discipline, monitoring expenses, and managing liquidity carefully.'),
    additionalContext:
      payload.additionalContext?.trim() ||
      asString(existingInputs.additionalContext, ''),
    priorDebtExperience:
      payload.priorDebtExperience?.trim() ||
      asString(existingInputs.priorDebtExperience, ''),
    priorDebtExperienceDetails:
      payload.priorDebtExperienceDetails?.trim() ||
      asString(existingInputs.priorDebtExperienceDetails, ''),
    purposeSpecificAnswers,
  };

  let coverLetterContent: string;
  try {
    const aiLetter = await generateAiCoverLetter(coverLetterInput);
    coverLetterContent = aiLetter ?? generateFallbackCoverLetter(coverLetterInput);
  } catch (error) {
    console.error('[cover-letter] AI generation failed, using fallback:', error);
    coverLetterContent = generateFallbackCoverLetter(coverLetterInput);
  }

  const nowIso = new Date().toISOString();

  const { error: updateError } = await admin
    .from('loan_requests')
    .update({
      cover_letter_status: 'generated',
      cover_letter_inputs: {
        ...existingInputs,
        ...coverLetterInput,
      },
      cover_letter_content: coverLetterContent,
      updated_at: nowIso,
    })
    .eq('id', payload.loanRequestId)
    .eq('user_id', auth.user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await admin.from('loan_request_documents').upsert(
    {
      loan_request_id: payload.loanRequestId,
      user_id: auth.user.id,
      requirement_key: 'cover_letter',
      status: 'generated',
      source: 'generated',
      metadata: {
        generated_at: nowIso,
        source: 'ai',
      },
    },
    { onConflict: 'loan_request_id,requirement_key' },
  );

  return NextResponse.json({
    coverLetterStatus: 'generated',
    coverLetterContent,
    coverLetterInputs: coverLetterInput,
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

  const parsed = coverLetterUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();
  const payload = parsed.data;

  const loanRequest = await ensureLoanRequestAccess(admin, payload.loanRequestId, auth.user.id);
  if (!loanRequest) {
    return NextResponse.json({ error: 'Loan request not found' }, { status: 404 });
  }

  const nowIso = new Date().toISOString();

  const { error } = await admin
    .from('loan_requests')
    .update({
      cover_letter_status: 'approved',
      cover_letter_content: payload.content,
      updated_at: nowIso,
    })
    .eq('id', payload.loanRequestId)
    .eq('user_id', auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const origin = getOrigin(req);
  const printUrl = `${origin}/report/loan-packaging/cover-letter/${payload.loanRequestId}?token=${encodeURIComponent(auth.accessToken)}`;
  const pdfBuffer = await generatePdfBuffer(printUrl);
  const pdfPath = `${auth.user.id}/loan-packaging/cover-letter/cover-letter-${payload.loanRequestId}-${randomUUID()}.pdf`;

  const uploadResult = await admin.storage
    .from('pdfs')
    .upload(pdfPath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadResult.error) {
    return NextResponse.json({ error: uploadResult.error.message }, { status: 500 });
  }

  await admin.from('loan_request_documents').upsert(
    {
      loan_request_id: payload.loanRequestId,
      user_id: auth.user.id,
      requirement_key: 'cover_letter',
      status: 'approved',
      source: 'generated',
      file_path: pdfPath,
      mime_type: 'application/pdf',
      file_size_bytes: pdfBuffer.length,
      uploaded_at: nowIso,
      metadata: {
        updated_at: nowIso,
        source: 'manual_edit',
        bucket: 'pdfs',
        generated_at: nowIso,
        original_file_name: 'cover-letter.pdf',
        template: 'cover_letter_svg_v1',
      },
    },
    { onConflict: 'loan_request_id,requirement_key' },
  );

  await admin.from('generated_reports').insert({
    user_id: auth.user.id,
    loan_request_id: payload.loanRequestId,
    report_type: 'cover_letter_pdf',
    source_type: 'cover_letter',
    source_id: payload.loanRequestId,
    file_path: pdfPath,
    mime_type: 'application/pdf',
    file_size_bytes: pdfBuffer.length,
    visibility: 'private',
  });

  return NextResponse.json({
    coverLetterStatus: 'approved',
    coverLetterContent: payload.content,
  });
}
