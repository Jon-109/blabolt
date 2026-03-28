'use client';

import { RealEstateProperty } from '../../../types';

interface MortgagesSummaryProps {
  properties: RealEstateProperty[];
}

export default function MortgagesSummary({ properties }: MortgagesSummaryProps) {
  if (properties.length === 0) return null;

  const totalBalance = properties.reduce((sum, prop) => sum + (prop.mortgage_balance || 0), 0);
  const totalPayment = properties.reduce((sum, prop) => sum + (prop.mortgage_payment || 0), 0);

  return (
    <div className="bg-white rounded-lg border-2 border-emerald-300 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🏠</span>
        <h4 className="font-bold text-emerald-900 text-lg">Mortgages</h4>
      </div>
      
      <div className="space-y-2">
        {properties.map((prop) => (
          <div key={prop.id} className="flex justify-between items-start text-sm border-b border-emerald-100 pb-2 last:border-0">
            <div className="flex-1">
              <p className="font-semibold text-slate-900">
                {prop.address_full}
              </p>
              <p className="text-xs text-slate-600">
                {prop.mortgage_lender} • Payment: ${(prop.mortgage_payment || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}/mo
              </p>
            </div>
            <span className="font-bold text-emerald-700">
              ${(prop.mortgage_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t-2 border-emerald-300 flex justify-between items-center">
        <div>
          <p className="text-xs text-slate-600">Total Balance</p>
          <p className="font-bold text-emerald-900 text-lg">
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-600">Total Monthly</p>
          <p className="font-bold text-emerald-900 text-lg">
            ${totalPayment.toLocaleString('en-US', { minimumFractionDigits: 0 })}/mo
          </p>
        </div>
      </div>
    </div>
  );
}
