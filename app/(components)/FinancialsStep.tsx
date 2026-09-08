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
  Card,
  CardContent,
} from '@/app/(components)/ui/card';
import { Input } from '@/app/(components)/ui/input';
import { Checkbox } from "./ui/checkbox"; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'; 
import { Info } from 'lucide-react'; 
import { useToast } from '@/app/(components)/shared/useToast'; 
import { cn } from "@/lib/utils";

// Full data for each year, including all fields for input persistence
export interface FullFinancialData {
  revenue: string;
  cogs: string;
  operatingExpenses: string;
  otherIncome: string; // NEW FIELD - Other Income from CPA statements
  interestIncome: string; // NEW FIELD - Interest Income from CPA statements
  nonRecurringIncome: string; // True non-recurring income (one-time events)
  nonRecurringExpenses: string; // True non-recurring expenses (one-time events)
  depreciation: string;
  amortization: string;
  interest: string; // Interest Expense
  taxes: string;    // Income Tax Expense
  // netIncome removed: it is a calculated field only, not user input
}

// --- Export NumericFinancialData type for use in ReviewSubmitStep ---
export type NumericFinancialData = {
  revenue: number;
  expenses: number;
  netIncome: number;
  ebitda: number;
  grossProfit: number;
  operatingIncome: number; // NEW FIELD - Operating Income
  interest: number; // Interest Expense
  taxes: number;    // Income Tax Expense
  cogs: number;
  operatingExpenses: number;
  otherIncome: number; // NEW FIELD - Other Income
  interestIncome: number; // NEW FIELD - Interest Income
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
  data2024: FullFinancialData;
  data2025: FullFinancialData;
  data2026: FullFinancialData;
  setData2024: React.Dispatch<React.SetStateAction<FullFinancialData>>;
  setData2025: React.Dispatch<React.SetStateAction<FullFinancialData>>;
  setData2026: React.Dispatch<React.SetStateAction<FullFinancialData>>;
  ytdMonth: string;
  setYtdMonth: (month: string) => void;
  availableYtdMonths?: ReadonlyArray<{ value: string; label: string }>;
  skip2024: boolean;
  skip2026: boolean;
  errors: FieldErrors;
  showErrors: boolean;
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
  otherIncome: {
    shortDescription: 'Other income from normal business operations (not one-time events).',
    whereToFind: 'Income statement, usually listed as "Other Income" or similar.'
  },
  interestIncome: {
    shortDescription: 'Interest income earned on bank accounts, investments, or loans to others.',
    whereToFind: 'Income statement, usually listed as "Interest Income" or similar.'
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
  otherIncome: "Other Income",
  interestIncome: "Interest Income",
  nonRecurringIncome: "Non-Recurring Income",
  nonRecurringExpenses: "Non-Recurring Expenses",
  depreciation: "Depreciation",
  amortization: "Amortization",
  interest: "Interest Expense",
  taxes: "Income Taxes"
};

const createEmptyFinancialData = (): FullFinancialData => ({
  revenue: '',
  cogs: '',
  operatingExpenses: '',
  otherIncome: '',
  interestIncome: '',
  nonRecurringIncome: '',
  nonRecurringExpenses: '',
  depreciation: '',
  amortization: '',
  interest: '',
  taxes: '',
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

const getFieldExamples = (key: keyof FullFinancialData) =>
  financialFieldsInfo[key].shortDescription
    .split('\n')
    .filter((line) => line.trim().startsWith('•'))
    .map((line) => line.replace(/^•\s*/, '').trim());

const getFieldDescription = (key: keyof FullFinancialData) => {
  const examples = getFieldExamples(key);
  const baseDescription = financialFieldsInfo[key].shortDescription
    .split('\n')
    .filter((line) => !line.trim().startsWith('•'))
    .join(' ')
    .replace(/\s*Examples:\s*$/, '')
    .trim();

  if (examples.length === 0) {
    return baseDescription;
  }

  return `${baseDescription} Examples: ${examples.join(', ')}.`;
};



const FINANCIAL_FIELD_ORDER: Array<keyof FullFinancialData> = [
  'revenue',
  'operatingExpenses',
  'otherIncome',
  'interestIncome',
  'nonRecurringIncome',
  'nonRecurringExpenses',
  'cogs',
  'depreciation',
  'amortization',
  'interest',
  'taxes'
];

const FinancialInputs = memo(({
  data2024,
  data2025,
  data2026,
  setData2024,
  setData2025,
  setData2026,
  ytdMonth,
  setYtdMonth,
  availableYtdMonths = MONTH_OPTIONS,
  skip2024,
  skip2026,
  errors,
  showErrors
}: FinancialInputsProps) => {
  const handleChange = useCallback((
    setData: React.Dispatch<React.SetStateAction<FullFinancialData>>,
    key: keyof FullFinancialData,
    input: string
  ) => {
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
  }, []);

  const renderInput = (
    year: '2024' | '2025' | '2026',
    key: keyof FullFinancialData,
    data: FullFinancialData,
    setData: React.Dispatch<React.SetStateAction<FullFinancialData>>,
    skip: boolean
  ) => (
    <div className="space-y-1">
      <Input
        id={`${year}-${key}`}
        value={formatCurrency(data[key] ?? '')}
        onChange={e => handleChange(setData, key, e.target.value)}
        type="text"
        inputMode="numeric"
        placeholder="Enter $0 if none"
        className={cn(
          "h-10 w-[112px] font-mono placeholder:font-sans",
          showErrors && errors[year][key] && "border-red-500 focus:ring-red-500"
        )}
        disabled={skip}
      />
      {showErrors && errors[year][key] && (
        <p className="text-xs font-medium text-red-600">Required for {year}.</p>
      )}
    </div>
  );

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4 sm:p-5">
        <p className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
          If a line is not shown separately on your statement, or it does not apply to your business, enter `$0`. That is completely fine.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] table-fixed border-separate border-spacing-0">
          <colgroup>
            <col />
            <col className="w-[128px]" />
            <col className="w-[128px]" />
            <col className="w-[176px]" />
          </colgroup>
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              <th className="sticky left-0 z-10 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">Financial Line Item</th>
              <th className="border-b border-slate-200 px-2 py-4">2024</th>
              <th className="border-b border-slate-200 px-2 py-4">2025</th>
              <th className="border-b border-slate-200 px-2 py-4">
                <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
                  <span>2026 YTD</span>
                  <select
                    id="2026-ytd-month"
                    value={ytdMonth}
                    onChange={(e) => setYtdMonth(e.target.value)}
                    className={cn(
                      "h-8 w-[82px] rounded-md border border-input bg-background px-2 py-1 text-xs font-semibold normal-case tracking-normal text-slate-700 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                      showErrors && errors['2026'].ytdMonth && "border-red-500 focus:ring-red-500"
                    )}
                    required
                    disabled={skip2026}
                    aria-label="Last full month included for 2026 YTD"
                  >
                    <option value="" disabled>Month</option>
                    {availableYtdMonths.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
                {showErrors && errors['2026'].ytdMonth && (
                  <p className="mt-1 text-xs font-medium normal-case tracking-normal text-red-600">Required.</p>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {FINANCIAL_FIELD_ORDER.map((key) => (
              <tr key={key} className="align-top">
                <td className="sticky left-0 z-10 border-b border-slate-200 bg-white px-4 py-5 sm:px-5">
                  <div className="w-full">
                    <div className="text-sm font-bold text-slate-900">{fieldTitles[key]}</div>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {getFieldDescription(key)}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      <span className="font-semibold text-slate-600">Where to find it:</span> {financialFieldsInfo[key].whereToFind}
                    </p>
                    {financialFieldsInfo[key].additionalNote && (
                      <p className="mt-2 text-xs leading-5 text-slate-500">{financialFieldsInfo[key].additionalNote}</p>
                    )}
                  </div>
                </td>
                <td className="border-b border-slate-200 px-2 py-5">
                  {renderInput('2024', key, data2024, setData2024, skip2024)}
                </td>
                <td className="border-b border-slate-200 px-2 py-5">
                  {renderInput('2025', key, data2025, setData2025, false)}
                </td>
                <td className="border-b border-slate-200 px-2 py-5">
                  {renderInput('2026', key, data2026, setData2026, skip2026)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

FinancialInputs.displayName = 'FinancialInputs';

const FinancialsStep = forwardRef<FinancialsStepHandle, FinancialsStepProps>((
  {
    isFormValid, 
    onFormDataChange,
    initialData
  },
  ref 
) => {
  // console.log(`[DEBUG FinancialsStep] Rendering.`);

  const { showToast } = useToast(); 

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
      setData2024(() => {
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
      setData2026(() => {
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

  const validateYear = useCallback(( 
    data: FullFinancialData, 
    year: string, 
    currentYtdMonth: string, 
    skip: boolean
  ): FinancialErrorData & { ytdMonth?: boolean } => { // Return type updated
    if (skip) return {}; // No errors if skipped

    const errors: FinancialErrorData & { ytdMonth?: boolean } = {};
    FINANCIAL_FIELD_ORDER.forEach(key => {
      if (!data[key] || data[key].trim() === '' || data[key].trim() === '$') { 
        errors[key] = true;
      }
    });

    // Special check for 2026 YTD month
    if (year === '2026' && (!currentYtdMonth || currentYtdMonth === '')) {
      errors.ytdMonth = true;
    }

    // console.log(`[DEBUG FinancialsStep] validateYear(${year}) - Skip: ${skip}, Errors:`, errors);
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
    const errors2024 = validateYear(data2024, '2024', ytdMonth, skip2024);
    const errors2025 = validateYear(data2025, '2025', ytdMonth, false);
    const errors2026 = validateYear(data2026, '2026', ytdMonth, skip2026);
    const nextFieldErrors: FieldErrors = {
      '2024': errors2024,
      '2025': errors2025,
      '2026': errors2026,
    };
    const isValid =
      Object.keys(errors2024).length === 0 &&
      Object.keys(errors2025).length === 0 &&
      Object.keys(errors2026).length === 0;

    setFieldErrors(nextFieldErrors);

    // Show toast only if validation fails
    if (!isValid) {
      setShowErrors(true); // show errors on failed validation
      showToast('Please complete the required field highlighted in red.');

      const yearOrder: Array<'2024' | '2025' | '2026'> = ['2024', '2025', '2026'];
      for (const year of yearOrder) {
        const currentErrors = nextFieldErrors[year];
        if (currentErrors && Object.keys(currentErrors).length > 0) {
          const firstField = Object.keys(currentErrors)[0];
          let fieldId = `${year}-${firstField}`;
          if (firstField === 'ytdMonth') {
            fieldId = '2026-ytd-month';
          }
          setTimeout(() => {
            const el = document.getElementById(fieldId);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.focus({ preventScroll: true });
            }
          }, 100);
          break;
        }
      }
    } else {
      // Clear errors visually if validation passes (optional, but good UX)
      setFieldErrors({ '2024': {}, '2025': {}, '2026': {} });
    }

    // isFormValid prop might not be needed anymore if parent relies solely on ref.validate()
    isFormValid?.(isValid);

    return isValid;
  }, [data2024, data2025, data2026, isFormValid, showToast, skip2024, skip2026, validateYear, ytdMonth]); // Dependencies

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

            <div className="mb-5 grid gap-3 md:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <Checkbox 
                  id="skip2024"
                  checked={skip2024}
                  onCheckedChange={() => setSkip2024(!skip2024)}
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <label htmlFor="skip2024" className="text-sm font-bold text-blue-950">
                      Skip 2024 Financials
                    </label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 cursor-pointer text-blue-700" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-gray-800 text-white p-2 rounded">
                        <p className="text-xs">
                          Check this if you do not have a 2024 income statement or 2024 business tax return available. That is okay.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-blue-800">
                    When selected, the 2024 column is disabled and saved as `$0` values.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <Checkbox 
                  id="skip2026"
                  checked={skip2026}
                  onCheckedChange={() => setSkip2026(!skip2026)}
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <label htmlFor="skip2026" className="text-sm font-bold text-blue-950">
                      Skip 2026 Year-to-Date Financials
                    </label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 cursor-pointer text-blue-700" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-gray-800 text-white p-2 rounded">
                        <p className="text-xs">
                          Check this if you do not have a 2026 year-to-date income statement yet. That is okay.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-blue-800">
                    When selected, the 2026 YTD column and month selector are disabled.
                  </p>
                </div>
              </div>
            </div>

            <FinancialInputs
              data2024={data2024}
              data2025={data2025}
              data2026={data2026}
              setData2024={setData2024}
              setData2025={setData2025}
              setData2026={setData2026}
              ytdMonth={ytdMonth}
              setYtdMonth={setYtdMonth}
              availableYtdMonths={availableYtdMonths}
              skip2024={skip2024}
              skip2026={skip2026}
              errors={fieldErrors}
              showErrors={showErrors}
            />
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
});

FinancialsStep.displayName = 'FinancialsStep'; 

export default memo(FinancialsStep);
