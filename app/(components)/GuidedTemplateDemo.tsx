'use client';

import { useEffect, useState } from 'react';
import type { AnimationEvent } from 'react';
import { ArrowRight, Check, Download, Loader2, MousePointer2, PenLine } from 'lucide-react';

import SBAForm413SvgTemplate from '@/app/(components)/templates/SBAForm413SvgTemplate';
import { personalFinancialStatementPreviewData } from '@/lib/templates/preview-data';
import type { PersonalFinancialStatementData } from '@/lib/templates/types';

const blankPersonalFinancialStatementData: PersonalFinancialStatementData = {
  asOfDate: '',
  personalInfo: { name: '' },
  assets: {},
  liabilities: {},
};

const questions = [
  ['How much cash do you have across personal bank accounts?', '$84,000'],
  ['What is the current value of your real estate?', '$623,000'],
  ['How much is held in retirement accounts?', '$154,500'],
  ['What do you currently owe on real estate?', '$371,000'],
  ['What other personal debt is outstanding?', '$106,700'],
];

type GenerationPhase = 'empty' | 'filling' | 'submit' | 'generating' | 'ready';

export default function GuidedTemplateDemo({ compact = false }: { compact?: boolean }) {
  const [phase, setPhase] = useState<GenerationPhase>('empty');
  const [downloaded, setDownloaded] = useState(false);
  const formHasValues = phase !== 'empty';
  const ready = phase === 'ready';

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('ready');
      return;
    }

    const delay = phase === 'empty'
      ? 500
      : phase === 'filling'
        ? 2200
        : phase === 'submit'
          ? 1200
          : phase === 'generating'
            ? 1200
            : null;
    if (delay === null) return;

    const nextPhase: GenerationPhase = phase === 'empty'
      ? 'filling'
      : phase === 'filling'
        ? 'submit'
        : phase === 'submit'
          ? 'generating'
          : 'ready';
    const timer = window.setTimeout(() => setPhase(nextPhase), delay);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const submit = () => {
    if (phase === 'empty' || phase === 'filling') return;
    setPhase('generating');
    setDownloaded(false);
    window.setTimeout(() => setPhase('ready'), 900);
  };

  const handlePdfScrollComplete = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.animationName !== 'template-pdf-scroll') return;
    setPhase('empty');
    setDownloaded(false);
  };

  const buttonLabel = phase === 'generating'
    ? 'Generating…'
    : ready
      ? 'PDF ready'
      : 'Submit';

  return (
    <div className={`grid gap-3 ${compact ? 'lg:grid-cols-[0.95fr_118px_1.05fr]' : 'lg:grid-cols-[0.9fr_118px_1.1fr]'} lg:items-stretch`}>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-800">Step 1 • Guided questions</p><p className="mt-1 text-sm font-extrabold text-slate-950">Personal Financial Statement</p></div><PenLine className="h-5 w-5 text-cyan-800" /></div>
        <p className="mt-2 text-xs leading-5 text-slate-600">Answer in plain English. The totals and SBA categories are handled behind the scenes.</p>
        <div className="mt-3 space-y-2">
          {questions.map(([label, value], index) => <label key={label} className="grid items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_120px]"><span className="text-xs font-bold leading-5 text-slate-700">{label}</span><span className="flex min-h-9 items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-2"><span className={`text-xs font-extrabold text-slate-900 transition-opacity duration-300 ${formHasValues ? 'template-demo-value opacity-100' : 'opacity-0'}`} style={{ animationDelay: `${index * 180}ms` }}>{value}</span>{formHasValues ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : null}</span></label>)}
        </div>
        <div className={`mt-3 rounded-xl px-3 py-2.5 transition ${formHasValues ? 'bg-[#0b3345] text-white' : 'bg-slate-100 text-slate-400'}`}><span className="text-xs font-bold">Estimated net worth</span><span className={`ml-3 text-sm font-black ${formHasValues ? '' : 'opacity-0'}`}>$489,300</span></div>
      </div>

      <div className="flex items-center justify-center py-1 lg:py-0">
        <button type="button" onClick={submit} disabled={phase === 'empty' || phase === 'filling' || phase === 'generating' || ready} className={`template-generate-control relative inline-flex min-h-11 min-w-[118px] items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] font-extrabold shadow-lg transition ${ready ? 'bg-emerald-500 text-white' : phase === 'generating' ? 'bg-amber-200 text-amber-950' : phase === 'submit' ? 'bg-amber-300 text-[#071824] hover:bg-amber-200' : 'cursor-not-allowed bg-slate-200 text-slate-500'}`}>
          {phase === 'generating' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : ready ? <Check className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5 rotate-90 lg:rotate-0" />}
          {buttonLabel}
          {phase === 'submit' ? <MousePointer2 className="template-fake-cursor pointer-events-none absolute h-5 w-5 fill-white text-slate-950" /> : null}
        </button>
      </div>

      <div className={`relative overflow-hidden rounded-2xl border bg-white p-3 shadow-[0_22px_60px_-40px_rgba(15,23,42,0.55)] transition ${ready ? 'border-emerald-300' : 'border-slate-300'} sm:p-4`}>
        <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-800">Step 2 • Generated document</p><p className="mt-1 text-sm font-extrabold text-slate-950">Personal Financial Statement</p></div><button type="button" disabled={!ready} onClick={() => setDownloaded(true)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-extrabold transition ${ready ? 'template-download-pop bg-emerald-600 text-white hover:bg-emerald-700' : 'cursor-not-allowed bg-slate-100 text-slate-400'}`}><Download className="h-3.5 w-3.5" />{downloaded ? 'Download simulated' : 'Download PDF'}</button></div>
        <div className={`relative mx-auto overflow-hidden rounded-lg border border-slate-200 bg-slate-100 ${compact ? 'h-[390px]' : 'h-[450px]'}`}>
          <div onAnimationEnd={handlePdfScrollComplete} className={`guided-sba-page-two template-pdf-document absolute inset-x-0 top-0 bg-white transition-opacity duration-700 ${ready ? 'template-pdf-document-submitted' : ''}`}>
            <SBAForm413SvgTemplate data={ready ? personalFinancialStatementPreviewData : blankPersonalFinancialStatementData} />
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-4 text-slate-500">Rendered with the same SBA Form 413 component used by the production template. The sequence resets after the document scroll completes.</p>
      </div>
    </div>
  );
}
