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

interface RealEstateSectionProps {
  data: AssetsData;
  onChange: (data: AssetsData) => void;
}

export default function RealEstateSection({ data, onChange }: RealEstateSectionProps) {
  const addProperty = () => {
    onChange({
      ...data,
      real_estate: [
        ...data.real_estate,
        {
          id: generateId(),
          property_type: 'primary',
          address_full: '',
          purchase_date: '',
          original_cost: 0,
          market_value: 0,
          value_source: 'owner_estimate',
          status: 'current',
        },
      ],
    });
  };

  const removeProperty = (id: string) => {
    onChange({
      ...data,
      real_estate: data.real_estate.filter((prop) => prop.id !== id),
    });
  };

  const updateProperty = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      real_estate: data.real_estate.map((prop) =>
        prop.id === id ? { ...prop, [field]: value } : prop
      ),
    });
  };

  const totalValue = data.real_estate.reduce((sum, prop) => sum + (prop.market_value || 0), 0);

  return (
    <SectionCard
      icon="🏠"
      title="Real Estate Owned"
      description="Let's add each property (home, rental, land)"
    >
      <div className="space-y-4">
        {data.real_estate.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No properties added yet</p>
            <Button onClick={addProperty} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </div>
        ) : (
          <>
            {data.real_estate.map((property, index) => (
              <ItemCard
                key={property.id}
                index={index}
                title={`Property #${index + 1}`}
                onRemove={() => removeProperty(property.id)}
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Property Type</Label>
                    <select
                      value={property.property_type}
                      onChange={(e) => updateProperty(property.id, 'property_type', e.target.value)}
                      className="mt-2 w-full h-10 px-3 rounded-md border border-gray-300"
                    >
                      <option value="primary">Primary Residence</option>
                      <option value="rental">Rental Property</option>
                      <option value="land">Land</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label>Mortgage Status *</Label>
                    <select
                      value={property.status}
                      onChange={(e) => updateProperty(property.id, 'status', e.target.value)}
                      className="mt-2 w-full h-10 px-3 rounded-md border border-slate-300 font-semibold text-slate-900"
                    >
                      <option value="current">Current (On Time)</option>
                      <option value="late">Late/Behind</option>
                      <option value="forbearance">Forbearance</option>
                      <option value="paid_off">Paid Off (No Mortgage)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Full Address *</Label>
                    <Input
                      placeholder="123 Main St, San Francisco, CA 94102"
                      value={property.address_full}
                      onChange={(e) => updateProperty(property.id, 'address_full', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Purchase Date</Label>
                    <Input
                      type="date"
                      value={property.purchase_date}
                      onChange={(e) => updateProperty(property.id, 'purchase_date', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Original Cost</Label>
                    <CurrencyInput
                      value={property.original_cost}
                      onChange={(val) => updateProperty(property.id, 'original_cost', val || 0)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Current Market Value *</Label>
                    <CurrencyInput
                      value={property.market_value}
                      onChange={(val) => updateProperty(property.id, 'market_value', val || 0)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Value Source</Label>
                    <select
                      value={property.value_source}
                      onChange={(e) => updateProperty(property.id, 'value_source', e.target.value)}
                      className="mt-2 w-full h-10 px-3 rounded-md border border-slate-300 font-semibold text-slate-900"
                    >
                      <option value="owner_estimate">Owner Estimate</option>
                      <option value="zillow">Zillow/Redfin Estimate</option>
                      <option value="appraisal">Professional Appraisal</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  {/* Mortgage Information - Only show if not paid off */}
                  {property.status !== 'paid_off' && (
                    <>
                      <div className="md:col-span-2">
                        <div className="border-t border-slate-200 pt-4 mb-4">
                          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Mortgage Information</h4>
                        </div>
                      </div>
                      <div>
                        <Label>Mortgage Lender *</Label>
                        <Input
                          placeholder="Wells Fargo, Chase, etc."
                          value={property.mortgage_lender || ''}
                          onChange={(e) => updateProperty(property.id, 'mortgage_lender', e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Current Mortgage Balance *</Label>
                        <CurrencyInput
                          value={property.mortgage_balance}
                          onChange={(val) => updateProperty(property.id, 'mortgage_balance', val || 0)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Monthly Payment *</Label>
                        <CurrencyInput
                          value={property.mortgage_payment}
                          onChange={(val) => updateProperty(property.id, 'mortgage_payment', val || 0)}
                          className="mt-2"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Include principal, interest, taxes, and insurance (PITI)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </ItemCard>
            ))}
            
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
              <span className="font-bold text-slate-900">Total Real Estate Value</span>
              <span className="text-2xl font-bold text-emerald-600">
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            <Button onClick={addProperty} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Another Property
            </Button>
          </>
        )}
      </div>
    </SectionCard>
  );
}
