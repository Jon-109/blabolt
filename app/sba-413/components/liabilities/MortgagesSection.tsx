'use client';

import { LiabilitiesData, AssetsData } from '../../types';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';
import { Plus } from 'lucide-react';
import SectionCard from '../shared/SectionCard';
import ItemCard from '../shared/ItemCard';
import CurrencyInput from '../shared/CurrencyInput';
import { generateId } from '../../utils/calculations';

interface MortgagesSectionProps {
  data: LiabilitiesData;
  realEstateProperties: AssetsData['real_estate'];
  onChange: (data: LiabilitiesData) => void;
}

export default function MortgagesSection({ data, realEstateProperties, onChange }: MortgagesSectionProps) {
  const addMortgage = () => {
    onChange({
      ...data,
      mortgages: [
        ...data.mortgages,
        {
          id: generateId(),
          property_ref_id: '',
          lender: '',
          account_no: '',
          current_balance: 0,
          monthly_pi: 0,
          escrow_included: false,
          heloc: false,
          status: 'current',
        },
      ],
    });
  };

  const removeMortgage = (id: string) => {
    onChange({
      ...data,
      mortgages: data.mortgages.filter((mort) => mort.id !== id),
    });
  };

  const updateMortgage = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      mortgages: data.mortgages.map((mort) =>
        mort.id === id ? { ...mort, [field]: value } : mort
      ),
    });
  };

  const totalBalance = data.mortgages.reduce((sum, mort) => sum + (mort.current_balance || 0), 0);
  const totalMonthlyPayment = data.mortgages.reduce((sum, mort) => sum + (mort.monthly_pi || 0), 0);

  return (
    <SectionCard
      icon="🏠"
      title="Mortgages (Section 4)"
      description="Link each mortgage to a specific property"
    >
      <div className="space-y-4">
        {realEstateProperties.length === 0 ? (
          <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-yellow-800 mb-2 font-medium">⚠️ No properties found</p>
            <p className="text-sm text-yellow-700">
              Add real estate properties in the Assets section first
            </p>
          </div>
        ) : data.mortgages.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No mortgages added yet</p>
            <Button onClick={addMortgage} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Mortgage
            </Button>
          </div>
        ) : (
          <>
            {data.mortgages.map((mortgage, index) => {
              const linkedProperty = realEstateProperties.find(p => p.id === mortgage.property_ref_id);
              
              return (
                <ItemCard
                  key={mortgage.id}
                  index={index}
                  title={`Mortgage #${index + 1}`}
                  onRemove={() => removeMortgage(mortgage.id)}
                >
                  <div className="space-y-4">
                    {/* Property Link */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <Label>Linked Property *</Label>
                      <select
                        value={mortgage.property_ref_id}
                        onChange={(e) => updateMortgage(mortgage.id, 'property_ref_id', e.target.value)}
                        className="mt-2 w-full h-10 px-3 rounded-md border border-gray-300"
                      >
                        <option value="">Select a property...</option>
                        {realEstateProperties.map((prop) => (
                          <option key={prop.id} value={prop.id}>
                            {prop.address_full || `${prop.property_type} property`}
                          </option>
                        ))}
                      </select>
                      {linkedProperty && (
                        <p className="text-xs text-blue-700 mt-1">
                          ✓ Linked to: {linkedProperty.address_full}
                        </p>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Lender *</Label>
                        <Input
                          placeholder="Wells Fargo, Chase, etc."
                          value={mortgage.lender}
                          onChange={(e) => updateMortgage(mortgage.id, 'lender', e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Account Number</Label>
                        <Input
                          placeholder="Last 4 digits okay"
                          value={mortgage.account_no}
                          onChange={(e) => updateMortgage(mortgage.id, 'account_no', e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Current Balance *</Label>
                        <CurrencyInput
                          value={mortgage.current_balance}
                          onChange={(val) => updateMortgage(mortgage.id, 'current_balance', val || 0)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Monthly P&I *</Label>
                        <CurrencyInput
                          value={mortgage.monthly_pi}
                          onChange={(val) => updateMortgage(mortgage.id, 'monthly_pi', val || 0)}
                          className="mt-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">Principal & Interest</p>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <select
                          value={mortgage.status}
                          onChange={(e) => updateMortgage(mortgage.id, 'status', e.target.value)}
                          className="mt-2 w-full h-10 px-3 rounded-md border border-gray-300"
                        >
                          <option value="current">Current (On Time)</option>
                          <option value="late">Late/Behind</option>
                          <option value="forbearance">Forbearance</option>
                          <option value="deferral">Deferral</option>
                        </select>
                      </div>
                      <div className="flex items-center mt-8">
                        <input
                          type="checkbox"
                          id={`escrow-${mortgage.id}`}
                          checked={mortgage.escrow_included}
                          onChange={(e) => updateMortgage(mortgage.id, 'escrow_included', e.target.checked)}
                          className="w-4 h-4 mr-2"
                        />
                        <Label htmlFor={`escrow-${mortgage.id}`} className="cursor-pointer">
                          Escrow included in payment
                        </Label>
                      </div>
                    </div>

                    {/* HELOC Section */}
                    <div className="border-t pt-4">
                      <div className="flex items-center mb-3">
                        <input
                          type="checkbox"
                          id={`heloc-${mortgage.id}`}
                          checked={mortgage.heloc}
                          onChange={(e) => updateMortgage(mortgage.id, 'heloc', e.target.checked)}
                          className="w-4 h-4 mr-2"
                        />
                        <Label htmlFor={`heloc-${mortgage.id}`} className="cursor-pointer font-semibold">
                          Has HELOC (Home Equity Line of Credit)
                        </Label>
                      </div>
                      {mortgage.heloc && (
                        <div className="grid md:grid-cols-2 gap-4 pl-6">
                          <div>
                            <Label>HELOC Limit</Label>
                            <CurrencyInput
                              value={mortgage.heloc_limit}
                              onChange={(val) => updateMortgage(mortgage.id, 'heloc_limit', val)}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>HELOC Drawn/Used</Label>
                            <CurrencyInput
                              value={mortgage.heloc_drawn}
                              onChange={(val) => updateMortgage(mortgage.id, 'heloc_drawn', val)}
                              className="mt-2"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </ItemCard>
              );
            })}
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <span className="font-semibold text-gray-900">Total Mortgage Balance</span>
                <span className="text-xl font-bold text-red-600">
                  ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <span className="font-semibold text-gray-900">Total Monthly Payment</span>
                <span className="text-xl font-bold text-orange-600">
                  ${totalMonthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            <Button onClick={addMortgage} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Another Mortgage
            </Button>
          </>
        )}
      </div>
    </SectionCard>
  );
}
