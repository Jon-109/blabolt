export interface LoanPurpose {
  title: string;
  description: string;
  defaultTerm: number; // in months
  defaultRate: number; // annual interest rate as decimal
}

export const loanPurposes: Record<string, LoanPurpose> = {
  'Working Capital': {
    title: 'Working Capital',
    description: 'To cover day-to-day operational expenses, including payroll, inventory, and other recurring costs.',
    defaultTerm: 24,
    defaultRate: 0.08
  },
  'Equipment Purchase': {
    title: 'Equipment Purchase',
    description: 'For acquiring machinery, tools, or other business equipment to improve operations.',
    defaultTerm: 60,
    defaultRate: 0.07
  },
  'Vehicle Purchase': {
    title: 'Vehicle Purchase',
    description: 'To finance company vehicles, delivery trucks, or other business-related transportation.',
    defaultTerm: 60,
    defaultRate: 0.065
  },
  'Inventory Purchase': {
    title: 'Inventory Purchase',
    description: 'To stock up on inventory, raw materials, or supplies for your business.',
    defaultTerm: 12,
    defaultRate: 0.08
  },
  'Debt Refinancing': {
    title: 'Debt Refinancing',
    description: 'To consolidate existing business debts into a single loan with better terms.',
    defaultTerm: 60,
    defaultRate: 0.075
  },
  'Real Estate Acquisition or Development': {
    title: 'Real Estate Acquisition or Development',
    description: 'For purchasing, renovating, or developing commercial real estate.',
    defaultTerm: 120,
    defaultRate: 0.06
  },
  'Business Acquisition': {
    title: 'Business Acquisition',
    description: 'To finance the purchase of an existing business or franchise.',
    defaultTerm: 84,
    defaultRate: 0.075
  },
  'Unexpected Expenses': {
    title: 'Unexpected Expenses',
    description: 'To cover unforeseen business costs or emergency situations.',
    defaultTerm: 36,
    defaultRate: 0.09
  }
}
