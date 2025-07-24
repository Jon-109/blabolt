'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Textarea } from '@/app/(components)/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/(components)/ui/select';
import { Badge } from '@/app/(components)/ui/badge';
import { X, Plus, Trash2, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import { 
  CoverLetterInputs, 
  coverLetterSchema, 
  step1Schema, 
  step2Schema, 
  step3Schema, 
  step4Schema,
  US_STATES, 
  ENTITY_TYPES, 
  INDUSTRIES, 
  ASSET_TYPES
} from './cover-letter/schema';
import { useCoverLetter } from './cover-letter/useCoverLetter';

interface CoverLetterInlineFormProps {
  loanPackagingId: string | null;
  loanAmount: number;
  onComplete: () => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

export default function CoverLetterInlineForm({ 
  loanPackagingId, 
  loanAmount,
  onComplete
}: CoverLetterInlineFormProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [showCollateral, setShowCollateral] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  const { data, isLoading, error, isCompleted, updateData, saveData, markCompleted } = useCoverLetter(loanPackagingId);

  const form = useForm<CoverLetterInputs>({
    resolver: zodResolver(coverLetterSchema),
    mode: 'onChange',
    defaultValues: {
      legal_name: '',
      entity_type: 'LLC',
      street_address: '',
      city: '',
      state: '',
      zip: '',
      year_founded: new Date().getFullYear(),
      owners: [{ name: '', percent: 100 }],
      origin_story: '',
      industry: '',
      products_services: '',
      differentiation: '',
      loan_purpose_explained: '',
      use_of_funds: [{ label: '', amount: 0 }],
      impact_statement: '',
      collateral_items: undefined,
      additional_context: ''
    }
  });

  const { fields: ownerFields, append: appendOwner, remove: removeOwner } = useFieldArray({
    control: form.control,
    name: 'owners'
  });

  const { fields: fundsFields, append: appendFunds, remove: removeFunds } = useFieldArray({
    control: form.control,
    name: 'use_of_funds'
  });

  const { fields: collateralFields, append: appendCollateral, remove: removeCollateral } = useFieldArray({
    control: form.control,
    name: 'collateral_items'
  });

  // Load data into form when available - including when data is empty but loading is complete
  useEffect(() => {
    // Only reset form after loading is complete to prevent race conditions
    if (!isLoading) {
      const formData = {
        legal_name: data.legal_name || '',
        entity_type: data.entity_type || 'LLC',
        street_address: data.street_address || '',
        city: data.city || '',
        state: data.state || '',
        zip: data.zip || '',
        year_founded: data.year_founded || new Date().getFullYear(),
        owners: data.owners && data.owners.length > 0 ? data.owners : [{ name: '', percent: 100 }],
        origin_story: data.origin_story || '',
        industry: data.industry || '',
        products_services: data.products_services || '',
        differentiation: data.differentiation || '',
        loan_purpose_explained: data.loan_purpose_explained || '',
        use_of_funds: data.use_of_funds && data.use_of_funds.length > 0 ? data.use_of_funds : [{ label: '', amount: 0 }],
        impact_statement: data.impact_statement || '',
        collateral_items: data.collateral_items || [],
        additional_context: data.additional_context || ''
      };
      
      console.log('[CoverLetterInlineForm] Resetting form with data:', formData);
      form.reset(formData);
      setShowCollateral(Boolean(data.collateral_items && data.collateral_items.length > 0));
    }
  }, [data, form, isLoading]);

  // Auto-save form data with debouncing - only after form is properly initialized
  useEffect(() => {
    // Don't set up watch until form is ready and data has been loaded
    if (isLoading) {
      return;
    }

    const subscription = form.watch((value, info) => {
      try {
        if (!value || typeof value !== 'object') return;
        
        // Check if any meaningful field has content
        const hasAnyContent = Object.entries(value).some(([key, val]) => {
          if (key === 'owners' || key === 'use_of_funds') {
            return Array.isArray(val) && val.length > 0 && val.some(item =>
              item && typeof item === 'object' && Object.values(item).some(v =>
                typeof v === 'string' ? v.trim().length > 0 : (typeof v === 'number' && v > 0)
              )
            );
          }
          if (key === 'collateral_items') {
            return Array.isArray(val) && val.length > 0 && val.some(item =>
              item && typeof item === 'object' && Object.values(item).some(v =>
                typeof v === 'string' ? v.trim().length > 0 : (typeof v === 'number' && v > 0)
              )
            );
          }
          if (typeof val === 'string') {
            return val.trim().length > 0;
          }
          if (typeof val === 'number') {
            return val > 0;
          }
          return Boolean(val);
        });
        
        // Only save if there's meaningful content and form has been modified
        if (hasAnyContent && form.formState.isDirty) {
          console.log('[CoverLetterInlineForm] Auto-saving form data:', value);
          updateData(value as Partial<CoverLetterInputs>);
        }
      } catch (error) {
        console.warn('Form watch error:', error);
      }
    });

    return () => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.warn('Form watch cleanup error:', error);
      }
    };
  }, [form, updateData, isLoading]);

  // Calculate progress
  const progress = (currentStep / 5) * 100;

  // Calculate owners percentage total
  const owners = form.watch('owners') || [];
  const ownersTotal = owners.reduce((sum: number, owner: any) => sum + (Number(owner.percent) || 0), 0);
  const ownersValid = Math.abs(ownersTotal - 100) <= 1;

  // Calculate use of funds total
  const funds = form.watch('use_of_funds') || [];
  const fundsTotal = funds.reduce((sum: number, fund: any) => sum + (Number(fund.amount) || 0), 0);
  const fundsValid = Math.abs(fundsTotal - loanAmount) <= (loanAmount * 0.05); // Within 5%

  // Step validation
  const validateCurrentStep = () => {
    const formData = form.getValues();
    
    try {
      switch (currentStep) {
        case 1:
          step1Schema.parse(formData);
          return true;
        case 2:
          step2Schema.parse(formData);
          return ownersValid;
        case 3:
          step3Schema.parse(formData);
          return true;
        case 4:
          step4Schema.parse(formData);
          return fundsValid;
        case 5:
          // Review page - always valid if we got here
          return isConfirmed;
        default:
          return false;
      }
    } catch {
      return false;
    }
  };

  const canProceed = validateCurrentStep();

  const handleNext = () => {
    if (canProceed && currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const handleSubmit = async () => {
    try {
      const formData = form.getValues();
      const isValid = coverLetterSchema.safeParse(formData).success;
      
      if (!isValid) {
        toast.error('Please complete all required fields');
        return;
      }

      if (!ownersValid) {
        toast.error('Owner percentages must total 100%');
        return;
      }

      if (!fundsValid) {
        toast.error('Use of funds total should match loan amount');
        return;
      }

      await markCompleted();
      toast.success('Cover letter completed successfully!');
      onComplete();
    } catch (err) {
      toast.error('Failed to submit cover letter');
    }
  };

  // Products/services is now a single string field

  const getStepTitle = (step: WizardStep) => {
    const titles = {
      1: 'Business Basics',
      2: 'Ownership & Background', 
      3: 'What You Do & Why It Works',
      4: 'Loan Details & Impact',
      5: 'Review & Confirm'
    };
    return step === 5 ? titles[step] : `Step ${step} of 4: ${titles[step]}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cover letter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <form className="space-y-6">
        {/* Step 1: Business Basics */}
        {currentStep === 1 && (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-semibold mb-6 text-gray-900">{getStepTitle(1)}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Legal Name *</label>
                <Input
                  {...form.register('legal_name')}
                  placeholder="Enter business legal name"
                  className="bg-white"
                />
                {form.formState.errors.legal_name && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.legal_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Entity Type *</label>
                <Select
                  value={form.watch('entity_type')}
                  onValueChange={(value) => form.setValue('entity_type', value as any)}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {ENTITY_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="hover:bg-gray-50">{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700">Street Address *</label>
                <Input
                  {...form.register('street_address')}
                  placeholder="Enter street address"
                  className="bg-white"
                />
                {form.formState.errors.street_address && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.street_address.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">City *</label>
                <Input
                  {...form.register('city')}
                  placeholder="Enter city"
                  className="bg-white"
                />
                {form.formState.errors.city && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">State *</label>
                <Select
                  value={form.watch('state')}
                  onValueChange={(value) => form.setValue('state', value)}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                    {US_STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value} className="hover:bg-gray-50">
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">ZIP Code *</label>
                <Input
                  {...form.register('zip')}
                  placeholder="12345"
                  maxLength={5}
                  className="bg-white"
                />
                {form.formState.errors.zip && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.zip.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Year Founded *</label>
                <Input
                  type="number"
                  {...form.register('year_founded', { valueAsNumber: true })}
                  placeholder="2020"
                  min="1800"
                  max={new Date().getFullYear()}
                  className="bg-white"
                />
                {form.formState.errors.year_founded && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.year_founded.message}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Ownership & Background */}
        {currentStep === 2 && (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-semibold mb-6 text-gray-900">{getStepTitle(2)}</h3>
            
            <div className="space-y-6">
              {/* Owners */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Owners *</label>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${ownersValid ? 'text-green-600' : 'text-red-600'}`}>
                      Total: {ownersTotal}%
                    </span>
                    {ownersValid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
                
                {ownerFields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-3 mb-3">
                    <Input
                      {...form.register(`owners.${index}.name`)}
                      placeholder="Owner name"
                      className="flex-1 bg-white"
                    />
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        {...form.register(`owners.${index}.percent`, { valueAsNumber: true })}
                        placeholder="50"
                        min="0"
                        max="100"
                        className="w-20 bg-white"
                      />
                      <span className="text-sm text-gray-500 font-medium">%</span>
                    </div>
                    {ownerFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOwner(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendOwner({ name: '', percent: 0 })}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Owner
                </Button>
                
                {!ownersValid && (
                  <p className="text-red-500 text-sm mt-2">Owner percentages must total 100%</p>
                )}
              </div>

              {/* Origin Story */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Origin Story (Optional)</label>
                <Textarea
                  {...form.register('origin_story')}
                  placeholder="Tell us how your business started..."
                  maxLength={300}
                  rows={3}
                  className="bg-white resize-none"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {(form.watch('origin_story') || '').length}/300 characters
                </p>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Industry *</label>
                <Select
                  value={form.watch('industry')}
                  onValueChange={(value) => form.setValue('industry', value)}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry} value={industry} className="hover:bg-gray-50">
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.industry && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.industry.message}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: What You Do & Why It Works */}
        {currentStep === 3 && (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-semibold mb-6 text-gray-900">{getStepTitle(3)}</h3>
            
            <div className="space-y-6">
              {/* Products & Services */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Products & Services *</label>
                <Textarea
                  {...form.register('products_services')}
                  placeholder="Describe your primary products and services in detail. What do you offer to your customers?"
                  maxLength={500}
                  rows={4}
                  className="bg-white resize-none"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {form.watch('products_services')?.length || 0}/500 characters
                </div>
                {form.formState.errors.products_services && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.products_services.message}</p>
                )}
              </div>

              {/* Differentiation */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">What Makes You Different? (Optional)</label>
                <Textarea
                  {...form.register('differentiation')}
                  placeholder="Describe what sets your business apart from competitors..."
                  maxLength={300}
                  rows={4}
                  className="bg-white resize-none"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {(form.watch('differentiation') || '').length}/300 characters
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Loan Details & Impact */}
        {currentStep === 4 && (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-semibold mb-6 text-gray-900">{getStepTitle(4)}</h3>
            
            <div className="space-y-6">
              {/* Loan Amount Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Loan Amount:</strong> ${loanAmount.toLocaleString()}
                </p>
              </div>

              {/* Loan Purpose */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Loan Purpose Explained *</label>
                <Textarea
                  {...form.register('loan_purpose_explained')}
                  placeholder="Explain in detail why you need this loan and how it will benefit your business..."
                  maxLength={400}
                  rows={4}
                  className="bg-white resize-none"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {(form.watch('loan_purpose_explained') || '').length}/400 characters
                </p>
                {form.formState.errors.loan_purpose_explained && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.loan_purpose_explained.message}</p>
                )}
              </div>

              {/* Use of Funds */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Use of Funds *</label>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${fundsValid ? 'text-green-600' : 'text-orange-600'}`}>
                      Total: ${fundsTotal.toLocaleString()}
                    </span>
                    {fundsValid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                </div>
                
                {fundsFields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-3 mb-3">
                    <Input
                      {...form.register(`use_of_funds.${index}.label`)}
                      placeholder="Equipment, inventory, etc."
                      className="flex-1 bg-white"
                    />
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">$</span>
                      <Input
                        type="number"
                        {...form.register(`use_of_funds.${index}.amount`, { valueAsNumber: true })}
                        placeholder="50000"
                        min="0"
                        className="w-32 bg-white"
                      />
                    </div>
                    {fundsFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFunds(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendFunds({ label: '', amount: 0 })}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Use of Funds
                </Button>
                
                {!fundsValid && (
                  <p className="text-orange-500 text-sm mt-2">
                    Total should be within 5% of loan amount (${(loanAmount * 0.95).toLocaleString()} - ${(loanAmount * 1.05).toLocaleString()})
                  </p>
                )}
              </div>

              {/* Impact Statement */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Impact Statement *</label>
                <Textarea
                  {...form.register('impact_statement')}
                  placeholder="Describe the positive impact this loan will have on your business, employees, and community..."
                  maxLength={400}
                  rows={4}
                  className="bg-white resize-none"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {(form.watch('impact_statement') || '').length}/400 characters
                </p>
                {form.formState.errors.impact_statement && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.impact_statement.message}</p>
                )}
              </div>

              {/* Collateral Section */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="pledge-collateral"
                    checked={showCollateral}
                    onChange={(e) => {
                      setShowCollateral(e.target.checked);
                      if (!e.target.checked) {
                        form.setValue('collateral_items', []);
                      }
                    }}
                    className="rounded"
                  />
                  <label htmlFor="pledge-collateral" className="text-sm font-medium text-gray-700">
                    Pledge Collateral (Optional)
                  </label>
                </div>

                {showCollateral && (
                  <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-white">
                    {collateralFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Asset Type</label>
                          <Select
                            value={form.watch(`collateral_items.${index}.asset_type`)}
                            onValueChange={(value) => form.setValue(`collateral_items.${index}.asset_type`, value as any)}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg">
                              {ASSET_TYPES.map((type) => (
                                <SelectItem key={type} value={type} className="hover:bg-gray-50">{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Description</label>
                          <Input
                            {...form.register(`collateral_items.${index}.description`)}
                            placeholder="Describe the asset"
                            className="bg-white"
                          />
                        </div>
                        <div className="flex items-end space-x-2">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Est. Value</label>
                            <Input
                              type="number"
                              {...form.register(`collateral_items.${index}.est_value`, { valueAsNumber: true })}
                              placeholder="100000"
                              min="0"
                              className="bg-white"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCollateral(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendCollateral({ asset_type: 'Equipment', description: '', est_value: 0 })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Collateral Item
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Confirmation Page */}
        {currentStep === 5 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-8 border border-blue-100">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Your Cover Letter</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Please review the information below and add any final details before completing your cover letter.
              </p>
            </div>
            
            <div className="space-y-8">
              {/* Business Overview Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <h4 className="text-white font-semibold text-lg">Business Overview</h4>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <span className="text-sm text-gray-500">Business Name</span>
                          <p className="font-medium text-gray-900">{form.watch('legal_name')}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <span className="text-sm text-gray-500">Entity Type</span>
                          <p className="font-medium text-gray-900">{form.watch('entity_type')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <span className="text-sm text-gray-500">Industry</span>
                          <p className="font-medium text-gray-900">{form.watch('industry')}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <span className="text-sm text-gray-500">Year Founded</span>
                          <p className="font-medium text-gray-900">{form.watch('year_founded')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan Details Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                  <h4 className="text-white font-semibold text-lg">Loan Request</h4>
                </div>
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <span className="text-sm text-gray-500">Requested Amount</span>
                      <p className="text-2xl font-bold text-green-600">${loanAmount?.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {form.watch('loan_purpose_explained') && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm font-medium text-gray-700">Purpose</span>
                      <p className="text-gray-900 mt-1 leading-relaxed">{form.watch('loan_purpose_explained')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Products & Services Card */}
              {form.watch('products_services') && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                    <h4 className="text-white font-semibold text-lg">Products & Services</h4>
                  </div>
                  <div className="p-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900 leading-relaxed">{form.watch('products_services')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Context */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
                  <h4 className="text-white font-semibold text-lg">Additional Context</h4>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Share any additional details about your business, qualifications, or loan request that would help strengthen your application.
                  </p>
                  <Textarea
                    {...form.register('additional_context')}
                    placeholder="Optional: Any additional context you'd like to include in your cover letter..."
                    maxLength={1000}
                    rows={4}
                    className="bg-white resize-none"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-gray-500">
                      {form.watch('additional_context')?.length || 0}/1000 characters
                    </div>
                  </div>
                  {form.formState.errors.additional_context && (
                    <p className="text-red-500 text-sm mt-2">{form.formState.errors.additional_context.message}</p>
                  )}
                </div>
              </div>

              {/* Confirmation */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    id="confirm-accuracy"
                    checked={isConfirmed}
                    onChange={(e) => setIsConfirmed(e.target.checked)}
                    className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="confirm-accuracy" className="flex-1">
                    <span className="font-semibold text-gray-900 block mb-1">
                      I confirm that all information provided is accurate and complete.
                    </span>
                    <p className="text-sm text-gray-600">
                      This information will be used to generate your professional cover letter for the loan application. You can always return to edit any details if needed.
                    </p>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
        
      </form>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="flex space-x-2">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {currentStep < 5 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceed}
              className="flex items-center space-x-2"
            >
              <span>{currentStep === 4 ? 'Review & Confirm' : 'Next'}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canProceed}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Complete Cover Letter</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
