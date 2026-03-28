import PersonalDebtSummarySvgTemplate from '@/app/(components)/templates/PersonalDebtSummarySvgTemplate';
import type { PersonalDebtSummaryData } from '@/lib/templates/types';

const sampleData: PersonalDebtSummaryData = {
  asOfDate: new Date().toISOString().split('T')[0] as string,
  personalInfo: {
    name: 'Jane Borrower',
  },
  debts: [
    {
      category: 'credit_cards',
      creditor: 'Chase Sapphire Preferred',
      originalAmount: 0,
      currentBalance: 4200,
      monthlyPayment: 160,
      creditLimit: 12000,
    },
    {
      category: 'credit_cards',
      creditor: 'Amex Everyday',
      originalAmount: 0,
      currentBalance: 1800,
      monthlyPayment: 75,
      creditLimit: 8000,
    },
    {
      category: 'line_of_credit',
      creditor: 'Personal LOC - First Republic',
      originalAmount: 0,
      currentBalance: 6500,
      monthlyPayment: 195,
      creditLimit: 20000,
    },
    {
      category: 'real_estate',
      creditor: 'Primary Home Mortgage - Rocket',
      originalAmount: 0,
      currentBalance: 348000,
      monthlyPayment: 2790,
    },
    {
      category: 'student_debt',
      creditor: 'Federal Loan - Nelnet',
      originalAmount: 0,
      currentBalance: 24000,
      monthlyPayment: 320,
    },
    {
      category: 'vehicle',
      creditor: '2023 SUV - Capital One Auto',
      originalAmount: 0,
      currentBalance: 26500,
      monthlyPayment: 590,
    },
    {
      category: 'other_debt',
      creditor: 'Personal Loan - SoFi',
      originalAmount: 0,
      currentBalance: 9200,
      monthlyPayment: 305,
    },
  ],
  notes: '',
};

export default function PersonalDebtSummarySvgTestPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Personal Debt Summary SVG Preview</h1>
      <p className="mb-6 text-sm text-slate-600">Template size is standard US letter (8.5 x 11) for clean PDF conversion.</p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-100 p-4">
        <div className="mx-auto w-[816px] bg-white shadow-lg">
          <PersonalDebtSummarySvgTemplate data={sampleData} />
        </div>
      </div>
    </main>
  );
}
