// Remaining stub sections - implement as needed

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

export function LifeInsuranceSection({ data, onChange }: { data: AssetsData; onChange: (data: AssetsData) => void }) {
  const addPolicy = () => {
    onChange({
      ...data,
      life_policies: [
        ...data.life_policies,
        {
          id: generateId(),
          company: '',
          policy_type: 'whole',
          face_amount: 0,
          cash_surrender_value: 0,
          beneficiary: '',
          loan_outstanding: false,
        },
      ],
    });
  };

  const removePolicy = (id: string) => {
    onChange({
      ...data,
      life_policies: data.life_policies.filter((pol) => pol.id !== id),
    });
  };

  const updatePolicy = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      life_policies: data.life_policies.map((pol) =>
        pol.id === id ? { ...pol, [field]: value } : pol
      ),
    });
  };

  const totalValue = data.life_policies.reduce((sum, pol) => sum + (pol.cash_surrender_value || 0), 0);

  return (
    <SectionCard icon="🛡️" title="Life Insurance" description="Policies that build cash value">
      <div className="space-y-4">
        {/* Important Note */}
        <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 leading-relaxed">
            <strong className="text-blue-900">Note:</strong> Only include policies that build cash value (whole, universal, variable, etc.). 
            <span className="font-semibold"> Term life has no cash value and can be skipped.</span>
          </p>
        </div>
        {data.life_policies.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No policies added yet</p>
            <Button onClick={addPolicy} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Life Insurance Policy
            </Button>
          </div>
        ) : (
          <>
            {data.life_policies.map((policy, index) => (
              <ItemCard
                key={policy.id}
                index={index}
                title={`Policy #${index + 1}`}
                onRemove={() => removePolicy(policy.id)}
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Company *</Label>
                    <Input
                      placeholder="State Farm, MetLife, etc."
                      value={policy.company}
                      onChange={(e) => updatePolicy(policy.id, 'company', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Policy Type *</Label>
                    <select
                      value={policy.policy_type}
                      onChange={(e) => updatePolicy(policy.id, 'policy_type', e.target.value)}
                      className="mt-2 w-full h-10 px-3 rounded-md border border-slate-300 font-semibold text-slate-900"
                    >
                      <option value="whole">Whole Life</option>
                      <option value="universal">Universal Life</option>
                      <option value="variable">Variable Life</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  {/* Show input if "Other" is selected */}
                  {policy.policy_type === 'other' && (
                    <div className="md:col-span-2">
                      <Label>Specify Policy Type *</Label>
                      <Input
                        placeholder="E.g., Indexed Universal Life, Variable Universal Life"
                        value={policy.policy_type_other || ''}
                        onChange={(e) => updatePolicy(policy.id, 'policy_type_other', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  )}
                  <div>
                    <Label>Face Amount *</Label>
                    <CurrencyInput
                      value={policy.face_amount}
                      onChange={(val) => updatePolicy(policy.id, 'face_amount', val || 0)}
                      className="mt-2"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      The total coverage amount — the amount paid out by the insurer
                    </p>
                  </div>
                  <div>
                    <Label>Cash Surrender Value *</Label>
                    <CurrencyInput
                      value={policy.cash_surrender_value}
                      onChange={(val) => updatePolicy(policy.id, 'cash_surrender_value', val || 0)}
                      className="mt-2"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      The amount you'd get if you canceled the policy today
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Beneficiary</Label>
                    <Input
                      placeholder="Spouse, children, etc."
                      value={policy.beneficiary}
                      onChange={(e) => updatePolicy(policy.id, 'beneficiary', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  
                  {/* Policy Loan Checkbox */}
                  <div className="md:col-span-2 flex items-center mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      id={`loan-${policy.id}`}
                      checked={policy.loan_outstanding}
                      onChange={(e) => updatePolicy(policy.id, 'loan_outstanding', e.target.checked)}
                      className="w-4 h-4 mr-3"
                    />
                    <Label htmlFor={`loan-${policy.id}`} className="cursor-pointer font-semibold text-slate-900">
                      💰 I borrowed money against this policy (policy loan)
                    </Label>
                  </div>
                  
                  {/* Policy Loan Balance - Only show if loan outstanding */}
                  {policy.loan_outstanding && (
                    <>
                      <div className="md:col-span-2">
                        <div className="border-t border-slate-200 pt-4 mb-4">
                          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Policy Loan Details</h4>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <Label>Current Policy Loan Balance *</Label>
                        <CurrencyInput
                          value={policy.loan_balance}
                          onChange={(val) => updatePolicy(policy.id, 'loan_balance', val || 0)}
                          className="mt-2"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          The amount you borrowed from your policy's cash value that you haven't paid back yet
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </ItemCard>
            ))}
            
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
              <span className="font-bold text-slate-900">Total Cash Surrender Value</span>
              <span className="text-2xl font-bold text-amber-600">
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            <Button onClick={addPolicy} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Another Policy
            </Button>
          </>
        )}
      </div>
    </SectionCard>
  );
}

export function OtherPropertySection({ data, onChange }: { data: AssetsData; onChange: (data: AssetsData) => void }) {
  const addProperty = () => {
    onChange({
      ...data,
      other_personal_property: [
        ...data.other_personal_property,
        {
          id: generateId(),
          description: '',
          value: 0,
          pledged: false,
          delinquent: false,
        },
      ],
    });
  };

  const removeProperty = (id: string) => {
    onChange({
      ...data,
      other_personal_property: data.other_personal_property.filter((prop) => prop.id !== id),
    });
  };

  const updateProperty = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      other_personal_property: data.other_personal_property.map((prop) =>
        prop.id === id ? { ...prop, [field]: value } : prop
      ),
    });
  };

  const totalValue = data.other_personal_property.reduce((sum, prop) => sum + (prop.value || 0), 0);

  return (
    <SectionCard icon="⚓" title="Other Personal Property" description="Boats, RVs, equipment, jewelry—any physical items over ~$2,500">
      <div className="space-y-4">
        {data.other_personal_property.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No other property added yet</p>
            <Button onClick={addProperty} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </div>
        ) : (
          <>
            {data.other_personal_property.map((property, index) => (
              <ItemCard
                key={property.id}
                index={index}
                title={`Property #${index + 1}`}
                onRemove={() => removeProperty(property.id)}
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="E.g., Boat, RV, jewelry, equipment"
                      value={property.description}
                      onChange={(e) => updateProperty(property.id, 'description', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Estimated Value</Label>
                    <CurrencyInput
                      value={property.value}
                      onChange={(val) => updateProperty(property.id, 'value', val || 0)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </ItemCard>
            ))}
            
            <div className="flex items-center justify-between p-4 bg-teal-50 rounded-lg">
              <span className="font-semibold text-gray-900">Total Other Property Value</span>
              <span className="text-xl font-bold text-teal-600">
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            <Button onClick={addProperty} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Another Item
            </Button>
          </>
        )}
      </div>
    </SectionCard>
  );
}

export function OtherAssetsSection({ data, onChange }: { data: AssetsData; onChange: (data: AssetsData) => void }) {
  const addAsset = () => {
    onChange({
      ...data,
      other_assets: [
        ...data.other_assets,
        {
          id: generateId(),
          asset_type: 'crypto',
          description: '',
          value: 0,
          value_date: new Date().toISOString().split('T')[0] as string,
        },
      ],
    });
  };

  const removeAsset = (id: string) => {
    onChange({
      ...data,
      other_assets: data.other_assets.filter((asset) => asset.id !== id),
    });
  };

  const updateAsset = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      other_assets: data.other_assets.map((asset) =>
        asset.id === id ? { ...asset, [field]: value } : asset
      ),
    });
  };

  const totalValue = data.other_assets.reduce((sum, asset) => sum + (asset.value || 0), 0);

  return (
    <SectionCard icon="💎" title="Other Assets & Crypto" description="List non-physical assets that have value, like cryptocurrency, HSAs, trusts, or notes receivable.">
      <div className="space-y-4">
        {data.other_assets.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No other assets added yet</p>
            <Button onClick={addAsset} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          </div>
        ) : (
          <>
            {data.other_assets.map((asset, index) => (
              <ItemCard
                key={asset.id}
                index={index}
                title={`Asset #${index + 1}`}
                onRemove={() => removeAsset(asset.id)}
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Asset Type *</Label>
                    <select
                      value={asset.asset_type}
                      onChange={(e) => updateAsset(asset.id, 'asset_type', e.target.value)}
                      className="mt-2 w-full h-10 px-3 rounded-md border border-slate-300 font-semibold text-slate-900"
                    >
                      <option value="crypto">Cryptocurrency</option>
                      <option value="HSA">Health Savings Account</option>
                      <option value="trust">Trust Interest</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  {/* Show input if "Other" is selected */}
                  {asset.asset_type === 'other' && (
                    <div>
                      <Label>Specify Asset Type *</Label>
                      <Input
                        placeholder="E.g., Art collection, Patents, Royalties"
                        value={asset.asset_type_other || ''}
                        onChange={(e) => updateAsset(asset.id, 'asset_type_other', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  )}
                  <div className={asset.asset_type === 'other' ? 'md:col-span-2' : ''}>
                    <Label>Description</Label>
                    <Input
                      placeholder="E.g., Bitcoin, Ethereum, etc."
                      value={asset.description}
                      onChange={(e) => updateAsset(asset.id, 'description', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Current Value *</Label>
                    <CurrencyInput
                      value={asset.value}
                      onChange={(val) => updateAsset(asset.id, 'value', val || 0)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Valuation Date *</Label>
                    <Input
                      type="date"
                      value={asset.value_date || ''}
                      onChange={(e) => updateAsset(asset.id, 'value_date', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </ItemCard>
            ))}
            
            <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg">
              <span className="font-semibold text-gray-900">Total Other Assets Value</span>
              <span className="text-xl font-bold text-pink-600">
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            <Button onClick={addAsset} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Another Asset
            </Button>
          </>
        )}
      </div>
    </SectionCard>
  );
}
