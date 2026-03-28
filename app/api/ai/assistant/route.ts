import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import {
  TEMPLATE_KEYS,
  type TemplateKey,
} from '@/lib/loan-packaging/constants';
import {
  buildAssistantSystemPrompt,
  buildDashboardAssistantContext,
  buildTemplateAssistantContext,
} from '@/lib/ai/context-assistant';
import { resolveServiceAccessForUser } from '@/lib/server/service-access';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { isApiUserFailure, requireApiUser } from '@/lib/server/request-auth';

export const runtime = 'nodejs';

const assistantRequestSchema = z.object({
  scope: z.enum(['loan_packaging_dashboard', 'template']),
  templateKey: z.enum(TEMPLATE_KEYS).optional(),
  loanRequestId: z.string().uuid().optional(),
  submissionId: z.string().uuid().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(12),
});

function getAssistantModel(): string {
  return (
    process.env.OPENAI_ASSISTANT_MODEL ||
    process.env.OPENAI_MODEL ||
    'gpt-4.1-mini'
  );
}

async function ensureAssistantAccess(
  user: { id: string; email?: string | null },
  scope: 'loan_packaging_dashboard' | 'template',
) {
  const access = await resolveServiceAccessForUser({
    id: user.id,
    email: user.email ?? undefined,
  });

  if (scope === 'loan_packaging_dashboard') {
    return access.canAccessLoanPackaging;
  }

  return access.canAccessTemplates || access.canAccessLoanPackaging;
}

function normalizeTemplateKey(value: unknown): TemplateKey | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  return (TEMPLATE_KEYS as readonly string[]).includes(value)
    ? (value as TemplateKey)
    : undefined;
}

function mapOpenAiError(error: unknown): { status: number; message: string } {
  const maybeError = error as {
    status?: number;
    code?: string;
    type?: string;
    message?: string;
    error?: { code?: string; type?: string; message?: string };
  };

  const status = maybeError?.status;
  const code = maybeError?.code ?? maybeError?.error?.code;
  const type = maybeError?.type ?? maybeError?.error?.type;
  const message = maybeError?.message ?? maybeError?.error?.message;

  if (status === 429 || code === 'insufficient_quota' || type === 'insufficient_quota') {
    return {
      status: 503,
      message:
        'The AI assistant is configured, but the OpenAI account is out of quota right now. Please check billing or project limits and try again.',
    };
  }

  if (status === 401 || code === 'invalid_api_key') {
    return {
      status: 503,
      message:
        'The AI assistant could not authenticate with OpenAI. Please verify the server-side API key and restart the app.',
    };
  }

  return {
    status: 502,
    message:
      typeof message === 'string' && message.trim().length > 0
        ? `OpenAI request failed: ${message}`
        : 'OpenAI request failed. Please try again in a moment.',
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiUserFailure(auth)) {
    return auth.response;
  }

  const parsed = assistantRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  if (!(await ensureAssistantAccess(auth.user, payload.scope))) {
    return NextResponse.json({ error: 'Assistant access is not available' }, { status: 403 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI assistant is not configured. Set OPENAI_API_KEY to enable it.' },
      { status: 503 },
    );
  }

  const admin = getSupabaseAdmin();
  const context =
    payload.scope === 'loan_packaging_dashboard'
      ? await buildDashboardAssistantContext({
          admin,
          userId: auth.user.id,
          loanRequestId: payload.loanRequestId,
        })
      : await buildTemplateAssistantContext({
          admin,
          userId: auth.user.id,
          templateKey: normalizeTemplateKey(payload.templateKey) ?? 'balance_sheet',
          loanRequestId: payload.loanRequestId,
          submissionId: payload.submissionId,
        });

  const client = new OpenAI({ apiKey });
  const model = getAssistantModel();
  const systemPrompt = buildAssistantSystemPrompt(
    payload.scope,
    normalizeTemplateKey(payload.templateKey),
  );

  try {
    const response = await client.responses.create({
      model,
      temperature: 0.3,
      max_output_tokens: 700,
      store: false,
      input: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Application context:\n${JSON.stringify(context, null, 2)}`,
        },
        ...payload.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
    });

    const message = response.output_text?.trim();
    if (!message) {
      return NextResponse.json(
        { error: 'Assistant response was empty. Please try again.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    const mapped = mapOpenAiError(error);
    console.error('[ai-assistant] OpenAI request failed:', error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
