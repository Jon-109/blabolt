// SBA Form 413 Personal Financial Statement - Type Definitions

// Smart Gate Flags
export interface SmartGateFlags {
  is_sba: boolean;
  include_spouse: boolean;
  has_real_estate: boolean;
  has_securities: boolean;
  has_retirement: boolean;
  has_life_csv: boolean;
  owns_business: boolean;
  has_personal_guarantees: boolean;
  has_vehicles: boolean;
  has_personal_debt: boolean; // Keep for backwards compatibility, not used in UI
  owes_taxes: boolean; // Keep for backwards compatibility, not used in UI
  has_legal: boolean;
  has_crypto: boolean;
}

// Identity & Basic Info
export interface IdentityData {
  as_of_date: string;
  filing_type: 'individual' | 'joint';
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  applicant_address_1: string;
  applicant_city: string;
  applicant_state: string;
  applicant_zip: string;
  spouse_included: boolean;
  spouse_name?: string;
  business_name?: string;
  business_address_1?: string;
  business_city?: string;
  business_state?: string;
  business_zip?: string;
  entity_type?: string;
}

// Assets
export interface CashAccount {
  id: string;
  institution: string;
  account_type: string;
  balance: number;
}

export interface Security {
  id: string;
  institution: string;
  account_nickname: string;
  security_name: string;
  ticker?: string;
  quantity: number;
  market_value: number;
  value_date: string;
}

export interface RetirementAccount {
  id: string;
  institution: string;
  plan_type: string;
  balance: number;
  value_date: string;
}

export interface LifeInsurancePolicy {
  id: string;
  company: string;
  policy_type: string;
  policy_type_other?: string;
  face_amount: number;
  cash_surrender_value: number;
  beneficiary: string;
  loan_outstanding: boolean;
  loan_balance?: number;
}

export interface RealEstateProperty {
  id: string;
  property_type: 'primary' | 'rental' | 'land' | 'other';
  address_full: string;
  purchase_date: string;
  original_cost: number;
  market_value: number;
  value_source: 'owner_estimate' | 'zillow' | 'appraisal' | 'other';
  status: 'current' | 'late' | 'forbearance' | 'paid_off';
  mortgage_lender?: string;
  mortgage_balance?: number;
  mortgage_payment?: number;
}

export interface Auto {
  id: string;
  year: string;
  make: string;
  model: string;
  value: number;
  financed: boolean;
  loan_balance?: number;
  monthly_payment?: number;
}

export interface OtherPersonalProperty {
  id: string;
  description: string;
  value: number;
  pledged: boolean;
  lienholder?: string;
  lien_balance?: number;
  lien_terms?: string;
  delinquent: boolean;
}

export interface OtherAsset {
  id: string;
  asset_type: 'HSA' | 'trust' | 'crypto' | 'other';
  asset_type_other?: string;
  description: string;
  quantity?: number;
  value: number;
  value_date?: string;
}

export interface AssetsData {
  cash_accounts: CashAccount[];
  securities: Security[];
  retirement_accounts: RetirementAccount[];
  life_policies: LifeInsurancePolicy[];
  real_estate: RealEstateProperty[];
  autos: Auto[];
  other_personal_property: OtherPersonalProperty[];
  other_assets: OtherAsset[];
}

// Liabilities
export interface CreditCard {
  id: string;
  issuer: string;
  balance: number;
  min_payment: number;
}

export interface NoteLoan {
  id: string;
  lender_name: string;
  lender_address: string;
  original_amount: number;
  current_balance: number;
  payment_amount: number;
  payment_frequency: 'monthly' | 'quarterly' | 'annual';
  secured: boolean;
  collateral_desc?: string;
  maturity_date: string;
  status: 'current' | 'late' | 'default';
  is_student_loan?: boolean;
}

export interface InstallmentAccount {
  id: string;
  lender: string;
  balance: number;
  monthly_payment: number;
  status: 'current' | 'late';
  auto_ref_id?: string; // Links to Auto if applicable
}

export interface Mortgage {
  id: string;
  property_ref_id: string; // Links to RealEstateProperty
  lender: string;
  account_no: string;
  current_balance: number;
  monthly_pi: number;
  escrow_included: boolean;
  heloc: boolean;
  heloc_limit?: number;
  heloc_drawn?: number;
  status: 'current' | 'late' | 'forbearance' | 'deferral';
}

export interface UnpaidTax {
  id: string;
  tax_type: 'federal_income' | 'state_income' | 'payroll' | 'property' | 'sales' | 'other';
  tax_years: string;
  to_whom: string;
  amount: number;
  payment_plan_terms?: string;
  lien: boolean;
  lien_property_ref_id?: string;
}

export interface OtherLiability {
  id: string;
  description: string;
  to_whom: string;
  amount: number;
  terms?: string;
}

export interface LiabilitiesData {
  credit_cards: CreditCard[];
  notes_loans: NoteLoan[];
  installments_auto: InstallmentAccount[];
  installments_other: InstallmentAccount[];
  mortgages: Mortgage[];
  unpaid_taxes: UnpaidTax[];
  other_liabilities: OtherLiability[];
}

// Income & Contingent
export interface IncomeData {
  annual_salary: number;
  annual_net_investment_income: number;
  annual_real_estate_income: number;
  annual_other_income_amount: number;
  annual_other_income_desc?: string;
}

export interface PersonalGuarantee {
  id: string;
  business_name: string;
  lender: string;
  original_amount: number;
  current_balance: number;
  monthly_payment: number;
  purpose_type: 'term' | 'equipment' | 'loc' | 'lease' | 'mca' | 'other';
  guarantee_type: 'limited' | 'unlimited';
  joint_several: 'joint' | 'several';
  collateral_desc?: string;
}

export interface ContingentLiabilitiesData {
  contingent_endorser_amount: number;
  contingent_legal_claims_amount: number;
  contingent_legal_claims_desc?: string;
  contingent_fed_tax_provision_amount: number;
  contingent_other_special_debt_amount: number;
  contingent_other_special_debt_desc?: string;
  personal_guarantees: PersonalGuarantee[];
}

// Declarations
export interface DeclarationsData {
  lawsuits_or_judgments: boolean;
  lawsuits_details?: string;
  bankruptcy_history: boolean;
  bankruptcy_details?: string;
  unlisted_leases_or_contracts: boolean;
  leases_details?: string;
  partner_officer_elsewhere: boolean;
  partner_details?: string;
  jointly_held_or_trust_assets: boolean;
  joint_trust_details?: string;
}

// Signatures
export interface SignatureData {
  applicant_signature_blob?: string;
  applicant_signature_date?: string;
  applicant_print_name?: string;
  applicant_ssn_full?: string;
  spouse_signature_blob?: string;
  spouse_signature_date?: string;
  spouse_print_name?: string;
  spouse_ssn_full?: string;
}

// Complete Form Data
export interface SBA413FormData {
  smart_gate: SmartGateFlags;
  identity: IdentityData;
  assets: AssetsData;
  liabilities: LiabilitiesData;
  income: IncomeData;
  contingent: ContingentLiabilitiesData;
  declarations: DeclarationsData;
  signatures: SignatureData;
}

// Validation State
export interface ValidationErrors {
  [key: string]: string;
}

// Form Step
export type FormStep = 'smart-gate' | 'identity' | 'assets' | 'liabilities' | 'income-contingent' | 'declarations' | 'review';
