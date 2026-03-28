import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import PersonalDebtSummaryServiceClient from './PersonalDebtSummaryServiceClient';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Personal Debt Summary Template Service | Lender-Ready Debt Schedule',
  description:
    'Build a lender-ready Personal Debt Summary in minutes. Guided form flow, organized debt categories, and polished output designed for financing review.',
  alternates: {
    canonical: '/services/templates/personal-debt-summary',
  },
};

export default function PersonalDebtSummaryServicePage() {
  return (
    <div className={spaceGrotesk.className}>
      <PersonalDebtSummaryServiceClient />
    </div>
  );
}
