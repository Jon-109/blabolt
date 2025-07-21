import React, { useState, useRef, useEffect } from 'react';

interface LoanPurposeSelectorProps {
  value: string;
  onChange: (purpose: string) => void;
  disabled?: boolean;
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

export const LEVEL2_OPTIONS: Record<string, { key: string; label: string; description: string; term: string; amortization: string; downPayment: string; interestRate: string; }[]> = {
  purchase: [
    { key: 'vehicle-purchase', label: 'Vehicle Purchase', description: 'Buying a car, truck, or commercial vehicle to support or expand your business operations.', term: '5 years', amortization: '5 years', downPayment: '15%', interestRate: '7%' },
    { key: 'equipment-purchase', label: 'Equipment Purchase', description: 'Acquiring tools, machinery, or technology essential for your business to operate or grow.', term: '7 years', amortization: '7 years', downPayment: '10%', interestRate: '8%' },
    { key: 'inventory-purchase', label: 'Inventory Purchase', description: 'Purchasing products or materials to stock up for sales, seasonal demand, or bulk inventory needs.', term: '1 year', amortization: '1 year', downPayment: '0%', interestRate: '10%' },
    { key: 'real-estate-purchase', label: 'Real Estate Purchase', description: 'Buying a commercial property, office space, or land for your business.', term: '25 years', amortization: '25 years', downPayment: '20%', interestRate: '5%' },
    { key: 'business-acquisition', label: 'Business Acquisition', description: 'Purchasing an existing business or buying out a business partner.', term: '10 years', amortization: '10 years', downPayment: '20%', interestRate: '6%' },
  ],
  refinance: [
    { key: 'debt-consolidation', label: 'Debt Consolidation', description: 'Combining multiple business debts into a single loan with better terms and one monthly payment.', term: '3 years', amortization: '3 years', downPayment: '0%', interestRate: '8%' },
    { key: 'vehicle-refinance', label: 'Vehicle Refinance', description: 'Replacing your current business vehicle loan with a new one—typically to lower interest rates or monthly payments.', term: '5 years', amortization: '5 years', downPayment: '10%', interestRate: '7%' },
    { key: 'equipment-refinance', label: 'Equipment Refinance', description: 'Refinancing existing equipment loans to improve cash flow or obtain better repayment terms.', term: '5 years', amortization: '5 years', downPayment: '0%', interestRate: '6%' },
    { key: 'real-estate-refinance', label: 'Real Estate Refinance', description: 'Refinancing a commercial property loan to reduce payments, secure a fixed rate, or access equity.', term: '25 years', amortization: '25 years', downPayment: '20%', interestRate: '5%' },
  ],
  'working-capital': [
    { key: 'working-capital-loan', label: 'Working Capital Loan', description: 'Short-term funding to cover daily business expenses like payroll, rent, or utilities—ideal for managing cash flow.', term: '1 year', amortization: '1 year', downPayment: '0%', interestRate: '9%' },
    { key: 'line-of-credit', label: 'Line of Credit', description: 'Flexible access to funds you can draw from as needed to manage expenses or seize business opportunities.', term: '1 year', amortization: '1 year', downPayment: '0%', interestRate: '10%' },
  ],
};

const LoanPurposeSelector: React.FC<LoanPurposeSelectorProps> = ({ value, onChange, disabled }) => {
  const [level1, setLevel1] = useState<string | null>(null);
  const [level2, setLevel2] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const level2Ref = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);
  
  // Debug logging for prop and state changes
  useEffect(() => {
    console.log('[LoanPurposeSelector] value prop changed to:', value, 'at', new Date().toISOString());
  }, [value]);
  
  useEffect(() => {
    console.log('[LoanPurposeSelector] level1 state changed to:', level1, 'at', new Date().toISOString());
  }, [level1]);
  
  useEffect(() => {
    console.log('[LoanPurposeSelector] level2 state changed to:', level2, 'at', new Date().toISOString());
  }, [level2]);

  useEffect(() => {
    if (level1 && !level2) {
      setTimeout(() => {
        level2Ref.current?.focus();
      }, 200);
    }
  }, [level1, level2]);

  useEffect(() => {
    if (syncingRef.current) {
      console.log('[LoanPurposeSelector] Skipping onChange - currently syncing');
      return; // Don't call onChange during sync
    }
    
    // Only call onChange if level2 has a value and it's different from the current value
    // AND we're not just reflecting what the parent already knows
    if (level2 && level2 !== value) {
      console.log('[LoanPurposeSelector] Calling onChange with level2:', level2);
      onChange(level2);
    } else if (level1 === null && level2 === null && value !== '') {
      // Only clear when both levels are null and value is not empty
      console.log('[LoanPurposeSelector] Calling onChange to clear value');
      onChange('');
    }
    // This effect should NOT run when only level1 changes.
  }, [level2, onChange, value]);

  // Always sync internal state with value prop (even if already set)
  useEffect(() => {
    // Prevent sync if we're already in the correct state
    if (value) {
      const found = Object.entries(LEVEL2_OPTIONS).find(([_, arr]) =>
        arr.some(opt => opt.key === value)
      );
      if (found) {
        // Only sync if state is actually different
        if (level1 !== found[0] || level2 !== value) {
          console.log('[LoanPurposeSelector] Syncing state - level1:', found[0], 'level2:', value);
          syncingRef.current = true;
          if (level1 !== found[0]) setLevel1(found[0]);
          if (level2 !== value) setLevel2(value);
          // Keep sync flag active for a bit longer to prevent onChange during sync
          setTimeout(() => {
            syncingRef.current = false;
          }, 10);
        }
      } else {
        // Invalid value - clear state if needed
        if (level1 !== null || level2 !== null) {
          syncingRef.current = true;
          if (level1 !== null) setLevel1(null);
          if (level2 !== null) setLevel2(null);
          syncingRef.current = false;
        }
      }
    } else {
      // Empty value - clear state if needed
      if (level1 !== null || level2 !== null) {
        syncingRef.current = true;
        if (level1 !== null) setLevel1(null);
        if (level2 !== null) setLevel2(null);
        syncingRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              disabled={disabled}
              className={`flex flex-col items-center px-8 py-6 rounded-xl border border-neutral-200 bg-white shadow-sm hover:shadow-md hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150 min-w-[180px] max-w-[220px] mx-2 group
                ${level1 === opt.key ? 'ring-2 ring-blue-500 border-blue-500 shadow-md' : ''}`}
              style={{ boxShadow: '0 2px 12px 0 rgba(16,25,40,0.06)' }}
              onClick={() => {
                setAnimating(true);
                setLevel2(null); // Defensively clear L2 state on L1 click
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
      {/* Collapsed summary once a loan purpose is selected */}
      {level2 && (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4" aria-label="Selected Loan Purpose">
          <div>
            <span className="font-semibold text-slate-900">{(level1 ? LEVEL2_OPTIONS[level1]?.find(o => o.key === level2)?.label : '')}</span>
          </div>
          <button
            type="button"
            className="text-blue-600 hover:underline text-sm font-medium"
            onClick={() => {
              setLevel1(null);
              setLevel2(null);
              onChange(''); // Notify parent to clear the value
            }}
            disabled={disabled}
          >
            Change
          </button>
        </div>
      )}

      {/* Show level2 list if a category is chosen and no specific purpose selected */}
      {level1 && !level2 && (
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
            disabled={disabled}
            aria-label="Back to category selection"
          >
            ← Back
          </button>
          <div className="flex flex-col divide-y divide-slate-200 bg-white rounded-xl border border-slate-200 w-full">
            {LEVEL2_OPTIONS[level1]?.map(opt => (
              <button
                key={opt.key}
                type="button"
                className={`flex flex-col text-left w-full px-4 py-3 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  level2 === opt.key ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50' : ''
                }`}
                onClick={() => setLevel2(opt.key)}
                disabled={disabled}
                aria-pressed={level2 === opt.key}
              >
                <span className="font-semibold text-slate-900 text-base">{opt.label}</span>
                <span className="text-sm text-slate-600 mt-0.5">{opt.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      

      
    </div>
  );
};

export default LoanPurposeSelector;