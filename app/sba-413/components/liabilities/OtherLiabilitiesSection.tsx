'use client';

import { LiabilitiesData } from '../../types';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';
import { Textarea } from '@/app/(components)/ui/textarea';
import { Plus } from 'lucide-react';
import SectionCard from '../shared/SectionCard';
import ItemCard from '../shared/ItemCard';
import CurrencyInput from '../shared/CurrencyInput';
import { generateId } from '../../utils/calculations';

interface OtherLiabilitiesSectionProps {
  data: LiabilitiesData;
  onChange: (data: LiabilitiesData) => void;
}

export default function OtherLiabilitiesSection({ data, onChange }: OtherLiabilitiesSectionProps) {
  const addLiability = () => {
    onChange({
      ...data,
      other_liabilities: [
        ...data.other_liabilities,
        {
          id: generateId(),
          description: '',
          to_whom: '',
          amount: 0,
        },
      ],
    });
  };

  const removeLiability = (id: string) => {
    onChange({
      ...data,
      other_liabilities: data.other_liabilities.filter((liab) => liab.id !== id),
    });
  };

  const updateLiability = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      other_liabilities: data.other_liabilities.map((liab) =>
        liab.id === id ? { ...liab, [field]: value } : liab
      ),
    });
  };

  const totalAmount = data.other_liabilities.reduce((sum, liab) => sum + (liab.amount || 0), 0);

  return (
    <SectionCard
      icon="📋"
      title="Other Liabilities (Section 7)"
      description="401(k) loans, BNPL, settlements, child support, etc."
    >
      <div className="space-y-4">
        {/* Helper Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Examples:</strong> 401(k) loans, buy-now-pay-later (BNPL) accounts, legal settlements, 
            child support/alimony obligations, personal guarantees not listed elsewhere
          </p>
        </div>

        {data.other_liabilities.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No other liabilities added yet</p>
            <Button onClick={addLiability} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Other Liability
            </Button>
          </div>
        ) : (
          <>
            {data.other_liabilities.map((liability, index) => (
              <ItemCard
                key={liability.id}
                index={index}
                title={`Other Liability #${index + 1}`}
                onRemove={() => removeLiability(liability.id)}
              >
                <div className="space-y-4">
                  <div>
                    <Label>Description *</Label>
                    <Input
                      placeholder="E.g., 401(k) loan, Affirm BNPL, child support"
                      value={liability.description}
                      onChange={(e) => updateLiability(liability.id, 'description', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>To Whom Payable *</Label>
                      <Input
                        placeholder="Company, person, or entity"
                        value={liability.to_whom}
                        onChange={(e) => updateLiability(liability.id, 'to_whom', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Amount Owed *</Label>
                      <CurrencyInput
                        value={liability.amount}
                        onChange={(val) => updateLiability(liability.id, 'amount', val || 0)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Repayment Terms (Optional)</Label>
                    <Textarea
                      placeholder="E.g., $200/month for 24 months, or lump sum due 12/2025"
                      value={liability.terms || ''}
                      onChange={(e) => updateLiability(liability.id, 'terms', e.target.value)}
                      rows={2}
                      className="mt-2"
                    />
                  </div>
                </div>
              </ItemCard>
            ))}
            
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <span className="font-semibold text-gray-900">Total Other Liabilities</span>
              <span className="text-xl font-bold text-purple-600">
                ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            <Button onClick={addLiability} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Another Liability
            </Button>
          </>
        )}
      </div>
    </SectionCard>
  );
}
