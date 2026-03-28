'use client';

import { AssetsData } from '../../types';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';
import { Plus } from 'lucide-react';
import SectionCard from '../shared/SectionCard';
import ItemCard from '../shared/ItemCard';
import CurrencyInput from '../shared/CurrencyInput';
import { generateId } from '../../utils/calculations';

interface RetirementSectionProps {
  data: AssetsData;
  onChange: (data: AssetsData) => void;
}

export default function RetirementSection({ data, onChange }: RetirementSectionProps) {
  const addAccount = () => {
    onChange({
      ...data,
      retirement_accounts: [
        ...data.retirement_accounts,
        {
          id: generateId(),
          institution: '',
          plan_type: '401(k)',
          balance: 0,
          value_date: new Date().toISOString().split('T')[0] as string,
        },
      ],
    });
  };

  const removeAccount = (id: string) => {
    onChange({
      ...data,
      retirement_accounts: data.retirement_accounts.filter((acc) => acc.id !== id),
    });
  };

  const updateAccount = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      retirement_accounts: data.retirement_accounts.map((acc) =>
        acc.id === id ? { ...acc, [field]: value } : acc
      ),
    });
  };

  const totalBalance = data.retirement_accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  return (
    <SectionCard
      icon="🏦"
      title="Retirement Accounts"
      description="401(k), IRA, SEP—what's the current balance?"
    >
      <div className="space-y-4">
        {data.retirement_accounts.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No retirement accounts added yet</p>
            <Button onClick={addAccount} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Retirement Account
            </Button>
          </div>
        ) : (
          <>
            {data.retirement_accounts.map((account, index) => (
              <ItemCard
                key={account.id}
                index={index}
                title={`Retirement Account #${index + 1}`}
                onRemove={() => removeAccount(account.id)}
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Institution</Label>
                    <Input
                      placeholder="Fidelity, Vanguard, etc."
                      value={account.institution}
                      onChange={(e) => updateAccount(account.id, 'institution', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Plan Type</Label>
                    <select
                      value={account.plan_type}
                      onChange={(e) => updateAccount(account.id, 'plan_type', e.target.value)}
                      className="mt-2 w-full h-10 px-3 rounded-md border border-gray-300"
                    >
                      <option value="401(k)">401(k)</option>
                      <option value="403(b)">403(b)</option>
                      <option value="Traditional IRA">Traditional IRA</option>
                      <option value="Roth IRA">Roth IRA</option>
                      <option value="SEP IRA">SEP IRA</option>
                      <option value="SIMPLE IRA">SIMPLE IRA</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label>Current Balance *</Label>
                    <CurrencyInput
                      value={account.balance}
                      onChange={(val) => updateAccount(account.id, 'balance', val || 0)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Valuation Date *</Label>
                    <Input
                      type="date"
                      value={account.value_date}
                      onChange={(e) => updateAccount(account.id, 'value_date', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </ItemCard>
            ))}
            
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <span className="font-semibold text-gray-900">Total Retirement Savings</span>
              <span className="text-xl font-bold text-purple-600">
                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            <Button onClick={addAccount} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Another Account
            </Button>
          </>
        )}
      </div>
    </SectionCard>
  );
}
