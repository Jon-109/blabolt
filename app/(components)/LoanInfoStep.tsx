import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Input } from "@/app/(components)/ui/input"; 
import { useToast } from '@/app/(components)/shared/Toast'; 
import { cn } from '@/lib/utils'; 
// Correct the import path for loan purposes
import { loanPurposes } from '@/lib/loanPurposes'; 
import FormField from '@/app/(components)/templates/shared/FormField';
import FormSection from '@/app/(components)/templates/shared/FormSection';

// Define the structure for loan info data
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
  id?: string; // <-- Add this line
}

// Define props for LoanInfoStep
interface LoanInfoStepProps {
  onNext: () => void;
  isFormValid?: (isValid: boolean) => void;
  onFormDataChange: (data: LoanInfoData) => void;
  initialData: LoanInfoData | null;
}

// Define the Ref type for exposing the validate function
export interface LoanInfoStepRef {
  validate: () => boolean;
}

// Wrap component with forwardRef
const LoanInfoStep = forwardRef<LoanInfoStepRef, LoanInfoStepProps>(({ onNext, isFormValid, onFormDataChange, initialData }, ref) => {
  const [formData, setFormData] = useState<LoanInfoData>(initialData || {
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
  });

  // --- Sync formData with initialData if it changes (e.g., after async draft restore) ---
  useEffect(() => {
    // Only update if initialData is truthy and different from formData
    if (
      initialData &&
      JSON.stringify(initialData) !== JSON.stringify(formData)
    ) {
      setFormData(initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialData)]); // Only re-run if the actual content of initialData changes

  const [errorFields, setErrorFields] = useState<Record<string, boolean>>({}); // State for error highlighting
  const { showToast } = useToast(); 

  // Update parent component when form data changes
  useEffect(() => {
    onFormDataChange(formData);
    // Optional: Re-run validation silently on change if needed, 
    // but be cautious of performance/UX.
    // const currentValidity = validate(true); // Pass silent flag
    // isFormValid?.(currentValidity);
  }, [formData, onFormDataChange]);

  // Handler for standard Input elements with max length notification
  const handleInputChange = useCallback((field: keyof LoanInfoData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const maxLengths: Record<string, number> = {
      businessName: 60,
      firstName: 30,
      lastName: 30
    };
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [formData]);

  // Handler specifically for the Select element
  const handleSelectChange = useCallback((field: keyof LoanInfoData) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  // Currency formatting helpers
  const formatCurrencyInput = (value: string): string => {
    if (!value) return '';
    // Remove all non-digits
    const digits = value.replace(/[^\d]/g, '');
    if (!digits) return '';
    // Format as USD with commas, no decimals
    return '$' + parseInt(digits, 10).toLocaleString('en-US');
  };

  const parseCurrencyInput = (value: string): string => {
    if (!value) return '';
    // Remove all non-digits
    return value.replace(/[^\d]/g, '');
  };

  // Handler for currency input
  const handleCurrencyInputChange = (field: keyof LoanInfoData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (field === 'desiredAmount') {
      // Remove all non-digits
      const digits = e.target.value.replace(/[^\d]/g, '');
      let num = digits ? parseInt(digits, 10) : 0;
      if (num > 100_000_000) num = 100_000_000;
      const formatted = num ? ('$' + num.toLocaleString('en-US')) : '';
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else {
      const formatted = formatCurrencyInput(e.target.value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
    }
  };

  // Handler for blur (strip $/commas for calculation, keep formatted for display)
  const handleCurrencyInputBlur = (field: keyof LoanInfoData) => (e: React.FocusEvent<HTMLInputElement>) => {
    const digits = parseCurrencyInput(e.target.value);
    const formatted = digits ? ('$' + parseInt(digits, 10).toLocaleString('en-US')) : '';
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  // Validation Logic
  const validate = useCallback((silent: boolean = false): boolean => {
    let isValid = true;
    let firstErrorId: string | null = null;
    const currentErrors: Record<string, boolean> = {};
    let errorMessages: string[] = [];

    // Define required fields
    const requiredFields: Array<keyof LoanInfoData> = [
      'businessName', 
      'firstName', 
      'lastName', 
      'loanPurpose', 
      'desiredAmount'
    ];

    // --- Required fields: block if empty ---
    requiredFields.forEach(field => {
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

    // --- Custom Validation Rules ---
    // 1. Max loan amount $100,000,000
    const maxLoanAmount = 100_000_000;
    const desiredAmountRaw = formData.desiredAmount ? formData.desiredAmount.replace(/[^\d]/g, '') : '';
    const desiredAmountNum = desiredAmountRaw ? parseInt(desiredAmountRaw, 10) : 0;
    if (desiredAmountNum > maxLoanAmount) {
      isValid = false;
      currentErrors['loanInfo-desiredAmount'] = true;
      errorMessages.push('Maximum allowed loan amount is $100,000,000.');
      if (!firstErrorId) firstErrorId = 'loanInfo-desiredAmount';
    }

    // 2. No numbers in first/last name
    const nameFields: Array<{ field: keyof LoanInfoData; label: string }> = [
      { field: 'firstName', label: 'First name' },
      { field: 'lastName', label: 'Last name' }
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

    // 3. Character limits (always run, do not skip if required field is empty)
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
      errorMessages.forEach(msg => showToast(msg));
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
  }, [formData, showToast, isFormValid]);

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

  // Expose validate function via ref
  useImperativeHandle(ref, () => ({
    validate: () => validate() // Call the internal validate function
  }));

  const handleNext = useCallback(() => {
    console.log('[LoanInfoStep] handleNext called'); // <-- Add log here
    const isValid = validate();
    console.log('[LoanInfoStep] Validation result:', isValid); // <-- Add log here
    if (isValid) { // Validate before proceeding
      onNext();
    }
  }, [validate, onNext]);

  // --- Fix: Calculation bug, ensure correct types for calculateMonthlyPayment ---
  const calculateMonthlyPayment = (amount: number, term: number, rate: number) => {
    // rate is in percent, convert to decimal
    const yearlyRate = rate / 100;
    const monthlyRate = yearlyRate / 12;
    if (!amount || !term || !rate) return 0;
    const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) /
                   (Math.pow(1 + monthlyRate, term) - 1);
    return isFinite(payment) ? Math.round(payment) : 0;
  };

  // Calculate interest-only payment for Line of Credit
  const calculateInterestOnlyPayment = (amount: number, rate: number) => {
    // rate is in percent, convert to decimal
    const yearlyRate = rate / 100;
    const monthlyRate = yearlyRate / 12;
    if (!amount || !rate) return 0;
    const payment = amount * monthlyRate;
    return isFinite(payment) ? Math.round(payment) : 0;
  };

  useEffect(() => {
    if (formData.loanPurpose && formData.desiredAmount) {
      // Parse only digits for calculation
      const amountString = (formData.desiredAmount || '').toString();
      const amount = parseInt(amountString.replace(/[^\d]/g, ''), 10);
      const selectedPurpose = loanPurposes[formData.loanPurpose as keyof typeof loanPurposes];
      if (!isNaN(amount) && amount > 0 && selectedPurpose) {
        const { defaultTerm, defaultRate, defaultDownPaymentPct = 0.1 } = selectedPurpose;
        // downPaymentPct as percentage string
        const downPaymentPctStr = (defaultDownPaymentPct * 100).toFixed(1) + '%';
        const down = Math.round(amount * defaultDownPaymentPct);
        const proposed = amount - down;
        
        // Use interest-only calculation for Line of Credit
        const payment = formData.loanPurpose === 'Line of Credit' 
          ? calculateInterestOnlyPayment(amount, defaultRate * 100)
          : calculateMonthlyPayment(amount, defaultTerm, defaultRate * 100);
        const updated: LoanInfoData = {
          ...formData,
          desiredAmount: amount.toString(),
          term: defaultTerm.toString(),
          interestRate: (defaultRate * 100).toFixed(1),
          downPayment: down.toString(),
          downPayment293: downPaymentPctStr, // Save as percent string
          proposedLoan: proposed.toString(),
          estimatedPayment: payment.toString(),
          annualizedLoan: (payment * 12).toString(),
        };
        setFormData(prev => ({ ...prev, ...updated, desiredAmount: formatCurrencyInput(amount.toString()) }));
        onFormDataChange(updated);
      }
    }
  }, [formData.loanPurpose, formData.desiredAmount]);

  const relevantPurchasePurposes = ['Purchase Business', 'Purchase Commercial Real Estate'];
  const showPurchaseFields = relevantPurchasePurposes.includes(formData.loanPurpose);

  return (
    <div className="space-y-6">
      <section className="rounded-[1.5rem] border border-slate-200 bg-white/95 p-5 shadow-[0_16px_35px_-24px_rgba(15,23,42,0.3)]">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Step 1</div>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">Business & Loan Information</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Start with the borrower, business name, and loan request. If you know exact lender terms, use them. If you do not, that is okay. Use your best current estimate and we will still build the analysis around it.
        </p>
      </section>

      <FormSection
        title="Business And Borrower"
        description="Enter the borrower and business identity details exactly how you want them to appear in the final report."
        className="!rounded-[1.5rem] !border-slate-200 !shadow-[0_16px_35px_-24px_rgba(15,23,42,0.3)]"
      >
        <FormField
          label="Business Name"
          htmlFor="loanInfo-businessName"
          required
          help="Use the legal or DBA name lenders will recognize."
          error={fieldError('businessName')}
        >
          <Input
            type="text"
            maxLength={60}
            value={formData.businessName}
            onChange={handleInputChange('businessName')}
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
            onChange={handleInputChange('firstName')}
          />
        </FormField>

        <FormField
          label="Last Name"
          htmlFor="loanInfo-lastName"
          required
          help="Primary contact for this financing request."
          error={fieldError('lastName')}
        >
          <Input
            type="text"
            maxLength={30}
            value={formData.lastName}
            onChange={handleInputChange('lastName')}
          />
        </FormField>
      </FormSection>

      <FormSection
        title="Loan Request"
        description="Choose the reason for the loan and enter the main request amount first. We use that to estimate the supporting loan figures below."
        className="!rounded-[1.5rem] !border-slate-200 !shadow-[0_16px_35px_-24px_rgba(15,23,42,0.3)]"
      >
        <FormField
          label="Loan Purpose"
          htmlFor="loanInfo-loanPurpose"
          required
          help="Pick the closest match to the main use of funds."
          error={fieldError('loanPurpose')}
          className="sm:col-span-2"
        >
          <select
            value={formData.loanPurpose}
            onChange={handleSelectChange('loanPurpose')}
            className={cn(
              'block h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              errorFields['loanInfo-loanPurpose'] && 'border-red-600 bg-red-50/40 ring-2 ring-red-500 focus:ring-red-600'
            )}
          >
            <option value="">Select a purpose</option>
            {Object.keys(loanPurposes).map((purpose) => (
              <option key={purpose} value={purpose}>
                {purpose}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Desired Loan Amount"
          htmlFor="loanInfo-desiredAmount"
          required
          help="Use the total amount you are requesting from the lender, before any down payment. You can usually get this from a purchase contract, project budget, quote package, or your financing target."
          error={fieldError('desiredAmount')}
          className="sm:col-span-2"
        >
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9,]*"
            value={formData.desiredAmount ?? ''}
            onChange={handleCurrencyInputChange('desiredAmount')}
            onBlur={() => setFormData(prev => ({ ...prev, desiredAmount: formatCurrencyInput(prev.desiredAmount) }))}
            maxLength={15}
            placeholder="$250,000"
          />
        </FormField>

        {showPurchaseFields ? (
          <>
            <FormField
              label="Down Payment"
              htmlFor="loanInfo-downPayment"
              help="Enter the dollar amount you expect to contribute yourself. If you do not know it yet, it is okay to leave the estimate already shown."
            >
              <Input
                type="text"
                inputMode="numeric"
                placeholder="$30,000"
                value={formData.downPayment}
                onChange={handleInputChange('downPayment')}
              />
            </FormField>

            <FormField
              label="Down Payment %"
              htmlFor="loanInfo-downPayment293"
              help="If you know the percent but not the exact dollars, enter the percent here instead."
            >
              <Input
                type="text"
                inputMode="numeric"
                placeholder="10%"
                value={formData.downPayment293}
                onChange={handleInputChange('downPayment293')}
              />
            </FormField>

            <FormField
              label="Proposed Loan Amount"
              htmlFor="loanInfo-proposedLoan"
              help="This is usually the amount being financed after subtracting any down payment or cash injection."
            >
              <Input
                type="text"
                inputMode="numeric"
                placeholder="$120,000"
                value={formData.proposedLoan}
                onChange={handleInputChange('proposedLoan')}
              />
            </FormField>

            <FormField
              label="Loan Term (Months)"
              htmlFor="loanInfo-term"
              help="Enter the repayment term in months. Common examples are 60, 84, 120, or 240 depending on the deal."
            >
              <Input
                type="number"
                inputMode="numeric"
                placeholder="120"
                value={formData.term}
                onChange={handleInputChange('term')}
              />
            </FormField>

            <FormField
              label="Estimated Interest Rate (%)"
              htmlFor="loanInfo-interestRate"
              help="Use the actual quoted rate if you have it. If you do not, it is okay to keep the estimated rate."
            >
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="7.5"
                value={formData.interestRate}
                onChange={handleInputChange('interestRate')}
              />
            </FormField>

            <FormField
              label="Annualized Loan Payment"
              htmlFor="loanInfo-annualizedLoan"
              help="This is the yearly loan-payment amount. If you only know the monthly payment, this should be monthly payment times 12."
            >
              <Input
                type="text"
                inputMode="numeric"
                placeholder="$18,000"
                value={formData.annualizedLoan}
                onChange={handleInputChange('annualizedLoan')}
              />
            </FormField>
          </>
        ) : null}
      </FormSection>

    </div>
  );
});

LoanInfoStep.displayName = 'LoanInfoStep'; // Add display name for easier debugging

export default LoanInfoStep;
