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
    color: 'from-blue-100 to-blue-50',
  },
  {
    key: 'refinance',
    title: 'Refinance',
    subtext: 'Replace existing business debt',
    color: 'from-green-100 to-green-50',
  },
  {
    key: 'working-capital',
    title: 'Working Capital',
    subtext: 'Fund day-to-day operations',
    color: 'from-purple-100 to-purple-50',
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
    { key: 'mortgage-refinance', label: 'Mortgage Refinance', term: '30 years', amortization: '30 years', downPayment: '0%', interestRate: '4%' },
    { key: 'equipment-refinance', label: 'Equipment Refinance', term: '5 years', amortization: '5 years', downPayment: '0%', interestRate: '6%' },
    { key: 'working-capital-refinance', label: 'Working Capital Refinance', term: '2 years', amortization: '2 years', downPayment: '0%', interestRate: '9%' },
  ],
  'working-capital': [
    { key: 'payroll', label: 'Payroll', term: '6 months', amortization: '6 months', downPayment: '0%', interestRate: '9%' },
    { key: 'marketing', label: 'Marketing', term: '1 year', amortization: '1 year', downPayment: '0%', interestRate: '10%' },
    { key: 'expansion', label: 'Expansion', term: '2 years', amortization: '2 years', downPayment: '10%', interestRate: '11%' },
    { key: 'inventory', label: 'Inventory', term: '1 year', amortization: '1 year', downPayment: '5%', interestRate: '10%' },
    { key: 'other-working-capital', label: 'Other Working Capital', term: '1 year', amortization: '1 year', downPayment: '0%', interestRate: '12%' },
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {LEVEL1_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              className={`flex flex-col items-center p-8 rounded-2xl border border-slate-200 bg-gradient-to-b ${opt.color} shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 min-w-[180px] mx-auto group`}
              onClick={() => {
                setAnimating(true);
                setTimeout(() => {
                  setLevel1(opt.key);
                  setAnimating(false);
                }, 250);
              }}
              aria-pressed={level1 === opt.key}
            >
              <span className="text-lg font-bold mb-1 text-slate-800">{opt.title}</span>
              <span className="text-sm text-slate-500">{opt.subtext}</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {LEVEL2_OPTIONS[level1]?.map(opt => (
              <button
                key={opt.key}
                type="button"
                className={`flex flex-col items-center p-6 rounded-2xl border border-slate-200 bg-white shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 min-w-[160px] mx-auto group ${
                  level2 === opt.key ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50' : ''
                }`}
                onClick={() => setLevel2(opt.key)}
                aria-pressed={level2 === opt.key}
              >
                <span className="text-base font-semibold text-slate-800 mb-1">{opt.label}</span>
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