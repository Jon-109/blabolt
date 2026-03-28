import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import BusinessDebtSummaryServiceClient from './BusinessDebtSummaryServiceClient';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Business Debt Summary Template Service | Lender-Ready Debt Schedule',
  description:
    'Build a lender-ready Business Debt Summary in minutes. Guided form flow, organized debt categories, and polished output designed for financing review.',
  alternates: {
    canonical: '/services/templates/business-debt-summary',
  },
};

export default function BusinessDebtSummaryServicePage() {
  return (
    <div className={spaceGrotesk.className}>
      <BusinessDebtSummaryServiceClient />
    </div>
  );
}
