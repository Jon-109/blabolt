import type { TemplateType } from '@/lib/templates/types';

export type StripeCheckoutProductType =
  | TemplateType
  | 'templates_bundle'
  | 'loan_packaging'
  | 'cash_flow_analysis';

export const TEMPLATE_TYPES: TemplateType[] = [
  'balance_sheet',
  'income_statement',
  'business_debt_summary',
  'personal_financial_statement',
  'personal_debt_summary',
];

export function isTemplateType(value: string): value is TemplateType {
  return TEMPLATE_TYPES.includes(value as TemplateType);
}

export function isStripeCheckoutProductType(value: string): value is StripeCheckoutProductType {
  return value === 'templates_bundle' || value === 'loan_packaging' || value === 'cash_flow_analysis' || isTemplateType(value);
}
