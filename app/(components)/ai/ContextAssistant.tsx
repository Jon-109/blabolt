'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  ChevronRight,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
  User2,
  X,
} from 'lucide-react';
import { supabase } from '@/supabase/helpers/client';
import { TEMPLATE_KEYS, type TemplateKey } from '@/lib/loan-packaging/constants';

type AssistantScope = 'loan_packaging_dashboard' | 'template';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

interface ContextAssistantProps {
  scope: AssistantScope;
  templateKey?: TemplateKey | null;
  loanRequestId?: string | null;
  submissionId?: string | null;
  title?: string;
  description?: string;
  suggestions?: string[];
}

type GuidanceBlock = {
  title: string;
  body: string;
};

const BASE_DASHBOARD_SUGGESTIONS = [
  'What should I do next?',
  'What documents are still missing?',
  'How can I make this package stronger before submission?',
];

const TEMPLATE_SUGGESTIONS: Record<TemplateKey, string[]> = {
  balance_sheet: [
    'What belongs in assets vs liabilities here?',
    'Why does the balance sheet have to balance?',
    'What mistakes make lenders distrust this statement?',
  ],
  income_statement: [
    'What should be counted as revenue here?',
    'How do I separate cost of goods sold from operating expenses?',
    'What makes an income statement look lender-ready?',
  ],
  personal_financial_statement: [
    'What should I include as personal assets here?',
    'How detailed do liabilities need to be?',
    'What do lenders look for on a personal financial statement?',
  ],
  personal_debt_summary: [
    'Which personal debts should I include?',
    'How detailed should monthly payment info be?',
    'What mistakes should I avoid on this debt summary?',
  ],
  business_debt_summary: [
    'Which business obligations belong on this schedule?',
    'How much detail do lenders need for each debt?',
    'How do lenders use this debt summary in underwriting?',
  ],
};

const BASE_DASHBOARD_GUIDANCE: GuidanceBlock[] = [
  {
    title: 'Best use of this assistant',
    body: 'Use it for next-step questions, missing-document confusion, how to explain your request to lenders, and what to tighten before you send the package out.',
  },
  {
    title: 'Good workflow order',
    body: 'Complete the loan profile first, finish every required template or upload, review the cover letter, then build the package ZIP and create lender access links.',
  },
  {
    title: 'What lenders care about most',
    body: 'Consistency, clean financial statements, a clear use of funds, visible repayment strength, and a package that does not create unnecessary follow-up questions.',
  },
];

const TEMPLATE_GUIDANCE: Record<TemplateKey, GuidanceBlock[]> = {
  balance_sheet: [
    {
      title: 'What this template does',
      body: 'This shows what the business owns, what it owes, and the remaining owner value as of one date. Lenders use it to judge leverage, liquidity, and overall financial position.',
    },
    {
      title: 'Most common mistakes',
      body: 'Mixing personal items into business accounts, forgetting short-term debt, putting depreciation in the wrong place, and forcing numbers to balance without understanding why.',
    },
    {
      title: 'What strong answers look like',
      body: 'Amounts should be current, categorized consistently, and believable relative to the business size, revenue, and debt load.',
    },
  ],
  income_statement: [
    {
      title: 'What this template does',
      body: 'This shows how the business performed over a period by organizing revenue, direct costs, operating expenses, and profit.',
    },
    {
      title: 'Most common mistakes',
      body: 'Putting owner draws into expenses, mixing one-time items into recurring operations, and confusing cost of goods sold with operating expenses.',
    },
    {
      title: 'What strong answers look like',
      body: 'Clean period dates, reasonable margins, and a consistent story between sales, expenses, and the business narrative in the package.',
    },
  ],
  personal_financial_statement: [
    {
      title: 'What this template does',
      body: 'This gives lenders a guarantor-level snapshot of personal assets, liabilities, and net worth.',
    },
    {
      title: 'Most common mistakes',
      body: 'Overstating asset values, omitting liabilities, and mixing business-only assets into personal net worth without clear ownership support.',
    },
    {
      title: 'What strong answers look like',
      body: 'Current balances, realistic values, and a statement that supports the guarantor story without obvious omissions.',
    },
  ],
  personal_debt_summary: [
    {
      title: 'What this template does',
      body: 'This organizes personal obligations so lenders can see balances, monthly payments, and repayment pressure on the guarantor.',
    },
    {
      title: 'Most common mistakes',
      body: 'Leaving out small obligations, using rough estimates for payments, and forgetting lines of credit or installment debt that still affect cash flow.',
    },
    {
      title: 'What strong answers look like',
      body: 'Every meaningful personal obligation is listed clearly with payment amounts that match reality closely enough for underwriting review.',
    },
  ],
  business_debt_summary: [
    {
      title: 'What this template does',
      body: 'This gives lenders a clean schedule of business obligations, who is owed, what the balances are, and how much debt service already exists.',
    },
    {
      title: 'Most common mistakes',
      body: 'Leaving out merchant cash advances, short-term loans, equipment notes, or lines of credit that materially affect monthly obligations.',
    },
    {
      title: 'What strong answers look like',
      body: 'Each obligation is easy to understand, monthly payments are accurate, and the schedule lines up with the business financial story.',
    },
  ],
};

function isTemplateKey(value: string | null | undefined): value is TemplateKey {
  return Boolean(value && (TEMPLATE_KEYS as readonly string[]).includes(value));
}

function humanizeTemplateKey(value: TemplateKey): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildStorageKey(
  scope: AssistantScope,
  templateKey?: TemplateKey | null,
  loanRequestId?: string | null,
  submissionId?: string | null,
) {
  return [
    'context-assistant',
    scope,
    templateKey ?? 'none',
    loanRequestId ?? 'none',
    submissionId ?? 'none',
  ].join(':');
}

function trimMessageContent(value: string, maxLength = 900): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}...`;
}

function buildFallbackMessage(
  scope: AssistantScope,
  templateKey: TemplateKey | null,
  errorMessage: string,
): string {
  const intro = errorMessage.toLowerCase().includes('quota')
    ? 'AI responses are temporarily unavailable because the OpenAI account is out of quota right now.'
    : 'AI responses are temporarily unavailable right now.';

  if (scope === 'loan_packaging_dashboard') {
    return [
      intro,
      '',
      'You can still use this panel for guided help:',
      '1. Finish the loan profile so the package has a clear business name, purpose, and amount.',
      '2. Complete or upload every required checklist item before building the final ZIP.',
      '3. Review the cover letter carefully so the narrative matches the financial documents.',
      '4. Build the package and create lender links only after the checklist looks clean.',
    ].join('\n');
  }

  return [
    intro,
    '',
    `You can still use this ${templateKey ? humanizeTemplateKey(templateKey) : 'template'} assistant area for structured guidance.`,
    'Focus on entering complete, consistent, lender-friendly numbers and descriptions.',
    'Use the guidance cards below for what belongs here, common mistakes, and what strong answers look like.',
  ].join('\n');
}

export default function ContextAssistant({
  scope,
  templateKey,
  loanRequestId,
  submissionId,
  title,
  description,
  suggestions,
}: ContextAssistantProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const resolvedTemplateKey: TemplateKey | null =
    isTemplateKey(templateKey ?? undefined) ? (templateKey ?? null) : null;
  const storageKey = useMemo(
    () => buildStorageKey(scope, resolvedTemplateKey, loanRequestId, submissionId),
    [scope, resolvedTemplateKey, loanRequestId, submissionId],
  );

  const resolvedSuggestions = useMemo(() => {
    if (suggestions && suggestions.length > 0) {
      return suggestions;
    }

    if (scope === 'loan_packaging_dashboard') {
      return BASE_DASHBOARD_SUGGESTIONS;
    }

    return resolvedTemplateKey
      ? TEMPLATE_SUGGESTIONS[resolvedTemplateKey]
      : [
          'Explain this template in plain English.',
          'What do lenders want to see here?',
          'What common mistakes should I avoid?',
        ];
  }, [scope, resolvedTemplateKey, suggestions]);

  const guidanceBlocks = useMemo(() => {
    if (scope === 'loan_packaging_dashboard') {
      return BASE_DASHBOARD_GUIDANCE;
    }

    return resolvedTemplateKey ? TEMPLATE_GUIDANCE[resolvedTemplateKey] : [];
  }, [scope, resolvedTemplateKey]);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) {
        return;
      }

      setAccessToken(data.session?.access_token ?? null);
    }

    loadSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setMessages([]);
      } else {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(parsed)) {
          setMessages(
            parsed
              .filter(
                (message) =>
                  message &&
                  (message.role === 'user' || message.role === 'assistant') &&
                  typeof message.content === 'string' &&
                  message.content.trim().length > 0,
              )
              .slice(-12),
          );
        } else {
          setMessages([]);
        }
      }
    } catch {
      setMessages([]);
    } finally {
      setHistoryLoaded(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!historyLoaded || typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(messages.slice(-12)));
  }, [historyLoaded, messages, storageKey]);

  useEffect(() => {
    if (messages.length > 0) {
      setIsOpen(true);
    }
  }, [messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading, isOpen]);

  const canSubmit = draft.trim().length > 0 && !loading && Boolean(accessToken);
  const unresolvedError =
    !accessToken
      ? 'You need to be logged in to use the assistant.'
      : error;

  async function sendMessage(nextMessage: string) {
    const trimmed = nextMessage.trim();
    if (!trimmed || !accessToken) {
      return;
    }

    const nextMessages = [...messages, { role: 'user' as const, content: trimmed }].slice(-12);
    setMessages(nextMessages);
    setDraft('');
    setLoading(true);
    setError(null);
    setIsOpen(true);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scope,
          templateKey: resolvedTemplateKey ?? undefined,
          loanRequestId: loanRequestId ?? undefined,
          submissionId: submissionId ?? undefined,
          messages: nextMessages.slice(-8),
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          payload && typeof payload === 'object' && 'error' in payload
            ? String((payload as { error?: unknown }).error ?? 'Assistant request failed')
            : 'Assistant request failed',
        );
      }

      const message =
        payload && typeof payload === 'object' && 'message' in payload
          ? String((payload as { message?: unknown }).message ?? '')
          : '';

      if (!message) {
        throw new Error('Assistant response was empty.');
      }

      setMessages((current) => [
        ...current.slice(-11),
        { role: 'assistant', content: trimMessageContent(message) },
      ]);
    } catch (requestError) {
      const fallbackError =
        requestError instanceof Error
          ? requestError.message
          : 'Assistant request failed';
      setError(fallbackError);
      setMessages((current) => [
        ...current.slice(-11),
        {
          role: 'assistant',
          content: buildFallbackMessage(scope, resolvedTemplateKey, fallbackError),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft);
  }

  function clearHistory() {
    setMessages([]);
    setError(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey);
    }
  }

  const resolvedTitle =
    title ??
    (scope === 'loan_packaging_dashboard'
      ? 'Loan Packaging Assistant'
      : `${resolvedTemplateKey ? humanizeTemplateKey(resolvedTemplateKey) : 'Template'} Assistant`);

  const resolvedDescription =
    description ??
    (scope === 'loan_packaging_dashboard'
      ? 'Ask what is missing, what to do next, or how to tighten the package before submission.'
      : 'Ask for help with this template, confusing fields, lender expectations, or common mistakes.');

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="fixed bottom-5 right-5 z-[70] inline-flex items-center gap-3 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_50px_-18px_rgba(15,23,42,0.55)] transition hover:bg-slate-900"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-400 text-slate-950">
          <Bot className="h-5 w-5" />
        </span>
        <span className="hidden sm:block">
          {unresolvedError ? 'Guided Help' : 'Any Questions?'}
        </span>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[80] bg-slate-950/30 backdrop-blur-[1px]">
          <button
            type="button"
            aria-label="Close assistant"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setIsOpen(false)}
          />

          <section className="absolute bottom-20 right-3 top-3 flex w-[min(430px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_32px_80px_-30px_rgba(15,23,42,0.65)] sm:bottom-24 sm:right-5 sm:top-auto sm:h-[min(78vh,760px)]">
            <div className="border-b border-slate-200 bg-[linear-gradient(135deg,rgba(14,165,233,0.13),rgba(15,23,42,0.03))] px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-sky-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    {unresolvedError ? 'Guided Help Mode' : 'AI Guidance'}
                  </p>
                  <h2 className="mt-3 text-lg font-semibold text-slate-900">{resolvedTitle}</h2>
                  <p className="mt-1 text-sm text-slate-600">{resolvedDescription}</p>
                </div>

                <div className="flex items-center gap-2">
                  {messages.length > 0 ? (
                    <button
                      type="button"
                      onClick={clearHistory}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-slate-100"
                      aria-label="Clear conversation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-slate-100"
                    aria-label="Close assistant"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {unresolvedError ? (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  {unresolvedError}
                </div>
              ) : null}

              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    Ask a question and I&apos;ll answer using the current workflow context.
                  </div>

                  <div className="space-y-3">
                    {guidanceBlocks.map((block) => (
                      <article
                        key={block.title}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                      >
                        <h3 className="text-sm font-semibold text-slate-900">{block.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{block.body}</p>
                      </article>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <MessageSquare className="h-4 w-4 text-sky-700" />
                      Good questions to ask
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {resolvedSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => void sendMessage(suggestion)}
                          disabled={loading || !accessToken}
                          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`flex gap-3 ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                          <Bot className="h-4 w-4" />
                        </div>
                      ) : null}

                      <div
                        className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                          message.role === 'assistant'
                            ? 'border border-slate-200 bg-slate-50 text-slate-700'
                            : 'bg-slate-900 text-white'
                        }`}
                      >
                        {message.content}
                      </div>

                      {message.role === 'user' ? (
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                          <User2 className="h-4 w-4" />
                        </div>
                      ) : null}
                    </div>
                  ))}

                  {loading ? (
                    <div className="flex gap-3">
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Thinking through your context...
                      </div>
                    </div>
                  ) : null}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-5 py-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {resolvedSuggestions.slice(0, 3).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void sendMessage(suggestion)}
                    disabled={loading || !accessToken}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                    {suggestion}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block">
                  <span className="sr-only">Ask the assistant</span>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={4}
                    placeholder={
                      scope === 'loan_packaging_dashboard'
                        ? 'Ask about missing docs, next steps, lender expectations, or your cover letter...'
                        : 'Ask what a field means, what lenders expect, or what to fix before generating the PDF...'
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </label>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    {unresolvedError
                      ? 'Guided help stays available even while live AI is offline.'
                      : 'Conversation history is saved locally on this device for this workflow.'}
                  </p>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Ask
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
