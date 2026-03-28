'use client';

import { AssetsData } from '../../types';
import { Label } from '@/app/(components)/ui/label';
import SectionCard from '../shared/SectionCard';
import CurrencyInput from '../shared/CurrencyInput';

interface CashSectionProps {
  data: AssetsData;
  onChange: (data: AssetsData) => void;
}

export default function CashSection({ data, onChange }: CashSectionProps) {
  // Get or create the single cash account entry
  const cashAccount = data.cash_accounts[0] || { id: 'cash-1', institution: 'Combined', account_type: 'checking', balance: 0 };
  const savingsAccount = data.cash_accounts[1] || { id: 'savings-1', institution: 'Combined', account_type: 'savings', balance: 0 };

  const updateCashBalance = (value: number) => {
    const updated = [...data.cash_accounts];
    if (updated[0]) {
      updated[0] = { ...updated[0], balance: value };
    } else {
      updated[0] = { id: 'cash-1', institution: 'Combined', account_type: 'checking', balance: value };
    }
    onChange({ ...data, cash_accounts: updated });
  };

  const updateSavingsBalance = (value: number) => {
    const updated = [...data.cash_accounts];
    // Ensure cash account exists first
    if (!updated[0]) {
      updated[0] = { id: 'cash-1', institution: 'Combined', account_type: 'checking', balance: 0 };
    }
    if (updated[1]) {
      updated[1] = { ...updated[1], balance: value };
    } else {
      updated[1] = { id: 'savings-1', institution: 'Combined', account_type: 'savings', balance: value };
    }
    onChange({ ...data, cash_accounts: updated });
  };

  const totalCash = (cashAccount.balance || 0) + (savingsAccount.balance || 0);

  return (
    <SectionCard
      icon="💰"
      title="Cash & Savings"
      description="Your combined cash and savings balances"
    >
      <div className="space-y-6">
        <div>
          <Label className="text-base font-semibold text-slate-900">
            About how much do you currently have in cash or checking accounts combined?
          </Label>
          <p className="text-sm text-slate-600 mt-1 mb-3">
            Include cash in hand and all your checking accounts.
          </p>
          <CurrencyInput
            value={cashAccount.balance}
            onChange={(val) => updateCashBalance(val || 0)}
            placeholder="$0"
          />
        </div>

        <div>
          <Label className="text-base font-semibold text-slate-900">
            About how much do you currently have in savings accounts?
          </Label>
          <p className="text-sm text-slate-600 mt-1 mb-3">
            If you don't have savings, just enter $0.
          </p>
          <CurrencyInput
            value={savingsAccount.balance}
            onChange={(val) => updateSavingsBalance(val || 0)}
            placeholder="$0"
          />
        </div>

        {/* Total */}
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl mt-6">
          <span className="font-bold text-slate-900">Total Cash & Savings</span>
          <span className="text-2xl font-bold text-emerald-600">
            ${totalCash.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}
