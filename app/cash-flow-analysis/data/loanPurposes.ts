import { LoanPurposes } from '../loan-types';

export const loanPurposes: LoanPurposes = {
  'expand-grow': {
    title: 'Expand or Grow My Business',
    description: 'For purposes related to scaling up or growing the business.',
    subcategories: null
  },
  'purchase-real-estate': {
    title: 'Purchase Real Estate',
    description: 'For acquiring commercial property.',
    subcategories: {
      'owner-occupied': 'Buy Owner-Occupied Property',
      'investment': 'Buy Investment Property (Rental Income)',
      'land-development': 'Land or Development Purchase',
      'other-real-estate': 'Other Real Estate Needs'
    }
  },
  'purchase-equipment': {
    title: 'Purchase Equipment or Vehicles',
    description: 'For acquiring physical assets needed for operations.',
    subcategories: {
      'equipment': 'Buy Equipment or Machinery',
      'vehicles': 'Buy Vehicles for Business Use',
      'other-equipment': 'Other Equipment or Vehicle Needs'
    }
  },
  'operating-costs': {
    title: 'Cover Operating Costs',
    description: 'For short-term or ongoing business expenses.',
    subcategories: {
      'payroll': 'Payroll or Employee Benefits',
      'rent-utilities': 'Rent or Utilities',
      'inventory': 'Inventory or Supplies',
      'daily-expenses': 'Day-to-Day Expenses',
      'other-operating': 'Other Operating Costs'
    }
  },
  'refinance': {
    title: 'Refinance or Consolidate Debt',
    description: 'For restructuring existing debt to improve terms or reduce payments.',
    subcategories: {
      'real-estate-refi': 'Refinance Real Estate Loan',
      'consolidate': 'Consolidate Business Loans',
      'equipment-refi': 'Refinance Equipment Loans',
      'other-refi': 'Other Debt Refinancing'
    }
  },
  'purchase-business': {
    title: 'Purchase a Business',
    description: 'For acquiring another business or franchise.',
    subcategories: {
      'franchise': 'Buy a Franchise',
      'existing': 'Buy an Existing Business',
      'merger': 'Merge with Another Business',
      'other-acquisition': 'Other Acquisition Needs'
    }
  },
  'start-business': {
    title: 'Start a New Business',
    description: 'For entrepreneurs or startups needing capital to launch.',
    subcategories: {
      'new-product': 'Launch a New Product or Service',
      'new-location': 'Open a New Location',
      'initial-costs': 'Cover Initial Operating Costs',
      'other-startup': 'Other Startup Needs'
    }
  },
  'other': {
    title: 'Other Loan Purposes',
    description: 'Tell us about your specific loan purpose.',
    subcategories: null
  }
};
