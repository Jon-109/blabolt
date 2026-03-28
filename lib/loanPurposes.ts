export interface LoanPurpose {
  title: string;
  description: string;
  menuSubtitle?: string;
  defaultTerm: number; // in months
  defaultRate: number; // annual interest rate as decimal
  defaultDownPaymentPct?: number; // down payment percentage as decimal (0.1 = 10%)
  paymentMode?: 'amortized' | 'interest_only';
}

export const loanPurposes: Record<string, LoanPurpose> = {
  'Working Capital': {
    title: 'Working Capital',
    description: 'Use this for everyday business costs like payroll, rent, inventory, or short-term cash flow needs.',
    menuSubtitle: 'Payroll, Rent, Inventory, And Everyday Costs',
    defaultTerm: 24,
    defaultRate: 0.08,
    defaultDownPaymentPct: 0.0,
    paymentMode: 'amortized',
  },
  'Equipment Purchase': {
    title: 'Equipment Purchase',
    description: 'Use this to buy equipment, machines, tools, or other assets your business will use.',
    menuSubtitle: 'Buying Equipment, Machines, Or Tools',
    defaultTerm: 60,
    defaultRate: 0.07,
    defaultDownPaymentPct: 0.1,
    paymentMode: 'amortized',
  },
  'Vehicle Purchase': {
    title: 'Vehicle Purchase',
    description: 'Use this for company cars, trucks, vans, or other business vehicles.',
    menuSubtitle: 'Company Cars, Trucks, Vans, Or Work Vehicles',
    defaultTerm: 60,
    defaultRate: 0.065,
    defaultDownPaymentPct: 0.15,
    paymentMode: 'amortized',
  },
  'Inventory Purchase': {
    title: 'Inventory Purchase',
    description: 'Use this to buy inventory, raw materials, or supplies before you sell them.',
    menuSubtitle: 'Stocking Products, Supplies, Or Materials',
    defaultTerm: 12,
    defaultRate: 0.08,
    defaultDownPaymentPct: 0.0,
    paymentMode: 'amortized',
  },
  'Real Estate Acquisition or Development': {
    title: 'Real Estate Acquisition Or Development',
    description: 'Use this to buy, build, or improve commercial property for the business.',
    menuSubtitle: 'Buying, Building, Or Improving Business Property',
    defaultTerm: 120,
    defaultRate: 0.06,
    defaultDownPaymentPct: 0.2,
    paymentMode: 'amortized',
  },
  'Business Acquisition': {
    title: 'Business Acquisition',
    description: 'Use this to buy an existing business, buy into one, or acquire a franchise.',
    menuSubtitle: 'Buying An Existing Business Or Franchise',
    defaultTerm: 84,
    defaultRate: 0.075,
    defaultDownPaymentPct: 0.2,
    paymentMode: 'amortized',
  },
  'Unexpected Expenses': {
    title: 'Unexpected Expenses',
    description: 'Use this for emergency costs, surprise repairs, or unplanned business bills.',
    menuSubtitle: 'Emergency Costs, Repairs, Or Surprise Bills',
    defaultTerm: 36,
    defaultRate: 0.09,
    defaultDownPaymentPct: 0.0,
    paymentMode: 'amortized',
  },
  'Line of Credit': {
    title: 'Line Of Credit',
    description: 'Use this when you want flexible access to funds you can draw as needed.',
    menuSubtitle: 'Flexible Funds You Can Draw As Needed',
    defaultTerm: 12,
    defaultRate: 0.10,
    defaultDownPaymentPct: 0.0,
    paymentMode: 'interest_only',
  },
  'Debt Refinance / Consolidation': {
    title: 'Debt Refinance / Consolidation',
    description: 'Use this to roll multiple business debts into one new payment.',
    menuSubtitle: 'Rolling Multiple Debts Into One Payment',
    defaultTerm: 60,
    defaultRate: 0.075,
    defaultDownPaymentPct: 0.0,
    paymentMode: 'amortized',
  },
  'Business Expansion / New Location': {
    title: 'Business Expansion / New Location',
    description: 'Use this when you are growing, opening another location, or adding capacity.',
    menuSubtitle: 'Growing The Business Or Opening Another Location',
    defaultTerm: 84,
    defaultRate: 0.08,
    defaultDownPaymentPct: 0.1,
    paymentMode: 'amortized',
  },
  'Bridge Financing': {
    title: 'Bridge Financing',
    description: 'Use this for short-term funding while you wait on a sale, refinance, or longer-term loan.',
    menuSubtitle: 'Short-Term Funding Until Longer-Term Money Arrives',
    defaultTerm: 12,
    defaultRate: 0.105,
    defaultDownPaymentPct: 0.0,
    paymentMode: 'interest_only',
  },
  Other: {
    title: 'Other',
    description: 'Use this if your loan purpose does not fit the common options above.',
    menuSubtitle: 'A Different Loan Need Not Listed Above',
    defaultTerm: 60,
    defaultRate: 0.085,
    defaultDownPaymentPct: 0.1,
    paymentMode: 'amortized',
  },
};
