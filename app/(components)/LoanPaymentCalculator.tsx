'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { loanPurposes } from '@/lib/loanPurposes';

type Variant = 'default' | 'compact';

const variantStyles = {
  default: 'max-w-3xl mx-auto bg-gradient-to-b from-white via-white to-blue-50 p-8 md:p-12 rounded-3xl shadow-2xl border-2 border-blue-100',
  compact: 'max-w-2xl mx-auto bg-gradient-to-b from-white via-white to-blue-50 p-6 md:p-8 rounded-3xl shadow-2xl border-2 border-blue-100'
};

// Use keys from loanPurposes plus any extras
const LOAN_PURPOSES = [
  ...Object.keys(loanPurposes),
  'Business Expansion',
  'Real Estate',
  'Startup Costs',
  'Other'
] as const;

type LoanPurpose = typeof LOAN_PURPOSES[number];

type LoanPaymentCalculatorProps = {
  variant?: Variant;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'className'>;

const LoanPaymentCalculator = React.forwardRef<HTMLDivElement, LoanPaymentCalculatorProps>(
  function LoanPaymentCalculator({ variant = 'default', className, ...props }, ref) {
    const [loanAmount, setLoanAmount] = useState<string | undefined>(undefined);
    const [loanPurpose, setLoanPurpose] = useState<LoanPurpose>(LOAN_PURPOSES[0]);
    const [monthlyPayment, setMonthlyPayment] = useState<number | null>(null);

    // Dynamically get term and rate from loanPurposes
    const selectedPurposeData = loanPurposes[loanPurpose as keyof typeof loanPurposes];
    const loanTerm = selectedPurposeData?.defaultTerm ?? 120; // fallback 10 years
    const interestRate = selectedPurposeData?.defaultRate ? selectedPurposeData.defaultRate * 100 : 7.5; // fallback 7.5%
    const calculateMonthlyPayment = React.useCallback(() => {
      if (!loanAmount) {
        setMonthlyPayment(null);
        return;
      }
      
      const principal = parseFloat(loanAmount.replace(/[$,]/g, ''));
      const rate = interestRate / 100 / 12;
      const term = loanTerm;

      if (!isNaN(principal) && principal > 0) {
        const payment = (principal * rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
        setMonthlyPayment(Math.round(payment));
      } else {
        setMonthlyPayment(null);
      }
    }, [loanAmount, interestRate, loanTerm]);

    useEffect(() => {
      calculateMonthlyPayment();
    }, [calculateMonthlyPayment]);

    const handleLoanAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/[^0-9]/g, '');
      if (!value) {
        setLoanAmount(undefined);
        return;
      }

      // Limit to reasonable loan amounts (up to $100M)
      const numValue = Math.min(parseInt(value), 100000000);
      const formattedValue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(numValue);
      setLoanAmount(formattedValue);
    };

    return (
      <div
        ref={ref}
        className={cn(
          variantStyles[variant],
          'pb-12',
          className
        )}
        {...props}
      >
        {/* Header */}
        <div className="text-center mb-2">
          <h2 className="text-2xl font-bold text-blue-900 mb-1">
            Loan Payment Calculator
          </h2>
          <p className="text-base text-blue-800 mb-0">
            Understand how much a loan could cost you monthly before moving forward with funding.
          </p>
          <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto rounded-full"/>
        </div>

        <div className="grid gap-4">
          {/* Input Section */}
          <div className="space-y-4 bg-white p-4 rounded-2xl border border-blue-100 shadow-sm">
            {/* Loan Purpose Selection */}
            <div>
              <label htmlFor="loanPurpose" className="block text-sm font-semibold text-gray-700 mb-2">
                Loan Purpose
              </label>
              <div className="relative">
                <select
                  id="loanPurpose"
                  name="loanPurpose"
                  value={loanPurpose}
                  onChange={(e) => setLoanPurpose(e.target.value as LoanPurpose)}
                  className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base bg-white pr-10 transition-colors hover:border-blue-300"
                >
                  {LOAN_PURPOSES.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Loan Amount Input */}
            <div>
              <label htmlFor="loanAmount" className="block text-sm font-semibold text-gray-700 mb-2">
                Loan Amount
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="loanAmount"
                  id="loanAmount"
                  value={loanAmount ?? ''}
                  onChange={handleLoanAmountChange}
                  className="block w-full rounded-xl border-gray-300 pl-3 pr-12 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg transition-colors hover:border-blue-300"
                  placeholder="$100,000"
                  aria-label="Loan amount in USD"
                  aria-describedby="loan-amount-description"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 sm:text-sm" id="loan-amount-description">USD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Display */}
          {monthlyPayment !== null && loanAmount && (
            <div className="space-y-6">
              {/* Monthly Payment Box */}
              <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-3 text-white shadow-xl overflow-hidden text-center">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500 rounded-full opacity-20 transform translate-x-20 -translate-y-20" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500 rounded-full opacity-20 transform -translate-x-16 translate-y-16" />
                
                {/* Content */}
                <div className="relative">
                  <h4 className="text-lg font-medium text-blue-100 mb-2">Monthly Payment</h4>
                  <p className="text-4xl font-bold tracking-tight mb-3">
                    ${monthlyPayment.toLocaleString()}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-blue-400/30 pt-2 max-w-md mx-auto">
                    <div>
                      <p className="text-blue-200 mb-1">Interest Rate</p>
                      <p className="font-semibold text-white text-lg">{Number(interestRate.toFixed(2)).toLocaleString()}%</p>
                    </div>
                    <div>
                      <p className="text-blue-200 mb-1">Term Length</p>
                      <p className="font-semibold text-white text-lg">
                        {loanTerm >= 12 ? `${loanTerm / 12} Years` : `${loanTerm} Months`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-blue-100 opacity-80">
                    These are estimated values for the selected loan purpose.
                  </div>
                </div>
              </div>

              {/* Cash Flow Analysis CTA */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4">
                <div className="flex flex-col items-center text-center">
                  <h4 className="text-lg font-semibold text-green-800 mb-2">Can Your Business Support This Payment?</h4>
                  <p className="text-green-700 mb-6 max-w-lg">
                    Banks use the critical Debt Service Coverage Ratio (DSCR) to determine if your business can comfortably afford this payment. Our free cash flow analysis will calculate your DSCR and show exactly how strong your position is.
                  </p>
                  <Link 
                    href="/cash-flow-analysis"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform hover:scale-105 shadow-md"
                  >
                    Calculate Your DSCR Now →
                  </Link>
                  <p className="mt-4 text-sm text-green-600 font-medium">
                    Most banks require a DSCR of at least 1.25 to approve financing
                  </p>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center mt-4">
            *This is an estimate based on typical SBA loan terms. Actual rates and terms may vary based on creditworthiness and other factors.
          </p>
        </div>
      </div>
    );
  }
);

export default LoanPaymentCalculator;
