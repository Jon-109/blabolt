'use client';

import { useState } from 'react';
import { LiabilitiesData, SmartGateFlags, AssetsData } from '../types';
import { Button } from '@/app/(components)/ui/button';
import { ChevronRight, CheckCircle2, Circle } from 'lucide-react';

// Import new question components
import CreditCardsQuestion from './liabilities/questions/CreditCardsQuestion';
import StudentLoansQuestion from './liabilities/questions/StudentLoansQuestion';
import PersonalLoansQuestion from './liabilities/questions/PersonalLoansQuestion';
import StoreFinancingQuestion from './liabilities/questions/StoreFinancingQuestion';
import TaxesOwedQuestion from './liabilities/questions/TaxesOwedQuestion';
import OtherDebtsQuestion from './liabilities/questions/OtherDebtsQuestion';

// Import auto-pull summary components
import AutoLoansSummary from './liabilities/auto-pull/AutoLoansSummary';
import MortgagesSummary from './liabilities/auto-pull/MortgagesSummary';
import PolicyLoansSummary from './liabilities/auto-pull/PolicyLoansSummary';

interface LiabilitiesPageProps {
  data: LiabilitiesData;
  assets: AssetsData;
  smartGate: SmartGateFlags;
  onChange: (data: LiabilitiesData) => void;
  onNext: () => void;
}

export default function LiabilitiesPageNew({ data, assets, smartGate, onChange, onNext }: LiabilitiesPageProps) {
  // Track which questions have been answered
  const [answers, setAnswers] = useState({
    creditCards: false,
    studentLoans: false,
    personalLoans: false,
    storeFinancing: false,
    taxesOwed: false,
    otherDebts: false,
  });

  const handleAnswerChange = (question: keyof typeof answers, value: boolean) => {
    setAnswers(prev => ({ ...prev, [question]: value }));
  };

  // Calculate auto-pulled debts
  const autoLoans = assets.autos.filter(auto => auto.financed && auto.loan_balance);
  const mortgages = assets.real_estate.filter(prop => prop.status !== 'paid_off' && prop.mortgage_balance);
  const policyLoans = assets.life_policies.filter(policy => policy.loan_outstanding && policy.loan_balance);

  const hasAutoPulledDebts = autoLoans.length > 0 || mortgages.length > 0 || policyLoans.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
          Your Debts & Obligations
        </h2>
        <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
          Let's go through what you owe. We'll ask simple yes/no questions—no financial jargon, just real talk.
        </p>
      </div>

      {/* Auto-Pulled Debts Section (if any) */}
      {hasAutoPulledDebts && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-emerald-900 mb-1">
                ✅ Already Captured from Your Assets
              </h3>
              <p className="text-sm text-emerald-800">
                We automatically pulled these debts from the assets you entered. No need to enter them again!
              </p>
            </div>
          </div>

          <div className="space-y-4 mt-4">
            {autoLoans.length > 0 && <AutoLoansSummary autos={autoLoans} />}
            {mortgages.length > 0 && <MortgagesSummary properties={mortgages} />}
            {policyLoans.length > 0 && <PolicyLoansSummary policies={policyLoans} />}
          </div>
        </div>
      )}

      {/* Question Flow */}
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-2">
          <h3 className="text-xl font-bold text-slate-900">
            📋 Answer These Quick Questions
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            For each, just tell us if you have it. If yes, we'll ask for a few details.
          </p>
        </div>

        {/* Question 1: Credit Cards */}
        <CreditCardsQuestion 
          data={data} 
          onChange={onChange}
          onAnswerChange={(value) => handleAnswerChange('creditCards', value)}
        />

        {/* Question 2: Student Loans */}
        <StudentLoansQuestion 
          data={data} 
          onChange={onChange}
          onAnswerChange={(value) => handleAnswerChange('studentLoans', value)}
        />

        {/* Question 3: Personal/Family Loans */}
        <PersonalLoansQuestion 
          data={data} 
          onChange={onChange}
          onAnswerChange={(value) => handleAnswerChange('personalLoans', value)}
        />

        {/* Question 4: Store Financing */}
        <StoreFinancingQuestion 
          data={data} 
          onChange={onChange}
          onAnswerChange={(value) => handleAnswerChange('storeFinancing', value)}
        />

        {/* Question 5: Taxes Owed */}
        <TaxesOwedQuestion 
          data={data} 
          onChange={onChange}
          onAnswerChange={(value) => handleAnswerChange('taxesOwed', value)}
        />

        {/* Question 6: Other Debts */}
        <OtherDebtsQuestion 
          data={data} 
          onChange={onChange}
          onAnswerChange={(value) => handleAnswerChange('otherDebts', value)}
        />
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          size="lg"
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-bold text-base px-8"
        >
          Continue to Income
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
