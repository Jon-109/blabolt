import { TEMPLATE_KEYS, type TemplateKey } from './constants';

export type TemplateFieldType =
  | 'text'
  | 'textarea'
  | 'currency'
  | 'number'
  | 'date'
  | 'select'
  | 'boolean';

export interface TemplateCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'truthy' | 'greater_than';
  value?: string | number | boolean;
}

export interface TemplateFieldOption {
  label: string;
  value: string;
}

export interface TemplateField {
  id: string;
  label: string;
  type: TemplateFieldType;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: TemplateFieldOption[];
  condition?: TemplateCondition;
}

export interface TemplateSection {
  id: string;
  title: string;
  description: string;
  fields: string[];
}

export interface TemplateDefinition {
  key: TemplateKey;
  name: string;
  description: string;
  sections: TemplateSection[];
  fields: TemplateField[];
}

export type TemplateValues = Record<string, unknown>;

const TEMPLATE_DEFINITIONS: Record<TemplateKey, TemplateDefinition> = {
  balance_sheet: {
    key: 'balance_sheet',
    name: 'Balance Sheet',
    description:
      'Create a lender-ready balance sheet in plain language with a built-in check to make sure your numbers balance.',
    sections: [
      {
        id: 'snapshot',
        title: 'Business Snapshot',
        description: 'Basic details for the statement date.',
        fields: ['statement_date', 'business_name'],
      },
      {
        id: 'assets',
        title: 'Assets (What You Own)',
        description: 'Enter your latest values for business assets.',
        fields: [
          'cash',
          'accounts_receivable',
          'inventory',
          'other_current_assets',
          'fixed_assets',
          'accumulated_depreciation',
          'other_assets',
        ],
      },
      {
        id: 'liabilities_equity',
        title: 'Liabilities + Equity',
        description: 'Enter what you owe and owner equity.',
        fields: [
          'accounts_payable',
          'credit_card_liabilities',
          'short_term_loans',
          'long_term_debt',
          'other_liabilities',
          'owners_equity',
          'retained_earnings',
        ],
      },
      {
        id: 'notes',
        title: 'Notes',
        description: 'Optional context for unusual balances.',
        fields: ['notes'],
      },
    ],
    fields: [
      {
        id: 'statement_date',
        label: 'As Of Date',
        type: 'date',
        required: true,
        helperText: 'Use the date these balances are accurate. Usually month-end.',
      },
      {
        id: 'business_name',
        label: 'Business Name',
        type: 'text',
        required: true,
        placeholder: 'Main Street Plumbing LLC',
        helperText: 'Use your legal business name from tax filings or bank statements.',
      },
      {
        id: 'cash',
        label: 'Cash',
        type: 'currency',
        min: 0,
        required: true,
        helperText: 'Total checking and savings account balances on the statement date.',
      },
      {
        id: 'accounts_receivable',
        label: 'Accounts Receivable',
        type: 'currency',
        min: 0,
        helperText: 'Money customers owe you from unpaid invoices.',
      },
      {
        id: 'inventory',
        label: 'Inventory',
        type: 'currency',
        min: 0,
        helperText: 'Value of sellable inventory you currently have on hand.',
      },
      {
        id: 'other_current_assets',
        label: 'Other Current Assets',
        type: 'currency',
        min: 0,
        helperText: 'Short-term assets like prepaid expenses or deposits.',
      },
      {
        id: 'fixed_assets',
        label: 'Fixed Assets (Before Depreciation)',
        type: 'currency',
        min: 0,
        helperText: 'Original cost of equipment, vehicles, furniture, and property used by the business.',
      },
      {
        id: 'accumulated_depreciation',
        label: 'Accumulated Depreciation',
        type: 'currency',
        min: 0,
        helperText: 'Total depreciation taken to date. Enter a positive number.',
      },
      {
        id: 'other_assets',
        label: 'Other Assets',
        type: 'currency',
        min: 0,
        helperText: 'Anything else valuable not listed above (for example deposits or intangible assets).',
      },
      {
        id: 'accounts_payable',
        label: 'Accounts Payable',
        type: 'currency',
        min: 0,
        helperText: 'Bills you currently owe to vendors and suppliers.',
      },
      {
        id: 'credit_card_liabilities',
        label: 'Business Credit Card Balances',
        type: 'currency',
        min: 0,
        helperText: 'Current total of business credit card balances.',
      },
      {
        id: 'short_term_loans',
        label: 'Short-Term Loans',
        type: 'currency',
        min: 0,
        helperText: 'Loan balances due within the next 12 months.',
      },
      {
        id: 'long_term_debt',
        label: 'Long-Term Debt',
        type: 'currency',
        min: 0,
        helperText: 'Remaining balance on loans due after 12 months.',
      },
      {
        id: 'other_liabilities',
        label: 'Other Liabilities',
        type: 'currency',
        min: 0,
        helperText: 'Other amounts owed, including taxes payable or accruals.',
      },
      {
        id: 'owners_equity',
        label: 'Owner Equity / Capital',
        type: 'currency',
        min: 0,
        required: true,
        helperText: 'Owner investment and paid-in capital currently in the business.',
      },
      {
        id: 'retained_earnings',
        label: 'Retained Earnings',
        type: 'currency',
        helperText: 'Cumulative profit kept in the business after distributions.',
      },
      {
        id: 'notes',
        label: 'Notes',
        type: 'textarea',
        placeholder: 'Add context for large changes or one-time items.',
        helperText: 'Optional. Keep this short and lender-friendly.',
      },
    ],
  },
  income_statement: {
    key: 'income_statement',
    name: 'Income Statement',
    description:
      'Show how your business performed over a period by listing revenue, direct costs, operating expenses, and net income.',
    sections: [
      {
        id: 'period',
        title: 'Reporting Period',
        description: 'Set the date range and business name.',
        fields: ['period_start', 'period_end', 'business_name'],
      },
      {
        id: 'revenue',
        title: 'Revenue (Money Coming In)',
        description: 'Income earned during the selected period.',
        fields: ['gross_sales', 'service_revenue', 'other_revenue'],
      },
      {
        id: 'cogs',
        title: 'Cost Of Goods Sold',
        description: 'Direct costs tied to the goods you sold during the same period.',
        fields: [
          'inventory_materials_cost',
          'direct_labor',
          'shipping_packaging',
          'other_direct_costs',
        ],
      },
      {
        id: 'operating_expenses',
        title: 'Operating Expenses',
        description: 'Everyday operating costs needed to run the business.',
        fields: [
          'payroll_contractor_payments',
          'rent_facility_costs',
          'utilities_internet',
          'marketing_advertising',
          'software_subscriptions',
          'professional_services',
          'insurance',
          'office_administrative',
          'vehicle_travel',
          'other_operating_expenses',
          'interest_expense',
        ],
      },
      {
        id: 'notes',
        title: 'Notes',
        description: 'Optional context for unusual months or one-time costs.',
        fields: ['notes'],
      },
    ],
    fields: [
      {
        id: 'period_start',
        label: 'Period Start Date',
        type: 'date',
        required: true,
        helperText: 'First day of the period this statement covers.',
      },
      {
        id: 'period_end',
        label: 'Period End Date',
        type: 'date',
        required: true,
        helperText: 'Last day of the same reporting period.',
      },
      {
        id: 'business_name',
        label: 'Business Name',
        type: 'text',
        required: true,
        placeholder: 'Main Street Plumbing LLC',
        helperText: 'Use the same legal name shown on your tax return and bank accounts.',
      },
      {
        id: 'gross_sales',
        label: 'Gross Sales',
        type: 'currency',
        min: 0,
        required: true,
        helperText: 'Total product sales before refunds or adjustments.',
      },
      {
        id: 'service_revenue',
        label: 'Service Revenue',
        type: 'currency',
        min: 0,
        helperText: 'Income from services your business performed.',
      },
      {
        id: 'other_revenue',
        label: 'Other Revenue',
        type: 'currency',
        min: 0,
        helperText: 'Other business income (for example rent income or rebates).',
      },
      {
        id: 'inventory_materials_cost',
        label: 'Inventory Or Materials Cost',
        type: 'currency',
        min: 0,
        helperText: 'Inventory purchased or raw materials used for products sold during the period.',
      },
      {
        id: 'direct_labor',
        label: 'Direct Labor',
        type: 'currency',
        min: 0,
        helperText: 'Labor directly tied to producing goods or fulfilling product orders.',
      },
      {
        id: 'shipping_packaging',
        label: 'Shipping And Packaging',
        type: 'currency',
        min: 0,
        helperText: 'Freight, shipping, and packaging costs directly tied to goods sold.',
      },
      {
        id: 'other_direct_costs',
        label: 'Other Direct Costs',
        type: 'currency',
        min: 0,
        helperText: 'Any remaining direct product costs not listed above.',
      },
      {
        id: 'payroll_contractor_payments',
        label: 'Payroll And Contractor Payments',
        type: 'currency',
        min: 0,
        helperText: 'Payroll, contractor pay, and payroll-related taxes for operating staff.',
      },
      {
        id: 'rent_facility_costs',
        label: 'Rent Or Facility Costs',
        type: 'currency',
        min: 0,
        helperText: 'Office, retail, warehouse, or facility rent for the period.',
      },
      {
        id: 'utilities_internet',
        label: 'Utilities And Internet',
        type: 'currency',
        min: 0,
        helperText: 'Electricity, gas, water, internet, and phone expenses.',
      },
      {
        id: 'marketing_advertising',
        label: 'Marketing And Advertising',
        type: 'currency',
        min: 0,
        helperText: 'Ads, promotions, digital marketing, and lead generation spend.',
      },
      {
        id: 'software_subscriptions',
        label: 'Software And Subscriptions',
        type: 'currency',
        min: 0,
        helperText: 'Recurring software and SaaS tools used to run the business.',
      },
      {
        id: 'professional_services',
        label: 'Professional Services',
        type: 'currency',
        min: 0,
        helperText: 'Legal, accounting, consulting, and similar outside support.',
      },
      {
        id: 'insurance',
        label: 'Insurance',
        type: 'currency',
        min: 0,
        helperText: 'General liability, workers comp, business property, or other coverage costs.',
      },
      {
        id: 'office_administrative',
        label: 'Office And Administrative',
        type: 'currency',
        min: 0,
        helperText: 'Office supplies, bank fees, postage, and similar admin costs.',
      },
      {
        id: 'vehicle_travel',
        label: 'Vehicle And Travel',
        type: 'currency',
        min: 0,
        helperText: 'Business mileage, fuel, travel, lodging, and transportation costs.',
      },
      {
        id: 'other_operating_expenses',
        label: 'Other Operating Expenses',
        type: 'currency',
        min: 0,
        helperText: 'Remaining operating costs not listed above.',
      },
      {
        id: 'interest_expense',
        label: 'Interest Expense',
        type: 'currency',
        min: 0,
        helperText: 'Interest paid on business loans and credit lines.',
      },
      {
        id: 'notes',
        label: 'Notes',
        type: 'textarea',
        placeholder: 'Explain one-time revenue or expense items.',
        helperText: 'Optional. Helpful for lender questions ahead of time.',
      },
    ],
  },
  personal_financial_statement: {
    key: 'personal_financial_statement',
    name: 'Personal Financial Statement',
    description:
      'Provide a personal net-worth snapshot for owners/guarantors in a lender-friendly format.',
    sections: [
      {
        id: 'profile',
        title: 'Profile',
        description: 'Who this statement belongs to and when it is accurate.',
        fields: ['statement_date', 'owner_name', 'owner_phone', 'owner_email', 'owner_address'],
      },
      {
        id: 'assets',
        title: 'Assets',
        description: 'What you own personally.',
        fields: [
          'cash_on_hand',
          'marketable_securities',
          'retirement_accounts',
          'real_estate_value',
          'business_ownership_value',
          'personal_property_value',
          'other_assets',
        ],
      },
      {
        id: 'liabilities',
        title: 'Liabilities',
        description: 'Personal obligations and balances owed.',
        fields: [
          'credit_card_debt',
          'mortgage_debt',
          'auto_loans',
          'student_loans',
          'tax_liabilities',
          'other_liabilities',
        ],
      },
      {
        id: 'contingent',
        title: 'Contingent Liabilities',
        description: 'Guarantees or obligations that may become due.',
        fields: ['contingent_liabilities', 'contingent_liabilities_notes'],
      },
      {
        id: 'notes',
        title: 'Notes',
        description: 'Optional context if a lender asks follow-up questions.',
        fields: ['notes'],
      },
    ],
    fields: [
      {
        id: 'statement_date',
        label: 'As Of Date',
        type: 'date',
        required: true,
        helperText: 'Date these personal balances are accurate.',
      },
      {
        id: 'owner_name',
        label: 'Owner / Guarantor Name',
        type: 'text',
        required: true,
        placeholder: 'Jane Doe',
        helperText: 'Enter your full legal name.',
      },
      {
        id: 'owner_phone',
        label: 'Phone',
        type: 'text',
        placeholder: '(555) 123-4567',
        helperText: 'Best phone number for lender follow-up questions.',
      },
      {
        id: 'owner_email',
        label: 'Email',
        type: 'text',
        placeholder: 'owner@email.com',
        helperText: 'Email used for lender or advisor follow-up.',
      },
      {
        id: 'owner_address',
        label: 'Home Address',
        type: 'textarea',
        placeholder: 'Street, City, State ZIP',
        helperText: 'Current home address as shown on your ID or statements.',
      },
      {
        id: 'cash_on_hand',
        label: 'Cash And Deposits',
        type: 'currency',
        required: true,
        min: 0,
        helperText: 'Checking + savings balances from your latest bank statements.',
      },
      {
        id: 'marketable_securities',
        label: 'Stocks And Investments',
        type: 'currency',
        min: 0,
        helperText: 'Current market value of stocks, bonds, and brokerage holdings.',
      },
      {
        id: 'retirement_accounts',
        label: 'Retirement Accounts',
        type: 'currency',
        min: 0,
        helperText: 'IRA, 401(k), and other retirement account balances.',
      },
      {
        id: 'real_estate_value',
        label: 'Real Estate Value',
        type: 'currency',
        min: 0,
        helperText: 'Current market value of personal real estate owned.',
      },
      {
        id: 'business_ownership_value',
        label: 'Business Ownership Value',
        type: 'currency',
        min: 0,
        helperText: 'Your estimated ownership value in businesses you own.',
      },
      {
        id: 'personal_property_value',
        label: 'Vehicles / Personal Property',
        type: 'currency',
        min: 0,
        helperText: 'Current resale value of vehicles and valuable personal property.',
      },
      {
        id: 'other_assets',
        label: 'Other Assets',
        type: 'currency',
        min: 0,
        helperText: 'Assets not already listed above.',
      },
      {
        id: 'credit_card_debt',
        label: 'Credit Card Debt',
        type: 'currency',
        min: 0,
        helperText: 'Total current balance across personal cards.',
      },
      {
        id: 'mortgage_debt',
        label: 'Mortgage Debt',
        type: 'currency',
        min: 0,
        helperText: 'Remaining balance on personal mortgages.',
      },
      {
        id: 'auto_loans',
        label: 'Auto Loans',
        type: 'currency',
        min: 0,
        helperText: 'Remaining balance on personal auto loans.',
      },
      {
        id: 'student_loans',
        label: 'Student Loans',
        type: 'currency',
        min: 0,
        helperText: 'Total outstanding student loan balance.',
      },
      {
        id: 'tax_liabilities',
        label: 'Tax Liabilities',
        type: 'currency',
        min: 0,
        helperText: 'Any unpaid tax balances currently owed.',
      },
      {
        id: 'other_liabilities',
        label: 'Other Liabilities',
        type: 'currency',
        min: 0,
        helperText: 'Other personal obligations not already listed.',
      },
      {
        id: 'contingent_liabilities',
        label: 'Any Contingent Liabilities?',
        type: 'boolean',
        helperText: 'Check yes if you co-signed debt, gave guarantees, or have pending claims.',
      },
      {
        id: 'contingent_liabilities_notes',
        label: 'Contingent Liability Notes',
        type: 'textarea',
        condition: { field: 'contingent_liabilities', operator: 'truthy' },
        placeholder: 'List guarantees, co-signed debt, or legal claims.',
        helperText: 'Add short details and estimated exposure amount.',
      },
      {
        id: 'notes',
        label: 'Notes',
        type: 'textarea',
        placeholder: 'Add context for major assets or liabilities.',
        helperText: 'Optional, but useful if values changed recently.',
      },
    ],
  },
  personal_debt_summary: {
    key: 'personal_debt_summary',
    name: 'Personal Debt Summary',
    description:
      'Organize personal debt balances and monthly payments so lenders can quickly review your obligations.',
    sections: [
      {
        id: 'profile',
        title: 'Borrower Profile',
        description: 'Basic borrower details for this report.',
        fields: ['report_date', 'borrower_name', 'monthly_income'],
      },
      {
        id: 'balances',
        title: 'Debt Balances',
        description: 'Current balances by personal debt type.',
        fields: [
          'mortgage_balance',
          'auto_balance',
          'credit_card_balance',
          'student_loan_balance',
          'personal_loan_balance',
          'other_balance',
        ],
      },
      {
        id: 'payments',
        title: 'Monthly Payments',
        description: 'Monthly minimum or scheduled payment by debt type.',
        fields: [
          'mortgage_payment',
          'auto_payment',
          'credit_card_payment',
          'student_loan_payment',
          'personal_loan_payment',
          'other_payment',
        ],
      },
      {
        id: 'delinquency',
        title: 'Delinquency',
        description: 'Past due debt, if any.',
        fields: ['past_due_debt', 'past_due_amount'],
      },
      {
        id: 'notes',
        title: 'Notes',
        description: 'Optional explanation for lender context.',
        fields: ['notes'],
      },
    ],
    fields: [
      {
        id: 'report_date',
        label: 'Report Date',
        type: 'date',
        required: true,
        helperText: 'Date these personal debt numbers are accurate.',
      },
      {
        id: 'borrower_name',
        label: 'Borrower Name',
        type: 'text',
        required: true,
        placeholder: 'Jane Doe',
        helperText: 'Full legal name of the borrower/guarantor.',
      },
      {
        id: 'monthly_income',
        label: 'Monthly Gross Income',
        type: 'currency',
        required: true,
        min: 0,
        helperText: 'Total monthly gross income from pay stubs, tax returns, or owner draws.',
      },
      {
        id: 'mortgage_balance',
        label: 'Mortgage Balance',
        type: 'currency',
        min: 0,
        helperText: 'Current mortgage principal balance.',
      },
      {
        id: 'auto_balance',
        label: 'Auto Loan Balance',
        type: 'currency',
        min: 0,
        helperText: 'Remaining principal on personal vehicle loans.',
      },
      {
        id: 'credit_card_balance',
        label: 'Credit Card Balance',
        type: 'currency',
        min: 0,
        helperText: 'Total personal card balances currently outstanding.',
      },
      {
        id: 'student_loan_balance',
        label: 'Student Loan Balance',
        type: 'currency',
        min: 0,
        helperText: 'Remaining student loan balance.',
      },
      {
        id: 'personal_loan_balance',
        label: 'Personal Loan Balance',
        type: 'currency',
        min: 0,
        helperText: 'Balance on unsecured personal loans.',
      },
      {
        id: 'other_balance',
        label: 'Other Debt Balance',
        type: 'currency',
        min: 0,
        helperText: 'Any other personal debt balance not listed above.',
      },
      {
        id: 'mortgage_payment',
        label: 'Mortgage Payment',
        type: 'currency',
        min: 0,
        helperText: 'Monthly mortgage payment amount.',
      },
      {
        id: 'auto_payment',
        label: 'Auto Loan Payment',
        type: 'currency',
        min: 0,
        helperText: 'Monthly personal auto payment.',
      },
      {
        id: 'credit_card_payment',
        label: 'Credit Card Minimum Payments',
        type: 'currency',
        min: 0,
        helperText: 'Total monthly minimums across personal cards.',
      },
      {
        id: 'student_loan_payment',
        label: 'Student Loan Payment',
        type: 'currency',
        min: 0,
        helperText: 'Monthly student loan payment.',
      },
      {
        id: 'personal_loan_payment',
        label: 'Personal Loan Payment',
        type: 'currency',
        min: 0,
        helperText: 'Monthly payment for unsecured personal loans.',
      },
      {
        id: 'other_payment',
        label: 'Other Monthly Debt Payment',
        type: 'currency',
        min: 0,
        helperText: 'Other monthly debt payments not captured above.',
      },
      {
        id: 'past_due_debt',
        label: 'Any Past Due Personal Debt?',
        type: 'boolean',
        helperText: 'Select yes if any personal debt is currently behind.',
      },
      {
        id: 'past_due_amount',
        label: 'Past Due Amount',
        type: 'currency',
        min: 0,
        condition: { field: 'past_due_debt', operator: 'truthy' },
        helperText: 'Total amount currently past due.',
      },
      {
        id: 'notes',
        label: 'Notes',
        type: 'textarea',
        placeholder: 'Add context for any unusual payment or delinquency history.',
        helperText: 'Optional and useful for lender follow-up.',
      },
    ],
  },
  business_debt_summary: {
    key: 'business_debt_summary',
    name: 'Business Debt Summary',
    description:
      'Capture current business debt balances and monthly payments in one clean lender-ready summary.',
    sections: [
      {
        id: 'profile',
        title: 'Business Profile',
        description: 'Basic details and reporting date.',
        fields: ['report_date', 'business_name', 'weighted_interest_rate'],
      },
      {
        id: 'balances',
        title: 'Outstanding Balances',
        description: 'Current balance by debt type.',
        fields: [
          'term_loan_balance',
          'line_of_credit_balance',
          'equipment_loan_balance',
          'commercial_mortgage_balance',
          'other_business_debt_balance',
        ],
      },
      {
        id: 'payments',
        title: 'Monthly Debt Payments',
        description: 'Monthly payments by debt type.',
        fields: [
          'term_loan_payment',
          'line_of_credit_payment',
          'equipment_loan_payment',
          'commercial_mortgage_payment',
          'other_business_debt_payment',
        ],
      },
      {
        id: 'guarantees',
        title: 'Personal Guarantees',
        description: 'Whether any business debt has a personal guarantee attached.',
        fields: ['personal_guarantees_present', 'personal_guarantees_notes'],
      },
      {
        id: 'notes',
        title: 'Notes',
        description: 'Optional context to reduce lender follow-up.',
        fields: ['notes'],
      },
    ],
    fields: [
      {
        id: 'report_date',
        label: 'Report Date',
        type: 'date',
        required: true,
        helperText: 'Date these business debt balances are accurate.',
      },
      {
        id: 'business_name',
        label: 'Business Name',
        type: 'text',
        required: true,
        placeholder: 'Main Street Plumbing LLC',
        helperText: 'Legal business name from your tax return or bank account.',
      },
      {
        id: 'weighted_interest_rate',
        label: 'Weighted Average Interest Rate (%)',
        type: 'number',
        min: 0,
        max: 100,
        step: 0.01,
        helperText: 'Optional. If unknown, leave blank and your totals still calculate.',
      },
      {
        id: 'term_loan_balance',
        label: 'Term Loan Balance',
        type: 'currency',
        min: 0,
        helperText: 'Current balance on fixed-term business loans.',
      },
      {
        id: 'line_of_credit_balance',
        label: 'Line Of Credit Balance',
        type: 'currency',
        min: 0,
        helperText: 'Current amount drawn on business lines of credit.',
      },
      {
        id: 'equipment_loan_balance',
        label: 'Equipment Loan Balance',
        type: 'currency',
        min: 0,
        helperText: 'Outstanding balance on equipment or vehicle financing.',
      },
      {
        id: 'commercial_mortgage_balance',
        label: 'Commercial Mortgage Balance',
        type: 'currency',
        min: 0,
        helperText: 'Remaining principal on business real-estate loans.',
      },
      {
        id: 'other_business_debt_balance',
        label: 'Other Business Debt Balance',
        type: 'currency',
        min: 0,
        helperText: 'Any other business debt not listed above.',
      },
      {
        id: 'term_loan_payment',
        label: 'Term Loan Payment',
        type: 'currency',
        min: 0,
        helperText: 'Monthly payment for term loans.',
      },
      {
        id: 'line_of_credit_payment',
        label: 'Line Of Credit Payment',
        type: 'currency',
        min: 0,
        helperText: 'Monthly payment on your line of credit.',
      },
      {
        id: 'equipment_loan_payment',
        label: 'Equipment Loan Payment',
        type: 'currency',
        min: 0,
        helperText: 'Monthly payment on equipment or vehicle debt.',
      },
      {
        id: 'commercial_mortgage_payment',
        label: 'Commercial Mortgage Payment',
        type: 'currency',
        min: 0,
        helperText: 'Monthly commercial mortgage payment.',
      },
      {
        id: 'other_business_debt_payment',
        label: 'Other Business Debt Payment',
        type: 'currency',
        min: 0,
        helperText: 'Monthly payment for other business debt.',
      },
      {
        id: 'personal_guarantees_present',
        label: 'Any Debt Personally Guaranteed?',
        type: 'boolean',
        helperText: 'Select yes if any owner personally guarantees business debt.',
      },
      {
        id: 'personal_guarantees_notes',
        label: 'Guarantee Notes',
        type: 'textarea',
        condition: { field: 'personal_guarantees_present', operator: 'truthy' },
        placeholder: 'Which debt is guaranteed and by whom?',
        helperText: 'Short note is enough. Include lender and debt type.',
      },
      {
        id: 'notes',
        label: 'Notes',
        type: 'textarea',
        placeholder: 'Add context for recent payoffs, deferments, or debt restructures.',
        helperText: 'Optional lender context.',
      },
    ],
  },
};

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : 0;
  }

  return 0;
}

function hasValue(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (typeof value === 'boolean') {
    return true;
  }

  return value !== null && value !== undefined;
}

function sumFields(values: TemplateValues, fieldIds: string[]): number {
  return fieldIds.reduce((sum, fieldId) => sum + toNumber(values[fieldId]), 0);
}

function getRequiredFieldIssues(templateKey: TemplateKey, values: TemplateValues): string[] {
  const definition = getTemplateDefinition(templateKey);

  return definition.fields
    .filter((field) => field.required && isFieldVisible(field, values) && !hasValue(values[field.id]))
    .map((field) => `${field.label} is required.`);
}

export function isFieldVisible(field: TemplateField, values: TemplateValues): boolean {
  if (!field.condition) {
    return true;
  }

  const target = values[field.condition.field];

  switch (field.condition.operator) {
    case 'truthy':
      return Boolean(target);
    case 'equals':
      return target === field.condition.value;
    case 'not_equals':
      return target !== field.condition.value;
    case 'greater_than':
      return toNumber(target) > toNumber(field.condition.value);
    default:
      return true;
  }
}

export function getTemplateDefinitions(): TemplateDefinition[] {
  return TEMPLATE_KEYS.map((templateKey) => TEMPLATE_DEFINITIONS[templateKey]);
}

export function getTemplateDefinition(templateKey: TemplateKey): TemplateDefinition {
  return TEMPLATE_DEFINITIONS[templateKey];
}

export function getTemplateCompletionPercentage(
  templateKey: TemplateKey,
  values: TemplateValues,
): number {
  const definition = getTemplateDefinition(templateKey);
  const requiredFields = definition.fields.filter(
    (field) => field.required && isFieldVisible(field, values),
  );

  if (requiredFields.length === 0) {
    return 100;
  }

  const completedCount = requiredFields.filter((field) => hasValue(values[field.id])).length;
  return Math.round((completedCount / requiredFields.length) * 100);
}

export function computeTemplateMetrics(
  templateKey: TemplateKey,
  values: TemplateValues,
): Record<string, number> {
  switch (templateKey) {
    case 'balance_sheet': {
      const totalAssets =
        sumFields(values, [
          'cash',
          'accounts_receivable',
          'inventory',
          'other_current_assets',
          'fixed_assets',
          'other_assets',
        ]) - toNumber(values.accumulated_depreciation);

      const totalLiabilities = sumFields(values, [
        'accounts_payable',
        'credit_card_liabilities',
        'short_term_loans',
        'long_term_debt',
        'other_liabilities',
      ]);

      const totalEquity = sumFields(values, ['owners_equity', 'retained_earnings']);
      const liabilitiesPlusEquity = totalLiabilities + totalEquity;
      const balanceGap = totalAssets - liabilitiesPlusEquity;

      return {
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        total_equity: totalEquity,
        liabilities_plus_equity: liabilitiesPlusEquity,
        balance_gap: balanceGap,
        is_balanced: Math.abs(balanceGap) <= 1 ? 1 : 0,
      };
    }

    case 'income_statement': {
      const totalRevenue = sumFields(values, ['gross_sales', 'service_revenue', 'other_revenue']);
      const totalCogs = sumFields(values, [
        'inventory_materials_cost',
        'direct_labor',
        'shipping_packaging',
        'other_direct_costs',
      ]);
      const grossProfit = totalRevenue - totalCogs;
      const totalOperatingExpenses = sumFields(values, [
        'payroll_contractor_payments',
        'rent_facility_costs',
        'utilities_internet',
        'marketing_advertising',
        'software_subscriptions',
        'professional_services',
        'insurance',
        'office_administrative',
        'vehicle_travel',
        'other_operating_expenses',
      ]);
      const interestExpense = sumFields(values, ['interest_expense']);
      const operatingProfit = grossProfit - totalOperatingExpenses;
      const netIncome = operatingProfit - interestExpense;

      return {
        total_revenue: totalRevenue,
        total_cogs: totalCogs,
        gross_profit: grossProfit,
        total_operating_expenses: totalOperatingExpenses,
        operating_profit: operatingProfit,
        interest_expense: interestExpense,
        total_expenses: totalCogs + totalOperatingExpenses + interestExpense,
        net_income: netIncome,
        net_margin_ratio: totalRevenue > 0 ? netIncome / totalRevenue : 0,
      };
    }

    case 'personal_financial_statement': {
      const totalAssets = sumFields(values, [
        'cash_on_hand',
        'marketable_securities',
        'retirement_accounts',
        'real_estate_value',
        'business_ownership_value',
        'personal_property_value',
        'other_assets',
      ]);

      const totalLiabilities = sumFields(values, [
        'credit_card_debt',
        'mortgage_debt',
        'auto_loans',
        'student_loans',
        'tax_liabilities',
        'other_liabilities',
      ]);

      return {
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        net_worth: totalAssets - totalLiabilities,
      };
    }

    case 'personal_debt_summary': {
      const monthlyDebtService = sumFields(values, [
        'mortgage_payment',
        'auto_payment',
        'credit_card_payment',
        'student_loan_payment',
        'personal_loan_payment',
        'other_payment',
      ]);

      const totalKnownBalance = sumFields(values, [
        'mortgage_balance',
        'auto_balance',
        'credit_card_balance',
        'student_loan_balance',
        'personal_loan_balance',
        'other_balance',
      ]);

      const monthlyIncome = toNumber(values.monthly_income);
      const debtToIncomeRatio = monthlyIncome > 0 ? monthlyDebtService / monthlyIncome : 0;

      return {
        monthly_debt_service: monthlyDebtService,
        total_known_balance: totalKnownBalance,
        monthly_income: monthlyIncome,
        debt_to_income_ratio: debtToIncomeRatio,
      };
    }

    case 'business_debt_summary': {
      const totalOutstanding = sumFields(values, [
        'term_loan_balance',
        'line_of_credit_balance',
        'equipment_loan_balance',
        'commercial_mortgage_balance',
        'other_business_debt_balance',
      ]);

      const totalMonthlyPayment = sumFields(values, [
        'term_loan_payment',
        'line_of_credit_payment',
        'equipment_loan_payment',
        'commercial_mortgage_payment',
        'other_business_debt_payment',
      ]);

      return {
        total_outstanding_debt: totalOutstanding,
        total_monthly_payment: totalMonthlyPayment,
        weighted_interest_rate: toNumber(values.weighted_interest_rate),
      };
    }

    default:
      return {};
  }
}

export function getTemplateValidationIssues(
  templateKey: TemplateKey,
  values: TemplateValues,
): string[] {
  const issues = [...getRequiredFieldIssues(templateKey, values)];

  if (templateKey === 'balance_sheet') {
    const metrics = computeTemplateMetrics(templateKey, values);
    const gap = toNumber(metrics.balance_gap);

    if (Math.abs(gap) > 1) {
      issues.push(
        `Balance sheet is out of balance by $${Math.abs(gap).toLocaleString(undefined, { maximumFractionDigits: 2 })}.`,
      );
    }
  }

  if (templateKey === 'income_statement') {
    const start = typeof values.period_start === 'string' ? values.period_start : '';
    const end = typeof values.period_end === 'string' ? values.period_end : '';

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && startDate > endDate) {
        issues.push('Period start date must be on or before period end date.');
      }
    }
  }

  return issues;
}

export function isTemplateReadyForCompletion(
  templateKey: TemplateKey,
  values: TemplateValues,
): boolean {
  return getTemplateValidationIssues(templateKey, values).length === 0;
}
