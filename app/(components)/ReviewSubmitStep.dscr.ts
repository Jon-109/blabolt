// Utility to calculate DSCR for ReviewSubmitStep
import type { NumericFinancialData } from './FinancialsStep';
import { calculateDscrForYear } from '@/lib/financial/calculations';

export function calculateDSCR(
  financials: {
    year2024?: { summary?: NumericFinancialData };
    year2025?: { summary?: NumericFinancialData };
    year2026YTD?: { summary?: NumericFinancialData };
  },
  annualDebtServices: { [key: string]: number },
  annualizedLoanPayments: { [key: string]: number }
) {
  const dscr2024 = calculateDscrForYear(
    financials.year2024?.summary,
    annualDebtServices?.['2024'] ?? 0,
    annualizedLoanPayments?.['2024'] ?? 0,
  );
  const dscr2025 = calculateDscrForYear(
    financials.year2025?.summary,
    annualDebtServices?.['2025'] ?? 0,
    annualizedLoanPayments?.['2025'] ?? 0,
  );
  const dscr2026 = calculateDscrForYear(
    financials.year2026YTD?.summary,
    annualDebtServices?.['2026YTD'] ?? 0,
    annualizedLoanPayments?.['2026YTD'] ?? 0,
  );
  return { dscr2024, dscr2025, dscr2026 };
}
