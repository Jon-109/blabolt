import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { resolveServiceAccessForUser } from '@/lib/server/service-access';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { isApiUserFailure, requireApiUser } from '@/lib/server/request-auth';

export const runtime = 'nodejs';

type AnyRow = Record<string, unknown>;

interface CoverLetterStructuredInputs {
  businessDescription: string;
  operatingHistory: string;
  businessModelType: string;
  businessLocationDetails: string;
  businessLocation: string;
  currentBusinessTraits: string[];
  currentBusinessTraitsOther: string;
  currentBusinessTraitsDetails: string;
  employeeCount: string;
  useOfFundsBreakdown: UseOfFundsBreakdownItem[];
  useOfFundsNarrative: string;
  timingNarrative: string;
  repaymentSource: string;
  repaymentSourceOther: string;
  revenueStreams: string[];
  revenueStreamsOther: string;
  financingImpact: string[];
  financingImpactOther: string;
  repaymentNotes: string;
  supportingFactors: string[];
  supportingFactorsOther: string;
  additionalLenderNotes: string;
}

interface UseOfFundsBreakdownItem {
  description: string;
  amount: number;
}

interface CoverLetterInput {
  businessName: string;
  loanPurpose: string;
  loanAmount: number | null;
  annualRevenue: number | null;
  businessDescription: string;
  operatingHistory: string;
  businessModelType: string;
  businessLocation: string;
  businessLocationDetails: string;
  currentBusinessTraits: string[];
  currentBusinessTraitsDetails: string;
  employeeCount: string;
  useOfFundsBreakdown: UseOfFundsBreakdownItem[];
  useOfFundsNarrative: string;
  timingNarrative: string;
  repaymentSource: string;
  revenueStreams: string[];
  financingImpact: string[];
  repaymentNotes: string;
  supportingFactors: string[];
  additionalLenderNotes: string;
}

const COVER_LETTER_GENERATION_BLUEPRINT = [
  'Write the cover letter using exactly six body paragraphs after the greeting and before the sign-off.',
  'Paragraph 1 is The Request and must contain exactly 3 sentences: define the financing request, connect the loan to business purpose, and frame the request strategically.',
  'Paragraph 2 is Business Overview and must contain exactly 4 sentences: describe the business model, establish operating history and market, show real activity and traction, and reinforce credibility and stability.',
  'Paragraph 3 is Use of Funds and must contain exactly 4 sentences: summarize the use of funds, explain operational impact, explain timing, and reinforce financial alignment.',
  'Paragraph 4 is Repayment and must contain exactly 4 sentences: define the primary repayment source, explain how revenue is generated, support repayment capacity, and align the financing with cash flow.',
  'Paragraph 5 is Business Strengths and must contain exactly 4 sentences: highlight ownership or leadership strength, highlight operational strengths, show commitment and stability, and summarize risk reduction.',
  'Paragraph 6 is Closing and must contain exactly 3 sentences: express appreciation, reference supporting documentation, and maintain forward momentum.',
  'Do not use section headings, bullet points, numbered lists, or labels inside the letter body.',
  'No sentence may introduce new information that is not backed by the provided input.',
  'Do not rely heavily on projections or speculative future performance.',
  'Only mention DSCR, underwriting metrics, or financial analysis if those details are explicitly provided in the input.',
  'Keep the tone factual, lender-aware, professional, and free of hype.',
].join(' ');

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

const stringArraySchema = z.array(z.string().trim().min(1).max(200)).max(12);
const useOfFundsBreakdownSchema = z.array(
  z.object({
    description: z.string().trim().min(1).max(300),
    amount: z.number().finite().positive(),
  }),
).max(20);

const coverLetterStructuredInputsSchema = z.object({
  businessDescription: z.string().trim().max(3000),
  operatingHistory: z.string().trim().max(300),
  businessModelType: z.string().trim().max(50).optional().default(''),
  businessLocationDetails: z.string().trim().max(500).optional().default(''),
  businessLocation: z.string().trim().max(300),
  currentBusinessTraits: stringArraySchema.max(5),
  currentBusinessTraitsOther: z.string().trim().max(300).optional().default(''),
  currentBusinessTraitsDetails: z.string().trim().max(3000).optional().default(''),
  employeeCount: z.string().trim().max(50).optional().default(''),
  useOfFundsBreakdown: useOfFundsBreakdownSchema.optional().default([]),
  useOfFundsNarrative: z.string().trim().max(4000),
  timingNarrative: z.string().trim().max(3000),
  repaymentSource: z.string().trim().max(300),
  repaymentSourceOther: z.string().trim().max(300).optional().default(''),
  revenueStreams: stringArraySchema.max(5),
  revenueStreamsOther: z.string().trim().max(300).optional().default(''),
  financingImpact: stringArraySchema.max(3),
  financingImpactOther: z.string().trim().max(300).optional().default(''),
  repaymentNotes: z.string().trim().max(3000).optional().default(''),
  supportingFactors: stringArraySchema.max(5),
  supportingFactorsOther: z.string().trim().max(300).optional().default(''),
  additionalLenderNotes: z.string().trim().max(4000).optional().default(''),
});

const coverLetterGenerateSchema = z.object({
  loanRequestId: z.string().uuid(),
  businessName: z.string().trim().max(200).optional().nullable(),
  loanPurpose: z.string().trim().max(300).optional().nullable(),
  loanAmount: nullableNumberSchema.optional(),
  annualRevenue: nullableNumberSchema.optional(),
  businessDescription: z.string().trim().max(5000).optional().nullable(),
  coverLetterInputs: coverLetterStructuredInputsSchema.optional(),
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

function getFirstNonEmptyText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return '';
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

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.flatMap((entry) => {
        if (typeof entry !== 'string') {
          return [];
        }

        const trimmed = entry.trim();
        return trimmed.length > 0 ? [trimmed] : [];
      }),
    ),
  );
}

function asUseOfFundsBreakdown(value: unknown): UseOfFundsBreakdownItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return [];
    }

    const source = entry as Record<string, unknown>;
    const description = typeof source.description === 'string'
      ? source.description.trim()
      : typeof source.label === 'string'
        ? source.label.trim()
        : '';
    const amount = typeof source.amount === 'number'
      ? source.amount
      : typeof source.amount === 'string'
        ? Number(source.amount.replace(/,/g, '').trim())
        : NaN;

    if (!description || !Number.isFinite(amount) || amount <= 0) {
      return [];
    }

    return [{ description, amount }];
  });
}

function formatList(values: string[]): string {
  if (values.length === 0) {
    return '';
  }

  if (values.length === 1) {
    return values[0] ?? '';
  }

  if (values.length === 2) {
    return `${values[0] ?? ''} and ${values[1] ?? ''}`;
  }

  return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1] ?? ''}`;
}

function appendOtherSelection(values: string[], otherText: string): string[] {
  const trimmedOtherText = otherText.trim();
  const baseValues = values.filter((value) => value !== 'Other');
  return trimmedOtherText ? [...baseValues, trimmedOtherText] : baseValues;
}

function resolveOtherSelection(value: string, otherText: string): string {
  if (value !== 'Other') {
    return value;
  }

  return otherText.trim();
}

function mergeStructuredCoverLetterInputs(
  existingInputs: Record<string, unknown>,
  payloadInputs: z.infer<typeof coverLetterStructuredInputsSchema> | undefined,
): CoverLetterStructuredInputs {
  return {
    businessDescription:
      payloadInputs?.businessDescription ??
      getFirstNonEmptyText(existingInputs.businessDescription, existingInputs.businessOverview),
    operatingHistory:
      payloadInputs?.operatingHistory ??
      getFirstNonEmptyText(existingInputs.operatingHistory, existingInputs.foundedYear, existingInputs.yearsInBusiness),
    businessModelType:
      payloadInputs?.businessModelType ??
      getFirstNonEmptyText(existingInputs.businessModelType),
    businessLocationDetails:
      payloadInputs?.businessLocationDetails ??
      getFirstNonEmptyText(existingInputs.businessLocationDetails),
    businessLocation:
      payloadInputs?.businessLocation ??
      getFirstNonEmptyText(existingInputs.businessLocation),
    currentBusinessTraits:
      payloadInputs?.currentBusinessTraits ?? asStringArray(existingInputs.currentBusinessTraits),
    currentBusinessTraitsOther:
      payloadInputs?.currentBusinessTraitsOther ??
      getFirstNonEmptyText(existingInputs.currentBusinessTraitsOther),
    currentBusinessTraitsDetails:
      payloadInputs?.currentBusinessTraitsDetails ??
      getFirstNonEmptyText(existingInputs.currentBusinessTraitsDetails),
    employeeCount:
      payloadInputs?.employeeCount ??
      getFirstNonEmptyText(existingInputs.employeeCount),
    useOfFundsBreakdown:
      payloadInputs?.useOfFundsBreakdown ?? asUseOfFundsBreakdown(existingInputs.useOfFundsBreakdown),
    useOfFundsNarrative:
      payloadInputs?.useOfFundsNarrative ??
      getFirstNonEmptyText(existingInputs.useOfFundsNarrative, existingInputs.fundUseDetails),
    timingNarrative:
      payloadInputs?.timingNarrative ??
      getFirstNonEmptyText(existingInputs.timingNarrative, existingInputs.timingDetails, existingInputs.timingReason, existingInputs.urgencyReason),
    repaymentSource:
      payloadInputs?.repaymentSource ??
      getFirstNonEmptyText(existingInputs.repaymentSource),
    repaymentSourceOther:
      payloadInputs?.repaymentSourceOther ??
      getFirstNonEmptyText(existingInputs.repaymentSourceOther),
    revenueStreams:
      payloadInputs?.revenueStreams ?? asStringArray(existingInputs.revenueStreams),
    revenueStreamsOther:
      payloadInputs?.revenueStreamsOther ??
      getFirstNonEmptyText(existingInputs.revenueStreamsOther),
    financingImpact:
      payloadInputs?.financingImpact ?? asStringArray(existingInputs.financingImpact),
    financingImpactOther:
      payloadInputs?.financingImpactOther ??
      getFirstNonEmptyText(existingInputs.financingImpactOther, existingInputs.expectedOutcome),
    repaymentNotes:
      payloadInputs?.repaymentNotes ??
      getFirstNonEmptyText(existingInputs.repaymentNotes, existingInputs.repaymentNarrativeNotes),
    supportingFactors:
      payloadInputs?.supportingFactors ?? asStringArray(existingInputs.supportingFactors),
    supportingFactorsOther:
      payloadInputs?.supportingFactorsOther ??
      getFirstNonEmptyText(existingInputs.supportingFactorsOther, existingInputs.ownerStrengths),
    additionalLenderNotes:
      payloadInputs?.additionalLenderNotes ??
      getFirstNonEmptyText(existingInputs.additionalLenderNotes, existingInputs.additionalContext),
  };
}

function buildNarrativeSelections(input: CoverLetterStructuredInputs) {
  return {
    currentBusinessTraits: appendOtherSelection(input.currentBusinessTraits, input.currentBusinessTraitsOther),
    repaymentSource: resolveOtherSelection(input.repaymentSource, input.repaymentSourceOther),
    revenueStreams: appendOtherSelection(input.revenueStreams, input.revenueStreamsOther),
    financingImpact: appendOtherSelection(input.financingImpact, input.financingImpactOther),
    supportingFactors: appendOtherSelection(input.supportingFactors, input.supportingFactorsOther),
  };
}

function formatOptionalSentence(value: string, prefix = ''): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  return prefix ? `${prefix}${trimmed}` : trimmed;
}

function formatUseOfFundsBreakdown(value: UseOfFundsBreakdownItem[]): string {
  if (value.length === 0) {
    return '';
  }

  return value
    .map((item) => `${item.description} (${formatCurrency(item.amount)})`)
    .join(', ');
}

function formatOperatingHistorySentence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (/^\d{4}$/.test(trimmed)) {
    return `The business was established in ${trimmed}.`;
  }

  return `The business has been operating for ${trimmed}.`;
}

function inferLoanStructure(loanPurpose: string): string {
  switch (loanPurpose.trim()) {
    case 'Revolving Line of Credit':
      return 'a revolving line of credit';
    case 'Bridge Financing':
      return 'a bridge loan';
    case 'Commercial Real Estate Purchase':
      return 'a commercial real estate term loan';
    case 'Commercial Real Estate Refinance':
      return 'a commercial real estate refinance loan';
    case 'Debt Refinance / Consolidation':
      return 'a debt refinance term loan';
    case 'Equipment Purchase':
      return 'an equipment term loan';
    case 'Inventory Purchase':
      return 'an inventory financing loan';
    case 'Business Acquisition':
      return 'a business acquisition term loan';
    case 'Business Expansion / New Location':
      return 'a business expansion term loan';
    case 'Tenant Improvements / Renovation':
      return 'a tenant improvement term loan';
    case 'Partner Buyout':
      return 'a partner buyout term loan';
    case 'Franchise Purchase':
      return 'a franchise purchase term loan';
    case 'Working Capital':
      return 'a working capital term loan';
    default:
      return 'a business loan';
  }
}

function formatSentence(value: string): string {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed) {
    return '';
  }

  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function formatUseOfFundsSummary(value: UseOfFundsBreakdownItem[]): string {
  if (value.length === 0) {
    return 'the borrower’s stated business needs';
  }

  const topItems = [...value]
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 3)
    .map((item) => `${item.description} (${formatCurrency(item.amount)})`);

  return topItems.length > 0 ? topItems.join(', ') : 'the borrower’s stated business needs';
}

function formatBusinessLocationAndHistory(location: string, operatingHistory: string): string {
  const trimmedLocation = location.trim();
  const historySentence = formatOperatingHistorySentence(operatingHistory).replace(/\.$/, '');

  if (trimmedLocation && historySentence) {
    return `The business operates in ${trimmedLocation}, and ${historySentence.toLowerCase()}.`;
  }

  if (trimmedLocation) {
    return `The business operates in ${trimmedLocation}.`;
  }

  if (historySentence) {
    return `${historySentence}.`;
  }

  return 'The business operates in its current market with an established operating history.';
}

function generateFallbackCoverLetter(input: CoverLetterInput): string {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const loanStructure = inferLoanStructure(input.loanPurpose);
  const requestParagraph = [
    `${input.businessName} is requesting ${formatCurrency(input.loanAmount)} through ${loanStructure} for ${input.loanPurpose.toLowerCase()}.`,
    `The financing is intended to support ${input.loanPurpose.toLowerCase()} in a way that is tied directly to active business operations and defined funding needs.`,
    'This request is being presented as a deliberate financing decision intended to support stable operations, responsible growth, or improved execution within the business.',
  ].join(' ');
  const businessOverviewParagraph = [
    formatSentence(input.businessDescription),
    formatBusinessLocationAndHistory(input.businessLocation, input.operatingHistory),
    formatSentence(
      input.employeeCount
        ? `The company currently operates with ${input.employeeCount} employees and generates revenue through ${formatList(input.revenueStreams)}`
        : `Revenue is generated through ${formatList(input.revenueStreams)}`
    ),
    formatSentence(
      input.currentBusinessTraitsDetails
        ? input.currentBusinessTraitsDetails
        : input.currentBusinessTraits.length > 0
        ? `Key indicators of business stability include ${formatList(input.currentBusinessTraits)}`
        : 'The business presents as an established operating company with ongoing customer activity'
    ),
  ].join(' ');
  const useOfFundsParagraph = [
    formatSentence(`Loan proceeds are expected to be allocated across ${formatUseOfFundsSummary(input.useOfFundsBreakdown)}`),
    formatSentence(input.useOfFundsNarrative),
    formatSentence(input.timingNarrative),
    'Overall, the proposed use of proceeds appears aligned with the company’s current operations and intended to support sustainable business performance.',
  ].join(' ');
  const repaymentParagraph = [
    formatSentence(`The primary source of repayment is expected to be ${input.repaymentSource.toLowerCase()}`),
    formatSentence(`The business currently generates income through ${formatList(input.revenueStreams)}`),
    formatSentence(
      input.repaymentNotes
        ? input.repaymentNotes
        : input.annualRevenue != null
          ? `Current annual revenue of approximately ${formatCurrency(input.annualRevenue)} helps frame the scale of operations supporting this request`
          : 'Based on the operating profile described, repayment is intended to be supported by ongoing business activity rather than speculative future events'
    ),
    formatSentence(`Management expects this financing to ${formatList(input.financingImpact)}, which should help the facility fit within the business’s cash flow cycle`),
  ].join(' ');
  const strengthsParagraph = [
    formatSentence(
      input.supportingFactors.length > 0
        ? `Management strengths supporting this request include ${input.supportingFactors[0]}`
        : 'The request is supported by experienced ownership and ongoing management oversight'
    ),
    formatSentence(
      input.supportingFactors.length > 1
        ? `Additional business strengths include ${formatList(input.supportingFactors.slice(1))}`
        : 'The business also shows operating characteristics that support lender confidence'
    ),
    formatSentence(
      input.additionalLenderNotes
        ? input.additionalLenderNotes
        : 'The borrower appears meaningfully invested in the business and focused on long-term operating stability'
    ),
    'Taken together, these factors help reduce perceived credit risk and support the credibility of the repayment narrative.',
  ].join(' ');
  const closingParagraph = [
    'Thank you for your time and consideration of this request.',
    'Supporting documentation has been provided to substantiate the request and facilitate underwriting review.',
    'We welcome the opportunity to work with your team and respond promptly to any additional diligence questions.',
  ].join(' ');

  return [
    today,
    '',
    'Credit Committee',
    '',
    `Re: Loan Request for ${input.businessName}`,
    '',
    'Dear Credit Committee,',
    '',
    requestParagraph,
    '',
    businessOverviewParagraph,
    '',
    useOfFundsParagraph,
    '',
    repaymentParagraph,
    '',
    strengthsParagraph,
    '',
    closingParagraph,
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

  const model = process.env.OPENAI_MODEL || 'gpt-5.1';
  const client = new OpenAI({ apiKey });

  const systemPrompt = [
    'You are a senior small-business lending advisor.',
    'Write a lender-facing business loan cover letter.',
    'Tone must be factual, professional, and conservative.',
    'Do not promise approval and do not use hype language.',
    'Do not mention AI or automation.',
    COVER_LETTER_GENERATION_BLUEPRINT,
    'Reuse the supplied loan amount and loan purpose without asking for them again.',
    'Infer the financing structure from the loan purpose when needed, but stay conservative and generic if the exact facility structure is not explicit.',
    'Turn the structured responses into polished lender language without sounding promotional or technical.',
    'If an itemized use-of-funds breakdown is provided, reference the key allocations naturally in the Use of Funds and Timing section.',
    'Use all provided inputs when they are helpful, but do not invent missing facts.',
    'Make the narrative persuasive but lender-credible, with clean plain-text formatting.',
  ].join(' ');

  const userPrompt = [
    'Generate a formal cover letter for a business loan package using this data:',
    JSON.stringify(input, null, 2),
    'Follow the saved six-paragraph cover letter structure exactly every time.',
    'Output plain text only.',
  ].join('\n\n');

  const inputMessages = [
    {
      role: 'system' as const,
      content: systemPrompt,
    },
    {
      role: 'user' as const,
      content: userPrompt,
    },
  ];

  const response = model === 'gpt-5.1'
    ? await client.responses.create({
        model,
        reasoning: { effort: 'low' },
        temperature: 0.2,
        input: inputMessages,
      })
    : model.startsWith('gpt-5')
      ? await client.responses.create({
          model,
          reasoning: { effort: 'low' },
          input: inputMessages,
        })
      : await client.responses.create({
          model,
          temperature: 0.2,
          input: inputMessages,
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
  const structuredInputs = mergeStructuredCoverLetterInputs(existingInputs, payload.coverLetterInputs);
  const narrativeSelections = buildNarrativeSelections(structuredInputs);

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
    businessDescription:
      structuredInputs.businessDescription ||
      payload.businessDescription?.trim() ||
      asString(
        loanRequest.business_description,
        'The business has an established operating history and a defined customer base.',
      ),
    operatingHistory:
      structuredInputs.operatingHistory ||
      getFirstNonEmptyText(loanRequest.years_in_business),
    businessModelType: structuredInputs.businessModelType,
    businessLocation:
      structuredInputs.businessLocation ||
      'its current market',
    businessLocationDetails: structuredInputs.businessLocationDetails,
    currentBusinessTraits:
      narrativeSelections.currentBusinessTraits.length > 0
        ? narrativeSelections.currentBusinessTraits
        : ['an established local presence'],
    currentBusinessTraitsDetails: structuredInputs.currentBusinessTraitsDetails,
    employeeCount: structuredInputs.employeeCount,
    useOfFundsBreakdown: structuredInputs.useOfFundsBreakdown,
    useOfFundsNarrative:
      structuredInputs.useOfFundsNarrative ||
      'Loan proceeds will be used for clearly defined business needs tied to this request.',
    timingNarrative:
      structuredInputs.timingNarrative ||
      'The timing of this request aligns with an active business need that management is addressing now.',
    repaymentSource:
      narrativeSelections.repaymentSource ||
      'ongoing business cash flow',
    revenueStreams:
      narrativeSelections.revenueStreams.length > 0
        ? narrativeSelections.revenueStreams
        : ['ongoing customer activity'],
    financingImpact:
      narrativeSelections.financingImpact.length > 0
        ? narrativeSelections.financingImpact
        : ['support continued operations'],
    repaymentNotes: structuredInputs.repaymentNotes,
    supportingFactors:
      narrativeSelections.supportingFactors.length > 0
        ? narrativeSelections.supportingFactors
        : ['experienced ownership'],
    additionalLenderNotes: structuredInputs.additionalLenderNotes,
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
        ...structuredInputs,
        businessName: coverLetterInput.businessName,
        loanPurpose: coverLetterInput.loanPurpose,
        loanAmount: coverLetterInput.loanAmount,
        annualRevenue: coverLetterInput.annualRevenue,
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
    coverLetterInputs: structuredInputs,
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
