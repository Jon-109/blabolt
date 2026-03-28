import type { BalanceSheetData } from './types';

const zero = (value?: number | null) => value || 0;

export const sumFixedAssetBreakdown = (
  breakdown?: BalanceSheetData['assets']['fixedAssetBreakdown'],
) =>
  zero(breakdown?.businessRealEstate) +
  zero(breakdown?.vehicles) +
  zero(breakdown?.machineryEquipment) +
  zero(breakdown?.furnitureFixtures) +
  zero(breakdown?.leaseholdImprovements);

export function computeBalanceSheetTotals(form: BalanceSheetData) {
  const totalCurrentAssets =
    zero(form.assets.cashAndCashEquivalents) +
    zero(form.assets.accountsReceivable) +
    zero(form.assets.inventory) +
    zero(form.assets.prepaidExpenses) +
    zero(form.assets.otherCurrentAssets);

  const grossFixedAssets =
    sumFixedAssetBreakdown(form.assets.fixedAssetBreakdown) || zero(form.assets.grossFixedAssets);
  const netFixedAssets = Math.max(grossFixedAssets - zero(form.assets.accumulatedDepreciation), 0);

  const totalNonCurrentAssets =
    netFixedAssets +
    zero(form.assets.notesReceivable) +
    zero(form.assets.intangibleAssets) +
    zero(form.assets.investments) +
    zero(form.assets.otherNonCurrentAssets);

  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

  const totalCurrentLiabilities =
    zero(form.liabilities.accountsPayable) +
    zero(form.liabilities.accruedExpenses) +
    zero(form.liabilities.taxesPayable) +
    zero(form.liabilities.currentPortionLongTermDebt) +
    zero(form.liabilities.creditCardsAndLines) +
    zero(form.liabilities.deferredRevenue) +
    zero(form.liabilities.otherCurrentLiabilities);

  const totalLongTermLiabilities =
    zero(form.liabilities.longTermDebt) +
    zero(form.liabilities.shareholderLoans) +
    zero(form.liabilities.otherLongTermLiabilities);

  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

  const retainedEarnings =
    totalAssets -
    totalLiabilities -
    zero(form.equity.ownerContributions) -
    zero(form.equity.otherEquity) +
    zero(form.equity.ownerDistributions);

  const totalEquity =
    zero(form.equity.ownerContributions) +
    retainedEarnings +
    zero(form.equity.otherEquity) -
    zero(form.equity.ownerDistributions);

  const liabilitiesAndEquity = totalLiabilities + totalEquity;
  const balanceDelta = totalAssets - liabilitiesAndEquity;

  return {
    totalCurrentAssets,
    grossFixedAssets,
    netFixedAssets,
    totalNonCurrentAssets,
    totalAssets,
    totalCurrentLiabilities,
    totalLongTermLiabilities,
    totalLiabilities,
    retainedEarnings,
    totalEquity,
    liabilitiesAndEquity,
    balanceDelta,
    netWorth: totalAssets - totalLiabilities,
  };
}
