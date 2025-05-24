'use client';

import { convertToNumeric, unformatCurrency } from './FinancialsUtils';
import { 
  useState, 
  useEffect, 
  memo, 
  useCallback, 
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
  CardHeader,
  CardTitle,
  CardDescription, // Add CardDescription import
} from '@/app/(components)/ui/card';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';
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
  year2023: { input: FullFinancialData; summary: NumericFinancialData; skip?: boolean };
  year2024: { input: FullFinancialData; summary: NumericFinancialData };
  year2025YTD: { input: FullFinancialData; summary: NumericFinancialData; ytdMonth?: string; skip?: boolean };
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
  skip: boolean; 
  errors: FinancialErrorData & { ytdMonth?: boolean }; // Add errors prop
  showErrors: boolean; // new flag to control when to display errors
}

interface FinancialFieldInfo {
  shortDescription: string;
  whereToFind: string;
}

type FinancialErrorData = {
  [K in keyof FullFinancialData]?: boolean; // Optional boolean flags for each field
};

type FieldErrors = {
  '2023': FinancialErrorData;
  '2024': FinancialErrorData;
  '2025': FinancialErrorData & { ytdMonth?: boolean }; // Add ytdMonth error flag
};

const financialFieldsInfo: Record<keyof FullFinancialData, FinancialFieldInfo> = {
  revenue: {
    shortDescription: 'Total income from sales or services before any costs are deducted.',
    whereToFind: 'Income statement or sales reports.'
  },
  cogs: {
    shortDescription: 'Direct costs of producing goods or services sold.',
    whereToFind: 'Income statement, usually listed as "Cost of Goods Sold".'
  },
  operatingExpenses: {
    shortDescription: 'Day-to-day expenses required to run your business, excluding COGS.',
    whereToFind: 'Income statement, typically below gross profit.'
  },
  nonRecurringIncome: {
    shortDescription: `One-time or unusual income not part of your regular operations.\nExamples:\n• COVID relief grants\n• Insurance payouts\n• Forgiven debt\n• One-off asset sales\n• Legal settlements`,
    whereToFind: 'Notes in your financial statements or a separate line in your income statement.'
  },
  nonRecurringExpenses: {
    shortDescription: `One-time or unexpected costs outside your normal business activities.\nExamples:\n• Equipment repair after damage\n• Lawsuit settlement\n• Severance packages\n• Disaster-related cleanup`,
    whereToFind: 'Notes in your financial statements or a separate line in your income statement.'
  },
  depreciation: {
    shortDescription: 'Annual reduction in value of your business assets (e.g., equipment, vehicles).',
    whereToFind: 'Income statement or tax documents.'
  },
  amortization: {
    shortDescription: 'Annual write-off of intangible assets (e.g., patents, goodwill).',
    whereToFind: 'Income statement or tax documents.'
  },
  interest: {
    shortDescription: 'Total interest expenses paid on business debt for the year.',
    whereToFind: 'Income statement, usually listed as "Interest Expense".'
  },
  taxes: {
    shortDescription: 'Total income taxes paid or accrued for the year.',
    whereToFind: 'Income statement, usually listed as "Income Tax Expense".'
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



const FinancialInputs = memo(({ 
  year, 
  data, 
  setData,
  ytdMonth,
  setYtdMonth,
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
    <div className="border rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold mb-4">{year}{year === '2025' ? ' YTD' : ''}</h3>
      {year === '2025' && (
        <div className="space-y-2 mb-4">
          <Label htmlFor={`${year}-ytd-month`} className="mb-1 block text-sm font-medium text-gray-700">YTD Month</Label>
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
            <option value="" disabled>Select month...</option>
            <option value="01">January</option>
            <option value="02">February</option>
            <option value="03">March</option>
            <option value="04">April</option>
            <option value="05">May</option>
            <option value="06">June</option>
            <option value="07">July</option>
            <option value="08">August</option>
            <option value="09">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
          {showErrors && errors.ytdMonth && (
            <div className="text-xs text-red-500 mt-1">YTD Month is required for {year}.</div>
          )}
        </div>
      )}
      <div className="space-y-6">
        {[
          'revenue',
          'cogs',
          'operatingExpenses',
          'nonRecurringIncome',
          'nonRecurringExpenses',
          'depreciation',
          'amortization',
          'interest', // NEW
          'taxes'     // NEW
        ].map((key) => (
          <div key={`${year}-${key}`} className="grid gap-3 pb-4 border-b border-gray-100 last:border-0">
            <div className="space-y-1">
              <Label htmlFor={`${year}-${key}`} className="text-base font-medium">
                {fieldTitles[key as keyof FullFinancialData]}
              </Label>
              {(() => {
                const desc = financialFieldsInfo[key as keyof FullFinancialData].shortDescription;
                if (
                  key === 'nonRecurringIncome' ||
                  key === 'nonRecurringExpenses' ||
                  key === 'interest' ||
                  key === 'taxes'
                ) {
                  const [main, ...rest] = desc.split('\n');
                  return (
                    <>
                      <p className="text-sm text-gray-600">{main}</p>
                      {rest.length > 0 && (
                        <ul className="list-disc pl-5 mt-1 text-sm text-gray-600">
                          {rest.filter(line => line.trim() && line.trim() !== 'Examples:').map((line, idx) => (
                            <li key={idx}>{line.replace(/^•\s*/, '')}</li>
                          ))}
                        </ul>
                      )}
                    </>
                  );
                }
                return <p className="text-sm text-gray-600">{desc}</p>;
              })()}
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id={`${year}-${key}`}
                  value={formatCurrency(data[key as keyof FullFinancialData] ?? '')}
                  onChange={e => handleChange(key as keyof FullFinancialData, e.target.value)}
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 0 if none"
                  className={cn(
                    "font-mono pl-3 placeholder:font-sans",
                    showErrors && errors[key as keyof FullFinancialData] && "border-red-500 focus:ring-red-500"
                  )}
                  disabled={skip}
                />
                {showErrors && errors[key as keyof FullFinancialData] && (
                  <div className="text-xs text-red-500 mt-1">
                    {fieldTitles[key as keyof FullFinancialData]} is required for {year}.
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Where to find: {financialFieldsInfo[key as keyof FullFinancialData].whereToFind}
              </p>
            </div>
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

  const [activeTab, setActiveTab] = useState('2023');
  const [ytdMonth, setYtdMonth] = useState<string>(''); 

  const [internalIsValid, setInternalIsValid] = useState(false);

  const lastSentDataRef = useRef<string | null>(null);

  const [data2023, setData2023] = useState<FullFinancialData>(createEmptyFinancialData);
  const [data2024, setData2024] = useState<FullFinancialData>(createEmptyFinancialData);
  const [data2025, setData2025] = useState<FullFinancialData>(createEmptyFinancialData);

  const [skip2023, setSkip2023] = useState<boolean>(() => {
    // Only set true if initialData explicitly indicates skipping
    if (initialData && initialData.year2023) {
      const is2023Skipped = Object.values(initialData.year2023.summary || {}).every(val => val === 0 || val === undefined || val === null);
      return is2023Skipped;
    }
    return false;
  });
  const [skip2025, setSkip2025] = useState<boolean>(() => {
    if (initialData && initialData.year2025YTD) {
      const is2025Skipped = Object.values(initialData.year2025YTD.summary || {}).every(val => val === 0 || val === undefined || val === null) && !initialData.year2025YTD.ytdMonth;
      return is2025Skipped;
    }
    return false;
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    '2023': {},
    '2024': {},
    '2025': {},
  });

  const [showErrors, setShowErrors] = useState<boolean>(false);

  const lastNonSkipped2023 = useRef<FullFinancialData | null>(null);
  const lastNonSkipped2025 = useRef<FullFinancialData | null>(null);

  useEffect(() => {
    // console.log("[DEBUG FinancialsStep] Mount effect running.");
    if (initialData) {
        setData2023(initialData.year2023?.input ?? createEmptyFinancialData());
        setData2024(initialData.year2024?.input ?? createEmptyFinancialData());
        setData2025(initialData.year2025YTD?.input ?? createEmptyFinancialData());
        setYtdMonth(initialData.year2025YTD?.ytdMonth ?? '');
        setSkip2023(initialData.year2023?.skip === true);
        setSkip2025(initialData.year2025YTD?.skip === true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (skip2023) {
      lastNonSkipped2023.current = data2023;
      setData2023(prev => {
        const zeroed: FullFinancialData = { ...createEmptyFinancialData() };
        Object.keys(zeroed).forEach(key => zeroed[key as keyof FullFinancialData] = '0');
        return zeroed;
      });
    } else if (lastNonSkipped2023.current) {
      setData2023(lastNonSkipped2023.current);
    }
  }, [skip2023]);

  useEffect(() => {
    if (skip2025) {
      lastNonSkipped2025.current = data2025;
      setData2025(prev => {
        const zeroed: FullFinancialData = { ...createEmptyFinancialData() };
        Object.keys(zeroed).forEach(key => zeroed[key as keyof FullFinancialData] = '0');
        return zeroed;
      });
      setYtdMonth('');
    } else if (lastNonSkipped2025.current) {
      setData2025(lastNonSkipped2025.current);
    }
  }, [skip2025]);

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

    // Special check for 2025 YTD month
    if (year === '2025' && (!currentYtdMonth || currentYtdMonth === '')) {
      errors.ytdMonth = true;
      yearIsValid = false;
    }

    // console.log(`[DEBUG FinancialsStep] validateYear(${year}) - Skip: ${skip}, Valid: ${yearIsValid}, Errors:`, errors);
    return errors; // Return the errors object
  }, []); // No dependencies needed as it operates on arguments

  const validateForm = useCallback(() => {
    // console.log('[DEBUG FinancialsStep] validateForm running...');
    const errors2023 = validateYear(data2023, '2023', ytdMonth, skip2023);
    const errors2024 = validateYear(data2024, '2024', ytdMonth, false); // 2024 cannot be skipped
    const errors2025 = validateYear(data2025, '2025', ytdMonth, skip2025);

    const newFieldErrors: FieldErrors = {
      '2023': errors2023,
      '2024': errors2024,
      '2025': errors2025,
    };

    setFieldErrors(newFieldErrors); // Update the error state

    // Check if any error object has keys (meaning there's at least one error)
    const isOverallValid =
      Object.keys(errors2023).length === 0 &&
      Object.keys(errors2024).length === 0 &&
      Object.keys(errors2025).length === 0;

    // console.log('[DEBUG FinancialsStep] validateForm - Overall Validity:', isOverallValid, ' Errors:', newFieldErrors);
    return isOverallValid;
  }, [data2023, data2024, data2025, ytdMonth, skip2023, skip2025, validateYear]); // Add dependencies

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
      year2023: { input: data2023, summary: convertToNumeric(data2023), skip: skip2023 },
      year2024: { input: data2024, summary: convertToNumeric(data2024) },
      year2025YTD: { input: data2025, summary: convertToNumeric(data2025), ytdMonth: ytdMonth, skip: skip2025 },
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
  }, [data2023, data2024, data2025, ytdMonth, skip2023, skip2025, onFormDataChange]);


  const runValidation = useCallback(() => {
    // console.log('[DEBUG FinancialsStep] Running validation via runValidation...');
    const isValid = validateForm(); // This now sets fieldErrors internally

    // Show toast only if validation fails
    if (!isValid) {
      setShowErrors(true); // show errors on failed validation
      showToast('Please fill all required fields marked in red.');

      // --- Redirect to first error field ---
      // Find first year with error
      const yearOrder: Array<'2023' | '2024' | '2025'> = ['2023', '2024', '2025'];
      let found = false;
      for (const year of yearOrder) {
        const errors = fieldErrors[year];
        if (errors && Object.keys(errors).length > 0 && !found) {
          setActiveTab(year);
          // Find first field with error
          let firstField = Object.keys(errors)[0];
          let fieldId = year + '-' + firstField;
          // Special case for ytdMonth (for 2025)
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
      setFieldErrors({ '2023': {}, '2024': {}, '2025': {} });
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
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader id="financials-step-top">
          <CardTitle>Step 2: Financials</CardTitle>
          <CardDescription>
            Provide your revenue and expenses for 2023, 2024, and 2025 year-to-date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(val)=>{ setActiveTab(val); setShowErrors(false); }} className="w-full">
            <TabsList className="flex w-full justify-center gap-6 bg-transparent p-0 mb-2">
  <TabsTrigger
    value="2023"
    className={cn(
      'relative flex items-center justify-center px-8 py-1 rounded-full font-bold text-base transition-all duration-200 border-2 focus:outline-none',
      activeTab === '2023'
        ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105 z-10'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400',
      'min-w-[120px]'
    )}
  >
    2023
    {(skip2023 || Object.keys(fieldErrors['2023']).length === 0) && (
      <span className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full px-2 py-0.5 text-xs font-bold shadow">✓</span>
    )}
  </TabsTrigger>
  <TabsTrigger
    value="2024"
    className={cn(
      'relative flex items-center justify-center px-8 py-1 rounded-full font-bold text-base transition-all duration-200 border-2 focus:outline-none',
      activeTab === '2024'
        ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105 z-10'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400',
      'min-w-[120px]'
    )}
  >
    2024
    {Object.keys(fieldErrors['2024']).length === 0 && (
      <span className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full px-2 py-0.5 text-xs font-bold shadow">✓</span>
    )}
  </TabsTrigger>
  <TabsTrigger
    value="2025YTD"
    className={cn(
      'relative flex items-center justify-center px-8 py-1 rounded-full font-bold text-base transition-all duration-200 border-2 focus:outline-none',
      activeTab === '2025YTD'
        ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105 z-10'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400',
      'min-w-[140px]'
    )}
  >
    2025 YTD
    {Object.keys(fieldErrors['2025']).length === 0 && (
      <span className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full px-2 py-0.5 text-xs font-bold shadow">✓</span>
    )}
  </TabsTrigger>
</TabsList>

            <TabsContent value="2023" className='pt-4'>
              <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-md border border-blue-200">
                <Checkbox 
                  id="skip2023"
                  checked={skip2023}
                  onCheckedChange={() => setSkip2023(!skip2023)}
                />
                <label
                  htmlFor="skip2023"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Skip 2023 Financials
                </label>
                <Tooltip>
                  <TooltipTrigger asChild>
                     <Info className="h-4 w-4 text-gray-500 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-gray-800 text-white p-2 rounded">
                    <p className="text-xs">
                      Check this box if you do not have financial records for 2023. 
                      While banks typically prefer to see the last two full years plus the current year-to-date (YTD), 
                      skipping is allowed if the data is unavailable.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <FinancialInputs 
                year="2023" 
                data={data2023} 
                setData={setData2023}
                ytdMonth={ytdMonth} 
                setYtdMonth={() => {}} // Pass dummy function
                skip={skip2023}
                errors={fieldErrors['2023']} // Pass down errors for 2023
                showErrors={showErrors}
              />
            </TabsContent>

            <TabsContent value="2024" className='pt-4'>
              <FinancialInputs 
                year="2024" 
                data={data2024} 
                setData={setData2024}
                skip={false} // 2024 cannot be skipped
                ytdMonth={ytdMonth} // Doesn't need ytdMonth or setYtdMonth
                setYtdMonth={() => {}} // Pass dummy function
                errors={fieldErrors['2024']} // Pass down errors for 2024
                showErrors={showErrors}
              />
            </TabsContent>

            <TabsContent value="2025" className='pt-4'>
              <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-md border border-blue-200">
                 <Checkbox 
                  id="skip2025"
                  checked={skip2025}
                  onCheckedChange={() => setSkip2025(!skip2025)}
                />
                <label
                  htmlFor="skip2025"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Skip 2025 Year-to-Date Financials
                </label>
                <Tooltip>
                  <TooltipTrigger asChild>
                     <Info className="h-4 w-4 text-gray-500 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-gray-800 text-white p-2 rounded">
                    <p className="text-xs">
                      Check this box if you do not have financial records for the current year-to-date (2025 YTD). 
                      While banks typically prefer to see the last two full years plus the current YTD, 
                      skipping is allowed if the data is unavailable.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <FinancialInputs 
                year="2025" 
                data={data2025} 
                setData={setData2025}
                skip={skip2025}
                ytdMonth={ytdMonth} // Needs ytdMonth
                setYtdMonth={setYtdMonth} // Needs setYtdMonth
                errors={fieldErrors['2025']} // Pass down errors for 2025 (including ytdMonth potentially)
                showErrors={showErrors}
              />
            </TabsContent>

            {/* Year Navigation Buttons (Bottom, above year tabs) */}
            <div className="flex justify-center items-center gap-4 mb-8 mt-4">
              {activeTab === '2023' && (
                <Button
                  variant="default"
                  className="px-6 py-2 rounded-lg text-base font-semibold shadow-md transition hover:bg-blue-600 focus:ring-2 focus:ring-blue-400"
                  onClick={() => {
                    setActiveTab('2024');
                    document.getElementById('financials-step-top')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  aria-label="Go to 2024"
                >
                  Next: 2024
                  <span className="ml-2"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg></span>
                </Button>
              )}
              {activeTab === '2024' && (
                <>
                  <Button
                    variant="secondary"
                    className="px-6 py-2 rounded-lg text-base font-semibold shadow-md transition hover:bg-blue-100 focus:ring-2 focus:ring-blue-400"
                    onClick={() => {
                      setActiveTab('2023');
                      document.getElementById('financials-step-top')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    aria-label="Go back to 2023"
                  >
                    <span className="mr-2"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg></span>
                    Back: 2023
                  </Button>
                  <Button
                    variant="default"
                    className="px-6 py-2 rounded-lg text-base font-semibold shadow-md transition hover:bg-blue-600 focus:ring-2 focus:ring-blue-400"
                    onClick={() => {
                      setActiveTab('2025');
                      document.getElementById('financials-step-top')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    aria-label="Go to 2025 YTD"
                  >
                    Next: 2025 YTD
                    <span className="ml-2"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg></span>
                  </Button>
                </>
              )}
              {activeTab === '2025' && (
                <Button
                  variant="secondary"
                  className="px-6 py-2 rounded-lg text-base font-semibold shadow-md transition hover:bg-blue-100 focus:ring-2 focus:ring-blue-400"
                  onClick={() => {
                    setActiveTab('2024');
                    document.getElementById('financials-step-top')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  aria-label="Go back to 2024"
                >
                  <span className="mr-2"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg></span>
                  Back: 2024
                </Button>
              )}
            </div>

            <TabsList className="grid w-full grid-cols-3 mt-6"> 
              <TabsTrigger value="2023">
                2023 
                {(skip2023 || Object.keys(fieldErrors['2023']).length === 0) && (
                  <span className='ml-2 text-green-600'>✓</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="2024">
                2024 
                {Object.keys(fieldErrors['2024']).length === 0 && (
                  <span className='ml-2 text-green-600'>✓</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="2025">
                2025 YTD 
                {(skip2025 || Object.keys(fieldErrors['2025']).length === 0) && (
                  <span className='ml-2 text-green-600'>✓</span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
});

FinancialsStep.displayName = 'FinancialsStep'; 

export default memo(FinancialsStep);
