import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import IncomeStatementServiceClient from './IncomeStatementServiceClient';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Income Statement Template Service | Lender-Ready P&L',
  description:
    'Generate a lender-ready Income Statement with guided inputs and polished output formatting. Built for underwriting review and loan package readiness.',
  alternates: {
    canonical: '/services/templates/income-statement',
  },
};

export default function IncomeStatementServicePage() {
  return (
    <div className={spaceGrotesk.className}>
      <IncomeStatementServiceClient />
    </div>
  );
}
