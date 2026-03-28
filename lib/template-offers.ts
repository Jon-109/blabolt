export type TemplateOfferSlug =
  | 'balance_sheet'
  | 'income_statement'
  | 'business_debt_summary'
  | 'personal_financial_statement'
  | 'personal_debt_summary';

export type TemplateOffer = {
  slug: TemplateOfferSlug;
  name: string;
  shortDescription: string;
  outcome: string;
  category: 'Business' | 'Personal';
};

export const TEMPLATE_UNIT_PRICE_CENTS = 999;
export const TEMPLATE_BUNDLE_PRICE_CENTS = 2999;
export const TEMPLATE_BUNDLE_LIMIT_PER_TEMPLATE = 5;

export const TEMPLATE_LOGIN_REDIRECT = '/checkout/templates_bundle';
export const BUSINESS_DEBT_TEMPLATE_LOGIN_REDIRECT = '/checkout/business_debt_summary';
export const PERSONAL_DEBT_TEMPLATE_LOGIN_REDIRECT = '/checkout/personal_debt_summary';
export const PERSONAL_FINANCIAL_STATEMENT_TEMPLATE_LOGIN_REDIRECT =
  '/checkout/personal_financial_statement';
export const BALANCE_SHEET_TEMPLATE_LOGIN_REDIRECT = '/checkout/balance_sheet';
export const INCOME_STATEMENT_TEMPLATE_LOGIN_REDIRECT = '/checkout/income_statement';

export const TEMPLATE_CHECKOUT_PATHS: Record<TemplateOfferSlug, string> = {
  balance_sheet: BALANCE_SHEET_TEMPLATE_LOGIN_REDIRECT,
  income_statement: INCOME_STATEMENT_TEMPLATE_LOGIN_REDIRECT,
  business_debt_summary: BUSINESS_DEBT_TEMPLATE_LOGIN_REDIRECT,
  personal_financial_statement: PERSONAL_FINANCIAL_STATEMENT_TEMPLATE_LOGIN_REDIRECT,
  personal_debt_summary: PERSONAL_DEBT_TEMPLATE_LOGIN_REDIRECT,
};

export const TEMPLATE_SERVICE_PAGE_PATHS: Record<TemplateOfferSlug, string> = {
  balance_sheet: '/services/templates/balance-sheet',
  income_statement: '/services/templates/income-statement',
  business_debt_summary: '/services/templates/business-debt-summary',
  personal_financial_statement: '/services/templates/personal-financial-statement',
  personal_debt_summary: '/services/templates/personal-debt-summary',
};

export const TEMPLATE_OFFERS: TemplateOffer[] = [
  {
    slug: 'business_debt_summary',
    name: 'Business Debt Summary',
    shortDescription: 'Map business debt balances and payments in one lender-ready schedule.',
    outcome:
      'A clean debt schedule showing monthly obligations, grouped debt exposure, and repayment pressure.',
    category: 'Business',
  },
  {
    slug: 'balance_sheet',
    name: 'Balance Sheet',
    shortDescription: 'Present business assets, liabilities, and equity with lender-grade structure.',
    outcome: 'A statement that quickly shows net position and leverage at a point in time.',
    category: 'Business',
  },
  {
    slug: 'income_statement',
    name: 'Income Statement',
    shortDescription: 'Organize revenue and expenses into an underwriter-friendly P&L format.',
    outcome: 'A clear profitability snapshot for cash generation and debt repayment analysis.',
    category: 'Business',
  },
  {
    slug: 'personal_financial_statement',
    name: 'Personal Financial Statement',
    shortDescription: 'Provide guarantor net-worth detail in an SBA-aligned structure.',
    outcome: 'A complete personal strength profile used during guarantor underwriting review.',
    category: 'Personal',
  },
  {
    slug: 'personal_debt_summary',
    name: 'Personal Debt Summary',
    shortDescription: 'List personal debt balances and obligations in a fast lender-readable format.',
    outcome: 'A concise guarantor debt profile showing debt burden and monthly commitments.',
    category: 'Personal',
  },
];

export const TEMPLATE_COUNT = TEMPLATE_OFFERS.length;
export const TEMPLATE_A_LA_CARTE_FULL_SET_CENTS = TEMPLATE_UNIT_PRICE_CENTS * TEMPLATE_COUNT;
export const TEMPLATE_BUNDLE_SAVINGS_CENTS = TEMPLATE_A_LA_CARTE_FULL_SET_CENTS - TEMPLATE_BUNDLE_PRICE_CENTS;

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function getTemplateServicePagePath(templateSlug: TemplateOfferSlug): string {
  return TEMPLATE_SERVICE_PAGE_PATHS[templateSlug];
}
