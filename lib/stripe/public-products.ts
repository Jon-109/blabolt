import type { StripeCheckoutProductType } from '@/lib/stripe/catalog';

const PUBLIC_STRIPE_PRODUCT_IDS: Record<StripeCheckoutProductType, string | undefined> = {
  balance_sheet: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID_BALANCE_SHEET,
  income_statement: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID_INCOME_STATEMENT,
  business_debt_summary: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID_BUSINESS_DEBT_SUMMARY,
  personal_financial_statement: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID_PERSONAL_FINANCIAL_STATEMENT,
  personal_debt_summary: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID_PERSONAL_DEBT_SUMMARY,
  templates_bundle: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID_TEMPLATES_BUNDLE,
  loan_packaging: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID_LOAN_PACKAGING,
  cash_flow_analysis: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID_CASH_FLOW_ANALYSIS,
};

export function getPublicStripeProductId(productType: StripeCheckoutProductType): string {
  const productId = PUBLIC_STRIPE_PRODUCT_IDS[productType];

  if (!productId) {
    throw new Error(`Missing NEXT_PUBLIC Stripe product ID for ${productType}`);
  }

  return productId;
}
