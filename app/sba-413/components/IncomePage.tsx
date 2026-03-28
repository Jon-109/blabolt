'use client';

import { IncomeData, ContingentLiabilitiesData, SmartGateFlags } from '../types';
import { Button } from '@/app/(components)/ui/button';
import { Label } from '@/app/(components)/ui/label';
import { ChevronRight } from 'lucide-react';
import SectionCard from './shared/SectionCard';
import CurrencyInput from './shared/CurrencyInput';

interface IncomePageProps {
  income: IncomeData;
  contingent: ContingentLiabilitiesData;
  smartGate: SmartGateFlags;
  onIncomeChange: (data: IncomeData) => void;
  onContingentChange: (data: ContingentLiabilitiesData) => void;
  onNext: () => void;
}

export default function IncomePage({
  income,
  contingent,
  smartGate,
  onIncomeChange,
  onContingentChange,
  onNext,
}: IncomePageProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">Income & Contingent Liabilities</h2>
        <p className="text-slate-600 text-base sm:text-lg leading-relaxed">Your annual income and any contingent obligations</p>
      </div>

      {/* Annual Income */}
      <SectionCard icon="💰" title="Annual Income (Section 1)" description="Your yearly earnings from all sources">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label>Salary / W-2 Income</Label>
            <CurrencyInput
              value={income.annual_salary}
              onChange={(val) => onIncomeChange({ ...income, annual_salary: val || 0 })}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Net Investment Income</Label>
            <CurrencyInput
              value={income.annual_net_investment_income}
              onChange={(val) => onIncomeChange({ ...income, annual_net_investment_income: val || 0 })}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Real Estate Income (Net)</Label>
            <CurrencyInput
              value={income.annual_real_estate_income}
              onChange={(val) => onIncomeChange({ ...income, annual_real_estate_income: val || 0 })}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Other Income</Label>
            <CurrencyInput
              value={income.annual_other_income_amount}
              onChange={(val) => onIncomeChange({ ...income, annual_other_income_amount: val || 0 })}
              className="mt-2"
            />
          </div>
        </div>
        <div className="mt-6 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-sm text-slate-600 leading-relaxed">
            <strong className="text-slate-900">Note:</strong> Alimony/child support is only counted if you choose to include it
          </p>
        </div>
      </SectionCard>

      {/* Contingent Liabilities */}
      <SectionCard
        icon="⚠️"
        title="Contingent Liabilities"
        description="Amounts you may owe under certain conditions"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label>As Endorser/Co-maker/Guarantor</Label>
            <CurrencyInput
              value={contingent.contingent_endorser_amount}
              onChange={(val) =>
                onContingentChange({ ...contingent, contingent_endorser_amount: val || 0 })
              }
              className="mt-2"
            />
          </div>
          <div>
            <Label>Legal Claims & Judgments</Label>
            <CurrencyInput
              value={contingent.contingent_legal_claims_amount}
              onChange={(val) =>
                onContingentChange({ ...contingent, contingent_legal_claims_amount: val || 0 })
              }
              className="mt-2"
            />
          </div>
          <div>
            <Label>Provision for Federal Income Tax</Label>
            <CurrencyInput
              value={contingent.contingent_fed_tax_provision_amount}
              onChange={(val) =>
                onContingentChange({ ...contingent, contingent_fed_tax_provision_amount: val || 0 })
              }
              className="mt-2"
            />
          </div>
          <div>
            <Label>Other Special Debt</Label>
            <CurrencyInput
              value={contingent.contingent_other_special_debt_amount}
              onChange={(val) =>
                onContingentChange({ ...contingent, contingent_other_special_debt_amount: val || 0 })
              }
              className="mt-2"
            />
          </div>
        </div>
      </SectionCard>

      {/* Personal Guarantees */}
      {smartGate.has_personal_guarantees && (
        <SectionCard
          icon="🤝"
          title="Personal Guarantees"
          description="Business loans or leases you've personally guaranteed"
        >
          <p className="text-gray-600">Coming soon - add personal guarantee entries</p>
        </SectionCard>
      )}

      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          size="lg"
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-bold text-base px-8"
        >
          Continue to Declarations
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
