import type { Metadata } from 'next';

import HomePageClient from './HomePageClient';

const homePageUrl = 'https://www.businesslendingadvocate.com/';
const homeOgImage = 'https://www.businesslendingadvocate.com/images/hero.png';

export const metadata: Metadata = {
  title: 'Business Loan Readiness, Free Cash Flow Analysis, and Loan Packaging',
  description:
    'Analyze business loan repayment strength for free, create lender-ready financial documents including SBA Form 413, and build one organized loan package.',
  keywords: [
    'free DSCR calculator',
    'business loan calculator',
    'debt service coverage ratio',
    'business loan packaging',
    'free cash flow analysis',
    'SBA Form 413',
    'SBA 7a loan packaging',
    'lender ready financial templates',
    'small business funding',
    'loan readiness',
  ],
  alternates: {
    canonical: homePageUrl,
  },
  category: 'finance',
  openGraph: {
    siteName: 'Business Lending Advocate',
    title: 'Know What Lenders Will See Before You Apply',
    description:
      'Run a free bank-level cash flow analysis, create SBA and lender-ready documents, and build one organized business loan package.',
    url: homePageUrl,
    type: 'website',
    images: [
      {
        url: homeOgImage,
        width: 1200,
        height: 630,
        alt: 'Business Lending Advocate home page',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Know What Lenders Will See Before You Apply',
    description:
      'Run a free bank-level cash flow analysis, create SBA and lender-ready documents, and build one organized business loan package.',
    images: [homeOgImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

const homePageSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${homePageUrl}#organization`,
      name: 'Business Lending Advocate',
      url: homePageUrl,
      logo: 'https://www.businesslendingadvocate.com/images/Logo.png',
      description:
        'Business loan guidance focused on DSCR analysis, loan packaging, and lender-readiness support for small-business owners.',
    },
    {
      '@type': 'WebSite',
      '@id': `${homePageUrl}#website`,
      url: homePageUrl,
      name: 'Business Lending Advocate',
      inLanguage: 'en-US',
      publisher: {
        '@id': `${homePageUrl}#organization`,
      },
    },
    {
      '@type': 'WebPage',
      '@id': `${homePageUrl}#webpage`,
      url: homePageUrl,
      name: 'Business Loan Readiness, Free Cash Flow Analysis, and Loan Packaging',
      description:
        'Analyze repayment strength for free, create lender-ready financial documents including SBA Form 413, and build one organized business loan package.',
      inLanguage: 'en-US',
      isPartOf: {
        '@id': `${homePageUrl}#website`,
      },
      about: {
        '@id': `${homePageUrl}#organization`,
      },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: [
          {
            '@type': 'Service',
            position: 1,
            name: 'Free DSCR Calculator',
            serviceType: 'Debt service coverage ratio calculator',
            url: 'https://www.businesslendingadvocate.com/cash-flow-analysis',
            description: 'Quick first-pass debt service coverage ratio estimate for business loan readiness.',
          },
          {
            '@type': 'Service',
            position: 2,
            name: 'Free Bank-Level Cash Flow Analysis',
            serviceType: 'Business cash flow analysis',
            url: 'https://www.businesslendingadvocate.com/comprehensive-cash-flow-analysis',
            description: 'Free lender-style cash flow review with historical context, DSCR analysis, debt summary, and downloadable PDF reports.',
          },
          {
            '@type': 'Service',
            position: 3,
            name: 'Loan Packaging Dashboard and Templates',
            serviceType: 'Loan packaging service',
            url: 'https://www.businesslendingadvocate.com/loan-packaging',
            description: 'Guided document preparation, templates, and lender-ready packaging support.',
          },
        ],
      },
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homePageSchema) }}
      />
      <HomePageClient />
    </>
  );
}
