'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/(components)/ui/dialog';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Textarea } from '@/app/(components)/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/(components)/ui/select';
import { Badge } from '@/app/(components)/ui/badge';
import { X, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
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
  ASSET_TYPES,
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data
} from './cover-letter/schema';
import { useCoverLetter } from './cover-letter/useCoverLetter';

interface CoverLetterWizardProps {
  isOpen: boolean;
  onClose: () => void;
  loanPackagingId: string | null;
  loanAmount: number;
}

type WizardStep = 1 | 2 | 3 | 4;

export default function CoverLetterWizard({ 
  isOpen, 
  onClose, 
  loanPackagingId, 
  loanAmount 
}: CoverLetterWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [showCollateral, setShowCollateral] = useState(false);
  
  const { data, isLoading, error, isCompleted, updateData, saveData, markCompleted } = useCoverLetter(loanPackagingId);

  const form = useForm<CoverLetterInputs>({
    resolver: zodResolver(coverLetterSchema),
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
      products_services: [],
      differentiation: '',
      loan_purpose_explained: '',
      use_of_funds: [{ label: '', amount: 0 }],
      impact_statement: '',
      collateral_items: []
    },
    mode: 'onChange'
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

  // Load data into form when available
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      form.reset(data as CoverLetterInputs);
      setShowCollateral(Boolean(data.collateral_items && data.collateral_items.length > 0));
    }
  }, [data, form]);

  // Auto-save form data
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value && Object.keys(value).length > 0) {
        updateData(value as Partial<CoverLetterInputs>);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, updateData]);

  // Calculate progress
  const progress = (currentStep / 4) * 100;

  // Calculate owners percentage total
  const ownersTotal = form.watch('owners')?.reduce((sum, owner) => sum + (owner.percent || 0), 0) || 0;
  const ownersValid = Math.abs(ownersTotal - 100) <= 1;

  // Calculate use of funds total
  const fundsTotal = form.watch('use_of_funds')?.reduce((sum, fund) => sum + (fund.amount || 0), 0) || 0;
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
        default:
          return false;
      }
    } catch {
      return false;
    }
  };

  const canProceed = validateCurrentStep();

  const handleNext = () => {
    if (canProceed && currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const handleSaveAndExit = async () => {
    try {
      await saveData();
      toast.success('Cover letter saved!');
      onClose();
    } catch (err) {
      toast.error('Failed to save cover letter');
    }
  };

  const handleSubmit = async () => {
    try {
      const isValid = coverLetterSchema.safeParse(form.getValues()).success;
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
      toast.success('Cover letter saved!');
      onClose();
    } catch (err) {
      toast.error('Failed to submit cover letter');
    }
  };

  const addProductService = (value: string) => {
    if (value.trim()) {
      const current = form.getValues('products_services') || [];
      form.setValue('products_services', [...current, value.trim()]);
    }
  };

  const removeProductService = (index: number) => {
    const current = form.getValues('products_services') || [];
    form.setValue('products_services', current.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading cover letter...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-700">
            Generate Your Cover Letter
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="w-full bg-blue-100 rounded-full h-2 mb-6">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <form className="space-y-6">
          {/* Step 1: Business Basics */}
          {currentStep === 1 && (
            <div className="rounded-2xl shadow-lg p-6 bg-white border">
              <h3 className="text-xl font-semibold mb-4">Step 1: Business Basics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Legal Name *</label>
                  <Input
                    {...form.register('legal_name')}
                    placeholder="Enter business legal name"
                  />
                  {form.formState.errors.legal_name && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.legal_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Entity Type *</label>
                  <Select
                    value={form.watch('entity_type')}
                    onValueChange={(value) => form.setValue('entity_type', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Street Address *</label>
                  <Input
                    {...form.register('street_address')}
                    placeholder="Enter street address"
                  />
                  {form.formState.errors.street_address && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.street_address.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">City *</label>
                  <Input
                    {...form.register('city')}
                    placeholder="Enter city"
                  />
                  {form.formState.errors.city && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">State *</label>
                  <Select
                    value={form.watch('state')}
                    onValueChange={(value) => form.setValue('state', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">ZIP Code *</label>
                  <Input
                    {...form.register('zip')}
                    placeholder="12345"
                    maxLength={5}
                  />
                  {form.formState.errors.zip && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.zip.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Year Founded *</label>
                  <Input
                    type="number"
                    {...form.register('year_founded', { valueAsNumber: true })}
                    placeholder="2020"
                    min="1800"
                    max={new Date().getFullYear()}
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
            <div className="rounded-2xl shadow-lg p-6 bg-white border">
              <h3 className="text-xl font-semibold mb-4">Step 2: Ownership & Background</h3>
              
              <div className="space-y-6">
                {/* Owners */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium">Owners *</label>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${ownersValid ? 'text-green-600' : 'text-red-600'}`}>
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
                    <div key={field.id} className="flex items-center space-x-2 mb-2">
                      <Input
                        {...form.register(`owners.${index}.name`)}
                        placeholder="Owner name"
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        {...form.register(`owners.${index}.percent`, { valueAsNumber: true })}
                        placeholder="50"
                        min="0"
                        max="100"
                        className="w-20"
                      />
                      <span className="text-sm text-gray-500">%</span>
                      {ownerFields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOwner(index)}
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
                    <p className="text-red-500 text-sm mt-1">Owner percentages must total 100%</p>
                  )}
                </div>

                {/* Origin Story */}
                <div>
                  <label className="block text-sm font-medium mb-2">Origin Story (Optional)</label>
                  <Textarea
                    {...form.register('origin_story')}
                    placeholder="Tell us how your business started..."
                    maxLength={300}
                    rows={3}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {form.watch('origin_story')?.length || 0}/300 characters
                  </p>
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-sm font-medium mb-2">Industry *</label>
                  <Select
                    value={form.watch('industry')}
                    onValueChange={(value) => form.setValue('industry', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry} value={industry}>
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
            <div className="rounded-2xl shadow-lg p-6 bg-white border">
              <h3 className="text-xl font-semibold mb-4">Step 3: What You Do & Why It Works</h3>
              
              <div className="space-y-6">
                {/* Products & Services */}
                <div>
                  <label className="block text-sm font-medium mb-2">Products & Services *</label>
                  <div className="flex items-center space-x-2 mb-3">
                    <Input
                      placeholder="Enter a product or service"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addProductService(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        addProductService(input.value);
                        input.value = '';
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {form.watch('products_services')?.map((service, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                        <span>{service}</span>
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeProductService(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                  
                  {form.formState.errors.products_services && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.products_services.message}</p>
                  )}
                </div>

                {/* Differentiation */}
                <div>
                  <label className="block text-sm font-medium mb-2">What Makes You Different? (Optional)</label>
                  <Textarea
                    {...form.register('differentiation')}
                    placeholder="Describe what sets your business apart from competitors..."
                    maxLength={300}
                    rows={4}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {form.watch('differentiation')?.length || 0}/300 characters
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Loan Details & Impact */}
          {currentStep === 4 && (
            <div className="rounded-2xl shadow-lg p-6 bg-white border">
              <h3 className="text-xl font-semibold mb-4">Step 4: Loan Details & Impact</h3>
              
              <div className="space-y-6">
                {/* Loan Amount Display */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    <strong>Loan Amount:</strong> ${loanAmount.toLocaleString()}
                  </p>
                </div>

                {/* Loan Purpose */}
                <div>
                  <label className="block text-sm font-medium mb-2">Loan Purpose Explained *</label>
                  <Textarea
                    {...form.register('loan_purpose_explained')}
                    placeholder="Explain in detail why you need this loan and how it will benefit your business..."
                    maxLength={400}
                    rows={4}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {form.watch('loan_purpose_explained')?.length || 0}/400 characters
                  </p>
                  {form.formState.errors.loan_purpose_explained && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.loan_purpose_explained.message}</p>
                  )}
                </div>

                {/* Use of Funds */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium">Use of Funds *</label>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${fundsValid ? 'text-green-600' : 'text-orange-600'}`}>
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
                    <div key={field.id} className="flex items-center space-x-2 mb-2">
                      <Input
                        {...form.register(`use_of_funds.${index}.label`)}
                        placeholder="Equipment, inventory, etc."
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        {...form.register(`use_of_funds.${index}.amount`, { valueAsNumber: true })}
                        placeholder="50000"
                        min="0"
                        className="w-32"
                      />
                      {fundsFields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFunds(index)}
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
                    <p className="text-orange-500 text-sm mt-1">
                      Total should be within 5% of loan amount (${(loanAmount * 0.95).toLocaleString()} - ${(loanAmount * 1.05).toLocaleString()})
                    </p>
                  )}
                </div>

                {/* Impact Statement */}
                <div>
                  <label className="block text-sm font-medium mb-2">Impact Statement *</label>
                  <Textarea
                    {...form.register('impact_statement')}
                    placeholder="Describe the positive impact this loan will have on your business, employees, and community..."
                    maxLength={400}
                    rows={4}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {form.watch('impact_statement')?.length || 0}/400 characters
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
                    <label htmlFor="pledge-collateral" className="text-sm font-medium">
                      Pledge Collateral (Optional)
                    </label>
                  </div>

                  {showCollateral && (
                    <div className="space-y-4 border border-gray-200 rounded-lg p-4">
                      {collateralFields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Asset Type</label>
                            <Select
                              value={form.watch(`collateral_items.${index}.asset_type`)}
                              onValueChange={(value) => form.setValue(`collateral_items.${index}.asset_type`, value as any)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                {ASSET_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Description</label>
                            <Input
                              {...form.register(`collateral_items.${index}.description`)}
                              placeholder="Describe the asset"
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
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeCollateral(index)}
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
        </form>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveAndExit}
            >
              Save & Exit
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
              >
                Previous
              </Button>
            )}
            
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceed}
                className="bg-green-600 hover:bg-green-700"
              >
                Submit Cover Letter
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
