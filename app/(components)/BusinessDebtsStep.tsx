'use client'

import { memo, useCallback, useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/(components)/ui/card'
import { Input } from '@/app/(components)/ui/input'
import { Button } from '@/app/(components)/ui/button'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/(components)/ui/tooltip'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/app/(components)/ui/accordion'
import { PlusCircle, MinusCircle, DollarSign, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast, Toast } from '@/app/(components)/shared/Toast';

export type DebtCategory = 'REAL_ESTATE' | 'VEHICLE_EQUIPMENT' | 'CREDIT_CARD' | 'LINE_OF_CREDIT' | 'OTHER';

interface DebtEntry {
  description: string;
  originalAmount: string;
  balance: string;
  monthlyPayment: string;
  interestRate: string;
}

interface BusinessDebtsStepProps {
  onNext: () => void;
  onBack: () => void;
  isFormValid?: (valid: boolean) => void;
  onFormDataChange: (data: Debt[]) => void;
  initialData?: Debt[];
}

// --- Export Debt interface from this file ---
export interface Debt {
  category: DebtCategory;
  description: string;
  monthlyPayment: string;
  originalLoanAmount: string;
  outstandingBalance: string;
  notes: string;
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
  notes: '',
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

const MAX_ROWS = 5;

// constants for input length limits
const DESCRIPTION_MAX_LEN = 40;
const NOTES_MAX_LEN = 32;

// State to track if the user has started adding the first debt in a category
type AddingFirstDebtState = Partial<Record<DebtCategory, boolean>>;

const BusinessDebtsStep = forwardRef<BusinessDebtsStepHandle, BusinessDebtsStepProps>((
  { 
    onNext, 
    onBack, 
    isFormValid, 
    onFormDataChange, 
    initialData = [] 
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
          entry.outstandingBalance === '' &&
          entry.notes === '';

        // --- FIX: If this is an untouched placeholder, skip validation for this entry ---
        if (isEmptyPlaceholder) continue;

        // --- FIX: If ALL fields are empty, skip validation for this entry (covers accidental extra rows) ---
        const allFieldsEmpty =
          entry.description === '' &&
          entry.monthlyPayment === '' &&
          entry.originalLoanAmount === '' &&
          entry.outstandingBalance === '' &&
          entry.notes === '';
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
    // Enforce character limits for description and notes fields
    if (field === 'description') {
      value = value.slice(0, DESCRIPTION_MAX_LEN);
    }
    if (field === 'notes') {
      value = value.slice(0, NOTES_MAX_LEN);
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

  const handleAddFirstEntry = useCallback((categoryId: DebtCategory) => {
    setIsAddingFirstDebt(prev => ({ ...prev, [categoryId]: true }));
    // Optionally focus the first input after revealing
    // This might require refs, keeping it simple for now
  }, []);

  const addEntry = useCallback((categoryId: DebtCategory) => {
    setDebts((prev: Record<DebtCategory, ReadonlyArray<Debt>>) => {
      const entries = prev[categoryId] || [];
      if (entries.length >= MAX_ROWS) {
        showToast('Limit Reached: You can add up to 5 debts in this category.');
        return prev;
      }
      return {
        ...prev,
        [categoryId]: [...entries, emptyDebt(categoryId)] as ReadonlyArray<Debt>
      };
    });
  }, [showToast]);

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
      .filter(d => d.description || d.monthlyPayment || d.originalLoanAmount || d.outstandingBalance || d.notes); // Exclude empty placeholders
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialData)]);

  // Navigation Handlers
  const handleNext = useCallback(() => {
    // Perform validation before proceeding
    if (runValidation()) {
      // Fallback: Always scroll to top when advancing from Step 3 (Business Debts)
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      onNext();
    }
  }, [onNext, runValidation]);

  const handleBack = useCallback(() => {
    onBack();
  }, [onBack]);

  return (
    <div className="space-y-6">
      {/* Render the Toast component directly using state from the hook */}
      <Toast message={message} visible={visible} onClose={closeToast} />
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Step 3: Business Debts</h2>
        <p className="mt-2 text-gray-600">
          List all current business debts, including loans, credit cards, and equipment financing.
        </p>
      </div>

      <Accordion type="multiple" className="w-full">
        {categories.map(category => {
          const categoryDebts = debts[category.id] || [];
          // Provide default value 'false' for isAddingFirstDebt[category.id]
          const isAdding = isAddingFirstDebt[category.id] ?? false;

          // Check length first, then assign to variable before accessing properties
          let isOuterOnlyEmptyPlaceholder = false; // Use a different name to avoid shadowing
          if (categoryDebts.length === 1) {
            const firstDebt = categoryDebts[0];
            // Check firstDebt exists for extra safety, though length === 1 should guarantee it
            if (firstDebt) {
              // Assign to the outer variable, don't redeclare
              isOuterOnlyEmptyPlaceholder =
                firstDebt.description.trim() === '' &&
                firstDebt.monthlyPayment.trim() === '' &&
                (firstDebt.originalLoanAmount === null || String(firstDebt.originalLoanAmount).trim() === '') && // Handle null/empty string
                (firstDebt.outstandingBalance === null || String(firstDebt.outstandingBalance).trim() === ''); // Handle null/empty string
            }
          }
          const showAddButton = !isAdding && isOuterOnlyEmptyPlaceholder;
          const showInputs = isAdding || !showAddButton;

          return (
            <AccordionItem value={category.id} key={category.id}>
              <AccordionTrigger>
                <div className="flex flex-col items-start">
                  <span className="text-base font-medium">{category.name}</span>
                  {/* Add category description here */}
                  <span className="text-sm text-gray-500">{category.description}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {showAddButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mb-4 flex items-center space-x-2"
                    onClick={() => handleAddFirstEntry(category.id)}
                  >
                    <Plus size={16} />
                    <span>Add {category.name} Debt</span>
                  </Button>
                )}
                {showInputs && (
                  <div className="space-y-4">
                    {categoryDebts.map((entry, index) => {
                      // Generate a prefix for field IDs in this entry
                      const fieldIdPrefix = `debt-${category.id}-${index}`;
                      const descriptionId = `${fieldIdPrefix}-description`;
                      const monthlyPaymentId = `${fieldIdPrefix}-monthlyPayment`;

                      return (
                        <Card key={`${fieldIdPrefix}-entry`} className="bg-gray-50/50">
                          <CardContent className="p-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Description/Property Address */}
                              <div className="lg:col-span-2">
                                <label htmlFor={descriptionId} className="block text-sm font-medium text-gray-700 mb-1">
                                  {category.id === 'REAL_ESTATE' ? 'Property Address' : 'Description'}
                                </label>
                                <Input
                                  id={descriptionId}
                                  type="text"
                                  placeholder={descriptionPlaceholders[category.id]}
                                  value={entry.description}
                                  onChange={(e) => handleEntryChange(category.id, index, 'description', e.target.value)}
                                  className={cn(errorFields[descriptionId] && "border-red-500 focus:ring-red-500")} // <-- Add error class
                                  required={category.id === 'CREDIT_CARD'} // Add required attribute
                                  maxLength={DESCRIPTION_MAX_LEN}
                                />
                                {entry.description.length >= DESCRIPTION_MAX_LEN && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    You've reached the {DESCRIPTION_MAX_LEN}-character limit. Feel free to shorten as long as the debt is clear.
                                  </p>
                                )}
                              </div>

                              {/* Original Loan Amount Input */}
                              <div>
                                <label htmlFor={`${fieldIdPrefix}-originalAmount`} className="block text-sm font-medium text-gray-700 mb-1">
                                  {(category.id === 'CREDIT_CARD' || category.id === 'LINE_OF_CREDIT') ? 'Credit Limit' : 'Original Amount'}
                                </label>
                                <div className="relative">
                                  <Input
                                    id={`${fieldIdPrefix}-originalAmount`}
                                    type="text"
                                    inputMode='numeric'
                                    placeholder="$0"
                                    value={formatCurrency(entry.originalLoanAmount)} // Display formatted value
                                    onChange={(e) => handleEntryChange(category.id, index, 'originalLoanAmount', e.target.value)}
                                    className={cn(
                                      "pl-8",
                                      errorFields[`${fieldIdPrefix}-originalAmount`] && 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                                    )}
                                  />
                                </div>
                              </div>

                              {/* Outstanding Balance Input */}
                              <div>
                                <label htmlFor={`${fieldIdPrefix}-balance`} className="block text-sm font-medium text-gray-700 mb-1">
                                  Balance
                                </label>
                                <div className="relative">
                                  <Input
                                    id={`${fieldIdPrefix}-balance`}
                                    type="text"
                                    placeholder="$0"
                                    value={formatCurrency(entry.outstandingBalance)} // Display formatted value
                                    onChange={(e) => handleEntryChange(category.id, index, 'outstandingBalance', e.target.value)}
                                    className={cn(
                                      "pl-8",
                                      errorFields[`${fieldIdPrefix}-outstandingBalance`] && 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                                    )}
                                  />
                                </div>
                              </div>

                              {/* Monthly Payment Input */}
                              <div>
                                <label htmlFor={monthlyPaymentId} className="block text-sm font-medium text-gray-700 mb-1">
                                  Monthly Payment
                                </label>
                                <div className="relative">
                                  <Input
                                    id={monthlyPaymentId}
                                    type="text"
                                    inputMode='numeric'
                                    placeholder="$0"
                                    value={formatCurrency(entry.monthlyPayment)} // Display formatted value
                                    onChange={(e) => handleEntryChange(category.id, index, 'monthlyPayment', e.target.value)}
                                    className={cn(
                                      "pl-8",
                                      errorFields[monthlyPaymentId] && "border-red-500 focus:ring-red-500" // <-- Add error class
                                    )}
                                    required={category.id === 'CREDIT_CARD'} // Add required attribute
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Notes Input */}
                            <div className="mb-2">
                              <label htmlFor={`${fieldIdPrefix}-notes`} className="block text-sm font-medium text-gray-700 mb-1">
                                Notes (Optional)
                              </label>
                              <Input
                                id={`${fieldIdPrefix}-notes`}
                                type="text"
                                placeholder="E.g., Interest rate, loan term, specific conditions"
                                value={entry.notes}
                                onChange={(e) => handleEntryChange(category.id, index, 'notes', e.target.value)}
                                className={cn(
                                  errorFields[`${fieldIdPrefix}-notes`] && 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                                )}
                                maxLength={NOTES_MAX_LEN}
                              />
                              {entry.notes.length >= NOTES_MAX_LEN && (
                                <p className="text-xs text-gray-500 mt-1">
                                  You've reached the {NOTES_MAX_LEN}-character limit. It's okay to keep notes brief and clear.
                                </p>
                              )}
                            </div>

                            {/* Remove Button - Placed below inputs for clarity, only show if needed */}
                            {(categoryDebts.length > 1 || (categoryDebts.length === 1 && (entry.description.trim() !== '' || parseCurrencyInput(entry.monthlyPayment) !== ''))) && (
                              <div className="flex justify-end mt-2"> {/* Wrapper for alignment */}
                                <TooltipProvider delayDuration={100}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => removeEntry(category.id, index)}
                                        aria-label={`Remove ${category.name} debt entry ${index + 1}`}
                                      >
                                        <MinusCircle className="mr-2 h-4 w-4" />
                                        Remove This Entry
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Permanently remove this debt entry.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                    {/* Add More Button */}
                    {categoryDebts.length < MAX_ROWS && categoryDebts.length > 0 && !isOuterOnlyEmptyPlaceholder && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 flex items-center space-x-2"
                        onClick={() => addEntry(category.id)}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        <span>Add Another {category.name} Entry</span>
                      </Button>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
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
