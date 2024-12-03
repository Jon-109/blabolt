"use client";

import React, { useState, useEffect } from 'react';
import { 
  DollarSign
} from 'lucide-react';

const LoanPurposeTerms = {
  'Working Capital': { 
    description: 'To cover day-to-day operational expenses, such as payroll, rent, or utilities.',
    minTerm: 6, 
    maxTerm: 36, 
    defaultTerm: 24,
    minRate: 7,
    maxRate: 28
  },
  'Equipment Purchase': { 
    description: 'To buy or upgrade machinery, tools, or technology needed for the business.',
    minTerm: 12, 
    maxTerm: 72, 
    defaultTerm: 48,
    minRate: 5,
    maxRate: 22
  },
  'Vehicle Purchase': { 
    description: 'To buy or lease vehicles for business operations, such as delivery trucks or company cars.',
    minTerm: 24, 
    maxTerm: 84, 
    defaultTerm: 60,
    minRate: 6,
    maxRate: 25
  },
  'Inventory Purchase': { 
    description: 'To buy raw materials, products, or stock to meet customer demand.',
    minTerm: 6, 
    maxTerm: 36, 
    defaultTerm: 24,
    minRate: 8,
    maxRate: 28
  },
  'Debt Refinancing': { 
    description: 'To consolidate or pay off existing business debts with better terms or lower interest rates.',
    minTerm: 12, 
    maxTerm: 60, 
    defaultTerm: 36,
    minRate: 6,
    maxRate: 24
  },
  'Real Estate Acquisition or Development': { 
    description: 'To purchase, lease, or develop property for business use, such as offices, warehouses, or retail locations.',
    minTerm: 60, 
    maxTerm: 300, 
    defaultTerm: 180,
    minRate: 4,
    maxRate: 12
  },
  'Business Acquisition': { 
    description: 'To purchase another company or acquire assets to expand operations.',
    minTerm: 36, 
    maxTerm: 120, 
    defaultTerm: 84,
    minRate: 6,
    maxRate: 22
  },
  'Unexpected Expenses': { 
    description: 'To handle emergencies or unforeseen costs, such as equipment breakdowns or legal fees.',
    minTerm: 6, 
    maxTerm: 36, 
    defaultTerm: 24,
    minRate: 9,
    maxRate: 32
  }
} as const;

type LoanPurpose = keyof typeof LoanPurposeTerms;

const getLoanAmountSteps = () => {
  const steps = [];
  
  // First segment: $10K to $100K (5K steps)
  for (let i = 10000; i <= 100000; i += 5000) {
    steps.push(i);
  }
  
  // Second segment: $100K to $500K (10K steps)
  for (let i = 100000; i <= 500000; i += 10000) {
    steps.push(i);
  }
  
  // Third segment: $500K to $1M (25K steps)
  for (let i = 500000; i <= 1000000; i += 25000) {
    steps.push(i);
  }
  
  // Fourth segment: $1M to $10M (50K steps)
  for (let i = 1000000; i <= 10000000; i += 50000) {
    steps.push(i);
  }
  
  return steps;
};

const getTickMarks = () => {
  return [
    { value: 10000, label: "$10K" },
    { value: 100000, label: "$100K" },
    { value: 500000, label: "$500K" },
    { value: 1000000, label: "$1M" },
    { value: 5000000, label: "$5M" },
    { value: 10000000, label: "$10M" },
  ];
};

const logScale = (value: number) => {
  const minValue = 10000;
  const maxValue = 10000000;
  const minLog = Math.log(minValue);
  const maxLog = Math.log(maxValue);
  
  // Convert slider position to logarithmic value
  const scale = (maxLog - minLog) / 100;
  const logValue = Math.exp(minLog + scale * value);
  
  return Math.round(logValue);
};

const reverseLogScale = (value: number) => {
  const minValue = 10000;
  const maxValue = 10000000;
  const minLog = Math.log(minValue);
  const maxLog = Math.log(maxValue);
  
  // Convert value to slider position
  return ((Math.log(value) - minLog) / (maxLog - minLog)) * 100;
};

const LoanPaymentCalculator = () => {
  const [loanPurpose, setLoanPurpose] = useState<LoanPurpose>('Working Capital');
  const [loanAmount, setLoanAmount] = useState(50000);
  const [loanAmountInput, setLoanAmountInput] = useState('50,000');
  const [interestRate, setInterestRate] = useState(10);
  const [loanTerm, setLoanTerm] = useState(24);
  const [monthlyPayment, setMonthlyPayment] = useState(0);

  useEffect(() => {
    const currentTerms = LoanPurposeTerms[loanPurpose];
    
    setLoanTerm(currentTerms.defaultTerm);
    setInterestRate(
      Number(((currentTerms.minRate + currentTerms.maxRate) / 2).toFixed(2))
    );
  }, [loanPurpose]);

  useEffect(() => {
    const monthlyInterestRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm;

    const calculatedMonthlyPayment = 
      loanAmount * 
      (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

    setMonthlyPayment(calculatedMonthlyPayment);
  }, [loanAmount, interestRate, loanTerm]);

  const loanAmountSteps = getLoanAmountSteps();
  const tickMarks = getTickMarks();

  const handleLoanAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const formattedValue = Number(value).toLocaleString();
    setLoanAmountInput(formattedValue);
    
    const numericValue = Number(value);
    if (numericValue >= 10000 && numericValue <= 10000000) {
      const closestStep = loanAmountSteps.reduce((prev, curr) => 
        Math.abs(curr - numericValue) < Math.abs(prev - numericValue) ? curr : prev
      );
      setLoanAmount(closestStep);
    }
  };

  return (
    <section id="loan-calculator" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white border border-gray-100 shadow-lg rounded-2xl p-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Business Loan Payment Calculator
            </h2>
            <p className="text-gray-600">
              Estimate your monthly payments based on loan amount, purpose, and terms.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Loan Purpose */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Loan Purpose
              </label>
              <select
                value={loanPurpose}
                onChange={(e) => setLoanPurpose(e.target.value as LoanPurpose)}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {Object.keys(LoanPurposeTerms).map((purpose) => (
                  <option key={purpose} value={purpose}>
                    {purpose}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 italic">
                {LoanPurposeTerms[loanPurpose].description}
              </p>
            </div>

            {/* Loan Amount */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Loan Amount
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loanAmountInput}
                  onChange={handleLoanAmountInputChange}
                  className="w-full px-4 py-3 pl-8 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <div className="relative mt-6 mb-8">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={reverseLogScale(loanAmount)}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    const actualValue = logScale(value);
                    const closestStep = loanAmountSteps.reduce((prev, curr) => 
                      Math.abs(curr - actualValue) < Math.abs(prev - actualValue) ? curr : prev
                    );
                    setLoanAmount(closestStep);
                    setLoanAmountInput(closestStep.toLocaleString());
                  }}
                  className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer mb-1"
                />
                {/* Tick marks container - removed mt-2 and adjusted pt-2 to pt-1 */}
                <div className="relative w-full">
                  <div className="absolute w-full flex justify-between px-1 pt-1">
                    {tickMarks.map((tick) => (
                      <div 
                        key={tick.value} 
                        className="flex flex-col items-center"
                        style={{
                          position: 'absolute',
                          left: `${((Math.log(tick.value) - Math.log(10000)) / (Math.log(10000000) - Math.log(10000))) * 100}%`,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        <div className="w-0.5 h-2 bg-gray-400"></div>
                        <span className="text-xs text-gray-600 mt-1">
                          {tick.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Payment */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-8 mt-8">
            <div className="grid grid-cols-12 gap-6 items-center">
              <div className="col-span-8 flex flex-col items-center">
                <p className="text-base font-medium text-gray-600 mb-3">
                  Estimated Monthly Payment
                </p>
                <div className="flex items-center">
                  <DollarSign className="h-10 w-10 text-blue-600 mr-3" />
                  <span className="text-5xl font-bold text-blue-900">
                    {monthlyPayment.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </span>
                </div>
              </div>
              <div className="col-span-4 space-y-4 text-right">
                <div>
                  <p className="text-sm font-medium text-gray-600">Interest Rate</p>
                  <p className="text-xl font-bold text-blue-700">{interestRate}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Loan Term</p>
                  <p className="text-xl font-bold text-blue-700">{loanTerm} Months</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 text-center mt-6">
            * This calculator provides estimates only. Actual rates and terms may vary based on credit profile, 
            business history, and lender requirements.
          </p>
        </div>
      </div>
    </section>
  );
};

export default LoanPaymentCalculator; 