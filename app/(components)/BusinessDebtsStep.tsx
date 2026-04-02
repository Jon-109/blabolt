'use client'

import { memo, useCallback, useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Card, CardContent } from '@/app/(components)/ui/card'
import { Input } from '@/app/(components)/ui/input'
import { PlusCircle, Trash2 } from 'lucide-react'
import { useToast, Toast } from '@/app/(components)/shared/Toast';
import FormField from '@/app/(components)/templates/shared/FormField';

export type DebtCategory = 'REAL_ESTATE' | 'VEHICLE_EQUIPMENT' | 'CREDIT_CARD' | 'LINE_OF_CREDIT' | 'OTHER';

interface BusinessDebtsStepProps {
  onNext: () => void;
  onBack: () => void;
  isFormValid?: (valid: boolean) => void;
  onFormDataChange: (data: Debt[]) => void;
  onProgressChange?: (progress: {
    categoryCounts: Record<DebtCategory, number>;
    answeredCategories: Record<DebtCategory, boolean>;
  }) => void;
  initialData?: Debt[];
  showCompletionProgress?: boolean;
}

// --- Export Debt interface from this file ---
export interface Debt {
  category: DebtCategory;
  description: string;
  monthlyPayment: string;
  originalLoanAmount: string;
  outstandingBalance: string;
  notes?: string;
}

export interface BusinessDebtsStepHandle {
  validate: () => boolean;
}

const emptyDebt = (category: DebtCategory): Debt => ({
  category,
  description: '',
  monthlyPayment: '',
  originalLoanAmount: '',
  outstandingBalance: '',
});

// Add descriptions to categories
const categories: { id: DebtCategory; name: string; description: string }[] = [
  { id: 'REAL_ESTATE', name: 'Real Estate', description: 'Loans secured by property for business use.' },
  { id: 'VEHICLE_EQUIPMENT', name: 'Vehicle/Equipment', description: 'Loans for business vehicles or equipment.' },
  { id: 'CREDIT_CARD', name: 'Credit Card', description: 'Balances on business credit cards.' },
  { id: 'LINE_OF_CREDIT', name: 'Line of Credit', description: 'Revolving credit lines for business use.' },
  { id: 'OTHER', name: 'Other', description: 'Any other miscellaneous business debts.' },
];

export { categories, emptyDebt };

// Placeholder map for descriptions
const descriptionPlaceholders: Record<DebtCategory, string> = {
  REAL_ESTATE: 'E.g., 123 Main St, San Francisco, CA',
  VEHICLE_EQUIPMENT: 'E.g., 2022 Ford F-150',
  CREDIT_CARD: 'E.g., Chase Ink Business',
  LINE_OF_CREDIT: 'E.g., Wells Fargo LOC',
  OTHER: 'E.g., SBA EIDL Loan',
};

const categoryQuestions: Record<DebtCategory, string> = {
  REAL_ESTATE: 'How many business real estate loans should be included in this report?',
  VEHICLE_EQUIPMENT: 'How many vehicle or equipment loans does the business currently pay?',
  CREDIT_CARD: 'How many open business credit cards should be included?',
  LINE_OF_CREDIT: 'How many active business lines of credit should be included?',
  OTHER: 'How many other business debt accounts should be included?',
};

const categoryFieldLabels: Record<DebtCategory, { description: string; original: string; balance: string; payment: string }> = {
  REAL_ESTATE: {
    description: 'Property / Lender Description',
    original: 'Original Loan Amount',
    balance: 'Current Balance',
    payment: 'Monthly Payment',
  },
  VEHICLE_EQUIPMENT: {
    description: 'Vehicle / Equipment Description',
    original: 'Original Loan Amount',
    balance: 'Current Balance',
    payment: 'Monthly Payment',
  },
  CREDIT_CARD: {
    description: 'Card Name / Issuer',
    original: 'Credit Limit',
    balance: 'Current Balance',
    payment: 'Monthly Payment',
  },
  LINE_OF_CREDIT: {
    description: 'Lender / LOC Description',
    original: 'Credit Limit',
    balance: 'Current Drawn Balance',
    payment: 'Monthly Payment',
  },
  OTHER: {
    description: 'Debt Description',
    original: 'Original Loan Amount',
    balance: 'Current Balance',
    payment: 'Monthly Payment',
  },
};

const COUNT_OPTIONS = [0, 1, 2, 3, 4, 5];

const parseCurrencyInput = (value: string | undefined): string => {
  if (!value) return '';
  return value.replace(/[^\d]/g, ''); // Remove non-digits
};

const formatCurrency = (value: string | undefined): string => {
  if (value === undefined || value === null) return ''; // Handle undefined/null explicitly
  const cleanValue = value.replace(/[^\d]/g, ''); // Keep only digits
  if (cleanValue === '') return '';
  const num = Number(cleanValue || '0');
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0, // No decimals
    maximumFractionDigits: 0  // No decimals
  }).format(num);
};

const parseCurrencyNumber = (value: string | undefined): number => {
  const cleanValue = parseCurrencyInput(value);
  if (!cleanValue) return 0;
  const parsed = Number(cleanValue);
  return Number.isFinite(parsed) ? parsed : 0;
};

const MAX_ROWS = 5;

// constants for input length limits
const DESCRIPTION_MAX_LEN = 40;
// State to track if the user has started adding the first debt in a category
type AddingFirstDebtState = Partial<Record<DebtCategory, boolean>>;

const BusinessDebtsStep = forwardRef<BusinessDebtsStepHandle, BusinessDebtsStepProps>((
  { 
    onNext, 
    onBack, 
    isFormValid, 
    onFormDataChange, 
    onProgressChange,
    initialData = [],
    showCompletionProgress = true,
  }, 
  ref // The ref passed from the parent
) => {
  // Destructure state and functions from the updated hook
  const { showToast, message, visible, closeToast } = useToast();

  // Initialize debts from initialData
  const [debts, setDebts] = useState<Record<DebtCategory, ReadonlyArray<Debt>>>(() => {
    const initialDebts: Record<DebtCategory, Debt[]> = {
      REAL_ESTATE: [],
      VEHICLE_EQUIPMENT: [],
      CREDIT_CARD: [],
      LINE_OF_CREDIT: [],
      OTHER: [],
    };

    // Populate from initialData
    initialData.forEach(debt => {
      if (initialDebts[debt.category]) {
        initialDebts[debt.category].push(debt);
      }
    });

    // Ensure each category has at least one (potentially empty) entry
    categories.forEach(cat => {
      if (initialDebts[cat.id].length === 0) {
        initialDebts[cat.id].push(emptyDebt(cat.id));
      }
    });
    return initialDebts as Record<DebtCategory, ReadonlyArray<Debt>>;
  });

  // State to track if user clicked 'Add' for the first entry
  const [isAddingFirstDebt, setIsAddingFirstDebt] = useState<AddingFirstDebtState>({});
  const [answeredCategories, setAnsweredCategories] = useState<Record<DebtCategory, boolean>>({
    REAL_ESTATE: false,
    VEHICLE_EQUIPMENT: false,
    CREDIT_CARD: false,
    LINE_OF_CREDIT: false,
    OTHER: false,
  });
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  // Ref to store the stringified version of the last data sent to the parent
  const lastSentDataRef = useRef<string | null>(null);

  // State to track internal validity
  const [isValid, setIsValid] = useState(false);

  // State to track the first input field with a validation error
  const [errorFields, setErrorFields] = useState<Record<string, boolean>>({});

  // --- Validation Logic --- 
  const runValidation = useCallback((): boolean => { 
    setErrorFields({}); // Clear previous errors
    let firstErrorId = ''; // Initialize as empty string instead of null
    let validationPassed = true;
    const currentErrors: Record<string, boolean> = {}; // Local errors for this validation run
    let combinedErrorMessage: string = ''; // To accumulate messages

    // Helper to add error and update state
    const flagError = (fieldId: string, message: string) => {
        currentErrors[fieldId] = true;
        if (!firstErrorId) firstErrorId = fieldId;
        validationPassed = false;
        // Append message only if it's not already present
        if (!combinedErrorMessage.includes(message)) {
            combinedErrorMessage += (combinedErrorMessage ? ' ' : '') + message;
        }
    };

    // Iterate over each category and its entries
    for (const categoryId of Object.keys(debts) as DebtCategory[]) {
      const categoryDebts = debts[categoryId] || [];
      for (let index = 0; index < categoryDebts.length; index++) {
        const entry = categoryDebts[index];
        if (!entry) continue; // Skip if entry is undefined

        // Check if this is just an empty placeholder row that hasn't been interacted with
        // We identify this if it's the first and only row, hasn't been 'added', and all fields are empty.
        const isEmptyPlaceholder =
          index === 0 &&
          categoryDebts.length === 1 &&
          !isAddingFirstDebt[categoryId] &&
          entry.description === '' &&
          entry.monthlyPayment === '' &&
          entry.originalLoanAmount === '' &&
          entry.outstandingBalance === '';

        // --- FIX: If this is an untouched placeholder, skip validation for this entry ---
        if (isEmptyPlaceholder) continue;

        // --- FIX: If ALL fields are empty, skip validation for this entry (covers accidental extra rows) ---
        const allFieldsEmpty =
          entry.description === '' &&
          entry.monthlyPayment === '' &&
          entry.originalLoanAmount === '' &&
          entry.outstandingBalance === '';
        if (allFieldsEmpty) continue;

        // --- Universal Validation: Description and Payment are required for all entered debts --- 
        const descFilled = entry.description.trim() !== '';
        const paymentFilled = parseCurrencyInput(entry.monthlyPayment) !== '';
        const fieldIdPrefix = `debt-${categoryId}-${index}`;
        const descriptionFieldId = `${fieldIdPrefix}-description`;
        const paymentFieldId = `${fieldIdPrefix}-monthlyPayment`;
        const categoryName = categories.find(c => c.id === categoryId)?.name;
        const safeCategoryName = String(categoryName || categoryId || 'this category');

        if (!descFilled) {
          const descMessage = `Description is required for ${safeCategoryName}.`;
          flagError(descriptionFieldId, descMessage);
        }
        if (!paymentFilled) {
          const paymentMessage = `Monthly Payment is required for ${safeCategoryName}.`;
          flagError(paymentFieldId, paymentMessage);
        }
      }
    }

    setErrorFields(currentErrors);

    if (!validationPassed) {
      console.warn(`[Validation Failed] First error field ID: ${firstErrorId || 'none'}, Message: ${combinedErrorMessage}`);
      // Use logical OR for defaulting, ensuring a string is always passed
      const finalMessage = combinedErrorMessage || 'Please fill in all required debt fields.';
      // Explicitly check if finalMessage is a truthy string before showing toast
      if (finalMessage) {
          showToast(String(finalMessage)); // Force conversion to string
      }
      
      // Focus the first element with an error
      if (firstErrorId) {
        // Use timeout to ensure DOM is updated before focusing
        setTimeout(() => {
          const element = document.getElementById(firstErrorId);
          if (element) {
            element.focus();
            // Optionally, scroll into view if needed
            // element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 50); // Small delay to allow DOM update
      }
      return false; // Validation failed
    }

    setIsValid(validationPassed); // Update internal state if needed
    isFormValid?.(validationPassed); // Notify parent
    return true; // Validation passed
  }, [debts, isFormValid, showToast, isAddingFirstDebt]);

  // Use useImperativeHandle to expose the validate function via the ref
  useImperativeHandle(ref, () => ({
    validate: runValidation
  }));

  const handleEntryChange = useCallback((categoryId: DebtCategory, index: number, field: keyof Debt, value: string) => {
    // Enforce character limits for description
    if (field === 'description') {
      value = value.slice(0, DESCRIPTION_MAX_LEN);
    }
    setDebts((prev: Record<DebtCategory, ReadonlyArray<Debt>>) => {
      const entries = prev[categoryId];
      if (!entries || !entries[index]) return prev;

      const updatedEntries = [...entries];
      let newValue = value;

      // For currency fields, parse, then store only digits
      if (field === 'originalLoanAmount' || field === 'outstandingBalance' || field === 'monthlyPayment') {
        const digits = parseCurrencyInput(value);
        newValue = digits; // Store only digits
      } else {
        newValue = value; // Store raw value for non-currency fields
      }

      updatedEntries[index] = {
        ...entries[index],
        [field]: newValue,
      };

      return {
        ...prev,
        [categoryId]: updatedEntries
      };
    });
  }, []);

  const removeEntry = useCallback((categoryId: DebtCategory, index: number) => {
    setDebts((prev: Record<DebtCategory, ReadonlyArray<Debt>>) => {
      const entries = prev[categoryId];
      if (!entries) return prev;

      const updatedEntries = entries.filter((_, i) => i !== index);

      // If removing the last entry, add back an empty placeholder
      if (updatedEntries.length === 0) {
        updatedEntries.push(emptyDebt(categoryId));
        // Also reset the 'adding' state for this category
        setIsAddingFirstDebt(addState => ({ ...addState, [categoryId]: false }));
      }

      return {
        ...prev,
        [categoryId]: updatedEntries as ReadonlyArray<Debt>
      };
    });
    // Note: No toast needed here unless requested
  }, []);

  // --- Utility: Flatten and filter debts for parent ---
  function getFlatDebts(debtsObj: Record<DebtCategory, ReadonlyArray<Debt>>): Debt[] {
    return Object.values(debtsObj)
      .flat()
      .filter(d => d.description || d.monthlyPayment || d.originalLoanAmount || d.outstandingBalance); // Exclude empty placeholders
  }

  // --- Call onFormDataChange with flat debts array whenever debts change ---
  useEffect(() => {
    const flatDebts = getFlatDebts(debts);
    onFormDataChange(flatDebts);
    // Debug log
    console.log('[BusinessDebtsStep] onFormDataChange called with debts:', flatDebts);
  }, [debts]); // Remove onFormDataChange from deps to keep effect signature stable

  // --- Sync debts state with initialData if it changes (e.g., after async draft restore) ---
  useEffect(() => {
    // Flatten debts state for comparison
    const flattenDebts = (debtsObj: Record<DebtCategory, ReadonlyArray<Debt>>): Debt[] => {
      return Object.values(debtsObj).flat();
    };
    if (
      initialData &&
      JSON.stringify(initialData) !== JSON.stringify(flattenDebts(debts))
    ) {
      // Re-initialize debts state from new initialData
      const initialDebts: Record<DebtCategory, Debt[]> = {
        REAL_ESTATE: [],
        VEHICLE_EQUIPMENT: [],
        CREDIT_CARD: [],
        LINE_OF_CREDIT: [],
        OTHER: [],
      };
      initialData.forEach(debt => {
        if (initialDebts[debt.category]) {
          initialDebts[debt.category].push(debt);
        }
      });
      categories.forEach(cat => {
        if (initialDebts[cat.id].length === 0) {
          initialDebts[cat.id].push(emptyDebt(cat.id));
        }
      });
      setDebts(initialDebts as Record<DebtCategory, ReadonlyArray<Debt>>);
      setAnsweredCategories({
        REAL_ESTATE: initialDebts.REAL_ESTATE.some((debt) => debt.description || debt.monthlyPayment || debt.originalLoanAmount || debt.outstandingBalance),
        VEHICLE_EQUIPMENT: initialDebts.VEHICLE_EQUIPMENT.some((debt) => debt.description || debt.monthlyPayment || debt.originalLoanAmount || debt.outstandingBalance),
        CREDIT_CARD: initialDebts.CREDIT_CARD.some((debt) => debt.description || debt.monthlyPayment || debt.originalLoanAmount || debt.outstandingBalance),
        LINE_OF_CREDIT: initialDebts.LINE_OF_CREDIT.some((debt) => debt.description || debt.monthlyPayment || debt.originalLoanAmount || debt.outstandingBalance),
        OTHER: initialDebts.OTHER.some((debt) => debt.description || debt.monthlyPayment || debt.originalLoanAmount || debt.outstandingBalance),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialData)]);

  const getCategoryEntryCount = useCallback((categoryId: DebtCategory) => {
    const categoryDebts = debts[categoryId] || [];
    if (categoryDebts.length === 0) return 0;

    const onlyEmptyPlaceholder =
      categoryDebts.length === 1 &&
      !isAddingFirstDebt[categoryId] &&
      categoryDebts[0]?.description.trim() === '' &&
      categoryDebts[0]?.monthlyPayment.trim() === '' &&
      categoryDebts[0]?.originalLoanAmount.trim() === '' &&
      categoryDebts[0]?.outstandingBalance.trim() === '';

    return onlyEmptyPlaceholder ? 0 : categoryDebts.length;
  }, [debts, isAddingFirstDebt]);

  useEffect(() => {
    if (!onProgressChange) return;

    const categoryCounts = categories.reduce((acc, category) => {
      acc[category.id] = getCategoryEntryCount(category.id);
      return acc;
    }, {} as Record<DebtCategory, number>);

    onProgressChange({
      categoryCounts,
      answeredCategories,
    });
  }, [answeredCategories, getCategoryEntryCount, onProgressChange]);

  const setCategoryCount = useCallback((categoryId: DebtCategory, count: number) => {
    setDebts((prev) => {
      const currentEntries = [...(prev[categoryId] || [])];
      const sanitizedCurrentEntries =
        currentEntries.length === 1 &&
        currentEntries[0] &&
        currentEntries[0].description.trim() === '' &&
        currentEntries[0].monthlyPayment.trim() === '' &&
        currentEntries[0].originalLoanAmount.trim() === '' &&
        currentEntries[0].outstandingBalance.trim() === ''
          ? []
          : currentEntries;

      if (count === 0) {
        return {
          ...prev,
          [categoryId]: [emptyDebt(categoryId)] as ReadonlyArray<Debt>,
        };
      }

      const nextEntries = Array.from({ length: count }, (_, index) => sanitizedCurrentEntries[index] ?? emptyDebt(categoryId));

      return {
        ...prev,
        [categoryId]: nextEntries as ReadonlyArray<Debt>,
      };
    });

    setIsAddingFirstDebt((prev) => ({ ...prev, [categoryId]: count > 0 }));
    setAnsweredCategories((prev) => ({ ...prev, [categoryId]: true }));
  }, []);

  const isEntryComplete = useCallback((entry: Debt) => {
    return entry.description.trim() !== '' && parseCurrencyInput(entry.monthlyPayment) !== '';
  }, []);

  const isCategoryComplete = useCallback((categoryId: DebtCategory) => {
    const count = getCategoryEntryCount(categoryId);
    if (count === 0) return true;
    const categoryDebts = debts[categoryId] || [];
    return categoryDebts.slice(0, count).every(isEntryComplete);
  }, [debts, getCategoryEntryCount, isEntryComplete]);

  const activeCategory = categories[activeCategoryIndex] ?? categories[0]!;
  const activeCategoryDebts = debts[activeCategory.id] || [];
  const activeCategoryCount = getCategoryEntryCount(activeCategory.id);
  const allCategoriesComplete = categories.every((category) => isCategoryComplete(category.id));
  const completedCategoryCount = categories.filter((category) => isCategoryComplete(category.id)).length;
  const completionPercent = Math.round((completedCategoryCount / categories.length) * 100);

  const categorySummary = categories.map((category) => {
    const categoryDebts = (debts[category.id] || []).slice(0, getCategoryEntryCount(category.id));
    const monthlyPayment = categoryDebts.reduce((sum, debt) => sum + parseCurrencyNumber(debt.monthlyPayment), 0);
    const yearlyPayment = monthlyPayment * 12;
    const totalBalance = categoryDebts.reduce((sum, debt) => sum + parseCurrencyNumber(debt.outstandingBalance), 0);
    const totalOriginal = categoryDebts.reduce((sum, debt) => sum + parseCurrencyNumber(debt.originalLoanAmount), 0);
    const utilization =
      (category.id === 'CREDIT_CARD' || category.id === 'LINE_OF_CREDIT') && totalOriginal > 0
        ? (totalBalance / totalOriginal) * 100
        : null;

    return {
      category,
      accounts: categoryDebts.length,
      monthlyPayment,
      yearlyPayment,
      totalBalance,
      totalOriginal,
      utilization,
    };
  });

  const totals = categorySummary.reduce(
    (acc, row) => {
      acc.accounts += row.accounts;
      acc.monthlyPayment += row.monthlyPayment;
      acc.yearlyPayment += row.yearlyPayment;
      acc.totalBalance += row.totalBalance;
      acc.totalOriginal += row.totalOriginal;
      return acc;
    },
    { accounts: 0, monthlyPayment: 0, yearlyPayment: 0, totalBalance: 0, totalOriginal: 0 },
  );

  const revolvingTotals = categorySummary
    .filter((row) => row.category.id === 'CREDIT_CARD' || row.category.id === 'LINE_OF_CREDIT')
    .reduce(
      (acc, row) => {
        acc.totalBalance += row.totalBalance;
        acc.totalOriginal += row.totalOriginal;
        return acc;
      },
      { totalBalance: 0, totalOriginal: 0 },
    );
  const overallUtilization =
    revolvingTotals.totalOriginal > 0 ? (revolvingTotals.totalBalance / revolvingTotals.totalOriginal) * 100 : null;

  return (
    <div className="space-y-6">
      <Toast message={message} visible={visible} onClose={closeToast} />
      <section className="rounded-[1.5rem] border border-slate-200 bg-white/95 p-4 shadow-[0_16px_35px_-24px_rgba(15,23,42,0.3)] sm:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Debt Intake</div>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Business Debt Summary</h2>
            <p className="mt-1 text-sm text-slate-600">
              Capture debt details one category at a time in the same style as the standalone debt summary template.
            </p>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${allCategoriesComplete ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
            {allCategoriesComplete ? 'All categories complete' : `${completedCategoryCount}/${categories.length} complete`}
          </div>
        </div>

        {showCompletionProgress && (
          <div className="mb-4 rounded-2xl border border-sky-200 bg-gradient-to-r from-cyan-100/80 via-white to-emerald-100/80 p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-900">Form completion</div>
              <div className="text-sm font-bold text-slate-900">{completionPercent}%</div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#0284c7_0%,#14b8a6_55%,#16a34a_100%)] transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <div className="mt-2 text-xs font-medium text-slate-600">
              {completedCategoryCount} of {categories.length} debt categories complete
            </div>
          </div>
        )}

        <div className="mb-4 md:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((category, index) => {
              const active = category.id === activeCategory.id;
              const done = isCategoryComplete(category.id);
              return (
                <button
                  key={`mobile-${category.id}`}
                  type="button"
                  onClick={() => setActiveCategoryIndex(index)}
                  className={`flex-none whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : done
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                      : 'border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {done && !active ? '✓ ' : ''}
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6 hidden gap-3 md:grid md:grid-cols-5">
          {categories.map((category, index) => {
            const active = category.id === activeCategory.id;
            const done = isCategoryComplete(category.id);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategoryIndex(index)}
                className={`rounded-xl border px-3 py-2 text-left transition ${
                  active
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : done
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                <div className="text-[11px] font-semibold uppercase tracking-wide">
                  {active ? 'Current' : done ? 'Complete' : 'Pending'}
                </div>
                <div className="mt-1 text-sm font-semibold">{category.name}</div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{activeCategory.name}</h3>
              <p className="mt-1 text-sm text-slate-700">{categoryQuestions[activeCategory.id]}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{activeCategory.description}</p>
            </div>
            <div className="text-sm text-slate-500">Category {activeCategoryIndex + 1} of {categories.length}</div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-semibold text-slate-900">How many accounts belong in this category?</div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {COUNT_OPTIONS.map((count) => {
                const selected = activeCategoryCount === count;
                return (
                  <button
                    key={`${activeCategory.id}-${count}`}
                    type="button"
                    onClick={() => setCategoryCount(activeCategory.id, count)}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      selected
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {count}
                  </button>
                );
              })}
            </div>
          </div>

          {activeCategoryCount === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-600">
              No {activeCategory.name.toLowerCase()} entries will be included unless you choose a count above 0.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {activeCategoryDebts.slice(0, activeCategoryCount).map((entry, index) => {
                const fieldIdPrefix = `debt-${activeCategory.id}-${index}`;
                const descriptionId = `${fieldIdPrefix}-description`;
                const monthlyPaymentId = `${fieldIdPrefix}-monthlyPayment`;
                const labels = categoryFieldLabels[activeCategory.id];

                return (
                  <Card key={`${fieldIdPrefix}-entry`} className="border-slate-200 bg-white shadow-sm">
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-slate-900">
                          {activeCategory.name} #{index + 1}
                        </div>
                        {activeCategoryCount > 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              removeEntry(activeCategory.id, index);
                              const nextCount = Math.max(0, activeCategoryCount - 1);
                              setTimeout(() => setCategoryCount(activeCategory.id, nextCount), 0);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                            aria-label={`Delete ${activeCategory.name} entry ${index + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete entry
                          </button>
                        ) : null}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          label={labels.description}
                          htmlFor={descriptionId}
                          required
                          help="Use a short lender or account description that will still make sense in the final report."
                          error={errorFields[descriptionId] ? 'Description is required.' : undefined}
                          className="md:col-span-2"
                        >
                          <Input
                            type="text"
                            placeholder={descriptionPlaceholders[activeCategory.id]}
                            value={entry.description}
                            onChange={(e) => handleEntryChange(activeCategory.id, index, 'description', e.target.value)}
                            maxLength={DESCRIPTION_MAX_LEN}
                          />
                        </FormField>

                        <FormField
                          label={labels.original}
                          htmlFor={`${fieldIdPrefix}-originalAmount`}
                          help={activeCategory.id === 'CREDIT_CARD' || activeCategory.id === 'LINE_OF_CREDIT' ? 'Enter the full credit limit.' : 'Original loan amount when opened.'}
                        >
                          <Input
                            type="text"
                            inputMode='numeric'
                            placeholder="$0"
                            value={formatCurrency(entry.originalLoanAmount)}
                            onChange={(e) => handleEntryChange(activeCategory.id, index, 'originalLoanAmount', e.target.value)}
                          />
                        </FormField>

                        <FormField
                          label={labels.balance}
                          htmlFor={`${fieldIdPrefix}-balance`}
                          help="Current amount still owed today."
                        >
                          <Input
                            type="text"
                            placeholder="$0"
                            value={formatCurrency(entry.outstandingBalance)}
                            onChange={(e) => handleEntryChange(activeCategory.id, index, 'outstandingBalance', e.target.value)}
                          />
                        </FormField>

                        <FormField
                          label={labels.payment}
                          htmlFor={monthlyPaymentId}
                          required
                          help="Required monthly payment only. If the lender drafts weekly or daily, convert it to a monthly equivalent."
                          error={errorFields[monthlyPaymentId] ? 'Monthly payment is required.' : undefined}
                        >
                          <Input
                            type="text"
                            inputMode='numeric'
                            placeholder="$0"
                            value={formatCurrency(entry.monthlyPayment)}
                            onChange={(e) => handleEntryChange(activeCategory.id, index, 'monthlyPayment', e.target.value)}
                          />
                        </FormField>

                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {activeCategoryCount < MAX_ROWS ? (
                <button
                  type="button"
                  onClick={() => setCategoryCount(activeCategory.id, activeCategoryCount + 1)}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add entry
                </button>
              ) : null}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActiveCategoryIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeCategoryIndex === 0}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous Category
            </button>

            <div className={`text-sm font-semibold ${isCategoryComplete(activeCategory.id) ? 'text-emerald-700' : 'text-amber-700'}`}>
              {isCategoryComplete(activeCategory.id) ? 'Category complete' : 'Add a description and monthly payment for each listed account'}
            </div>

            <button
              type="button"
              onClick={() => setActiveCategoryIndex((prev) => Math.min(categories.length - 1, prev + 1))}
              disabled={activeCategoryIndex === categories.length - 1}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next Category
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white/95 p-4 shadow-[0_16px_35px_-24px_rgba(15,23,42,0.3)] sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Live Summary</div>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Debt Summary</h2>
            <p className="mt-1 text-sm text-slate-600">
              This mirrors the running summary style from the dedicated Business Debt Summary template form.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {totals.accounts} total accounts
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm md:min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-2 py-2">Category</th>
                <th className="px-2 py-2 text-right">Accounts</th>
                <th className="px-2 py-2 text-right">Monthly Payment</th>
                <th className="hidden px-2 py-2 text-right md:table-cell">Yearly Payment</th>
                <th className="px-2 py-2 text-right">Total Balance</th>
                <th className="px-2 py-2 text-right">Original / Limit</th>
                <th className="px-2 py-2 text-right">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {categorySummary.map((row) => (
                <tr key={row.category.id} className="border-b border-slate-100">
                  <td className="px-2 py-2 font-medium text-slate-900">{row.category.name}</td>
                  <td className="px-2 py-2 text-right text-slate-700">{row.accounts}</td>
                  <td className="px-2 py-2 text-right text-slate-700">${row.monthlyPayment.toLocaleString()}</td>
                  <td className="hidden px-2 py-2 text-right text-slate-700 md:table-cell">${row.yearlyPayment.toLocaleString()}</td>
                  <td className="px-2 py-2 text-right text-slate-700">${row.totalBalance.toLocaleString()}</td>
                  <td className="px-2 py-2 text-right text-slate-700">{row.totalOriginal > 0 ? `$${row.totalOriginal.toLocaleString()}` : '—'}</td>
                  <td className="px-2 py-2 text-right text-slate-700">{row.utilization !== null ? `${row.utilization.toFixed(1)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-300 bg-slate-50 text-sm font-semibold text-slate-900">
                <td className="px-2 py-2">Total</td>
                <td className="px-2 py-2 text-right">{totals.accounts}</td>
                <td className="px-2 py-2 text-right">${totals.monthlyPayment.toLocaleString()}</td>
                <td className="hidden px-2 py-2 text-right md:table-cell">${totals.yearlyPayment.toLocaleString()}</td>
                <td className="px-2 py-2 text-right">${totals.totalBalance.toLocaleString()}</td>
                <td className="px-2 py-2 text-right">{totals.totalOriginal > 0 ? `$${totals.totalOriginal.toLocaleString()}` : '—'}</td>
                <td className="px-2 py-2 text-right">{overallUtilization !== null ? `${overallUtilization.toFixed(1)}%` : '—'}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <div className="rounded-xl bg-blue-50 p-4 text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">Total Monthly Payment</div>
            <div className="mt-1 text-xl font-bold text-blue-800">${totals.monthlyPayment.toLocaleString()}</div>
          </div>
          <div className="rounded-xl bg-indigo-50 p-4 text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Total Yearly Payment</div>
            <div className="mt-1 text-xl font-bold text-indigo-800">${totals.yearlyPayment.toLocaleString()}</div>
          </div>
          <div className="rounded-xl bg-rose-50 p-4 text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-rose-700">Total Balance</div>
            <div className="mt-1 text-xl font-bold text-rose-800">${totals.totalBalance.toLocaleString()}</div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4 text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Revolving Utilization</div>
            <div className="mt-1 text-xl font-bold text-emerald-800">
              {overallUtilization !== null ? `${overallUtilization.toFixed(1)}%` : '—'}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
});

BusinessDebtsStep.displayName = 'BusinessDebtsStep'; // Good practice for debugging

// Helper function to initialize debts state from initialData prop
function initializeDebtsState(initialData: Debt[]): Record<DebtCategory, ReadonlyArray<Debt>> {
  const initialDebts: Record<DebtCategory, Debt[]> = {
    REAL_ESTATE: [],
    VEHICLE_EQUIPMENT: [],
    CREDIT_CARD: [],
    LINE_OF_CREDIT: [],
    OTHER: [],
  };

  // Populate from initialData
  initialData.forEach(debt => {
    if (initialDebts[debt.category]) {
      initialDebts[debt.category].push(debt);
    }
  });

  // Ensure each category has at least one (potentially empty) entry
  categories.forEach(cat => {
    if (initialDebts[cat.id].length === 0) {
      initialDebts[cat.id].push(emptyDebt(cat.id));
    }
  });
  return initialDebts as Record<DebtCategory, ReadonlyArray<Debt>>;
}

export function getDebtsByCategory(debts: Debt[]): Record<DebtCategory, Debt[]> {
  const grouped: Record<DebtCategory, Debt[]> = {
    REAL_ESTATE: [],
    VEHICLE_EQUIPMENT: [],
    CREDIT_CARD: [],
    LINE_OF_CREDIT: [],
    OTHER: [],
  };
  debts.forEach((debt) => {
    grouped[debt.category].push(debt);
  });
  (Object.keys(grouped) as DebtCategory[]).forEach((cat) => {
    while (grouped[cat].length < 5) {
      grouped[cat].push(emptyDebt(cat));
    }
    grouped[cat] = grouped[cat].slice(0, 5);
  });
  return grouped;
}

export default memo(BusinessDebtsStep); // Export the memoized component
