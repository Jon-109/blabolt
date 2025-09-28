export interface LoanPurpose {
  title: string;
  description: string;
  defaultTerm: number; // in months
  defaultRate: number; // annual interest rate as decimal
  defaultDownPaymentPct?: number; // down payment percentage as decimal (0.1 = 10%)
}

export const loanPurposes: Record<string, LoanPurpose> = {
  'Working Capital': {
    title: 'Working Capital',
    description: 'To cover day-to-day operational expenses, including payroll, inventory, and other recurring costs.',
    defaultTerm: 24,
    defaultRate: 0.08,
    defaultDownPaymentPct: 0.0
  },
  'Equipment Purchase': {
    title: 'Equipment Purchase',
    description: 'For acquiring machinery, tools, or other business equipment to improve operations.',
    defaultTerm: 60,
    defaultRate: 0.07,
    defaultDownPaymentPct: 0.1
  },
  'Vehicle Purchase': {
    title: 'Vehicle Purchase',
    description: 'To finance company vehicles, delivery trucks, or other business-related transportation.',
    defaultTerm: 60,
    defaultRate: 0.065,
    defaultDownPaymentPct: 0.15
  },
  'Inventory Purchase': {
    title: 'Inventory Purchase',
    description: 'To stock up on inventory, raw materials, or supplies for your business.',
    defaultTerm: 12,
    defaultRate: 0.08,
    defaultDownPaymentPct: 0.0
  },
  'Debt Refinancing': {
    title: 'Debt Refinancing',
    description: 'To consolidate existing business debts into a single loan with better terms.',
    defaultTerm: 60,
    defaultRate: 0.075,
    defaultDownPaymentPct: 0.0
  },
  'Real Estate Acquisition or Development': {
    title: 'Real Estate Acquisition or Development',
    description: 'For purchasing, renovating, or developing commercial real estate.',
    defaultTerm: 120,
    defaultRate: 0.06,
    defaultDownPaymentPct: 0.2
  },
  'Business Acquisition': {
    title: 'Business Acquisition',
    description: 'To finance the purchase of an existing business or franchise.',
    defaultTerm: 84,
    defaultRate: 0.075,
    defaultDownPaymentPct: 0.2
  },
  'Unexpected Expenses': {
    title: 'Unexpected Expenses',
    description: 'To cover unforeseen business costs or emergency situations.',
    defaultTerm: 36,
    defaultRate: 0.09,
    defaultDownPaymentPct: 0.0
  },
  'Line of Credit': {
    title: 'Line of Credit',
    description: 'Flexible access to funds with interest-only payments. Draw from as needed to manage expenses or seize business opportunities.',
    defaultTerm: 12,
    defaultRate: 0.10,
    defaultDownPaymentPct: 0.0
  }
}
