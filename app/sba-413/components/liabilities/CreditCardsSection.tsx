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

interface CreditCardsSectionProps {
  data: LiabilitiesData;
  onChange: (data: LiabilitiesData) => void;
}

export default function CreditCardsSection({ data, onChange }: CreditCardsSectionProps) {
  const addCard = () => {
    onChange({
      ...data,
      credit_cards: [
        ...data.credit_cards,
        { id: generateId(), issuer: '', balance: 0, min_payment: 0 },
      ],
    });
  };

  const removeCard = (id: string) => {
    onChange({
      ...data,
      credit_cards: data.credit_cards.filter((card) => card.id !== id),
    });
  };

  const updateCard = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      credit_cards: data.credit_cards.map((card) =>
        card.id === id ? { ...card, [field]: value } : card
      ),
    });
  };

  const totalBalance = data.credit_cards.reduce((sum, card) => sum + (card.balance || 0), 0);
  const totalMinPayment = data.credit_cards.reduce((sum, card) => sum + (card.min_payment || 0), 0);

  return (
    <SectionCard
      icon="💳"
      title="Credit Cards"
      description="Current balances on business and personal credit cards"
    >
      <div className="space-y-4">
        {data.credit_cards.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No credit cards added yet</p>
            <Button onClick={addCard} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Credit Card
            </Button>
          </div>
        ) : (
          <>
            {data.credit_cards.map((card, index) => (
              <ItemCard
                key={card.id}
                index={index}
                title={`Credit Card #${index + 1}`}
                onRemove={() => removeCard(card.id)}
              >
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Issuer/Bank</Label>
                    <Input
                      placeholder="Chase, Amex, etc."
                      value={card.issuer}
                      onChange={(e) => updateCard(card.id, 'issuer', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Current Balance *</Label>
                    <CurrencyInput
                      value={card.balance}
                      onChange={(val) => updateCard(card.id, 'balance', val || 0)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Minimum Payment *</Label>
                    <CurrencyInput
                      value={card.min_payment}
                      onChange={(val) => updateCard(card.id, 'min_payment', val || 0)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </ItemCard>
            ))}
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <span className="font-semibold text-gray-900">Total Balance</span>
                <span className="text-xl font-bold text-red-600">
                  ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <span className="font-semibold text-gray-900">Total Min Payment</span>
                <span className="text-xl font-bold text-orange-600">
                  ${totalMinPayment.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            <Button onClick={addCard} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Another Credit Card
            </Button>
          </>
        )}
      </div>
    </SectionCard>
  );
}
