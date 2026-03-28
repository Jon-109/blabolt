import type { IncomeStatementData } from './types';

export type IncomeStatementStepId = 'statement_period' | 'revenue' | 'cogs' | 'expenses' | 'review';

export type IncomeStatementRequiredFieldDescriptor = {
  path: string;
  label: string;
  type: 'text' | 'currency' | 'checkbox';
};

export const INCOME_STATEMENT_REQUIRED_FIELDS_BY_STEP: Array<{
  stepId: IncomeStatementStepId;
  fields: IncomeStatementRequiredFieldDescriptor[];
}> = [
  {
    stepId: 'statement_period',
    fields: [{ path: 'businessInfo.name', label: 'Business Name', type: 'text' }],
  },
  {
    stepId: 'revenue',
    fields: [
      { path: 'revenue.grossSales', label: 'Product Sales Revenue', type: 'currency' },
      { path: 'revenue.serviceRevenue', label: 'Service Revenue', type: 'currency' },
      { path: 'revenue.otherRevenue', label: 'Other Revenue', type: 'currency' },
    ],
  },
  {
    stepId: 'cogs',
    fields: [
      { path: 'cogs.inventoryMaterialsCost', label: 'Inventory or Materials Cost', type: 'currency' },
      { path: 'cogs.directLabor', label: 'Direct Labor', type: 'currency' },
      { path: 'cogs.shippingPackaging', label: 'Shipping and Packaging', type: 'currency' },
      { path: 'cogs.otherDirectCosts', label: 'Other Direct Costs', type: 'currency' },
    ],
  },
  {
    stepId: 'expenses',
    fields: [
      { path: 'operatingExpenses.payrollContractorPayments', label: 'Payroll and Contractor Payments', type: 'currency' },
      { path: 'operatingExpenses.rentFacilityCosts', label: 'Rent or Facility Costs', type: 'currency' },
      { path: 'operatingExpenses.utilitiesInternet', label: 'Utilities and Internet', type: 'currency' },
      { path: 'operatingExpenses.marketingAdvertising', label: 'Marketing and Advertising', type: 'currency' },
      { path: 'operatingExpenses.softwareSubscriptions', label: 'Software and Subscriptions', type: 'currency' },
      { path: 'operatingExpenses.professionalServices', label: 'Professional Services', type: 'currency' },
      { path: 'operatingExpenses.insurance', label: 'Insurance', type: 'currency' },
      { path: 'operatingExpenses.officeAdministrative', label: 'Office and Administrative', type: 'currency' },
      { path: 'operatingExpenses.vehicleTravel', label: 'Vehicle and Travel', type: 'currency' },
      { path: 'operatingExpenses.otherOperatingExpenses', label: 'Other Operating Expenses', type: 'currency' },
      { path: 'interestExpense', label: 'Interest Expense', type: 'currency' },
    ],
  },
  {
    stepId: 'review',
    fields: [{ path: 'previewConfirmed', label: 'Review confirmation', type: 'checkbox' }],
  },
];

function getValueAtPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

export function isIncomeStatementFieldComplete(
  form: IncomeStatementData,
  field: IncomeStatementRequiredFieldDescriptor,
  options?: { reviewConfirmed?: boolean },
): boolean {
  if (field.type === 'checkbox') {
    return Boolean(options?.reviewConfirmed);
  }

  const value = getValueAtPath(form, field.path);
  if (field.type === 'text') {
    return typeof value === 'string' && value.trim().length > 0;
  }

  return typeof value === 'number' && Number.isFinite(value);
}

export function getIncomeStatementMissingFields(
  form: IncomeStatementData,
  stepId: IncomeStatementStepId,
  options?: { reviewConfirmed?: boolean },
): IncomeStatementRequiredFieldDescriptor[] {
  const step = INCOME_STATEMENT_REQUIRED_FIELDS_BY_STEP.find((entry) => entry.stepId === stepId);
  if (!step) return [];
  return step.fields.filter((field) => !isIncomeStatementFieldComplete(form, field, options));
}

export function getIncomeStatementProgress(
  form: IncomeStatementData,
  options?: { reviewConfirmed?: boolean; hasPdf?: boolean },
) {
  const reviewConfirmed = Boolean(options?.reviewConfirmed);
  const hasPdf = Boolean(options?.hasPdf);
  const dataFieldGroups = INCOME_STATEMENT_REQUIRED_FIELDS_BY_STEP.filter((entry) => entry.stepId !== 'review');
  const dataFields = dataFieldGroups.flatMap((entry) => entry.fields);
  const totalDataFields = dataFields.length;
  const completedDataFields = dataFields.filter((field) => isIncomeStatementFieldComplete(form, field)).length;
  const allDataFieldsComplete = completedDataFields === totalDataFields;
  const reviewComplete = reviewConfirmed || hasPdf;

  const percent =
    reviewComplete && allDataFieldsComplete
      ? 100
      : totalDataFields === 0
      ? 0
      : Math.max(0, Math.min(99, Math.round((completedDataFields / totalDataFields) * 99)));

  return {
    percent,
    totalDataFields,
    completedDataFields,
    totalRequiredItems: totalDataFields + 1,
    completedRequiredItems: completedDataFields + (reviewComplete ? 1 : 0),
    allDataFieldsComplete,
    reviewComplete,
  };
}
