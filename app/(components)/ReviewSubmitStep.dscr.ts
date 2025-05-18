// Utility to calculate DSCR for ReviewSubmitStep
import type { NumericFinancialData } from './FinancialsStep';

export function calculateDSCR(
  financials: {
    year2023?: { summary?: NumericFinancialData };
    year2024?: { summary?: NumericFinancialData };
    year2025YTD?: { summary?: NumericFinancialData };
  },
  annualDebtServices: { [key: string]: number },
  annualizedLoanPayments: { [key: string]: number }
) {
  // DSCR = Adjusted EBITDA / (Annual Debt Service + Annualized Loan Payment)
  const adjEbitda2023 = financials.year2023?.summary?.adjustedEbitda ?? 0;
  const ads2023 = annualDebtServices?.['2023'] ?? 0;
  const alp2023 = annualizedLoanPayments?.['2023'] ?? 0;
  const dscr2023 = (ads2023 + alp2023) > 0 && adjEbitda2023 > 0
    ? adjEbitda2023 / (ads2023 + alp2023)
    : null;
  const adjEbitda2024 = financials.year2024?.summary?.adjustedEbitda ?? 0;
  const ads2024 = annualDebtServices?.['2024'] ?? 0;
  const alp2024 = annualizedLoanPayments?.['2024'] ?? 0;
  const dscr2024 = (ads2024 + alp2024) > 0 && adjEbitda2024 > 0
    ? adjEbitda2024 / (ads2024 + alp2024)
    : null;
  const adjEbitda2025 = financials.year2025YTD?.summary?.adjustedEbitda ?? 0;
  const ads2025 = annualDebtServices?.['2025YTD'] ?? 0;
  const alp2025 = annualizedLoanPayments?.['2025YTD'] ?? 0;
  const dscr2025 = (ads2025 + alp2025) > 0 && adjEbitda2025 > 0
    ? adjEbitda2025 / (ads2025 + alp2025)
    : null;
  return { dscr2023, dscr2024, dscr2025 };
}
