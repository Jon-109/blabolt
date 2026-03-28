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

interface AutosSectionProps {
  data: AssetsData;
  onChange: (data: AssetsData) => void;
}

export default function AutosSection({ data, onChange }: AutosSectionProps) {
  const addAuto = () => {
    onChange({
      ...data,
      autos: [
        ...data.autos,
        { id: generateId(), year: '', make: '', model: '', value: 0, financed: false },
      ],
    });
  };

  const removeAuto = (id: string) => {
    onChange({
      ...data,
      autos: data.autos.filter((auto) => auto.id !== id),
    });
  };

  const updateAuto = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      autos: data.autos.map((auto) => (auto.id === id ? { ...auto, [field]: value } : auto)),
    });
  };

  const totalValue = data.autos.reduce((sum, auto) => sum + (auto.value || 0), 0);

  return (
    <SectionCard
      icon="🚗"
      title="Autos & Vehicles"
      description="List all the car(s) you own."
    >
      <div className="space-y-4">
        {data.autos.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No vehicles added yet</p>
            <Button onClick={addAuto} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
        ) : (
          <>
            {data.autos.map((auto, index) => (
              <ItemCard
                key={auto.id}
                index={index}
                title={`Vehicle #${index + 1}`}
                onRemove={() => removeAuto(auto.id)}
              >
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <Label>Year</Label>
                    <Input
                      placeholder="2020"
                      value={auto.year}
                      onChange={(e) => updateAuto(auto.id, 'year', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Make</Label>
                    <Input
                      placeholder="Toyota"
                      value={auto.make}
                      onChange={(e) => updateAuto(auto.id, 'make', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Model</Label>
                    <Input
                      placeholder="Camry"
                      value={auto.model}
                      onChange={(e) => updateAuto(auto.id, 'model', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Estimated Current Value</Label>
                    <CurrencyInput
                      value={auto.value}
                      onChange={(val) => updateAuto(auto.id, 'value', val || 0)}
                      className="mt-2"
                    />
                  </div>
                  
                  {/* Financing Checkbox */}
                  <div className="md:col-span-4 flex items-center mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      id={`financed-${auto.id}`}
                      checked={auto.financed}
                      onChange={(e) => updateAuto(auto.id, 'financed', e.target.checked)}
                      className="w-4 h-4 mr-3"
                    />
                    <Label htmlFor={`financed-${auto.id}`} className="cursor-pointer font-semibold text-slate-900">
                      💳 I still owe money on this vehicle (auto loan or lease)
                    </Label>
                  </div>
                  
                  {/* Loan Details - Only show if financed */}
                  {auto.financed && (
                    <>
                      <div className="md:col-span-4">
                        <div className="border-t border-slate-200 pt-4 mb-4">
                          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Loan Details</h4>
                        </div>
                      </div>
                      <div>
                        <Label>Current Loan Balance *</Label>
                        <CurrencyInput
                          value={auto.loan_balance}
                          onChange={(val) => updateAuto(auto.id, 'loan_balance', val || 0)}
                          className="mt-2"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          How much you still owe on the loan
                        </p>
                      </div>
                      <div>
                        <Label>Monthly Payment *</Label>
                        <CurrencyInput
                          value={auto.monthly_payment}
                          onChange={(val) => updateAuto(auto.id, 'monthly_payment', val || 0)}
                          className="mt-2"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Your regular monthly car payment
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </ItemCard>
            ))}
            
            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
              <span className="font-semibold text-gray-900">Total Vehicle Value</span>
              <span className="text-xl font-bold text-indigo-600">
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            <Button onClick={addAuto} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Another Vehicle
            </Button>
          </>
        )}
      </div>
    </SectionCard>
  );
}
