import type { FullFinancialData, NumericFinancialData } from './FinancialsStep';
import { calculateFinancialSummary, parseCurrencyLike } from '@/lib/financial/calculations';

export function unformatCurrency(value: string): number | undefined {
  if (typeof value !== 'string') return undefined;
  const parsed = parseCurrencyLike(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export const convertToNumeric = (data: FullFinancialData): NumericFinancialData => {
  return calculateFinancialSummary(data);
};
