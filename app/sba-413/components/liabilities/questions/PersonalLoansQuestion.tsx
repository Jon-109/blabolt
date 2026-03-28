'use client';

import { LiabilitiesData } from '../../../types';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';
import { Plus, X } from 'lucide-react';
import QuestionCard from '../shared/QuestionCard';
import CurrencyInput from '../../shared/CurrencyInput';
import { generateId } from '../../../utils/calculations';

interface PersonalLoansQuestionProps {
  data: LiabilitiesData;
  onChange: (data: LiabilitiesData) => void;
  onAnswerChange?: (hasDebt: boolean) => void;
}

export default function PersonalLoansQuestion({ data, onChange, onAnswerChange }: PersonalLoansQuestionProps) {
  // Filter for non-student loans only
  const personalLoans = data.notes_loans.filter(loan => !loan.is_student_loan);

  const addLoan = () => {
    onChange({
      ...data,
      notes_loans: [
        ...data.notes_loans,
        {
          id: generateId(),
          lender_name: '',
          lender_address: '',
          original_amount: 0,
          current_balance: 0,
          payment_amount: 0,
          payment_frequency: 'monthly',
          secured: false,
          maturity_date: '',
          status: 'current',
          is_student_loan: false,
        },
      ],
    });
  };

  const removeLoan = (id: string) => {
    onChange({
      ...data,
      notes_loans: data.notes_loans.filter((loan) => loan.id !== id),
    });
  };

  const updateLoan = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      notes_loans: data.notes_loans.map((loan) =>
        loan.id === id ? { ...loan, [field]: value } : loan
      ),
    });
  };

  const totalBalance = personalLoans.reduce((sum, loan) => sum + (loan.current_balance || 0), 0);

  return (
    <QuestionCard
      icon="🏦"
      title="Do you have any personal loans or money you borrowed that you're repaying over time?"
      description="These are formal or informal loans with regular payments — usually over more than 90 days."
      examples="Personal loan from a bank, loan from a family member, or a small business loan you personally guaranteed."
      onAnswerChange={onAnswerChange}
    >
      {/* Personal Loan Entries */}
      {personalLoans.length === 0 ? (
        <div className="text-center py-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
          <p className="text-slate-600 mb-3">No personal loans added yet</p>
          <Button onClick={addLoan} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Personal Loan
          </Button>
        </div>
      ) : (
        <>
          {personalLoans.map((loan, index) => (
            <div key={loan.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-bold text-slate-900">Loan #{index + 1}</h5>
                <button
                  onClick={() => removeLoan(loan.id)}
                  className="text-red-600 hover:text-red-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Who You Owe *</Label>
                  <Input
                    placeholder="e.g., Wells Fargo, Uncle Bob"
                    value={loan.lender_name}
                    onChange={(e) => updateLoan(loan.id, 'lender_name', e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Current Balance *</Label>
                  <CurrencyInput
                    value={loan.current_balance}
                    onChange={(val) => updateLoan(loan.id, 'current_balance', val || 0)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Monthly Payment *</Label>
                  <CurrencyInput
                    value={loan.payment_amount}
                    onChange={(val) => updateLoan(loan.id, 'payment_amount', val || 0)}
                    placeholder="$0"
                    className="mt-2 text-right"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg">
            <span className="font-bold text-slate-900">Total Personal Loan Debt</span>
            <span className="text-xl font-bold text-purple-600">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          <Button onClick={addLoan} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Loan
          </Button>
        </>
      )}
    </QuestionCard>
  );
}
