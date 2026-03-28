import type { BusinessDebtSummaryData } from './types';

type BusinessDebtCategoryId =
  | 'credit_cards'
  | 'line_of_credit'
  | 'real_estate'
  | 'term_loans'
  | 'vehicle_equipment'
  | 'other_debt';

type OtherBusinessDebtTypeKey =
  | 'merchantCashAdvance'
  | 'taxPaymentPlan'
  | 'ownerShareholderLoan'
  | 'otherBusinessLiability';

type BusinessDebtUiState = {
  selectedCounts?: Partial<Record<BusinessDebtCategoryId, number>>;
  otherBusinessDebtSelections?: Record<OtherBusinessDebtTypeKey, 'unset' | 'yes' | 'no'>;
  activeCategoryIndex?: number;
};

const BUSINESS_DEBT_CATEGORY_IDS: BusinessDebtCategoryId[] = [
  'credit_cards',
  'line_of_credit',
  'real_estate',
  'term_loans',
  'vehicle_equipment',
  'other_debt',
];

function sanitizeOtherBusinessDebtSelections(
  selections?: Record<OtherBusinessDebtTypeKey, 'unset' | 'yes' | 'no'>,
): Record<OtherBusinessDebtTypeKey, 'yes' | 'no'> {
  return {
    merchantCashAdvance: selections?.merchantCashAdvance === 'yes' ? 'yes' : 'no',
    taxPaymentPlan: selections?.taxPaymentPlan === 'yes' ? 'yes' : 'no',
    ownerShareholderLoan: selections?.ownerShareholderLoan === 'yes' ? 'yes' : 'no',
    otherBusinessLiability: selections?.otherBusinessLiability === 'yes' ? 'yes' : 'no',
  };
}

function getDebtsByCategory(form: BusinessDebtSummaryData) {
  const grouped: Record<BusinessDebtCategoryId, BusinessDebtSummaryData['debts']> = {
    credit_cards: [],
    line_of_credit: [],
    real_estate: [],
    term_loans: [],
    vehicle_equipment: [],
    other_debt: [],
  };

  for (const debt of form.debts) {
    const category = (debt.category || 'other_debt') as BusinessDebtCategoryId;
    grouped[category].push(debt);
  }

  return grouped;
}

function isDebtFilled(categoryId: BusinessDebtCategoryId, debt: BusinessDebtSummaryData['debts'][number]) {
  if (!debt.creditor?.trim()) return false;
  if ((debt.currentBalance ?? 0) < 0 || (debt.monthlyPayment ?? 0) < 0) return false;
  if ((categoryId === 'credit_cards' || categoryId === 'line_of_credit') && (debt.creditLimit ?? 0) <= 0) return false;
  return true;
}

export function getBusinessDebtSummaryProgress(
  form: BusinessDebtSummaryData & { uiState?: unknown },
) {
  const debtsByCategory = getDebtsByCategory(form);
  const uiState = (form.uiState ?? {}) as BusinessDebtUiState;
  const selectedCounts = uiState.selectedCounts ?? {};
  const otherBusinessDebtSelections = sanitizeOtherBusinessDebtSelections(uiState.otherBusinessDebtSelections);

  const completedCategoryCount = BUSINESS_DEBT_CATEGORY_IDS.filter((categoryId) => {
    if (categoryId === 'other_debt') {
      const effectiveCount =
        selectedCounts[categoryId] ??
        Object.values(otherBusinessDebtSelections).filter((value) => value === 'yes').length;
      if (effectiveCount === 0) return true;
      const debts = debtsByCategory[categoryId];
      if (debts.length !== effectiveCount) return false;
      return debts.every((debt) => isDebtFilled(categoryId, debt));
    }

    const count = selectedCounts[categoryId];
    if (count === undefined) return false;
    if (count === 0) return true;
    const debts = debtsByCategory[categoryId];
    if (debts.length !== count) return false;
    return debts.every((debt) => isDebtFilled(categoryId, debt));
  }).length;

  return {
    completedCategoryCount,
    totalCategories: BUSINESS_DEBT_CATEGORY_IDS.length,
    percent: Math.round((completedCategoryCount / BUSINESS_DEBT_CATEGORY_IDS.length) * 100),
  };
}
