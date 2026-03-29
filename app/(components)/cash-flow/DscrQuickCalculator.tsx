"use client";

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Briefcase,
  Building2,
  Calculator,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Handshake,
  Info,
  Landmark,
  Package,
  PencilLine,
  RefreshCcw,
  ShieldCheck,
  TrendingUp,
  Truck,
  Wallet,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  calculateMonthlyLoanPayment,
  calculatePrincipalFromPaymentCapacity,
  DSCR_BENCHMARK,
  DSCR_GAUGE_MAX,
  getDscrBand,
  loanPurposes,
  type DscrBandDefinition,
  type LoanPurpose,
} from '@/lib/financial/dscr';
import {
  trackCalculatorInteraction,
  trackCalculatorResult,
  trackCtaClick,
} from '@/lib/analytics';
import { Button } from '@/app/(components)/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/app/(components)/ui/select';
import { useRouter } from 'next/navigation';

export interface DscrFormValues {
  monthlyNetIncome: number;
  realEstateDebt: number;
  creditCards: number;
  vehicleEquipment: number;
  linesOfCredit: number;
  otherDebt: number;
}

interface DscrQuickCalculatorProps {
  initialValues?: DscrFormValues;
  onValuesChange?: (values: DscrFormValues) => void;
  embedded?: boolean;
  compactMobileLayout?: boolean;
  analyticsPageTemplate?: string;
  analyticsPlacement?: string;
}

const formatCurrency = (value: number): string => {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

const parseCurrencyInput = (value: string): number => {
  return parseInt(value.replace(/[$,]/g, '')) || 0;
};

const formatRatioDollarAmount = (value: number): string => {
  return `$${value.toFixed(2)}`;
};

const getMeaningHeadline = (bandId: DscrBandDefinition['id']): string => {
  switch (bandId) {
    case 'needs-improvement':
      return 'This payment looks too heavy right now.';
    case 'very-tight':
      return 'This payment is only barely covered.';
    case 'borderline':
      return 'This payment looks close, but still tight.';
    case 'solid-start':
      return 'This payment looks reasonably supportable.';
    case 'strong-position':
      return 'This payment looks comfortably supportable.';
    case 'excellent-cushion':
      return 'This payment looks very comfortably supportable.';
  }
};

const loanPurposeMeta: Record<string, { icon: LucideIcon; eyebrow: string }> = {
  'Working Capital': { icon: Briefcase, eyebrow: 'Operations' },
  'Equipment Purchase': { icon: Wrench, eyebrow: 'Assets' },
  'Vehicle Purchase': { icon: Truck, eyebrow: 'Fleet' },
  'Inventory Purchase': { icon: Package, eyebrow: 'Stock' },
  'Real Estate Acquisition or Development': { icon: Building2, eyebrow: 'Property' },
  'Business Acquisition': { icon: Handshake, eyebrow: 'Expansion' },
  'Unexpected Expenses': { icon: AlertTriangle, eyebrow: 'Emergency' },
  'Line of Credit': { icon: Wallet, eyebrow: 'Flexible' },
  'Debt Refinance / Consolidation': { icon: RefreshCcw, eyebrow: 'Restructure' },
  'Business Expansion / New Location': { icon: Briefcase, eyebrow: 'Growth' },
  'Bridge Financing': { icon: Clock3, eyebrow: 'Short-Term' },
  Other: { icon: Calculator, eyebrow: 'Custom' },
};

const debtFieldMeta: Array<{
  name: keyof Pick<DscrFormValues, 'realEstateDebt' | 'creditCards' | 'vehicleEquipment' | 'linesOfCredit' | 'otherDebt'>;
  label: string;
  placeholder: string;
  tooltip: string;
  description: string;
  icon: LucideIcon;
  id: string;
}> = [
  {
    name: 'realEstateDebt',
    label: 'Real Estate Debt',
    placeholder: 'e.g. 2,000',
    tooltip: 'Enter the total combined required monthly payments for all business real estate loans.',
    description: 'Enter the total combined required monthly payments for all business real estate loans or mortgages.',
    icon: Landmark,
    id: 'dscr-calc-form-real-estate-debt',
  },
  {
    name: 'creditCards',
    label: 'Credit Cards',
    placeholder: 'e.g. 500',
    tooltip: 'Enter the total combined minimum monthly payments for all business credit cards.',
    description: 'Enter the total combined minimum monthly payments across all business credit cards.',
    icon: CreditCard,
    id: 'dscr-calc-form-credit-cards',
  },
  {
    name: 'vehicleEquipment',
    label: 'Vehicle / Equipment Loans',
    placeholder: 'e.g. 300',
    tooltip: 'Enter the total combined required monthly payments for all vehicle and equipment loans.',
    description: 'Enter the total combined required monthly payments for all vehicle and equipment loans.',
    icon: Truck,
    id: 'dscr-calc-form-vehicle-equipment',
  },
  {
    name: 'linesOfCredit',
    label: 'Lines of Credit',
    placeholder: 'e.g. 400',
    tooltip: 'Enter the total combined required monthly payments for all business lines of credit.',
    description: 'Enter the total combined required monthly payments for all business lines of credit, not the credit limits.',
    icon: Wallet,
    id: 'dscr-calc-form-lines-of-credit',
  },
  {
    name: 'otherDebt',
    label: 'Other Debt',
    placeholder: 'e.g. 250',
    tooltip: 'Enter the total combined required monthly payments for anything else not listed above.',
    description: 'Enter the total combined required monthly payments for any other debt not listed above.',
    icon: FileText,
    id: 'dscr-calc-form-other-debt',
  },
];

const formHighlights = ['Free estimate', 'Fast to complete', 'Lender-focused'];
const commonTermOptions = [12, 24, 36, 48, 60, 120, 180, 240, 300, 360];

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="group relative inline-flex shrink-0">
    <button
      type="button"
      aria-label="More information"
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:border-slate-300 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 sm:h-8 sm:w-8"
    >
      <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
    </button>
    <div className="pointer-events-none absolute right-0 top-10 z-10 w-64 rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-100 opacity-0 shadow-2xl transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 translate-y-1">
      {text}
    </div>
  </div>
);

export const DscrGauge: React.FC<{ value: number }> = ({ value }) => {
  const status = getDscrBand(value).quickStatus;
  const pointerPosition = Math.max(0, Math.min((value / DSCR_GAUGE_MAX) * 100, 100));
  const benchmarkPosition = (DSCR_BENCHMARK / DSCR_GAUGE_MAX) * 100;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">DSCR Score</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className={`text-5xl font-black tracking-[-0.05em] ${status.valueClassName}`}>{value.toFixed(2)}</div>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.badgeClassName}`}>{status.label}</span>
          </div>
        </div>

        <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right sm:block">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Bank Benchmark</p>
          <p className="mt-1 text-lg font-bold text-slate-950">{DSCR_BENCHMARK.toFixed(2)}x</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="relative pt-8">
          <div className="h-4 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            <div className="h-full w-full bg-[linear-gradient(90deg,#ef4444_0%,#f59e0b_50%,#10b981_100%)]" />
          </div>
          <div
            className="absolute top-1 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${benchmarkPosition}%` }}
          >
            <div className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
              {DSCR_BENCHMARK.toFixed(2)}x
            </div>
            <div className="mt-1 h-5 w-px bg-slate-900" />
          </div>
          <div
            className="absolute top-5 flex -translate-x-1/2 flex-col items-center transition-all duration-300"
            style={{ left: `${pointerPosition}%` }}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-4 border-white shadow-lg ${status.panelClassName}`}>
              <div className={`h-2.5 w-2.5 rounded-full ${status.valueClassName.replace('text', 'bg')}`} />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          <span>0.00</span>
          <span>1.00</span>
          <span>{DSCR_BENCHMARK.toFixed(2)} Standard</span>
          <span>{DSCR_GAUGE_MAX.toFixed(2)}+</span>
        </div>
      </div>
    </div>
  );
};

const InputField: React.FC<{
  label: React.ReactNode;
  name: string;
  placeholder: string;
  tooltip: string;
  description: string;
  errorMessage?: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  id?: string;
  icon: LucideIcon;
  compact?: boolean;
  hideDescriptionOnMobile?: boolean;
  optimizeLabelMobile?: boolean;
}> = ({
  label,
  name,
  placeholder,
  tooltip,
  description,
  errorMessage,
  value,
  onChange,
  required,
  id,
  icon: Icon,
  compact = false,
  hideDescriptionOnMobile = false,
  optimizeLabelMobile = false,
}) => {
  const [displayValue, setDisplayValue] = React.useState(value ? value.toLocaleString('en-US') : '');

  React.useEffect(() => {
    setDisplayValue(value ? value.toLocaleString('en-US') : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const numericValue = parseCurrencyInput(rawValue);
    setDisplayValue(rawValue ? numericValue.toLocaleString('en-US') : '');
    onChange({
      ...e,
      target: {
        ...e.target,
        name,
        value: numericValue.toString()
      }
    });
  };

  return (
    <div
      className={`rounded-[20px] border border-slate-200 bg-white shadow-[0_14px_45px_-36px_rgba(15,23,42,0.8)] transition-all duration-200 focus-within:-translate-y-0.5 focus-within:border-slate-900 focus-within:shadow-[0_24px_60px_-40px_rgba(15,23,42,0.75)] ${
        compact ? 'p-2.5 sm:p-3' : 'p-3 sm:p-3.5'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 ${
              compact
                ? optimizeLabelMobile
                  ? 'h-7 w-7 rounded-xl'
                  : 'h-8 w-8'
                : 'h-9 w-9'
            }`}
          >
            <Icon
              className={
                compact
                  ? optimizeLabelMobile
                    ? 'h-3 w-3'
                    : 'h-3.5 w-3.5'
                  : 'h-4 w-4'
              }
            />
          </div>
          <label
            htmlFor={id || name}
            className={`min-w-0 text-pretty font-semibold tracking-[0.01em] text-slate-900 ${
              compact
                ? optimizeLabelMobile
                  ? 'text-[10px] leading-[0.82rem] sm:text-sm sm:leading-5'
                  : 'text-[13px] leading-5 sm:text-sm'
                : 'text-sm leading-5'
            }`}
          >
            {label}
            {required ? <span className="ml-1 text-emerald-600">*</span> : null}
          </label>
        </div>
        <Tooltip text={tooltip} />
      </div>
      <p className={`mt-1.5 text-slate-500 ${compact ? 'text-[11px] leading-4 sm:text-xs sm:leading-4.5' : 'text-xs leading-4.5'} ${hideDescriptionOnMobile ? 'hidden sm:block' : ''}`}>
        {description}
      </p>
      <div className="relative">
        <span className={`pointer-events-none absolute top-1/2 -translate-y-1/2 font-semibold text-slate-400 ${compact ? 'left-3 text-sm' : 'left-4 text-base'}`}>$</span>
        <input
          type="text"
          id={id || name}
          name={name}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          required={required}
          min={0}
          max={10000000}
          className={`mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 font-semibold text-slate-900 shadow-inner shadow-slate-200/40 transition-all duration-200 placeholder:font-medium placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-200 ${
            compact ? 'h-10 pl-7 pr-3 text-sm sm:h-10 sm:pl-8 sm:text-[15px]' : 'h-11 pl-9 pr-4 text-base'
          }`}
          inputMode="numeric"
          pattern="[0-9,]*"
        />
      </div>
      {errorMessage && (
        <p className="mt-2 text-sm font-medium text-rose-600">{errorMessage}</p>
      )}
    </div>
  );
};

const DscrQuickCalculator: React.FC<DscrQuickCalculatorProps> = ({
  initialValues,
  onValuesChange,
  embedded = false,
  compactMobileLayout = false,
  analyticsPageTemplate = 'unknown_page',
  analyticsPlacement = embedded ? 'embedded' : 'standalone',
}) => {
  const [, setError] = React.useState<string>('');
  const router = useRouter();
  const comprehensiveCheckoutPath = '/checkout/cash_flow_analysis';
  
  const [values, setValues] = useState<DscrFormValues>(() => ({
    monthlyNetIncome: 0,
    realEstateDebt: 0,
    creditCards: 0,
    vehicleEquipment: 0,
    linesOfCredit: 0,
    otherDebt: 0,
    ...initialValues
  }));
  const [loanPurpose, setLoanPurpose] = useState<keyof typeof loanPurposes | ''>('');
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [validationError, setValidationError] = useState<{ field: string; message: string } | null>(null);
  const [isEditingAssumptions, setIsEditingAssumptions] = useState(false);
  const resultsRef = React.useRef<HTMLDivElement | null>(null);
  const lastResultSignatureRef = React.useRef<string | null>(null);

  // Use a type-safe array of loan purpose keys for the dropdown
  const loanPurposeKeys = Object.keys(loanPurposes) as (keyof typeof loanPurposes)[];

  const defaultPurpose = loanPurposes['Working Capital']!;
  const selectedPurpose = loanPurpose ? loanPurposes[loanPurpose] : null;
  const activePurpose = selectedPurpose ?? defaultPurpose;
  const [customTermMonths, setCustomTermMonths] = useState<number>(defaultPurpose.defaultTerm);
  const [customRatePercent, setCustomRatePercent] = useState<number>(defaultPurpose.defaultRate * 100);
  const [customDownPaymentPercent, setCustomDownPaymentPercent] = useState<number>((defaultPurpose.defaultDownPaymentPct ?? 0) * 100);
  const principal = parseInt(loanAmount.replace(/[$,]/g, '')) || 0;
  const selectedRate = customRatePercent / 100;
  const selectedTerm = customTermMonths;
  const selectedDownPaymentPct = customDownPaymentPercent / 100;
  const selectedPaymentMode = activePurpose.paymentMode ?? 'amortized';
  const downPaymentAmount = Math.min(Math.round(principal * selectedDownPaymentPct), principal);
  const financedPrincipal = Math.max(principal - downPaymentAmount, 0);
  const estimatedPayment = financedPrincipal && loanPurpose
    ? Math.round(
        calculateMonthlyLoanPayment(
          financedPrincipal,
          selectedRate,
          selectedTerm,
          selectedPaymentMode === 'interest_only',
        ),
      )
    : 0;

  React.useEffect(() => {
    setCustomTermMonths(activePurpose.defaultTerm);
    setCustomRatePercent(activePurpose.defaultRate * 100);
    setCustomDownPaymentPercent((activePurpose.defaultDownPaymentPct ?? 0) * 100);
    setIsEditingAssumptions(false);
  }, [activePurpose]);

  React.useEffect(() => {
    if (!showResults) return;
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [showResults]);

  const updateNumericField = (name: keyof DscrFormValues, value: number) => {
    setError('');
    setValidationError(null);
    let parsed = value;
    if (Number.isNaN(parsed) || parsed < 0) parsed = 0;
    if (parsed > 10000000) parsed = 10000000;
    const newValues = {
      ...values,
      [name]: parsed,
    };
    setValues(newValues);
    onValuesChange?.(newValues);
  };

  const updateLoanAmountValue = (value: number) => {
    setError('');
    setValidationError(null);
    let num = value;
    if (Number.isNaN(num) || num < 0) num = 0;
    if (num > 10000000) num = 10000000;
    if (!num) {
      setLoanAmount('');
      return;
    }
    setLoanAmount(`$${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
  };

  const handleRatePercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d.]/g, '');
    const numericValue = parseFloat(rawValue);
    const nextValue = Number.isNaN(numericValue) ? 0 : Math.min(Math.max(numericValue, 0), 100);
    setCustomRatePercent(nextValue);
    trackCalculatorInteraction({
      page_template: analyticsPageTemplate,
      placement: analyticsPlacement,
      interaction_name: 'assumption_rate_updated',
      loan_purpose: loanPurpose || undefined,
      loan_amount: principal || undefined,
      assumption_rate: nextValue,
    });
  };

  const handleTermSelectChange = (value: string) => {
    const numericValue = parseInt(value, 10);
    const nextValue = Number.isNaN(numericValue) ? defaultPurpose.defaultTerm : numericValue;
    setCustomTermMonths(nextValue);
    trackCalculatorInteraction({
      page_template: analyticsPageTemplate,
      placement: analyticsPlacement,
      interaction_name: 'assumption_term_updated',
      loan_purpose: loanPurpose || undefined,
      loan_amount: principal || undefined,
      assumption_term_months: nextValue,
    });
  };

  const handleDownPaymentPercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d.]/g, '');
    const numericValue = parseFloat(rawValue);
    const nextValue = Number.isNaN(numericValue) ? 0 : Math.min(Math.max(numericValue, 0), 100);
    setCustomDownPaymentPercent(nextValue);
    trackCalculatorInteraction({
      page_template: analyticsPageTemplate,
      placement: analyticsPlacement,
      interaction_name: 'assumption_down_payment_percent_updated',
      loan_purpose: loanPurpose || undefined,
      loan_amount: principal || undefined,
      assumption_down_payment_pct: nextValue,
    });
  };

  const handleDownPaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const numericValue = parseInt(rawValue, 10);
    const nextAmount = Number.isNaN(numericValue) ? 0 : Math.min(Math.max(numericValue, 0), principal);
    const nextPercent = principal > 0 ? (nextAmount / principal) * 100 : 0;
    setCustomDownPaymentPercent(Number(nextPercent.toFixed(2)));
    trackCalculatorInteraction({
      page_template: analyticsPageTemplate,
      placement: analyticsPlacement,
      interaction_name: 'assumption_down_payment_amount_updated',
      loan_purpose: loanPurpose || undefined,
      loan_amount: principal || undefined,
      assumption_down_payment_pct: Number(nextPercent.toFixed(2)),
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNumericField(e.target.name as keyof DscrFormValues, parseFloat(e.target.value));
  };

  const handleLoanAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const num = parseInt(raw) || 0;
    updateLoanAmountValue(num);
  };

  const handleLoanPurposeChange = (value: string) => {
    setError('');
    setValidationError(null);
    setLoanPurpose(value as keyof typeof loanPurposes | '');
    trackCalculatorInteraction({
      page_template: analyticsPageTemplate,
      placement: analyticsPlacement,
      interaction_name: 'loan_purpose_selected',
      loan_purpose: value,
      loan_amount: principal || undefined,
    });
  };

  const focusField = (fieldId: string, openSelect: boolean = false) => {
    window.requestAnimationFrame(() => {
      const field = document.getElementById(fieldId) as HTMLElement | null;
      if (!field) return;
      field.focus();
      if (openSelect) {
        field.click();
      }
    });
  };

  const validateRequiredFields = () => {
    if (values.monthlyNetIncome <= 0) {
      setValidationError({ field: 'monthlyNetIncome', message: 'Please enter your monthly net income.' });
      focusField('monthlyNetIncome');
      return false;
    }

    if (principal <= 0) {
      setValidationError({ field: 'dscr-calc-form-loan-amount', message: 'Please enter your loan amount.' });
      focusField('dscr-calc-form-loan-amount');
      return false;
    }

    if (!loanPurpose) {
      setValidationError({ field: 'loanPurpose', message: 'Please choose your loan purpose.' });
      focusField('loanPurpose', true);
      return false;
    }

    setValidationError(null);
    return true;
  };

  const calculateDscr = () => {
    const totalMonthlyDebtPayments = 
      values.realEstateDebt +
      values.creditCards +
      values.vehicleEquipment +
      values.linesOfCredit +
      values.otherDebt;

    const totalMonthlyDebt = totalMonthlyDebtPayments + estimatedPayment;

    if (totalMonthlyDebt === 0) return null;
    if (values.monthlyNetIncome === 0) return null;
    return values.monthlyNetIncome / totalMonthlyDebt;
  };

  const handleCalculate = () => {
    setShowResults(true);
    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const dscr = calculateDscr();
  const totalMonthlyDebtPayments = 
    values.realEstateDebt +
    values.creditCards +
    values.vehicleEquipment +
      values.linesOfCredit +
      values.otherDebt;
  const totalProjectedDebtService = totalMonthlyDebtPayments + estimatedPayment;
  const dscrBand = dscr !== null ? getDscrBand(dscr) : null;
  const dscrStatus = dscrBand?.quickStatus ?? null;
  const nextStepConfig = dscrBand?.nextStep ?? null;
  const debtNeededPerDollarEarned = dscr !== null && dscr > 0 ? 1 / dscr : null;
  const debtLeftoverPerDollarEarned = dscr !== null && dscr > 0 ? Math.max(1 - (1 / dscr), 0) : null;
  const meaningHeadline = dscrBand ? getMeaningHeadline(dscrBand.id) : '';
  const dollarTranslation =
    debtNeededPerDollarEarned === null || dscr === null
      ? ''
      : dscr < 1
        ? `For every $1.00 your business earns, about ${formatRatioDollarAmount(debtNeededPerDollarEarned)} is needed for debt payments. That means the debt load is running ahead of the cash flow supporting it.`
        : `For every $1.00 your business earns, about ${formatRatioDollarAmount(debtNeededPerDollarEarned)} goes toward debt payments, leaving about ${formatRatioDollarAmount(debtLeftoverPerDollarEarned ?? 0)} after debt.`;
  const isBelowBenchmark = dscr !== null && dscr < DSCR_BENCHMARK;
  const isBelowOneDscr = dscr !== null && dscr < 1;
  const shouldShowIncomeAdjustmentCallout = isBelowBenchmark && !isBelowOneDscr;
  const shouldShowBenchmarkTargetBox = isBelowBenchmark && !isBelowOneDscr;
  const shouldShowCashFlowAnalysisUpsell = dscrBand?.showExpandedAnalysisUpsell ?? false;
  const defaultPurposeMeta = loanPurposeMeta['Working Capital']!;
  const selectedPurposeMeta = loanPurposeMeta[loanPurpose] ?? defaultPurposeMeta;
  const selectedPurposeTitle = selectedPurpose?.title ?? 'Choose Loan Purpose';
  const selectedPurposeDescription = selectedPurpose?.description ?? 'Choose the option that best matches what you want the funds to do for your business.';
  const SelectedPurposeIcon = selectedPurposeMeta.icon;
  const benchmarkMonthlyCapacity = Math.max((values.monthlyNetIncome / DSCR_BENCHMARK) - totalMonthlyDebtPayments, 0);
  const maxFinancedAmountAtBenchmark = Math.max(
    0,
    Math.round(
      calculatePrincipalFromPaymentCapacity(
        benchmarkMonthlyCapacity,
        selectedRate,
        selectedTerm,
        selectedPaymentMode === 'interest_only',
      ),
    ),
  );
  const maxLoanAmountAtBenchmark = Math.max(
    0,
    Math.round(
      selectedDownPaymentPct >= 1 ? 0 : maxFinancedAmountAtBenchmark / (1 - selectedDownPaymentPct),
    ),
  );
  const additionalCapacity = Math.max(maxLoanAmountAtBenchmark - principal, 0);
  const amountAboveBenchmarkTarget = Math.max(principal - maxLoanAmountAtBenchmark, 0);

  const getDebtFieldMobileLabel = (fieldName: (typeof debtFieldMeta)[number]['name']) => {
    if (!compactMobileLayout) return undefined;
    if (fieldName === 'realEstateDebt') return 'Real Estate';
    return undefined;
  };

  const getDebtFieldMobileLayoutClassName = (fieldName: (typeof debtFieldMeta)[number]['name']) => {
    if (fieldName !== 'vehicleEquipment') return '';
    if (compactMobileLayout) return 'col-span-2 sm:col-span-2';
    return 'sm:col-span-2';
  };

  const handleExploreLoanPackaging = (sectionId: string) => {
    trackCtaClick({
      page_template: analyticsPageTemplate,
      section_id: sectionId,
      cta_id: 'explore_loan_services',
      cta_label: nextStepConfig?.primaryCtaLabel ?? 'Explore Loan Packaging Or Brokering',
      destination_url: '/loan-services',
    });
    router.push('/loan-services');
  };

  const handleStartComprehensiveAnalysis = (sectionId: string) => {
    trackCtaClick({
      page_template: analyticsPageTemplate,
      section_id: sectionId,
      cta_id: 'start_comprehensive_analysis',
      cta_label: 'Start Comprehensive Analysis',
      destination_url: comprehensiveCheckoutPath,
    });
    router.push(comprehensiveCheckoutPath);
  };

  React.useEffect(() => {
    if (!showResults || dscr === null || !dscrBand) return;

    const signature = [
      dscrBand.id,
      dscr.toFixed(4),
      principal,
      totalProjectedDebtService,
      selectedRate.toFixed(4),
      selectedTerm,
      selectedDownPaymentPct.toFixed(4),
      loanPurpose,
    ].join('|');

    if (lastResultSignatureRef.current === signature) return;
    lastResultSignatureRef.current = signature;

    trackCalculatorResult({
      page_template: analyticsPageTemplate,
      placement: analyticsPlacement,
      interaction_name: 'result_viewed',
      loan_purpose: loanPurpose || undefined,
      dscr_band: dscrBand.id,
      dscr_value: Number(dscr.toFixed(2)),
      loan_amount: principal || undefined,
      monthly_income: values.monthlyNetIncome || undefined,
      monthly_debt_service: totalProjectedDebtService || undefined,
      benchmark_gap: Number((dscr - DSCR_BENCHMARK).toFixed(2)),
      assumption_rate: Number(customRatePercent.toFixed(2)),
      assumption_term_months: selectedTerm,
      assumption_down_payment_pct: Number(customDownPaymentPercent.toFixed(2)),
      recommended_action: nextStepConfig?.primaryCtaKind,
    });
  }, [
    analyticsPageTemplate,
    analyticsPlacement,
    customDownPaymentPercent,
    customRatePercent,
    dscr,
    dscrBand,
    loanPurpose,
    nextStepConfig,
    principal,
    selectedDownPaymentPct,
    selectedTerm,
    selectedRate,
    showResults,
    totalProjectedDebtService,
    values.monthlyNetIncome,
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div
        className={
          embedded
            ? 'relative'
            : 'relative overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_42%,#f2f7f6_100%)] shadow-[0_36px_90px_-48px_rgba(15,23,42,0.55)]'
        }
      >
        {!embedded && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />}
        {!embedded && <div className="absolute -left-16 top-10 h-36 w-36 rounded-full bg-emerald-200/35 blur-3xl" />}
        {!embedded && <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-sky-200/25 blur-3xl" />}

        <div className={embedded ? 'relative' : 'relative p-3 sm:p-4 lg:p-4.5'}>
          {!embedded && (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800">
                <Calculator className="h-4 w-4" />
                High-Level DSCR Calculator
              </div>
              <div className="max-w-3xl space-y-2">
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                  Quick DSCR estimate.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Enter income, monthly debt payments, and the loan request to estimate coverage fast.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {formHighlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          )}

          <form className={embedded ? 'space-y-3' : 'mt-2.5 space-y-3'} onSubmit={(e) => e.preventDefault()}>
            <div className="grid gap-3 xl:grid-cols-[1.05fr_1.35fr] xl:items-start">
              <section className="rounded-[24px] border border-slate-200 bg-white/90 p-3 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.7)] backdrop-blur xl:h-full">
                <div className="flex flex-col gap-2 border-b border-slate-200 pb-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Loan Request</p>
                    <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950 sm:text-xl">Main inputs</h2>
                  </div>
                  <div className={`rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-600 ${
                    compactMobileLayout
                      ? 'hidden sm:inline-flex sm:items-center sm:gap-2 sm:text-sm'
                      : 'inline-flex items-center gap-2 text-xs sm:text-sm'
                  }`}>
                    <Clock3 className="h-4 w-4 text-slate-500" />
                    Under 1 minute
                  </div>
                </div>

                <div className={`mt-2.5 grid gap-2 ${compactMobileLayout ? 'grid-cols-2' : ''} sm:gap-2.5 xl:grid-cols-2`}>
                  <InputField
                    label={
                      <>
                        <span className="sm:hidden">
                          Monthly Net
                          <br />
                          Income
                        </span>
                        <span className="hidden sm:inline">Monthly Net Income</span>
                      </>
                    }
                    name="monthlyNetIncome"
                    placeholder="e.g. 10,000"
                    tooltip="Use your business's average monthly profit after operating expenses, before any existing or new loan payments. If you only have an annual number, divide it by 12 for a quick estimate."
                    description="What your business keeps each month after expenses."
                    errorMessage={validationError?.field === 'monthlyNetIncome' ? validationError.message : undefined}
                    value={values.monthlyNetIncome}
                    onChange={handleInputChange}
                    required
                    icon={TrendingUp}
                    compact
                    hideDescriptionOnMobile
                    optimizeLabelMobile={compactMobileLayout}
                  />
                  <InputField
                    label="Loan Amount"
                    name="loanAmount"
                    placeholder="e.g. 100,000"
                    tooltip="How much funding are you looking for?"
                    description={`Enter the amount you want to test. We’ll also estimate the loan amount your cash flow may support at ${DSCR_BENCHMARK.toFixed(2)}x DSCR, the number banks prefer to see at minimum.`}
                    errorMessage={validationError?.field === 'dscr-calc-form-loan-amount' ? validationError.message : undefined}
                    value={parseInt(loanAmount.replace(/[$,]/g, '')) || 0}
                    onChange={handleLoanAmountChange}
                    required
                    id="dscr-calc-form-loan-amount"
                    icon={BadgeDollarSign}
                    compact
                    hideDescriptionOnMobile
                    optimizeLabelMobile={compactMobileLayout}
                  />
                </div>

                <div className="mt-2.5 rounded-[20px] border border-slate-200 bg-slate-50/80 p-2.5 sm:p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Loan Purpose</p>
                      <h3 className="mt-1 text-base font-semibold tracking-[-0.03em] text-slate-950 sm:text-lg">What will this loan be used for?</h3>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 sm:text-sm">
                      <SelectedPurposeIcon className="h-4 w-4" />
                      {selectedPurposeMeta.eyebrow}
                    </div>
                  </div>

                  <Select value={loanPurpose} onValueChange={handleLoanPurposeChange}>
                    <SelectTrigger
                      id="loanPurpose"
                      className="mt-2 h-auto min-h-12 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm outline-none transition-all duration-200 focus:border-slate-900 focus:ring-4 focus:ring-slate-200 sm:min-h-14 sm:px-4 sm:py-3"
                      data-ga-id="dscr-calc-form-loan-purpose"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 sm:h-10 sm:w-10">
                          <SelectedPurposeIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold leading-5 text-slate-950 sm:text-sm">
                            {selectedPurposeTitle}
                          </div>
                          <div className="mt-0.5 text-[11px] leading-4 text-slate-500 sm:text-xs">
                            {loanPurpose ? 'Choose The Best Match For What You Need' : 'Pick the option that fits this request'}
                          </div>
                        </div>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                      {loanPurposeKeys.map((purpose) => {
                        const purposeConfig: LoanPurpose = loanPurposes[purpose];
                        const OptionIcon = (loanPurposeMeta[purpose] ?? defaultPurposeMeta).icon;

                        return (
                          <SelectItem
                            key={purpose}
                            value={purpose}
                            className="rounded-xl py-3 pl-9 pr-3 focus:bg-slate-50 focus:text-slate-950"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                                <OptionIcon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-950">
                                  {purposeConfig.title}
                                </div>
                                <div className="mt-0.5 text-xs leading-5 text-slate-500">
                                  {purposeConfig.menuSubtitle ?? purposeConfig.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {validationError?.field === 'loanPurpose' && (
                    <p className="mt-2 text-sm font-medium text-rose-600">{validationError.message}</p>
                  )}
                  <p className="mt-1.5 hidden text-sm leading-6 text-slate-600 sm:block">
                    {selectedPurposeDescription}
                  </p>
                </div>
              </section>

              <section className="rounded-[24px] border border-slate-200 bg-white/90 p-3 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.7)] backdrop-blur xl:h-full">
                <div className="flex flex-col gap-2 border-b border-slate-200 pb-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Existing Debt</p>
                    <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950 sm:text-xl">Required monthly payments</h2>
                  </div>
                  <div className={`inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 font-medium text-amber-900 ${
                    compactMobileLayout
                      ? 'whitespace-nowrap text-[9px] tracking-[-0.01em] sm:text-sm sm:tracking-normal'
                      : 'text-xs sm:text-sm'
                  }`}>
                    <ShieldCheck className="h-4 w-4 text-amber-700" />
                    We don't need balances, just monthly payments
                  </div>
                </div>

                <div className={`mt-2.5 grid gap-2 ${compactMobileLayout ? 'grid-cols-2' : ''} sm:gap-2.5 sm:grid-cols-2`}>
                  {debtFieldMeta.map((field) => (
                    <div key={field.name} className={getDebtFieldMobileLayoutClassName(field.name)}>
                      <InputField
                        label={getDebtFieldMobileLabel(field.name) ?? field.label}
                        name={field.name}
                        placeholder={field.placeholder}
                        tooltip={field.tooltip}
                        description={field.description}
                        value={values[field.name]}
                        onChange={handleInputChange}
                        id={field.id}
                        icon={field.icon}
                        compact
                        hideDescriptionOnMobile
                        optimizeLabelMobile={compactMobileLayout}
                      />
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-2.5 flex flex-col items-center">
              <div className="w-full max-w-sm">
                <Button
                  onClick={(e) => {
                    if (!validateRequiredFields()) {
                      trackCalculatorInteraction({
                        page_template: analyticsPageTemplate,
                        placement: analyticsPlacement,
                        interaction_name: 'calculate_validation_failed',
                        loan_purpose: loanPurpose || undefined,
                        loan_amount: principal || undefined,
                        monthly_income: values.monthlyNetIncome || undefined,
                      });
                      e.preventDefault();
                      return;
                    }
                    setError('');
                    trackCalculatorInteraction({
                      page_template: analyticsPageTemplate,
                      placement: analyticsPlacement,
                      interaction_name: 'calculate_submitted',
                      loan_purpose: loanPurpose || undefined,
                      loan_amount: principal || undefined,
                      monthly_income: values.monthlyNetIncome || undefined,
                      monthly_debt_service: totalProjectedDebtService || undefined,
                      assumption_rate: Number(customRatePercent.toFixed(2)),
                      assumption_term_months: selectedTerm,
                      assumption_down_payment_pct: Number(customDownPaymentPercent.toFixed(2)),
                    });
                    handleCalculate();
                  }}
                  className="group relative h-10 w-full overflow-hidden rounded-2xl border border-emerald-300/70 bg-[linear-gradient(135deg,#34d399_0%,#22c55e_42%,#0f766e_100%)] px-6 text-sm font-semibold text-white shadow-[0_22px_55px_-28px_rgba(16,185,129,0.72)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_-28px_rgba(13,148,136,0.68)] active:translate-y-0 active:scale-[0.985] sm:h-11 sm:text-base"
                  id="dscr-calc-btn-calculate"
                >
                  <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.2)_22%,transparent_44%)] opacity-0 transition-all duration-500 group-hover:translate-x-full group-hover:opacity-100" />
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70" />
                  <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_55%)] opacity-80" />
                  <span className="relative flex items-center justify-center">
                    <span className="tracking-[0.01em]">Calculate DSCR</span>
                    <ArrowRight className="ml-2 h-5 w-5 transition duration-300 group-hover:translate-x-1 group-active:translate-x-0.5" />
                  </span>
                </Button>
                <p className="mt-2 text-center text-xs text-slate-500">This does not affect your credit.</p>
              </div>
            </div>

            {showResults && dscr !== null && dscrStatus && (
              <div ref={resultsRef} className="mt-6 space-y-5 scroll-mt-24">
                <section className={`overflow-hidden rounded-[2rem] border ${dscrStatus.borderClassName} bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_28px_70px_-44px_rgba(15,23,42,0.38)]`}>
                  <div className="border-b border-slate-200/80 px-4 py-4 sm:px-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">DSCR Result</p>
                        <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Here&apos;s How Your Request Looks</h3>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                          Based on a requested loan of {formatCurrency(principal)} for {selectedPurposeTitle}, your current cash flow produces:
                        </p>
                      </div>
                      <span className={`hidden rounded-full border px-3 py-1 text-xs font-semibold sm:inline-flex ${dscrStatus.badgeClassName}`}>
                        {dscrStatus.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-0 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className={`border-b border-slate-200/80 p-4 sm:p-5 xl:border-b-0 xl:border-r ${dscrStatus.panelClassName}`}>
                      <DscrGauge value={dscr} />

                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2">
                        <div className="min-w-0 rounded-2xl border border-white/80 bg-white/90 p-3 sm:p-4">
                          <p className="text-[10px] font-semibold uppercase leading-4 tracking-[0.14em] text-slate-500 sm:text-[11px] sm:tracking-[0.16em]">Monthly Income</p>
                          <p className="mt-2 break-words text-xl font-black tracking-[-0.04em] text-emerald-700 sm:text-2xl">{formatCurrency(values.monthlyNetIncome)}</p>
                        </div>
                        <div className="min-w-0 rounded-2xl border border-white/80 bg-white/90 p-3 sm:p-4">
                          <p className="text-[10px] font-semibold uppercase leading-4 tracking-[0.14em] text-slate-500 sm:text-[11px] sm:tracking-[0.16em]">Monthly Debt Service</p>
                          <p className="mt-2 break-words text-xl font-black tracking-[-0.04em] text-rose-700 sm:text-2xl">{formatCurrency(totalProjectedDebtService)}</p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-2xl border border-white/80 bg-white/90 p-4">
                        <div className="mt-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">What This Actually Means</p>
                          <p className="mt-1 text-base font-semibold text-slate-950">{meaningHeadline}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{dollarTranslation}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{dscrStatus.summary}</p>
                        </div>
                        <div className="mt-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">How A Lender Will Likely Read It</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{dscrStatus.lenderRead}</p>
                        </div>
                        {shouldShowIncomeAdjustmentCallout && (
                          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3">
                            <p className="text-sm leading-6 text-amber-950">
                              This quick check does not include every possible income adjustment. In the full cash flow analysis, we look for valid items that may increase the income used in your DSCR and improve the result.
                            </p>
                            <Button
                              type="button"
                              onClick={() => handleStartComprehensiveAnalysis('calculator_below_benchmark_callout')}
                              className="mt-3 h-10 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                            >
                              Start Comprehensive Analysis
                            </Button>
                          </div>
                        )}
                        <p className="mt-3 text-xs leading-5 text-slate-500">
                          This is a high-level estimate based on the numbers entered here. A lender will still look deeper at tax returns, bank statements, trends, and the overall deal structure.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5">
                      <div className="grid gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">DSCR Formula</p>
                          <p className="mt-2 text-sm font-semibold text-slate-700">Monthly Income / Monthly Debt Service = DSCR</p>
                          <p className="mt-2 text-lg font-bold tracking-[-0.03em] text-slate-950">
                            {formatCurrency(values.monthlyNetIncome)} / {formatCurrency(totalProjectedDebtService)} = <span className={dscrStatus.valueClassName}>{dscr.toFixed(2)}</span>
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            Lenders compare your monthly net income to your total required monthly debt payments. Most want to see at least {DSCR_BENCHMARK.toFixed(2)}x.
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Monthly Debt Service Breakdown</p>
                            <p className="mt-1 text-sm text-slate-600">These are the monthly payment amounts used in your DSCR.</p>
                          </div>

                          <div className="mt-3 space-y-2">
                            {debtFieldMeta.map((field) => (
                              <div key={`debt-breakdown-${field.name}`} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <span className="text-sm font-medium text-slate-700">{field.label}</span>
                                <span className="text-sm font-semibold text-slate-950">{formatCurrency(values[field.name])}</span>
                              </div>
                            ))}
                            <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                              <div>
                                <span className="text-sm font-semibold text-emerald-950">Estimated Loan Payment</span>
                                <p className="mt-0.5 text-xs text-emerald-700">
                                  {selectedTerm} months at {(selectedRate * 100).toFixed(2)}% {selectedPaymentMode === 'interest_only' ? 'interest-only' : 'amortized'}
                                </p>
                              </div>
                              <span className="text-sm font-semibold text-emerald-950">{formatCurrency(estimatedPayment)}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3">
                              <span className="text-sm font-semibold text-white">Total Monthly Debt Service</span>
                              <span className="text-sm font-semibold text-white">{formatCurrency(totalProjectedDebtService)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Loan Assumptions</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingAssumptions((current) => !current);
                                trackCalculatorInteraction({
                                  page_template: analyticsPageTemplate,
                                  placement: analyticsPlacement,
                                  interaction_name: isEditingAssumptions ? 'assumptions_closed' : 'assumptions_opened',
                                  loan_purpose: loanPurpose || undefined,
                                  loan_amount: principal || undefined,
                                });
                              }}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                            >
                              <PencilLine className="h-3.5 w-3.5" />
                              {isEditingAssumptions ? 'Done' : 'Edit'}
                            </button>
                          </div>
                          <div className="mt-3 space-y-3">
                            <div className="rounded-2xl border border-white bg-white px-4 py-3">
                              <p className="text-xs font-medium text-slate-500">Loan Purpose</p>
                              <p className="mt-1 text-sm font-semibold text-slate-950">{selectedPurposeTitle}</p>
                            </div>
                            <div className="rounded-2xl border border-white bg-white px-4 py-3">
                              <p className="text-xs font-medium text-slate-500">Requested Amount</p>
                              {isEditingAssumptions ? (
                                <div className="relative mt-2">
                                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">$</span>
                                  <input
                                    type="text"
                                    value={principal ? principal.toLocaleString('en-US') : ''}
                                    onChange={(e) => updateLoanAmountValue(parseInt(e.target.value.replace(/[^\d]/g, ''), 10) || 0)}
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm font-semibold text-slate-950 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-200"
                                    inputMode="numeric"
                                    pattern="[0-9,]*"
                                  />
                                </div>
                              ) : (
                                <p className="mt-1 text-sm font-semibold text-slate-950">{formatCurrency(principal)}</p>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                              <div className="min-w-0 rounded-2xl border border-white bg-white px-3 py-3 sm:px-4">
                                <p className="text-[11px] font-medium leading-4 text-slate-500 sm:text-xs">{isEditingAssumptions ? 'Term (Months)' : 'Term'}</p>
                                {isEditingAssumptions ? (
                                  <Select value={customTermMonths ? String(customTermMonths) : ''} onValueChange={handleTermSelectChange}>
                                    <SelectTrigger className="mt-2 h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-sm font-semibold text-slate-950 focus:border-slate-900 focus:ring-4 focus:ring-slate-200">
                                      <span>{customTermMonths ? String(customTermMonths) : 'Select'}</span>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                                      {commonTermOptions.map((termOption) => (
                                        <SelectItem
                                          key={termOption}
                                          value={String(termOption)}
                                          className="rounded-xl py-2.5 pl-9 pr-3 text-sm focus:bg-slate-50 focus:text-slate-950"
                                        >
                                          {termOption} Months ({termOption / 12} {termOption === 12 ? 'Year' : 'Years'})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <p className="mt-1 text-sm font-semibold text-slate-950">{selectedTerm} Months</p>
                                )}
                              </div>
                              <div className="min-w-0 rounded-2xl border border-white bg-white px-3 py-3 sm:px-4">
                                <p className="text-[11px] font-medium leading-4 text-slate-500 sm:text-xs">{isEditingAssumptions ? 'Rate (%)' : 'Rate'}</p>
                                {isEditingAssumptions ? (
                                  <div className="relative mt-2">
                                    <input
                                      type="text"
                                      value={customRatePercent ? customRatePercent.toFixed(2).replace(/\.00$/, '') : ''}
                                      onChange={handleRatePercentChange}
                                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 pr-8 text-sm font-semibold text-slate-950 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-200"
                                      inputMode="decimal"
                                    />
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">%</span>
                                  </div>
                                ) : (
                                  <p className="mt-1 text-sm font-semibold text-slate-950">{(selectedRate * 100).toFixed(2)}%</p>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                              <div className={`min-w-0 rounded-2xl border border-white bg-white px-3 py-3 sm:px-4 ${isEditingAssumptions ? 'sm:col-span-2' : ''}`}>
                                <p className="text-[11px] font-medium leading-4 text-slate-500 sm:text-xs">
                                  <span className="sm:hidden">Down Payment %</span>
                                  <span className="hidden sm:inline">{isEditingAssumptions ? 'Down Payment (%)' : 'Down Payment'}</span>
                                </p>
                                {isEditingAssumptions ? (
                                  <div className="relative mt-2">
                                    <input
                                      type="text"
                                      value={customDownPaymentPercent ? customDownPaymentPercent.toFixed(2).replace(/\.00$/, '') : ''}
                                      onChange={handleDownPaymentPercentChange}
                                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 pr-8 text-sm font-semibold text-slate-950 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-200"
                                      inputMode="decimal"
                                    />
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">%</span>
                                  </div>
                                ) : (
                                  <p className="mt-1 text-sm font-semibold text-slate-950">{(selectedDownPaymentPct * 100).toFixed(2).replace(/\.00$/, '')}%</p>
                                )}
                              </div>
                              <div className={`min-w-0 rounded-2xl border border-white bg-white px-3 py-3 sm:px-4 ${isEditingAssumptions ? 'sm:col-span-2' : ''}`}>
                                <p className="text-[11px] font-medium leading-4 text-slate-500 sm:text-xs">
                                  <span className="sm:hidden">Down Payment $</span>
                                  <span className="hidden sm:inline">Down Payment Amount</span>
                                </p>
                                {isEditingAssumptions ? (
                                  <div className="relative mt-2">
                                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">$</span>
                                    <input
                                      type="text"
                                      value={downPaymentAmount ? downPaymentAmount.toLocaleString('en-US') : ''}
                                      onChange={handleDownPaymentAmountChange}
                                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm font-semibold text-slate-950 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-200"
                                      inputMode="numeric"
                                      pattern="[0-9,]*"
                                    />
                                  </div>
                                ) : (
                                  <p className="mt-1 text-sm font-semibold text-slate-950">{formatCurrency(downPaymentAmount)}</p>
                                )}
                              </div>
                            </div>
                            {!isEditingAssumptions && (
                              <div className="rounded-2xl border border-white bg-white px-4 py-3">
                                <p className="text-xs font-medium text-slate-500">Estimated Financed Amount</p>
                                <p className="mt-1 text-sm font-semibold text-slate-950">{formatCurrency(financedPrincipal)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {shouldShowBenchmarkTargetBox && (
                        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">{DSCR_BENCHMARK.toFixed(2)}x Target</p>
                              <h4 className="mt-1 text-lg font-bold tracking-[-0.03em] text-slate-950">
                                {maxLoanAmountAtBenchmark > 0 ? `Estimated Loan Amount You Could Afford At ${DSCR_BENCHMARK.toFixed(2)}x` : `Current Numbers May Not Support A New Loan At ${DSCR_BENCHMARK.toFixed(2)}x`}
                              </h4>
                              <p className="mt-2 text-sm leading-6 text-slate-700">
                                {maxLoanAmountAtBenchmark > 0
                                  ? `Based on your current income, existing monthly debt, and the loan assumptions above, this is the estimated loan amount that would bring your DSCR up to the common ${DSCR_BENCHMARK.toFixed(2)}x benchmark.`
                                  : `Based on your current income and existing monthly debt payments, this quick check does not show room for an additional loan while staying at ${DSCR_BENCHMARK.toFixed(2)}x DSCR.`}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-amber-200 bg-white/90 px-4 py-3 text-center sm:min-w-52">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                {maxLoanAmountAtBenchmark > 0 ? 'Estimated Affordable Loan' : 'Estimated Affordable Loan'}
                              </p>
                              <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-amber-700">{formatCurrency(maxLoanAmountAtBenchmark)}</p>
                            </div>
                          </div>

                          {maxLoanAmountAtBenchmark > 0 ? (
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-2xl border border-white/90 bg-white/90 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Current Request</p>
                                <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">{formatCurrency(principal)}</p>
                              </div>
                              <div className="rounded-2xl border border-white/90 bg-white/90 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Amount Above {DSCR_BENCHMARK.toFixed(2)}x Target</p>
                                <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-amber-700">{formatCurrency(amountAboveBenchmarkTarget)}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-3 text-sm leading-6 text-slate-700">
                              In plain terms, the current debt payments are already taking up too much of the monthly income this tool is using. That means a lender may want to see lower debt, stronger income, or a different structure before a new loan makes sense.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {dscr >= DSCR_BENCHMARK && maxLoanAmountAtBenchmark > 0 && (
                  <section className="rounded-[2rem] border border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.96)_0%,rgba(255,255,255,1)_52%,rgba(240,253,250,0.98)_100%)] p-4 shadow-[0_24px_60px_-42px_rgba(16,185,129,0.35)] sm:p-5">
                    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                      <div>
                        <div className="inline-flex items-center rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Above Benchmark
                        </div>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Bonus Insight</p>
                        <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">You May Qualify For a Larger Loan</h3>
                        <p className="mt-3 text-sm leading-6 text-slate-700">
                          Based on your current numbers, your business is performing above the typical lender benchmark of {DSCR_BENCHMARK.toFixed(2)}x DSCR.
                        </p>
                        <p className="mt-3 text-sm leading-6 text-slate-700">
                          This means you may be able to support a larger loan while still staying within a comfortable approval range.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-emerald-200 bg-white/95 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Estimated Max Loan</p>
                          <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-emerald-700">{formatCurrency(maxLoanAmountAtBenchmark)}</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-200 bg-white/95 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Additional Funding Available</p>
                          <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-emerald-700">{formatCurrency(additionalCapacity)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/90 bg-white/85 px-4 py-3 sm:col-span-2">
                          <p className="text-sm font-medium text-slate-600">Current request: <span className="font-semibold text-slate-950">{formatCurrency(principal)}</span></p>
                          <p className="mt-2 text-sm leading-6 text-emerald-800">Want help structuring this for the best approval odds? We can guide you.</p>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {nextStepConfig?.primaryCtaKind === 'analysis' && (
                  <section className="rounded-[2rem] border border-slate-200 bg-slate-950 p-4 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.8)] sm:p-5">
                    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">Best Next Move</span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">Bank-Level Analysis</span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">EBITDA Review</span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">DSCR Recheck</span>
                        </div>
                        <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">{nextStepConfig.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-200">
                          {nextStepConfig.description}
                        </p>

                        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <p className="text-sm font-semibold text-white">See What A Lender Will Actually Focus On</p>
                            <p className="mt-1.5 text-sm leading-6 text-slate-300">We move beyond the quick estimate and review the repayment story the way a lender is more likely to pressure-test it.</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <p className="text-sm font-semibold text-white">Catch Add-Backs Or Structure Issues Early</p>
                            <p className="mt-1.5 text-sm leading-6 text-slate-300">If the request needs to be resized, restructured, or supported with valid income adjustments, it is better to learn that now.</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <p className="text-sm font-semibold text-white">Know Whether You&apos;re Truly Ready</p>
                            <p className="mt-1.5 text-sm leading-6 text-slate-300">Leave with a clearer answer on whether to move forward, lower the request, or improve the structure before packaging or applying.</p>
                          </div>
                          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-emerald-300/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">Bonus</span>
                              <p className="text-sm font-semibold text-white">Business Debt Summary PDF Included</p>
                            </div>
                            <p className="mt-1.5 text-sm leading-6 text-slate-200">Get a clean lender-ready debt summary PDF so your current obligations are easy to review and explain.</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Why Start Here</p>
                        <div className="mt-3 space-y-2.5">
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <p className="text-sm font-semibold text-white">This Keeps You From Guessing</p>
                            <p className="mt-1.5 text-sm leading-6 text-slate-300">Instead of wondering whether this result is close enough, you get a clearer lender-style read on whether the request actually holds up.</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <p className="text-sm font-semibold text-white">It Can Save You From Packaging Too Early</p>
                            <p className="mt-1.5 text-sm leading-6 text-slate-300">If something needs to change first, it is better to find that out here than after spending time and money preparing the file.</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <p className="text-sm font-semibold text-white">If You Still Want To See The Loan-Service Path</p>
                            <p className="mt-1.5 text-sm leading-6 text-slate-300">Loan packaging organizes the file and brokering can help carry a strong request into lender conversations, but this analysis is usually the smarter first move at your current range.</p>
                          </div>
                        </div>
                        <Button
                          className="mt-4 h-11 w-full rounded-2xl bg-white text-base font-bold text-slate-950 transition-colors hover:bg-slate-100"
                          size="lg"
                          onClick={() => handleStartComprehensiveAnalysis('calculator_full_analysis_upsell')}
                          id="dscr-calc-cta-cash-flow-analysis"
                        >
                          Start Comprehensive Analysis
                        </Button>
                        <Button
                          className="mt-2.5 h-11 w-full rounded-2xl border border-white/15 bg-white/5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                          size="lg"
                          onClick={() => handleExploreLoanPackaging('calculator_analysis_secondary_loan_services')}
                          id="dscr-calc-cta-loan-services-secondary"
                        >
                          Explore Loan Packaging Or Brokering
                        </Button>
                        <p className="mt-2.5 text-center text-xs leading-5 text-slate-400">
                          Best for borrowers who need a clearer lender-style answer before deciding whether to package, broker, resize, or wait.
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {nextStepConfig?.primaryCtaKind === 'packaging' && (
                  <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.76)_0%,rgba(255,255,255,1)_44%,rgba(239,246,255,0.9)_100%)] shadow-[0_24px_60px_-42px_rgba(15,23,42,0.35)]">
                    <div className="grid gap-0 xl:grid-cols-[0.9fr_1.1fr]">
                      <div className="border-b border-slate-200/80 p-4 sm:p-5 xl:border-b-0 xl:border-r">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Best Next Move</p>
                        <h3 className="mt-2 text-[1.65rem] font-black tracking-[-0.04em] text-slate-950">{nextStepConfig.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {nextStepConfig.description}
                        </p>

                        <div className="mt-4 grid gap-2.5">
                          <div className="rounded-2xl border border-white/80 bg-white/92 px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Typical Business Age</p>
                                <p className="mt-1 text-sm font-bold text-slate-950">{nextStepConfig.businessAge}</p>
                              </div>
                              <div className="h-8 w-px bg-slate-200" />
                              <div className="flex-1">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Rough Credit Comfort</p>
                                <p className="mt-1 text-sm font-bold text-slate-950">{nextStepConfig.creditRange}</p>
                              </div>
                            </div>
                            <div className="mt-2 grid gap-2 text-xs leading-5 text-slate-600 sm:grid-cols-2">
                              <p>{nextStepConfig.businessAgeNote}</p>
                              <p>{nextStepConfig.creditNote}</p>
                            </div>
                          </div>
                        </div>

                        <p className="mt-2.5 text-[11px] leading-5 text-slate-500">
                          Rough guidance only. Lenders also weigh documentation, liquidity, collateral, industry, and deal structure.
                        </p>
                      </div>

                      <div className="p-4 sm:p-5">
                        <div className="rounded-[1.75rem] border border-emerald-200 bg-white/96 p-4 shadow-[0_24px_60px_-42px_rgba(16,185,129,0.4)]">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Loan Services Path</p>
                              <h4 className="mt-1.5 text-[1.55rem] font-black tracking-[-0.04em] text-slate-950">Loan Packaging Or Brokering</h4>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                              Best When You&apos;re Ready To Apply
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-6 text-slate-700">
                            Your DSCR suggests this request may be ready to move into lender preparation. We help turn the numbers into a cleaner lender-facing file, and if you want hands-on help beyond packaging, our brokering path can help carry a strong request into lender conversations.
                          </p>

                          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-sm font-semibold text-slate-950">Lender-Ready Package</p>
                              <p className="mt-1.5 text-sm leading-6 text-slate-600">We help organize the request, documents, debt summary, and story into something you can present with confidence.</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-sm font-semibold text-slate-950">Brokering When You Want More Support</p>
                              <p className="mt-1.5 text-sm leading-6 text-slate-600">If you want help beyond the package, brokering can help move a strong file into real lender conversations.</p>
                            </div>
                          </div>

                          <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
                            <p className="text-sm font-semibold text-slate-950">Why Borrowers Use Us</p>
                            <p className="mt-1.5 text-sm leading-6 text-slate-700">We stay focused on how the request reads to a lender, not just on filling out forms. That means clearer numbers, cleaner presentation, and a more useful path from “I think I qualify” to “here is a file I can actually send out.”</p>
                          </div>

                          <Button
                            className="mt-4 h-11 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-base font-bold text-white shadow-[0_18px_50px_-30px_rgba(16,185,129,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-600 hover:to-green-700"
                            size="lg"
                            onClick={() => handleExploreLoanPackaging('calculator_packaging_next_step')}
                            id="dscr-calc-cta-start-checkout"
                          >
                            {nextStepConfig.primaryCtaLabel}
                          </Button>
                          {shouldShowCashFlowAnalysisUpsell && (
                            <Button
                              className="mt-2.5 h-11 w-full rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
                              size="lg"
                              onClick={() => handleStartComprehensiveAnalysis('calculator_packaging_secondary_analysis')}
                              id="dscr-calc-cta-secondary-analysis"
                            >
                              Validate With Comprehensive Analysis First
                            </Button>
                          )}
                          <p className="mt-2.5 text-center text-xs leading-5 text-slate-500">{nextStepConfig.serviceSupportLine}</p>
                        </div>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default DscrQuickCalculator;
