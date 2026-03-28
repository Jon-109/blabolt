/** lib/templates/types.ts */

export type TemplateType =
  | 'balance_sheet'
  | 'income_statement'
  | 'personal_financial_statement'
  | 'personal_debt_summary'
  | 'business_debt_summary';

export interface BaseSubmission {
  id: string;
  user_id: string;
  template_type: TemplateType;
  form_data: unknown;      // cast per-template via generic
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BalanceSheetData {
  statementLabel?: string;
  statementType?: 'year_end' | 'ytd' | 'interim' | 'custom';
  periodStartDate?: string;
  periodEndDate?: string;
  asOfDate: string;
  businessInfo: {
    legalName: string;
    reportBasis?: 'accrual' | 'cash' | 'tax' | 'other';
    reportBasisOther?: string;
  };
  assets: {
    cashAndCashEquivalents?: number;
    accountsReceivable?: number;
    inventory?: number;
    prepaidExpenses?: number;
    otherCurrentAssets?: number;
    fixedAssetBreakdown?: {
      businessRealEstate?: number;
      vehicles?: number;
      machineryEquipment?: number;
      furnitureFixtures?: number;
      leaseholdImprovements?: number;
    };
    grossFixedAssets?: number;
    accumulatedDepreciation?: number;
    notesReceivable?: number;
    intangibleAssets?: number;
    investments?: number;
    otherNonCurrentAssets?: number;
  };
  liabilities: {
    accountsPayable?: number;
    accruedExpenses?: number;
    taxesPayable?: number;
    currentPortionLongTermDebt?: number;
    creditCardsAndLines?: number;
    deferredRevenue?: number;
    otherCurrentLiabilities?: number;
    longTermDebt?: number;
    shareholderLoans?: number;
    otherLongTermLiabilities?: number;
  };
  equity: {
    ownerContributions?: number;
    retainedEarnings?: number;
    ownerDistributions?: number;
    otherEquity?: number;
  };
  notes?: string;
}

export interface LegacyBalanceSheetData {
  statementLabel?: string;
  statementType?: 'year_end' | 'ytd' | 'interim' | 'custom';
  asOfDate: string;
  assets: {
    cash: number;
    accountsReceivable?: number;
    inventory?: number;
    otherCurrentAssets?: number;
    fixedAssets?: number;
    accumulatedDepreciation?: number;
    otherAssets?: number;
  };
  liabilities: {
    accountsPayable?: number;
    creditCards?: number;
    shortTermLoans?: number;
    longTermDebt?: number;
    otherLiabilities?: number;
  };
  equity: {
    ownersEquity?: number;
    retainedEarnings?: number;
  };
  notes?: string;
}

export interface IncomeStatementData {
  statementLabel?: string;
  statementType?: 'annual' | 'ytd' | 'quarterly' | 'custom';
  periodStart: string;
  periodEnd: string;
  businessInfo?: {
    name?: string;
  };
  revenue: {
    grossSales?: number;
    serviceRevenue?: number;
    otherRevenue?: number;
  };
  cogs?: {
    inventoryMaterialsCost?: number;
    directLabor?: number;
    shippingPackaging?: number;
    otherDirectCosts?: number;
  };
  operatingExpenses?: {
    payrollContractorPayments?: number;
    rentFacilityCosts?: number;
    utilitiesInternet?: number;
    marketingAdvertising?: number;
    softwareSubscriptions?: number;
    professionalServices?: number;
    insurance?: number;
    officeAdministrative?: number;
    vehicleTravel?: number;
    otherOperatingExpenses?: number;
  };
  interestExpense?: number;
  expenses?: {
    costOfGoodsSold?: number;
    salariesWages?: number;
    rent?: number;
    utilities?: number;
    marketing?: number;
    insurance?: number;
    depreciation?: number;
    interestExpense?: number;
    otherExpenses?: number;
  };
  notes?: string;
}

export interface PersonalFinancialStatementData {
  asOfDate: string;
  progressState?: {
    hasAccountsAndNotesReceivable?: 'yes' | 'no';
    hasRetirementAccounts?: 'yes' | 'no';
    hasLifeInsuranceCashValue?: 'yes' | 'no';
    hasStocksAndBonds?: 'yes' | 'no';
    realEstateCountChosen?: boolean;
    vehicleCountChosen?: boolean;
  };
  personalInfo: {
    name: string;
    address?: string;
    homeStreet?: string;
    homeCity?: string;
    homeState?: string;
    homeZip?: string;
    primaryPhone?: string;
    phone?: string;
    email?: string;
  };
  coApplicant?: {
    name?: string;
    address?: string;
  };
  businessInfo?: {
    applicantBusinessName?: string;
    businessType?: 'sole_proprietor' | 'llc' | 'corporation' | 's_corp' | 'partnership';
    applicantBusinessPhone?: string;
    businessAddressDifferentFromHome?: boolean;
    businessStreet?: string;
    businessCity?: string;
    businessState?: string;
    businessZip?: string;
  };
  declarations?: {
    isMarried?: 'yes' | 'no';
    isUsCitizen?: 'yes' | 'no';
    hasContingentLiability?: 'yes' | 'no';
    contingencyNotes?: string;
    hasLawsuitOrJudgment?: 'yes' | 'no';
    lawsuitNotes?: string;
    hasTaxDelinquency?: 'yes' | 'no';
    taxNotes?: string;
    hasGuarantees?: 'yes' | 'no';
    guaranteesNotes?: string;
  };
  assets: {
    cashChecking?: number;
    cashSavings?: number;
    accountsNotesReceivable?: number;
    lifeInsuranceCashSurrender?: number;
    stocksBonds?: number;
    realEstate?: number;
    automobiles?: number;
    personalProperty?: number;
    otherAssets?: number;
  };
  liabilities: {
    creditCards?: number;
    mortgages?: number;
    autoLoans?: number;
    studentLoans?: number;
    otherDebts?: number;
  };
  liabilityDetails?: {
    creditCards?: {
      hasBalances?: 'yes' | 'no';
      totalBalance?: number;
      totalMonthlyPayment?: number;
    };
    medicalBills?: {
      hasDebts?: 'yes' | 'no';
      totalBalance?: number;
    };
    studentLoans?: {
      hasLoans?: 'yes' | 'no';
      totalBalance?: number;
      totalMonthlyPayment?: number;
    };
    hasPersonalLoans?: 'yes' | 'no';
    personalLoans?: Array<{
      loanType?: 'personal_loan' | 'line_of_credit' | 'heloc' | 'business_loan_pg' | 'private_individual_loan';
      lenderName?: string;
      originalBalance?: number;
      currentBalance?: number;
      monthlyPayment?: number;
      isSecured?: 'yes' | 'no';
      collateralType?: 'real_estate' | 'vehicle' | 'investment_account' | 'business_assets' | 'personal_property' | 'other';
      collateralDescription?: string;
    }>;
    hasTaxesOwed?: 'yes' | 'no';
    taxesOwed?: Array<{
      authority?: string;
      originalBalance?: number;
      balanceOwed?: number;
      monthlyPayment?: number;
    }>;
    hasOtherObligations?: 'yes' | 'no';
    otherObligations?: Array<{
      description?: string;
      amountOwed?: number;
      monthlyPayment?: number;
    }>;
  };
  contingentLiabilities?: {
    asEndorserOrCoMaker?: {
      hasExposure?: 'yes' | 'no';
      estimatedAmount?: number;
    };
    legalClaimsAndJudgments?: {
      hasExposure?: 'yes' | 'no';
      estimatedAmount?: number;
    };
    provisionForFederalIncomeTax?: {
      hasExposure?: 'yes' | 'no';
      estimatedAmount?: number;
    };
    otherSpecialDebt?: {
      hasExposure?: 'yes' | 'no';
      estimatedAmount?: number;
    };
  };
  incomeDetails?: {
    employmentIncome?: {
      hasIncome?: 'yes' | 'no';
      averageGrossMonthlyIncome?: number;
    };
    rentalIncome?: {
      hasIncome?: 'yes' | 'no';
      averageNetMonthlyIncome?: number;
    };
    investmentIncome?: {
      hasIncome?: 'yes' | 'no';
      averageNetMonthlyIncome?: number;
    };
    otherIncome?: {
      hasIncome?: 'yes' | 'no';
      averageMonthlyIncome?: number;
      description?: string;
      sources?: Array<{
        sourceType?: string;
        description?: string;
        averageMonthlyAmount?: number;
      }>;
    };
  };
  annualIncome?: {
    salary?: number;
    netInvestmentIncome?: number;
    realEstateIncome?: number;
    otherIncome?: number;
    incomeContingencies?: string;
  };
  realEstateOwned?: Array<{
    propertyType?: 'primary_residence' | 'rental_property' | 'second_home' | 'land' | 'commercial_property' | 'other';
    propertyAddress?: string;
    datePurchased?: string;
    originalCost?: number;
    presentMarketValue?: number;
    mortgageHolderName?: string;
    mortgageHolderAddress?: string;
    mortgageAccountNumber?: string;
    mortgageBalance?: number;
    amountOfPaymentPerMonth?: number;
    status?: 'current' | 'thirty_days_late' | 'sixty_plus_days_late' | 'paid_off';
  }>;
  stocksAndBonds?: Array<{
    symbol?: string;
    issuerName?: string;
    numberOfShares?: number;
    cost?: number;
    marketValue?: number;
    dateOfQuote?: string;
    exchange?: string;
  }>;
  otherPersonalPropertyAndOtherAssets?: Array<{
    description?: string;
    value?: number;
  }>;
  retirementAccounts?: Array<{
    accountType?: 'traditional_ira' | 'roth_ira' | '401k' | 'sep_ira' | 'simple_ira' | 'solo_401k' | 'other';
    institutionName?: string;
    currentEstimatedValue?: number;
    pledgedAsCollateral?: 'yes' | 'no';
    lenderName?: string;
    lienAmount?: number;
    monthlyPayment?: number;
  }>;
  vehiclesOwned?: Array<{
    year?: number;
    make?: string;
    model?: string;
    description?: string;
    currentEstimatedValue?: number;
    loanBalance?: number;
    monthlyPayment?: number;
  }>;
  accountsAndNotesReceivable?: Array<{
    debtorName?: string;
    originalAmountLoaned?: number;
    currentBalanceOwed?: number;
    monthlyPaymentReceived?: number;
    hasWrittenAgreement?: 'yes' | 'no';
    isSecuredByCollateral?: 'yes' | 'no';
    collateralDescription?: string;
  }>;
  notesPayableToBanksAndOthers?: Array<{
    nameAndAddressOfNoteholder?: string;
    originalBalance?: number;
    currentBalance?: number;
    paymentAmount?: number;
    frequency?: string;
    howSecuredOrEndorsed?: string;
  }>;
  lifeInsuranceHeld?: Array<{
    companyName?: string;
    policyType?: 'whole_life' | 'universal_life' | 'variable_life' | 'indexed_universal_life' | 'other_permanent' | 'not_sure';
    faceAmount?: number;
    cashSurrenderValue?: number;
    beneficiaries?: string;
    pledgedAsCollateral?: 'yes' | 'no';
    lenderName?: string;
    loanAgainstPolicy?: number;
  }>;
  sba413Page3Entries?: Array<{
    section?: string;
    description?: string;
    amount?: number;
  }>;
  eSignature?: {
    fullName?: string;
    signedAt?: string;
    attested?: boolean;
  };
  notes?: string;
}

export interface PersonalDebtSummaryData {
  asOfDate: string;
  personalInfo: {
    name: string;
  };
  debts: Array<{
    category?: 'credit_cards' | 'line_of_credit' | 'real_estate' | 'student_debt' | 'vehicle' | 'other_debt';
    creditor: string;
    accountNumber?: string;
    originalAmount: number;
    currentBalance: number;
    monthlyPayment: number;
    creditLimit?: number;
    interestRate?: number;
    maturityDate?: string;
    collateral?: string;
  }>;
  notes?: string;
}

export interface BusinessDebtSummaryData {
  asOfDate: string;
  businessInfo: {
    name: string;
    ein?: string;
    address?: string;
  };
  debts: Array<{
    category?: 'credit_cards' | 'line_of_credit' | 'real_estate' | 'term_loans' | 'vehicle_equipment' | 'other_debt';
    creditor: string;
    accountNumber?: string;
    originalAmount: number;
    currentBalance: number;
    monthlyPayment: number;
    creditLimit?: number;
    interestRate?: number;
    maturityDate?: string;
    collateral?: string;
    personalGuarantee?: boolean;
  }>;
  notes?: string;
}

export type SubmissionDataMap = {
  balance_sheet: BalanceSheetData;
  income_statement: IncomeStatementData;
  personal_financial_statement: PersonalFinancialStatementData;
  personal_debt_summary: PersonalDebtSummaryData;
  business_debt_summary: BusinessDebtSummaryData;
};

export type TemplateSubmission<T extends TemplateType = TemplateType> = BaseSubmission & {
  template_type: T;
  form_data: SubmissionDataMap[T];
};
