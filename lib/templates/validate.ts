/** lib/templates/validate.ts */

import { z } from 'zod';

export const BalanceSheetSchema = z.object({
  asOfDate: z.string().min(1, "As of date is required"),
  assets: z.object({
    cash: z.number().nonnegative("Cash must be non-negative"),
    accountsReceivable: z.number().nonnegative().optional(),
    inventory: z.number().nonnegative().optional(),
    otherCurrentAssets: z.number().nonnegative().optional(),
    fixedAssets: z.number().nonnegative().optional(),
    accumulatedDepreciation: z.number().nonnegative().optional(),
    otherAssets: z.number().nonnegative().optional(),
  }),
  liabilities: z.object({
    accountsPayable: z.number().nonnegative().optional(),
    creditCards: z.number().nonnegative().optional(),
    shortTermLoans: z.number().nonnegative().optional(),
    longTermDebt: z.number().nonnegative().optional(),
    otherLiabilities: z.number().nonnegative().optional(),
  }),
  equity: z.object({
    ownersEquity: z.number().optional(),
    retainedEarnings: z.number().optional(),
  }),
  notes: z.string().optional(),
});

export const IncomeStatementSchema = z.object({
  periodStart: z.string().min(1, "Period start date is required"),
  periodEnd: z.string().min(1, "Period end date is required"),
  revenue: z.object({
    grossSales: z.number().nonnegative().optional(),
    serviceRevenue: z.number().nonnegative().optional(),
    otherRevenue: z.number().nonnegative().optional(),
  }),
  expenses: z.object({
    costOfGoodsSold: z.number().nonnegative().optional(),
    salariesWages: z.number().nonnegative().optional(),
    rent: z.number().nonnegative().optional(),
    utilities: z.number().nonnegative().optional(),
    marketing: z.number().nonnegative().optional(),
    insurance: z.number().nonnegative().optional(),
    depreciation: z.number().nonnegative().optional(),
    interestExpense: z.number().nonnegative().optional(),
    otherExpenses: z.number().nonnegative().optional(),
  }),
  notes: z.string().optional(),
});

export const PersonalFinancialStatementSchema = z.object({
  asOfDate: z.string().min(1, "As of date is required"),
  personalInfo: z.object({
    name: z.string().min(1, "Name is required"),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
  }),
  assets: z.object({
    cashChecking: z.number().nonnegative().optional(),
    cashSavings: z.number().nonnegative().optional(),
    stocksBonds: z.number().nonnegative().optional(),
    realEstate: z.number().nonnegative().optional(),
    automobiles: z.number().nonnegative().optional(),
    personalProperty: z.number().nonnegative().optional(),
    otherAssets: z.number().nonnegative().optional(),
  }),
  liabilities: z.object({
    creditCards: z.number().nonnegative().optional(),
    mortgages: z.number().nonnegative().optional(),
    autoLoans: z.number().nonnegative().optional(),
    studentLoans: z.number().nonnegative().optional(),
    otherDebts: z.number().nonnegative().optional(),
  }),
  notes: z.string().optional(),
});

export const PersonalDebtSummarySchema = z.object({
  asOfDate: z.string().min(1, "As of date is required"),
  personalInfo: z.object({
    name: z.string().min(1, "Name is required"),
    ssn: z.string().optional(),
  }),
  debts: z.array(z.object({
    creditor: z.string().min(1, "Creditor name is required"),
    accountNumber: z.string().optional(),
    originalAmount: z.number().nonnegative("Original amount must be non-negative"),
    currentBalance: z.number().nonnegative("Current balance must be non-negative"),
    monthlyPayment: z.number().nonnegative("Monthly payment must be non-negative"),
    interestRate: z.number().min(0).max(100).optional(),
    maturityDate: z.string().optional(),
    collateral: z.string().optional(),
  })),
  notes: z.string().optional(),
});

export const BusinessDebtSummarySchema = z.object({
  asOfDate: z.string().min(1, "As of date is required"),
  businessInfo: z.object({
    name: z.string().min(1, "Business name is required"),
    ein: z.string().optional(),
    address: z.string().optional(),
  }),
  debts: z.array(z.object({
    creditor: z.string().min(1, "Creditor name is required"),
    accountNumber: z.string().optional(),
    originalAmount: z.number().nonnegative("Original amount must be non-negative"),
    currentBalance: z.number().nonnegative("Current balance must be non-negative"),
    monthlyPayment: z.number().nonnegative("Monthly payment must be non-negative"),
    interestRate: z.number().min(0).max(100).optional(),
    maturityDate: z.string().optional(),
    collateral: z.string().optional(),
    personalGuarantee: z.boolean().optional(),
  })),
  notes: z.string().optional(),
});

export const TemplateSchemaMap = {
  balance_sheet: BalanceSheetSchema,
  income_statement: IncomeStatementSchema,
  personal_financial_statement: PersonalFinancialStatementSchema,
  personal_debt_summary: PersonalDebtSummarySchema,
  business_debt_summary: BusinessDebtSummarySchema,
} as const;
