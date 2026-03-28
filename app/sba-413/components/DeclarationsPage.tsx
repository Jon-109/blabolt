'use client';

import { DeclarationsData } from '../types';
import { Button } from '@/app/(components)/ui/button';
import { Label } from '@/app/(components)/ui/label';
import { Textarea } from '@/app/(components)/ui/textarea';
import { ChevronRight } from 'lucide-react';
import SectionCard from './shared/SectionCard';

interface DeclarationsPageProps {
  data: DeclarationsData;
  onChange: (data: DeclarationsData) => void;
  onNext: () => void;
}

export default function DeclarationsPage({ data, onChange, onNext }: DeclarationsPageProps) {
  const declarations = [
    {
      id: 'lawsuits_or_judgments',
      question: 'Are you a party to any lawsuit or judgment?',
      detailsField: 'lawsuits_details',
    },
    {
      id: 'bankruptcy_history',
      question: 'Have you ever filed for bankruptcy?',
      detailsField: 'bankruptcy_details',
    },
    {
      id: 'unlisted_leases_or_contracts',
      question: 'Do you have any leases or contracts not listed above?',
      detailsField: 'leases_details',
    },
    {
      id: 'partner_officer_elsewhere',
      question: 'Are you a partner, officer, or director in any other business?',
      detailsField: 'partner_details',
    },
    {
      id: 'jointly_held_or_trust_assets',
      question: 'Do you have assets held jointly or in trust?',
      detailsField: 'joint_trust_details',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Declarations & Signatures</h2>
        <p className="text-gray-600">Final disclosures required for SBA Form 413</p>
      </div>

      <SectionCard icon="📋" title="Declarations" description="Please answer these questions truthfully">
        <div className="space-y-6">
          {declarations.map((decl) => (
            <div key={decl.id} className="border-b pb-6 last:border-b-0">
              <div className="flex items-center gap-4 mb-3">
                <Label className="text-base font-medium flex-1">{decl.question}</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={decl.id}
                      checked={data[decl.id as keyof DeclarationsData] === true}
                      onChange={() => onChange({ ...data, [decl.id]: true })}
                      className="w-4 h-4"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={decl.id}
                      checked={data[decl.id as keyof DeclarationsData] === false}
                      onChange={() => onChange({ ...data, [decl.id]: false })}
                      className="w-4 h-4"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>
              {data[decl.id as keyof DeclarationsData] === true && (
                <Textarea
                  placeholder="Please provide details..."
                  value={(data[decl.detailsField as keyof DeclarationsData] as string) || ''}
                  onChange={(e) => onChange({ ...data, [decl.detailsField]: e.target.value })}
                  rows={3}
                  className="mt-2"
                />
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon="✍️" title="Signatures" description="Digital signature capture coming soon">
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">Signature canvas will be implemented here</p>
          <p className="text-sm text-gray-500">Will include signature pads for applicant (and spouse if joint)</p>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
        >
          Continue to Review
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
