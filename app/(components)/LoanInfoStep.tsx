import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Briefcase,
  Building2,
  Calculator,
  Clock3,
  Handshake,
  Package,
  Truck,
  Wallet,
  Wrench,
} from 'lucide-react';
import { Input } from "@/app/(components)/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/app/(components)/ui/select';
import { useToast } from '@/app/(components)/shared/Toast';
import { cn } from '@/lib/utils';
import { loanPurposes, type LoanPurpose } from '@/lib/loanPurposes';
import FormField from '@/app/(components)/templates/shared/FormField';
import FormSection from '@/app/(components)/templates/shared/FormSection';

export interface LoanInfoData {
  businessName: string;
  firstName: string;
  lastName: string;
  loanPurpose: string;
  desiredAmount: string;
  estimatedPayment: string;
  downPayment: string;
  downPayment293: string;
  proposedLoan: string;
  term: string;
  interestRate: string;
  annualizedLoan: string;
  id?: string;
}

interface LoanInfoStepProps {
  isFormValid?: (isValid: boolean) => void;
  onFormDataChange: (data: LoanInfoData) => void;
  initialData: LoanInfoData | null;
}

export interface LoanInfoStepRef {
  validate: () => boolean;
}

const defaultLoanInfoData: LoanInfoData = {
  businessName: '',
  firstName: '',
  lastName: '',
  loanPurpose: '',
  desiredAmount: '',
  estimatedPayment: '',
  downPayment: '',
  downPayment293: '',
  proposedLoan: '',
  term: '',
  interestRate: '',
  annualizedLoan: '',
};

const loanPurposeKeys = Object.keys(loanPurposes) as (keyof typeof loanPurposes)[];
const commonTermOptions = [12, 24, 36, 48, 60, 72, 84, 120, 180, 240, 300, 360];

const loanPurposeMeta: Record<string, { icon: LucideIcon; eyebrow: string }> = {
  'Working Capital': { icon: Briefcase, eyebrow: 'Operations' },
  'Equipment Purchase': { icon: Wrench, eyebrow: 'Assets' },
  'Vehicle Purchase': { icon: Truck, eyebrow: 'Fleet' },
  'Inventory Purchase': { icon: Package, eyebrow: 'Stock' },
  'Real Estate Acquisition or Development': { icon: Building2, eyebrow: 'Property' },
  'Business Acquisition': { icon: Handshake, eyebrow: 'Expansion' },
  'Unexpected Expenses': { icon: AlertTriangle, eyebrow: 'Emergency' },
  'Line of Credit': { icon: Wallet, eyebrow: 'Flexible' },
  'Debt Refinance / Consolidation': { icon: Calculator, eyebrow: 'Restructure' },
  'Business Expansion / New Location': { icon: Briefcase, eyebrow: 'Growth' },
  'Bridge Financing': { icon: Clock3, eyebrow: 'Short-Term' },
  Other: { icon: Calculator, eyebrow: 'Custom' },
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatCurrencyInput = (value: string): string => {
  if (!value) return '';
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) return '';
  return `$${parseInt(digits, 10).toLocaleString('en-US')}`;
};

const parseCurrencyNumber = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const digits = String(value).replace(/[^\d]/g, '');
  if (!digits) return 0;
  const parsed = parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sanitizeDecimalInput = (value: string | number | null | undefined): string => {
  if (value == null) return '';
  const sanitized = String(value).replace(/[^\d.]/g, '');
  if (!sanitized) return '';
  const parsed = parseFloat(sanitized);
  if (!Number.isFinite(parsed)) return '';
  return parsed % 1 === 0 ? String(parsed) : parsed.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
};

const formatPercentValue = (value: number): string => {
  const normalized = clamp(Number.isFinite(value) ? value : 0, 0, 100);
  return normalized % 1 === 0
    ? String(normalized)
    : normalized.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
};

const normalizeLoanInfoData = (data: LoanInfoData | null | undefined): LoanInfoData => {
  const source = data ?? defaultLoanInfoData;

  return {
    ...defaultLoanInfoData,
    ...source,
    desiredAmount: formatCurrencyInput(String(source.desiredAmount ?? '')),
    estimatedPayment: formatCurrencyInput(String(source.estimatedPayment ?? '')),
    downPayment: formatCurrencyInput(String(source.downPayment ?? '')),
    proposedLoan: formatCurrencyInput(String(source.proposedLoan ?? '')),
    annualizedLoan: formatCurrencyInput(String(source.annualizedLoan ?? '')),
    downPayment293: sanitizeDecimalInput(source.downPayment293),
    term: String(source.term ?? '').replace(/[^\d]/g, ''),
    interestRate: sanitizeDecimalInput(source.interestRate),
  };
};

const getSelectedPurpose = (loanPurpose: string): LoanPurpose | null => {
  if (!loanPurpose) return null;
  return loanPurposes[loanPurpose as keyof typeof loanPurposes] ?? null;
};

const getTermOptionLabel = (months: number) => {
  const years = months / 12;
  return `${months} Months (${years} ${years === 1 ? 'Year' : 'Years'})`;
};

const getCompactTermOptionLabel = (months: number) => {
  const years = Math.round(months / 12);
  return `${years} YR`;
};

const calculateMonthlyPayment = (amount: number, termMonths: number, ratePercent: number) => {
  const monthlyRate = ratePercent / 100 / 12;
  if (!amount || !termMonths || !ratePercent) return 0;
  const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  return Number.isFinite(payment) ? Math.round(payment) : 0;
};

const calculateInterestOnlyPayment = (amount: number, ratePercent: number) => {
  const monthlyRate = ratePercent / 100 / 12;
  if (!amount || !ratePercent) return 0;
  const payment = amount * monthlyRate;
  return Number.isFinite(payment) ? Math.round(payment) : 0;
};

const LoanInfoStep = forwardRef<LoanInfoStepRef, LoanInfoStepProps>(({ isFormValid, onFormDataChange, initialData }, ref) => {
  const [formData, setFormData] = useState<LoanInfoData>(() => normalizeLoanInfoData(initialData));
  const [errorFields, setErrorFields] = useState<Record<string, boolean>>({});
  const { showToast } = useToast();

  const defaultPurposeMeta = loanPurposeMeta['Working Capital'] ?? loanPurposeMeta.Other!;
  const selectedPurpose = getSelectedPurpose(formData.loanPurpose);
  const selectedPurposeMeta = loanPurposeMeta[formData.loanPurpose] ?? defaultPurposeMeta;
  const isInterestOnlyPurpose = selectedPurpose?.paymentMode === 'interest_only';
  const selectedPurposeDescription = selectedPurpose?.description ?? '';
  const selectedPurposeSubtitle = selectedPurpose?.menuSubtitle ?? selectedPurposeDescription;

  const applyLoanAssumptions = useCallback((nextData: LoanInfoData): LoanInfoData => {
    const purpose = getSelectedPurpose(nextData.loanPurpose);

    if (!purpose) {
      return {
        ...nextData,
        downPayment: '',
        downPayment293: '',
        proposedLoan: '',
        term: '',
        interestRate: '',
        estimatedPayment: '',
        annualizedLoan: '',
      };
    }

    const principal = parseCurrencyNumber(nextData.desiredAmount);
    const downPaymentPercent = clamp(
      parseFloat(sanitizeDecimalInput(nextData.downPayment293) || String((purpose.defaultDownPaymentPct ?? 0) * 100)),
      0,
      100,
    );
    const termMonths = parseInt(nextData.term.replace(/[^\d]/g, ''), 10) || purpose.defaultTerm;
    const interestRate = clamp(
      parseFloat(sanitizeDecimalInput(nextData.interestRate) || String(purpose.defaultRate * 100)),
      0,
      100,
    );
    const downPaymentAmount = purpose.paymentMode === 'interest_only'
      ? 0
      : principal > 0 ? Math.min(Math.round(principal * (downPaymentPercent / 100)), principal) : 0;
    const financedAmount = purpose.paymentMode === 'interest_only'
      ? principal
      : Math.max(principal - downPaymentAmount, 0);
    const monthlyPayment = financedAmount > 0
      ? (purpose.paymentMode === 'interest_only'
        ? calculateInterestOnlyPayment(financedAmount, interestRate)
        : calculateMonthlyPayment(financedAmount, termMonths, interestRate))
      : 0;

    return {
      ...nextData,
      downPayment293: formatPercentValue(purpose.paymentMode === 'interest_only' ? 0 : downPaymentPercent),
      downPayment: principal > 0 ? formatCurrencyInput(String(downPaymentAmount)) : '',
      proposedLoan: principal > 0 ? formatCurrencyInput(String(financedAmount)) : '',
      term: String(termMonths),
      interestRate: formatPercentValue(interestRate),
      estimatedPayment: monthlyPayment > 0 ? formatCurrencyInput(String(monthlyPayment)) : '',
      annualizedLoan: monthlyPayment > 0 ? formatCurrencyInput(String(monthlyPayment * 12)) : '',
    };
  }, []);

  useEffect(() => {
    if (!initialData) return;

    const normalized = normalizeLoanInfoData(initialData);
    setFormData((prev) => (
      JSON.stringify(normalized) === JSON.stringify(prev) ? prev : normalized
    ));
  }, [initialData]);

  useEffect(() => {
    onFormDataChange(formData);
  }, [formData, onFormDataChange]);

  const handleTextInputChange = useCallback((field: keyof LoanInfoData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleDesiredAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^\d]/g, '');
    const capped = clamp(digits ? parseInt(digits, 10) : 0, 0, 100_000_000);
    const desiredAmount = capped ? formatCurrencyInput(String(capped)) : '';

    setFormData((prev) => applyLoanAssumptions({
      ...prev,
      desiredAmount,
    }));
  }, [applyLoanAssumptions]);

  const handleLoanPurposeChange = useCallback((value: string) => {
    const purpose = loanPurposes[value as keyof typeof loanPurposes];
    if (!purpose) {
      setFormData((prev) => ({ ...prev, loanPurpose: value }));
      return;
    }

    setFormData((prev) => applyLoanAssumptions({
      ...prev,
      loanPurpose: value,
      downPayment293: formatPercentValue((purpose.defaultDownPaymentPct ?? 0) * 100),
      term: String(purpose.defaultTerm),
      interestRate: formatPercentValue(purpose.defaultRate * 100),
    }));
  }, [applyLoanAssumptions]);

  const handleDownPaymentPercentChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedPurpose?.paymentMode === 'interest_only') {
      setFormData((prev) => applyLoanAssumptions({
        ...prev,
        downPayment293: '0',
      }));
      return;
    }

    const sanitized = sanitizeDecimalInput(e.target.value);

    setFormData((prev) => applyLoanAssumptions({
      ...prev,
      downPayment293: sanitized,
    }));
  }, [applyLoanAssumptions, selectedPurpose]);

  const handleDownPaymentAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedPurpose?.paymentMode === 'interest_only') {
      setFormData((prev) => applyLoanAssumptions({
        ...prev,
        downPayment293: '0',
      }));
      return;
    }

    const principal = parseCurrencyNumber(formData.desiredAmount);
    const amount = clamp(parseCurrencyNumber(e.target.value), 0, principal);
    const percent = principal > 0 ? (amount / principal) * 100 : 0;

    setFormData((prev) => applyLoanAssumptions({
      ...prev,
      downPayment293: formatPercentValue(percent),
    }));
  }, [applyLoanAssumptions, formData.desiredAmount, selectedPurpose]);

  const handleTermChange = useCallback((value: string) => {
    setFormData((prev) => applyLoanAssumptions({
      ...prev,
      term: value,
    }));
  }, [applyLoanAssumptions]);

  const handleInterestRateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeDecimalInput(e.target.value);

    setFormData((prev) => applyLoanAssumptions({
      ...prev,
      interestRate: sanitized,
    }));
  }, [applyLoanAssumptions]);

  const validate = useCallback((silent: boolean = false): boolean => {
    let isValid = true;
    let firstErrorId: string | null = null;
    const currentErrors: Record<string, boolean> = {};
    const errorMessages: string[] = [];

    const requiredFields: Array<keyof LoanInfoData> = [
      'businessName',
      'firstName',
      'lastName',
      'loanPurpose',
      'desiredAmount',
    ];

    requiredFields.forEach((field) => {
      let value = formData[field];
      if (field === 'desiredAmount') {
        value = value ? value.replace(/[^\d]/g, '') : '';
      }
      const fieldId = `loanInfo-${field}`;
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        isValid = false;
        currentErrors[fieldId] = true;
        if (!firstErrorId) firstErrorId = fieldId;
      }
    });

    const desiredAmountNum = parseCurrencyNumber(formData.desiredAmount);
    if (desiredAmountNum > 100_000_000) {
      isValid = false;
      currentErrors['loanInfo-desiredAmount'] = true;
      errorMessages.push('Maximum allowed loan amount is $100,000,000.');
      if (!firstErrorId) firstErrorId = 'loanInfo-desiredAmount';
    }

    const nameFields: Array<{ field: keyof LoanInfoData; label: string }> = [
      { field: 'firstName', label: 'First name' },
      { field: 'lastName', label: 'Last name' },
    ];

    nameFields.forEach(({ field, label }) => {
      const value = formData[field];
      if (typeof value === 'string' && /[0-9]/.test(value)) {
        isValid = false;
        currentErrors[`loanInfo-${field}`] = true;
        errorMessages.push(`${label} cannot contain numbers.`);
        if (!firstErrorId) firstErrorId = `loanInfo-${field}`;
      }
    });

    if (formData.businessName.length > 60) {
      isValid = false;
      currentErrors['loanInfo-businessName'] = true;
      errorMessages.push('Business name cannot exceed 60 characters.');
      if (!firstErrorId) firstErrorId = 'loanInfo-businessName';
    }
    if (formData.businessName.length > 0 && formData.businessName.length < 2) {
      isValid = false;
      currentErrors['loanInfo-businessName'] = true;
      errorMessages.push('Business name must be at least 2 characters.');
      if (!firstErrorId) firstErrorId = 'loanInfo-businessName';
    }
    if (formData.firstName.length > 30) {
      isValid = false;
      currentErrors['loanInfo-firstName'] = true;
      errorMessages.push('First name cannot exceed 30 characters.');
      if (!firstErrorId) firstErrorId = 'loanInfo-firstName';
    }
    if (formData.firstName.length > 0 && formData.firstName.length < 2) {
      isValid = false;
      currentErrors['loanInfo-firstName'] = true;
      errorMessages.push('First name must be at least 2 characters.');
      if (!firstErrorId) firstErrorId = 'loanInfo-firstName';
    }
    if (formData.lastName.length > 30) {
      isValid = false;
      currentErrors['loanInfo-lastName'] = true;
      errorMessages.push('Last name cannot exceed 30 characters.');
      if (!firstErrorId) firstErrorId = 'loanInfo-lastName';
    }
    if (formData.lastName.length > 0 && formData.lastName.length < 2) {
      isValid = false;
      currentErrors['loanInfo-lastName'] = true;
      errorMessages.push('Last name must be at least 2 characters.');
      if (!firstErrorId) firstErrorId = 'loanInfo-lastName';
    }

    setErrorFields(currentErrors);

    if (!isValid && !silent) {
      errorMessages.forEach((message) => showToast(message));
      if (firstErrorId) {
        const errorId = firstErrorId;
        setTimeout(() => {
          const element = document.getElementById(errorId);
          element?.focus();
        }, 50);
      }
    }

    if (!silent) {
      isFormValid?.(isValid);
    }

    return isValid;
  }, [formData, isFormValid, showToast]);

  const fieldError = (field: keyof LoanInfoData): string | undefined => {
    const hasError = errorFields[`loanInfo-${field}`];
    if (!hasError) return undefined;

    const value = formData[field];
    if (!value || value.toString().trim() === '') return 'This field is required.';

    if (field === 'firstName' && /[0-9]/.test(formData.firstName)) return 'First name cannot contain numbers.';
    if (field === 'lastName' && /[0-9]/.test(formData.lastName)) return 'Last name cannot contain numbers.';
    if (field === 'businessName' && formData.businessName.length > 60) return 'Business name cannot exceed 60 characters.';
    if (field === 'businessName' && formData.businessName.length > 0 && formData.businessName.length < 2) return 'Business name must be at least 2 characters.';
    if (field === 'firstName' && formData.firstName.length > 30) return 'First name cannot exceed 30 characters.';
    if (field === 'firstName' && formData.firstName.length > 0 && formData.firstName.length < 2) return 'First name must be at least 2 characters.';
    if (field === 'lastName' && formData.lastName.length > 30) return 'Last name cannot exceed 30 characters.';
    if (field === 'lastName' && formData.lastName.length > 0 && formData.lastName.length < 2) return 'Last name must be at least 2 characters.';
    if (field === 'desiredAmount') return 'Enter a valid loan amount up to $100,000,000.';

    return 'Please review this field.';
  };

  useImperativeHandle(ref, () => ({
    validate: () => validate(),
  }));

  const SelectedPurposeIcon = selectedPurposeMeta?.icon ?? Calculator;

  return (
    <div className="space-y-6">
      <section className="rounded-[1.5rem] border border-slate-200 bg-white/95 p-5 shadow-[0_16px_35px_-24px_rgba(15,23,42,0.3)]">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Step 1</div>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">Business &amp; Loan Information</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Start with the borrower, business name, and loan request. If you know exact lender terms, use them. If you do not, that is okay. Use your best current estimate and we will still build the analysis around it.
        </p>
      </section>

      <FormSection
        title="Business Information"
        description="Enter the borrower and business identity details exactly how you want them to appear in the final report."
        className="!rounded-[1.5rem] !border-slate-200 !shadow-[0_16px_35px_-24px_rgba(15,23,42,0.3)]"
      >
        <FormField
          label="Business Name"
          htmlFor="loanInfo-businessName"
          required
          help="Use the legal business name or DBA that lenders would recognize."
          error={fieldError('businessName')}
          className="sm:col-span-2"
        >
          <Input
            type="text"
            maxLength={60}
            value={formData.businessName}
            onChange={handleTextInputChange('businessName')}
          />
        </FormField>

        <FormField
          label="First Name"
          htmlFor="loanInfo-firstName"
          required
          help="Primary contact for this financing request."
          error={fieldError('firstName')}
        >
          <Input
            type="text"
            maxLength={30}
            value={formData.firstName}
            onChange={handleTextInputChange('firstName')}
          />
        </FormField>

        <FormField
          label="Last Name"
          htmlFor="loanInfo-lastName"
          required
          error={fieldError('lastName')}
        >
          <Input
            type="text"
            maxLength={30}
            value={formData.lastName}
            onChange={handleTextInputChange('lastName')}
          />
        </FormField>
      </FormSection>

      <FormSection
        title="Loan Request"
        description="Choose the loan purpose and enter the amount you want to request. We use this to calculate the loan assumptions used throughout the analysis."
        className="!rounded-[1.5rem] !border-slate-200 !shadow-[0_16px_35px_-24px_rgba(15,23,42,0.3)]"
      >
        <FormField
          label="Loan Purpose"
          htmlFor="loanInfo-loanPurpose"
          required
          help="Choose the option that best matches the primary use of funds."
          error={fieldError('loanPurpose')}
        >
          <div>
            <Select value={formData.loanPurpose} onValueChange={handleLoanPurposeChange}>
              <SelectTrigger
                id="loanInfo-loanPurpose"
                className={cn(
                  'h-auto min-h-12 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm outline-none transition-all duration-200 focus:border-slate-900 focus:ring-4 focus:ring-slate-200 sm:min-h-14 sm:px-4 sm:py-3',
                  errorFields['loanInfo-loanPurpose'] && 'border-red-600 bg-red-50/40 ring-2 ring-red-500 focus:ring-red-600'
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 sm:h-10 sm:w-10">
                    <SelectedPurposeIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold leading-5 text-slate-950 sm:text-sm">
                      {selectedPurpose?.title ?? 'Choose Loan Purpose'}
                    </div>
                    <div className="mt-0.5 text-[11px] leading-4 text-slate-500 sm:text-xs">
                      {selectedPurpose ? selectedPurposeSubtitle : 'Pick the option that fits this request'}
                    </div>
                  </div>
                </div>
              </SelectTrigger>
              <SelectContent
                align="center"
                sideOffset={8}
                className="w-[calc(100vw-1.5rem)] max-w-[24rem] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl sm:w-auto sm:max-w-none"
              >
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
          </div>
        </FormField>

        <FormField
          label="Desired Loan Amount"
          htmlFor="loanInfo-desiredAmount"
          required
          help="Enter the total amount you want to request from the lender, before any down payment. You can usually pull this from a purchase contract, project budget, vendor quote, or your financing target."
          error={fieldError('desiredAmount')}
        >
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9,]*"
            value={formData.desiredAmount}
            onChange={handleDesiredAmountChange}
            maxLength={15}
            placeholder="$250,000"
          />
        </FormField>

        {selectedPurpose ? (
          <div className="sm:col-span-2 rounded-[1.35rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)]">
            <div className="flex flex-col gap-2 border-b border-slate-200 pb-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Loan Assumptions</p>
                <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">Starting structure for {selectedPurpose.title}</h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
                <SelectedPurposeIcon className="h-4 w-4" />
                {selectedPurposeMeta.eyebrow}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-start">
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:w-[11rem]">
                <p className="text-[11px] font-medium leading-4 text-slate-500">Down Payment %</p>
                {isInterestOnlyPurpose ? (
                  <>
                    <p className="mt-3 text-sm font-semibold text-slate-950">0%</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">LOC estimates assume the full amount is drawn.</p>
                  </>
                ) : (
                  <div className="relative mt-2">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={formData.downPayment293}
                      onChange={handleDownPaymentPercentChange}
                      className="h-10 rounded-xl border-slate-200 bg-slate-50 pr-9 text-right text-sm font-semibold text-slate-950 focus:border-slate-900 focus:bg-white focus-visible:ring-4 focus-visible:ring-slate-200"
                      placeholder="10"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">%</span>
                  </div>
                )}
              </div>

              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:w-[11rem]">
                <p className="text-[11px] font-medium leading-4 text-slate-500">Down Payment $</p>
                {isInterestOnlyPurpose ? (
                  <>
                    <p className="mt-3 text-sm font-semibold text-slate-950">$0</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">No reduction is applied before the LOC payment estimate.</p>
                  </>
                ) : (
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">$</span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={formData.downPayment ? String(parseCurrencyNumber(formData.downPayment).toLocaleString('en-US')) : ''}
                      onChange={handleDownPaymentAmountChange}
                      className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-8 text-sm font-semibold text-slate-950 focus:border-slate-900 focus:bg-white focus-visible:ring-4 focus-visible:ring-slate-200"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:w-[15.5rem]">
                <p className="text-[11px] font-medium leading-4 text-slate-500">{isInterestOnlyPurpose ? 'Payment Basis' : 'Term'}</p>
                {isInterestOnlyPurpose ? (
                  <>
                    <p className="mt-3 text-sm font-semibold text-slate-950">Amount x rate / 12</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Term does not drive the LOC monthly payment.</p>
                  </>
                ) : (
                  <Select value={formData.term} onValueChange={handleTermChange}>
                    <SelectTrigger className="mt-2 h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-sm font-semibold text-slate-950 focus:border-slate-900 focus:ring-4 focus:ring-slate-200">
                      <div className="min-w-0 flex-1">
                        <span className="block truncate sm:hidden">
                          {formData.term ? getCompactTermOptionLabel(Number(formData.term)) : 'Select term'}
                        </span>
                        <span className="hidden truncate sm:block">
                          {formData.term ? getTermOptionLabel(Number(formData.term)) : 'Select term'}
                        </span>
                      </div>
                    </SelectTrigger>
                    <SelectContent
                      align="center"
                      sideOffset={8}
                      className="w-[calc(100vw-1.5rem)] max-w-[24rem] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl sm:w-auto sm:max-w-none"
                    >
                      {commonTermOptions.map((termOption) => (
                        <SelectItem
                          key={termOption}
                          value={String(termOption)}
                          className="rounded-xl py-2.5 pl-9 pr-3 text-sm focus:bg-slate-50 focus:text-slate-950"
                        >
                          {getTermOptionLabel(termOption)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:w-[9.5rem]">
                <p className="text-[11px] font-medium leading-4 text-slate-500">Interest Rate</p>
                <div className="relative mt-2">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={formData.interestRate}
                    onChange={handleInterestRateChange}
                    className="h-10 rounded-xl border-slate-200 bg-slate-50 pr-9 text-right text-sm font-semibold text-slate-950 focus:border-slate-900 focus:bg-white focus-visible:ring-4 focus-visible:ring-slate-200"
                    placeholder="7.5"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">%</span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {isInterestOnlyPurpose
                ? 'For line-of-credit style requests, the estimate assumes the full requested amount is outstanding and calculates payment as amount x rate / 12.'
                : 'These are typical starting terms for this loan purpose. If your lender quoted something different, or you want to test a different structure, edit any of the assumptions above and we&apos;ll update the analysis around them.'}
            </p>
          </div>
        ) : null}
      </FormSection>
    </div>
  );
});

LoanInfoStep.displayName = 'LoanInfoStep';

export default LoanInfoStep;
