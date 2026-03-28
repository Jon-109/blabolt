'use client';

import { LifeInsurancePolicy } from '../../../types';

interface PolicyLoansSummaryProps {
  policies: LifeInsurancePolicy[];
}

export default function PolicyLoansSummary({ policies }: PolicyLoansSummaryProps) {
  if (policies.length === 0) return null;

  const totalBalance = policies.reduce((sum, policy) => sum + (policy.loan_balance || 0), 0);

  return (
    <div className="bg-white rounded-lg border-2 border-emerald-300 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🛡️</span>
        <h4 className="font-bold text-emerald-900 text-lg">Life Insurance Policy Loans</h4>
      </div>
      
      <div className="space-y-2">
        {policies.map((policy) => (
          <div key={policy.id} className="flex justify-between items-start text-sm border-b border-emerald-100 pb-2 last:border-0">
            <div className="flex-1">
              <p className="font-semibold text-slate-900">
                {policy.company}
              </p>
              <p className="text-xs text-slate-600">
                {policy.policy_type === 'other' && policy.policy_type_other 
                  ? policy.policy_type_other 
                  : policy.policy_type.charAt(0).toUpperCase() + policy.policy_type.slice(1)} Life Policy
              </p>
            </div>
            <span className="font-bold text-emerald-700">
              ${(policy.loan_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t-2 border-emerald-300 flex justify-between items-center">
        <div>
          <p className="text-xs text-slate-600">Total Policy Loans</p>
          <p className="font-bold text-emerald-900 text-lg">
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </p>
        </div>
      </div>
    </div>
  );
}
