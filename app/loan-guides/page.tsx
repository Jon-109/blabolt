import type { Metadata } from 'next';

import LoanGuidesClient from './LoanGuidesClient';
import { loanGuides } from '@/lib/loanGuides';

const pageUrl = 'https://www.businesslendingadvocate.com/loan-guides';

export const metadata: Metadata = {
  title: 'Business Loan Guides by Purpose | Process, Requirements, Documents, and Approval Tips',
  description:
    'Choose your business loan purpose and learn the process, lender requirements, required documents, common decline reasons, and preparation tips before you apply.',
  keywords: [
    'business loan guides',
    'business loan requirements',
    'business loan documents',
    'small business loan process',
    'loan purpose guide',
    'business funding tips',
  ],
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: 'Business Loan Guides by Purpose',
    description:
      'Learn what lenders expect for your specific loan purpose, from required documents to common decline reasons and preparation tips.',
    url: pageUrl,
    type: 'website',
    images: [
      {
        url: 'https://www.businesslendingadvocate.com/images/hero.png',
        width: 1200,
        height: 630,
        alt: 'Business loan guides by purpose',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Business Loan Guides by Purpose',
    description: 'Choose your loan purpose and learn the documents, lender process, approval risks, and preparation tips.',
    images: ['https://www.businesslendingadvocate.com/images/hero.png'],
  },
};

const schema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Business Loan Guides by Purpose',
  description: metadata.description,
  url: pageUrl,
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: loanGuides.map((guide, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: guide.title,
      url: `${pageUrl}/${guide.slug}`,
      description: guide.metaDescription,
    })),
  },
};

export default function LoanGuidesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <LoanGuidesClient guides={loanGuides} />
    </>
  );
}
