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
import { loanPurposes } from '@/lib/loanPurposes';
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
}

const formatCurrency = (value: number): string => {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

const parseCurrencyInput = (value: string): number => {
  return parseInt(value.replace(/[$,]/g, '')) || 0;
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
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:border-slate-300 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
    >
      <Info className="h-4 w-4" />
    </button>
    <div className="pointer-events-none absolute right-0 top-10 z-10 w-64 rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-100 opacity-0 shadow-2xl transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 translate-y-1">
      {text}
    </div>
  </div>
);

type DscrStatus = {
  label: string;
  badgeClassName: string;
  valueClassName: string;
  borderClassName: string;
  panelClassName: string;
  summary: string;
  lenderRead: string;
};

type NextStepConfig = {
  title: string;
  description: string;
  businessAge: string;
  businessAgeNote: string;
  creditRange: string;
  creditNote: string;
  serviceEyebrow: string;
  serviceTitle: string;
  serviceDescription: string;
  serviceSupportLine: string;
  primaryCtaLabel: string;
  primaryCtaKind: 'analysis' | 'packaging';
};

function getDscrStatus(value: number): DscrStatus {
  if (value < 1) {
    return {
      label: 'Needs Improvement',
      badgeClassName: 'border-rose-200 bg-rose-50 text-rose-700',
      valueClassName: 'text-rose-600',
      borderClassName: 'border-rose-200',
      panelClassName: 'bg-rose-50/70',
      summary: 'that is a weak result for this request. The payment looks too high for the business’s monthly cash flow, and on this quick check the business does not appear to have enough room to carry it.',
      lenderRead: 'at this level, most lenders would see the request as unaffordable unless the amount is reduced, the payment is lowered, or the business shows stronger cash flow elsewhere in the file. This quick DSCR also does not include possible income adjustments that can sometimes improve the result.',
    };
  }

  if (value < 1.1) {
    return {
      label: 'Very Tight',
      badgeClassName: 'border-orange-200 bg-orange-50 text-orange-700',
      valueClassName: 'text-orange-600',
      borderClassName: 'border-orange-200',
      panelClassName: 'bg-orange-50/70',
      summary: 'that is a very tight result. The business may be able to cover the payment on paper, but there is almost no room for a slower month or an unexpected expense.',
      lenderRead: 'at this level, most lenders would still see the request as too tight. Even if the business nearly covers the payment, the deal can still feel risky because there is not much room for error. A fuller review can sometimes improve the DSCR if there are valid items that should be added back to income.',
    };
  }

  if (value < 1.25) {
    return {
      label: 'Borderline',
      badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
      valueClassName: 'text-amber-600',
      borderClassName: 'border-amber-200',
      panelClassName: 'bg-amber-50/70',
      summary: 'that is a borderline result. The business is getting closer to a comfortable level, but the request still looks a little high for the current cash flow.',
      lenderRead: 'at this level, a lender may see potential, but would often want a lower request, a lower payment, or stronger file support before feeling comfortable moving forward. This is also the range where a fuller review can make a meaningful difference if there are valid items that should be added back to income.',
    };
  }

  if (value < 1.4) {
    return {
      label: 'Solid Starting Point',
      badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      valueClassName: 'text-emerald-600',
      borderClassName: 'border-emerald-200',
      panelClassName: 'bg-emerald-50/80',
      summary: 'that is a good starting result. The business appears to bring in enough income each month to cover the debt payments with some room left over.',
      lenderRead: 'at this level, a lender may view the payment as affordable at a first look. Approval would still depend on credit, tax returns, bank statements, and the full strength of the file.',
    };
  }

  if (value < 1.75) {
    return {
      label: 'Strong Position',
      badgeClassName: 'border-teal-200 bg-teal-50 text-teal-700',
      valueClassName: 'text-teal-600',
      borderClassName: 'border-teal-200',
      panelClassName: 'bg-teal-50/80',
      summary: 'that is a strong result. The business appears to have a good amount of room above the required debt payments, which makes the request look more comfortable.',
      lenderRead: 'at this level, a lender will often read this as a business that can handle the payment with solid room to spare. If the rest of the file is consistent, this usually supports a stronger first impression.',
    };
  }

  return {
    label: 'Excellent Cushion',
    badgeClassName: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    valueClassName: 'text-cyan-600',
    borderClassName: 'border-cyan-200',
    panelClassName: 'bg-cyan-50/80',
    summary: 'that is an excellent result. The business appears to have a wide gap between its monthly income and its required debt payments.',
    lenderRead: 'at this level, many lenders would read this as a strong sign that the business can comfortably afford the payment. DSCR alone does not decide approval, but it can make the request easier to support if the rest of the file looks clean.',
  };
}

function getNextStepConfig(value: number): NextStepConfig {
  if (value < 1) {
    return {
      title: 'Strengthen The File Before You Apply',
      description: 'This request likely needs a smaller size, stronger structure, or deeper review before it looks financeable to most lenders.',
      businessAge: '2+ Years Preferred',
      businessAgeNote: 'Time in business helps, but cash flow is still the main issue at this range.',
      creditRange: 'Often 700+',
      creditNote: 'Better credit helps, but it usually will not offset a DSCR below 1.00 by itself.',
      serviceEyebrow: 'Recommended First Step',
      serviceTitle: 'Start With A Bank-Level Analysis',
      serviceDescription: 'Before packaging the request, see how the file is likely to read to a lender and where the structure may need work.',
      serviceSupportLine: 'Best for figuring out whether to lower the request, change the structure, or wait before applying.',
      primaryCtaLabel: 'Get My Bank-Level Analysis',
      primaryCtaKind: 'analysis',
    };
  }

  if (value < 1.1) {
    return {
      title: 'Get The Structure Tighter First',
      description: 'You may be close, but this still looks tight enough that most lenders would want a cleaner structure or stronger support.',
      businessAge: '2+ Years Preferred',
      businessAgeNote: 'A longer operating track record can help, but the request may still feel strained here.',
      creditRange: 'Often 680-720+',
      creditNote: 'Stronger credit can help, but many lenders would still want the request improved.',
      serviceEyebrow: 'Recommended First Step',
      serviceTitle: 'Use The Bank-Level Analysis First',
      serviceDescription: 'Pressure-test the request before you spend time packaging it. This is usually the smarter move in a very tight range.',
      serviceSupportLine: 'Best for identifying what needs to change before you present the file to lenders.',
      primaryCtaLabel: 'Get My Bank-Level Analysis',
      primaryCtaKind: 'analysis',
    };
  }

  if (value < 1.25) {
    return {
      title: 'You May Be Close, But Not Quite Ready',
      description: 'There may be a workable deal here, but many lenders would still want a smaller request, stronger support, or better overall structure.',
      businessAge: '2+ Years Is Common',
      businessAgeNote: 'More operating history can make a borderline request easier to explain.',
      creditRange: 'Often 660-700+',
      creditNote: 'This is the zone where credit quality and a clean package start mattering more.',
      serviceEyebrow: 'Recommended First Step',
      serviceTitle: 'Dial In The File Before Packaging',
      serviceDescription: 'A bank-level review can help you decide whether the request should be resized or repackaged before moving forward.',
      serviceSupportLine: 'Best for borrowers who may be financeable, but need better structure before lender outreach.',
      primaryCtaLabel: 'Get My Bank-Level Analysis',
      primaryCtaKind: 'analysis',
    };
  }

  if (value < 1.4) {
    return {
      title: 'You Look Close To Packaging-Ready',
      description: 'You are above the common 1.25x benchmark, which usually means it makes sense to start organizing the file the way a lender expects to see it.',
      businessAge: '2+ Years Is Common',
      businessAgeNote: 'That track record is often enough for packaging to make sense if the rest of the file is clean.',
      creditRange: 'Often 640-680+',
      creditNote: 'Stronger bank channels may still prefer 680+, but this is a realistic starting zone.',
      serviceEyebrow: 'Recommended Next Step',
      serviceTitle: 'Start Building Your Loan Package',
      serviceDescription: 'Turn this high-level result into a polished lender-ready file with the right documents, summaries, and story.',
      serviceSupportLine: 'Best for businesses that look financeable and want to present the request professionally.',
      primaryCtaLabel: 'Explore Loan Packaging',
      primaryCtaKind: 'packaging',
    };
  }

  if (value < 1.75) {
    return {
      title: 'You Look Ready To Package This Well',
      description: 'This is a stronger repayment position. If your credit and business history are in range, packaging the request is often the right move.',
      businessAge: '2+ Years Is Common',
      businessAgeNote: 'A solid operating history plus this DSCR usually creates a more comfortable lender conversation.',
      creditRange: 'Often 620-680+',
      creditNote: 'Stronger credit can still improve lender options, pricing, and flexibility.',
      serviceEyebrow: 'Recommended Next Step',
      serviceTitle: 'Package The File Before You Apply',
      serviceDescription: 'A strong DSCR deserves a polished submission. We help organize the numbers, documents, and narrative the way lenders want to see them.',
      serviceSupportLine: 'Best for borrowers who look solid on paper and want to maximize approval odds.',
      primaryCtaLabel: 'Explore Loan Packaging',
      primaryCtaKind: 'packaging',
    };
  }

  return {
    title: 'You Are In A Strong Position To Package',
    description: 'This level of coverage gives you real room to present the request from a position of strength, assuming the rest of the file is clean.',
    businessAge: '2+ Years Still Helps',
    businessAgeNote: 'Lenders still care about operating history, but this DSCR gives you a stronger starting point.',
    creditRange: 'Often 620+; stricter banks may prefer 680+',
    creditNote: 'At this level, stronger credit can broaden your lender options more than it changes basic eligibility.',
    serviceEyebrow: 'Recommended Next Step',
    serviceTitle: 'Turn A Strong File Into A Lender-Ready Package',
    serviceDescription: 'If the business is performing this well, the next smart move is packaging the request cleanly so the strength of the file comes through.',
    serviceSupportLine: 'Best for borrowers who appear ready and want a more polished, lender-facing package.',
    primaryCtaLabel: 'Explore Loan Packaging',
    primaryCtaKind: 'packaging',
  };
}

function calculatePrincipalFromPaymentCapacity(
  monthlyPaymentCapacity: number,
  annualRate: number,
  termMonths: number,
  isInterestOnly: boolean,
) {
  if (monthlyPaymentCapacity <= 0) return 0;
  const monthlyRate = annualRate / 12;

  if (isInterestOnly) {
    if (monthlyRate <= 0) return 0;
    return monthlyPaymentCapacity / monthlyRate;
  }

  if (termMonths <= 0) return 0;
  if (monthlyRate <= 0) return monthlyPaymentCapacity * termMonths;

  const factor = (Math.pow(1 + monthlyRate, termMonths) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, termMonths));
  return monthlyPaymentCapacity * factor;
}

export const DscrGauge: React.FC<{ value: number }> = ({ value }) => {
  const status = getDscrStatus(value);
  const gaugeMax = 1.75;
  const pointerPosition = Math.max(0, Math.min((value / gaugeMax) * 100, 100));
  const benchmarkPosition = (1.25 / gaugeMax) * 100;

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

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Bank Benchmark</p>
          <p className="mt-1 text-lg font-bold text-slate-950">1.25x</p>
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
              1.25x
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
          <span>1.25 Standard</span>
          <span>1.75+</span>
        </div>
      </div>
    </div>
  );
};

const InputField: React.FC<{
  label: string;
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
}> = ({ label, name, placeholder, tooltip, description, errorMessage, value, onChange, required, id, icon: Icon }) => {
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
    <div className="rounded-[20px] border border-slate-200 bg-white p-3.5 shadow-[0_14px_45px_-36px_rgba(15,23,42,0.8)] transition-all duration-200 focus-within:-translate-y-0.5 focus-within:border-slate-900 focus-within:shadow-[0_24px_60px_-40px_rgba(15,23,42,0.75)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Icon className="h-4 w-4" />
          </div>
          <label htmlFor={id || name} className="truncate text-sm font-semibold tracking-[0.01em] text-slate-900">
            {label}
            {required ? <span className="ml-1 text-emerald-600">*</span> : null}
          </label>
        </div>
        <Tooltip text={tooltip} />
      </div>
      <p className="mt-2 text-xs leading-4.5 text-slate-500">{description}</p>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold text-slate-400">$</span>
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
          className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-base font-semibold text-slate-900 shadow-inner shadow-slate-200/40 transition-all duration-200 placeholder:font-medium placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-200"
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

function calculateMonthlyLoanPayment(principal: number, annualRate: number, termMonths: number, isInterestOnly: boolean = false) {
  if (!principal || !annualRate) return 0;
  const monthlyRate = annualRate / 12;
  
  if (isInterestOnly) {
    // Interest-only payment calculation
    return principal * monthlyRate;
  }
  
  if (!termMonths) return 0;
  // Regular amortizing payment calculation
  return (
    principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)
  ) / (Math.pow(1 + monthlyRate, termMonths) - 1);
}

const DscrQuickCalculator: React.FC<DscrQuickCalculatorProps> = ({
  initialValues,
  onValuesChange,
  embedded = false,
}) => {
  const [, setError] = React.useState<string>('');
  const router = useRouter();
  const comprehensiveCheckoutPath = '/checkout/cash_flow_analysis';

  const handleExploreLoanPackaging = () => {
    router.push('/loan-services');
  };

  const handleStartComprehensiveAnalysis = () => {
    router.push(comprehensiveCheckoutPath);
  };
  
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

  // Use a type-safe array of loan purpose keys for the dropdown
  const loanPurposeKeys = Object.keys(loanPurposes) as (keyof typeof loanPurposes)[];

  const defaultPurpose = loanPurposes['Working Capital']!;
  const selectedPurpose = loanPurpose ? loanPurposes[loanPurpose] : null;
  const activePurpose = selectedPurpose ?? defaultPurpose;
  const [customTermMonths, setCustomTermMonths] = useState(defaultPurpose.defaultTerm);
  const [customRatePercent, setCustomRatePercent] = useState(defaultPurpose.defaultRate * 100);
  const [customDownPaymentPercent, setCustomDownPaymentPercent] = useState((defaultPurpose.defaultDownPaymentPct ?? 0) * 100);
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
    setCustomRatePercent(Number.isNaN(numericValue) ? 0 : Math.min(Math.max(numericValue, 0), 100));
  };

  const handleTermSelectChange = (value: string) => {
    const numericValue = parseInt(value, 10);
    setCustomTermMonths(Number.isNaN(numericValue) ? defaultPurpose.defaultTerm : numericValue);
  };

  const handleDownPaymentPercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d.]/g, '');
    const numericValue = parseFloat(rawValue);
    setCustomDownPaymentPercent(Number.isNaN(numericValue) ? 0 : Math.min(Math.max(numericValue, 0), 100));
  };

  const handleDownPaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const numericValue = parseInt(rawValue, 10);
    const nextAmount = Number.isNaN(numericValue) ? 0 : Math.min(Math.max(numericValue, 0), principal);
    const nextPercent = principal > 0 ? (nextAmount / principal) * 100 : 0;
    setCustomDownPaymentPercent(Number(nextPercent.toFixed(2)));
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
  const dscrStatus = dscr !== null ? getDscrStatus(dscr) : null;
  const nextStepConfig = dscr !== null ? getNextStepConfig(dscr) : null;
  const dscrDisplay = dscr !== null ? dscr.toFixed(2) : '';
  const isBelowBenchmark = dscr !== null && dscr < 1.25;
  const shouldShowCashFlowAnalysisUpsell = dscr !== null && dscr > 1 && dscr < 1.75;
  const defaultPurposeMeta = loanPurposeMeta['Working Capital']!;
  const selectedPurposeMeta = loanPurposeMeta[loanPurpose] ?? defaultPurposeMeta;
  const selectedPurposeTitle = selectedPurpose?.title ?? 'Select Loan Purpose';
  const selectedPurposeDescription = selectedPurpose?.description ?? 'Choose the option that best matches what you want the funds to do for your business.';
  const SelectedPurposeIcon = selectedPurposeMeta.icon;
  const benchmarkMonthlyCapacity = Math.max((values.monthlyNetIncome / 1.25) - totalMonthlyDebtPayments, 0);
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

        <div className={embedded ? 'relative' : 'relative p-4 sm:p-4 lg:p-5'}>
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

          <form className={embedded ? 'space-y-4' : 'mt-3 space-y-4'} onSubmit={(e) => e.preventDefault()}>
            <div className="grid gap-4 xl:grid-cols-[2fr_3fr]">
              <section className="rounded-[24px] border border-slate-200 bg-white/90 p-3.5 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.7)] backdrop-blur">
                <div className="flex flex-col gap-2 border-b border-slate-200 pb-2.5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Loan Request</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">Main inputs</h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
                    <Clock3 className="h-4 w-4 text-slate-500" />
                    Under 1 minute
                  </div>
                </div>

                <div className="mt-2.5 grid gap-3">
                  <InputField
                    label="Monthly Net Income"
                    name="monthlyNetIncome"
                    placeholder="e.g. 10,000"
                    tooltip="Use your business's average monthly profit after operating expenses, before any existing or new loan payments. If you only have an annual number, divide it by 12 for a quick estimate."
                    description="What your business keeps each month after expenses."
                    errorMessage={validationError?.field === 'monthlyNetIncome' ? validationError.message : undefined}
                    value={values.monthlyNetIncome}
                    onChange={handleInputChange}
                    required
                    icon={TrendingUp}
                  />
                  <InputField
                    label="Loan Amount"
                    name="loanAmount"
                    placeholder="e.g. 100,000"
                    tooltip="How much funding are you looking for?"
                    description="Enter the amount you want to test. We’ll also estimate the loan amount your cash flow may support at 1.25x DSCR, the number banks prefer to see at minimum."
                    errorMessage={validationError?.field === 'dscr-calc-form-loan-amount' ? validationError.message : undefined}
                    value={parseInt(loanAmount.replace(/[$,]/g, '')) || 0}
                    onChange={handleLoanAmountChange}
                    required
                    id="dscr-calc-form-loan-amount"
                    icon={BadgeDollarSign}
                  />
                </div>

                <div className="mt-2.5 rounded-[20px] border border-slate-200 bg-slate-50/80 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Loan Purpose</p>
                      <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">What will this loan be used for?</h3>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                      <SelectedPurposeIcon className="h-4 w-4" />
                      {selectedPurposeMeta.eyebrow}
                    </div>
                  </div>

                  <Select value={loanPurpose} onValueChange={handleLoanPurposeChange}>
                    <SelectTrigger
                      id="loanPurpose"
                      className="mt-3 h-auto min-h-14 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm outline-none transition-all duration-200 focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                      data-ga-id="dscr-calc-form-loan-purpose"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                          <SelectedPurposeIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-950">
                            {selectedPurposeTitle}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-slate-500">
                            {loanPurpose ? 'Choose The Best Match For What You Need' : 'Select A Loan Purpose To Continue'}
                          </div>
                        </div>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                      {loanPurposeKeys.map((purpose) => {
                        const purposeConfig = loanPurposes[purpose]!;
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
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    {selectedPurposeDescription}
                  </p>
                </div>
              </section>

              <section className="rounded-[24px] border border-slate-200 bg-white/90 p-3.5 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.7)] backdrop-blur">
                <div className="flex flex-col gap-2 border-b border-slate-200 pb-2.5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Existing Debt</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">Enter your required monthly payments</h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900">
                    <ShieldCheck className="h-4 w-4 text-amber-700" />
                    We don't need balances, just monthly payments
                  </div>
                </div>

                <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                  {debtFieldMeta.map((field) => (
                    <InputField
                      key={field.name}
                      label={field.label}
                      name={field.name}
                      placeholder={field.placeholder}
                      tooltip={field.tooltip}
                      description={field.description}
                      value={values[field.name]}
                      onChange={handleInputChange}
                      id={field.id}
                      icon={field.icon}
                    />
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-3 flex flex-col items-center">
              <div className="w-full max-w-sm">
                <Button
                  onClick={(e) => {
                    if (!validateRequiredFields()) {
                      e.preventDefault();
                      return;
                    }
                    setError('');
                    handleCalculate();
                  }}
                  className="h-11 w-full rounded-2xl bg-emerald-500 px-6 text-base font-semibold text-slate-950 shadow-[0_20px_60px_-30px_rgba(16,185,129,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-400"
                  id="dscr-calc-btn-calculate"
                >
                  Calculate DSCR
                  <ArrowRight className="ml-2 h-5 w-5" />
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
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${dscrStatus.badgeClassName}`}>
                        {dscrStatus.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-0 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className={`border-b border-slate-200/80 p-4 sm:p-5 xl:border-b-0 xl:border-r ${dscrStatus.panelClassName}`}>
                      <DscrGauge value={dscr} />

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/80 bg-white/90 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Monthly Income</p>
                          <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-emerald-700">{formatCurrency(values.monthlyNetIncome)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/80 bg-white/90 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Monthly Debt Service</p>
                          <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-rose-700">{formatCurrency(totalProjectedDebtService)}</p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-2xl border border-white/80 bg-white/90 p-4">
                        <div className="mt-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">What Your DSCR Suggests</p>
                          <p className="mt-1 text-base font-semibold text-slate-950">Since your DSCR is {dscrDisplay}, {dscrStatus.summary}</p>
                        </div>
                        <div className="mt-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Lender Read</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">At {dscrDisplay}, {dscrStatus.lenderRead}</p>
                        </div>
                        {isBelowBenchmark && (
                          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3">
                            <p className="text-sm leading-6 text-amber-950">
                              This quick check does not include every possible income adjustment. In the full cash flow analysis, we look for valid items that may increase the income used in your DSCR and improve the result.
                            </p>
                            <Button
                              type="button"
                              onClick={handleStartComprehensiveAnalysis}
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
                            Lenders compare your monthly net income to your total required monthly debt payments. Most want to see at least 1.25x.
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
                              onClick={() => setIsEditingAssumptions((current) => !current)}
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
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="rounded-2xl border border-white bg-white px-4 py-3">
                                <p className="text-xs font-medium text-slate-500">{isEditingAssumptions ? 'Term (Months)' : 'Term'}</p>
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
                              <div className="rounded-2xl border border-white bg-white px-4 py-3">
                                <p className="text-xs font-medium text-slate-500">{isEditingAssumptions ? 'Rate (%)' : 'Rate'}</p>
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
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className={`rounded-2xl border border-white bg-white px-4 py-3 ${isEditingAssumptions ? 'sm:col-span-2' : ''}`}>
                                <p className="text-xs font-medium text-slate-500">{isEditingAssumptions ? 'Down Payment (%)' : 'Down Payment'}</p>
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
                              <div className={`rounded-2xl border border-white bg-white px-4 py-3 ${isEditingAssumptions ? 'sm:col-span-2' : ''}`}>
                                <p className="text-xs font-medium text-slate-500">Down Payment Amount</p>
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

                      {dscr < 1.25 && (
                        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">1.25x Target</p>
                              <h4 className="mt-1 text-lg font-bold tracking-[-0.03em] text-slate-950">
                                {maxLoanAmountAtBenchmark > 0 ? 'Estimated Loan Amount You Could Afford At 1.25x' : 'Current Numbers May Not Support A New Loan At 1.25x'}
                              </h4>
                              <p className="mt-2 text-sm leading-6 text-slate-700">
                                {maxLoanAmountAtBenchmark > 0
                                  ? `Based on your current income, existing monthly debt, and the loan assumptions above, this is the estimated loan amount that would bring your DSCR up to the common 1.25x benchmark.`
                                  : `Based on your current income and existing monthly debt payments, this quick check does not show room for an additional loan while staying at 1.25x DSCR.`}
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
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Amount Above 1.25x Target</p>
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

                {dscr >= 1.25 && maxLoanAmountAtBenchmark > 0 && (
                  <section className="rounded-[2rem] border border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.96)_0%,rgba(255,255,255,1)_52%,rgba(240,253,250,0.98)_100%)] p-4 shadow-[0_24px_60px_-42px_rgba(16,185,129,0.35)] sm:p-5">
                    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                      <div>
                        <div className="inline-flex items-center rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Above Benchmark
                        </div>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Bonus Insight</p>
                        <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">You May Qualify For a Larger Loan</h3>
                        <p className="mt-3 text-sm leading-6 text-slate-700">
                          Based on your current numbers, your business is performing above the typical lender benchmark of 1.25x DSCR.
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

                {shouldShowCashFlowAnalysisUpsell && (
                  <section className="rounded-[2rem] border border-slate-200 bg-slate-950 p-4 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.8)] sm:p-5">
                    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">Start Here First</span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">Bank-Level Analysis</span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">EBITDA Review</span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">DSCR Recheck</span>
                        </div>
                        <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">Run The Full Cash Flow Analysis</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-200">
                          Before you package the request, we can show you the deeper bank-level view. We calculate EBITDA, review income adjustments, re-check DSCR, and show whether the deal really looks strong enough as-is.
                        </p>

                        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <p className="text-sm font-semibold text-white">See What The Bank Will Actually Focus On</p>
                            <p className="mt-1.5 text-sm leading-6 text-slate-300">Go beyond the quick estimate and see the repayment story a lender will care about most.</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <p className="text-sm font-semibold text-white">Catch Income Adjustments The Quick Tool Misses</p>
                            <p className="mt-1.5 text-sm leading-6 text-slate-300">We review whether your numbers should be adjusted to show a more complete picture of the business.</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <p className="text-sm font-semibold text-white">Know Whether You&apos;re Truly Ready</p>
                            <p className="mt-1.5 text-sm leading-6 text-slate-300">Leave with a clearer answer on whether to move forward, lower the request, or improve the structure first.</p>
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
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Why It Helps</p>
                        <div className="mt-3 space-y-2.5">
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <p className="text-sm font-semibold text-white">Confirms The Real Strength Of The Deal</p>
                            <p className="mt-1.5 text-sm leading-6 text-slate-300">You can see whether your current request still makes sense once the numbers are reviewed more like a bank would review them.</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <p className="text-sm font-semibold text-white">Helps You Avoid Packaging Too Early</p>
                            <p className="mt-1.5 text-sm leading-6 text-slate-300">If something needs to change first, it is better to find that out here than after building the package.</p>
                          </div>
                        </div>
                        <Button
                          className="mt-4 h-11 w-full rounded-2xl bg-white text-base font-bold text-slate-950 transition-colors hover:bg-slate-100"
                          size="lg"
                          onClick={handleStartComprehensiveAnalysis}
                          id="dscr-calc-cta-cash-flow-analysis"
                        >
                          Start Comprehensive Analysis
                        </Button>
                        <p className="mt-2.5 text-center text-xs leading-5 text-slate-400">
                          Best for borrowers who want a clearer bank-level read before packaging or applying.
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {dscr >= 1.25 && nextStepConfig && (
                  <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.76)_0%,rgba(255,255,255,1)_44%,rgba(239,246,255,0.9)_100%)] shadow-[0_24px_60px_-42px_rgba(15,23,42,0.35)]">
                    <div className="grid gap-0 xl:grid-cols-[0.9fr_1.1fr]">
                      <div className="border-b border-slate-200/80 p-4 sm:p-5 xl:border-b-0 xl:border-r">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Next Step</p>
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
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Loan Packaging</p>
                              <h4 className="mt-1.5 text-[1.55rem] font-black tracking-[-0.04em] text-slate-950">{nextStepConfig.serviceTitle}</h4>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                              Best When You&apos;re Ready To Apply
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-6 text-slate-700">
                            {nextStepConfig.serviceDescription}
                          </p>

                          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-sm font-semibold text-slate-950">Lender-Ready Package</p>
                              <p className="mt-1.5 text-sm leading-6 text-slate-600">Organize the request, documents, summaries, and story into something you can present with confidence.</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-sm font-semibold text-slate-950">Guidance That Moves The Deal Forward</p>
                              <p className="mt-1.5 text-sm leading-6 text-slate-600">We help you present the file more professionally so lender conversations start from a stronger place.</p>
                            </div>
                          </div>

                          <Button
                            className="mt-4 h-11 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-base font-bold text-white shadow-[0_18px_50px_-30px_rgba(16,185,129,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-600 hover:to-green-700"
                            size="lg"
                            onClick={handleExploreLoanPackaging}
                            id="dscr-calc-cta-start-checkout"
                          >
                            {nextStepConfig.primaryCtaLabel}
                          </Button>
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
