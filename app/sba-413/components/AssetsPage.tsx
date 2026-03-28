'use client';

import { AssetsData, SmartGateFlags } from '../types';
import { Button } from '@/app/(components)/ui/button';
import { ChevronRight, Info } from 'lucide-react';
import {
  CashSection,
  RealEstateSection,
  SecuritiesSection,
  RetirementSection,
  AutosSection,
  LifeInsuranceSection,
  OtherPropertySection,
  OtherAssetsSection,
} from './assets';

interface AssetsPageProps {
  data: AssetsData;
  smartGate: SmartGateFlags;
  onChange: (data: AssetsData) => void;
  onNext: () => void;
}

export default function AssetsPage({ data, smartGate, onChange, onNext }: AssetsPageProps) {
  const handleValidateAndNext = () => {
    // Basic validation - check if they've entered any cash or savings amount
    const totalCash = data.cash_accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    if (totalCash === 0) {
      alert('Please enter your cash and/or savings amounts (enter $0 if you have none)');
      return;
    }

    onNext();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">Assets</h2>
        <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
          Tell us what you own. If you don't have something, skip it—zeros are perfectly fine.
        </p>
      </div>

      {/* Cash & Savings - ALWAYS SHOWN */}
      <CashSection data={data} onChange={onChange} />

      {/* Securities - CONDITIONAL */}
      {smartGate.has_securities && <SecuritiesSection data={data} onChange={onChange} />}

      {/* Retirement - CONDITIONAL */}
      {smartGate.has_retirement && <RetirementSection data={data} onChange={onChange} />}

      {/* Life Insurance - CONDITIONAL */}
      {smartGate.has_life_csv && <LifeInsuranceSection data={data} onChange={onChange} />}

      {/* Real Estate - CONDITIONAL */}
      {smartGate.has_real_estate && <RealEstateSection data={data} onChange={onChange} />}

      {/* Autos - CONDITIONAL */}
      {smartGate.has_vehicles && <AutosSection data={data} onChange={onChange} />}

      {/* Other Personal Property - CONDITIONAL */}
      {smartGate.has_vehicles && <OtherPropertySection data={data} onChange={onChange} />}

      {/* Other Assets / Crypto - CONDITIONAL */}
      {smartGate.has_crypto && <OtherAssetsSection data={data} onChange={onChange} />}

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleValidateAndNext}
          size="lg"
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-bold text-base px-8"
        >
          Continue to Liabilities
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
