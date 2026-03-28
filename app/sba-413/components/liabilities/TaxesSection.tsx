'use client';

import { LiabilitiesData, AssetsData } from '../../types';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';
import { Textarea } from '@/app/(components)/ui/textarea';
import { Plus } from 'lucide-react';
import SectionCard from '../shared/SectionCard';
import ItemCard from '../shared/ItemCard';
import CurrencyInput from '../shared/CurrencyInput';
import { generateId } from '../../utils/calculations';

interface TaxesSectionProps {
  data: LiabilitiesData;
  realEstateProperties: AssetsData['real_estate'];
  onChange: (data: LiabilitiesData) => void;
}

export default function TaxesSection({ data, realEstateProperties, onChange }: TaxesSectionProps) {
  const addTax = () => {
    onChange({
      ...data,
      unpaid_taxes: [
        ...data.unpaid_taxes,
        {
          id: generateId(),
          tax_type: 'federal_income',
          tax_years: '',
          to_whom: '',
          amount: 0,
          lien: false,
        },
      ],
    });
  };

  const removeTax = (id: string) => {
    onChange({
      ...data,
      unpaid_taxes: data.unpaid_taxes.filter((tax) => tax.id !== id),
    });
  };

  const updateTax = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      unpaid_taxes: data.unpaid_taxes.map((tax) =>
        tax.id === id ? { ...tax, [field]: value } : tax
      ),
    });
  };

  const totalAmount = data.unpaid_taxes.reduce((sum, tax) => sum + (tax.amount || 0), 0);

  return (
    <SectionCard
      icon="🧾"
      title="Unpaid Taxes (Section 6)"
      description="Federal, state, or property taxes owed"
    >
      <div className="space-y-4">
        {data.unpaid_taxes.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No unpaid taxes added yet</p>
            <Button onClick={addTax} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Unpaid Tax
            </Button>
          </div>
        ) : (
          <>
            {data.unpaid_taxes.map((tax, index) => {
              const linkedProperty = realEstateProperties.find(p => p.id === tax.lien_property_ref_id);
              
              return (
                <ItemCard
                  key={tax.id}
                  index={index}
                  title={`Unpaid Tax #${index + 1}`}
                  onRemove={() => removeTax(tax.id)}
                >
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Tax Type *</Label>
                        <select
                          value={tax.tax_type}
                          onChange={(e) => updateTax(tax.id, 'tax_type', e.target.value)}
                          className="mt-2 w-full h-10 px-3 rounded-md border border-gray-300"
                        >
                          <option value="federal_income">Federal Income Tax</option>
                          <option value="state_income">State Income Tax</option>
                          <option value="payroll">Payroll Tax</option>
                          <option value="property">Property Tax</option>
                          <option value="sales">Sales Tax</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <Label>Tax Year(s) *</Label>
                        <Input
                          placeholder="E.g., 2023, 2022-2023"
                          value={tax.tax_years}
                          onChange={(e) => updateTax(tax.id, 'tax_years', e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>To Whom Payable *</Label>
                        <Input
                          placeholder="IRS, State of CA, etc."
                          value={tax.to_whom}
                          onChange={(e) => updateTax(tax.id, 'to_whom', e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Amount Owed *</Label>
                        <CurrencyInput
                          value={tax.amount}
                          onChange={(val) => updateTax(tax.id, 'amount', val || 0)}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    {/* Payment Plan */}
                    <div>
                      <Label>Payment Plan Terms</Label>
                      <Textarea
                        placeholder="E.g., $500/month for 12 months, or 'No payment plan'"
                        value={tax.payment_plan_terms || ''}
                        onChange={(e) => updateTax(tax.id, 'payment_plan_terms', e.target.value)}
                        rows={2}
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Required: Describe payment plan or enter "No payment plan"
                      </p>
                    </div>

                    {/* Lien Section */}
                    <div className="border-t pt-4">
                      <div className="flex items-center mb-3">
                        <input
                          type="checkbox"
                          id={`lien-${tax.id}`}
                          checked={tax.lien}
                          onChange={(e) => updateTax(tax.id, 'lien', e.target.checked)}
                          className="w-4 h-4 mr-2"
                        />
                        <Label htmlFor={`lien-${tax.id}`} className="cursor-pointer font-semibold">
                          Tax lien filed against property
                        </Label>
                      </div>
                      {tax.lien && (
                        <div className="pl-6">
                          <Label>Property with Lien</Label>
                          <select
                            value={tax.lien_property_ref_id || ''}
                            onChange={(e) => updateTax(tax.id, 'lien_property_ref_id', e.target.value)}
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
                              ✓ Lien on: {linkedProperty.address_full}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </ItemCard>
              );
            })}
            
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <span className="font-semibold text-gray-900">Total Unpaid Taxes</span>
              <span className="text-xl font-bold text-red-600">
                ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            <Button onClick={addTax} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Another Tax
            </Button>
          </>
        )}
      </div>
    </SectionCard>
  );
}
