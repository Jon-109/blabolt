// Shared financial calculation utilities for both client and server
import type { Debt } from '@/app/(components)/BusinessDebtsStep';

export type DebtSummary = {
  monthlyDebtService: number;
  annualDebtService: number;
  totalCreditBalance: number;
  totalCreditLimit: number;
  creditUtilizationRate: number | null;
  categoryTotals: Record<string, {
    totalMonthlyPayment: number;
    totalOriginalLoanAmount: number;
    totalOutstandingBalance: number;
  }>;
  totalDebtService: {
    '2023': number;
    '2024': number;
    '2025YTD': number;
  };
};

export function calculateDebtSummary(debts: Debt[]): DebtSummary {
  const categories = [
    'REAL_ESTATE',
    'VEHICLE_EQUIPMENT',
    'CREDIT_CARD',
    'LINE_OF_CREDIT',
    'OTHER',
  ];
  const catTotals: Record<string, {
    totalMonthlyPayment: number;
    totalOriginalLoanAmount: number;
    totalOutstandingBalance: number;
  }> = {};
  let monthlyDebtService = 0;
  let totalCreditBalance = 0;
  let totalCreditLimit = 0;
  for (const category of categories) {
    const filtered = debts.filter(d => d.category === category);
    const totalMonthlyPayment = filtered.reduce((sum, d) => sum + (parseFloat(d.monthlyPayment.replace(/[^\d.]/g, '')) || 0), 0);
    const totalOriginalLoanAmount = filtered.reduce((sum, d) => sum + (parseFloat(d.originalLoanAmount.replace(/[^\d.]/g, '')) || 0), 0);
    const totalOutstandingBalance = filtered.reduce((sum, d) => sum + (parseFloat(d.outstandingBalance.replace(/[^\d.]/g, '')) || 0), 0);
    catTotals[category] = {
      totalMonthlyPayment,
      totalOriginalLoanAmount,
      totalOutstandingBalance,
    };
    monthlyDebtService += totalMonthlyPayment;
    if (category === 'CREDIT_CARD' || category === 'LINE_OF_CREDIT') {
      totalCreditBalance += totalOutstandingBalance;
      totalCreditLimit += totalOriginalLoanAmount;
    }
  }
  const annualDebtService = monthlyDebtService * 12;
  const creditUtilizationRate = totalCreditLimit > 0 ? totalCreditBalance / totalCreditLimit : null;

  // Calculate totalDebtService for each year
  const getAnnualDebtService = (months: number = 12) => {
    return debts.reduce((sum, d) => sum + (parseFloat(d.monthlyPayment.replace(/[^\d.]/g, '')) || 0), 0) * months;
  };
  // For 2023 and 2024, assume full year (12 months). For 2025YTD, let the consumer pass months if needed.
  const totalDebtService = {
    '2023': getAnnualDebtService(12),
    '2024': getAnnualDebtService(12),
    '2025YTD': getAnnualDebtService(0), // Consumer should update this based on YTD months
  };

  return {
    monthlyDebtService,
    annualDebtService,
    totalCreditBalance,
    totalCreditLimit,
    creditUtilizationRate,
    categoryTotals: catTotals,
    totalDebtService,
  };
}

export function calculateDSCR(financials: any, annualDebtService: number, annualizedLoanPayment: number) {
  const years = ['year2025YTD', 'year2024', 'year2023'];
  for (const year of years) {
    const ebitda = financials[year]?.summary?.ebitda;
    if (ebitda && (annualDebtService + annualizedLoanPayment) > 0) {
      return ebitda / (annualDebtService + annualizedLoanPayment);
    }
  }
  return null;
}
