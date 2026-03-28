import type { PersonalDebtSummaryData } from './types';

type PersonalDebtCategoryId =
  | 'credit_cards'
  | 'line_of_credit'
  | 'real_estate'
  | 'student_debt'
  | 'vehicle'
  | 'other_debt';

type OtherDebtTypeKey = 'personalLoan' | 'medicalDebt' | 'taxDebt' | 'familyLoan';

type PersonalDebtUiState = {
  selectedCounts?: Partial<Record<PersonalDebtCategoryId, number>>;
  otherDebtSelections?: Record<OtherDebtTypeKey, boolean>;
  customOtherDebtDecision?: 'unset' | 'yes' | 'no';
  customOtherDebtCount?: number;
  activeCategoryIndex?: number;
};

const PERSONAL_DEBT_CATEGORY_IDS: PersonalDebtCategoryId[] = [
  'credit_cards',
  'line_of_credit',
  'real_estate',
  'student_debt',
  'vehicle',
  'other_debt',
];

function getDebtsByCategory(form: PersonalDebtSummaryData) {
  const grouped: Record<PersonalDebtCategoryId, PersonalDebtSummaryData['debts']> = {
    credit_cards: [],
    line_of_credit: [],
    real_estate: [],
    student_debt: [],
    vehicle: [],
    other_debt: [],
  };

  for (const debt of form.debts) {
    const category = (debt.category || 'other_debt') as PersonalDebtCategoryId;
    grouped[category].push(debt);
  }

  return grouped;
}

function isDebtFilled(categoryId: PersonalDebtCategoryId, debt: PersonalDebtSummaryData['debts'][number]) {
  if (!debt.creditor?.trim()) return false;
  if ((debt.currentBalance ?? 0) < 0 || (debt.monthlyPayment ?? 0) < 0) return false;
  if ((categoryId === 'credit_cards' || categoryId === 'line_of_credit') && (debt.creditLimit ?? 0) <= 0) return false;
  return true;
}

export function getPersonalDebtSummaryProgress(
  form: PersonalDebtSummaryData & { uiState?: unknown },
) {
  const debtsByCategory = getDebtsByCategory(form);
  const uiState = (form.uiState ?? {}) as PersonalDebtUiState;
  const selectedCounts = uiState.selectedCounts ?? {};
  const customOtherDebtDecision = uiState.customOtherDebtDecision ?? 'unset';
  const customOtherDebtCount = uiState.customOtherDebtCount ?? 0;

  const completedCategoryCount = PERSONAL_DEBT_CATEGORY_IDS.filter((categoryId) => {
    if (categoryId === 'other_debt') {
      if (customOtherDebtDecision === 'unset') return false;
      if (customOtherDebtDecision === 'yes' && customOtherDebtCount === 0) return false;
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
    totalCategories: PERSONAL_DEBT_CATEGORY_IDS.length,
    percent: Math.round((completedCategoryCount / PERSONAL_DEBT_CATEGORY_IDS.length) * 100),
  };
}
