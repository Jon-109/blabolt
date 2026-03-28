'use client';

import { useState, useEffect } from 'react';
import { FormStep, SBA413FormData, SmartGateFlags, IdentityData, AssetsData, LiabilitiesData, IncomeData, ContingentLiabilitiesData, DeclarationsData } from './types';
import SmartGate from './components/SmartGate';
import IdentityPage from './components/IdentityPage';
import AssetsPage from './components/AssetsPage';
import LiabilitiesPageNew from './components/LiabilitiesPageNew';
import IncomePage from './components/IncomePage';
import DeclarationsPage from './components/DeclarationsPage';
import ReviewPage from './components/ReviewPage';
import { Button } from '@/app/(components)/ui/button';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

// Helper to create empty form data
const createEmptyFormData = (): SBA413FormData => ({
  smart_gate: {
    is_sba: false,
    include_spouse: false,
    has_real_estate: false,
    has_securities: false,
    has_retirement: false,
    has_life_csv: false,
    owns_business: false,
    has_personal_guarantees: false,
    has_vehicles: false,
    has_personal_debt: false,
    owes_taxes: false,
    has_legal: false,
    has_crypto: false,
  },
  identity: {
    as_of_date: new Date().toISOString().split('T')[0] as string,
    filing_type: 'individual',
    applicant_name: '',
    applicant_email: '',
    applicant_phone: '',
    applicant_address_1: '',
    applicant_city: '',
    applicant_state: '',
    applicant_zip: '',
    spouse_included: false,
  },
  assets: {
    cash_accounts: [],
    securities: [],
    retirement_accounts: [],
    life_policies: [],
    real_estate: [],
    autos: [],
    other_personal_property: [],
    other_assets: [],
  },
  liabilities: {
    credit_cards: [],
    notes_loans: [],
    installments_auto: [],
    installments_other: [],
    mortgages: [],
    unpaid_taxes: [],
    other_liabilities: [],
  },
  income: {
    annual_salary: 0,
    annual_net_investment_income: 0,
    annual_real_estate_income: 0,
    annual_other_income_amount: 0,
  },
  contingent: {
    contingent_endorser_amount: 0,
    contingent_legal_claims_amount: 0,
    contingent_fed_tax_provision_amount: 0,
    contingent_other_special_debt_amount: 0,
    personal_guarantees: [],
  },
  declarations: {
    lawsuits_or_judgments: false,
    bankruptcy_history: false,
    unlisted_leases_or_contracts: false,
    partner_officer_elsewhere: false,
    jointly_held_or_trust_assets: false,
  },
  signatures: {},
});

const STORAGE_KEY = 'sba-413-draft';

export default function SBA413Page() {
  const [currentStep, setCurrentStep] = useState<FormStep>('smart-gate');
  const [formData, setFormData] = useState<SBA413FormData>(createEmptyFormData());

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed.formData || createEmptyFormData());
        setCurrentStep(parsed.currentStep || 'smart-gate');
      } catch (e) {
        console.error('Failed to load saved data:', e);
      }
    }
  }, []);

  // Save to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, currentStep }));
  }, [formData, currentStep]);

  const handleSmartGateComplete = (flags: SmartGateFlags) => {
    setFormData({
      ...formData,
      smart_gate: flags,
      identity: {
        ...formData.identity,
        spouse_included: flags.include_spouse,
        filing_type: flags.include_spouse ? 'joint' : 'individual',
      },
    });
    setCurrentStep('identity');
  };

  // Define the steps based on Smart Gate flags
  const getSteps = (): { id: FormStep; title: string; enabled: boolean }[] => {
    const flags = formData.smart_gate;
    return [
      { id: 'smart-gate', title: 'Quick Setup', enabled: true },
      { id: 'identity', title: 'Identity & Basics', enabled: true },
      { id: 'assets', title: 'Assets', enabled: true },
      { id: 'liabilities', title: 'Liabilities', enabled: true },
      { id: 'income-contingent', title: 'Income & Contingent', enabled: true },
      { id: 'declarations', title: 'Declarations & Signatures', enabled: true },
      { id: 'review', title: 'Review & Submit', enabled: true },
    ];
  };

  const steps = getSteps();
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const currentStepData = steps[currentStepIndex];
  const progress = currentStepIndex >= 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length && steps[nextIndex]) {
      setCurrentStep(steps[nextIndex].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0 && steps[prevIndex]) {
      setCurrentStep(steps[prevIndex].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 'smart-gate':
        return <SmartGate onComplete={handleSmartGateComplete} initialFlags={formData.smart_gate} />;
      
      case 'identity':
        return (
          <IdentityPage
            data={formData.identity}
            smartGate={formData.smart_gate}
            onChange={(identity: IdentityData) => setFormData({ ...formData, identity })}
            onNext={handleNext}
          />
        );
      
      case 'assets':
        return (
          <AssetsPage
            data={formData.assets}
            smartGate={formData.smart_gate}
            onChange={(assets: AssetsData) => setFormData({ ...formData, assets })}
            onNext={handleNext}
          />
        );
      
      case 'liabilities':
        return (
          <LiabilitiesPageNew
            data={formData.liabilities}
            assets={formData.assets}
            smartGate={formData.smart_gate}
            onChange={(liabilities: LiabilitiesData) => setFormData({ ...formData, liabilities })}
            onNext={handleNext}
          />
        );
      
      case 'income-contingent':
        return (
          <IncomePage
            income={formData.income}
            contingent={formData.contingent}
            smartGate={formData.smart_gate}
            onIncomeChange={(income: IncomeData) => setFormData({ ...formData, income })}
            onContingentChange={(contingent: ContingentLiabilitiesData) => setFormData({ ...formData, contingent })}
            onNext={handleNext}
          />
        );
      
      case 'declarations':
        return (
          <DeclarationsPage
            data={formData.declarations}
            onChange={(declarations: DeclarationsData) => setFormData({ ...formData, declarations })}
            onNext={handleNext}
          />
        );
      
      case 'review':
        return (
          <ReviewPage
            data={formData}
            onEdit={(step: string) => setCurrentStep(step as FormStep)}
          />
        );
      
      default:
        return null;
    }
  };

  // If we're on smart-gate, don't show the progress UI
  if (currentStep === 'smart-gate') {
    return renderStep();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-zinc-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header with Progress */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200/50 overflow-hidden backdrop-blur-sm">
          {/* Elegant Progress Bar */}
          <div className="relative h-1.5 bg-gradient-to-r from-slate-100 to-slate-50">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 transition-all duration-700 ease-out shadow-lg shadow-emerald-500/20"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="px-6 sm:px-8 lg:px-10 py-6 lg:py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent tracking-tight">SBA Form 413</h1>
                <p className="text-slate-600 text-sm sm:text-base mt-1.5 font-medium">Personal Financial Statement</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Progress</div>
                  <div className="text-2xl font-bold text-emerald-600">{currentStepIndex + 1}<span className="text-slate-400 text-lg">/{steps.length}</span></div>
                </div>
                <div className="hidden sm:block w-px h-12 bg-slate-200"></div>
                <div className="text-right max-w-[140px]">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Step</div>
                  <div className="text-sm font-bold text-slate-900 leading-tight">{currentStepData?.title || 'Loading...'}</div>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="hidden lg:flex items-center justify-between gap-2">
              {steps.map((step, index) => {
                const isComplete = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isEnabled = step.enabled;

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center w-full">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                          isComplete
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 scale-100'
                            : isCurrent
                            ? 'bg-gradient-to-br from-slate-900 to-slate-700 text-white ring-4 ring-slate-200 shadow-xl scale-110'
                            : isEnabled
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        {isComplete ? <Check className="w-5 h-5" /> : index + 1}
                      </div>
                      <div className={`mt-3 text-[10px] font-semibold text-center leading-tight px-1 transition-colors ${
                        isCurrent ? 'text-slate-900' : isComplete ? 'text-emerald-700' : 'text-slate-500'
                      }`}>
                        {step.title}
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all duration-500 ${
                        isComplete ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-slate-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Mobile Progress Indicator */}
            <div className="lg:hidden">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 font-medium">Step {currentStepIndex + 1} of {steps.length}</span>
                <span className="text-emerald-600 font-semibold">{Math.round(progress)}% Complete</span>
              </div>
              <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Current Step Content */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/50 backdrop-blur-sm overflow-hidden">
          <div className="px-6 sm:px-8 lg:px-12 py-8 lg:py-10">
            {renderStep()}
          </div>
        </div>

        {/* Navigation Buttons */}
        {currentStep !== 'review' && (
          <div className="flex items-center justify-between px-2">
            <Button
              onClick={handleBack}
              variant="outline"
              size="lg"
              disabled={currentStepIndex === 0}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-slate-600 font-medium">Auto-saving</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
