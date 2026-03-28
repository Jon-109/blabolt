'use client';

import { LiabilitiesData, SmartGateFlags, AssetsData } from '../types';
import { Button } from '@/app/(components)/ui/button';
import { ChevronRight, Info } from 'lucide-react';
import CreditCardsSection from './liabilities/CreditCardsSection';
import LoansSection from './liabilities/LoansSection';
import MortgagesSection from './liabilities/MortgagesSection';
import TaxesSection from './liabilities/TaxesSection';
import OtherLiabilitiesSection from './liabilities/OtherLiabilitiesSection';

interface LiabilitiesPageProps {
  data: LiabilitiesData;
  assets: AssetsData;
  smartGate: SmartGateFlags;
  onChange: (data: LiabilitiesData) => void;
  onNext: () => void;
}

export default function LiabilitiesPage({ data, assets, smartGate, onChange, onNext }: LiabilitiesPageProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">Liabilities</h2>
        <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
          Tell us what you owe. Exact amounts are best, but estimates work too.
        </p>
      </div>

      <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl p-5 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full blur-3xl opacity-40"></div>
        <div className="relative flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Info className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-amber-900 mb-1.5 text-sm sm:text-base">💡 Pro Tip</div>
            <p className="text-sm sm:text-base text-amber-800 leading-relaxed">
              Include all debts—even small ones. Lenders want the complete picture for accurate assessment.
            </p>
          </div>
        </div>
      </div>

      {/* Credit Cards */}
      {smartGate.has_personal_debt && <CreditCardsSection data={data} onChange={onChange} />}

      {/* Loans */}
      {smartGate.has_personal_debt && <LoansSection data={data} onChange={onChange} />}

      {/* Mortgages */}
      {smartGate.has_real_estate && (
        <MortgagesSection 
          data={data} 
          realEstateProperties={assets.real_estate}
          onChange={onChange} 
        />
      )}

      {/* Unpaid Taxes */}
      {smartGate.owes_taxes && (
        <TaxesSection 
          data={data} 
          realEstateProperties={assets.real_estate}
          onChange={onChange} 
        />
      )}

      {/* Other Liabilities */}
      <OtherLiabilitiesSection data={data} onChange={onChange} />

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
