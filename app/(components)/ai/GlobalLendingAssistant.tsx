'use client';

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  Bot,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  User2,
  X,
} from 'lucide-react';
import { supabase } from '@/supabase/helpers/client';

type AssistantAction = {
  label: string;
  href: string;
  kind: 'continue' | 'learn' | 'signin';
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  actions?: AssistantAction[];
};

const ANONYMOUS_SUGGESTIONS = [
  'What business loan might fit my needs?',
  'How do lenders evaluate cash flow?',
  'What documents should I prepare?',
];

const MEMBER_SUGGESTIONS = [
  'What should I work on next?',
  'Review my saved loan readiness.',
  'What could make my application stronger?',
];

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ChatMessage>;
  return (
    (candidate.role === 'user' || candidate.role === 'assistant') &&
    typeof candidate.content === 'string' &&
    candidate.content.trim().length > 0
  );
}

export default function GlobalLendingAssistant() {
  const pathname = usePathname();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const storageKey = `bla-lending-assistant:${userId ?? 'anonymous'}`;
  const isAuthenticated = Boolean(accessToken && userId);
  const suggestions = isAuthenticated ? MEMBER_SUGGESTIONS : ANONYMOUS_SUGGESTIONS;
  const isHidden = useMemo(
    () =>
      pathname.startsWith('/admin') ||
      pathname.startsWith('/auth/') ||
      pathname.startsWith('/lender/') ||
      pathname.startsWith('/report/'),
    [pathname],
  );

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data }: { data: { session: { access_token: string; user: { id: string } } | null } }) => {
      if (!active) return;
      setAccessToken(data.session?.access_token ?? null);
      setUserId(data.session?.user.id ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event: string, session: { access_token: string; user: { id: string } } | null) => {
      if (!active) return;
      setAccessToken(session?.access_token ?? null);
      setUserId(session?.user.id ?? null);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setHistoryLoaded(false);
    try {
      const saved = window.localStorage.getItem(storageKey);
      const parsed: unknown = saved ? JSON.parse(saved) : [];
      setMessages(Array.isArray(parsed) ? parsed.filter(isChatMessage).slice(-12) : []);
    } catch {
      setMessages([]);
    } finally {
      setHistoryLoaded(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!historyLoaded) return;
    window.localStorage.setItem(storageKey, JSON.stringify(messages.slice(-12)));
  }, [historyLoaded, messages, storageKey]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    window.setTimeout(() => textareaRef.current?.focus(), 50);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading, isOpen]);

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || loading) return;

    const nextMessages = [...messages, { role: 'user' as const, content: trimmed }].slice(-12);
    setMessages(nextMessages);
    setDraft('');
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          scope: 'global',
          currentPage: pathname,
          messages: nextMessages.slice(-10).map(({ role, content: messageContent }) => ({
            role,
            content: messageContent,
          })),
        }),
      });
      const payload: unknown = await response.json().catch(() => null);
      const result = payload && typeof payload === 'object'
        ? payload as { message?: unknown; error?: unknown; actions?: unknown }
        : null;

      if (!response.ok) {
        throw new Error(typeof result?.error === 'string' ? result.error : 'The assistant could not respond.');
      }

      if (typeof result?.message !== 'string' || !result.message.trim()) {
        throw new Error('The assistant response was empty.');
      }

      const actions = Array.isArray(result.actions)
        ? result.actions.filter((action): action is AssistantAction => {
            if (!action || typeof action !== 'object') return false;
            const candidate = action as Partial<AssistantAction>;
            return (
              typeof candidate.label === 'string' &&
              typeof candidate.href === 'string' &&
              candidate.href.startsWith('/') &&
              (candidate.kind === 'continue' || candidate.kind === 'learn' || candidate.kind === 'signin')
            );
          })
        : [];

      setMessages((current) => [
        ...current.slice(-11),
        { role: 'assistant', content: result.message as string, actions: actions.slice(0, 2) },
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The assistant could not respond.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft);
  }

  function handleDraftKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(draft);
    }
  }

  if (isHidden) return null;

  return (
    <div data-global-assistant className="print-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open lending assistant"
        aria-expanded={isOpen}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-[70] inline-flex min-h-14 items-center gap-2 rounded-full bg-slate-950 px-3 py-2.5 text-sm font-bold text-white shadow-[0_20px_50px_-16px_rgba(15,23,42,0.65)] transition hover:-translate-y-0.5 hover:bg-slate-800 sm:right-5 sm:px-4"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-400 text-slate-950">
          <MessageCircle className="h-5 w-5" />
        </span>
        <span className="hidden sm:inline">Ask a Lending Question</span>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[90] bg-slate-950/45 backdrop-blur-[2px] sm:bg-slate-950/25" role="presentation">
          <button type="button" className="absolute inset-0" aria-label="Close lending assistant" onClick={() => setIsOpen(false)} />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="lending-assistant-title"
            className="absolute inset-x-2 bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] top-[calc(env(safe-area-inset-top)+0.5rem)] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[min(720px,calc(100dvh-7rem))] sm:w-[min(520px,calc(100vw-2.5rem))] sm:rounded-[26px]"
          >
            <header className="shrink-0 border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 px-4 py-4 text-white sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-400 text-slate-950">
                    <Bot className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 id="lending-assistant-title" className="font-bold">Lending Assistant</h2>
                      <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-100">
                        {isAuthenticated ? 'Personalized' : 'General guidance'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-300 sm:whitespace-nowrap">
                      Clear answers first, with detail when you need it.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button type="button" onClick={() => setIsOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-slate-200 hover:bg-white/10" aria-label="Close lending assistant">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                    <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Sparkles className="h-4 w-4 text-sky-700" />
                      How can I help?
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Ask about loan options, cash flow, lender requirements, documents, or your next step.
                      {isAuthenticated ? ' I can use your saved account information when it is relevant.' : ''}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {suggestions.map((suggestion) => (
                      <button key={suggestion} type="button" onClick={() => void sendMessage(suggestion)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50">
                        {suggestion}
                        <ArrowRight className="h-4 w-4 shrink-0 text-sky-700" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={`${message.role}-${index}`} className={`flex gap-2.5 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.role === 'assistant' ? (
                        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700"><Bot className="h-4 w-4" /></span>
                      ) : null}
                      <div className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-slate-50 text-slate-700'}`}>
                        <div className="whitespace-pre-wrap break-words">{message.content}</div>
                        {message.actions && message.actions.length > 0 ? (
                          <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                            {message.actions.map((action) => (
                              <Link key={`${action.href}-${action.label}`} href={action.href} onClick={() => setIsOpen(false)} className="flex items-center justify-between gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-sky-800">
                                {action.label}
                                <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      {message.role === 'user' ? (
                        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700"><User2 className="h-4 w-4" /></span>
                      ) : null}
                    </div>
                  ))}
                  {loading ? (
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700"><Bot className="h-4 w-4" /></span>
                      <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Thinking...</span>
                    </div>
                  ) : null}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            <footer className="shrink-0 border-t border-slate-200 bg-white px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 sm:px-4 sm:pb-4">
              {error ? <p className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}
              <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleDraftKeyDown}
                  rows={2}
                  maxLength={4000}
                  placeholder="Ask a lending question..."
                  className="max-h-28 min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                <button type="submit" disabled={!draft.trim() || loading} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
              <p className="mt-2 text-center text-[10px] leading-4 text-slate-500">General guidance only. Verify important financing decisions with your lender or advisor.</p>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
