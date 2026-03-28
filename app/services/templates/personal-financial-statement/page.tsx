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
    'Generate a complete Personal Financial Statement in SBA Form 413 format. Instant downloadable PDF output in the lender-preferred structure for SBA and conventional underwriting workflows.',
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
