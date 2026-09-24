import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import PersonalFinancialStatementServiceClient from './PersonalFinancialStatementServiceClient';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Personal Financial Statement (SBA Form 413) Template Service',
  description:
    'Complete the current SBA Form 413 Personal Financial Statement through a guided intake with secure saves, validation, e-signature, and lender-ready PDF output.',
  alternates: {
    canonical: '/services/templates/personal-financial-statement',
  },
};

export default function PersonalFinancialStatementServicePage() {
  return (
    <div className={spaceGrotesk.className}>
      <PersonalFinancialStatementServiceClient />
    </div>
  );
}
