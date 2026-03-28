'use client';

import { LiabilitiesData } from '../../../types';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';
import { Plus, X } from 'lucide-react';
import QuestionCard from '../shared/QuestionCard';
import CurrencyInput from '../../shared/CurrencyInput';
import { generateId } from '../../../utils/calculations';

interface TaxesOwedQuestionProps {
  data: LiabilitiesData;
  onChange: (data: LiabilitiesData) => void;
  onAnswerChange?: (hasDebt: boolean) => void;
}

export default function TaxesOwedQuestion({ data, onChange, onAnswerChange }: TaxesOwedQuestionProps) {
  const addTax = () => {
    onChange({
      ...data,
      unpaid_taxes: [
        ...data.unpaid_taxes,
        {
          id: generateId(),
          tax_type: 'federal_income',
          tax_years: '',
          to_whom: '',
          amount: 0,
          payment_plan_terms: '',
          lien: false,
        },
      ],
    });
  };

  const removeTax = (id: string) => {
    onChange({
      ...data,
      unpaid_taxes: data.unpaid_taxes.filter((tax) => tax.id !== id),
    });
  };

  const updateTax = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      unpaid_taxes: data.unpaid_taxes.map((tax) =>
        tax.id === id ? { ...tax, [field]: value } : tax
      ),
    });
  };

  const totalAmount = data.unpaid_taxes.reduce((sum, tax) => sum + (tax.amount || 0), 0);

  return (
    <QuestionCard
      icon="🧾"
      title="Do you currently owe any taxes or are you on a tax payment plan?"
      description="Include any unpaid federal, state, or property taxes."
      examples="IRS payment plan, state tax balance, or property tax installment plan."
      onAnswerChange={onAnswerChange}
    >
      {/* Tax Entries */}
      {data.unpaid_taxes.length === 0 ? (
        <div className="text-center py-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
          <p className="text-slate-600 mb-3">No unpaid taxes added yet</p>
          <Button onClick={addTax} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Tax Obligation
          </Button>
        </div>
      ) : (
        <>
          {data.unpaid_taxes.map((tax, index) => (
            <div key={tax.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-bold text-slate-900">Tax #{index + 1}</h5>
                <button
                  onClick={() => removeTax(tax.id)}
                  className="text-red-600 hover:text-red-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Type of Tax *</Label>
                  <select
                    value={tax.tax_type}
                    onChange={(e) => updateTax(tax.id, 'tax_type', e.target.value)}
                    className="mt-2 w-full h-10 px-3 rounded-md border border-slate-300 font-semibold text-slate-900"
                  >
                    <option value="federal_income">Federal Income Tax</option>
                    <option value="state_income">State Income Tax</option>
                    <option value="property">Property Tax</option>
                    <option value="payroll">Payroll Tax</option>
                    <option value="sales">Sales Tax</option>
                    <option value="other">Other Tax</option>
                  </select>
                </div>
                <div>
                  <Label>Tax Years</Label>
                  <Input
                    placeholder="e.g., 2022, 2023"
                    value={tax.tax_years}
                    onChange={(e) => updateTax(tax.id, 'tax_years', e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Balance Owed *</Label>
                  <CurrencyInput
                    value={tax.amount}
                    onChange={(val) => updateTax(tax.id, 'amount', val || 0)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Monthly Payment</Label>
                  <Input
                    placeholder="If on payment plan"
                    value={tax.payment_plan_terms || ''}
                    onChange={(e) => updateTax(tax.id, 'payment_plan_terms', e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Enter amount if on payment plan
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg">
            <span className="font-bold text-slate-900">Total Unpaid Taxes</span>
            <span className="text-xl font-bold text-red-600">
              ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          <Button onClick={addTax} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Tax
          </Button>
        </>
      )}
    </QuestionCard>
  );
}
