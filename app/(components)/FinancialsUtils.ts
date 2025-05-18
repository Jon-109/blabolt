import type { FullFinancialData, NumericFinancialData } from './FinancialsStep';

export function unformatCurrency(value: string): number | undefined {
  if (typeof value !== 'string') return undefined;
  return Number(value.replace(/[^\d.-]+/g, ''));
}

export const convertToNumeric = (data: FullFinancialData): NumericFinancialData => {
  const revenue = unformatCurrency(data.revenue) ?? 0;
  const cogs = unformatCurrency(data.cogs) ?? 0;
  const opEx = unformatCurrency(data.operatingExpenses) ?? 0;
  const depreciation = unformatCurrency(data.depreciation) ?? 0;
  const amortization = unformatCurrency(data.amortization) ?? 0;
  const nonRecurringIncome = unformatCurrency(data.nonRecurringIncome) ?? 0;
  const nonRecurringExpenses = unformatCurrency(data.nonRecurringExpenses) ?? 0;
  const interest = unformatCurrency(data.interest) ?? 0;
  const taxes = unformatCurrency(data.taxes) ?? 0;
  const grossProfit = revenue - cogs;
  const ebitda = grossProfit - opEx - depreciation - amortization + nonRecurringIncome - nonRecurringExpenses;
  const adjustedEbitda = ebitda - nonRecurringIncome + nonRecurringExpenses;

  return {
    revenue,
    cogs,
    operatingExpenses: opEx,
    netIncome: ebitda - interest - taxes, // Calculate netIncome internally
    ebitda,
    grossProfit,
    interest,
    taxes,
    expenses: opEx, // For compatibility
    depreciation,
    amortization,
    nonRecurringIncome,
    nonRecurringExpenses,
    adjustedEbitda
  };
};
