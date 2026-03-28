import 'server-only';

import type { StripeCheckoutProductType } from '@/lib/stripe/catalog';

type StripeCheckoutProductConfig = {
  cancelPath: string;
  priceId?: string;
  productId?: string;
  successPath: string;
};

const STRIPE_CHECKOUT_PRODUCT_CONFIGS: Record<StripeCheckoutProductType, StripeCheckoutProductConfig> = {
  balance_sheet: {
    priceId: process.env.STRIPE_PRICE_ID_BALANCE_SHEET,
    productId: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID_BALANCE_SHEET,
    successPath: '/templates?template=balance_sheet',
    cancelPath: '/services/templates/balance-sheet',
  },
  income_statement: {
    priceId: process.env.STRIPE_PRICE_ID_INCOME_STATEMENT,
    productId: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID_INCOME_STATEMENT,
    successPath: '/templates?template=income_statement',
    cancelPath: '/services/templates/income-statement',
  },
  business_debt_summary: {
    priceId: process.env.STRIPE_PRICE_ID_BUSINESS_DEBT_SUMMARY,
    productId: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID_BUSINESS_DEBT_SUMMARY,
    successPath: '/templates?template=business_debt_summary',
    cancelPath: '/services/templates/business-debt-summary',
  },
  personal_financial_statement: {
    priceId: process.env.STRIPE_PRICE_ID_PERSONAL_FINANCIAL_STATEMENT,
    productId: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID_PERSONAL_FINANCIAL_STATEMENT,
    successPath: '/templates?template=personal_financial_statement',
    cancelPath: '/services/templates/personal-financial-statement',
  },
  personal_debt_summary: {
    priceId: process.env.STRIPE_PRICE_ID_PERSONAL_DEBT_SUMMARY,
    productId: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID_PERSONAL_DEBT_SUMMARY,
    successPath: '/templates?template=personal_debt_summary',
    cancelPath: '/services/templates/personal-debt-summary',
  },
  templates_bundle: {
    priceId: process.env.STRIPE_PRICE_ID_TEMPLATES_BUNDLE,
    productId: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID_TEMPLATES_BUNDLE,
    successPath: '/templates',
    cancelPath: '/services/templates-bundle',
  },
  loan_packaging: {
    priceId: process.env.STRIPE_PRICE_ID_LOAN_PACKAGING,
    productId: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID_LOAN_PACKAGING,
    successPath: '/loan-packaging',
    cancelPath: '/loan-services?cancelled=true',
  },
  cash_flow_analysis: {
    priceId: process.env.STRIPE_PRICE_ID_CASH_FLOW_ANALYSIS,
    productId: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID_CASH_FLOW_ANALYSIS,
    successPath: '/comprehensive-cash-flow-analysis',
    cancelPath: '/cash-flow-analysis?cancelled=true',
  },
};

export function getStripeCheckoutProductConfig(productType: StripeCheckoutProductType) {
  const config = STRIPE_CHECKOUT_PRODUCT_CONFIGS[productType];

  if (!config.priceId || !config.productId) {
    throw new Error(`Missing Stripe checkout configuration for ${productType}`);
  }

  return {
    ...config,
    priceId: config.priceId,
    productId: config.productId,
  };
}

export function getSiteUrl(): string {
  return (
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  );
}
