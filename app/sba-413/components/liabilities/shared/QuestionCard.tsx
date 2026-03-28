'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';

interface QuestionCardProps {
  icon: string;
  title: string;
  description: string;
  examples: string;
  children: React.ReactNode;
  onAnswerChange?: (hasDebt: boolean) => void;
}

export default function QuestionCard({ 
  icon, 
  title, 
  description, 
  examples, 
  children,
  onAnswerChange 
}: QuestionCardProps) {
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAnswer = (value: boolean) => {
    setAnswer(value);
    setIsExpanded(value);
    onAnswerChange?.(value);
  };

  return (
    <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Question Header */}
      <div className="p-5 bg-gradient-to-r from-slate-50 to-slate-100">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl flex-shrink-0">{icon}</span>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-sm text-slate-700 leading-relaxed mb-2">{description}</p>
            <p className="text-xs text-slate-600 italic">
              <strong>Examples:</strong> {examples}
            </p>
          </div>
        </div>

        {/* Yes/No Buttons */}
        <div className="flex gap-3 mt-4">
          <Button
            onClick={() => handleAnswer(true)}
            variant={answer === true ? 'default' : 'outline'}
            className={`flex-1 font-bold ${
              answer === true
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'border-2 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50'
            }`}
          >
            ✅ Yes, I have this
          </Button>
          <Button
            onClick={() => handleAnswer(false)}
            variant={answer === false ? 'default' : 'outline'}
            className={`flex-1 font-bold ${
              answer === false
                ? 'bg-slate-600 hover:bg-slate-700 text-white'
                : 'border-2 border-slate-300 hover:border-slate-500 hover:bg-slate-50'
            }`}
          >
            ❌ No, I don't
          </Button>
        </div>
      </div>

      {/* Details Section (shown when Yes) */}
      {answer === true && (
        <div className="p-5 border-t-2 border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Enter Details
            </h4>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {isExpanded && (
            <div className="space-y-4">
              {children}
            </div>
          )}
        </div>
      )}

      {/* No Debt Message */}
      {answer === false && (
        <div className="p-4 border-t-2 border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-600 text-center">
            ✓ Got it! Moving on to the next question.
          </p>
        </div>
      )}
    </div>
  );
}
