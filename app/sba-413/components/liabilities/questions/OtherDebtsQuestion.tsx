'use client';

import { LiabilitiesData } from '../../../types';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';
import { Plus, X } from 'lucide-react';
import QuestionCard from '../shared/QuestionCard';
import CurrencyInput from '../../shared/CurrencyInput';
import { generateId } from '../../../utils/calculations';

interface OtherDebtsQuestionProps {
  data: LiabilitiesData;
  onChange: (data: LiabilitiesData) => void;
  onAnswerChange?: (hasDebt: boolean) => void;
}

export default function OtherDebtsQuestion({ data, onChange, onAnswerChange }: OtherDebtsQuestionProps) {
  const addDebt = () => {
    onChange({
      ...data,
      other_liabilities: [
        ...data.other_liabilities,
        {
          id: generateId(),
          description: '',
          to_whom: '',
          amount: 0,
          terms: '',
        },
      ],
    });
  };

  const removeDebt = (id: string) => {
    onChange({
      ...data,
      other_liabilities: data.other_liabilities.filter((debt) => debt.id !== id),
    });
  };

  const updateDebt = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      other_liabilities: data.other_liabilities.map((debt) =>
        debt.id === id ? { ...debt, [field]: value } : debt
      ),
    });
  };

  const totalAmount = data.other_liabilities.reduce((sum, debt) => sum + (debt.amount || 0), 0);

  return (
    <QuestionCard
      icon="⚖️"
      title="Do you have any other personal debts or obligations not listed above?"
      description="These can be legal or personal obligations that you're required to pay."
      examples="Child support, alimony, legal judgments, settlements, or medical payment plans."
      onAnswerChange={onAnswerChange}
    >
      {/* Other Debt Entries */}
      {data.other_liabilities.length === 0 ? (
        <div className="text-center py-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
          <p className="text-slate-600 mb-3">No other debts added yet</p>
          <Button onClick={addDebt} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Other Debt
          </Button>
        </div>
      ) : (
        <>
          {data.other_liabilities.map((debt, index) => (
            <div key={debt.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-bold text-slate-900">Debt #{index + 1}</h5>
                <button
                  onClick={() => removeDebt(debt.id)}
                  className="text-red-600 hover:text-red-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Description *</Label>
                  <Input
                    placeholder="e.g., Child support, Medical bills"
                    value={debt.description}
                    onChange={(e) => updateDebt(debt.id, 'description', e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>To Whom *</Label>
                  <Input
                    placeholder="e.g., Ex-spouse, Hospital"
                    value={debt.to_whom}
                    onChange={(e) => updateDebt(debt.id, 'to_whom', e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Balance Owed *</Label>
                  <CurrencyInput
                    value={debt.amount}
                    onChange={(val) => updateDebt(debt.id, 'amount', val || 0)}
                    className="mt-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Monthly Payment</Label>
                  <Input
                    placeholder="e.g., $500/month"
                    value={debt.terms || ''}
                    onChange={(e) => updateDebt(debt.id, 'terms', e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Optional: Enter payment amount or terms
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-300 rounded-lg">
            <span className="font-bold text-slate-900">Total Other Debts</span>
            <span className="text-xl font-bold text-slate-700">
              ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          <Button onClick={addDebt} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Debt
          </Button>
        </>
      )}
    </QuestionCard>
  );
}
