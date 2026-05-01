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
  shortLabel?: string;
  placeholder: string;
  tooltip: string;
  description: string;
  icon: LucideIcon;
  id: string;
}> = [
  {
    name: 'realEstateDebt',
    label: 'Real Estate Debt',
    shortLabel: 'Real Estate',
    placeholder: 'e.g. 2,000',
    tooltip: 'Enter the total combined required monthly payments for all business real estate loans.',
    description: 'Enter the total combined required monthly payments for all business real estate loans.',
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
    label: 'Vehicle & Equipment Loans',
    shortLabel: 'Vehicle & Equipment',
    placeholder: 'e.g. 300',
    tooltip: 'Enter the total combined required monthly payments for all vehicle and equipment loans.',
    description: 'Enter the total combined required monthly payments for all vehicle and equipment loans.',
    icon: Truck,
    id: 'dscr-calc-form-vehicle-equipment',
  },
  {
    name: 'linesOfCredit',
    label: 'Lines of Credit',
    shortLabel: 'Credit Lines',
    placeholder: 'e.g. 400',
    tooltip: 'Enter the total combined required monthly payments for all business lines of credit.',
    description: 'Enter the total combined required monthly payments for all business lines of credit.',
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
          <div className="mt-1.5 flex flex-wrap items-center gap-2 sm:mt-3 sm:gap-3">
            <div className={`text-4xl font-black tracking-[-0.05em] sm:text-5xl ${status.valueClassName}`}>{value.toFixed(2)}</div>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.badgeClassName}`}>{status.label}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 sm:mt-6">
        <div className="relative pt-6 sm:pt-8">
          <div className="h-2.5 overflow-hidden rounded-full border border-slate-200 bg-slate-100 sm:h-4">
            <div className="h-full w-full bg-[linear-gradient(90deg,#ef4444_0%,#f59e0b_50%,#10b981_100%)]" />
          </div>
          <div
            className="absolute top-1 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${benchmarkPosition}%` }}
          >
            <div className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white sm:px-2 sm:py-1 sm:text-[10px] sm:tracking-[0.14em]">
              {DSCR_BENCHMARK.toFixed(2)}x
            </div>
            <div className="mt-1 h-4 w-px bg-slate-900 sm:h-5" />
          </div>
          <div
            className="absolute top-5 flex -translate-x-1/2 flex-col items-center transition-all duration-300"
            style={{ left: `${pointerPosition}%` }}
          >
            <div className={`flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-white shadow-lg sm:h-8 sm:w-8 sm:border-4 ${status.panelClassName}`}>
              <div className={`h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5 ${status.valueClassName.replace('text', 'bg')}`} />
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between text-[9px] font-medium uppercase tracking-[0.08em] text-slate-500 sm:mt-4 sm:text-[11px] sm:tracking-[0.14em]">
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
  hideTooltipOnMobile?: boolean;
  inlineOnMobile?: boolean | 'stacked';
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
  hideTooltipOnMobile = false,
  inlineOnMobile = false,
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
      className={`transition-all duration-200 ${
        inlineOnMobile
          ? 'sm:rounded-[20px] sm:border sm:border-slate-200 sm:bg-white sm:shadow-[0_14px_45px_-36px_rgba(15,23,42,0.8)] sm:focus-within:-translate-y-0.5 sm:focus-within:border-slate-900 sm:focus-within:shadow-[0_24px_60px_-40px_rgba(15,23,42,0.75)]'
          : 'rounded-[20px] border border-slate-200 bg-white shadow-[0_14px_45px_-36px_rgba(15,23,42,0.8)] focus-within:-translate-y-0.5 focus-within:border-slate-900 focus-within:shadow-[0_24px_60px_-40px_rgba(15,23,42,0.75)]'
      } ${
        compact ? 'p-0 sm:p-2.5' : 'p-0 sm:p-3.5'
      }`}
    >
      {inlineOnMobile && (
        <>
          {inlineOnMobile === 'stacked' ? (
            <div className="sm:hidden">
              <label htmlFor={id || name} className="block text-xs font-medium text-slate-600">
                {label}
                {required ? <span className="ml-0.5 text-emerald-600">*</span> : null}
              </label>
              <div className="relative mt-0.5">
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">$</span>
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
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-5 pr-2 text-sm font-semibold text-slate-900 transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                  inputMode="numeric"
                  pattern="[0-9,]*"
                />
              </div>
              {errorMessage && <p className="mt-1 text-xs font-medium text-rose-600">{errorMessage}</p>}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 sm:hidden">
                <label htmlFor={id || name} className="min-w-0 flex-1 text-xs font-medium text-slate-600">
                  {label}
                  {required ? <span className="ml-0.5 text-emerald-600">*</span> : null}
                </label>
                <div className="relative w-36 shrink-0">
                  <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">$</span>
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
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-5 pr-2 text-sm font-semibold text-slate-900 transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    inputMode="numeric"
                    pattern="[0-9,]*"
                  />
                </div>
              </div>
              {errorMessage && <p className="mt-1 text-xs font-medium text-rose-600 sm:hidden">{errorMessage}</p>}
            </>
          )}
        </>
      )}
      <div className={inlineOnMobile ? 'hidden sm:block' : ''}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 ${
                compact
                  ? optimizeLabelMobile
                    ? 'h-6 w-6 rounded-lg'
                    : 'h-7 w-7'
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
          <div className={hideTooltipOnMobile ? 'hidden sm:block' : ''}>
            <Tooltip text={tooltip} />
          </div>
        </div>
        <p className={`mt-1 text-slate-500 ${compact ? 'text-[11px] leading-4 sm:text-xs sm:leading-4.5' : 'text-xs leading-4.5'} ${hideDescriptionOnMobile ? 'hidden sm:block' : ''}`}>
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
            className={`${compact ? 'mt-1' : 'mt-1.5'} w-full rounded-2xl border border-slate-200 bg-slate-50 font-semibold text-slate-900 shadow-inner shadow-slate-200/40 transition-all duration-200 placeholder:font-medium placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-200 ${
              compact ? 'h-9 pl-7 pr-3 text-sm sm:h-9 sm:pl-8 sm:text-[15px]' : 'h-11 pl-9 pr-4 text-base'
            }`}
            inputMode="numeric"
            pattern="[0-9,]*"
          />
        </div>
        {errorMessage && (
          <p className="mt-2 text-sm font-medium text-rose-600">{errorMessage}</p>
        )}
      </div>
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
  const isLineOfCreditPurpose = loanPurpose === 'Line of Credit';
  const downPaymentAmount = isLineOfCreditPurpose
    ? 0
    : Math.min(Math.round(principal * selectedDownPaymentPct), principal);
  const financedPrincipal = isLineOfCreditPurpose
    ? principal
    : Math.max(principal - downPaymentAmount, 0);
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
  const estimatedPaymentSummary = isLineOfCreditPurpose
    ? `Assumes the full line is drawn. Estimated as ${formatCurrency(financedPrincipal)} x ${(selectedRate * 100).toFixed(2)}% / 12.`
    : `${selectedTerm} months at ${(selectedRate * 100).toFixed(2)}% ${selectedPaymentMode === 'interest_only' ? 'interest-only' : 'amortized'}`;

  const getDebtFieldMobileLabel = (fieldName: (typeof debtFieldMeta)[number]['name']) => {
    if (!compactMobileLayout) return undefined;
    if (fieldName === 'realEstateDebt') return 'Real Estate';
    return undefined;
  };

  const getDebtFieldMobileLayoutClassName = (fieldName: (typeof debtFieldMeta)[number]['name']) => {
    if (fieldName !== 'vehicleEquipment') return '';
    return 'sm:col-span-2';
  };

  const handleExploreLoanPackaging = (sectionId: string, ctaLabel: string = 'Just Get My File Lender-Ready') => {
    trackCtaClick({
      page_template: analyticsPageTemplate,
      section_id: sectionId,
      cta_id: 'explore_loan_services',
      cta_label: ctaLabel,
      destination_url: '/loan-services',
    });
    router.push('/loan-services');
  };

  const handleStartLoanBrokering = (sectionId: string) => {
    trackCtaClick({
      page_template: analyticsPageTemplate,
      section_id: sectionId,
      cta_id: 'start_loan_brokering',
      cta_label: 'Move Forward With Expert Help',
      destination_url: '/loan-services',
    });
    router.push('/loan-services');
  };

  const handleExploreCashFlowAnalysis = (sectionId: string, ctaLabel: string = 'Validate With Full Analysis First') => {
    trackCtaClick({
      page_template: analyticsPageTemplate,
      section_id: sectionId,
      cta_id: 'explore_cash_flow_analysis',
      cta_label: ctaLabel,
      destination_url: '/cash-flow-analysis',
    });
    router.push('/cash-flow-analysis');
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
                See My DSCR
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

          <div className="mb-1.5 sm:hidden">
            <p className="text-[11px] leading-4 text-slate-500">
              <span className="font-medium text-slate-700">What is DSCR?</span> DSCR shows lenders whether your business cash flow can comfortably cover its debt payments. A stronger DSCR can make your loan request look safer and more fundable.
            </p>
          </div>

          <form className={embedded ? 'space-y-1.5 sm:space-y-2' : 'mt-2 space-y-1.5 sm:space-y-2'} onSubmit={(e) => e.preventDefault()}>
            <div className="grid gap-1.5 sm:gap-2 xl:grid-cols-[1.05fr_1.35fr] xl:items-start">
              <section className="sm:rounded-[24px] sm:border sm:border-slate-200 sm:bg-white/90 sm:shadow-[0_24px_70px_-50px_rgba(15,23,42,0.7)] backdrop-blur xl:h-full">
                <div className="hidden flex-row items-center justify-between gap-2 border-b border-slate-200 pb-1 sm:flex sm:pb-1.5">
                  <div className="flex flex-row items-baseline gap-1.5 sm:block">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Loan Request</p>
                    <h2 className="text-base font-semibold tracking-[-0.03em] text-slate-950 sm:text-xl">Main inputs</h2>
                  </div>
                  <div className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-600 sm:text-xs`}>
                    <Clock3 className="h-3.5 w-3.5 text-slate-500" />
                    Under 1 minute
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-1.5 sm:gap-2">
                  <InputField
                    label="Net Income After Expenses"
                    name="monthlyNetIncome"
                    placeholder="10,000"
                    tooltip="Use your business's average monthly profit after operating expenses, before any existing or new loan payments. If you only have an annual number, divide it by 12 for a quick estimate."
                    description="What your business keeps each month after expenses."
                    errorMessage={validationError?.field === 'monthlyNetIncome' ? validationError.message : undefined}
                    value={values.monthlyNetIncome}
                    onChange={handleInputChange}
                    required
                    icon={TrendingUp}
                    compact
                    hideDescriptionOnMobile
                    hideTooltipOnMobile
                    inlineOnMobile="stacked"
                    optimizeLabelMobile={compactMobileLayout}
                  />
                  <InputField
                    label="Loan Amount"
                    name="loanAmount"
                    placeholder="100,000"
                    tooltip="How much funding are you looking for?"
                    description={`Enter the amount you estimate you'll need. We’ll estimate the loan amount your cash flow may support at ${DSCR_BENCHMARK.toFixed(2)}x DSCR.`}
                    errorMessage={validationError?.field === 'dscr-calc-form-loan-amount' ? validationError.message : undefined}
                    value={parseInt(loanAmount.replace(/[$,]/g, '')) || 0}
                    onChange={handleLoanAmountChange}
                    required
                    id="dscr-calc-form-loan-amount"
                    icon={BadgeDollarSign}
                    compact
                    hideDescriptionOnMobile
                    hideTooltipOnMobile
                    inlineOnMobile="stacked"
                    optimizeLabelMobile={compactMobileLayout}
                  />
                </div>

                <div className="mt-1.5 sm:rounded-[20px] sm:border sm:border-slate-200 bg-slate-50/80 p-2 sm:mt-2 sm:p-2.5">
                  <div className="hidden flex-row items-center justify-between gap-2 sm:flex">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Loan Purpose</p>
                      <h3 className="text-base font-semibold tracking-[-0.03em] text-slate-950 sm:text-lg">What will this loan be used for?</h3>
                    </div>
                    <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-800 sm:text-xs">
                      <SelectedPurposeIcon className="h-3.5 w-3.5" />
                      {selectedPurposeMeta.eyebrow}
                    </div>
                  </div>
                  <Select value={loanPurpose} onValueChange={handleLoanPurposeChange}>
                    <SelectTrigger
                      id="loanPurpose"
                      className="h-auto min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm outline-none transition-all duration-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-200 sm:mt-1.5 sm:min-h-12 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:focus:ring-4"
                      data-ga-id="dscr-calc-form-loan-purpose"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 sm:flex sm:h-10 sm:w-10">
                          <SelectedPurposeIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold leading-5 text-slate-950 sm:text-sm">
                            {selectedPurposeTitle}
                          </div>
                          <div className="mt-0.5 text-xs leading-4 text-slate-500 sm:text-xs">
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
                  <p className="mt-1 hidden text-sm leading-6 text-slate-600 sm:block">
                    {selectedPurposeDescription}
                  </p>
                </div>
              </section>

              <section className="sm:rounded-[24px] sm:border sm:border-slate-200 sm:bg-white/90 sm:shadow-[0_24px_70px_-50px_rgba(15,23,42,0.7)] backdrop-blur xl:h-full">
                <div className="hidden flex-row items-center justify-between gap-2 border-b border-slate-200 pb-1 sm:flex sm:pb-1.5">
                  <div className="flex flex-row items-baseline gap-1.5 sm:block">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Existing Debt</p>
                    <h2 className="text-base font-semibold tracking-[-0.03em] text-slate-950 sm:text-xl">Required monthly payments</h2>
                  </div>
                  <div className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-900 sm:text-xs`}>
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
                    Payments only, not balances
                  </div>
                </div>

                <div className="mb-1 sm:hidden">
                  <p className="text-xs font-semibold text-slate-700">Monthly Debt Payments</p>
                  <p className="text-[11px] leading-4 text-slate-500">Enter minimum required monthly payments, not total balances.</p>
                </div>

                <div className={`mt-1.5 grid gap-1.5 grid-cols-1 sm:mt-2 sm:gap-2 sm:grid-cols-2`}>
                  {debtFieldMeta.map((field) => (
                    <div key={field.name} className={getDebtFieldMobileLayoutClassName(field.name)}>
                      <InputField
                        label={field.shortLabel ?? field.label}
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
                        hideTooltipOnMobile
                        inlineOnMobile
                        optimizeLabelMobile={compactMobileLayout}
                      />
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-1.5 flex flex-col items-center sm:mt-2">
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
                  className="group relative h-9 w-full overflow-hidden rounded-2xl border border-emerald-300/70 bg-[linear-gradient(135deg,#34d399_0%,#22c55e_42%,#0f766e_100%)] px-6 text-sm font-semibold text-white shadow-[0_22px_55px_-28px_rgba(16,185,129,0.72)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_-28px_rgba(13,148,136,0.68)] active:translate-y-0 active:scale-[0.985] sm:h-10 sm:text-base"
                  id="dscr-calc-btn-calculate"
                >
                  <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.2)_22%,transparent_44%)] opacity-0 transition-all duration-500 group-hover:translate-x-full group-hover:opacity-100" />
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70" />
                  <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_55%)] opacity-80" />
                  <span className="relative flex items-center justify-center">
                    <span className="tracking-[0.01em]">See My DSCR</span>
                    <ArrowRight className="ml-2 h-5 w-5 transition duration-300 group-hover:translate-x-1 group-active:translate-x-0.5" />
                  </span>
                </Button>
                <p className="mt-1.5 text-center text-[11px] text-slate-500">This does not affect your credit.</p>
              </div>
            </div>

            {showResults && dscr !== null && dscrStatus && (
              <div ref={resultsRef} className="mt-3 space-y-3 scroll-mt-24 sm:mt-6 sm:space-y-5">
                <section className={`overflow-hidden rounded-[1.4rem] border ${dscrStatus.borderClassName} bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_28px_70px_-44px_rgba(15,23,42,0.38)] sm:rounded-[2rem]`}>
                  <div className="border-b border-slate-200/80 px-3 py-3 sm:px-5 sm:py-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs sm:tracking-[0.2em]">DSCR Result</p>
                        <h3 className="mt-1 text-xl font-black tracking-[-0.04em] text-slate-950 sm:mt-2 sm:text-2xl">Here&apos;s How Your Request Looks</h3>
                        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 sm:mt-2 sm:text-sm sm:leading-6">
                          <span className="sm:hidden">Request: {formatCurrency(principal)} for {selectedPurposeTitle}</span>
                          <span className="hidden sm:inline">Based on a requested loan of {formatCurrency(principal)} for {selectedPurposeTitle}, your current cash flow produces:</span>
                        </p>
                      </div>
                      <span className={`hidden rounded-full border px-3 py-1 text-xs font-semibold sm:inline-flex ${dscrStatus.badgeClassName}`}>
                        {dscrStatus.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-0 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className={`border-b border-slate-200/80 p-3 sm:p-5 xl:border-b-0 xl:border-r ${dscrStatus.panelClassName}`}>
                      <DscrGauge value={dscr} />

                      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
                        <div className="min-w-0 rounded-2xl border border-white/80 bg-white/90 p-2.5 sm:p-4">
                          <p className="text-[10px] font-semibold uppercase leading-4 tracking-[0.14em] text-slate-500 sm:text-[11px] sm:tracking-[0.16em]">Monthly Income</p>
                          <p className="mt-1 break-words text-lg font-black tracking-[-0.04em] text-emerald-700 sm:mt-2 sm:text-2xl">{formatCurrency(values.monthlyNetIncome)}</p>
                        </div>
                        <div className="min-w-0 rounded-2xl border border-white/80 bg-white/90 p-2.5 sm:p-4">
                          <p className="text-[10px] font-semibold uppercase leading-4 tracking-[0.14em] text-slate-500 sm:text-[11px] sm:tracking-[0.16em]">Total Debt Service</p>
                          <p className="mt-1 break-words text-lg font-black tracking-[-0.04em] text-rose-700 sm:mt-2 sm:text-2xl">{formatCurrency(totalProjectedDebtService)}</p>
                        </div>
                        <div className="min-w-0 rounded-2xl border border-white/80 bg-white/90 p-2.5 sm:p-4">
                          <p className="text-[10px] font-semibold uppercase leading-4 tracking-[0.14em] text-slate-500 sm:text-[11px] sm:tracking-[0.16em]">Est. Loan Payment</p>
                          <p className="mt-1 break-words text-lg font-black tracking-[-0.04em] text-slate-950 sm:mt-2 sm:text-2xl">{formatCurrency(estimatedPayment)}<span className="text-xs font-semibold tracking-normal text-slate-500">/mo</span></p>
                        </div>
                        <div className="min-w-0 rounded-2xl border border-white/80 bg-white/90 p-2.5 sm:p-4">
                          <p className="text-[10px] font-semibold uppercase leading-4 tracking-[0.14em] text-slate-500 sm:text-[11px] sm:tracking-[0.16em]">Requested Loan</p>
                          <p className="mt-1 break-words text-lg font-black tracking-[-0.04em] text-slate-950 sm:mt-2 sm:text-2xl">{formatCurrency(principal)}</p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-2xl border border-white/80 bg-white/90 p-3 sm:p-4">
                        <div className="sm:mt-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">What this means</p>
                          <p className="mt-1 text-sm font-semibold text-slate-950 sm:text-base">{meaningHeadline}</p>
                          <p className="mt-1.5 text-xs leading-5 text-slate-700 sm:mt-2 sm:text-sm sm:leading-6">{dollarTranslation}</p>
                          <p className="mt-2 hidden text-sm leading-6 text-slate-600 sm:block">{dscrStatus.summary}</p>
                        </div>
                        <div className="mt-3 hidden sm:block">
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
                        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 sm:hidden">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Best next move</p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">If the rest of your file is clean, this request may be ready to package for lender review.</p>
                          <Button
                            type="button"
                            onClick={() => handleExploreLoanPackaging('calculator_mobile_top_package', 'Package This Loan')}
                            className="mt-2 h-10 w-full rounded-xl bg-slate-900 text-sm font-bold text-white transition-colors hover:bg-slate-800"
                          >
                            Package This Loan
                          </Button>
                          <Button
                            type="button"
                            onClick={() => handleExploreCashFlowAnalysis('calculator_mobile_top_analysis', 'Run Full Cash Flow Analysis')}
                            className="mt-2 h-9 w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            Run Full Cash Flow Analysis
                          </Button>
                        </div>
                        <p className="mt-3 text-xs leading-5 text-slate-500">
                          This is a high-level estimate based on the numbers entered here. A lender will still look deeper at tax returns, bank statements, trends, and the overall deal structure.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 sm:p-5">
                      <div className="space-y-2 sm:hidden">
                        <details className="rounded-2xl border border-slate-200 bg-slate-50">
                          <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">How a lender may read this</summary>
                          <div className="border-t border-slate-200 px-3 py-2.5">
                            <p className="text-xs leading-5 text-slate-600">{dscrStatus.lenderRead}</p>
                          </div>
                        </details>
                        <details className="rounded-2xl border border-slate-200 bg-slate-50">
                          <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">How we calculated this</summary>
                          <div className="border-t border-slate-200 px-3 py-2.5">
                            <p className="text-xs font-semibold text-slate-700">Monthly Income / Monthly Debt Service = DSCR</p>
                            <p className="mt-1 text-base font-bold tracking-[-0.03em] text-slate-950">
                              {formatCurrency(values.monthlyNetIncome)} / {formatCurrency(totalProjectedDebtService)} = <span className={dscrStatus.valueClassName}>{dscr.toFixed(2)}</span>
                            </p>
                            <p className="mt-1.5 text-xs leading-5 text-slate-600">
                              Lenders compare monthly net income to required monthly debt payments. Many want to see at least {DSCR_BENCHMARK.toFixed(2)}x.
                            </p>
                          </div>
                        </details>
                        <details className="rounded-2xl border border-slate-200 bg-white">
                          <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">Debt breakdown</summary>
                          <div className="space-y-1.5 border-t border-slate-200 px-3 py-2.5">
                            {debtFieldMeta.map((field) => (
                              <div key={`mobile-debt-breakdown-${field.name}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                <span className="text-xs font-medium text-slate-700">{field.shortLabel ?? field.label}</span>
                                <span className="text-xs font-semibold text-slate-950">{formatCurrency(values[field.name])}</span>
                              </div>
                            ))}
                            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                              <div>
                                <span className="text-xs font-semibold text-emerald-950">Estimated Loan Payment</span>
                                <p className="mt-0.5 text-[10px] leading-4 text-emerald-700">{estimatedPaymentSummary}</p>
                              </div>
                              <span className="text-xs font-semibold text-emerald-950">{formatCurrency(estimatedPayment)}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-slate-950 px-3 py-2">
                              <span className="text-xs font-semibold text-white">Total Monthly Debt Service</span>
                              <span className="text-xs font-semibold text-white">{formatCurrency(totalProjectedDebtService)}</span>
                            </div>
                          </div>
                        </details>
                        <details className="rounded-2xl border border-slate-200 bg-slate-50">
                          <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">Loan assumptions</summary>
                          <div className="border-t border-slate-200 px-3 py-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-500">Assumptions used</p>
                              <button
                                type="button"
                                onClick={() => setIsEditingAssumptions((current) => !current)}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700"
                              >
                                <PencilLine className="h-3 w-3" />
                                {isEditingAssumptions ? 'Done' : 'Edit'}
                              </button>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <div className="rounded-xl bg-white px-3 py-2">
                                <p className="text-[10px] font-medium text-slate-500">Purpose</p>
                                <p className="mt-0.5 text-xs font-semibold text-slate-950">{selectedPurposeTitle}</p>
                              </div>
                              <div className="rounded-xl bg-white px-3 py-2">
                                <p className="text-[10px] font-medium text-slate-500">Requested</p>
                                <p className="mt-0.5 text-xs font-semibold text-slate-950">{formatCurrency(principal)}</p>
                              </div>
                              <div className="rounded-xl bg-white px-3 py-2">
                                <p className="text-[10px] font-medium text-slate-500">Term</p>
                                <p className="mt-0.5 text-xs font-semibold text-slate-950">{isLineOfCreditPurpose ? 'LOC' : `${selectedTerm} Months`}</p>
                              </div>
                              <div className="rounded-xl bg-white px-3 py-2">
                                <p className="text-[10px] font-medium text-slate-500">Rate</p>
                                <p className="mt-0.5 text-xs font-semibold text-slate-950">{(selectedRate * 100).toFixed(2)}%</p>
                              </div>
                            </div>
                          </div>
                        </details>
                      </div>
                      <div className="hidden sm:block">
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
                                  {estimatedPaymentSummary}
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
                                {isLineOfCreditPurpose ? (
                                  <>
                                    <p className="mt-1 text-sm font-semibold text-slate-950">Not used for LOC payment</p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">Line-of-credit estimates use full amount x rate / 12.</p>
                                  </>
                                ) : isEditingAssumptions ? (
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
                                {isLineOfCreditPurpose ? (
                                  <>
                                    <p className="mt-1 text-sm font-semibold text-slate-950">0%</p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">LOC estimate assumes the full requested line is outstanding.</p>
                                  </>
                                ) : isEditingAssumptions ? (
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
                                {isLineOfCreditPurpose ? (
                                  <>
                                    <p className="mt-1 text-sm font-semibold text-slate-950">{formatCurrency(0)}</p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">No reduction is applied before estimating the LOC payment.</p>
                                  </>
                                ) : isEditingAssumptions ? (
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
                  </div>
                </section>

                {dscr >= DSCR_BENCHMARK && maxLoanAmountAtBenchmark > 0 && (
                  <section className="rounded-[1.5rem] border border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.96)_0%,rgba(255,255,255,1)_52%,rgba(240,253,250,0.98)_100%)] p-3 shadow-[0_24px_60px_-42px_rgba(16,185,129,0.35)] sm:rounded-[2rem] sm:p-5">
                    <div className="grid gap-3 sm:gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                      <div>
                        <div className="inline-flex items-center rounded-full border border-emerald-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 sm:px-3 sm:text-xs">
                          Above Benchmark
                        </div>
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 sm:mt-3 sm:text-xs sm:tracking-[0.2em]">Bonus Insight</p>
                        <h3 className="mt-1 text-xl font-black tracking-[-0.04em] text-slate-950 sm:mt-2 sm:text-2xl">
                          <span className="sm:hidden">You may qualify for more</span>
                          <span className="hidden sm:inline">You May Qualify For a Larger Loan</span>
                        </h3>
                        <p className="mt-1.5 text-xs leading-5 text-slate-700 sm:mt-3 sm:text-sm sm:leading-6">
                          <span className="sm:hidden">Your DSCR is above the common {DSCR_BENCHMARK.toFixed(2)}x benchmark, which may leave room for additional funding.</span>
                          <span className="hidden sm:inline">Based on your current numbers, your business is performing above the typical lender benchmark of {DSCR_BENCHMARK.toFixed(2)}x DSCR.</span>
                        </p>
                        <p className="mt-3 hidden text-sm leading-6 text-slate-700 sm:block">
                          This means you may be able to support a larger loan while still staying within a comfortable approval range.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div className="rounded-2xl border border-emerald-200 bg-white/95 p-3 sm:p-4">
                          <p className="text-[10px] font-semibold uppercase leading-4 tracking-[0.14em] text-slate-500 sm:text-[11px] sm:tracking-[0.16em]">Estimated Max Loan</p>
                          <p className="mt-1 text-lg font-black tracking-[-0.05em] text-emerald-700 sm:mt-2 sm:text-3xl">{formatCurrency(maxLoanAmountAtBenchmark)}</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-200 bg-white/95 p-3 sm:p-4">
                          <p className="text-[10px] font-semibold uppercase leading-4 tracking-[0.14em] text-slate-500 sm:text-[11px] sm:tracking-[0.16em]">Additional Funding Available</p>
                          <p className="mt-1 text-lg font-black tracking-[-0.05em] text-emerald-700 sm:mt-2 sm:text-3xl">{formatCurrency(additionalCapacity)}</p>
                        </div>
                        <div className="col-span-2 rounded-2xl border border-white/90 bg-white/85 px-3 py-2.5 sm:px-4 sm:py-3">
                          <p className="text-xs font-medium text-slate-600 sm:text-sm">Current request: <span className="font-semibold text-slate-950">{formatCurrency(principal)}</span></p>
                          <p className="mt-2 hidden text-sm leading-6 text-emerald-800 sm:block">Want help structuring this for the best approval odds? We can guide you.</p>
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
                  <section className="relative overflow-hidden rounded-[2rem] border border-sky-200/80 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_38%,#dbeafe_100%)] shadow-[0_28px_70px_-42px_rgba(37,99,235,0.28)]">
                    <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-cyan-300/25 blur-3xl" />
                    <div className="absolute left-0 top-10 h-32 w-32 rounded-full bg-sky-300/20 blur-3xl" />
                    <div className="relative grid gap-0 xl:grid-cols-[0.78fr_1.22fr]">
                      <div className="border-b border-sky-200/80 bg-white/80 p-4 backdrop-blur-sm sm:p-5 xl:border-b-0 xl:border-r">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Best Next Move</p>
                        <h3 className="mt-2 text-[1.25rem] font-black tracking-[-0.04em] text-slate-950 sm:text-[1.5rem] xl:whitespace-nowrap">Strong Position To Move Forward</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          If you meet the common lender criteria below, you are usually ready to move forward with a loan package.
                        </p>

                        <div className="mt-4 grid gap-3">
                          <div className="rounded-[1.6rem] border border-sky-200 bg-[linear-gradient(135deg,rgba(14,165,233,0.1)_0%,rgba(255,255,255,0.98)_100%)] px-4 py-4 shadow-[0_18px_45px_-34px_rgba(14,165,233,0.45)]">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="rounded-2xl border border-sky-100 bg-white/95 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Time In Business</p>
                                <p className="mt-1 text-base font-black text-slate-950">{nextStepConfig.businessAge}</p>
                                <p className="mt-1.5 text-xs leading-5 text-slate-600">Preferred by many lenders for stability.</p>
                              </div>
                              <div className="rounded-2xl border border-sky-100 bg-white/95 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Credit Range</p>
                                <p className="mt-1 text-base font-black text-slate-950">{nextStepConfig.creditRange}</p>
                                <p className="mt-1.5 text-xs leading-5 text-slate-600">Usually enough to open solid lender options.</p>
                              </div>
                            </div>
                            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                              <p className="text-sm font-semibold text-emerald-900">If you meet these and your DSCR stays above {DSCR_BENCHMARK.toFixed(2)}, you&apos;re typically ready to move forward with a loan package.</p>
                            </div>
                            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
                              If you&apos;re below either one, you may still have paths through SBA options, a smaller request, a longer term, or stronger cash flow support.
                            </div>
                          </div>
                        </div>

                        <p className="mt-3 text-[11px] leading-5 text-slate-500">
                          Rough guidance only. Lenders also review documents, liquidity, collateral, industry, and deal structure.
                        </p>
                      </div>

                      <div className="p-4 sm:p-5">
                        <div className="rounded-[1.8rem] border border-sky-300/60 bg-[linear-gradient(145deg,rgba(15,23,42,0.98)_0%,rgba(15,118,110,0.95)_0.1%,rgba(30,41,59,0.96)_28%,rgba(30,64,175,0.94)_100%)] p-4 text-white shadow-[0_32px_80px_-44px_rgba(30,64,175,0.65)]">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200/90">Loan Services Path</p>
                              <h4 className="mt-1.5 text-[1.45rem] font-black tracking-[-0.04em] text-white">Turn This Into A Lender-Ready Deal</h4>
                            </div>
                            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-100">
                              Smartest Next Move
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-6 text-sky-50/92">
                            Your DSCR suggests this request is strong enough to take seriously. The next step is choosing how you want to move it forward.
                          </p>

                          <div className="mt-4 grid gap-3 md:grid-cols-[1.12fr_0.88fr]">
                            <div className="group rounded-[1.6rem] border border-cyan-300/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.08)_100%)] p-4 shadow-[0_22px_55px_-36px_rgba(34,211,238,0.55)] backdrop-blur-sm">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">Recommended Path</p>
                                  <p className="mt-1 text-lg font-black tracking-[-0.03em] text-white">Brokered Help</p>
                                </div>
                                <span className="rounded-full bg-cyan-300/18 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100">Recommended</span>
                              </div>
                              <p className="mt-2 text-sm leading-6 text-sky-50/90">Best if you want expert help presenting, packaging, and placing the deal with lenders.</p>
                              <div className="mt-3 grid gap-2">
                                <div className="rounded-2xl border border-white/12 bg-white/8 px-3 py-2.5 text-sm leading-5 text-sky-50/90">We structure the deal so it reads better to lenders.</div>
                                <div className="rounded-2xl border border-white/12 bg-white/8 px-3 py-2.5 text-sm leading-5 text-sky-50/90">We package the file and help place it with lender contacts.</div>
                              </div>
                            </div>

                            <div className="rounded-[1.6rem] border border-white/14 bg-white/8 p-4 backdrop-blur-sm">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">Alternative</p>
                              <p className="mt-1 text-lg font-black tracking-[-0.03em] text-white">Packaging Only</p>
                              <p className="mt-2 text-sm leading-6 text-slate-100/90">Best if you already have lender relationships and just need a cleaner file.</p>
                              <div className="mt-3 grid gap-2">
                                <div className="rounded-2xl border border-white/12 bg-white/8 px-3 py-2.5 text-sm leading-5 text-slate-100/90">We organize the documents, numbers, and request story.</div>
                                <div className="rounded-2xl border border-white/12 bg-white/8 px-3 py-2.5 text-sm leading-5 text-slate-100/90">You handle the outreach yourself.</div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 rounded-[1.4rem] border border-sky-300/30 bg-[linear-gradient(135deg,rgba(125,211,252,0.14)_0%,rgba(255,255,255,0.07)_100%)] px-4 py-3">
                            <p className="text-sm font-semibold text-white">Why This Step Matters</p>
                            <p className="mt-1.5 text-sm leading-6 text-sky-50/90">
                              Most deals do not stall because of the raw numbers alone. They stall because the request is not packaged and positioned clearly enough for a lender to say yes.
                            </p>
                          </div>

                          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                            <Button
                              className="h-11 flex-1 rounded-2xl bg-[linear-gradient(135deg,#67e8f9_0%,#38bdf8_45%,#2563eb_100%)] text-sm font-bold text-slate-950 shadow-[0_20px_50px_-32px_rgba(56,189,248,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105"
                              size="lg"
                              onClick={() => handleStartLoanBrokering('calculator_packaging_brokering_primary')}
                              id="dscr-calc-cta-start-brokering"
                            >
                              Move Forward With Expert Help
                            </Button>
                            <Button
                              className="h-11 flex-1 rounded-2xl border border-white/15 bg-white/10 text-sm font-semibold text-white transition-colors hover:bg-white/14"
                              size="lg"
                              onClick={() => handleExploreLoanPackaging('calculator_packaging_only_secondary', 'Just Get My File Lender-Ready')}
                              id="dscr-calc-cta-packaging-only"
                            >
                              Just Get My File Lender-Ready
                            </Button>
                          </div>
                          {shouldShowCashFlowAnalysisUpsell && (
                            <Button
                              className="mt-2.5 h-10 w-full rounded-2xl border border-cyan-300/28 bg-cyan-300/10 text-sm font-semibold text-cyan-50 transition-colors hover:bg-cyan-300/15"
                              size="lg"
                              onClick={() => handleExploreCashFlowAnalysis('calculator_packaging_secondary_analysis')}
                              id="dscr-calc-cta-secondary-analysis"
                            >
                              Validate With Full Analysis First
                            </Button>
                          )}
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
