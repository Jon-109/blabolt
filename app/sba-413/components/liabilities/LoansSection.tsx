'use client';

import { LiabilitiesData } from '../../types';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';
import { Plus } from 'lucide-react';
import SectionCard from '../shared/SectionCard';
import ItemCard from '../shared/ItemCard';
import CurrencyInput from '../shared/CurrencyInput';
import { generateId } from '../../utils/calculations';

interface LoansSectionProps {
  data: LiabilitiesData;
  onChange: (data: LiabilitiesData) => void;
}

export default function LoansSection({ data, onChange }: LoansSectionProps) {
  const addLoan = () => {
    onChange({
      ...data,
      notes_loans: [
        ...data.notes_loans,
        {
          id: generateId(),
          lender_name: '',
          lender_address: '',
          original_amount: 0,
          current_balance: 0,
          payment_amount: 0,
          payment_frequency: 'monthly',
          secured: false,
          maturity_date: '',
          status: 'current',
        },
      ],
    });
  };

  const removeLoan = (id: string) => {
    onChange({
      ...data,
      notes_loans: data.notes_loans.filter((loan) => loan.id !== id),
    });
  };

  const updateLoan = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      notes_loans: data.notes_loans.map((loan) =>
        loan.id === id ? { ...loan, [field]: value } : loan
      ),
    });
  };

  const totalBalance = data.notes_loans.reduce((sum, loan) => sum + (loan.current_balance || 0), 0);

  return (
    <SectionCard
      icon="📄"
      title="Notes & Loans (Section 2)"
      description="Personal loans, lines of credit, etc."
    >
      <div className="space-y-4">
        {data.notes_loans.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No loans added yet</p>
            <Button onClick={addLoan} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Loan
            </Button>
          </div>
        ) : (
          <>
            {data.notes_loans.map((loan, index) => (
              <ItemCard
                key={loan.id}
                index={index}
                title={`Loan #${index + 1}`}
                onRemove={() => removeLoan(loan.id)}
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Lender Name *</Label>
                    <Input
                      placeholder="Bank, credit union, etc."
                      value={loan.lender_name}
                      onChange={(e) => updateLoan(loan.id, 'lender_name', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Lender Address</Label>
                    <Input
                      placeholder="City, State"
                      value={loan.lender_address}
                      onChange={(e) => updateLoan(loan.id, 'lender_address', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Original Amount</Label>
                    <CurrencyInput
                      value={loan.original_amount}
                      onChange={(val) => updateLoan(loan.id, 'original_amount', val || 0)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Current Balance *</Label>
                    <CurrencyInput
                      value={loan.current_balance}
                      onChange={(val) => updateLoan(loan.id, 'current_balance', val || 0)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Payment Amount *</Label>
                    <CurrencyInput
                      value={loan.payment_amount}
                      onChange={(val) => updateLoan(loan.id, 'payment_amount', val || 0)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Payment Frequency *</Label>
                    <select
                      value={loan.payment_frequency}
                      onChange={(e) => updateLoan(loan.id, 'payment_frequency', e.target.value)}
                      className="mt-2 w-full h-10 px-3 rounded-md border border-gray-300"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>
                  <div>
                    <Label>Maturity Date</Label>
                    <Input
                      type="date"
                      value={loan.maturity_date}
                      onChange={(e) => updateLoan(loan.id, 'maturity_date', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <select
                      value={loan.status}
                      onChange={(e) => updateLoan(loan.id, 'status', e.target.value)}
                      className="mt-2 w-full h-10 px-3 rounded-md border border-gray-300"
                    >
                      <option value="current">Current</option>
                      <option value="late">Late</option>
                      <option value="default">Default</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex items-center mt-2">
                    <input
                      type="checkbox"
                      id={`secured-${loan.id}`}
                      checked={loan.secured}
                      onChange={(e) => updateLoan(loan.id, 'secured', e.target.checked)}
                      className="w-4 h-4 mr-2"
                    />
                    <Label htmlFor={`secured-${loan.id}`} className="cursor-pointer">
                      Secured loan (has collateral)
                    </Label>
                  </div>
                  {loan.secured && (
                    <div className="md:col-span-2">
                      <Label>Collateral Description</Label>
                      <Input
                        placeholder="E.g., Vehicle, equipment, etc."
                        value={loan.collateral_desc || ''}
                        onChange={(e) => updateLoan(loan.id, 'collateral_desc', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>
              </ItemCard>
            ))}
            
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <span className="font-semibold text-gray-900">Total Loan Balance</span>
              <span className="text-xl font-bold text-red-600">
                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            <Button onClick={addLoan} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Another Loan
            </Button>
          </>
        )}
      </div>
    </SectionCard>
  );
}
