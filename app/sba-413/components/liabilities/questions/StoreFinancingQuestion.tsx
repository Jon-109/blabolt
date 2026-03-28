'use client';

import { LiabilitiesData } from '../../../types';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';
import { Plus, X } from 'lucide-react';
import QuestionCard from '../shared/QuestionCard';
import CurrencyInput from '../../shared/CurrencyInput';
import { generateId } from '../../../utils/calculations';

interface StoreFinancingQuestionProps {
  data: LiabilitiesData;
  onChange: (data: LiabilitiesData) => void;
  onAnswerChange?: (hasDebt: boolean) => void;
}

export default function StoreFinancingQuestion({ data, onChange, onAnswerChange }: StoreFinancingQuestionProps) {
  const addAccount = () => {
    onChange({
      ...data,
      installments_other: [
        ...data.installments_other,
        {
          id: generateId(),
          lender: '',
          balance: 0,
          monthly_payment: 0,
          status: 'current',
        },
      ],
    });
  };

  const removeAccount = (id: string) => {
    onChange({
      ...data,
      installments_other: data.installments_other.filter((acc) => acc.id !== id),
    });
  };

  const updateAccount = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      installments_other: data.installments_other.map((acc) =>
        acc.id === id ? { ...acc, [field]: value } : acc
      ),
    });
  };

  const totalBalance = data.installments_other.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  return (
    <QuestionCard
      icon="🛍️"
      title="Do you owe money on any store financing or buy-now-pay-later plans?"
      description="These are fixed monthly payment plans that aren't traditional credit cards."
      examples="Affirm, Afterpay, Klarna, or furniture/appliance payment plans."
      onAnswerChange={onAnswerChange}
    >
      {/* Store Financing Entries */}
      {data.installments_other.length === 0 ? (
        <div className="text-center py-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
          <p className="text-slate-600 mb-3">No store financing added yet</p>
          <Button onClick={addAccount} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Store Financing
          </Button>
        </div>
      ) : (
        <>
          {data.installments_other.map((account, index) => (
            <div key={account.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-bold text-slate-900">Account #{index + 1}</h5>
                <button
                  onClick={() => removeAccount(account.id)}
                  className="text-red-600 hover:text-red-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Store/Service *</Label>
                  <Input
                    placeholder="e.g., Affirm, Best Buy"
                    value={account.lender}
                    onChange={(e) => updateAccount(account.id, 'lender', e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Total Balance Owed *</Label>
                  <CurrencyInput
                    value={account.balance}
                    onChange={(val) => updateAccount(account.id, 'balance', val || 0)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Monthly Payment *</Label>
                  <CurrencyInput
                    value={account.monthly_payment}
                    onChange={(val) => updateAccount(account.id, 'monthly_payment', val || 0)}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
            <span className="font-bold text-slate-900">Total Store Financing Debt</span>
            <span className="text-xl font-bold text-orange-600">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          <Button onClick={addAccount} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Account
          </Button>
        </>
      )}
    </QuestionCard>
  );
}
