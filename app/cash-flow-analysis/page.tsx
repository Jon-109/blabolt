import type { Metadata } from 'next';

import CashFlowAnalysisPageClient from './CashFlowAnalysisPageClient';

const cashFlowPageUrl = 'https://www.businesslendingadvocate.com/cash-flow-analysis';
const cashFlowOgImage = 'https://www.businesslendingadvocate.com/images/business-loan-readiness-cover.png';

const faqSchemaItems = [
  {
    question: 'Is the comprehensive analysis really free?',
    answer: 'Yes. The complete bank-level workflow and both PDF reports are free with an account. There is no credit pull.',
  },
  {
    question: 'What does bank-level mean?',
    answer:
      'The workflow uses the deeper inputs and repayment concepts commonly reviewed in business lending. It is not a loan approval or a substitute for a lender’s underwriting.',
  },
  {
    question: 'Why is the comprehensive analysis better than the quick check?',
    answer:
      'The quick check uses a current snapshot and does not evaluate add-backs. The comprehensive analysis reviews multiple historical periods and year-to-date results, considers supported add-backs that may improve lender-adjusted cash flow and DSCR, and includes existing debts.',
  },
  {
    question: 'Can I submit the reports with a loan application?',
    answer:
      'Yes. The cash-flow analysis and business debt summary can be included with a loan package to give the lender an organized repayment picture upfront. The lender will still verify the information and complete its own underwriting.',
  },
];

export const metadata: Metadata = {
  title: 'Free DSCR Calculator and Bank-Level Cash Flow Analysis',
  description:
    'Check DSCR quickly or complete a free bank-level cash flow analysis with multi-period financials, supported add-backs, business debt review, and downloadable loan-package reports.',
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
    title: 'Free DSCR Calculator and Bank-Level Cash Flow Analysis',
    description:
      'Start with a quick DSCR estimate or complete the full lender-style cash flow and business debt analysis for free.',
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
    title: 'Free DSCR Calculator and Bank-Level Cash Flow Analysis',
    description:
      'Start with a quick DSCR estimate or complete the full lender-style cash flow and business debt analysis for free.',
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
      name: 'Free DSCR Calculator and Bank-Level Cash Flow Analysis',
      description:
        'Check DSCR quickly or complete a free bank-level cash flow analysis with multi-period financials, supported add-backs, business debts, and downloadable loan-package reports.',
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
