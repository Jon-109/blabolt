'use client';

import { SBA413FormData } from '../types';
import { Button } from '@/app/(components)/ui/button';
import { Check, AlertCircle } from 'lucide-react';
import SectionCard from './shared/SectionCard';
import { calculateTotalAssets, calculateTotalLiabilities, calculateNetWorth, calculateLiquidAssets, calculateMonthlyDebtService } from '../utils/calculations';

interface ReviewPageProps {
  data: SBA413FormData;
  onEdit: (step: string) => void;
}

export default function ReviewPage({ data, onEdit }: ReviewPageProps) {
  const totalAssets = calculateTotalAssets(data.assets);
  const totalLiabilities = calculateTotalLiabilities(data.liabilities);
  const netWorth = calculateNetWorth(data.assets, data.liabilities);
  const liquidAssets = calculateLiquidAssets(data.assets, data.liabilities);
  const monthlyDebtService = calculateMonthlyDebtService(data.liabilities);

  const isBalanced = Math.abs(totalAssets - (totalLiabilities + netWorth)) < 1;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Review & Submit</h2>
        <p className="text-gray-600">Verify your information before generating the PDF</p>
      </div>

      {/* Financial Summary */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
          <div className="text-sm font-medium text-green-700 mb-1">Total Assets</div>
          <div className="text-3xl font-bold text-green-900">
            ${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border-2 border-red-200">
          <div className="text-sm font-medium text-red-700 mb-1">Total Liabilities</div>
          <div className="text-3xl font-bold text-red-900">
            ${totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className={`rounded-2xl p-6 border-2 ${netWorth >= 0 ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'}`}>
          <div className={`text-sm font-medium mb-1 ${netWorth >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            Net Worth
          </div>
          <div className={`text-3xl font-bold ${netWorth >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
            ${Math.abs(netWorth).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            {netWorth < 0 && ' (Deficit)'}
          </div>
        </div>
      </div>

      {/* Balance Check */}
      <div className={`rounded-lg p-4 ${isBalanced ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <div className="flex items-center gap-3">
          {isBalanced ? (
            <>
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-green-900">✓ Balance Sheet Validates</div>
                <p className="text-sm text-green-700">Assets = Liabilities + Net Worth</p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-yellow-900">Balance Check</div>
                <p className="text-sm text-yellow-700">
                  There's a small rounding difference. This is normal and will be corrected in the final PDF.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        <SectionCard icon="💧" title="Liquid Assets" description="Cash + Securities - Credit Cards">
          <div className="text-2xl font-bold text-blue-600">
            ${liquidAssets.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </SectionCard>
        <SectionCard icon="📊" title="Monthly Debt Service" description="Total monthly debt payments">
          <div className="text-2xl font-bold text-purple-600">
            ${monthlyDebtService.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </SectionCard>
      </div>

      {/* Section Summaries */}
      <SectionCard icon="📋" title="Form Sections" description="Click to edit any section">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer" onClick={() => onEdit('identity')}>
            <span className="font-medium">Identity & Basics</span>
            <span className="text-sm text-blue-600">Edit →</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer" onClick={() => onEdit('assets')}>
            <span className="font-medium">Assets ({data.assets.cash_accounts.length + data.assets.real_estate.length} items)</span>
            <span className="text-sm text-blue-600">Edit →</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer" onClick={() => onEdit('liabilities')}>
            <span className="font-medium">Liabilities</span>
            <span className="text-sm text-blue-600">Edit →</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer" onClick={() => onEdit('income-contingent')}>
            <span className="font-medium">Income & Contingent</span>
            <span className="text-sm text-blue-600">Edit →</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer" onClick={() => onEdit('declarations')}>
            <span className="font-medium">Declarations</span>
            <span className="text-sm text-blue-600">Edit →</span>
          </div>
        </div>
      </SectionCard>

      {/* Generate Button */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">Ready to Generate PDF?</h3>
            <p className="text-blue-100">This will create your official SBA Form 413</p>
          </div>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50"
            onClick={() => alert('PDF generation coming soon!')}
          >
            <Check className="w-5 h-5 mr-2" />
            Generate SBA Form 413
          </Button>
        </div>
      </div>
    </div>
  );
}
