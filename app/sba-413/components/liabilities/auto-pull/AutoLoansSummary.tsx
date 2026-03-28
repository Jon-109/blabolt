'use client';

import { Auto } from '../../../types';

interface AutoLoansSummaryProps {
  autos: Auto[];
}

export default function AutoLoansSummary({ autos }: AutoLoansSummaryProps) {
  if (autos.length === 0) return null;

  const totalBalance = autos.reduce((sum, auto) => sum + (auto.loan_balance || 0), 0);
  const totalPayment = autos.reduce((sum, auto) => sum + (auto.monthly_payment || 0), 0);

  return (
    <div className="bg-white rounded-lg border-2 border-emerald-300 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🚗</span>
        <h4 className="font-bold text-emerald-900 text-lg">Auto Loans</h4>
      </div>
      
      <div className="space-y-2">
        {autos.map((auto) => (
          <div key={auto.id} className="flex justify-between items-start text-sm border-b border-emerald-100 pb-2 last:border-0">
            <div className="flex-1">
              <p className="font-semibold text-slate-900">
                {auto.year} {auto.make} {auto.model}
              </p>
              <p className="text-xs text-slate-600">
                Payment: ${(auto.monthly_payment || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}/mo
              </p>
            </div>
            <span className="font-bold text-emerald-700">
              ${(auto.loan_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
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
