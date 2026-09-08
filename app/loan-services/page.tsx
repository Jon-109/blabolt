import type { Metadata } from 'next';

import LoanServicesPageClient from './LoanServicesPageClient';

const pageUrl = 'https://www.businesslendingadvocate.com/loan-services';

export const metadata: Metadata = {
  title: 'Business Loan Packaging Dashboard and Loan Brokering Services',
  description: 'Build a lender-ready business loan package with a guided dashboard, five financial templates, a document checklist, lender cover letter, secure sharing, and optional loan brokering.',
  keywords: [
    'business loan packaging',
    'loan packaging dashboard',
    'SBA loan packaging',
    'business loan document checklist',
    'lender ready loan package',
    'small business loan broker',
    'SBA Form 413',
  ],
  alternates: { canonical: pageUrl },
  openGraph: {
    siteName: 'Business Lending Advocate',
    title: 'Build a Lender-Ready Business Loan Package',
    description: 'Organize the request, complete lender financials, create the cover letter, and securely deliver one coherent loan package.',
    url: pageUrl,
    type: 'website',
    images: [{ url: '/images/business-loan-readiness-cover.png', width: 1200, height: 630, alt: 'Business loan packaging dashboard and lender-ready file' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Business Loan Packaging Dashboard and Brokering',
    description: 'Explore the guided workflow for creating and delivering a lender-ready business loan package.',
    images: ['/images/business-loan-readiness-cover.png'],
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Business Loan Packaging and Loan Brokering',
  url: pageUrl,
  provider: {
    '@type': 'Organization',
    name: 'Business Lending Advocate',
    url: 'https://www.businesslendingadvocate.com/',
  },
  description: 'Guided business loan packaging dashboard with financial templates, document organization, lender cover letter, secure delivery, and optional lender outreach.',
  areaServed: 'US',
};

export default function LoanServicesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <LoanServicesPageClient />
    </>
  );
}
