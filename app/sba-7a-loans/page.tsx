import type { Metadata } from 'next';

import SBA7aPageClient from './SBA7aPageClient';

const pageUrl = 'https://www.businesslendingadvocate.com/sba-7a-loans';

export const metadata: Metadata = {
  title: 'SBA 7(a) Loans Explained | Benefits, Drawbacks, Terms, and Process',
  description: 'Understand how SBA 7(a) loans work, eligible uses, repayment terms, lender guarantees, equity and collateral considerations, required documents, and the application process.',
  keywords: [
    'SBA 7a loans',
    'SBA loan requirements',
    'SBA 7a loan terms',
    'SBA loan application process',
    'SBA Form 413',
    'SBA loan packaging',
    'small business acquisition loan',
    'SBA working capital loan',
  ],
  alternates: { canonical: pageUrl },
  openGraph: {
    siteName: 'Business Lending Advocate',
    title: 'SBA 7(a) Loans: A Clear Borrower Guide',
    description: 'Learn what the SBA guarantee does, where 7(a) financing can help, the practical tradeoffs, and how to prepare a lender-ready request.',
    url: pageUrl,
    type: 'website',
    images: [{ url: '/images/business-loan-readiness-cover.png', width: 1200, height: 630, alt: 'SBA 7(a) borrower preparation guide' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SBA 7(a) Loans: A Clear Borrower Guide',
    description: 'Understand SBA 7(a) benefits, drawbacks, eligibility, terms, documentation, and the lender application process.',
    images: ['/images/business-loan-readiness-cover.png'],
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'SBA 7(a) Loans Explained',
  url: pageUrl,
  description: 'Educational borrower guide to SBA 7(a) loan uses, terms, eligibility, tradeoffs, documentation, and application preparation.',
  about: {
    '@type': 'FinancialProduct',
    name: 'SBA 7(a) Loan',
    provider: { '@type': 'GovernmentOrganization', name: 'U.S. Small Business Administration', url: 'https://www.sba.gov/' },
  },
};

export default function SBA7aLoansPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <SBA7aPageClient />
    </>
  );
}
