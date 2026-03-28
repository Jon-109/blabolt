'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  Link2,
  Loader2,
  Package,
  Percent,
  ShieldCheck,
  Wallet,
  Upload,
} from 'lucide-react';
import ContextAssistant from '@/app/(components)/ai/ContextAssistant';
import { LOAN_PURPOSE_OPTIONS, type TemplateKey } from '@/lib/loan-packaging/constants';
import { loanPurposes as calculatorLoanPurposes } from '@/lib/loanPurposes';
import { supabase } from '@/supabase/helpers/client';
import { getTemplateSharedProfile, upsertTemplateSharedProfile } from '@/lib/templates/profile';

interface LoanPackagingDashboardClientProps {
  headingClassName: string;
  bodyClassName: string;
  pendingCheckoutSessionId?: string | null;
}

interface LoanRequestRow {
  id: string;
  service_type: 'loan_packaging' | 'loan_brokering';
  status: string;
  business_name: string | null;
  business_description: string | null;
  loan_purpose: string | null;
  loan_amount: number | null;
  annual_revenue: number | null;
  years_in_business: number | null;
  cover_letter_status: string;
  cover_letter_inputs: Record<string, unknown> | null;
  cover_letter_content: string | null;
  package_zip_path: string | null;
  package_zip_generated_at: string | null;
  package_download_url?: string | null;
}

interface DocumentRequirement {
  requirement_key: string;
  category: string;
  display_name: string;
  description: string;
  required: boolean;
  template_key: TemplateKey | null;
  sort_order: number;
  max_size_mb: number;
  slot_context?: {
    slot_type: string | null;
    slot_label: string | null;
    target_year: number | null;
    period_kind: string | null;
  };
}

interface LoanRequestDocument {
  id: string;
  requirement_key: string;
  status: 'not_started' | 'uploaded' | 'generated' | 'approved';
  source: 'upload' | 'template' | 'generated';
  file_path: string | null;
  download_url?: string | null;
  uploaded_at: string | null;
  metadata: Record<string, unknown> | null;
}

interface TemplateSubmission {
  id: string;
  template_key: TemplateKey;
  status: string;
  completion_pct: number;
  form_data: Record<string, unknown>;
  derived_metrics: Record<string, number>;
  updated_at: string;
}

interface SharedProfile {
  personalName?: string;
  businessName?: string;
  businessLegalName?: string;
  loanPurpose?: string;
  loanAmount?: number;
  annualRevenue?: number;
  yearsInBusiness?: number;
  businessDescription?: string;
}

interface LenderLink {
  id: string;
  title: string | null;
  expires_at: string;
  is_revoked: boolean;
  access_count: number;
  last_accessed_at: string | null;
  shareUrl: string;
}

interface DashboardPayload {
  loanRequest: LoanRequestRow | null;
  requirements: DocumentRequirement[];
  documents: LoanRequestDocument[];
  templateSubmissions: TemplateSubmission[];
  sharedProfile: SharedProfile;
  templateSharedContext: Record<string, unknown>;
  loanRequestTemplateContext: Record<string, unknown>;
  cashFlowTemplatePrefill: Record<string, unknown>;
  latestCashFlowAnalysisId: string | null;
  progress: {
    totalRequired: number;
    completedRequired: number;
    percentage: number;
    nextRequirement: {
      requirementKey: string;
      displayName: string;
    } | null;
  };
}

interface LoanFormState {
  businessName: string;
  loanPurpose: string;
  loanAmount: string;
  annualRevenue: string;
  yearsInBusiness: string;
  loanPurposeDescription: string;
}

interface CoverLetterFormState {
  foundedYear: string;
  businessOverview: string;
  targetCustomers: string;
  competitiveAdvantage: string;
  fundUseDetails: string;
  urgencyReason: string;
  noLoanConsequence: string;
  expectedOutcome: string;
  recentPerformance: string;
  recentChanges: string;
  revenueCashflowImpact: string;
  repaymentConfidence: string;
  ownerStrengths: string;
  riskManagement: string;
  additionalContext: string;
  priorDebtExperience: '' | 'yes' | 'no';
  priorDebtExperienceDetails: string;
  purposeSpecificAnswers: Record<string, string>;
}

type CoverLetterSectionId = 1 | 2 | 3 | 4;

interface PurposeSpecificCoverLetterPrompt {
  key: string;
  section: CoverLetterSectionId;
  label: string;
  placeholder: string;
}

interface PackageBuildResult {
  packagePath: string;
  downloadUrl: string | null;
  archiveFileName: string;
  generatedAt: string;
  fileCount: number;
  packageSizeBytes: number;
}

interface FinancingEstimateState {
  purposeKey: string;
  interestRate: string;
  downPaymentPct: string;
  downPaymentAmount: string;
  termYears: string;
}

interface FinancingDefaults {
  termMonths: number;
  annualRatePct: number;
  downPaymentPct: number;
  paymentMode: 'amortized' | 'interest_only';
  summary: string;
}

function formatCurrency(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return 'N/A';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'N/A';
  }

  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function parseNullableNumber(value: string): number | null {
  const normalized = value.replace(/,/g, '').trim();
  if (!normalized) {
    return null;
  }

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

function sanitizeCurrencyInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;
  return `${cleaned.slice(0, firstDot + 1)}${cleaned.slice(firstDot + 1).replace(/\./g, '')}`;
}

function formatCurrencyInput(value: string): string {
  const numeric = parseNullableNumber(value);
  if (numeric === null) return '';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(numeric);
}

function formatPercentInput(value: number): string {
  if (!Number.isFinite(value)) {
    return '';
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);
}

function clampNumber(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function mapStatusColor(status: LoanRequestDocument['status']): string {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'generated':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'uploaded':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-stone-100 text-stone-700 border-stone-200';
  }
}

function bytesToDisplay(value: number): string {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function buildPackageDownloadFileName(businessName: string | null | undefined): string {
  const normalized = (businessName ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

  return normalized ? `${normalized}-loan-package.zip` : 'loan-package.zip';
}

async function downloadFileFromUrl(url: string, fileName: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
    return;
  } catch {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

const DEFAULT_FINANCING_ESTIMATE: FinancingEstimateState = {
  purposeKey: '',
  interestRate: '',
  downPaymentPct: '',
  downPaymentAmount: '',
  termYears: '',
};

function fromCalculatorPurpose(
  key: keyof typeof calculatorLoanPurposes,
  summary: string,
  paymentMode: FinancingDefaults['paymentMode'] = 'amortized',
): FinancingDefaults {
  const config = calculatorLoanPurposes[key];
  if (!config) {
    return {
      ...FALLBACK_FINANCING_DEFAULTS,
      paymentMode,
      summary,
    };
  }

  return {
    termMonths: config.defaultTerm,
    annualRatePct: config.defaultRate * 100,
    downPaymentPct: (config.defaultDownPaymentPct ?? 0) * 100,
    paymentMode,
    summary,
  };
}

const FALLBACK_FINANCING_DEFAULTS: FinancingDefaults = {
  termMonths: 60,
  annualRatePct: 8.5,
  downPaymentPct: 10,
  paymentMode: 'amortized',
  summary: 'Estimated with a general business-purpose loan structure until the request is more defined.',
};

const FINANCING_DEFAULTS_BY_PURPOSE: Record<string, FinancingDefaults> = {
  'Working Capital': fromCalculatorPurpose(
    'Working Capital',
    'Estimated as a short-term working capital loan using the home-page quick calculator defaults.',
  ),
  'Equipment Purchase': fromCalculatorPurpose(
    'Equipment Purchase',
    'Estimated as an equipment term loan using the home-page quick calculator defaults.',
  ),
  'Inventory Purchase': fromCalculatorPurpose(
    'Inventory Purchase',
    'Estimated as a short inventory cycle loan using the home-page quick calculator defaults.',
  ),
  'Business Acquisition': fromCalculatorPurpose(
    'Business Acquisition',
    'Estimated as an acquisition loan using the home-page quick calculator defaults.',
  ),
  'Commercial Real Estate Purchase': {
    termMonths: 120,
    annualRatePct: 6,
    downPaymentPct: 20,
    paymentMode: 'amortized',
    summary: 'Estimated with a conservative commercial real estate purchase structure.',
  },
  'Commercial Real Estate Refinance': {
    termMonths: 120,
    annualRatePct: 6,
    downPaymentPct: 0,
    paymentMode: 'amortized',
    summary: 'Estimated with a long-term owner-occupied commercial refinance structure.',
  },
  'Debt Refinance / Consolidation': fromCalculatorPurpose(
    'Debt Refinancing',
    'Estimated as a consolidation refinance using the home-page quick calculator defaults.',
  ),
  'Business Expansion / New Location': {
    termMonths: 84,
    annualRatePct: 8,
    downPaymentPct: 10,
    paymentMode: 'amortized',
    summary: 'Estimated as a growth / expansion term loan with a realistic lender-style structure.',
  },
  'Tenant Improvements / Renovation': {
    termMonths: 84,
    annualRatePct: 8,
    downPaymentPct: 10,
    paymentMode: 'amortized',
    summary: 'Estimated as a tenant improvement or renovation term loan with realistic market assumptions.',
  },
  'Partner Buyout': {
    termMonths: 84,
    annualRatePct: 8,
    downPaymentPct: 10,
    paymentMode: 'amortized',
    summary: 'Estimated as a partner buyout term loan with realistic market assumptions.',
  },
  'Franchise Purchase': {
    termMonths: 84,
    annualRatePct: 8,
    downPaymentPct: 20,
    paymentMode: 'amortized',
    summary: 'Estimated as a franchise acquisition loan with realistic lender-style assumptions.',
  },
  'Bridge Financing': {
    termMonths: 12,
    annualRatePct: 10.5,
    downPaymentPct: 0,
    paymentMode: 'interest_only',
    summary: 'Estimated as a short-term bridge structure using interest-only payments.',
  },
  'Revolving Line of Credit': fromCalculatorPurpose(
    'Line of Credit',
    'Estimated as an interest-only revolving line using the home-page quick calculator defaults.',
    'interest_only',
  ),
  Other: FALLBACK_FINANCING_DEFAULTS,
};

function getFinancingDefaults(loanPurpose: string): FinancingDefaults {
  return FINANCING_DEFAULTS_BY_PURPOSE[loanPurpose] ?? FALLBACK_FINANCING_DEFAULTS;
}

function buildFinancingEstimateState(loanPurpose: string, loanAmount: string): FinancingEstimateState {
  const defaults = getFinancingDefaults(loanPurpose);
  const loanAmountValue = parseNullableNumber(loanAmount) ?? 0;
  const downPaymentAmount = loanAmountValue * (defaults.downPaymentPct / 100);

  return {
    purposeKey: loanPurpose,
    interestRate: formatPercentInput(defaults.annualRatePct),
    downPaymentPct: formatPercentInput(defaults.downPaymentPct),
    downPaymentAmount: formatCurrencyInput(String(downPaymentAmount)),
    termYears: String(Math.max(defaults.termMonths / 12, 1)),
  };
}

function calculateEstimatedMonthlyPayment(
  principal: number,
  annualRatePct: number,
  termMonths: number,
  paymentMode: FinancingDefaults['paymentMode'],
): number | null {
  if (!(principal > 0) || !(annualRatePct >= 0) || !(termMonths > 0)) {
    return null;
  }

  const monthlyRate = annualRatePct / 100 / 12;

  if (paymentMode === 'interest_only') {
    return principal * monthlyRate;
  }

  if (monthlyRate === 0) {
    return principal / termMonths;
  }

  return (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
}

const EMPTY_COVER_LETTER_FORM: CoverLetterFormState = {
  foundedYear: '',
  businessOverview: '',
  targetCustomers: '',
  competitiveAdvantage: '',
  fundUseDetails: '',
  urgencyReason: '',
  noLoanConsequence: '',
  expectedOutcome: '',
  recentPerformance: '',
  recentChanges: '',
  revenueCashflowImpact: '',
  repaymentConfidence: '',
  ownerStrengths: '',
  riskManagement: '',
  additionalContext: '',
  priorDebtExperience: '',
  priorDebtExperienceDetails: '',
  purposeSpecificAnswers: {},
};

const PURPOSE_SPECIFIC_COVER_LETTER_PROMPTS: Record<string, PurposeSpecificCoverLetterPrompt[]> = {
  'Working Capital': [
    {
      key: 'working_capital_context',
      section: 1,
      label: 'What part of the business or customer cycle is driving this working capital need?',
      placeholder: 'Describe the customer, payment, inventory, or operating pattern behind the need.',
    },
    {
      key: 'cash_cycle_pressure',
      section: 2,
      label: 'What working-capital pressure or cash-cycle gap is this solving?',
      placeholder: 'Explain whether this is covering payroll timing, receivables lag, supplier terms, seasonal buildup, or another cash-cycle need.',
    },
    {
      key: 'cash_conversion_timeline',
      section: 3,
      label: 'How quickly should this financing convert back into cash?',
      placeholder: 'Describe how receivables, contracts, inventory turns, or customer payments will bring the business back to normal liquidity.',
    },
  ],
  'Equipment Purchase': [
    {
      key: 'equipment_operational_context',
      section: 1,
      label: 'What part of the operation will this equipment support?',
      placeholder: 'Explain where the equipment fits in production, service delivery, or fulfillment.',
    },
    {
      key: 'equipment_details',
      section: 2,
      label: 'What equipment is being purchased, and what does it do operationally?',
      placeholder: 'Describe the equipment, whether it is new or used, and how it fits into the business day to day.',
    },
    {
      key: 'equipment_impact',
      section: 3,
      label: 'How will this equipment improve production, efficiency, or revenue?',
      placeholder: 'Explain expected throughput gains, cost savings, expanded capacity, or revenue impact.',
    },
  ],
  'Inventory Purchase': [
    {
      key: 'inventory_business_context',
      section: 1,
      label: 'What product lines or customer demand are driving this inventory request?',
      placeholder: 'Describe the products, customer demand, and why inventory depth matters to the business.',
    },
    {
      key: 'inventory_type',
      section: 2,
      label: 'What inventory is being purchased and why is this the right time to buy it?',
      placeholder: 'Describe the inventory categories, timing, and whether this is seasonal, bulk-buy, or demand driven.',
    },
    {
      key: 'inventory_turn',
      section: 3,
      label: 'How quickly is this inventory expected to turn into sales?',
      placeholder: 'Explain expected sell-through timing, customer demand, margins, and any seasonality lenders should understand.',
    },
  ],
  'Business Acquisition': [
    {
      key: 'acquisition_operator_fit',
      section: 1,
      label: 'How does the target business fit your experience or strategic plan?',
      placeholder: 'Explain your operating fit, industry experience, and why this business makes sense for you.',
    },
    {
      key: 'acquisition_thesis',
      section: 2,
      label: 'Why is this acquisition attractive and strategically important?',
      placeholder: 'Explain why the target business fits, what makes it attractive, and why this is a strong transaction.',
    },
    {
      key: 'post_close_plan',
      section: 4,
      label: 'What is the transition plan after closing?',
      placeholder: 'Describe management continuity, operational oversight, and how the business will be run after the acquisition.',
    },
  ],
  'Commercial Real Estate Purchase': [
    {
      key: 'property_business_fit',
      section: 1,
      label: 'How does this property fit the business model or long-term plan?',
      placeholder: 'Explain why this property matters to the operating business or investment strategy.',
    },
    {
      key: 'property_use',
      section: 2,
      label: 'How will this property be used by the business?',
      placeholder: 'Explain whether it is owner-occupied, partially leased, or investment-oriented and why the property matters.',
    },
    {
      key: 'property_support',
      section: 3,
      label: 'How does the property support business stability or growth?',
      placeholder: 'Describe location benefits, occupancy context, or operational advantages tied to the purchase.',
    },
  ],
  'Commercial Real Estate Refinance': [
    {
      key: 'property_current_use',
      section: 1,
      label: 'How is the property currently being used today?',
      placeholder: 'Describe owner occupancy, tenants, property role, and current stability.',
    },
    {
      key: 'refinance_benefit',
      section: 2,
      label: 'What is the primary benefit of the refinance?',
      placeholder: 'Explain whether the refinance lowers payments, improves maturity, takes cash out for a defined purpose, or strengthens the overall structure.',
    },
    {
      key: 'property_performance',
      section: 3,
      label: 'How has the property been performing recently?',
      placeholder: 'Add occupancy, rent-roll, tenant, or operating-statement context that supports the refinance request.',
    },
  ],
  'Debt Refinance / Consolidation': [
    {
      key: 'refinance_business_context',
      section: 1,
      label: 'What does the business look like today that supports a stronger refinance case?',
      placeholder: 'Describe current operations, stability, and why the business is in a better position to refinance now.',
    },
    {
      key: 'debt_issue',
      section: 2,
      label: 'What problem does the refinance solve with the current debt structure?',
      placeholder: 'Explain rate pressure, multiple payments, short maturities, or restrictive terms that make the current setup inefficient.',
    },
    {
      key: 'payment_improvement',
      section: 3,
      label: 'How will the new structure improve monthly debt service or cash flow?',
      placeholder: 'Describe the before-and-after impact on payment burden, flexibility, or coverage.',
    },
  ],
  'Business Expansion / New Location': [
    {
      key: 'expansion_market_context',
      section: 1,
      label: 'What market or customer demand is behind this expansion?',
      placeholder: 'Explain the demand trend, geographic opportunity, or customer need supporting this move.',
    },
    {
      key: 'expansion_case',
      section: 2,
      label: 'Why does this expansion or new location make sense now?',
      placeholder: 'Explain the demand signal, timing, and why this move is strategically important now.',
    },
    {
      key: 'expansion_plan',
      section: 4,
      label: 'What is the staffing or ramp-up plan for the expansion?',
      placeholder: 'Describe hiring, opening timeline, rollout steps, and how the expansion will be managed responsibly.',
    },
  ],
  'Tenant Improvements / Renovation': [
    {
      key: 'renovation_business_context',
      section: 1,
      label: 'How will the updated space better serve customers or operations?',
      placeholder: 'Describe how the location or facility supports service quality, capacity, or customer experience.',
    },
    {
      key: 'renovation_scope',
      section: 2,
      label: 'What work is being completed and why is it needed?',
      placeholder: 'Describe the buildout, renovation scope, and the business reason it matters now.',
    },
    {
      key: 'renovation_timeline',
      section: 4,
      label: 'What is the timeline and contingency plan for the project?',
      placeholder: 'Explain the expected schedule, contractor coordination, and how the business will manage delays or overruns.',
    },
  ],
  'Partner Buyout': [
    {
      key: 'buyout_business_context',
      section: 1,
      label: 'What will the business look like operationally after the ownership change?',
      placeholder: 'Describe the business model, leadership continuity, and why the company remains stable post-buyout.',
    },
    {
      key: 'buyout_reason',
      section: 2,
      label: 'Why is the partner buyout happening now?',
      placeholder: 'Explain the transaction context, ownership rationale, and why the timing makes sense.',
    },
    {
      key: 'post_buyout_structure',
      section: 4,
      label: 'How will management and ownership look after the buyout?',
      placeholder: 'Describe decision-making, day-to-day control, and why the business will be stronger after the transition.',
    },
  ],
  'Franchise Purchase': [
    {
      key: 'franchise_market_context',
      section: 1,
      label: 'What customer or market opportunity makes this franchise attractive?',
      placeholder: 'Explain the local demand, market fit, and why this brand/location combination makes sense.',
    },
    {
      key: 'franchise_fit',
      section: 2,
      label: 'Why this franchise, and why are you a good operator for it?',
      placeholder: 'Explain the brand fit, market opportunity, and your operating background or execution strengths.',
    },
    {
      key: 'franchise_support',
      section: 4,
      label: 'What franchisor support or assumptions strengthen this request?',
      placeholder: 'Describe training, onboarding, location support, benchmarks, or operating assumptions from the franchise system.',
    },
  ],
  'Bridge Financing': [
    {
      key: 'bridge_transaction_context',
      section: 1,
      label: 'What transaction or near-term event is creating the bridge need?',
      placeholder: 'Describe the pending sale, refinance, capital event, or timing gap behind the bridge request.',
    },
    {
      key: 'bridge_exit',
      section: 2,
      label: 'What is the exit strategy for this bridge loan?',
      placeholder: 'Explain exactly what event is expected to repay the bridge and the expected timing.',
    },
    {
      key: 'bridge_backup',
      section: 4,
      label: 'What backup support exists if the expected payoff takes longer?',
      placeholder: 'Describe collateral, liquidity, secondary repayment support, or contingency planning.',
    },
  ],
  'Revolving Line of Credit': [
    {
      key: 'line_business_context',
      section: 1,
      label: 'What operating cycle or customer pattern makes a revolving line appropriate here?',
      placeholder: 'Describe the receivables, seasonality, or working-capital pattern that fits a line of credit.',
    },
    {
      key: 'line_usage',
      section: 2,
      label: 'How will the line of credit be used in practice?',
      placeholder: 'Explain expected draw uses, how often it will revolve, and what operating cycle it supports.',
    },
    {
      key: 'line_repayment_cycle',
      section: 3,
      label: 'What receivable or cash-flow cycle supports repayment of the line?',
      placeholder: 'Describe collections timing, customer concentration, seasonality, and how the line pays down.',
    },
  ],
  Other: [
    {
      key: 'custom_business_context',
      section: 1,
      label: 'What is the broader business or transaction context a lender should know first?',
      placeholder: 'Set the stage for the request before getting into the specific financing need.',
    },
    {
      key: 'custom_transaction_context',
      section: 2,
      label: 'What is unique about this financing request that a lender should understand?',
      placeholder: 'Explain the specific transaction, timing, and why this request does not fit a standard category.',
    },
    {
      key: 'custom_repayment_context',
      section: 4,
      label: 'What specifically supports repayment for this request?',
      placeholder: 'Describe the operating, contractual, collateral, or cash-flow factors that make repayment reasonable.',
    },
  ],
};

function getPurposeSpecificCoverLetterPrompts(
  loanPurpose: string,
): PurposeSpecificCoverLetterPrompt[] {
  return PURPOSE_SPECIFIC_COVER_LETTER_PROMPTS[loanPurpose] ?? [];
}

function asCoverLetterText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizePriorDebtExperience(value: unknown): CoverLetterFormState['priorDebtExperience'] {
  return value === 'yes' || value === 'no' ? value : '';
}

function buildCoverLetterFormState(inputs: Record<string, unknown> | null | undefined): CoverLetterFormState {
  const source = inputs ?? {};

  return {
    foundedYear: asCoverLetterText(source.foundedYear),
    businessOverview: asCoverLetterText(source.businessOverview),
    targetCustomers: asCoverLetterText(source.targetCustomers),
    competitiveAdvantage: asCoverLetterText(source.competitiveAdvantage),
    fundUseDetails: asCoverLetterText(source.fundUseDetails),
    urgencyReason: asCoverLetterText(source.urgencyReason),
    noLoanConsequence: asCoverLetterText(source.noLoanConsequence),
    expectedOutcome: asCoverLetterText(source.expectedOutcome),
    recentPerformance: asCoverLetterText(source.recentPerformance),
    recentChanges: asCoverLetterText(source.recentChanges),
    revenueCashflowImpact: asCoverLetterText(source.revenueCashflowImpact),
    repaymentConfidence: asCoverLetterText(source.repaymentConfidence),
    ownerStrengths: asCoverLetterText(source.ownerStrengths),
    riskManagement: asCoverLetterText(source.riskManagement),
    additionalContext: asCoverLetterText(source.additionalContext),
    priorDebtExperience: normalizePriorDebtExperience(source.priorDebtExperience),
    priorDebtExperienceDetails: asCoverLetterText(source.priorDebtExperienceDetails),
    purposeSpecificAnswers:
      source.purposeSpecificAnswers &&
      typeof source.purposeSpecificAnswers === 'object' &&
      !Array.isArray(source.purposeSpecificAnswers)
        ? Object.fromEntries(
            Object.entries(source.purposeSpecificAnswers as Record<string, unknown>).flatMap(
              ([key, value]) =>
                typeof value === 'string'
                  ? [[key, value]]
                  : [],
            ),
          )
        : {},
  };
}

export default function LoanPackagingDashboardClient({
  headingClassName,
  bodyClassName,
  pendingCheckoutSessionId = null,
}: LoanPackagingDashboardClientProps) {
  const router = useRouter();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [sharedProfile, setSharedProfile] = useState<SharedProfile>({});
  const [bootstrapping, setBootstrapping] = useState(true);

  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const [loanForm, setLoanForm] = useState<LoanFormState>({
    businessName: '',
    loanPurpose: '',
    loanAmount: '',
    annualRevenue: '',
    yearsInBusiness: '',
    loanPurposeDescription: '',
  });
  const [coverLetterForm, setCoverLetterForm] = useState<CoverLetterFormState>(EMPTY_COVER_LETTER_FORM);
  const [financingEstimate, setFinancingEstimate] = useState<FinancingEstimateState>(DEFAULT_FINANCING_ESTIMATE);

  const [savingLoanDetails, setSavingLoanDetails] = useState(false);
  const [uploadingRequirementKey, setUploadingRequirementKey] = useState<string | null>(null);
  const [buildingPackage, setBuildingPackage] = useState(false);
  const [downloadingPackage, setDownloadingPackage] = useState(false);
  const [packageResult, setPackageResult] = useState<PackageBuildResult | null>(null);
  const [coverLetterDraft, setCoverLetterDraft] = useState('');
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
  const [approvingCoverLetter, setApprovingCoverLetter] = useState(false);

  const [lenderTitle, setLenderTitle] = useState('Lender Package Access');
  const [lenderPassword, setLenderPassword] = useState('');
  const [lenderExpiresInDays, setLenderExpiresInDays] = useState('14');
  const [creatingLenderLink, setCreatingLenderLink] = useState(false);
  const [lenderLinks, setLenderLinks] = useState<LenderLink[]>([]);
  const [loadingLenderLinks, setLoadingLenderLinks] = useState(false);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sharedProfileRef = useRef<SharedProfile>({});

  const documentByRequirementKey = useMemo(() => {
    const items = dashboard?.documents ?? [];
    return new Map(items.map((document) => [document.requirement_key, document]));
  }, [dashboard?.documents]);

  const templateSubmissionByKey = useMemo(() => {
    const entries = (dashboard?.templateSubmissions ?? []).map((submission) => [
      submission.template_key,
      submission,
    ] as const);

    return new Map(entries);
  }, [dashboard?.templateSubmissions]);

  const loanProfileComplete = useMemo(() => {
    return (
      loanForm.businessName.trim().length > 0 &&
      loanForm.loanPurpose.trim().length > 0 &&
      loanForm.loanAmount.trim().length > 0
    );
  }, [loanForm.businessName, loanForm.loanPurpose, loanForm.loanAmount]);

  const documentsComplete = useMemo(() => {
    const progress = dashboard?.progress;
    if (!progress || progress.totalRequired === 0) {
      return false;
    }

    return progress.completedRequired >= progress.totalRequired;
  }, [dashboard?.progress]);

  const coverLetterComplete = dashboard?.loanRequest?.cover_letter_status === 'approved';

  const packageComplete = Boolean(dashboard?.loanRequest?.package_zip_path);
  const latestPackageDownloadUrl =
    packageResult?.downloadUrl ?? dashboard?.loanRequest?.package_download_url ?? null;
  const latestPackageFileName =
    packageResult?.archiveFileName ??
    buildPackageDownloadFileName(dashboard?.loanRequest?.business_name);
  const loanAmountValue = parseNullableNumber(loanForm.loanAmount) ?? 0;
  const selectedLoanPurposeLabel = loanForm.loanPurpose.trim() || 'this request';
  const currentFinancingDefaults = getFinancingDefaults(loanForm.loanPurpose);
  const financingInterestRateValue = parseNullableNumber(financingEstimate.interestRate) ?? currentFinancingDefaults.annualRatePct;
  const financingDownPaymentAmountValue = parseNullableNumber(financingEstimate.downPaymentAmount) ?? 0;
  const financingTermYearsValue = Math.max(
    Math.round(parseNullableNumber(financingEstimate.termYears) ?? currentFinancingDefaults.termMonths / 12),
    1,
  );
  const financingTermMonthsValue = financingTermYearsValue * 12;
  const financedAmount = Math.max(loanAmountValue - financingDownPaymentAmountValue, 0);
  const estimatedMonthlyPayment = calculateEstimatedMonthlyPayment(
    financedAmount,
    financingInterestRateValue,
    financingTermMonthsValue,
    currentFinancingDefaults.paymentMode,
  );
  const purposeSpecificCoverLetterPrompts = getPurposeSpecificCoverLetterPrompts(
    loanForm.loanPurpose,
  );

  const coverLetterReady = useMemo(() => {
    const requiredFields = [
      coverLetterForm.foundedYear,
      coverLetterForm.businessOverview,
      coverLetterForm.targetCustomers,
      coverLetterForm.fundUseDetails,
      coverLetterForm.urgencyReason,
      coverLetterForm.recentPerformance,
      coverLetterForm.revenueCashflowImpact,
      coverLetterForm.repaymentConfidence,
    ];

    const purposeSpecificFieldsComplete = purposeSpecificCoverLetterPrompts.every(
      (prompt) => (coverLetterForm.purposeSpecificAnswers[prompt.key] ?? '').trim().length > 0,
    );

    return requiredFields.every((value) => value.trim().length > 0) && purposeSpecificFieldsComplete;
  }, [coverLetterForm, purposeSpecificCoverLetterPrompts]);

  const workflowSteps = [
    {
      id: 'loan-profile',
      title: 'Loan Profile',
      complete: loanProfileComplete,
    },
    {
      id: 'documents',
      title: 'Document Checklist',
      complete: documentsComplete,
    },
    {
      id: 'cover-letter',
      title: 'Cover Letter',
      complete: coverLetterComplete,
    },
    {
      id: 'package',
      title: 'Package Build',
      complete: packageComplete,
    },
  ];

  const nextWorkflowAction = !loanProfileComplete
    ? 'Complete the loan profile so the rest of the package can reuse your core request details.'
    : !documentsComplete
      ? dashboard?.progress.nextRequirement
        ? `Complete ${dashboard.progress.nextRequirement.displayName} to finish the required checklist.`
        : 'Finish the remaining required checklist items.'
      : !coverLetterComplete
        ? 'Complete and approve the cover letter so lenders understand the story behind the numbers.'
        : !packageComplete
          ? 'Build the package ZIP and create lender access once the package is fully ready.'
          : 'Your lender package is ready to download and share.';

  const apiFetch = useCallback(
    async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
      if (!accessToken) {
        throw new Error('Missing access token');
      }

      const headers = new Headers(options.headers || {});
      headers.set('Authorization', `Bearer ${accessToken}`);
      if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }

      const response = await fetch(path, {
        ...options,
        headers,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          payload && typeof payload === 'object' && 'error' in payload
            ? String((payload as { error?: unknown }).error ?? 'Request failed')
            : 'Request failed';
        throw new Error(message);
      }

      return payload as T;
    },
    [accessToken],
  );

  useEffect(() => {
    sharedProfileRef.current = sharedProfile;
  }, [sharedProfile]);

  const hydrateDashboardState = useCallback((payload: DashboardPayload) => {
    const nextSharedProfile = payload.sharedProfile ?? sharedProfileRef.current;
    const fallbackBusinessName =
      nextSharedProfile.businessName || nextSharedProfile.businessLegalName || '';

    setSharedProfile(nextSharedProfile);
    setDashboard(payload);
    setCoverLetterDraft(payload.loanRequest?.cover_letter_content ?? '');
    setCoverLetterForm(buildCoverLetterFormState(payload.loanRequest?.cover_letter_inputs));

    const loanRequest = payload.loanRequest;
    setLoanForm({
      businessName: loanRequest?.business_name || fallbackBusinessName,
      loanPurpose: loanRequest?.loan_purpose || nextSharedProfile.loanPurpose || '',
      loanAmount:
        loanRequest?.loan_amount != null
          ? formatCurrencyInput(String(loanRequest.loan_amount))
          : nextSharedProfile.loanAmount != null
            ? formatCurrencyInput(String(nextSharedProfile.loanAmount))
            : '',
      annualRevenue:
        loanRequest?.annual_revenue != null
          ? formatCurrencyInput(String(loanRequest.annual_revenue))
          : nextSharedProfile.annualRevenue != null
            ? formatCurrencyInput(String(nextSharedProfile.annualRevenue))
            : '',
      yearsInBusiness:
        loanRequest?.years_in_business != null
          ? String(loanRequest.years_in_business)
          : nextSharedProfile.yearsInBusiness != null
            ? String(nextSharedProfile.yearsInBusiness)
            : '',
      loanPurposeDescription:
        loanRequest?.business_description || nextSharedProfile.businessDescription || '',
    });
  }, []);

  useEffect(() => {
    if (!loanForm.loanPurpose) {
      if (financingEstimate.purposeKey) {
        setFinancingEstimate(DEFAULT_FINANCING_ESTIMATE);
      }
      return;
    }

    if (financingEstimate.purposeKey !== loanForm.loanPurpose) {
      setFinancingEstimate(buildFinancingEstimateState(loanForm.loanPurpose, loanForm.loanAmount));
    }
  }, [financingEstimate.purposeKey, loanForm.loanAmount, loanForm.loanPurpose]);

  useEffect(() => {
    if (!loanForm.loanPurpose || !financingEstimate.purposeKey) {
      return;
    }

    setFinancingEstimate((previous) => {
      const currentPct =
        parseNullableNumber(previous.downPaymentPct) ?? currentFinancingDefaults.downPaymentPct;
      const nextAmount = Math.max(loanAmountValue * (currentPct / 100), 0);
      const nextFormattedAmount =
        loanAmountValue > 0 ? formatCurrencyInput(String(nextAmount)) : '';

      if (previous.downPaymentAmount === nextFormattedAmount) {
        return previous;
      }

      return {
        ...previous,
        downPaymentAmount: nextFormattedAmount,
      };
    });
  }, [
    currentFinancingDefaults.downPaymentPct,
    financingEstimate.purposeKey,
    loanAmountValue,
    loanForm.loanPurpose,
  ]);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    setErrorMessage(null);

    try {
      const payload = await apiFetch<DashboardPayload>('/api/loan-packaging/dashboard');
      hydrateDashboardState(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load dashboard');
    } finally {
      setDashboardLoading(false);
    }
  }, [apiFetch, hydrateDashboardState]);

  const loadLenderLinks = useCallback(async () => {
    if (!dashboard?.loanRequest?.id) {
      setLenderLinks([]);
      return;
    }

    setLoadingLenderLinks(true);

    try {
      const result = await apiFetch<{ links: LenderLink[] }>(
        `/api/loan-packaging/lender-link?loanRequestId=${dashboard.loanRequest.id}`,
      );
      setLenderLinks(result.links ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load lender links');
    } finally {
      setLoadingLenderLinks(false);
    }
  }, [apiFetch, dashboard?.loanRequest?.id]);

  useEffect(() => {
    let cancelled = false;

    async function initializeSession() {
      const { data, error } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      if (error || !data.session) {
        router.replace('/login?redirectTo=/loan-packaging');
        return;
      }

      const fetchAccessPayload = async () => {
        const response = await fetch('/api/access/me', {
          cache: 'no-store',
          headers: data.session?.access_token
            ? { Authorization: `Bearer ${data.session.access_token}` }
            : undefined,
        });

        if (!response.ok) {
          return { payload: null, responseOk: false };
        }

        return {
          payload: await response.json(),
          responseOk: true,
        };
      };

      const maxAccessChecks = pendingCheckoutSessionId ? 5 : 1;
      let accessPayload:
        | {
            canAccessLoanPackaging?: boolean;
          }
        | null = null;
      let accessResponseOk = false;

      for (let attempt = 0; attempt < maxAccessChecks; attempt += 1) {
        const accessResult = await fetchAccessPayload();
        accessPayload = accessResult.payload;
        accessResponseOk = accessResult.responseOk;

        if (cancelled) {
          return;
        }

        if (!accessResponseOk) {
          break;
        }

        if (accessPayload?.canAccessLoanPackaging) {
          break;
        }

        if (attempt < maxAccessChecks - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 900 * (attempt + 1)));
        }
      }

      if (!accessResponseOk) {
        router.replace('/login?redirectTo=/loan-packaging');
        return;
      }

      if (!accessPayload?.canAccessLoanPackaging) {
        router.replace('/loan-services');
        return;
      }

      setAccessToken(data.session.access_token);
      setUserId(data.session.user.id);
      const profile = await getTemplateSharedProfile(data.session.user.id);
      const sharedName = profile.businessName || profile.businessLegalName || '';
      setSharedProfile(profile);
      setLoanForm((previous) => ({
        ...previous,
        businessName: previous.businessName || sharedName,
        loanPurpose: previous.loanPurpose || profile.loanPurpose || '',
        loanAmount:
          previous.loanAmount ||
          (profile.loanAmount != null ? formatCurrencyInput(String(profile.loanAmount)) : ''),
        annualRevenue:
          previous.annualRevenue ||
          (profile.annualRevenue != null ? formatCurrencyInput(String(profile.annualRevenue)) : ''),
        yearsInBusiness:
          previous.yearsInBusiness ||
          (profile.yearsInBusiness != null ? String(profile.yearsInBusiness) : ''),
        loanPurposeDescription: previous.loanPurposeDescription || profile.businessDescription || '',
      }));

      if (pendingCheckoutSessionId) {
        if (typeof window !== 'undefined') {
          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.delete('session_id');
          window.history.replaceState({}, '', nextUrl.toString());
        }

        setStatusMessage('Payment confirmed. Loan Packaging access is active, including all five templates.');
      }

      setBootstrapping(false);
    }

    initializeSession();

    return () => {
      cancelled = true;
    };
  }, [pendingCheckoutSessionId, router]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    loadDashboard();
  }, [accessToken, loadDashboard]);

  useEffect(() => {
    if (!dashboard?.loanRequest?.id || !accessToken) {
      return;
    }

    loadLenderLinks();
  }, [dashboard?.loanRequest?.id, accessToken, loadLenderLinks]);

  const ensureLoanRequest = useCallback(async (): Promise<string | null> => {
    if (dashboard?.loanRequest?.id) {
      return dashboard.loanRequest.id;
    }

    const payload = await apiFetch<DashboardPayload>('/api/loan-packaging/dashboard', {
      method: 'POST',
      body: JSON.stringify({
        serviceType: 'loan_packaging',
        status: 'in_progress',
        businessName: loanForm.businessName,
        loanPurpose: loanForm.loanPurpose,
        loanAmount: parseNullableNumber(loanForm.loanAmount),
        annualRevenue: parseNullableNumber(loanForm.annualRevenue),
        yearsInBusiness: parseNullableNumber(loanForm.yearsInBusiness),
        businessDescription: loanForm.loanPurposeDescription,
      }),
    });

    hydrateDashboardState(payload);
    return payload.loanRequest?.id ?? null;
  }, [
    apiFetch,
    dashboard?.loanRequest?.id,
    loanForm.annualRevenue,
    loanForm.businessName,
    loanForm.loanAmount,
    loanForm.loanPurpose,
    loanForm.loanPurposeDescription,
    loanForm.yearsInBusiness,
    hydrateDashboardState,
  ]);

  const handleSaveLoanProfile = useCallback(async () => {
    setSavingLoanDetails(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const payload = await apiFetch<DashboardPayload>('/api/loan-packaging/dashboard', {
        method: 'POST',
        body: JSON.stringify({
          loanRequestId: dashboard?.loanRequest?.id,
          serviceType: 'loan_packaging',
          status: 'in_progress',
          businessName: loanForm.businessName,
          loanPurpose: loanForm.loanPurpose,
          loanAmount: parseNullableNumber(loanForm.loanAmount),
          annualRevenue: parseNullableNumber(loanForm.annualRevenue),
          yearsInBusiness: parseNullableNumber(loanForm.yearsInBusiness),
          businessDescription: loanForm.loanPurposeDescription,
        }),
      });

      hydrateDashboardState(payload);
      setStatusMessage('Loan profile saved successfully.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save loan profile');
    } finally {
      setSavingLoanDetails(false);
    }
  }, [
    apiFetch,
    dashboard?.loanRequest?.id,
    hydrateDashboardState,
    loanForm.annualRevenue,
    loanForm.businessName,
    loanForm.loanAmount,
    loanForm.loanPurpose,
    loanForm.loanPurposeDescription,
    loanForm.yearsInBusiness,
  ]);

  const handleLoanPurposeChange = useCallback(async (nextLoanPurpose: string) => {
    setLoanForm((previous) => ({ ...previous, loanPurpose: nextLoanPurpose }));

    if (userId) {
      void upsertTemplateSharedProfile(userId, { loanPurpose: nextLoanPurpose });
      setSharedProfile((previous) => ({
        ...previous,
        loanPurpose: nextLoanPurpose,
      }));
    }

    if (!accessToken) {
      return;
    }

    try {
      setErrorMessage(null);

      const payload = await apiFetch<DashboardPayload>('/api/loan-packaging/dashboard', {
        method: 'POST',
        body: JSON.stringify({
          loanRequestId: dashboard?.loanRequest?.id,
          serviceType: 'loan_packaging',
          status: dashboard?.loanRequest?.status || 'in_progress',
          businessName: loanForm.businessName,
          loanPurpose: nextLoanPurpose,
          loanAmount: parseNullableNumber(loanForm.loanAmount),
          annualRevenue: parseNullableNumber(loanForm.annualRevenue),
          yearsInBusiness: parseNullableNumber(loanForm.yearsInBusiness),
          businessDescription: loanForm.loanPurposeDescription,
        }),
      });

      hydrateDashboardState(payload);
      setStatusMessage(`Loan purpose updated to ${nextLoanPurpose}. Checklist refreshed.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update loan purpose');
    }
  }, [
    accessToken,
    apiFetch,
    dashboard?.loanRequest?.id,
    dashboard?.loanRequest?.status,
    hydrateDashboardState,
    loanForm.annualRevenue,
    loanForm.businessName,
    loanForm.loanAmount,
    loanForm.loanPurposeDescription,
    loanForm.yearsInBusiness,
    userId,
  ]);

  const handleInterestRateChange = useCallback((value: string) => {
    const nextRate = clampNumber(
      parseNullableNumber(sanitizeCurrencyInput(value)) ?? 5,
      5,
      15,
    );

    setFinancingEstimate((previous) => ({
      ...previous,
      interestRate: formatPercentInput(nextRate),
    }));
  }, []);

  const handleDownPaymentPctChange = useCallback((value: string) => {
    const nextPct = clampNumber(
      parseNullableNumber(sanitizeCurrencyInput(value)) ?? 0,
      0,
      70,
    );
    const nextAmount = loanAmountValue * (nextPct / 100);

    setFinancingEstimate((previous) => ({
      ...previous,
      downPaymentPct: formatPercentInput(nextPct),
      downPaymentAmount: formatCurrencyInput(String(nextAmount)),
    }));
  }, [loanAmountValue]);

  const handleDownPaymentAmountChange = useCallback((value: string) => {
    const nextAmount = parseNullableNumber(sanitizeCurrencyInput(value)) ?? 0;
    const cappedAmount = Math.min(nextAmount, loanAmountValue);
    const nextPct = loanAmountValue > 0 ? (cappedAmount / loanAmountValue) * 100 : 0;

    setFinancingEstimate((previous) => ({
      ...previous,
      downPaymentAmount: formatCurrencyInput(String(cappedAmount)),
      downPaymentPct: formatPercentInput(nextPct),
    }));
  }, [loanAmountValue]);

  const handleTermYearsChange = useCallback((value: string) => {
    const sanitized = value.replace(/[^\d]/g, '');
    const numeric = parseNullableNumber(sanitized);
    const nextTermYears =
      numeric == null ? '' : String(clampNumber(Math.round(numeric), 1, 30));

    setFinancingEstimate((previous) => ({
      ...previous,
      termYears: nextTermYears,
    }));
  }, []);

  const handleUploadDocument = useCallback(
    async (requirementKey: string, file: File) => {
      setErrorMessage(null);
      setStatusMessage(null);
      setUploadingRequirementKey(requirementKey);

      try {
        const loanRequestId = await ensureLoanRequest();
        if (!loanRequestId || !accessToken) {
          throw new Error('Unable to initialize loan request.');
        }

        const formData = new FormData();
        formData.append('loanRequestId', loanRequestId);
        formData.append('requirementKey', requirementKey);
        formData.append('file', file);

        const response = await fetch('/api/loan-packaging/documents/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          const message =
            payload && typeof payload === 'object' && 'error' in payload
              ? String((payload as { error?: unknown }).error ?? 'Upload failed')
              : 'Upload failed';
          throw new Error(message);
        }

        await loadDashboard();
        setStatusMessage('Document uploaded successfully.');
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to upload document');
      } finally {
        setUploadingRequirementKey(null);
      }
    },
    [accessToken, ensureLoanRequest, loadDashboard],
  );

  const openTemplateRoute = useCallback(async (templateKey: TemplateKey) => {
    setErrorMessage(null);
    try {
      const loanRequestId = await ensureLoanRequest();
      if (!loanRequestId) {
        throw new Error('Unable to initialize loan request.');
      }
      router.push(`/templates?template=${templateKey}&source=loan-packaging&loanRequestId=${loanRequestId}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to open template');
    }
  }, [ensureLoanRequest, router]);

  const handleGenerateCoverLetter = useCallback(async () => {
    setGeneratingCoverLetter(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const loanRequestId = await ensureLoanRequest();
      if (!loanRequestId) {
        throw new Error('Unable to initialize loan request.');
      }

      const payload = await apiFetch<{
        coverLetterStatus: string;
        coverLetterContent: string;
      }>('/api/loan-packaging/cover-letter', {
        method: 'POST',
        body: JSON.stringify({
          loanRequestId,
          businessName: loanForm.businessName,
          loanPurpose: loanForm.loanPurpose,
          loanAmount: parseNullableNumber(loanForm.loanAmount),
          annualRevenue: parseNullableNumber(loanForm.annualRevenue),
          businessDescription: loanForm.loanPurposeDescription,
          foundedYear: parseNullableNumber(coverLetterForm.foundedYear),
          businessOverview: coverLetterForm.businessOverview,
          targetCustomers: coverLetterForm.targetCustomers,
          competitiveAdvantage: coverLetterForm.competitiveAdvantage,
          fundUseDetails: coverLetterForm.fundUseDetails,
          urgencyReason: coverLetterForm.urgencyReason,
          noLoanConsequence: coverLetterForm.noLoanConsequence,
          expectedOutcome: coverLetterForm.expectedOutcome,
          recentPerformance: coverLetterForm.recentPerformance,
          recentChanges: coverLetterForm.recentChanges,
          revenueCashflowImpact: coverLetterForm.revenueCashflowImpact,
          repaymentConfidence: coverLetterForm.repaymentConfidence,
          ownerStrengths: coverLetterForm.ownerStrengths,
          riskManagement: coverLetterForm.riskManagement,
          additionalContext: coverLetterForm.additionalContext,
          priorDebtExperience: coverLetterForm.priorDebtExperience,
          priorDebtExperienceDetails: coverLetterForm.priorDebtExperienceDetails,
          purposeSpecificAnswers: Object.fromEntries(
            purposeSpecificCoverLetterPrompts.map((prompt) => [
              prompt.key,
              coverLetterForm.purposeSpecificAnswers[prompt.key] ?? '',
            ]),
          ),
        }),
      });

      setCoverLetterDraft(payload.coverLetterContent ?? '');
      await loadDashboard();
      setStatusMessage('Cover letter draft generated. Review it carefully and approve it when it reflects your request clearly.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to generate cover letter',
      );
    } finally {
      setGeneratingCoverLetter(false);
    }
  }, [
    apiFetch,
    coverLetterForm.additionalContext,
    coverLetterForm.businessOverview,
    coverLetterForm.competitiveAdvantage,
    coverLetterForm.expectedOutcome,
    coverLetterForm.foundedYear,
    coverLetterForm.fundUseDetails,
    coverLetterForm.noLoanConsequence,
    coverLetterForm.ownerStrengths,
    coverLetterForm.priorDebtExperience,
    coverLetterForm.priorDebtExperienceDetails,
    coverLetterForm.purposeSpecificAnswers,
    coverLetterForm.recentChanges,
    coverLetterForm.recentPerformance,
    coverLetterForm.repaymentConfidence,
    coverLetterForm.revenueCashflowImpact,
    coverLetterForm.riskManagement,
    coverLetterForm.targetCustomers,
    coverLetterForm.urgencyReason,
    ensureLoanRequest,
    loadDashboard,
    loanForm.annualRevenue,
    loanForm.businessName,
    loanForm.loanAmount,
    loanForm.loanPurpose,
    loanForm.loanPurposeDescription,
    purposeSpecificCoverLetterPrompts,
  ]);

  const handleApproveCoverLetter = useCallback(async () => {
    if (coverLetterDraft.trim().length < 50) {
      setErrorMessage('Cover letter draft is too short to approve yet.');
      return;
    }

    setApprovingCoverLetter(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const loanRequestId = await ensureLoanRequest();
      if (!loanRequestId) {
        throw new Error('Unable to initialize loan request.');
      }

      await apiFetch('/api/loan-packaging/cover-letter', {
        method: 'PATCH',
        body: JSON.stringify({
          loanRequestId,
          content: coverLetterDraft,
        }),
      });

      await loadDashboard();
      setStatusMessage('Cover letter approved and ready to lead the lender package.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to approve cover letter',
      );
    } finally {
      setApprovingCoverLetter(false);
    }
  }, [apiFetch, coverLetterDraft, ensureLoanRequest, loadDashboard]);

  const handleBuildPackage = useCallback(async () => {
    setBuildingPackage(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const loanRequestId = await ensureLoanRequest();
      if (!loanRequestId) {
        throw new Error('Unable to initialize loan request.');
      }

      const result = await apiFetch<PackageBuildResult>('/api/loan-packaging/package', {
        method: 'POST',
        body: JSON.stringify({ loanRequestId }),
      });

      setPackageResult(result);
      await loadDashboard();
      setStatusMessage('Loan package generated successfully.');

      if (result.downloadUrl) {
        setDownloadingPackage(true);
        await downloadFileFromUrl(result.downloadUrl, result.archiveFileName);
        setStatusMessage('Loan package generated and download started.');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to build package');
    } finally {
      setBuildingPackage(false);
      setDownloadingPackage(false);
    }
  }, [apiFetch, ensureLoanRequest, loadDashboard]);

  const handleDownloadLatestPackage = useCallback(async () => {
    if (!latestPackageDownloadUrl) {
      setErrorMessage('No package ZIP is available to download yet.');
      return;
    }

    setDownloadingPackage(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await downloadFileFromUrl(latestPackageDownloadUrl, latestPackageFileName);
      setStatusMessage('Package ZIP download started.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to download package ZIP');
    } finally {
      setDownloadingPackage(false);
    }
  }, [latestPackageDownloadUrl, latestPackageFileName]);

  const handleCreateLenderLink = useCallback(async () => {
    if (lenderPassword.trim().length < 8) {
      setErrorMessage('Lender link password must be at least 8 characters.');
      return;
    }

    setCreatingLenderLink(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const loanRequestId = await ensureLoanRequest();
      if (!loanRequestId) {
        throw new Error('Unable to initialize loan request.');
      }

      await apiFetch('/api/loan-packaging/lender-link', {
        method: 'POST',
        body: JSON.stringify({
          loanRequestId,
          title: lenderTitle,
          password: lenderPassword,
          expiresInDays: Number(lenderExpiresInDays || '14'),
        }),
      });

      setLenderPassword('');
      await loadLenderLinks();
      setStatusMessage('Lender access link created.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create lender link');
    } finally {
      setCreatingLenderLink(false);
    }
  }, [
    apiFetch,
    ensureLoanRequest,
    lenderExpiresInDays,
    lenderPassword,
    lenderTitle,
    loadLenderLinks,
  ]);

  const handleRevokeLenderLink = useCallback(
    async (linkId: string, revoke: boolean) => {
      try {
        await apiFetch('/api/loan-packaging/lender-link', {
          method: 'PATCH',
          body: JSON.stringify({
            linkId,
            revoke,
          }),
        });

        await loadLenderLinks();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to update lender link');
      }
    },
    [apiFetch, loadLenderLinks],
  );

  const handleSubmitForReview = useCallback(async () => {
    if (!dashboard?.loanRequest?.id) {
      setErrorMessage('Loan request must be created before submitting.');
      return;
    }

    try {
      const payload = await apiFetch<DashboardPayload>('/api/loan-packaging/dashboard', {
        method: 'PATCH',
        body: JSON.stringify({
          loanRequestId: dashboard.loanRequest.id,
          status: 'submitted',
        }),
      });

      hydrateDashboardState(payload);
      setStatusMessage('Package marked as submitted for internal review.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit package');
    }
  }, [apiFetch, dashboard?.loanRequest?.id, hydrateDashboardState]);

  if (bootstrapping) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-lg">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading secure workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${bodyClassName} min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fafc_32%,_#f5f5f4_100%)] text-slate-900`}>
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-slate-100">
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(135deg,_#ffffff20_0%,_transparent_55%)]" />
        <div className="relative mx-auto w-full max-w-[1600px] px-6 py-14 xl:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-300/10 px-4 py-1 text-xs font-semibold tracking-[0.08em] uppercase">
                <ShieldCheck className="h-4 w-4" />
                Small Business Loan Packaging
              </p>
              <h1 className={`${headingClassName} text-4xl leading-tight lg:text-5xl`}>
                Build A Lender-Ready Package
              </h1>
              <p className="text-slate-300 text-base lg:text-lg">
                Complete each required document with clear guidance, auto-calculated templates, and secure sharing links.
                Built for small business owners who want speed and clarity.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-6 py-4 w-full max-w-sm">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-400 mb-2">Checklist Completion</p>
              <p className="text-4xl font-bold text-white">{dashboard?.progress.percentage ?? 0}%</p>
              <p className="text-sm text-slate-300 mt-2">
                {dashboard?.progress.completedRequired ?? 0} of {dashboard?.progress.totalRequired ?? 0} required documents complete
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1600px] px-6 py-8 xl:px-8">
        {statusMessage && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {statusMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {errorMessage}
          </div>
        )}

        <ContextAssistant
          scope="loan_packaging_dashboard"
          loanRequestId={dashboard?.loanRequest?.id ?? null}
          suggestions={[
            'What should I do next based on my current package?',
            'Which required documents are still missing?',
            'How can I make this package stronger before I send it out?',
          ]}
        />

        <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
          <aside className="space-y-4 lg:sticky lg:top-24 self-start">
            <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-5">
              <h2 className={`${headingClassName} text-xl mb-4`}>Workflow Status</h2>
              <ul className="space-y-3">
                {workflowSteps.map((step, index) => (
                  <li
                    key={step.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 bg-slate-50"
                  >
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${step.complete ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
                      {step.complete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </div>
                    <span className="text-sm font-medium text-slate-800">{step.title}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-5">
              <h3 className={`${headingClassName} text-lg mb-2`}>Next Action</h3>
              <p className="text-sm text-slate-600">
                {nextWorkflowAction}
              </p>
            </div>
          </aside>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              <div className="flex flex-col gap-2 mb-6">
                <h2 className={`${headingClassName} text-2xl`}>1. Loan Profile</h2>
                <p className="text-sm text-slate-600">
                  Add the core loan details once. We reuse these details across your package so you do not need to retype them.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.7fr_1.3fr]">
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-slate-700">Business Name</span>
                  <input
                    value={loanForm.businessName}
                    onChange={(event) => setLoanForm((previous) => ({ ...previous, businessName: event.target.value }))}
                    onBlur={() => {
                      if (!userId) return;
                      const nextName = loanForm.businessName.trim();
                      void upsertTemplateSharedProfile(userId, { businessName: nextName, businessLegalName: nextName });
                      setSharedProfile((previous) => ({
                        ...previous,
                        businessName: nextName,
                        businessLegalName: nextName,
                      }));
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Acme Manufacturing LLC"
                  />
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">Loan Purpose</span>
                    <select
                      value={loanForm.loanPurpose}
                      onChange={(event) => {
                        void handleLoanPurposeChange(event.target.value);
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select loan purpose</option>
                      {LOAN_PURPOSE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">Loan Amount (USD)</span>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={loanForm.loanAmount}
                        onChange={(event) =>
                          setLoanForm((previous) => ({
                            ...previous,
                            loanAmount: formatCurrencyInput(sanitizeCurrencyInput(event.target.value)),
                          }))
                        }
                        onBlur={(event) =>
                          setLoanForm((previous) => ({
                            ...previous,
                            loanAmount: formatCurrencyInput(event.target.value),
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 py-2 pl-7 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="500,000"
                      />
                    </div>
                  </label>
                </div>
              </div>

              {loanAmountValue > 0 ? (
                <div className="mt-4 rounded-[26px] border border-slate-200 bg-[linear-gradient(135deg,_rgba(239,246,255,0.95)_0%,_rgba(255,255,255,0.98)_45%,_rgba(241,245,249,0.95)_100%)] p-4 shadow-sm">
                  <div className="flex flex-col gap-1.5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">Estimated Loan Structure</p>
                      <h3 className={`${headingClassName} mt-0.5 text-[1.35rem] leading-tight`}>See the financing picture right away</h3>
                      <p className="mt-1 max-w-none text-[13px] leading-5 text-slate-600 2xl:max-w-[96%]">
                        These starting numbers reflect what is typically seen for {selectedLoanPurposeLabel}. If your lender has different terms, requires a different equity injection, or you want to put more down to lower the payment, adjust them here. Otherwise, we recommend leaving them as-is.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <label className="group rounded-2xl border border-slate-200 bg-white/90 p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        <Percent className="h-4 w-4 text-blue-600" />
                        Interest Rate
                      </span>
                      <div className="mt-2.5 flex justify-center">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={financingEstimate.interestRate}
                            onChange={(event) => handleInterestRateChange(event.target.value)}
                            className="w-[5ch] bg-transparent text-center text-lg font-semibold text-slate-900 outline-none"
                            placeholder="8.00"
                          />
                          <span className="text-sm font-semibold text-slate-500">%</span>
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs leading-5 text-slate-500">Editable to match the lender terms you expect.</p>
                    </label>

                    <label className="group rounded-2xl border border-slate-200 bg-white/90 p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        <Percent className="h-4 w-4 text-amber-600" />
                        Down Payment %
                      </span>
                      <div className="mt-2.5 flex justify-center">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={financingEstimate.downPaymentPct}
                            onChange={(event) => handleDownPaymentPctChange(event.target.value)}
                            className="w-[5ch] bg-transparent text-center text-lg font-semibold text-slate-900 outline-none"
                            placeholder="10.00"
                          />
                          <span className="text-sm font-semibold text-slate-500">%</span>
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs leading-5 text-slate-500">Editing the percent updates the dollar amount.</p>
                    </label>

                    <label className="group rounded-2xl border border-slate-200 bg-white/90 p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        <Clock3 className="h-4 w-4 text-violet-600" />
                        Term
                      </span>
                      <div className="mt-2.5 flex justify-center">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={financingEstimate.termYears}
                            onChange={(event) => handleTermYearsChange(event.target.value)}
                            className="w-[3ch] bg-transparent text-center text-lg font-semibold text-slate-900 outline-none"
                            placeholder={String(Math.max(currentFinancingDefaults.termMonths / 12, 1))}
                          />
                          <span className="text-sm font-semibold text-slate-500">yr</span>
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs leading-5 text-slate-500">Adjust if your lender is offering a different repayment term.</p>
                    </label>

                    <label className="group rounded-2xl border border-slate-200 bg-white/90 p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        <Wallet className="h-4 w-4 text-emerald-600" />
                        Down Payment $
                      </span>
                      <div className="mt-2.5 flex justify-center">
                        <div className="inline-flex min-w-[9.75rem] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2">
                          <span className="text-base font-semibold text-slate-500">$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={financingEstimate.downPaymentAmount}
                            onChange={(event) => handleDownPaymentAmountChange(event.target.value)}
                            className="w-[7ch] bg-transparent text-center text-lg font-semibold tabular-nums text-slate-900 outline-none"
                            placeholder="5,000"
                          />
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs leading-5 text-slate-500">Editing the amount updates the percentage.</p>
                    </label>

                    <div className="rounded-2xl border border-slate-900 bg-slate-950 p-3.5 text-white shadow-sm">
                      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        Monthly Payment
                      </span>
                      <div className="mt-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                        <p className="text-center text-[1.75rem] font-semibold leading-none">
                          {formatCurrency(estimatedMonthlyPayment ?? 0)}
                        </p>
                        <p className="mt-1 text-center text-xs leading-5 text-slate-300">
                          Based on approximately {formatCurrency(financedAmount)} financed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 mt-4">
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-slate-700">Loan Purpose Description</span>
                  <textarea
                    value={loanForm.loanPurposeDescription}
                    onChange={(event) =>
                      setLoanForm((previous) => ({ ...previous, loanPurposeDescription: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 min-h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Explain what the loan will be used for, why it is needed now, and how it will help the business."
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={handleSaveLoanProfile}
                  disabled={savingLoanDetails}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingLoanDetails ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save Loan Profile
                </button>
                <button
                  onClick={handleSubmitForReview}
                  disabled={!dashboard?.loanRequest?.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-400 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  Mark As Submitted
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              <div className="flex flex-col gap-2 mb-6">
                <h2 className={`${headingClassName} text-2xl`}>2. Document Checklist</h2>
                <p className="text-sm text-slate-600">
                  Upload what you already have, use guided templates where available, and complete generated items like the broker agreement directly inside the platform.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {(dashboard?.requirements ?? []).map((requirement) => {
                  if (requirement.requirement_key === 'cover_letter') {
                    return null;
                  }

                  const isBrokerAgreementRequirement = requirement.requirement_key === 'broker_fee_agreement';
                  const document = documentByRequirementKey.get(requirement.requirement_key);
                  const templateSubmission = requirement.template_key
                    ? templateSubmissionByKey.get(requirement.template_key)
                    : null;

                  return (
                    <article
                      key={requirement.requirement_key}
                      className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">{requirement.display_name}</h3>
                          <p className="text-xs text-slate-600 mt-1">{requirement.description}</p>
                        </div>
                        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${mapStatusColor(document?.status ?? 'not_started')}`}>
                          {(document?.status ?? 'not_started').replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {isBrokerAgreementRequirement ? (
                          <button
                            onClick={() => router.push('/loan-brokering/agreement')}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            {document?.download_url ? 'Review Agreement' : 'Review & Sign Agreement'}
                          </button>
                        ) : null}

                        {requirement.template_key ? (
                          <button
                            onClick={() => openTemplateRoute(requirement.template_key as TemplateKey)}
                            className="inline-flex items-center gap-1 rounded-md border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                          >
                            {templateSubmission ? 'Continue Template' : 'Start Template'}
                          </button>
                        ) : null}

                        {!isBrokerAgreementRequirement ? (
                          <label className="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 cursor-pointer">
                            <Upload className="h-3.5 w-3.5" />
                            {uploadingRequirementKey === requirement.requirement_key ? 'Uploading...' : 'Upload File'}
                            <input
                              type="file"
                              className="hidden"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) {
                                  handleUploadDocument(requirement.requirement_key, file);
                                  event.target.value = '';
                                }
                              }}
                              disabled={uploadingRequirementKey === requirement.requirement_key}
                            />
                          </label>
                        ) : null}

                        {document?.download_url ? (
                          <a
                            href={document.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            <Download className="h-3.5 w-3.5" />
                            {isBrokerAgreementRequirement ? 'View Signed Agreement' : 'View PDF'}
                          </a>
                        ) : null}
                      </div>

                      {templateSubmission ? (
                        <p className="text-xs text-slate-500">
                          Template completion: {templateSubmission.completion_pct}%
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm space-y-5">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className={`${headingClassName} text-2xl`}>3. Cover Letter</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      This section shapes how a lender understands your request before they dig into the documents. A strong cover letter captures the story, the timing, and the repayment logic that the numbers alone cannot show.
                    </p>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${mapStatusColor((dashboard?.loanRequest?.cover_letter_status === 'approved' ? 'approved' : dashboard?.loanRequest?.cover_letter_status === 'generated' ? 'generated' : 'not_started') as LoanRequestDocument['status'])}`}>
                    {(dashboard?.loanRequest?.cover_letter_status ?? 'not_started').replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                <p className="text-sm font-semibold text-amber-950">This is where you win or lose deals.</p>
                <p className="mt-1 text-sm text-amber-900">
                  Use this section to capture nuance, urgency, and the business story lenders actually care about before they open the supporting documents.
                </p>
                {loanForm.loanPurpose ? (
                  <p className="mt-2 text-sm text-amber-900">
                    These prompts are tailored for {loanForm.loanPurpose} and include extra questions where lenders usually expect more transaction-specific detail.
                  </p>
                ) : null}
              </div>

              {!loanProfileComplete ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Save the loan profile first so the draft has the basic business name, purpose, and loan amount to work from.
                </div>
              ) : null}

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 space-y-4">
                  <div>
                    <h3 className={`${headingClassName} text-lg`}>Section 1. Business Overview</h3>
                    <p className="text-sm text-slate-600">Explain what the business does, who it serves, and why it stands out.</p>
                  </div>

                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">What year was the business founded?</span>
                    <input
                      type="number"
                      min="1800"
                      max={new Date().getFullYear()}
                      value={coverLetterForm.foundedYear}
                      onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, foundedYear: event.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={String(new Date().getFullYear() - 5)}
                    />
                  </label>

                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">What does your business do?</span>
                    <textarea
                      value={coverLetterForm.businessOverview}
                      onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, businessOverview: event.target.value }))}
                      className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe the business in 2 to 3 strong sentences."
                    />
                  </label>

                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">Who do you primarily serve?</span>
                    <textarea
                      value={coverLetterForm.targetCustomers}
                      onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, targetCustomers: event.target.value }))}
                      className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your target customers or market."
                    />
                  </label>

                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">What makes your business unique or competitive?</span>
                    <textarea
                      value={coverLetterForm.competitiveAdvantage}
                      onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, competitiveAdvantage: event.target.value }))}
                      className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Explain your edge, niche, reputation, or recurring demand."
                    />
                  </label>

                  {purposeSpecificCoverLetterPrompts
                    .filter((prompt) => prompt.section === 1)
                    .map((prompt) => (
                      <label key={prompt.key} className="block space-y-1 text-sm">
                        <span className="font-semibold text-slate-700">{prompt.label}</span>
                        <textarea
                          value={coverLetterForm.purposeSpecificAnswers[prompt.key] ?? ''}
                          onChange={(event) =>
                            setCoverLetterForm((previous) => ({
                              ...previous,
                              purposeSpecificAnswers: {
                                ...previous.purposeSpecificAnswers,
                                [prompt.key]: event.target.value,
                              },
                            }))
                          }
                          className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={prompt.placeholder}
                        />
                      </label>
                    ))}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 space-y-4">
                  <div>
                    <h3 className={`${headingClassName} text-lg`}>Section 2. Loan Justification</h3>
                    <p className="text-sm text-slate-600">This is the money-maker. Explain what the funds will do, why timing matters, and what is at stake.</p>
                  </div>

                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">
                      {loanForm.loanPurpose
                        ? `What specifically will the funds be used for in this ${loanForm.loanPurpose} request?`
                        : 'What specifically will the funds be used for?'}
                    </span>
                    <textarea
                      value={coverLetterForm.fundUseDetails}
                      onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, fundUseDetails: event.target.value }))}
                      className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={loanForm.loanPurpose
                        ? `Break down the actual use of funds for this ${loanForm.loanPurpose.toLowerCase()} request in lender-friendly language.`
                        : 'Break down the actual use of funds in lender-friendly language.'}
                    />
                  </label>

                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">
                      {loanForm.loanPurpose
                        ? `Why is now the right time for this ${loanForm.loanPurpose} request?`
                        : 'Why is this needed right now?'}
                    </span>
                    <textarea
                      value={coverLetterForm.urgencyReason}
                      onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, urgencyReason: event.target.value }))}
                      className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Explain the timing, catalyst, or urgency."
                    />
                  </label>

                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">What happens if you do not get this loan?</span>
                    <textarea
                      value={coverLetterForm.noLoanConsequence}
                      onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, noLoanConsequence: event.target.value }))}
                      className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Clarify the downside, delay, or lost opportunity."
                    />
                  </label>

                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">What outcome are you expecting from this loan?</span>
                    <textarea
                      value={coverLetterForm.expectedOutcome}
                      onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, expectedOutcome: event.target.value }))}
                      className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe expected growth, efficiency, expansion, or stability."
                    />
                  </label>

                  {purposeSpecificCoverLetterPrompts
                    .filter((prompt) => prompt.section === 2)
                    .map((prompt) => (
                      <label key={prompt.key} className="block space-y-1 text-sm">
                        <span className="font-semibold text-slate-700">{prompt.label}</span>
                        <textarea
                          value={coverLetterForm.purposeSpecificAnswers[prompt.key] ?? ''}
                          onChange={(event) =>
                            setCoverLetterForm((previous) => ({
                              ...previous,
                              purposeSpecificAnswers: {
                                ...previous.purposeSpecificAnswers,
                                [prompt.key]: event.target.value,
                              },
                            }))
                          }
                          className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={prompt.placeholder}
                        />
                      </label>
                    ))}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 space-y-4">
                  <div>
                    <h3 className={`${headingClassName} text-lg`}>Section 3. Financial Narrative</h3>
                    <p className="text-sm text-slate-600">Bridge the numbers with context so lenders understand recent performance and forward impact.</p>
                  </div>

                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">How has your business been performing recently?</span>
                    <textarea
                      value={coverLetterForm.recentPerformance}
                      onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, recentPerformance: event.target.value }))}
                      className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Summarize the last 6 to 12 months in plain language."
                    />
                  </label>

                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">Any recent growth, challenges, or changes?</span>
                    <textarea
                      value={coverLetterForm.recentChanges}
                      onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, recentChanges: event.target.value }))}
                      className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add context around trends, seasonality, contracts, staffing, or transitions."
                    />
                  </label>

                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">
                      {loanForm.loanPurpose
                        ? `How will this ${loanForm.loanPurpose.toLowerCase()} request impact revenue or cash flow?`
                        : 'How will this loan impact your revenue or cash flow?'}
                    </span>
                    <textarea
                      value={coverLetterForm.revenueCashflowImpact}
                      onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, revenueCashflowImpact: event.target.value }))}
                      className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Explain how the request supports repayment capacity, revenue, or working capital."
                    />
                  </label>

                  {purposeSpecificCoverLetterPrompts
                    .filter((prompt) => prompt.section === 3)
                    .map((prompt) => (
                      <label key={prompt.key} className="block space-y-1 text-sm">
                        <span className="font-semibold text-slate-700">{prompt.label}</span>
                        <textarea
                          value={coverLetterForm.purposeSpecificAnswers[prompt.key] ?? ''}
                          onChange={(event) =>
                            setCoverLetterForm((previous) => ({
                              ...previous,
                              purposeSpecificAnswers: {
                                ...previous.purposeSpecificAnswers,
                                [prompt.key]: event.target.value,
                              },
                            }))
                          }
                          className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={prompt.placeholder}
                        />
                      </label>
                    ))}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 space-y-4">
                  <div>
                    <h3 className={`${headingClassName} text-lg`}>Section 4. Strength & Risk Mitigation</h3>
                    <p className="text-sm text-slate-600">Reinforce owner quality, operating discipline, and anything that reduces lender uncertainty.</p>
                  </div>

                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">What are your biggest strengths as a business owner?</span>
                    <textarea
                      value={coverLetterForm.ownerStrengths}
                      onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, ownerStrengths: event.target.value }))}
                      className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Highlight experience, leadership, discipline, or execution."
                    />
                  </label>

                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">How do you manage risk in your business?</span>
                    <textarea
                      value={coverLetterForm.riskManagement}
                      onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, riskManagement: event.target.value }))}
                      className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe controls, reserves, diversification, or contingency planning."
                    />
                  </label>

                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">What gives you confidence you can repay this loan?</span>
                    <textarea
                      value={coverLetterForm.repaymentConfidence}
                      onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, repaymentConfidence: event.target.value }))}
                      className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Explain the repayment logic, business durability, and why this structure makes sense."
                    />
                  </label>

                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">Have you successfully handled debt before?</span>
                    <select
                      value={coverLetterForm.priorDebtExperience}
                      onChange={(event) =>
                        setCoverLetterForm((previous) => ({
                          ...previous,
                          priorDebtExperience: event.target.value as CoverLetterFormState['priorDebtExperience'],
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select an option</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>

                  {coverLetterForm.priorDebtExperience ? (
                    <label className="block space-y-1 text-sm">
                      <span className="font-semibold text-slate-700">Debt repayment context</span>
                      <textarea
                        value={coverLetterForm.priorDebtExperienceDetails}
                        onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, priorDebtExperienceDetails: event.target.value }))}
                        className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add repayment history or context that helps a lender evaluate your track record."
                      />
                    </label>
                  ) : null}

                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">Any additional context you want a lender to know?</span>
                    <textarea
                      value={coverLetterForm.additionalContext}
                      onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, additionalContext: event.target.value }))}
                      className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add anything that strengthens context, clarity, or confidence."
                    />
                  </label>

                  {purposeSpecificCoverLetterPrompts
                    .filter((prompt) => prompt.section === 4)
                    .map((prompt) => (
                      <label key={prompt.key} className="block space-y-1 text-sm">
                        <span className="font-semibold text-slate-700">{prompt.label}</span>
                        <textarea
                          value={coverLetterForm.purposeSpecificAnswers[prompt.key] ?? ''}
                          onChange={(event) =>
                            setCoverLetterForm((previous) => ({
                              ...previous,
                              purposeSpecificAnswers: {
                                ...previous.purposeSpecificAnswers,
                                [prompt.key]: event.target.value,
                              },
                            }))
                          }
                          className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={prompt.placeholder}
                        />
                      </label>
                    ))}
                </div>
              </div>

              {loanProfileComplete && !coverLetterReady ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  Complete the key cover letter prompts first. Lenders care about the story behind the request, the urgency, the financial context, why repayment makes sense, and any purpose-specific details tied to this financing type.
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleGenerateCoverLetter}
                  disabled={generatingCoverLetter || !loanProfileComplete || !coverLetterReady}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {generatingCoverLetter ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {coverLetterDraft.trim().length > 0 ? 'Regenerate Draft' : 'Generate Draft'}
                </button>
                <button
                  onClick={handleApproveCoverLetter}
                  disabled={approvingCoverLetter || coverLetterDraft.trim().length < 50}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-400 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  {approvingCoverLetter ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Approve & Save PDF
                </button>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Cover Letter Draft</span>
                <textarea
                  value={coverLetterDraft}
                  onChange={(event) => setCoverLetterDraft(event.target.value)}
                  className="min-h-[320px] w-full rounded-xl border border-slate-300 px-4 py-3 font-medium text-sm leading-6 text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="Generate the cover letter to review and refine it here before approval."
                />
              </label>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm space-y-6">
              <div className="space-y-2">
                <h2 className={`${headingClassName} text-2xl`}>4. Package Build & Lender Portal</h2>
                <p className="text-sm text-slate-600">
                  Generate an auditable package zip and distribute secure tokenized lender access links.
                </p>
              </div>

              {!documentsComplete ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Complete every required checklist item before building the package so the ZIP reflects the full lender-ready file.
                </div>
              ) : null}

              {documentsComplete && !coverLetterComplete ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Approve the cover letter before building the package so the lender sees a clear narrative first, not just a stack of files.
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleBuildPackage}
                  disabled={buildingPackage || downloadingPackage || !documentsComplete || !coverLetterComplete}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {buildingPackage || downloadingPackage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                  {buildingPackage ? 'Building Package ZIP...' : 'Build & Download ZIP'}
                </button>

                {latestPackageDownloadUrl ? (
                  <button
                    onClick={handleDownloadLatestPackage}
                    disabled={downloadingPackage}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-400 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {downloadingPackage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                    Download Latest ZIP
                  </button>
                ) : null}

                {dashboard?.loanRequest?.package_zip_generated_at ? (
                  <p className="text-xs text-slate-500">
                    Last package build: {formatDate(dashboard.loanRequest.package_zip_generated_at)}
                  </p>
                ) : null}
              </div>

              {packageResult ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Package created with {packageResult.fileCount} document files ({bytesToDisplay(packageResult.packageSizeBytes)}).
                </div>
              ) : null}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                <h3 className={`${headingClassName} text-lg`}>Create Lender Access Link</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">Portal Title</span>
                    <input
                      value={lenderTitle}
                      onChange={(event) => setLenderTitle(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">Portal Password</span>
                    <input
                      type="password"
                      value={lenderPassword}
                      onChange={(event) => setLenderPassword(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="At least 8 characters"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">Expires In (Days)</span>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={lenderExpiresInDays}
                      onChange={(event) => setLenderExpiresInDays(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                </div>

                <button
                  onClick={handleCreateLenderLink}
                  disabled={creatingLenderLink}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-400 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                >
                  {creatingLenderLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                  Create Secure Lender Link
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className={`${headingClassName} text-lg`}>Active Lender Links</h3>
                  {loadingLenderLinks ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" /> : null}
                </div>

                {lenderLinks.length === 0 ? (
                  <p className="text-sm text-slate-500">No lender links created yet.</p>
                ) : (
                  lenderLinks.map((link) => (
                    <article key={link.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{link.title || 'Lender Access Link'}</p>
                          <p className="text-xs text-slate-500">
                            Expires {formatDate(link.expires_at)} · Accesses {link.access_count}
                          </p>
                        </div>
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${link.is_revoked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {link.is_revoked ? 'Revoked' : 'Active'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => navigator.clipboard.writeText(link.shareUrl)}
                          className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          Copy URL
                        </button>
                        <a
                          href={link.shareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Open
                        </a>
                        <button
                          onClick={() => handleRevokeLenderLink(link.id, !link.is_revoked)}
                          className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          {link.is_revoked ? 'Restore' : 'Revoke'}
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </section>

      {dashboardLoading ? (
        <div className="fixed bottom-6 right-6 rounded-full bg-slate-900 text-white px-4 py-2 shadow-lg flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Syncing dashboard...
        </div>
      ) : null}
    </div>
  );
}
