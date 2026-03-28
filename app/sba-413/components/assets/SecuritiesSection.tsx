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

interface SecuritiesSectionProps {
  data: AssetsData;
  onChange: (data: AssetsData) => void;
}

export default function SecuritiesSection({ data, onChange }: SecuritiesSectionProps) {
  const addSecurity = () => {
    onChange({
      ...data,
      securities: [
        ...data.securities,
        {
          id: generateId(),
          institution: '',
          account_nickname: '',
          security_name: '',
          ticker: '',
          quantity: 0,
          market_value: 0,
          value_date: new Date().toISOString().split('T')[0] as string,
        },
      ],
    });
  };

  const removeSecurity = (id: string) => {
    onChange({
      ...data,
      securities: data.securities.filter((sec) => sec.id !== id),
    });
  };

  const updateSecurity = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      securities: data.securities.map((sec) =>
        sec.id === id ? { ...sec, [field]: value } : sec
      ),
    });
  };

  // Calculate total value: quantity * market_value_per_share for each security
  const totalValue = data.securities.reduce((sum, sec) => {
    const perShareValue = sec.market_value || 0;
    const quantity = sec.quantity || 0;
    const totalForSecurity = perShareValue * quantity;
    return sum + totalForSecurity;
  }, 0);

  return (
    <SectionCard
      icon="📈"
      title="Stocks & Bonds"
      description="Investments in Robinhood, Fidelity, Schwab, or similar"
    >
      <div className="space-y-4">
        {data.securities.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No securities added yet</p>
            <Button onClick={addSecurity} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Security
            </Button>
          </div>
        ) : (
          <>
            {data.securities.map((security, index) => (
              <ItemCard
                key={security.id}
                index={index}
                title={`Security #${index + 1}`}
                onRemove={() => removeSecurity(security.id)}
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Security Name *</Label>
                    <Input
                      placeholder="Apple Inc., S&P 500 ETF, Tesla, etc."
                      value={security.security_name}
                      onChange={(e) => updateSecurity(security.id, 'security_name', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Number of Shares *</Label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={security.quantity || ''}
                      onChange={(e) =>
                        updateSecurity(security.id, 'quantity', parseFloat(e.target.value) || 0)
                      }
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Market Value Per Share *</Label>
                    <CurrencyInput
                      value={security.market_value}
                      onChange={(val) => updateSecurity(security.id, 'market_value', val || 0)}
                      className="mt-2"
                    />
                    <p className="text-xs text-slate-500 mt-1">Price per share</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Valuation Date *</Label>
                    <Input
                      type="date"
                      value={security.value_date}
                      onChange={(e) => updateSecurity(security.id, 'value_date', e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-xs text-slate-500 mt-1">Required by SBA</p>
                  </div>
                  {/* Show calculated total value */}
                  {security.quantity > 0 && security.market_value > 0 && (
                    <div className="md:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Total Value for this security:</span>
                        <span className="text-lg font-bold text-emerald-600">
                          ${((security.quantity || 0) * (security.market_value || 0)).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {security.quantity} shares × ${security.market_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per share
                      </p>
                    </div>
                  )}
                </div>
              </ItemCard>
            ))}
            
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
              <span className="font-bold text-slate-900">Total Securities Value</span>
              <span className="text-2xl font-bold text-emerald-600">
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            <Button onClick={addSecurity} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Another Security
            </Button>
          </>
        )}
      </div>
    </SectionCard>
  );
}
