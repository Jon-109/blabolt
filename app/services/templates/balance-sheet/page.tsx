import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import BalanceSheetServiceClient from './BalanceSheetServiceClient';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Balance Sheet Template Service | Lender-Ready Financial Statement',
  description:
    'Generate a lender-ready Balance Sheet with guided inputs and polished output formatting. Built for underwriting review and loan package readiness.',
  alternates: {
    canonical: '/services/templates/balance-sheet',
  },
};

export default function BalanceSheetServicePage() {
  return (
    <div className={spaceGrotesk.className}>
      <BalanceSheetServiceClient />
    </div>
  );
}
