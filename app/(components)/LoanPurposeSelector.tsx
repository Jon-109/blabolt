import React, { useState, useRef, useEffect } from 'react';

interface LoanPurposeSelectorProps {
  value: string;
  onChange: (purpose: string) => void;
}

const LEVEL1_OPTIONS = [
  {
    key: 'purchase',
    title: 'Purchase',
    subtext: 'Buy something for your business',
  },
  {
    key: 'refinance',
    title: 'Refinance',
    subtext: 'Replace existing business debt',
  },
  {
    key: 'working-capital',
    title: 'Working Capital',
    subtext: 'Fund day-to-day operations',
  },
];

const LEVEL2_OPTIONS: Record<string, { key: string; label: string; term: string; amortization: string; downPayment: string; interestRate: string; }[]> = {
  purchase: [
    { key: 'vehicle-purchase', label: 'Vehicle Purchase', term: '5 years', amortization: '5 years', downPayment: '15%', interestRate: '7%' },
    { key: 'equipment-purchase', label: 'Equipment Purchase', term: '7 years', amortization: '7 years', downPayment: '10%', interestRate: '8%' },
    { key: 'inventory-purchase', label: 'Inventory Purchase', term: '1 year', amortization: '1 year', downPayment: '0%', interestRate: '10%' },
    { key: 'real-estate-purchase', label: 'Real Estate Purchase', term: '25 years', amortization: '25 years', downPayment: '20%', interestRate: '5%' },
    { key: 'business-acquisition', label: 'Business Acquisition', term: '10 years', amortization: '10 years', downPayment: '20%', interestRate: '6%' },
  ],
  refinance: [
    { key: 'debt-consolidation', label: 'Debt Consolidation', term: '3 years', amortization: '3 years', downPayment: '0%', interestRate: '8%' },
    { key: 'vehicle-refinance', label: 'Vehicle Refinance', term: '5 years', amortization: '5 years', downPayment: '10%', interestRate: '7%' },
    { key: 'equipment-refinance', label: 'Equipment Refinance', term: '5 years', amortization: '5 years', downPayment: '0%', interestRate: '6%' },
    { key: 'real-estate-refinance', label: 'Real Estate Refinance', term: '25 years', amortization: '25 years', downPayment: '20%', interestRate: '5%' },
  ],
  'working-capital': [
    { key: 'working-capital-loan', label: 'Working Capital Loan', term: '1 year', amortization: '1 year', downPayment: '0%', interestRate: '9%' },
    { key: 'line-of-credit', label: 'Line of Credit', term: '1 year', amortization: '1 year', downPayment: '0%', interestRate: '10%' },
  ],
};

const LoanPurposeSelector: React.FC<LoanPurposeSelectorProps> = ({ value, onChange }) => {
  const [level1, setLevel1] = useState<string | null>(null);
  const [level2, setLevel2] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const level2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (level1 && !level2) {
      setTimeout(() => {
        level2Ref.current?.focus();
      }, 200);
    }
  }, [level1, level2]);

  useEffect(() => {
    if (level2) {
      onChange(level2);
    }
  }, [level2, onChange]);

  useEffect(() => {
    if (!value) {
      setLevel1(null);
      setLevel2(null);
    } else {
      const found = Object.entries(LEVEL2_OPTIONS).find(([cat, arr]) =>
        arr.some(opt => opt.key === value),
      );
      if (found) {
        setLevel1(found[0]);
        setLevel2(value);
      }
    }
  }, [value]);

  return (
    <div className="w-full">
      {/* Step 1: Level 1 Category Selection */}
      {!level1 && (
        <div className="flex flex-row justify-center gap-4 mt-2 mb-2">
          {LEVEL1_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              className={`flex flex-col items-center px-8 py-6 rounded-xl border border-neutral-200 bg-white shadow-sm hover:shadow-md hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150 min-w-[180px] max-w-[220px] mx-2 group
                ${level1 === opt.key ? 'ring-2 ring-blue-500 border-blue-500 shadow-md' : ''}`}
              style={{ boxShadow: '0 2px 12px 0 rgba(16,25,40,0.06)' }}
              onClick={() => {
                setAnimating(true);
                setTimeout(() => {
                  setLevel1(opt.key);
                  setAnimating(false);
                }, 180);
              }}
              aria-pressed={level1 === opt.key}
            >
              <span className="text-xl font-extrabold text-slate-900 mb-1 tracking-tight">{opt.title}</span>
              <span className="text-base text-slate-500 font-medium">{opt.subtext}</span>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Level 2 Subcategory Selection */}
      {level1 && (
        <div
          ref={level2Ref}
          tabIndex={-1}
          aria-label="Loan Purpose Subcategory Selection"
          className={`transition-all duration-500 ${
            level1
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-x-10 pointer-events-none'
          } ${animating ? 'pointer-events-none' : ''}`}
        >
          <button
            type="button"
            className="mb-4 text-blue-600 hover:underline flex items-center gap-1"
            onClick={() => setLevel1(null)}
            aria-label="Back to category selection"
          >
            ← Back
          </button>
          <div className="grid grid-cols-2 gap-2 bg-slate-100 rounded-xl p-3 border border-slate-200 max-w-xl mx-auto">
            {LEVEL2_OPTIONS[level1]?.map(opt => (
              <button
                key={opt.key}
                type="button"
                className={`flex flex-col items-center justify-center p-6 rounded-lg border border-slate-300 bg-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 min-w-[120px] h-24 text-center font-semibold text-slate-800 ${
                  level2 === opt.key ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50' : ''
                }`}
                onClick={() => setLevel2(opt.key)}
                aria-pressed={level2 === opt.key}
              >
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {level2 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-bold mb-2">Loan Details</h3>
          <p><strong>Term:</strong> {LEVEL2_OPTIONS[level1!]?.find(opt => opt.key === level2)?.term}</p>
          <p><strong>Amortization:</strong> {LEVEL2_OPTIONS[level1!]?.find(opt => opt.key === level2)?.amortization}</p>
          <p><strong>Down Payment:</strong> {LEVEL2_OPTIONS[level1!]?.find(opt => opt.key === level2)?.downPayment}</p>
          <p><strong>Interest Rate:</strong> {LEVEL2_OPTIONS[level1!]?.find(opt => opt.key === level2)?.interestRate}</p>
        </div>
      )}
    </div>
  );
};

export default LoanPurposeSelector;