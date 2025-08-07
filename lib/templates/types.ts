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
  // minimal v1; expand later
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
  periodStart: string;
  periodEnd: string;
  revenue: {
    grossSales?: number;
    serviceRevenue?: number;
    otherRevenue?: number;
  };
  expenses: {
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
  personalInfo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  assets: {
    cashChecking?: number;
    cashSavings?: number;
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
  notes?: string;
}

export interface PersonalDebtSummaryData {
  asOfDate: string;
  personalInfo: {
    name: string;
    ssn?: string;
  };
  debts: Array<{
    creditor: string;
    accountNumber?: string;
    originalAmount: number;
    currentBalance: number;
    monthlyPayment: number;
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
    creditor: string;
    accountNumber?: string;
    originalAmount: number;
    currentBalance: number;
    monthlyPayment: number;
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
