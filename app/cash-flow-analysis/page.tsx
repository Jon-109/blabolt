import type { Metadata } from 'next';

import CashFlowAnalysisPageClient from './CashFlowAnalysisPageClient';

const cashFlowPageUrl = 'https://www.businesslendingadvocate.com/cash-flow-analysis';
const cashFlowOgImage = 'https://www.businesslendingadvocate.com/images/business-loan-readiness-cover.png';

const faqSchemaItems = [
  {
    question: 'Will this affect my credit?',
    answer: 'No. The quick DSCR check is only a financial estimate and does not trigger a credit pull.',
  },
  {
    question: 'When should I use the full analysis?',
    answer:
      'Use it when the request looks close, when you want a more lender-like read, or when you need a stronger report before packaging or applying.',
  },
  {
    question: 'What happens after the analysis?',
    answer:
      'If the numbers support it, the next smart move is usually organizing the file, tightening the story, and preparing the package lenders expect.',
  },
];

export const metadata: Metadata = {
  title: 'Free DSCR Calculator | Business Cash Flow Analysis and Loan Readiness Check',
  description:
    'Use our free DSCR calculator to estimate business loan repayment strength, understand debt service coverage, and decide whether to move into a deeper lender-style cash flow review.',
  keywords: [
    'free DSCR calculator',
    'business DSCR calculator',
    'cash flow analysis',
    'debt service coverage ratio',
    'business loan readiness',
    'loan qualification',
    'business funding analysis',
  ],
  alternates: {
    canonical: cashFlowPageUrl,
  },
  category: 'finance',
  openGraph: {
    siteName: 'Business Lending Advocate',
    title: 'Free DSCR Calculator and Business Cash Flow Analysis',
    description:
      'Check your debt service coverage ratio fast, understand how lenders may read the request, and decide whether to go deeper.',
    url: cashFlowPageUrl,
    type: 'website',
    images: [
      {
        url: cashFlowOgImage,
        width: 1200,
        height: 630,
        alt: 'Free DSCR calculator and cash flow analysis',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free DSCR Calculator and Business Cash Flow Analysis',
    description:
      'Check your debt service coverage ratio fast, understand how lenders may read the request, and decide whether to go deeper.',
    images: [cashFlowOgImage],
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

const cashFlowPageSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://www.businesslendingadvocate.com/#organization',
      name: 'Business Lending Advocate',
      url: 'https://www.businesslendingadvocate.com/',
      logo: 'https://www.businesslendingadvocate.com/images/Logo.png',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.businesslendingadvocate.com/#website',
      url: 'https://www.businesslendingadvocate.com/',
      name: 'Business Lending Advocate',
      inLanguage: 'en-US',
      publisher: {
        '@id': 'https://www.businesslendingadvocate.com/#organization',
      },
    },
    {
      '@type': 'WebPage',
      '@id': `${cashFlowPageUrl}#webpage`,
      url: cashFlowPageUrl,
      name: 'Free DSCR Calculator | Business Cash Flow Analysis and Loan Readiness Check',
      description:
        'Use our free DSCR calculator to estimate business loan repayment strength, understand debt service coverage, and decide whether to move into a deeper lender-style cash flow review.',
      inLanguage: 'en-US',
      isPartOf: {
        '@id': 'https://www.businesslendingadvocate.com/#website',
      },
      mainEntity: {
        '@id': `${cashFlowPageUrl}#calculator`,
      },
    },
    {
      '@type': 'WebApplication',
      '@id': `${cashFlowPageUrl}#calculator`,
      name: 'Free High-Level DSCR Calculator',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      provider: {
        '@id': 'https://www.businesslendingadvocate.com/#organization',
      },
      description:
        'A free web-based DSCR calculator for estimating debt service coverage ratio, payment structure fit, and business loan readiness.',
      featureList: [
        'Free DSCR estimate',
        'Loan payment assumptions by purpose',
        'Debt service breakdown',
        'Range-specific lender read',
        'Next-step guidance',
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${cashFlowPageUrl}#faq`,
      mainEntity: faqSchemaItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${cashFlowPageUrl}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.businesslendingadvocate.com/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Cash Flow Analysis',
          item: cashFlowPageUrl,
        },
      ],
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(cashFlowPageSchema) }}
      />
      <CashFlowAnalysisPageClient />
    </>
  );
}
