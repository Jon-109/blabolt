export const SERVICE_TYPES = ['loan_packaging', 'loan_brokering'] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const LOAN_REQUEST_STATUSES = [
  'draft',
  'in_progress',
  'submitted',
  'completed',
  'archived',
] as const;
export type LoanRequestStatus = (typeof LOAN_REQUEST_STATUSES)[number];

export const DOCUMENT_STATUSES = [
  'not_started',
  'uploaded',
  'generated',
  'approved',
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const COVER_LETTER_STATUSES = [
  'not_started',
  'draft',
  'generated',
  'approved',
] as const;
export type CoverLetterStatus = (typeof COVER_LETTER_STATUSES)[number];

export const TEMPLATE_KEYS = [
  'balance_sheet',
  'income_statement',
  'personal_debt_summary',
  'personal_financial_statement',
  'business_debt_summary',
] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

export const TEMPLATE_REQUIREMENT_KEY_BY_TEMPLATE: Record<TemplateKey, string> = {
  balance_sheet: 'balance_sheet',
  income_statement: 'income_statement_ytd',
  personal_financial_statement: 'personal_financial_statement',
  personal_debt_summary: 'personal_debt_summary',
  business_debt_summary: 'business_debt_summary',
};

export const COMPLETED_DOCUMENT_STATUSES = new Set<DocumentStatus>([
  'uploaded',
  'generated',
  'approved',
]);

export interface DocumentRequirementSeed {
  requirement_key: string;
  service_type: ServiceType;
  loan_purpose?: string | null;
  category: 'financial_statement' | 'debt_schedule' | 'tax_return' | 'bank_statement' | 'cover_letter' | 'other';
  display_name: string;
  description: string;
  required: boolean;
  sort_order: number;
  template_key: TemplateKey | null;
  max_size_mb: number;
  allowed_mime_types: string[];
  is_active: boolean;
}

export const LOAN_PURPOSE_OPTIONS = [
  'Working Capital',
  'Equipment Purchase',
  'Inventory Purchase',
  'Business Acquisition',
  'Commercial Real Estate Purchase',
  'Commercial Real Estate Refinance',
  'Debt Refinance / Consolidation',
  'Business Expansion / New Location',
  'Tenant Improvements / Renovation',
  'Partner Buyout',
  'Franchise Purchase',
  'Bridge Financing',
  'Revolving Line of Credit',
  'Other',
] as const;

export type LoanPurposeOption = (typeof LOAN_PURPOSE_OPTIONS)[number];

const LOAN_PURPOSE_ALIASES: Record<string, LoanPurposeOption> = {
  'line of credit support': 'Revolving Line of Credit',
  'revolving line of credit': 'Revolving Line of Credit',
  'working capital': 'Working Capital',
  'equipment purchase': 'Equipment Purchase',
  'inventory purchase': 'Inventory Purchase',
  'business acquisition': 'Business Acquisition',
  'commercial real estate purchase': 'Commercial Real Estate Purchase',
  'commercial real estate refinance': 'Commercial Real Estate Refinance',
  'debt refinance / consolidation': 'Debt Refinance / Consolidation',
  'business expansion / new location': 'Business Expansion / New Location',
  'tenant improvements / renovation': 'Tenant Improvements / Renovation',
  'partner buyout': 'Partner Buyout',
  'franchise purchase': 'Franchise Purchase',
  'bridge financing': 'Bridge Financing',
  other: 'Other',
};

export function normalizeLoanPurpose(value: string | null | undefined): LoanPurposeOption | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return LOAN_PURPOSE_ALIASES[normalized] ?? null;
}

export function documentRequirementMatchesLoanPurpose(
  requirementLoanPurpose: string | null | undefined,
  loanPurpose: string | null | undefined,
): boolean {
  if (!requirementLoanPurpose) {
    return true;
  }

  const normalizedRequirement = normalizeLoanPurpose(requirementLoanPurpose);
  const normalizedLoanPurpose = normalizeLoanPurpose(loanPurpose);

  return normalizedRequirement != null && normalizedRequirement === normalizedLoanPurpose;
}

function purposeRequirement(
  requirement_key: string,
  loan_purpose: LoanPurposeOption,
  display_name: string,
  description: string,
  sort_order: number,
  category: DocumentRequirementSeed['category'] = 'other',
  max_size_mb = 25,
  allowed_mime_types: string[] = ['application/pdf', 'image/png', 'image/jpeg'],
): DocumentRequirementSeed {
  return {
    requirement_key,
    service_type: 'loan_packaging',
    loan_purpose,
    category,
    display_name,
    description,
    required: true,
    sort_order,
    template_key: null,
    allowed_mime_types,
    max_size_mb,
    is_active: true,
  };
}

export const DEFAULT_REQUIREMENT_ROWS: DocumentRequirementSeed[] = [
  {
    requirement_key: 'personal_debt_summary',
    service_type: 'loan_packaging',
    loan_purpose: null,
    category: 'debt_schedule',
    display_name: 'Personal Debt Summary',
    description: 'Itemized monthly personal debt service and outstanding balances.',
    required: true,
    sort_order: 10,
    template_key: 'personal_debt_summary',
    max_size_mb: 25,
    allowed_mime_types: ['application/pdf', 'image/png', 'image/jpeg'],
    is_active: true,
  },
  {
    requirement_key: 'personal_financial_statement',
    service_type: 'loan_packaging',
    loan_purpose: null,
    category: 'financial_statement',
    display_name: 'Personal Financial Statement',
    description: 'Statement of personal assets and liabilities used in guarantor strength analysis.',
    required: true,
    sort_order: 20,
    template_key: 'personal_financial_statement',
    max_size_mb: 25,
    allowed_mime_types: ['application/pdf', 'image/png', 'image/jpeg'],
    is_active: true,
  },
  {
    requirement_key: 'personal_tax_return_year_1',
    service_type: 'loan_packaging',
    loan_purpose: null,
    category: 'tax_return',
    display_name: 'Personal Tax Return - Year 1',
    description: 'Signed federal personal tax return for the most recent completed year.',
    required: true,
    sort_order: 25,
    template_key: null,
    max_size_mb: 50,
    allowed_mime_types: ['application/pdf'],
    is_active: true,
  },
  {
    requirement_key: 'personal_tax_return_year_2',
    service_type: 'loan_packaging',
    loan_purpose: null,
    category: 'tax_return',
    display_name: 'Personal Tax Return - Year 2',
    description: 'Signed federal personal tax return for two years ago.',
    required: true,
    sort_order: 26,
    template_key: null,
    max_size_mb: 50,
    allowed_mime_types: ['application/pdf'],
    is_active: true,
  },
  {
    requirement_key: 'business_debt_summary',
    service_type: 'loan_packaging',
    loan_purpose: null,
    category: 'debt_schedule',
    display_name: 'Business Debt Summary',
    description: 'Current business liabilities with lender, payment, and maturity details.',
    required: true,
    sort_order: 30,
    template_key: 'business_debt_summary',
    max_size_mb: 25,
    allowed_mime_types: ['application/pdf', 'image/png', 'image/jpeg'],
    is_active: true,
  },
  {
    requirement_key: 'balance_sheet',
    service_type: 'loan_packaging',
    loan_purpose: null,
    category: 'financial_statement',
    display_name: 'Current Balance Sheet',
    description: 'Simple business balance sheet that confirms your assets equal liabilities plus equity.',
    required: true,
    sort_order: 40,
    template_key: 'balance_sheet',
    max_size_mb: 25,
    allowed_mime_types: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    is_active: true,
  },
  {
    requirement_key: 'income_statement_ytd',
    service_type: 'loan_packaging',
    loan_purpose: null,
    category: 'financial_statement',
    display_name: 'Income Statement - YTD',
    description: 'Current year-to-date profit and loss statement.',
    required: true,
    sort_order: 50,
    template_key: 'income_statement',
    max_size_mb: 25,
    allowed_mime_types: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    is_active: true,
  },
  {
    requirement_key: 'income_statement_annual_year_1',
    service_type: 'loan_packaging',
    loan_purpose: null,
    category: 'financial_statement',
    display_name: 'Income Statement - Annual (Year 1)',
    description: 'Full-year profit and loss statement for the most recent completed year.',
    required: true,
    sort_order: 51,
    template_key: 'income_statement',
    max_size_mb: 25,
    allowed_mime_types: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    is_active: true,
  },
  {
    requirement_key: 'income_statement_annual_year_2',
    service_type: 'loan_packaging',
    loan_purpose: null,
    category: 'financial_statement',
    display_name: 'Income Statement - Annual (Year 2)',
    description: 'Full-year profit and loss statement for two years ago.',
    required: true,
    sort_order: 52,
    template_key: 'income_statement',
    max_size_mb: 25,
    allowed_mime_types: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    is_active: true,
  },
  {
    requirement_key: 'business_tax_return_year_1',
    service_type: 'loan_packaging',
    loan_purpose: null,
    category: 'tax_return',
    display_name: 'Business Tax Return - Year 1',
    description: 'Signed federal business tax return for the most recent completed year.',
    required: true,
    sort_order: 60,
    template_key: null,
    max_size_mb: 50,
    allowed_mime_types: ['application/pdf'],
    is_active: true,
  },
  {
    requirement_key: 'business_tax_return_year_2',
    service_type: 'loan_packaging',
    loan_purpose: null,
    category: 'tax_return',
    display_name: 'Business Tax Return - Year 2',
    description: 'Signed federal business tax return for two years ago.',
    required: true,
    sort_order: 61,
    template_key: null,
    max_size_mb: 50,
    allowed_mime_types: ['application/pdf'],
    is_active: true,
  },
  {
    requirement_key: 'cover_letter',
    service_type: 'loan_packaging',
    loan_purpose: null,
    category: 'cover_letter',
    display_name: 'Lender Cover Letter',
    description: 'Narrative summary for lenders that positions the request and repayment strength.',
    required: false,
    sort_order: 70,
    template_key: null,
    max_size_mb: 10,
    allowed_mime_types: ['application/pdf', 'text/plain'],
    is_active: true,
  },
  {
    requirement_key: 'broker_fee_agreement',
    service_type: 'loan_brokering',
    loan_purpose: null,
    category: 'other',
    display_name: 'Signed Broker Fee Agreement',
    description:
      'Executed broker fee agreement authorizing BLA to broker the financing request and earn the closing-based fee only if funding occurs.',
    required: true,
    sort_order: 5,
    template_key: null,
    max_size_mb: 10,
    allowed_mime_types: ['application/pdf'],
    is_active: true,
  },
  purposeRequirement(
    'working_capital_bank_statements',
    'Working Capital',
    'Business Bank Statements (Last 3 Months)',
    'Provide business bank statements for the last three months.',
    210,
    'bank_statement',
    50,
    ['application/pdf'],
  ),
  purposeRequirement(
    'working_capital_ar_aging',
    'Working Capital',
    'Accounts Receivable Aging',
    'Detailed receivables aging to show current collections and customer payment behavior.',
    211,
    'other',
  ),
  purposeRequirement(
    'working_capital_ap_aging',
    'Working Capital',
    'Accounts Payable Aging',
    'Detailed payables aging to show vendor obligations and current working capital pressure.',
    212,
    'other',
  ),
  purposeRequirement(
    'equipment_purchase_quote_package',
    'Equipment Purchase',
    'Equipment Quote / Invoice / Purchase Order',
    'Provide the equipment quote, invoice, whitepaper, or purchase order tied to the request.',
    220,
    'other',
    50,
    ['application/pdf', 'image/png', 'image/jpeg'],
  ),
  purposeRequirement(
    'inventory_purchase_inventory_aging',
    'Inventory Purchase',
    'Inventory Aging',
    'Inventory aging report showing stock levels, turns, and aging categories.',
    230,
  ),
  purposeRequirement(
    'inventory_purchase_supplier_quotes',
    'Inventory Purchase',
    'Supplier Quotes / Purchase Orders',
    'Quotes or purchase orders supporting the inventory purchase request.',
    231,
  ),
  purposeRequirement(
    'business_acquisition_loi',
    'Business Acquisition',
    'LOI / Purchase Agreement',
    'Letter of intent or purchase agreement for the acquisition transaction.',
    240,
  ),
  purposeRequirement(
    'business_acquisition_target_financials',
    'Business Acquisition',
    'Target Company Financials',
    'Financial statements for the target company being acquired.',
    241,
  ),
  {
    requirement_key: 'business_acquisition_valuation',
    service_type: 'loan_packaging',
    loan_purpose: 'Business Acquisition',
    category: 'other',
    display_name: 'Valuation',
    description: 'Valuation support for the transaction price and business worth.',
    required: false,
    sort_order: 242,
    template_key: null,
    max_size_mb: 25,
    allowed_mime_types: ['application/pdf', 'image/png', 'image/jpeg'],
    is_active: true,
  },
  purposeRequirement(
    'business_acquisition_sources_uses',
    'Business Acquisition',
    'Source and Use of Funds',
    'Detailed sources and uses schedule for the acquisition financing.',
    243,
  ),
  purposeRequirement(
    'business_acquisition_buyer_resume',
    'Business Acquisition',
    'Buyer Resume',
    'Resume or background summary for the acquiring principal or operating buyer.',
    244,
  ),
  purposeRequirement(
    'business_acquisition_post_acquisition_projections',
    'Business Acquisition',
    'Post-Acquisition Projections',
    'Projected financial performance after closing the acquisition.',
    245,
  ),
  purposeRequirement(
    'cre_purchase_contract',
    'Commercial Real Estate Purchase',
    'Purchase Contract / LOI',
    'Purchase contract or letter of intent for the property acquisition.',
    250,
  ),
  purposeRequirement(
    'cre_purchase_rent_roll',
    'Commercial Real Estate Purchase',
    'Rent Roll',
    'Current rent roll, if the property has tenants.',
    251,
  ),
  purposeRequirement(
    'cre_purchase_operating_statements',
    'Commercial Real Estate Purchase',
    'Property Operating Statements',
    'Historical operating statements for the property, if applicable.',
    252,
  ),
  purposeRequirement(
    'cre_refinance_payoff_statement',
    'Commercial Real Estate Refinance',
    'Payoff Statement',
    'Current payoff statement for the loan being refinanced.',
    260,
  ),
  purposeRequirement(
    'cre_refinance_rent_roll',
    'Commercial Real Estate Refinance',
    'Rent Roll',
    'Current rent roll for the property, if applicable.',
    261,
  ),
  purposeRequirement(
    'cre_refinance_operating_statements',
    'Commercial Real Estate Refinance',
    'Property Operating Statements',
    'Historical operating statements for the property.',
    262,
  ),
  purposeRequirement(
    'debt_refinance_payoff_letters',
    'Debt Refinance / Consolidation',
    'Payoff Letters',
    'Payoff letters for each debt that will be refinanced or consolidated.',
    270,
  ),
  purposeRequirement(
    'debt_refinance_current_statements',
    'Debt Refinance / Consolidation',
    'Current Loan Statements',
    'Most recent statements for each debt being refinanced or consolidated.',
    271,
  ),
  purposeRequirement(
    'expansion_lease_loi',
    'Business Expansion / New Location',
    'Lease / LOI',
    'Lease agreement or letter of intent for the new location.',
    280,
  ),
  purposeRequirement(
    'expansion_buildout_budget',
    'Business Expansion / New Location',
    'Buildout Budget',
    'Detailed budget for buildout, opening costs, and location readiness.',
    281,
  ),
  purposeRequirement(
    'expansion_projections',
    'Business Expansion / New Location',
    'Expansion Projections',
    'Financial projections showing the impact of the new location or expansion.',
    282,
  ),
  purposeRequirement(
    'tenant_improvement_contractor_bids',
    'Tenant Improvements / Renovation',
    'Contractor Bids',
    'Contractor bids or proposals for the renovation work.',
    290,
  ),
  purposeRequirement(
    'tenant_improvement_budget',
    'Tenant Improvements / Renovation',
    'Renovation Budget',
    'Detailed renovation budget for labor, materials, and related costs.',
    291,
  ),
  purposeRequirement(
    'tenant_improvement_timeline',
    'Tenant Improvements / Renovation',
    'Renovation Timeline',
    'Timeline showing project phases, completion expectations, and milestones.',
    292,
  ),
  purposeRequirement(
    'tenant_improvement_lease_landlord_consent',
    'Tenant Improvements / Renovation',
    'Lease and Landlord Consent',
    'Current lease and landlord consent or approval for the planned improvements.',
    293,
  ),
  purposeRequirement(
    'partner_buyout_operating_agreement',
    'Partner Buyout',
    'Operating Agreement',
    'Operating agreement or governing document supporting the ownership structure.',
    300,
  ),
  purposeRequirement(
    'partner_buyout_cap_table',
    'Partner Buyout',
    'Cap Table',
    'Current capitalization table showing ownership percentages before the buyout.',
    301,
  ),
  purposeRequirement(
    'partner_buyout_agreement',
    'Partner Buyout',
    'Buyout Agreement',
    'Agreement governing the partner buyout transaction.',
    302,
  ),
  purposeRequirement(
    'partner_buyout_valuation',
    'Partner Buyout',
    'Valuation',
    'Valuation support for the partner buyout price.',
    303,
  ),
  purposeRequirement(
    'partner_buyout_repayment_impact',
    'Partner Buyout',
    'Repayment Impact Explanation',
    'Narrative explaining how the buyout affects operations and repayment capacity.',
    305,
  ),
  purposeRequirement(
    'franchise_agreement_approval',
    'Franchise Purchase',
    'Franchise Agreement / Approval',
    'Executed franchise agreement or franchisor approval documentation.',
    310,
  ),
  purposeRequirement(
    'franchise_startup_budget',
    'Franchise Purchase',
    'Startup Budget',
    'Detailed startup budget for the franchise location or launch.',
    311,
  ),
  purposeRequirement(
    'franchise_assumptions',
    'Franchise Purchase',
    'Franchisor Assumptions',
    'Franchisor assumptions, unit economics, or operating benchmarks.',
    312,
  ),
  purposeRequirement(
    'franchise_operator_resume',
    'Franchise Purchase',
    'Operator Resume',
    'Resume or operating background for the franchise operator or principal.',
    313,
  ),
  purposeRequirement(
    'bridge_exit_strategy',
    'Bridge Financing',
    'Exit Strategy',
    'Clear explanation of the expected bridge takeout or exit source.',
    320,
  ),
  purposeRequirement(
    'bridge_payoff_source',
    'Bridge Financing',
    'Payoff Source',
    'Documentation supporting the expected payoff source.',
    321,
  ),
  purposeRequirement(
    'bridge_maturity_timeline',
    'Bridge Financing',
    'Maturity Timeline',
    'Timeline for maturity, refinance, sale, or bridge exit milestones.',
    323,
  ),
  purposeRequirement(
    'bridge_pending_sale_refi_docs',
    'Bridge Financing',
    'Pending Sale / Refinance Docs',
    'Documents evidencing the pending sale, refinance, or exit event.',
    324,
  ),
  purposeRequirement(
    'bridge_short_term_cash_flow_plan',
    'Bridge Financing',
    'Short-Term Cash Flow Plan',
    'Short-term cash flow plan covering the bridge period.',
    325,
  ),
  purposeRequirement(
    'revolving_loc_ar_aging',
    'Revolving Line of Credit',
    'Accounts Receivable Aging',
    'Receivables aging to support line utilization and collection quality.',
    330,
  ),
  purposeRequirement(
    'revolving_loc_ap_aging',
    'Revolving Line of Credit',
    'Accounts Payable Aging',
    'Payables aging to show current obligations and working capital pressure.',
    331,
  ),
  purposeRequirement(
    'revolving_loc_customer_concentration',
    'Revolving Line of Credit',
    'Customer Concentration Report',
    'Report showing customer concentration and receivable exposure.',
    332,
  ),
  purposeRequirement(
    'revolving_loc_inventory_report',
    'Revolving Line of Credit',
    'Inventory Report',
    'Inventory report, if inventory supports the borrowing base.',
    333,
  ),
  purposeRequirement(
    'revolving_loc_seasonality_explanation',
    'Revolving Line of Credit',
    'Seasonality Explanation',
    'Narrative explaining seasonal cash flow swings and line usage needs.',
    335,
  ),
  purposeRequirement(
    'revolving_loc_bank_statements',
    'Revolving Line of Credit',
    'Business Bank Statements',
    'Provide 3 to 6 months of business bank statements for line underwriting.',
    336,
    'bank_statement',
    50,
    ['application/pdf'],
  ),
];
