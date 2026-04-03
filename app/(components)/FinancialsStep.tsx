'use client';

import { convertToNumeric, unformatCurrency } from './FinancialsUtils';
import { 
  useState, 
  useEffect, 
  memo, 
  useCallback, 
  useMemo,
  useRef, 
  forwardRef, 
  useImperativeHandle 
} from 'react';
import { 
  Button
} from '@/app/(components)/ui/button';
import {
  Card,
  CardContent,
} from '@/app/(components)/ui/card';
import { Input } from '@/app/(components)/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/(components)/ui/tabs"
import { Checkbox } from "./ui/checkbox"; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'; 
import { Info } from 'lucide-react'; 
import { useToast } from '@/app/(components)/shared/useToast'; 
import { cn } from "@/lib/utils";
import FormField from '@/app/(components)/templates/shared/FormField';

// Full data for each year, including all fields for input persistence
export interface FullFinancialData {
  revenue: string;
  cogs: string;
  operatingExpenses: string;
  nonRecurringIncome: string;
  nonRecurringExpenses: string;
  depreciation: string;
  amortization: string;
  interest: string; // NEW FIELD
  taxes: string;    // NEW FIELD
  // netIncome removed: it is a calculated field only, not user input
}

// --- Export NumericFinancialData type for use in ReviewSubmitStep ---
export type NumericFinancialData = {
  revenue: number;
  expenses: number;
  netIncome: number;
  ebitda: number;
  grossProfit: number;
  interest: number; // NEW FIELD
  taxes: number;    // NEW FIELD
  cogs: number;
  operatingExpenses: number;
  depreciation: number;
  amortization: number;
  nonRecurringIncome: number;
  nonRecurringExpenses: number;
  adjustedEbitda: number;
};

// --- Refactor FinancialsPayload to avoid type conflicts and ensure type safety ---
export type FinancialsPayload = {
  year2024: { input: FullFinancialData; summary: NumericFinancialData; skip?: boolean };
  year2025: { input: FullFinancialData; summary: NumericFinancialData };
  year2026YTD: { input: FullFinancialData; summary: NumericFinancialData; ytdMonth?: string; skip?: boolean };
};

interface FinancialsStepProps {
  onNext: () => void;
  onBack: () => void;
  isFormValid?: (isValid: boolean) => void;
  onFormDataChange: (data: FinancialsPayload) => void; 
  initialData: FinancialsPayload | null; 
}

interface FinancialsStepHandle {
  validate: () => boolean;
}

interface FinancialInputsProps {
  year: string;
  data: FullFinancialData;
  setData: React.Dispatch<React.SetStateAction<FullFinancialData>>;
  ytdMonth: string;
  setYtdMonth: (month: string) => void;
  availableYtdMonths?: ReadonlyArray<{ value: string; label: string }>;
  defaultYtdMonthLabel?: string;
  skip: boolean; 
  errors: FinancialErrorData & { ytdMonth?: boolean }; // Add errors prop
  showErrors: boolean; // new flag to control when to display errors
}

interface FinancialFieldInfo {
  shortDescription: string;
  whereToFind: string;
  additionalNote?: string;
}

type FinancialErrorData = {
  [K in keyof FullFinancialData]?: boolean; // Optional boolean flags for each field
};

type FieldErrors = {
  '2024': FinancialErrorData;
  '2025': FinancialErrorData;
  '2026': FinancialErrorData & { ytdMonth?: boolean };
};

const financialFieldsInfo: Record<keyof FullFinancialData, FinancialFieldInfo> = {
  revenue: {
    shortDescription: 'Total sales or income before any expenses.',
    whereToFind: 'Income statement (profit & loss), business tax return, or gross receipts.',
    additionalNote: 'If using a tax return, use the sales number after returns (not the first total at the top).'
  },
  cogs: {
    shortDescription: 'Enter the total direct costs required to produce your product or deliver your service, combined into one COGS number for the period.',
    whereToFind: 'Income statement or business tax return. Often listed as "Cost of Goods Sold" or similar.'
  },
  operatingExpenses: {
    shortDescription: `All regular business expenses.\nExamples:\n• rent\n• payroll\n• marketing\n• software\n• utilities\n• insurance`,
    whereToFind: 'Income statement below gross profit, or business tax return under expenses/deductions.'
  },
  nonRecurringIncome: {
    shortDescription: `Income that is not part of your normal business operations and is unlikely to happen again.\nExamples:\n• selling equipment\n• insurance payouts\n• grants\n• forgiven debt\n• lawsuit settlements`,
    whereToFind: 'Usually listed as "Other income" or a separate line on your income statement. May also appear in your business tax return under "other income" or attached statements.'
  },
  nonRecurringExpenses: {
    shortDescription: `Expenses that are not part of your normal business operations and are unlikely to happen again.\nExamples:\n• major repairs\n• legal settlements\n• disaster cleanup\n• one-time restructuring costs`,
    whereToFind: 'Usually listed as "Other expenses" or a separate line on your income statement. May also appear in your business tax return under deductions or attached statements.'
  },
  depreciation: {
    shortDescription: 'Non-cash expense for assets losing value over time (like equipment or vehicles).',
    whereToFind: 'Income statement, business tax return, or depreciation schedule. Often listed as "Depreciation" or combined with amortization.'
  },
  amortization: {
    shortDescription: 'Non-cash expense related to intangible assets (like loans, goodwill, or startup costs).',
    whereToFind: 'Income statement, business tax return, or supporting schedules. Often grouped with depreciation or listed separately.'
  },
  interest: {
    shortDescription: 'Interest paid on business debt (loans, credit lines, or financing).',
    whereToFind: 'Income statement or business tax return, usually listed as "Interest Expense" or similar.'
  },
  taxes: {
    shortDescription: 'Taxes paid on business income for the period.',
    whereToFind: 'Income statement, business tax return, or accountant-prepared financials.'
  },
};

const fieldTitles: Record<keyof FullFinancialData, string> = {
  revenue: "Revenue",
  cogs: "Cost of Goods Sold (COGS)",
  operatingExpenses: "Operating Expenses",
  nonRecurringIncome: "Non-Recurring Income",
  nonRecurringExpenses: "Non-Recurring Expenses",
  depreciation: "Depreciation",
  amortization: "Amortization",
  interest: "Interest Expense", // NEW
  taxes: "Income Taxes"         // NEW
};

const createEmptyFinancialData = (): FullFinancialData => ({
  revenue: '',
  cogs: '',
  operatingExpenses: '',
  nonRecurringIncome: '',
  nonRecurringExpenses: '',
  depreciation: '',
  amortization: '',
  interest: '', // NEW
  taxes: '',     // NEW
});

const MONTH_OPTIONS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
] as const;

const CASH_FLOW_YTD_YEAR = 2026;

const toMonthValue = (monthNumber: number) => monthNumber.toString().padStart(2, '0');

const getAvailableYtdMonths = (today: Date) => {
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  if (currentYear < CASH_FLOW_YTD_YEAR) {
    return MONTH_OPTIONS.slice(0, 1);
  }

  if (currentYear === CASH_FLOW_YTD_YEAR) {
    return MONTH_OPTIONS.slice(0, Math.max(currentMonth, 1));
  }

  return MONTH_OPTIONS;
};

const getDefaultYtdMonthValue = (today: Date) => {
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  if (currentYear < CASH_FLOW_YTD_YEAR) {
    return '01';
  }

  if (currentYear === CASH_FLOW_YTD_YEAR) {
    const lastFullMonth = currentMonth - 1;
    return toMonthValue(lastFullMonth >= 1 ? lastFullMonth : currentMonth);
  }

  return '12';
};

const formatCurrency = (rawValue: string) => {
  // If empty string, return empty (for placeholder)
  if (rawValue === '' || rawValue === undefined || rawValue === null) {
    return '';
  }
  // If exactly '0', show $0
  if (rawValue === '0') {
    return '$0';
  }

  const numbers = rawValue.replace(/\D/g, '');
  const numericValue = Number(numbers);

  if (!numbers) {
    return '';
  }

  return `$${numericValue.toLocaleString('en-US')}`; 
};

const getYearSourceGuidance = (year: string) => {
  if (year === '2026') {
    return 'Best source: your 2026 year-to-date income statement / profit and loss statement. A 2026 tax return usually does not exist yet, and that is okay.';
  }

  return `Best source: your ${year} business income statement / profit and loss statement, or your ${year} business tax return if that is the cleanest source you have.`;
};

const getFieldExamples = (key: keyof FullFinancialData) =>
  financialFieldsInfo[key].shortDescription
    .split('\n')
    .filter((line) => line.trim().startsWith('•'))
    .map((line) => line.replace(/^•\s*/, '').trim());



const FinancialInputs = memo(({ 
  year, 
  data, 
  setData,
  ytdMonth,
  setYtdMonth,
  availableYtdMonths = MONTH_OPTIONS,
  defaultYtdMonthLabel = 'the last full month',
  skip,
  errors,
  showErrors
}: FinancialInputsProps) => {
  const handleChange = useCallback((key: keyof FullFinancialData, input: string) => {
    // If input is empty, set as empty string (for placeholder)
    if (input === '') {
      setData(prev => ({ ...prev, [key]: '' }));
      return;
    }
    // If user tries to delete $0, allow clearing
    if (input === '$0') {
      setData(prev => ({ ...prev, [key]: '' }));
      return;
    }
    const rawValue = unformatCurrency(input);
    setData(prev => ({
      ...prev,
      [key]: formatCurrency(rawValue?.toString() ?? '') // Format before setting
    }));
  }, [setData]);

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          {year === '2026' ? 'Current Year-To-Date' : 'Full Year'}
        </div>
        <h3 className="mt-1 text-xl font-bold text-slate-900">{year}{year === '2026' ? ' YTD' : ''}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {getYearSourceGuidance(year)}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          If a line is not shown separately on your statement, or it does not apply to your business, enter `$0`. That is completely fine.
        </p>
      </div>
      {year === '2026' && (
        <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <FormField
            label="Last Full Month Included"
            htmlFor={`${year}-ytd-month`}
            required
            help={`Select the last full month included in your 2026 year-to-date income statement. We default this to ${defaultYtdMonthLabel}, but you can change it if your statement covers a different month.`}
            error={showErrors && errors.ytdMonth ? `YTD Month is required for ${year}.` : undefined}
            className="max-w-xs"
          >
            <select
              id={`${year}-ytd-month`}
              value={ytdMonth}
              onChange={(e) => setYtdMonth(e.target.value)}
              className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                showErrors && errors.ytdMonth && "border-red-500 focus:ring-red-500"
              )}
              required
              disabled={skip}
            >
              <option value="" disabled>Select last full month...</option>
              {availableYtdMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </FormField>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Only months reached so far in 2026 are shown. Choose the last fully completed month covered by your statement.
          </p>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {[
          'revenue',
          'operatingExpenses',
          'nonRecurringIncome',
          'nonRecurringExpenses',
          'cogs',
          'depreciation',
          'amortization',
          'interest', // NEW
          'taxes'     // NEW
        ].map((key) => (
          <div key={`${year}-${key}`} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <FormField
              label={fieldTitles[key as keyof FullFinancialData]}
              htmlFor={`${year}-${key}`}
              required
              help={
                <span>
                  <span className="block">{financialFieldsInfo[key as keyof FullFinancialData].shortDescription.split('\n')[0]}</span>
                  <span className="mt-1 block text-slate-500">
                    Where to find it: {financialFieldsInfo[key as keyof FullFinancialData].whereToFind}
                  </span>
                  {financialFieldsInfo[key as keyof FullFinancialData].additionalNote && (
                    <span className="mt-1 block text-slate-500">
                      {financialFieldsInfo[key as keyof FullFinancialData].additionalNote}
                    </span>
                  )}
                </span>
              }
              error={
                showErrors && errors[key as keyof FullFinancialData]
                  ? `${fieldTitles[key as keyof FullFinancialData]} is required for ${year}.`
                  : undefined
              }
            >
              <Input
                value={formatCurrency(data[key as keyof FullFinancialData] ?? '')}
                onChange={e => handleChange(key as keyof FullFinancialData, e.target.value)}
                type="text"
                inputMode="numeric"
                placeholder="Enter $0 if none"
                className={cn(
                  "font-mono placeholder:font-sans",
                  showErrors && errors[key as keyof FullFinancialData] && "border-red-500 focus:ring-red-500"
                )}
                disabled={skip}
              />
            </FormField>

            {key !== 'operatingExpenses' && getFieldExamples(key as keyof FullFinancialData).length > 0 && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Examples</div>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  {getFieldExamples(key as keyof FullFinancialData).join(', ')}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

FinancialInputs.displayName = 'FinancialInputs';

const FinancialsStep = forwardRef<FinancialsStepHandle, FinancialsStepProps>((
  {
    onNext,
    onBack,
    isFormValid, 
    onFormDataChange,
    initialData
  },
  ref 
) => {
  // console.log(`[DEBUG FinancialsStep] Rendering.`);

  const { showToast } = useToast(); 

  const [activeTab, setActiveTab] = useState('2024');
  const [ytdMonth, setYtdMonth] = useState<string>(''); 

  const [internalIsValid, setInternalIsValid] = useState(false);

  const lastSentDataRef = useRef<string | null>(null);

  const [data2024, setData2024] = useState<FullFinancialData>(createEmptyFinancialData);
  const [data2025, setData2025] = useState<FullFinancialData>(createEmptyFinancialData);
  const [data2026, setData2026] = useState<FullFinancialData>(createEmptyFinancialData);

  const [skip2024, setSkip2024] = useState<boolean>(() => {
    if (initialData && initialData.year2024) {
      const is2024Skipped = Object.values(initialData.year2024.summary || {}).every(val => val === 0 || val === undefined || val === null);
      return is2024Skipped;
    }
    return false;
  });
  const [skip2026, setSkip2026] = useState<boolean>(() => {
    if (initialData && initialData.year2026YTD) {
      const is2026Skipped = Object.values(initialData.year2026YTD.summary || {}).every(val => val === 0 || val === undefined || val === null) && !initialData.year2026YTD.ytdMonth;
      return is2026Skipped;
    }
    return false;
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    '2024': {},
    '2025': {},
    '2026': {},
  });

  const [showErrors, setShowErrors] = useState<boolean>(false);

  const lastNonSkipped2024 = useRef<FullFinancialData | null>(null);
  const lastNonSkipped2026 = useRef<FullFinancialData | null>(null);
  const availableYtdMonths = useMemo(() => getAvailableYtdMonths(new Date()), []);
  const defaultYtdMonthValue = useMemo(() => getDefaultYtdMonthValue(new Date()), []);
  const defaultYtdMonthLabel =
    availableYtdMonths.find((month) => month.value === defaultYtdMonthValue)?.label ?? 'the last full month';

  useEffect(() => {
    // console.log("[DEBUG FinancialsStep] Mount effect running.");
    if (initialData) {
        setData2024(initialData.year2024?.input ?? createEmptyFinancialData());
        setData2025(initialData.year2025?.input ?? createEmptyFinancialData());
        setData2026(initialData.year2026YTD?.input ?? createEmptyFinancialData());
        setYtdMonth(initialData.year2026YTD?.ytdMonth ?? '');
        setSkip2024(initialData.year2024?.skip === true);
        setSkip2026(initialData.year2026YTD?.skip === true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (skip2024) {
      lastNonSkipped2024.current = data2024;
      setData2024(prev => {
        const zeroed: FullFinancialData = { ...createEmptyFinancialData() };
        Object.keys(zeroed).forEach(key => zeroed[key as keyof FullFinancialData] = '0');
        return zeroed;
      });
    } else if (lastNonSkipped2024.current) {
      setData2024(lastNonSkipped2024.current);
    }
  }, [skip2024]);

  useEffect(() => {
    if (skip2026) {
      lastNonSkipped2026.current = data2026;
      setData2026(prev => {
        const zeroed: FullFinancialData = { ...createEmptyFinancialData() };
        Object.keys(zeroed).forEach(key => zeroed[key as keyof FullFinancialData] = '0');
        return zeroed;
      });
      setYtdMonth('');
    } else if (lastNonSkipped2026.current) {
      setData2026(lastNonSkipped2026.current);
    }
  }, [skip2026]);

  useEffect(() => {
    if (skip2026) return;

    const allowedMonthValues = new Set<string>(availableYtdMonths.map((month) => month.value));
    if (ytdMonth && allowedMonthValues.has(ytdMonth)) {
      return;
    }

    if (defaultYtdMonthValue && ytdMonth !== defaultYtdMonthValue) {
      setYtdMonth(defaultYtdMonthValue);
    }
  }, [availableYtdMonths, defaultYtdMonthValue, skip2026, ytdMonth]);

  const safeToString = (value: number | null | undefined): string => {
    if (value === null || value === undefined || value === 0) {
      return '';
    } 
    return value.toString(); 
  };

  const unformatCurrency = (value: string): number | undefined => {
    if (!value) return undefined; 
    const numbers = value.replace(/\D/g, '');
    const numericValue = Number(numbers);
    return isNaN(numericValue) ? undefined : numericValue; 
  };

  const validateYear = useCallback(( 
    data: FullFinancialData, 
    year: string, 
    currentYtdMonth: string, 
    skip: boolean
  ): FinancialErrorData & { ytdMonth?: boolean } => { // Return type updated
    if (skip) return {}; // No errors if skipped

    const errors: FinancialErrorData & { ytdMonth?: boolean } = {};
    let yearIsValid = true; // Keep track for logging if needed

    // Check each field defined in FullFinancialData
    (Object.keys(createEmptyFinancialData()) as Array<keyof FullFinancialData>).forEach(key => {
      // Check if the field is empty (basic validation)
      // Also consider just '$' as empty after formatting
      if (!data[key] || data[key].trim() === '' || data[key].trim() === '$') { 
        errors[key] = true;
        yearIsValid = false;
      }
    });

    // Special check for 2026 YTD month
    if (year === '2026' && (!currentYtdMonth || currentYtdMonth === '')) {
      errors.ytdMonth = true;
      yearIsValid = false;
    }

    // console.log(`[DEBUG FinancialsStep] validateYear(${year}) - Skip: ${skip}, Valid: ${yearIsValid}, Errors:`, errors);
    return errors; // Return the errors object
  }, []); // No dependencies needed as it operates on arguments

  const validateForm = useCallback(() => {
    // console.log('[DEBUG FinancialsStep] validateForm running...');
    const errors2024 = validateYear(data2024, '2024', ytdMonth, skip2024);
    const errors2025 = validateYear(data2025, '2025', ytdMonth, false);
    const errors2026 = validateYear(data2026, '2026', ytdMonth, skip2026);

    const newFieldErrors: FieldErrors = {
      '2024': errors2024,
      '2025': errors2025,
      '2026': errors2026,
    };

    setFieldErrors(newFieldErrors); // Update the error state

    // Check if any error object has keys (meaning there's at least one error)
    const isOverallValid =
      Object.keys(errors2024).length === 0 &&
      Object.keys(errors2025).length === 0 &&
      Object.keys(errors2026).length === 0;

    // console.log('[DEBUG FinancialsStep] validateForm - Overall Validity:', isOverallValid, ' Errors:', newFieldErrors);
    return isOverallValid;
  }, [data2024, data2025, data2026, ytdMonth, skip2024, skip2026, validateYear]); // Add dependencies

  useEffect(() => {
    // console.log('[DEBUG FinancialsStep] Effect 1 (Calculate Validity) running.');
    const currentValidity = validateForm();
    setInternalIsValid(currentValidity);
  }, [validateForm]); 

  useEffect(() => {
    // console.log('[DEBUG FinancialsStep] Effect 2 (Notify Validity) running. internalIsValid: ${internalIsValid}');
    isFormValid?.(internalIsValid);
  }, [internalIsValid, isFormValid]); 

  useEffect(() => {
    // console.log('[DEBUG FinancialsStep] Effect 3 (Notify Data Change) running.'); 
    const newFinancialsData: FinancialsPayload = {
      year2024: { input: data2024, summary: convertToNumeric(data2024), skip: skip2024 },
      year2025: { input: data2025, summary: convertToNumeric(data2025) },
      year2026YTD: { input: data2026, summary: convertToNumeric(data2026), ytdMonth: ytdMonth, skip: skip2026 },
    };
    const newFinancialsDataString = JSON.stringify(newFinancialsData);
    const changed = newFinancialsDataString !== lastSentDataRef.current;
    // console.log(`[DEBUG FinancialsStep] Effect 3 - Data changed: ${changed}`);
    if (changed) {
      // console.log('[DEBUG FinancialsStep] Effect 3 - Calling onFormDataChange.');
      onFormDataChange(newFinancialsData);
      lastSentDataRef.current = newFinancialsDataString;
    } else {
      // console.log('[DEBUG FinancialsStep] Effect 3 - Skipping onFormDataChange.');
    }
  }, [data2024, data2025, data2026, ytdMonth, skip2024, skip2026, onFormDataChange]);


  const runValidation = useCallback(() => {
    // console.log('[DEBUG FinancialsStep] Running validation via runValidation...');
    const isValid = validateForm(); // This now sets fieldErrors internally

    // Show toast only if validation fails
    if (!isValid) {
      setShowErrors(true); // show errors on failed validation
      showToast('Please fill all required fields marked in red.');

      // --- Redirect to first error field ---
      // Find first year with error
      const yearOrder: Array<'2024' | '2025' | '2026'> = ['2024', '2025', '2026'];
      let found = false;
      for (const year of yearOrder) {
        const errors = fieldErrors[year];
        if (errors && Object.keys(errors).length > 0 && !found) {
          setActiveTab(year);
          // Find first field with error
          let firstField = Object.keys(errors)[0];
          let fieldId = year + '-' + firstField;
          // Special case for ytdMonth (for 2026)
          if (firstField === 'ytdMonth') {
            fieldId = year + '-ytd-month';
          }
          setTimeout(() => {
            const el = document.getElementById(fieldId);
            if (el) el.focus();
          }, 100);
          found = true;
        }
      }
    } else {
      // Clear errors visually if validation passes (optional, but good UX)
      setFieldErrors({ '2024': {}, '2025': {}, '2026': {} });
    }

    // isFormValid prop might not be needed anymore if parent relies solely on ref.validate()
    isFormValid?.(isValid);

    return isValid;
  }, [validateForm, showToast, isFormValid, fieldErrors]); // Dependencies

  useImperativeHandle(ref, () => ({
    validate: runValidation
  }));

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <section className="rounded-[1.5rem] border border-slate-200 bg-white/95 p-5 shadow-[0_16px_35px_-24px_rgba(15,23,42,0.3)]">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Step 2</div>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Business Financials & Add Backs</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Enter the business numbers from your income statements first. If a tax return is the cleanest source for a full year, that is okay too. If a line item is missing or not separately tracked, use `$0` and keep moving.
          </p>
        </section>

        <Card className="w-full border-slate-200 shadow-[0_16px_35px_-24px_rgba(15,23,42,0.3)]">
          <CardContent className="p-4 sm:p-6">
            <div id="financials-step-top" className="mb-5">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Financial History</div>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">Revenue, expenses, and add-backs</h2>
              <p className="mt-1 text-sm text-slate-600">
                These numbers are used to calculate your business cash flow and evaluate how strong it looks to a lender.
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={(val)=>{ setActiveTab(val); setShowErrors(false); }} className="w-full">
            <TabsList className="mb-5 flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
  <TabsTrigger
    value="2024"
    className={cn(
      'relative flex items-center justify-center rounded-full border px-4 py-2 text-sm font-bold transition-all duration-200 focus:outline-none',
      activeTab === '2024'
        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400',
      'min-w-[110px]'
    )}
  >
    2024
    {(skip2024 || Object.keys(fieldErrors['2024']).length === 0) && (
      <span className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full px-2 py-0.5 text-xs font-bold shadow">✓</span>
    )}
  </TabsTrigger>
  <TabsTrigger
    value="2025"
    className={cn(
      'relative flex items-center justify-center rounded-full border px-4 py-2 text-sm font-bold transition-all duration-200 focus:outline-none',
      activeTab === '2025'
        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400',
      'min-w-[110px]'
    )}
  >
    2025
    {Object.keys(fieldErrors['2025']).length === 0 && (
      <span className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full px-2 py-0.5 text-xs font-bold shadow">✓</span>
    )}
  </TabsTrigger>
  <TabsTrigger
    value="2026"
    className={cn(
      'relative flex items-center justify-center rounded-full border px-4 py-2 text-sm font-bold transition-all duration-200 focus:outline-none',
      activeTab === '2026'
        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400',
      'min-w-[130px]'
    )}
  >
    2026 YTD
    {Object.keys(fieldErrors['2026']).length === 0 && (
      <span className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full px-2 py-0.5 text-xs font-bold shadow">✓</span>
    )}
  </TabsTrigger>
</TabsList>

            <TabsContent value="2024" className='pt-2'>
              <div className="mb-4 flex items-center space-x-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
                <Checkbox 
                  id="skip2024"
                  checked={skip2024}
                  onCheckedChange={() => setSkip2024(!skip2024)}
                />
                <label
                  htmlFor="skip2024"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Skip 2024 Financials
                </label>
                <Tooltip>
                  <TooltipTrigger asChild>
                     <Info className="h-4 w-4 text-gray-500 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-gray-800 text-white p-2 rounded">
                    <p className="text-xs">
                      Check this if you do not have a 2024 income statement or 2024 business tax return available. That is okay.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <FinancialInputs 
                year="2024" 
                data={data2024} 
                setData={setData2024}
                ytdMonth={ytdMonth} 
                setYtdMonth={() => {}} // Pass dummy function
                availableYtdMonths={availableYtdMonths}
                defaultYtdMonthLabel={defaultYtdMonthLabel}
                skip={skip2024}
                errors={fieldErrors['2024']}
                showErrors={showErrors}
              />
            </TabsContent>

            <TabsContent value="2025" className='pt-2'>
              <FinancialInputs 
                year="2025" 
                data={data2025} 
                setData={setData2025}
                skip={false}
                ytdMonth={ytdMonth} // Doesn't need ytdMonth or setYtdMonth
                setYtdMonth={() => {}} // Pass dummy function
                availableYtdMonths={availableYtdMonths}
                defaultYtdMonthLabel={defaultYtdMonthLabel}
                errors={fieldErrors['2025']}
                showErrors={showErrors}
              />
            </TabsContent>

            <TabsContent value="2026" className='pt-2'>
              <div className="mb-4 flex items-center space-x-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
                 <Checkbox 
                  id="skip2026"
                  checked={skip2026}
                  onCheckedChange={() => setSkip2026(!skip2026)}
                />
                <label
                  htmlFor="skip2026"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Skip 2026 Year-to-Date Financials
                </label>
                <Tooltip>
                  <TooltipTrigger asChild>
                     <Info className="h-4 w-4 text-gray-500 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-gray-800 text-white p-2 rounded">
                    <p className="text-xs">
                      Check this if you do not have a 2026 year-to-date income statement yet. That is okay.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <FinancialInputs 
                year="2026" 
                data={data2026} 
                setData={setData2026}
                skip={skip2026}
                ytdMonth={ytdMonth}
                setYtdMonth={setYtdMonth}
                availableYtdMonths={availableYtdMonths}
                defaultYtdMonthLabel={defaultYtdMonthLabel}
                errors={fieldErrors['2026']}
                showErrors={showErrors}
              />
            </TabsContent>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {activeTab === '2024' && (
                <Button
                  variant="default"
                  className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  onClick={() => {
                    setActiveTab('2025');
                    document.getElementById('financials-step-top')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  aria-label="Go to 2025"
                >
                  Next: 2025
                  <span className="ml-2"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg></span>
                </Button>
              )}
              {activeTab === '2025' && (
                <>
                  <Button
                    variant="secondary"
                    className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setActiveTab('2024');
                      document.getElementById('financials-step-top')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    aria-label="Go back to 2024"
                  >
                    <span className="mr-2"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg></span>
                    Back: 2024
                  </Button>
                  <Button
                    variant="default"
                    className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    onClick={() => {
                      setActiveTab('2026');
                      document.getElementById('financials-step-top')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    aria-label="Go to 2026 YTD"
                  >
                    Next: 2026 YTD
                    <span className="ml-2"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg></span>
                  </Button>
                </>
              )}
              {activeTab === '2026' && (
                <Button
                  variant="secondary"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setActiveTab('2025');
                    document.getElementById('financials-step-top')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  aria-label="Go back to 2025"
                >
                  <span className="mr-2"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg></span>
                  Back: 2025
                </Button>
              )}
            </div>
          </Tabs>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
});

FinancialsStep.displayName = 'FinancialsStep'; 

export default memo(FinancialsStep);
