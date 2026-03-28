// SBA Form 413 - Calculation Utilities

import { AssetsData, LiabilitiesData } from '../types';

// Calculate total assets
export const calculateTotalAssets = (assets: AssetsData): number => {
  const cashTotal = assets.cash_accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const securitiesTotal = assets.securities.reduce((sum, sec) => sum + sec.market_value, 0);
  const retirementTotal = assets.retirement_accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const lifePoliciesTotal = assets.life_policies.reduce((sum, pol) => sum + pol.cash_surrender_value, 0);
  const realEstateTotal = assets.real_estate.reduce((sum, prop) => sum + prop.market_value, 0);
  const autosTotal = assets.autos.reduce((sum, auto) => sum + auto.value, 0);
  const otherPropertyTotal = assets.other_personal_property.reduce((sum, prop) => sum + prop.value, 0);
  const otherAssetsTotal = assets.other_assets.reduce((sum, asset) => sum + asset.value, 0);

  return (
    cashTotal +
    securitiesTotal +
    retirementTotal +
    lifePoliciesTotal +
    realEstateTotal +
    autosTotal +
    otherPropertyTotal +
    otherAssetsTotal
  );
};

// Calculate total liabilities
export const calculateTotalLiabilities = (liabilities: LiabilitiesData): number => {
  const creditCardsTotal = liabilities.credit_cards.reduce((sum, card) => sum + card.balance, 0);
  const notesLoansTotal = liabilities.notes_loans.reduce((sum, loan) => sum + loan.current_balance, 0);
  const installmentsAutoTotal = liabilities.installments_auto.reduce((sum, inst) => sum + inst.balance, 0);
  const installmentsOtherTotal = liabilities.installments_other.reduce((sum, inst) => sum + inst.balance, 0);
  const mortgagesTotal = liabilities.mortgages.reduce((sum, mort) => sum + mort.current_balance, 0);
  const unpaidTaxesTotal = liabilities.unpaid_taxes.reduce((sum, tax) => sum + tax.amount, 0);
  const otherLiabilitiesTotal = liabilities.other_liabilities.reduce((sum, liab) => sum + liab.amount, 0);

  return (
    creditCardsTotal +
    notesLoansTotal +
    installmentsAutoTotal +
    installmentsOtherTotal +
    mortgagesTotal +
    unpaidTaxesTotal +
    otherLiabilitiesTotal
  );
};

// Calculate net worth
export const calculateNetWorth = (assets: AssetsData, liabilities: LiabilitiesData): number => {
  return calculateTotalAssets(assets) - calculateTotalLiabilities(liabilities);
};

// Calculate unencumbered liquid assets (cash + marketable securities - credit card debt)
export const calculateLiquidAssets = (assets: AssetsData, liabilities: LiabilitiesData): number => {
  const cash = assets.cash_accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const securities = assets.securities.reduce((sum, sec) => sum + sec.market_value, 0);
  const creditCards = liabilities.credit_cards.reduce((sum, card) => sum + card.balance, 0);
  
  return Math.max(0, cash + securities - creditCards);
};

// Calculate monthly debt service
export const calculateMonthlyDebtService = (liabilities: LiabilitiesData): number => {
  const creditCardsPayments = liabilities.credit_cards.reduce((sum, card) => sum + card.min_payment, 0);
  
  const notesLoansPayments = liabilities.notes_loans.reduce((sum, loan) => {
    // Convert to monthly based on frequency
    const monthlyPayment =
      loan.payment_frequency === 'monthly'
        ? loan.payment_amount
        : loan.payment_frequency === 'quarterly'
        ? loan.payment_amount / 3
        : loan.payment_amount / 12;
    return sum + monthlyPayment;
  }, 0);
  
  const installmentsAutoPayments = liabilities.installments_auto.reduce(
    (sum, inst) => sum + inst.monthly_payment,
    0
  );
  
  const installmentsOtherPayments = liabilities.installments_other.reduce(
    (sum, inst) => sum + inst.monthly_payment,
    0
  );
  
  const mortgagesPayments = liabilities.mortgages.reduce((sum, mort) => sum + mort.monthly_pi, 0);

  return (
    creditCardsPayments +
    notesLoansPayments +
    installmentsAutoPayments +
    installmentsOtherPayments +
    mortgagesPayments
  );
};

// Validate that Assets = Liabilities + Net Worth
export const validateBalanceSheet = (assets: AssetsData, liabilities: LiabilitiesData): boolean => {
  const totalAssets = calculateTotalAssets(assets);
  const totalLiabilities = calculateTotalLiabilities(liabilities);
  const netWorth = calculateNetWorth(assets, liabilities);
  
  // Allow for small rounding errors (within $1)
  return Math.abs(totalAssets - (totalLiabilities + netWorth)) < 1;
};

// Format currency for display
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format percentage for display
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

// Generate unique ID for form items
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
