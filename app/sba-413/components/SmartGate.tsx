'use client';

import { useState } from 'react';
import { SmartGateFlags } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/(components)/ui/card';
import { Button } from '@/app/(components)/ui/button';
import { CheckCircle2, Circle, ArrowRight, Sparkles } from 'lucide-react';

interface SmartGateProps {
  onComplete: (flags: SmartGateFlags) => void;
  initialFlags?: SmartGateFlags;
}

interface Question {
  id: keyof SmartGateFlags;
  question: string;
  helper?: string;
  recommended?: boolean;
}

const questions: Question[] = [
  {
    id: 'is_sba',
    question: 'Is this for an SBA loan?',
    helper: '7(a), 504, or other SBA program'
  },
  {
    id: 'include_spouse',
    question: "Include your spouse's information?",
    helper: 'Recommended for SBA loans',
    recommended: true
  },
  {
    id: 'has_real_estate',
    question: 'Do you own any real estate?',
    helper: 'Home, rental properties, or land'
  },
  {
    id: 'has_securities',
    question: 'Do you have stocks, bonds, or ETFs?',
    helper: 'In a brokerage account like Robinhood, Fidelity, Schwab'
  },
  {
    id: 'has_retirement',
    question: 'Do you have retirement accounts?',
    helper: '401(k), IRA, SEP, Roth IRA, etc.'
  },
  {
    id: 'has_life_csv',
    question: 'Do you have life insurance that builds savings?',
    helper: 'Whole life or universal life (not term life)'
  },
  {
    id: 'owns_business',
    question: 'Do you own part of any business?',
    helper: 'LLC, S-corp, partnership, or 10%+ ownership'
  },
  {
    id: 'has_personal_guarantees',
    question: 'Have you personally guaranteed a business loan or lease?',
    helper: 'You promised to repay if the business cannot'
  },
  {
    id: 'has_vehicles',
    question: 'Do you own vehicles, boats, RVs, or equipment personally?',
    helper: 'Not business-owned assets'
  },
  {
    id: 'has_legal',
    question: 'Any lawsuits, judgments, or past bankruptcy to disclose?',
    helper: 'Active or within the last 7-10 years'
  },
  {
    id: 'has_crypto',
    question: 'Do you hold cryptocurrency or other digital assets?',
    helper: 'Bitcoin, Ethereum, NFTs, etc.'
  }
];

export default function SmartGate({ onComplete, initialFlags }: SmartGateProps) {
  const [flags, setFlags] = useState<SmartGateFlags>(
    initialFlags || {
      is_sba: false,
      include_spouse: false,
      has_real_estate: false,
      has_securities: false,
      has_retirement: false,
      has_life_csv: false,
      owns_business: false,
      has_personal_guarantees: false,
      has_vehicles: false,
      has_personal_debt: false,
      owes_taxes: false,
      has_legal: false,
      has_crypto: false,
    }
  );

  const handleToggle = (id: keyof SmartGateFlags, value: boolean) => {
    setFlags({ ...flags, [id]: value });
  };

  const handleContinue = () => {
    onComplete(flags);
  };

  const yesCount = Object.values(flags).filter(Boolean).length;
  const allAnswered = questions.every(q => flags[q.id] !== undefined);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-zinc-50 to-slate-100 py-8 sm:py-12 lg:py-16 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">
            Quick Setup
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto">
            Answer these questions so we only show what's relevant to you. We'll skip sections you don't need.
          </p>
        </div>

        {/* All Questions Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {questions.map((q) => {
            const isSelected = flags[q.id];
            const isAnswered = flags[q.id] !== undefined;
            
            return (
              <div
                key={q.id}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  isAnswered
                    ? isSelected
                      ? 'border-emerald-500 bg-emerald-50/50'
                      : 'border-slate-300 bg-slate-50/50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-900 leading-tight mb-1">
                    {q.question}
                  </h3>
                  {q.helper && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {q.helper}
                    </p>
                  )}
                  {q.recommended && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-semibold">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Recommended
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(q.id, true)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => handleToggle(q.id, false)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      isSelected === false
                        ? 'bg-slate-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary & Continue */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{yesCount} section{yesCount !== 1 ? 's' : ''} selected</span>
            </div>
          </div>

          <Button
            onClick={handleContinue}
            size="lg"
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-bold px-8"
          >
            Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Quick Skip Option */}
        <div className="text-center">
          <Button
            onClick={() => {
              const allYes: SmartGateFlags = {
                is_sba: true,
                include_spouse: false,
                has_real_estate: true,
                has_securities: true,
                has_retirement: true,
                has_life_csv: true,
                owns_business: true,
                has_personal_guarantees: true,
                has_vehicles: true,
                has_personal_debt: true,
                owes_taxes: true,
                has_legal: false,
                has_crypto: true,
              };
              onComplete(allYes);
            }}
            variant="link"
            className="text-slate-500 hover:text-slate-700 font-medium underline-offset-4"
          >
            Skip and show me everything →
          </Button>
        </div>
      </div>
    </div>
  );
}
