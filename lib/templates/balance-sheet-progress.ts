import type { BalanceSheetData } from './types';

const BALANCE_SHEET_PROGRESS_PATHS = [
  'statementType',
  'asOfDate',
  'businessInfo.legalName',
  'businessInfo.reportBasis',
  'assets.cashAndCashEquivalents',
  'assets.accountsReceivable',
  'assets.inventory',
  'assets.prepaidExpenses',
  'assets.otherCurrentAssets',
  'assets.fixedAssetBreakdown.businessRealEstate',
  'assets.fixedAssetBreakdown.vehicles',
  'assets.fixedAssetBreakdown.machineryEquipment',
  'assets.fixedAssetBreakdown.furnitureFixtures',
  'assets.fixedAssetBreakdown.leaseholdImprovements',
  'assets.accumulatedDepreciation',
  'assets.notesReceivable',
  'assets.intangibleAssets',
  'assets.investments',
  'assets.otherNonCurrentAssets',
  'liabilities.accountsPayable',
  'liabilities.accruedExpenses',
  'liabilities.taxesPayable',
  'liabilities.currentPortionLongTermDebt',
  'liabilities.creditCardsAndLines',
  'liabilities.deferredRevenue',
  'liabilities.otherCurrentLiabilities',
  'liabilities.longTermDebt',
  'liabilities.shareholderLoans',
  'liabilities.otherLongTermLiabilities',
  'equity.ownerContributions',
  'equity.ownerDistributions',
  'equity.otherEquity',
] as const;

function getValueAtPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

function isMeaningfulValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return true;
  return false;
}

export function getBalanceSheetProgress(
  form: BalanceSheetData,
  options?: { reviewConfirmed?: boolean; hasPdf?: boolean },
) {
  const completedDataFields = BALANCE_SHEET_PROGRESS_PATHS.filter((path) =>
    isMeaningfulValue(getValueAtPath(form, path)),
  ).length;
  const totalDataFields = BALANCE_SHEET_PROGRESS_PATHS.length;
  const allDataFieldsComplete = completedDataFields === totalDataFields;
  const reviewComplete = Boolean(options?.reviewConfirmed || options?.hasPdf);

  const percent =
    reviewComplete && allDataFieldsComplete
      ? 100
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
