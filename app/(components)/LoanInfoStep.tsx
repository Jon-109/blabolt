import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/app/(components)/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/(components)/ui/card';
import { Input } from "@/app/(components)/ui/input"; 
import { Label } from "@/app/(components)/ui/label"; 
import { useToast } from '@/app/(components)/shared/Toast'; 
import { cn } from '@/lib/utils'; 
// Correct the import path for loan purposes
import { loanPurposes } from '@/lib/loanPurposes'; 

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

  // Inline error messages for required fields
  const requiredError = (field: keyof LoanInfoData) =>
    errorFields[`loanInfo-${field}`] && (!formData[field] || formData[field].toString().trim() === '')
      ? (
        <div className="text-xs text-red-500 mt-1">This field is required.</div>
      ) : null;

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

  const formatCurrency = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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

  const initialPaymentString = initialData?.estimatedPayment;
  const initialPaymentNumber = initialPaymentString ? parseFloat(initialPaymentString) : null;

  const [estimatedPayment, setEstimatedPayment] = useState<number>(0);

  useEffect(() => {
    if (formData.loanPurpose && formData.desiredAmount) {
      // Parse only digits for calculation
      const amountString = (formData.desiredAmount || '').toString();
      const amount = parseInt(amountString.replace(/[^\d]/g, ''), 10);
      const selectedPurpose = loanPurposes[formData.loanPurpose];
      if (!isNaN(amount) && amount > 0 && selectedPurpose) {
        const { defaultTerm, defaultRate, defaultDownPaymentPct = 0.1 } = selectedPurpose as any;
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
        setEstimatedPayment(payment); // <-- keep as number
        onFormDataChange(updated);
      } else {
        setEstimatedPayment(0);
      }
    } else {
      setEstimatedPayment(0);
    }
  }, [formData.loanPurpose, formData.desiredAmount]);

  const relevantPurchasePurposes = ['Purchase Business', 'Purchase Commercial Real Estate'];
  const showPurchaseFields = relevantPurchasePurposes.includes(formData.loanPurpose);

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>Step 1: Loan Information</CardTitle>
        <CardDescription>Please provide details about your business and the loan request.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Business Name */}
        <div className="space-y-2">
          <Label htmlFor="loanInfo-businessName">Business Name*</Label>
          <Input 
            id="loanInfo-businessName"
            type="text"
            maxLength={60}
            value={formData.businessName}
            onChange={handleInputChange('businessName')}
            className={cn(errorFields['loanInfo-businessName'] && 'border-red-500 ring-1 ring-red-500 focus:ring-red-500')}
          />
          {requiredError('businessName')}
          {formData.businessName.length === 60 && (
            <div className="text-xs text-red-500 mt-1">Business name cannot exceed 60 characters.</div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="loanInfo-firstName">First Name*</Label>
            <Input 
              id="loanInfo-firstName"
              type="text"
              maxLength={30}
              value={formData.firstName}
              onChange={handleInputChange('firstName')}
              className={cn(errorFields['loanInfo-firstName'] && 'border-red-500 ring-1 ring-red-500 focus:ring-red-500')}
            />
            {requiredError('firstName')}
            {formData.firstName.length === 30 && (
              <div className="text-xs text-red-500 mt-1">First name cannot exceed 30 characters.</div>
            )}
          </div>
          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="loanInfo-lastName">Last Name*</Label>
            <Input 
              id="loanInfo-lastName"
              type="text"
              maxLength={30}
              value={formData.lastName}
              onChange={handleInputChange('lastName')}
              className={cn(errorFields['loanInfo-lastName'] && 'border-red-500 ring-1 ring-red-500 focus:ring-red-500')}
            />
            {requiredError('lastName')}
            {formData.lastName.length === 30 && (
              <div className="text-xs text-red-500 mt-1">Last name cannot exceed 30 characters.</div>
            )}
          </div>
        </div>

        {/* Loan Purpose */}
        <div className="space-y-2">
          <Label htmlFor="loanInfo-loanPurpose">Loan Purpose*</Label>
          <p className="text-sm text-gray-600 mb-1">
            Please select the primary reason for your loan request. This helps us understand your needs and recommend the best loan options for you.
          </p>
          <select 
            id="loanInfo-loanPurpose"
            value={formData.loanPurpose}
            onChange={handleSelectChange('loanPurpose')} // Use specific handler
            className={cn(
              'block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
              errorFields['loanInfo-loanPurpose'] && 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
            )}
            required
          >
            <option value="">Select a purpose</option>
            {Object.keys(loanPurposes).map((purpose) => (
              <option key={purpose} value={purpose}>
                {purpose}
              </option>
            ))}
          </select>
          {requiredError('loanPurpose')}
        </div>

        {/* Desired Loan Amount */}
        <div className="space-y-2">
          <Label htmlFor="loanInfo-desiredAmount">Desired Loan Amount*</Label>
          <p className="text-sm text-gray-600 mb-1">
            Please enter your best estimate of the total amount you would like to borrow. This should reflect how much funding you believe you’ll need to accomplish your goal (such as purchasing equipment, property, or covering working capital). 
          </p>
          <Input 
            id="loanInfo-desiredAmount"
            type="text" 
            inputMode="numeric"
            pattern="[0-9,]*"
            value={formData.desiredAmount ?? ''}
            onChange={handleCurrencyInputChange('desiredAmount')}
            onBlur={e => setFormData(prev => ({ ...prev, desiredAmount: formatCurrencyInput(prev.desiredAmount) }))}
            className={cn(errorFields['loanInfo-desiredAmount'] && 'border-red-500 ring-1 ring-red-500 focus:ring-red-500')} 
            maxLength={15}
          />
          {requiredError('desiredAmount')}
          {(() => {
            const amountString = (formData.desiredAmount || '').toString();
            const digits = amountString.replace(/[^\d]/g, '');
            // Only show the warning if the max value is hit, never show 0 or null
            const num = digits && digits.length > 0 ? parseInt(digits, 10) : null;
            return num === 100_000_000 && formData.desiredAmount.length > 0 ? (
              <div className="text-xs text-red-500 mt-1">Maximum allowed loan amount is $100,000,000.</div>
            ) : null;
          })()}
        </div>

        {/* Conditionally Render Purchase-Related Fields */}
        {showPurchaseFields && (
          <>
            {/* Down Payment */}
            <div className="space-y-2">
              <Label htmlFor="loanInfo-downPayment">Down Payment*</Label>
              <Input 
                id="loanInfo-downPayment"
                type="text" 
                inputMode='numeric'
                placeholder="$30,000"
                value={formData.downPayment} 
                onChange={handleInputChange('downPayment')}
                className={cn(errorFields['loanInfo-downPayment'] && 'border-red-500 ring-1 ring-red-500 focus:ring-red-500')} 
              />
            </div>

            {/* Down Payment 293 */}
            <div className="space-y-2">
              <Label htmlFor="loanInfo-downPayment293">Down Payment 293*</Label>
              <Input 
                id="loanInfo-downPayment293"
                type="text" 
                inputMode='numeric'
                placeholder="10%" 
                value={formData.downPayment293} 
                onChange={handleInputChange('downPayment293')}
                className={cn(errorFields['loanInfo-downPayment293'] && 'border-red-500 ring-1 ring-red-500 focus:ring-red-500')} 
              />
            </div>

            {/* Proposed Loan */}
            <div className="space-y-2">
              <Label htmlFor="loanInfo-proposedLoan">Proposed Loan Amount*</Label>
              <Input 
                id="loanInfo-proposedLoan"
                type="text" 
                inputMode='numeric'
                placeholder="$120,000"
                value={formData.proposedLoan} 
                onChange={handleInputChange('proposedLoan')}
                className={cn(errorFields['loanInfo-proposedLoan'] && 'border-red-500 ring-1 ring-red-500 focus:ring-red-500')} 
              />
            </div>

            {/* Term */}
            <div className="space-y-2">
              <Label htmlFor="loanInfo-term">Loan Term (Months)*</Label>
              <Input 
                id="loanInfo-term"
                type="number" // Can use number here if no formatting needed
                inputMode='numeric'
                placeholder="120" 
                value={formData.term} 
                onChange={handleInputChange('term')}
                className={cn(errorFields['loanInfo-term'] && 'border-red-500 ring-1 ring-red-500 focus:ring-red-500')} 
              />
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <Label htmlFor="loanInfo-interestRate">Estimated Interest Rate (%)*</Label>
              <Input 
                id="loanInfo-interestRate"
                type="number" // Can use number here 
                step="0.01"
                inputMode='decimal'
                placeholder="7.5"
                value={formData.interestRate} 
                onChange={handleInputChange('interestRate')}
                className={cn(errorFields['loanInfo-interestRate'] && 'border-red-500 ring-1 ring-red-500 focus:ring-red-500')} 
              />
            </div>

            {/* Annualized Loan */}
            <div className="space-y-2">
              <Label htmlFor="loanInfo-annualizedLoan">Annualized Loan Payment*</Label>
              <Input 
                id="loanInfo-annualizedLoan"
                type="text" 
                inputMode='numeric'
                placeholder="$18,000"
                value={formData.annualizedLoan} 
                onChange={handleInputChange('annualizedLoan')}
                className={cn(errorFields['loanInfo-annualizedLoan'] && 'border-red-500 ring-1 ring-red-500 focus:ring-red-500')} 
              />
            </div>
          </>
        )}

        {/* Estimated Payment Display */}
        {estimatedPayment && (
          <div className="mt-10 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-blue-200 shadow-lg overflow-hidden">
            <div className="px-8 py-6 bg-blue-50 border-b border-blue-200">
              <h3 className="text-center text-xl font-extrabold text-blue-800 tracking-tight uppercase">
                Estimated Monthly Payment
              </h3>
            </div>
            <div className="p-8 text-center">
              <div className="mb-6">
                <div className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-400 drop-shadow-sm">
                  {formatCurrency(estimatedPayment)}
                </div>
                <div className="text-base font-medium text-gray-600 mt-2">per month</div>
              </div>
              {formData.loanPurpose && (() => {
                const purpose = loanPurposes[formData.loanPurpose];
                if (!purpose) return null;
                const downPaymentPercent = formData.loanPurpose === 'Real Estate Acquisition or Development' ? 20 : 10;
                const desiredAmount = parseInt(parseCurrencyInput(formData.desiredAmount), 10) || 0;
                const downPaymentAmount = Math.round(desiredAmount * (downPaymentPercent / 100));
                const proposedLoan = desiredAmount - downPaymentAmount;
                return (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 text-left max-w-xl mx-auto space-y-2 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-900">Term:</span>
                      <span>{purpose.defaultTerm} months <span className="text-xs text-gray-500">(typical for this loan purpose, but may vary)</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-900">Interest Rate:</span>
                      <span>{(purpose.defaultRate * 100).toFixed(1)}% APR <span className="text-xs text-gray-500">(typical for this loan purpose, but may vary)</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-900">Down Payment %:</span>
                      <span>{downPaymentPercent}% <span className="text-xs text-gray-500">(typical for this loan purpose, but may vary)</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-900">Down Payment Amount:</span>
                      <span>${downPaymentAmount.toLocaleString('en-US')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-900">Proposed Loan Amount:</span>
                      <span>${proposedLoan.toLocaleString('en-US')}</span>
                    </div>
                  </div>
                );
              })()}
              <div className="text-xs text-gray-500 mt-4 max-w-md mx-auto">
                This is an approximate calculation. Actual terms and rates may vary based on your business profile and market conditions.
              </div>
            </div>
          </div>
        )}
      </CardContent>
      {/* Footer removed – navigation handled by page-level buttons */}
    </Card>
  );
});

LoanInfoStep.displayName = 'LoanInfoStep'; // Add display name for easier debugging

export default LoanInfoStep;
