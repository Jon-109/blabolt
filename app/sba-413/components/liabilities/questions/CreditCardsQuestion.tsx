'use client';

import { LiabilitiesData } from '../../../types';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';
import { Plus, X } from 'lucide-react';
import QuestionCard from '../shared/QuestionCard';
import CurrencyInput from '../../shared/CurrencyInput';
import { generateId } from '../../../utils/calculations';

interface CreditCardsQuestionProps {
  data: LiabilitiesData;
  onChange: (data: LiabilitiesData) => void;
  onAnswerChange?: (hasDebt: boolean) => void;
}

export default function CreditCardsQuestion({ data, onChange, onAnswerChange }: CreditCardsQuestionProps) {
  const addCard = () => {
    onChange({
      ...data,
      credit_cards: [
        ...data.credit_cards,
        {
          id: generateId(),
          issuer: '',
          balance: 0,
          min_payment: 0,
        },
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

  return (
    <QuestionCard
      icon="💳"
      title="Do you currently owe money on any credit cards or personal lines of credit?"
      description="Include any balances you plan to pay off over time, even if you make minimum payments."
      examples="Visa, Mastercard, store credit cards, or revolving credit lines."
      onAnswerChange={onAnswerChange}
    >
      {/* Credit Card Entries */}
      {data.credit_cards.length === 0 ? (
        <div className="text-center py-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
          <p className="text-slate-600 mb-3">No credit cards added yet</p>
          <Button onClick={addCard} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Credit Card
          </Button>
        </div>
      ) : (
        <>
          {data.credit_cards.map((card, index) => (
            <div key={card.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-bold text-slate-900">Card #{index + 1}</h5>
                <button
                  onClick={() => removeCard(card.id)}
                  className="text-red-600 hover:text-red-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Card Issuer *</Label>
                  <Input
                    placeholder="e.g., Chase, Amex"
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
                  <Label>Typical Monthly Payment *</Label>
                  <CurrencyInput
                    value={card.min_payment}
                    onChange={(val) => updateCard(card.id, 'min_payment', val || 0)}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-lg">
            <span className="font-bold text-slate-900">Total Credit Card Debt</span>
            <span className="text-xl font-bold text-rose-600">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          <Button onClick={addCard} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Card
          </Button>
        </>
      )}
    </QuestionCard>
  );
}
