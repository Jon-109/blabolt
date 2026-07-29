import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { resolveServiceAccessForUser } from '@/lib/server/service-access';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { isApiUserFailure, requireApiUser } from '@/lib/server/request-auth';

export const runtime = 'nodejs';

const businessModelTypeSchema = z.enum(['local', 'regional', 'nationwide', 'online', 'hybrid']).or(z.literal(''));

const researchRequestSchema = z.object({
  loanRequestId: z.string().uuid().optional().nullable(),
  businessName: z.string().trim().min(2).max(200),
  location: z.string().trim().max(200).optional().default(''),
  websiteUrl: z.string().trim().max(500).optional().default(''),
});

const researchSuggestionsSchema = z.object({
  businessDescription: z.string().trim().max(900).optional().default(''),
  industry: z.string().trim().max(120).optional().default(''),
  entityType: z.string().trim().max(80).optional().default(''),
  customerType: z.string().trim().max(900).optional().default(''),
  topCustomers: z.string().trim().max(900).optional().default(''),
  websiteUrl: z.string().trim().max(500).optional().default(''),
  ownerManagementExperience: z.string().trim().max(900).optional().default(''),
  operatingHistory: z.string().trim().max(4).optional().default(''),
  businessModelType: businessModelTypeSchema.optional().default(''),
  businessLocationDetails: z.string().trim().max(500).optional().default(''),
  businessLocation: z.string().trim().max(300).optional().default(''),
  currentBusinessTraits: z.array(z.string().trim().min(1).max(120)).max(5).optional().default([]),
  currentBusinessTraitsDetails: z.string().trim().max(900).optional().default(''),
  employeeCount: z.string().trim().max(20).optional().default(''),
  revenueStreams: z.array(z.string().trim().min(1).max(120)).max(5).optional().default([]),
  repaymentSource: z.string().trim().max(180).optional().default(''),
  supportingFactors: z.array(z.string().trim().min(1).max(120)).max(5).optional().default([]),
  supportingFactorsDetails: z.string().trim().max(900).optional().default(''),
  additionalLenderNotes: z.string().trim().max(900).optional().default(''),
});

type ResearchSuggestions = z.infer<typeof researchSuggestionsSchema>;

type ResearchSource = {
  type: 'website' | 'search';
  url?: string;
  title?: string;
  content: string;
};

const BUSINESS_TRAIT_OPTIONS = new Set([
  'Repeat customers',
  'Recurring revenue',
  'Long-term contracts',
  'Growing demand',
  'Consistent cash flow',
  'Strong financial performance',
  'Established market reputation',
  'Specialized or niche offering',
  'Strong referral business',
  'Low customer concentration',
  'Multiple revenue streams',
  'Stable monthly sales',
  'Scalable business model',
  'Experienced management team',
]);

const REVENUE_STREAM_OPTIONS = new Set([
  'Repeat customers',
  'Recurring or subscription revenue',
  'Signed or long-term contracts',
  'Retail sales',
  'Online sales',
  'Service-based income',
  'Project-based work',
  'Wholesale revenue',
  'Rental or lease income',
  'Seasonal sales',
  'Other',
]);

const SUPPORTING_FACTOR_OPTIONS = new Set([
  'Experienced ownership',
  'Strong industry knowledge',
  'Repeat customers',
  'Recurring revenue',
  'Long-term contracts',
  'Stable revenue history',
  'Strong profit margins',
  'Low existing debt',
  'Owner investment in the business',
  'Good payment history',
  'Established local reputation',
  'Growing demand',
  'Collateral available',
  'Personal guarantee available',
  'Other',
]);

async function ensureLoanPackagingApiAccess(user: { id: string; email?: string | null }) {
  const access = await resolveServiceAccessForUser({
    id: user.id,
    email: user.email ?? undefined,
  });

  return access.canAccessLoanPackaging;
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripHtml(match[1] ?? '').slice(0, 180) : '';
}

async function fetchWebsiteSource(websiteUrl: string): Promise<ResearchSource | null> {
  const normalizedUrl = normalizeUrl(websiteUrl);
  if (!normalizedUrl) {
    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    return null;
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return null;
  }

  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BlaboltBusinessResearch/1.0)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return null;
    }

    const html = await response.text();
    const content = stripHtml(html).slice(0, 18_000);
    if (content.length < 120) {
      return null;
    }

    return {
      type: 'website',
      url: parsedUrl.toString(),
      title: extractTitle(html),
      content,
    };
  } catch {
    return null;
  }
}

function keepAllowedValues(values: string[], allowed: Set<string>, max: number): string[] {
  return Array.from(new Set(values.filter((value) => allowed.has(value)))).slice(0, max);
}

function sanitizeSuggestions(value: unknown, fallbackWebsiteUrl: string, fallbackLocation: string): ResearchSuggestions {
  const parsed = researchSuggestionsSchema.safeParse(value);
  const suggestions = parsed.success ? parsed.data : researchSuggestionsSchema.parse({});

  const operatingHistory = /^\d{4}$/.test(suggestions.operatingHistory) ? suggestions.operatingHistory : '';

  return {
    ...suggestions,
    websiteUrl: suggestions.websiteUrl || normalizeUrl(fallbackWebsiteUrl),
    businessLocation: suggestions.businessLocation || fallbackLocation,
    businessLocationDetails: suggestions.businessLocationDetails || fallbackLocation,
    operatingHistory,
    currentBusinessTraits: keepAllowedValues(suggestions.currentBusinessTraits, BUSINESS_TRAIT_OPTIONS, 5),
    revenueStreams: keepAllowedValues(suggestions.revenueStreams, REVENUE_STREAM_OPTIONS, 5),
    supportingFactors: keepAllowedValues(suggestions.supportingFactors, SUPPORTING_FACTOR_OPTIONS, 5),
  };
}

function extractJsonObject(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return {};
    }

    try {
      return JSON.parse(match[0]);
    } catch {
      return {};
    }
  }
}

async function generateResearchSuggestions({
  businessName,
  location,
  websiteUrl,
  sources,
}: {
  businessName: string;
  location: string;
  websiteUrl: string;
  sources: ResearchSource[];
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Business research is not configured. Set OPENAI_API_KEY to enable it.');
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_RESEARCH_MODEL || process.env.OPENAI_MODEL || 'gpt-4.1-mini';
  const sourceText = sources.length > 0
    ? sources.map((source, index) => [
        `Source ${index + 1}: ${source.type}`,
        source.title ? `Title: ${source.title}` : '',
        source.url ? `URL: ${source.url}` : '',
        source.content,
      ].filter(Boolean).join('\n')).join('\n\n---\n\n')
    : 'No website text was available. Use only the business name, location, and website URL. Leave fields blank when not supported.';

  const systemPrompt = [
    'You help business owners complete a lender-facing loan package.',
    'Extract conservative, factual field suggestions from public business information.',
    'Do not invent facts. If a field is not supported by the supplied information, return an empty string or empty array.',
    'Use plain language that a small business owner can review and edit.',
    'Return JSON only. Do not wrap it in markdown.',
    'Use only these businessModelType values: local, regional, nationwide, online, hybrid, or empty string.',
    `Use currentBusinessTraits only from: ${Array.from(BUSINESS_TRAIT_OPTIONS).join(', ')}.`,
    `Use revenueStreams only from: ${Array.from(REVENUE_STREAM_OPTIONS).join(', ')}.`,
    `Use supportingFactors only from: ${Array.from(SUPPORTING_FACTOR_OPTIONS).join(', ')}.`,
  ].join(' ');

  const userPrompt = [
    `Business name: ${businessName}`,
    `Location: ${location || 'Not provided'}`,
    `Website URL: ${websiteUrl || 'Not provided'}`,
    '',
    'Public information:',
    sourceText,
    '',
    'Return this JSON shape:',
    JSON.stringify(researchSuggestionsSchema.parse({}), null, 2),
  ].join('\n');

  const response = await client.responses.create({
    model,
    temperature: 0.1,
    max_output_tokens: 1400,
    store: false,
    input: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  return {
    model,
    outputText: response.output_text?.trim() ?? '',
    usage: response.usage,
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiUserFailure(auth)) {
    return auth.response;
  }

  if (!(await ensureLoanPackagingApiAccess(auth.user))) {
    return NextResponse.json({ error: 'Loan packaging access is required' }, { status: 403 });
  }

  const parsed = researchRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();
  const payload = parsed.data;

  let existingCoverLetterInputs: Record<string, unknown> = {};

  if (payload.loanRequestId) {
    const { data: loanRequest } = await admin
      .from('loan_requests')
      .select('id, cover_letter_inputs')
      .eq('id', payload.loanRequestId)
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (!loanRequest) {
      return NextResponse.json({ error: 'Loan request not found' }, { status: 404 });
    }

    existingCoverLetterInputs = loanRequest.cover_letter_inputs && typeof loanRequest.cover_letter_inputs === 'object'
      ? loanRequest.cover_letter_inputs as Record<string, unknown>
      : {};
  }

  const normalizedWebsiteUrl = normalizeUrl(payload.websiteUrl);
  const websiteSource = await fetchWebsiteSource(normalizedWebsiteUrl);
  const sources = websiteSource ? [websiteSource] : [];

  try {
    const generated = await generateResearchSuggestions({
      businessName: payload.businessName,
      location: payload.location,
      websiteUrl: normalizedWebsiteUrl,
      sources,
    });
    const rawJson = extractJsonObject(generated.outputText);
    const suggestions = sanitizeSuggestions(rawJson, normalizedWebsiteUrl, payload.location);
    const compactSources = sources.map((source) => ({
      type: source.type,
      url: source.url,
      title: source.title,
    }));

    await admin.from('loan_packaging_business_research_runs').insert({
      user_id: auth.user.id,
      loan_request_id: payload.loanRequestId || null,
      business_name: payload.businessName,
      location: payload.location || null,
      website_url: normalizedWebsiteUrl || null,
      status: 'completed',
      model: generated.model,
      prompt_tokens: generated.usage?.input_tokens ?? null,
      completion_tokens: generated.usage?.output_tokens ?? null,
      total_tokens: generated.usage?.total_tokens ?? null,
      sources: compactSources,
      suggestions,
      raw_response: { outputText: generated.outputText },
    });

    if (payload.loanRequestId) {
      await admin
        .from('loan_requests')
        .update({
          cover_letter_inputs: {
            ...existingCoverLetterInputs,
            ...suggestions,
            businessResearchLastRunAt: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.loanRequestId)
        .eq('user_id', auth.user.id);
    }

    return NextResponse.json({
      suggestions,
      sources: compactSources,
      message: sources.length > 0
        ? 'Research complete. Review the suggested answers before generating your cover letter.'
        : 'Research complete with limited public website information. Review the suggested answers before generating your cover letter.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Business research failed';
    await admin.from('loan_packaging_business_research_runs').insert({
      user_id: auth.user.id,
      loan_request_id: payload.loanRequestId || null,
      business_name: payload.businessName,
      location: payload.location || null,
      website_url: normalizedWebsiteUrl || null,
      status: 'failed',
      sources: sources.map((source) => ({ type: source.type, url: source.url, title: source.title })),
      error_message: message,
    });

    console.error('[business-research] request failed:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
