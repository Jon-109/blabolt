import type { TemplateKey } from './constants';
import type { TemplateValues } from './template-engine';
import type {
  BalanceSheetData,
  BusinessDebtSummaryData,
  IncomeStatementData,
  PersonalDebtSummaryData,
  PersonalFinancialStatementData,
  SubmissionDataMap,
  TemplateType,
} from '@/lib/templates/types';

const CURRENCY_FIELDS = ['balance', 'amount', 'payment', 'income', 'debt', 'assets', 'liabilities'];

type AnyRow = Record<string, unknown>;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function yearStartIsoDate(): string {
  const today = new Date();
  return new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = Number(value.replace(/[$,%\s,]/g, ''));
    return Number.isFinite(normalized) ? normalized : 0;
  }

  return 0;
}

function optionalNumber(value: unknown): number | undefined {
  const numeric = toNumber(value);
  return numeric > 0 ? numeric : undefined;
}

function normalizeContextValue(key: string, value: unknown): unknown {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return undefined;
    }

    const isCurrencyLike = CURRENCY_FIELDS.some((segment) => key.includes(segment));
    if (isCurrencyLike && value === 0) {
      return undefined;
    }

    return value;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return value;
}

export function normalizeTemplateContext(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  const entries = Object.entries(raw as Record<string, unknown>)
    .map(([key, value]) => [key, normalizeContextValue(key, value)] as const)
    .filter(([, value]) => value !== undefined);

  return Object.fromEntries(entries);
}

export function mergeTemplateContexts(
  currentContext: Record<string, unknown>,
  updates: Record<string, unknown>,
): Record<string, unknown> {
  const normalizedCurrent = normalizeTemplateContext(currentContext);
  const normalizedUpdates = normalizeTemplateContext(updates);

  return {
    ...normalizedCurrent,
    ...normalizedUpdates,
  };
}

function collectCashFlowDebtEntries(cashFlowDebts: unknown): Array<Record<string, unknown>> {
  if (!cashFlowDebts) {
    return [];
  }

  if (Array.isArray(cashFlowDebts)) {
    return cashFlowDebts.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object');
  }

  if (typeof cashFlowDebts === 'object' && cashFlowDebts) {
    const entries = (cashFlowDebts as { entries?: unknown }).entries;
    if (Array.isArray(entries)) {
      return entries.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object');
    }
  }

  return [];
}

export function buildCashFlowTemplatePrefill(cashFlowAnalysis: AnyRow | null): Record<string, unknown> {
  if (!cashFlowAnalysis) {
    return {};
  }

  const entries = collectCashFlowDebtEntries(cashFlowAnalysis.debts);

  const sums = {
    lineOfCreditBalance: 0,
    lineOfCreditPayment: 0,
    equipmentBalance: 0,
    equipmentPayment: 0,
    commercialMortgageBalance: 0,
    commercialMortgagePayment: 0,
    otherBalance: 0,
    otherPayment: 0,
  };

  for (const entry of entries) {
    const category = asString(entry.category).toUpperCase();
    const balance = toNumber(entry.outstandingBalance);
    const payment = toNumber(entry.monthlyPayment);

    if (category === 'LINE_OF_CREDIT') {
      sums.lineOfCreditBalance += balance;
      sums.lineOfCreditPayment += payment;
      continue;
    }

    if (category === 'VEHICLE_EQUIPMENT') {
      sums.equipmentBalance += balance;
      sums.equipmentPayment += payment;
      continue;
    }

    if (category === 'REAL_ESTATE') {
      sums.commercialMortgageBalance += balance;
      sums.commercialMortgagePayment += payment;
      continue;
    }

    sums.otherBalance += balance;
    sums.otherPayment += payment;
  }

  return normalizeTemplateContext({
    business_name: asNonEmptyString(cashFlowAnalysis.business_name),
    business_owner_name: [asNonEmptyString(cashFlowAnalysis.first_name), asNonEmptyString(cashFlowAnalysis.last_name)]
      .filter(Boolean)
      .join(' '),
    loan_purpose: asNonEmptyString(cashFlowAnalysis.loan_purpose),
    loan_amount: toNumber(cashFlowAnalysis.desired_amount),
    annual_revenue: toNumber((cashFlowAnalysis.financials as AnyRow | null)?.annualRevenue),
    report_date: todayIsoDate(),
    line_of_credit_balance: sums.lineOfCreditBalance,
    line_of_credit_payment: sums.lineOfCreditPayment,
    equipment_loan_balance: sums.equipmentBalance,
    equipment_loan_payment: sums.equipmentPayment,
    commercial_mortgage_balance: sums.commercialMortgageBalance,
    commercial_mortgage_payment: sums.commercialMortgagePayment,
    other_business_debt_balance: sums.otherBalance,
    other_business_debt_payment: sums.otherPayment,
  });
}

export function buildLoanRequestTemplateContext(
  loanRequest: AnyRow | null,
  cashFlowAnalysis: AnyRow | null = null,
  templateSharedContext: Record<string, unknown> = {},
): Record<string, unknown> {
  const cashFlowContext = buildCashFlowTemplatePrefill(cashFlowAnalysis);
  const sharedContext = normalizeTemplateContext(templateSharedContext);
  const loanContext = normalizeTemplateContext({
    business_name: asNonEmptyString(loanRequest?.business_name),
    loan_purpose: asNonEmptyString(loanRequest?.loan_purpose),
    loan_amount: toNumber(loanRequest?.loan_amount),
    annual_revenue: toNumber(loanRequest?.annual_revenue),
    years_in_business: toNumber(loanRequest?.years_in_business),
    business_description: asNonEmptyString(loanRequest?.business_description),
  });

  // Precedence: loan request values > cash flow analysis > persisted shared context.
  return normalizeTemplateContext({
    ...sharedContext,
    ...cashFlowContext,
    ...loanContext,
  });
}

interface SeedOptions {
  storedSharedContext?: Record<string, unknown>;
  loanRequestContext?: Record<string, unknown>;
  cashFlowPrefill?: Record<string, unknown>;
}

export function buildTemplateSeedValues(
  templateKey: TemplateKey,
  existingValues: TemplateValues,
  options: SeedOptions = {},
): TemplateValues {
  const shared = normalizeTemplateContext(options.storedSharedContext);
  const loanContext = normalizeTemplateContext(options.loanRequestContext);
  const cashFlow = normalizeTemplateContext(options.cashFlowPrefill);

  const baseDate =
    asNonEmptyString(shared.statement_date) ||
    asNonEmptyString(shared.report_date) ||
    asNonEmptyString(cashFlow.report_date) ||
    todayIsoDate();

  const mergedContext = {
    ...loanContext,
    ...shared,
    ...cashFlow,
  };

  const defaultsByTemplate: Partial<Record<TemplateKey, TemplateValues>> = {
    balance_sheet: {
      statement_date: baseDate,
      business_name: mergedContext.business_name,
    },
    income_statement: {
      period_start: asNonEmptyString(shared.period_start) || yearStartIsoDate(),
      period_end: asNonEmptyString(shared.period_end) || todayIsoDate(),
      business_name: mergedContext.business_name,
    },
    personal_financial_statement: {
      statement_date: baseDate,
      owner_name: shared.owner_name || shared.borrower_name || cashFlow.business_owner_name,
      owner_phone: shared.owner_phone,
      owner_email: shared.owner_email,
      owner_address: shared.owner_address,
    },
    personal_debt_summary: {
      report_date: baseDate,
      borrower_name: shared.borrower_name || shared.owner_name || cashFlow.business_owner_name,
      monthly_income: shared.monthly_income,
    },
    business_debt_summary: {
      report_date: baseDate,
      business_name: mergedContext.business_name,
      line_of_credit_balance: mergedContext.line_of_credit_balance,
      line_of_credit_payment: mergedContext.line_of_credit_payment,
      equipment_loan_balance: mergedContext.equipment_loan_balance,
      equipment_loan_payment: mergedContext.equipment_loan_payment,
      commercial_mortgage_balance: mergedContext.commercial_mortgage_balance,
      commercial_mortgage_payment: mergedContext.commercial_mortgage_payment,
      other_business_debt_balance: mergedContext.other_business_debt_balance,
      other_business_debt_payment: mergedContext.other_business_debt_payment,
    },
  };

  return {
    ...(defaultsByTemplate[templateKey] ?? {}),
    ...existingValues,
  };
}

export function buildSharedContextFromTemplateValues(
  templateKey: TemplateKey,
  values: TemplateValues,
): Record<string, unknown> {
  const updates: Record<string, unknown> = {};

  const setIfPresent = (contextKey: string, value: unknown) => {
    const normalized = normalizeContextValue(contextKey, value);
    if (normalized !== undefined) {
      updates[contextKey] = normalized;
    }
  };

  if (templateKey === 'balance_sheet') {
    setIfPresent('statement_date', values.statement_date);
    setIfPresent('business_name', values.business_name);
  }

  if (templateKey === 'income_statement') {
    setIfPresent('period_start', values.period_start);
    setIfPresent('period_end', values.period_end);
    setIfPresent('business_name', values.business_name);
  }

  if (templateKey === 'personal_financial_statement') {
    setIfPresent('statement_date', values.statement_date);
    setIfPresent('owner_name', values.owner_name);
    setIfPresent('owner_phone', values.owner_phone);
    setIfPresent('owner_email', values.owner_email);
    setIfPresent('owner_address', values.owner_address);
  }

  if (templateKey === 'personal_debt_summary') {
    setIfPresent('report_date', values.report_date);
    setIfPresent('borrower_name', values.borrower_name);
    setIfPresent('monthly_income', values.monthly_income);
  }

  if (templateKey === 'business_debt_summary') {
    setIfPresent('report_date', values.report_date);
    setIfPresent('business_name', values.business_name);

    setIfPresent('line_of_credit_balance', values.line_of_credit_balance);
    setIfPresent('line_of_credit_payment', values.line_of_credit_payment);
    setIfPresent('equipment_loan_balance', values.equipment_loan_balance);
    setIfPresent('equipment_loan_payment', values.equipment_loan_payment);
    setIfPresent('commercial_mortgage_balance', values.commercial_mortgage_balance);
    setIfPresent('commercial_mortgage_payment', values.commercial_mortgage_payment);
    setIfPresent('other_business_debt_balance', values.other_business_debt_balance);
    setIfPresent('other_business_debt_payment', values.other_business_debt_payment);
  }

  return normalizeTemplateContext(updates);
}

function buildDebtRows(rows: Array<{
  creditor: string;
  balance?: unknown;
  payment?: unknown;
  interestRate?: unknown;
  personalGuarantee?: unknown;
}>): Array<{
  creditor: string;
  accountNumber?: string;
  originalAmount: number;
  currentBalance: number;
  monthlyPayment: number;
  interestRate?: number;
  maturityDate?: string;
  collateral?: string;
  personalGuarantee?: boolean;
}> {
  return rows
    .map((row) => {
      const currentBalance = toNumber(row.balance);
      const monthlyPayment = toNumber(row.payment);
      const interestRate = toNumber(row.interestRate);

      if (currentBalance <= 0 && monthlyPayment <= 0) {
        return null;
      }

      return {
        creditor: row.creditor,
        originalAmount: currentBalance,
        currentBalance,
        monthlyPayment,
        interestRate: interestRate > 0 ? interestRate : undefined,
        personalGuarantee: typeof row.personalGuarantee === 'boolean' ? row.personalGuarantee : undefined,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
}

export function toLegacyTemplateSubmissionData(
  templateKey: TemplateKey,
  values: TemplateValues,
): SubmissionDataMap[TemplateType] {
  switch (templateKey) {
    case 'balance_sheet': {
      const payload: BalanceSheetData = {
        asOfDate: asString(values.statement_date) || todayIsoDate(),
        businessInfo: {
          legalName: asString(values.business_legal_name) || asString(values.business_name) || '',
          reportBasis: 'accrual',
          reportBasisOther: '',
        },
        assets: {
          cashAndCashEquivalents: Math.max(toNumber(values.cash), 0),
          accountsReceivable: optionalNumber(values.accounts_receivable),
          inventory: optionalNumber(values.inventory),
          prepaidExpenses: undefined,
          otherCurrentAssets: optionalNumber(values.other_current_assets),
          grossFixedAssets: optionalNumber(values.fixed_assets),
          accumulatedDepreciation: optionalNumber(values.accumulated_depreciation),
          notesReceivable: undefined,
          intangibleAssets: undefined,
          investments: undefined,
          otherNonCurrentAssets: optionalNumber(values.other_assets),
        },
        liabilities: {
          accountsPayable: optionalNumber(values.accounts_payable),
          accruedExpenses: undefined,
          taxesPayable: undefined,
          currentPortionLongTermDebt: optionalNumber(values.short_term_loans),
          creditCardsAndLines: optionalNumber(values.credit_card_liabilities),
          deferredRevenue: undefined,
          otherCurrentLiabilities: undefined,
          longTermDebt: optionalNumber(values.long_term_debt),
          shareholderLoans: undefined,
          otherLongTermLiabilities: optionalNumber(values.other_liabilities),
        },
        equity: {
          ownerContributions: optionalNumber(values.owners_equity),
          retainedEarnings: optionalNumber(values.retained_earnings),
          ownerDistributions: undefined,
          otherEquity: undefined,
        },
        notes: asNonEmptyString(values.notes) ?? undefined,
      };

      return payload;
    }

    case 'income_statement': {
      const payload: IncomeStatementData = {
        periodStart: asString(values.period_start) || yearStartIsoDate(),
        periodEnd: asString(values.period_end) || todayIsoDate(),
        revenue: {
          grossSales: optionalNumber(values.gross_sales),
          serviceRevenue: optionalNumber(values.service_revenue),
          otherRevenue: optionalNumber(values.other_revenue),
        },
        cogs: {
          inventoryMaterialsCost: optionalNumber(values.inventory_materials_cost) ?? optionalNumber(values.cost_of_goods_sold),
          directLabor: optionalNumber(values.direct_labor),
          shippingPackaging: optionalNumber(values.shipping_packaging),
          otherDirectCosts: optionalNumber(values.other_direct_costs),
        },
        operatingExpenses: {
          payrollContractorPayments: optionalNumber(values.payroll_contractor_payments) ?? optionalNumber(values.salaries_wages),
          rentFacilityCosts: optionalNumber(values.rent_facility_costs) ?? optionalNumber(values.rent),
          utilitiesInternet: optionalNumber(values.utilities_internet) ?? optionalNumber(values.utilities),
          marketingAdvertising: optionalNumber(values.marketing_advertising) ?? optionalNumber(values.marketing),
          softwareSubscriptions: optionalNumber(values.software_subscriptions),
          professionalServices: optionalNumber(values.professional_services),
          insurance: optionalNumber(values.insurance),
          officeAdministrative: optionalNumber(values.office_administrative),
          vehicleTravel: optionalNumber(values.vehicle_travel),
          otherOperatingExpenses:
            optionalNumber(values.other_operating_expenses) ??
            optionalNumber(values.other_expenses) ??
            optionalNumber(values.depreciation),
        },
        interestExpense: optionalNumber(values.interest_expense),
        notes: asNonEmptyString(values.notes) ?? undefined,
      };

      return payload;
    }

    case 'personal_financial_statement': {
      const payload: PersonalFinancialStatementData = {
        asOfDate: asString(values.statement_date) || todayIsoDate(),
        personalInfo: {
          name: asString(values.owner_name) || 'Borrower',
          address: asNonEmptyString(values.owner_address) ?? undefined,
          phone: asNonEmptyString(values.owner_phone) ?? undefined,
          email: asNonEmptyString(values.owner_email) ?? undefined,
        },
        assets: {
          cashChecking: optionalNumber(values.cash_on_hand),
          cashSavings: undefined,
          stocksBonds: optionalNumber(values.marketable_securities),
          realEstate: optionalNumber(values.real_estate_value),
          automobiles: optionalNumber(values.personal_property_value),
          personalProperty: optionalNumber(values.business_ownership_value),
          otherAssets: optionalNumber(values.other_assets),
        },
        liabilities: {
          creditCards: optionalNumber(values.credit_card_debt),
          mortgages: optionalNumber(values.mortgage_debt),
          autoLoans: optionalNumber(values.auto_loans),
          studentLoans: optionalNumber(values.student_loans),
          otherDebts: optionalNumber(values.other_liabilities) ?? optionalNumber(values.tax_liabilities),
        },
        notes: asNonEmptyString(values.notes) ?? asNonEmptyString(values.contingent_liabilities_notes) ?? undefined,
      };

      return payload;
    }

    case 'personal_debt_summary': {
      const debts = buildDebtRows([
        {
          creditor: 'Mortgage',
          balance: values.mortgage_balance,
          payment: values.mortgage_payment,
        },
        {
          creditor: 'Auto Loan',
          balance: values.auto_balance,
          payment: values.auto_payment,
        },
        {
          creditor: 'Credit Card Debt',
          balance: values.credit_card_balance,
          payment: values.credit_card_payment,
        },
        {
          creditor: 'Student Loan',
          balance: values.student_loan_balance,
          payment: values.student_loan_payment,
        },
        {
          creditor: 'Personal Loan',
          balance: values.personal_loan_balance,
          payment: values.personal_loan_payment,
        },
        {
          creditor: 'Other Debt',
          balance: values.other_balance,
          payment: values.other_payment,
        },
      ]);

      const pastDueAmount = toNumber(values.past_due_amount);
      if (Boolean(values.past_due_debt) && pastDueAmount > 0) {
        debts.push({
          creditor: 'Past Due Debt',
          originalAmount: pastDueAmount,
          currentBalance: pastDueAmount,
          monthlyPayment: 0,
        });
      }

      const payload: PersonalDebtSummaryData = {
        asOfDate: asString(values.report_date) || todayIsoDate(),
        personalInfo: {
          name: asString(values.borrower_name) || 'Borrower',
        },
        debts,
        notes: asNonEmptyString(values.notes) ?? undefined,
      };

      return payload;
    }

    case 'business_debt_summary': {
      const interestRate = optionalNumber(values.weighted_interest_rate);
      const personalGuarantee = Boolean(values.personal_guarantees_present);
      const debts = buildDebtRows([
        {
          creditor: 'Term Loan',
          balance: values.term_loan_balance,
          payment: values.term_loan_payment,
          interestRate,
          personalGuarantee,
        },
        {
          creditor: 'Line Of Credit',
          balance: values.line_of_credit_balance,
          payment: values.line_of_credit_payment,
          interestRate,
          personalGuarantee,
        },
        {
          creditor: 'Equipment Loan',
          balance: values.equipment_loan_balance,
          payment: values.equipment_loan_payment,
          interestRate,
          personalGuarantee,
        },
        {
          creditor: 'Commercial Mortgage',
          balance: values.commercial_mortgage_balance,
          payment: values.commercial_mortgage_payment,
          interestRate,
          personalGuarantee,
        },
        {
          creditor: 'Other Business Debt',
          balance: values.other_business_debt_balance,
          payment: values.other_business_debt_payment,
          interestRate,
          personalGuarantee,
        },
      ]);

      const payload: BusinessDebtSummaryData = {
        asOfDate: asString(values.report_date) || todayIsoDate(),
        businessInfo: {
          name: asString(values.business_name) || 'Business',
        },
        debts,
        notes:
          asNonEmptyString(values.notes) ??
          asNonEmptyString(values.personal_guarantees_notes) ??
          undefined,
      };

      return payload;
    }

    default:
      throw new Error(`Unsupported template key: ${templateKey}`);
  }
}

export function getTemplatePdfFileName(templateKey: TemplateKey, businessName: string | null): string {
  const safeBusinessName = (businessName || 'business')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'business';

  return `${safeBusinessName}-${templateKey}-${Date.now()}.pdf`;
}
