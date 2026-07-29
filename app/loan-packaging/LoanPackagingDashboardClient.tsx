'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  Handshake,
  Link2,
  Loader2,
  MoreHorizontal,
  Package,
  Percent,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Wallet,
  Upload,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/(components)/ui/dialog';
import ContextAssistant from '@/app/(components)/ai/ContextAssistant';
import { LOAN_PURPOSE_OPTIONS, type TemplateKey } from '@/lib/loan-packaging/constants';
import { loanPurposes as calculatorLoanPurposes } from '@/lib/loanPurposes';
import { isDocumentExcludedFromPackage } from '@/lib/loan-packaging/document-state';
import { getIncomeStatementProgress } from '@/lib/templates/income-statement-progress';
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
  excluded_from_package: boolean;
  excluded_at: string | null;
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

interface LegacyTemplateSubmission {
  id: string;
  template_type: TemplateKey;
  template_slot: number | null;
  form_data: Record<string, unknown> | null;
  pdf_url: string | null;
  created_at: string;
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

interface CashFlowSummaryYear {
  label: string;
  revenue: number | null;
  netIncome: number | null;
  debtService: number | null;
  dscr: number | null;
}

interface CashFlowSummary {
  id: string;
  updatedAt: string | null;
  years: CashFlowSummaryYear[];
}

interface DashboardPayload {
  loanRequest: LoanRequestRow | null;
  requirements: DocumentRequirement[];
  documents: LoanRequestDocument[];
  templateSubmissions: TemplateSubmission[];
  legacyTemplateSubmissions: LegacyTemplateSubmission[];
  sharedProfile: SharedProfile;
  templateSharedContext: Record<string, unknown>;
  loanRequestTemplateContext: Record<string, unknown>;
  cashFlowTemplatePrefill: Record<string, unknown>;
  latestCashFlowAnalysisId: string | null;
  cashFlowSummary: CashFlowSummary | null;
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

type BusinessModelType = 'local' | 'regional' | 'nationwide' | 'online' | 'hybrid';

interface CoverLetterFormState {
  businessDescription: string;
  industry: string;
  entityType: string;
  customerType: string;
  topCustomers: string;
  websiteUrl: string;
  ownerManagementExperience: string;
  operatingHistory: string;
  businessModelType: BusinessModelType | '';
  businessLocationDetails: string;
  businessLocation: string;
  currentBusinessTraits: string[];
  currentBusinessTraitsOther: string;
  currentBusinessTraitsDetails: string;
  employeeCount: string;
  useOfFundsBreakdown: UseOfFundsLineItem[];
  useOfFundsNarrative: string;
  timingNarrative: string;
  noLoanImpact: string;
  withLoanImpact: string;
  currentFinancialBaseline: string;
  projectedFinancialImpact: string;
  repaymentSource: string;
  repaymentSourceOther: string;
  revenueStreams: string[];
  revenueStreamsOther: string;
  financingImpact: string[];
  financingImpactOther: string;
  repaymentNotes: string;
  supportingFactors: string[];
  supportingFactorsOther: string;
  supportingFactorsDetails: string;
  collateralDetails: string;
  personalGuaranteeDetails: string;
  ownerInvestmentDetails: string;
  weaknessMitigation: string;
  additionalLenderNotes: string;
}

interface UseOfFundsLineItem {
  id: string;
  description: string;
  amount: string;
}

interface BusinessResearchSuggestions {
  businessDescription?: string;
  industry?: string;
  entityType?: string;
  customerType?: string;
  topCustomers?: string;
  websiteUrl?: string;
  ownerManagementExperience?: string;
  operatingHistory?: string;
  businessModelType?: BusinessModelType | '';
  businessLocationDetails?: string;
  businessLocation?: string;
  currentBusinessTraits?: string[];
  currentBusinessTraitsDetails?: string;
  employeeCount?: string;
  revenueStreams?: string[];
  repaymentSource?: string;
  supportingFactors?: string[];
  supportingFactorsDetails?: string;
  additionalLenderNotes?: string;
}

interface BusinessResearchResponse {
  suggestions: BusinessResearchSuggestions;
  sources: Array<{ type: string; url?: string; title?: string }>;
  message: string;
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

type DocumentCardStatus = LoanRequestDocument['status'] | 'skipped';
type CoverLetterFieldErrors = Partial<Record<keyof CoverLetterFormState, string>>;

interface UseOfFundsPromptConfig {
  breakdownHelper: string;
  narrativeLabel: string;
  narrativeHelper: string;
  narrativePlaceholder: string;
  timingLabel: string;
  timingHelper: string;
  timingPlaceholder: string;
}

type CoverLetterTabId =
  | 'business-overview'
  | 'use-of-funds'
  | 'repayment'
  | 'review';

type WorkflowSectionId = 'loan-profile' | 'documents' | 'cover-letter' | 'package';

const LOAN_PROFILE_PROGRESS_WEIGHT = 25;
const DOCUMENT_CHECKLIST_PROGRESS_WEIGHT = 50;
const COVER_LETTER_PROGRESS_WEIGHT = 25;

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

function getDocumentDisplayStatus(document: LoanRequestDocument | null | undefined): DocumentCardStatus {
  return isDocumentExcludedFromPackage(document) ? 'skipped' : document?.status ?? 'not_started';
}

function mapStatusColor(status: DocumentCardStatus): string {
  switch (status) {
    case 'skipped':
      return 'bg-amber-100 text-amber-900 border-amber-200';
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

const COVER_LETTER_OTHER_VALUE = 'Other';
const CURRENT_YEAR = new Date().getFullYear();

const BUSINESS_MODEL_OPTIONS: Array<{
  value: BusinessModelType;
  label: string;
}> = [
  { value: 'local', label: 'Local / Physical location' },
  { value: 'regional', label: 'Regional (multi-city/state)' },
  { value: 'nationwide', label: 'Nationwide' },
  { value: 'online', label: 'Online / E-commerce' },
  { value: 'hybrid', label: 'Hybrid (physical + online)' },
];

const BUSINESS_TODAY_OPTIONS = [
  'Repeat customers',
  'Recurring revenue',
  'Long-term contracts',
  'Growing demand',
  'Consistent cash flow',
  'Strong financial performance',
  'Established market reputation',
  'Specialized or niche offering',
  'Strong referral business',
  'Low customer concentration',
  'Multiple revenue streams',
  'Stable monthly sales',
  'Scalable business model',
  'Experienced management team',
] as const;

const REPAYMENT_SOURCE_OPTIONS = [
  'Ongoing business cash flow',
  'Revenue from customers / sales',
  'Contract or recurring revenue',
  'Accounts receivable (customer payments)',
  'Rental or lease income',
  'Refinancing existing debt',
  COVER_LETTER_OTHER_VALUE,
] as const;

const REVENUE_STREAM_OPTIONS = [
  'Repeat customers',
  'Recurring or subscription revenue',
  'Signed or long-term contracts',
  'Retail sales',
  'Online sales',
  'Service-based income',
  'Project-based work',
  'Wholesale revenue',
  'Rental or lease income',
  'Seasonal sales',
  COVER_LETTER_OTHER_VALUE,
] as const;

const FINANCING_IMPACT_OPTIONS = [
  'Improve efficiency',
  'Increase capacity',
  'Support continued growth',
  'Strengthen working capital',
  'Reduce cash flow strain',
  'Improve operations',
  'Support fulfillment of existing demand',
  'Lower monthly debt burden',
  'Stabilize business operations',
  COVER_LETTER_OTHER_VALUE,
] as const;

const SUPPORTING_FACTOR_OPTIONS = [
  'Experienced ownership',
  'Strong industry knowledge',
  'Repeat customers',
  'Recurring revenue',
  'Long-term contracts',
  'Stable revenue history',
  'Strong profit margins',
  'Low existing debt',
  'Owner investment in the business',
  'Good payment history',
  'Established local reputation',
  'Growing demand',
  'Collateral available',
  'Personal guarantee available',
  COVER_LETTER_OTHER_VALUE,
] as const;

const DEFAULT_USE_OF_FUNDS_PROMPT: UseOfFundsPromptConfig = {
  breakdownHelper: 'List the main uses of funds and the amount for each one so the total clearly ties back to the request.',
  narrativeLabel: 'Explain the use of funds in more detail *',
  narrativeHelper:
    'Describe how the funds will be used in practice, what each major line item covers, and how that supports the request.',
  narrativePlaceholder:
    'Explain what the funds will cover, how they will be deployed, and any key details a lender should understand.',
  timingLabel: 'Why does this financing matter right now? *',
  timingHelper:
    'Explain why the timing matters. Examples: a contract needs to be fulfilled, equipment must be replaced, a maturity is approaching, or you want to secure an opportunity that is already in motion.',
  timingPlaceholder:
    'Explain why this request matters right now and what is driving the timing.',
};

const USE_OF_FUNDS_PROMPTS_BY_PURPOSE: Record<string, UseOfFundsPromptConfig> = {
  'Working Capital': {
    breakdownHelper:
      'Break out the major working-capital needs such as payroll, inventory, vendor payments, rent, or operating reserves.',
    narrativeLabel: 'Explain how the working capital will be used *',
    narrativeHelper:
      'Explain where the pressure is in the business and how the funds will stabilize or support operations. Examples: covering payroll while receivables catch up, stocking inventory ahead of demand, or smoothing seasonal cash flow.',
    narrativePlaceholder:
      'Describe the cash-cycle need, where the funds will go, and how they support day-to-day operations.',
    timingLabel: 'Why is this working capital request needed right now? *',
    timingHelper:
      'Examples: receivables are stretching, demand is picking up, a seasonal build is starting, or short-term cash flow is tightening.',
    timingPlaceholder:
      'Explain what is happening in the business right now that makes this working capital request timely.',
  },
  'Equipment Purchase': {
    breakdownHelper:
      'Break out the equipment purchase into major items such as machinery, vehicles, installation, delivery, or related setup costs.',
    narrativeLabel: 'Explain the equipment use of funds in more detail *',
    narrativeHelper:
      'Describe what equipment is being purchased, what it will do for the business, and whether the request includes delivery, installation, or other related costs.',
    narrativePlaceholder:
      'Explain what equipment is being purchased, what each item supports operationally, and how it will be used.',
    timingLabel: 'Why is this equipment financing needed right now? *',
    timingHelper:
      'Examples: current equipment is failing, capacity is constrained, a contract requires more production, or replacing equipment will improve efficiency now.',
    timingPlaceholder:
      'Explain what is driving the timing for this equipment purchase right now.',
  },
  'Inventory Purchase': {
    breakdownHelper:
      'Break out the main inventory categories, purchase batches, or vendor allocations that make up the request.',
    narrativeLabel: 'Explain the inventory use of funds in more detail *',
    narrativeHelper:
      'Describe what inventory is being purchased, how it ties to customer demand, and whether this is seasonal, bulk-buy, or recurring replenishment.',
    narrativePlaceholder:
      'Explain what inventory is being purchased, why it matters, and how it supports sales or fulfillment.',
    timingLabel: 'Why is this inventory financing needed right now? *',
    timingHelper:
      'Examples: a busy season is approaching, vendor discounts are available, demand is increasing, or current inventory levels are not enough.',
    timingPlaceholder:
      'Explain why this inventory request is timely and what demand or purchasing need is driving it.',
  },
  'Business Acquisition': {
    breakdownHelper:
      'Break out the transaction uses such as purchase price, closing costs, working capital, transition support, or other acquisition-related needs.',
    narrativeLabel: 'Explain the acquisition use of funds in more detail *',
    narrativeHelper:
      'Describe how the funds fit into the transaction structure. Examples: business purchase price, closing costs, post-close working capital, or seller transition support.',
    narrativePlaceholder:
      'Explain exactly how the acquisition funds will be used and how they fit into the transaction.',
    timingLabel: 'Why is this acquisition financing needed right now? *',
    timingHelper:
      'Examples: a purchase agreement is active, a seller timeline is in place, due diligence is advancing, or there is a near-term closing target.',
    timingPlaceholder:
      'Explain what stage the acquisition is in and why financing is needed now.',
  },
  'Commercial Real Estate Purchase': {
    breakdownHelper:
      'Break out the property-related uses such as purchase price, closing costs, reserves, tenant improvements, or occupancy-related costs.',
    narrativeLabel: 'Explain the real estate purchase use of funds in more detail *',
    narrativeHelper:
      'Describe what the financing covers in the property purchase and whether any buildout, reserves, or related costs are included.',
    narrativePlaceholder:
      'Explain how the real estate purchase funds will be used and what the major property-related costs are.',
    timingLabel: 'Why is this real estate purchase financing needed right now? *',
    timingHelper:
      'Examples: a property is under contract, lease economics have changed, the space is strategic, or ownership is the next step for the business.',
    timingPlaceholder:
      'Explain why this property purchase is moving forward now and what makes the timing important.',
  },
  'Commercial Real Estate Refinance': {
    breakdownHelper:
      'Break out the refinance uses such as payoff amounts, closing costs, reserves, tenant improvements, or any defined cash-out purpose.',
    narrativeLabel: 'Explain the refinance use of funds in more detail *',
    narrativeHelper:
      'Describe which debt is being refinanced, the approximate lenders or balances involved, and whether any funds beyond payoff are being used for a defined purpose.',
    narrativePlaceholder:
      'Explain what debt is being refinanced, what the proceeds will pay off, and whether any additional costs or reserves are included.',
    timingLabel: 'Why is this refinance needed right now? *',
    timingHelper:
      'Examples: a maturity is approaching, the current rate or payment is too high, the structure is no longer a fit, or you want to improve terms while the property is stable.',
    timingPlaceholder:
      'Explain what is happening with the current debt that makes this refinance timely.',
  },
  'Debt Refinance / Consolidation': {
    breakdownHelper:
      'Break out the debts being refinanced or consolidated, including major payoff balances and any related closing or reserve needs.',
    narrativeLabel: 'Explain the debt refinance or consolidation in more detail *',
    narrativeHelper:
      'Describe the debts being refinanced, what problems the current structure creates, and how the new financing will improve the overall setup.',
    narrativePlaceholder:
      'Explain which debts are being refinanced or consolidated and how the new structure improves the business.',
    timingLabel: 'Why is this refinance or consolidation needed right now? *',
    timingHelper:
      'Examples: current payments are too burdensome, multiple lenders need to be consolidated, a maturity is approaching, or refinancing now improves cash flow.',
    timingPlaceholder:
      'Explain why the current debt structure needs to be addressed now.',
  },
  'Business Expansion / New Location': {
    breakdownHelper:
      'Break out the major expansion costs such as buildout, equipment, inventory, staffing, deposits, marketing, or working capital for the new location.',
    narrativeLabel: 'Explain the expansion use of funds in more detail *',
    narrativeHelper:
      'Describe what the expansion funds will cover and how each major use supports the new location or growth plan.',
    narrativePlaceholder:
      'Explain how the expansion funds will be used and what each major cost supports.',
    timingLabel: 'Why is this expansion financing needed right now? *',
    timingHelper:
      'Examples: customer demand is already there, a location has been identified, a lease is moving forward, or capacity at the current location is limited.',
    timingPlaceholder:
      'Explain why now is the right time to expand and what is driving the timing.',
  },
  'Tenant Improvements / Renovation': {
    breakdownHelper:
      'Break out the improvement costs such as construction, buildout, fixtures, equipment, permits, or contractor-related expenses.',
    narrativeLabel: 'Explain the tenant improvement or renovation use of funds in more detail *',
    narrativeHelper:
      'Describe what work is being done, what the major cost buckets are, and how the project supports the business.',
    narrativePlaceholder:
      'Explain what the renovation or buildout includes and how the funds will be used across the project.',
    timingLabel: 'Why is this renovation financing needed right now? *',
    timingHelper:
      'Examples: a lease has started, the space must be built out before opening, customer demand requires upgrades, or the current space no longer fits operations.',
    timingPlaceholder:
      'Explain why the renovation or buildout needs to happen now.',
  },
  'Partner Buyout': {
    breakdownHelper:
      'Break out the transaction uses such as partner payout, legal costs, closing costs, reserves, or transition-related needs.',
    narrativeLabel: 'Explain the partner buyout use of funds in more detail *',
    narrativeHelper:
      'Describe how the funds support the ownership transition and any related transaction or working-capital needs.',
    narrativePlaceholder:
      'Explain how the buyout funds will be used and how the transaction is structured.',
    timingLabel: 'Why is this partner buyout financing needed right now? *',
    timingHelper:
      'Examples: a partner is exiting, ownership is being restructured, a defined buyout timeline is in place, or the business needs a cleaner control structure now.',
    timingPlaceholder:
      'Explain what is driving the buyout timing and why financing is needed now.',
  },
  'Franchise Purchase': {
    breakdownHelper:
      'Break out the franchise-related uses such as franchise fee, buildout, equipment, opening inventory, training, and startup working capital.',
    narrativeLabel: 'Explain the franchise purchase use of funds in more detail *',
    narrativeHelper:
      'Describe what the financing covers across the franchise setup, opening costs, and early operating needs.',
    narrativePlaceholder:
      'Explain how the franchise purchase funds will be used and what the major startup costs are.',
    timingLabel: 'Why is this franchise financing needed right now? *',
    timingHelper:
      'Examples: a franchise approval or site timeline is active, an opening window is approaching, or the opportunity is tied to a specific location or territory.',
    timingPlaceholder:
      'Explain what is driving the timing for this franchise request.',
  },
  'Bridge Financing': {
    breakdownHelper:
      'Break out the near-term bridge uses such as payoff amounts, acquisition timing gaps, closing costs, or temporary liquidity needs.',
    narrativeLabel: 'Explain the bridge financing use of funds in more detail *',
    narrativeHelper:
      'Describe exactly what short-term need the bridge is covering and how the proceeds will be deployed before the expected takeout or payoff event.',
    narrativePlaceholder:
      'Explain what the bridge loan will cover and how the funds fit into the short-term transaction.',
    timingLabel: 'Why is this bridge financing needed right now? *',
    timingHelper:
      'Examples: a sale or refinance is pending, closing dates do not line up, or short-term funding is needed before a defined payoff event.',
    timingPlaceholder:
      'Explain what timing gap exists and why bridge financing is needed right now.',
  },
  'Revolving Line of Credit': {
    breakdownHelper:
      'Break out the main line uses such as receivables support, payroll timing, inventory purchases, vendor payments, or seasonal operating needs.',
    narrativeLabel: 'Explain how the line of credit will be used in practice *',
    narrativeHelper:
      'Describe what the line will support operationally, when draws are likely to happen, and how the line fits the business cash cycle.',
    narrativePlaceholder:
      'Explain how the line of credit will be used, what it supports, and how it fits the business cycle.',
    timingLabel: 'Why is this line of credit needed right now? *',
    timingHelper:
      'Examples: receivables timing is stretching, working-capital needs are increasing, seasonality is approaching, or flexibility is needed for recurring short-term gaps.',
    timingPlaceholder:
      'Explain what is happening now that makes the line of credit useful or necessary.',
  },
  Other: DEFAULT_USE_OF_FUNDS_PROMPT,
};

const COVER_LETTER_TABS: Array<{
  id: CoverLetterTabId;
  label: string;
  description: string;
}> = [
  {
    id: 'business-overview',
    label: 'Business Overview',
    description: 'Business basics, customers, and strengths',
  },
  {
    id: 'use-of-funds',
    label: 'Use of Funds',
    description: 'Breakdown, detail, and timing',
  },
  {
    id: 'repayment',
    label: 'Repayment',
    description: 'How the loan gets repaid',
  },
  {
    id: 'review',
    label: 'Review',
    description: 'Final notes and draft',
  },
];

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
    'Debt Refinance / Consolidation',
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

function createUseOfFundsLineItem(
  overrides: Partial<Omit<UseOfFundsLineItem, 'id'>> = {},
): UseOfFundsLineItem {
  return {
    id: `uof-${Math.random().toString(36).slice(2, 10)}`,
    description: overrides.description ?? '',
    amount: overrides.amount ?? '',
  };
}

const UNIVERSAL_USE_OF_FUNDS_ROWS = [
  'Closing costs / lender fees',
  'Professional fees',
  'Operating reserve',
  'Working capital cushion',
  'Taxes, title, or recording fees',
  'Appraisal / inspection costs',
] as const;

function getPurposeSpecificUseOfFundsRows(loanPurpose: string): string[] {
  switch (loanPurpose) {
    case 'Commercial Real Estate Purchase':
      return ['Property purchase price', 'Down payment / equity injection', 'Tenant improvements', 'Initial reserves', 'Environmental report', 'Survey or title costs'];
    case 'Commercial Real Estate Refinance':
      return ['Existing loan payoff', 'Cash-out for business purpose', 'Prepayment penalty', 'Escrow or reserve funding', 'Property improvements', 'Debt service reserve'];
    case 'Equipment Purchase':
      return ['Equipment purchase', 'Delivery / freight', 'Installation / setup', 'Training or onboarding', 'Warranty / maintenance plan', 'Taxes or fees'];
    case 'Vehicle Purchase':
      return ['Vehicle purchase', 'Taxes, title, and registration', 'Commercial upfit', 'Insurance startup costs', 'Delivery costs', 'Fleet equipment'];
    case 'Inventory Purchase':
      return ['Inventory purchase', 'Freight / shipping', 'Vendor deposits', 'Bulk purchase discount', 'Storage / warehousing', 'Seasonal stock build'];
    case 'Business Acquisition':
      return ['Business purchase price', 'Seller note payoff', 'Transition working capital', 'Due diligence costs', 'Legal / closing fees', 'Post-close reserves'];
    case 'Debt Refinance / Consolidation':
      return ['Debt payoff', 'Merchant cash advance payoff', 'Credit card payoff', 'Prepayment penalty', 'Reserve cushion', 'Closing costs'];
    case 'Business Expansion / New Location':
      return ['Buildout / improvements', 'Equipment and fixtures', 'Opening inventory', 'Lease deposit', 'Hiring / training', 'Launch marketing'];
    case 'Tenant Improvements / Renovation':
      return ['Construction / buildout', 'Fixtures and equipment', 'Permits', 'Architect / contractor fees', 'Contingency', 'Furniture and signage'];
    case 'Franchise Purchase':
      return ['Franchise fee', 'Buildout', 'Equipment', 'Opening inventory', 'Training costs', 'Startup working capital'];
    case 'Revolving Line of Credit':
      return ['Working capital draws', 'Inventory purchases', 'Payroll timing', 'Vendor payments', 'Receivables timing gap', 'Seasonal operating needs'];
    case 'Bridge Financing':
      return ['Short-term payoff', 'Transaction timing gap', 'Temporary liquidity', 'Deposit funding', 'Closing costs', 'Expected takeout costs'];
    case 'Working Capital':
      return ['Payroll / staffing', 'Inventory or supplies', 'Vendor payments', 'Rent or occupancy costs', 'Receivables timing gap', 'Operating reserve'];
    default:
      return ['Primary business need', 'Equipment or supplies', 'Inventory', 'Payroll / staffing', 'Marketing / sales growth', 'Operating reserve'];
  }
}

function getUseOfFundsStarterRows(loanPurpose: string): string[] {
  return Array.from(new Set([
    ...getPurposeSpecificUseOfFundsRows(loanPurpose),
    ...UNIVERSAL_USE_OF_FUNDS_ROWS,
  ]));
}

function buildUseOfFundsLineItemLabel(label: string): string {
  return label.trim();
}

const EMPTY_COVER_LETTER_FORM: CoverLetterFormState = {
  businessDescription: '',
  industry: '',
  entityType: '',
  customerType: '',
  topCustomers: '',
  websiteUrl: '',
  ownerManagementExperience: '',
  operatingHistory: '',
  businessModelType: '',
  businessLocationDetails: '',
  businessLocation: '',
  currentBusinessTraits: [],
  currentBusinessTraitsOther: '',
  currentBusinessTraitsDetails: '',
  employeeCount: '',
  useOfFundsBreakdown: [createUseOfFundsLineItem()],
  useOfFundsNarrative: '',
  timingNarrative: '',
  noLoanImpact: '',
  withLoanImpact: '',
  currentFinancialBaseline: '',
  projectedFinancialImpact: '',
  repaymentSource: '',
  repaymentSourceOther: '',
  revenueStreams: [],
  revenueStreamsOther: '',
  financingImpact: [],
  financingImpactOther: '',
  repaymentNotes: '',
  supportingFactors: [],
  supportingFactorsOther: '',
  supportingFactorsDetails: '',
  collateralDetails: '',
  personalGuaranteeDetails: '',
  ownerInvestmentDetails: '',
  weaknessMitigation: '',
  additionalLenderNotes: '',
};

function asCoverLetterText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return '';
}

function asCoverLetterStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.flatMap((entry) => {
        if (typeof entry !== 'string') {
          return [];
        }

        const trimmed = entry.trim();
        return trimmed.length > 0 ? [trimmed] : [];
      }),
    ),
  );
}

function asUseOfFundsLineItems(value: unknown): UseOfFundsLineItem[] {
  if (!Array.isArray(value)) {
    return [createUseOfFundsLineItem()];
  }

  const rows = value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return [];
    }

    const source = entry as Record<string, unknown>;
    const description =
      typeof source.description === 'string'
        ? source.description
        : typeof source.label === 'string'
          ? source.label
          : '';
    const amountValue =
      typeof source.amount === 'number' && Number.isFinite(source.amount)
        ? String(source.amount)
        : typeof source.amount === 'string'
          ? source.amount
          : '';

    if (!description.trim() && !amountValue.trim()) {
      return [];
    }

    return [
      createUseOfFundsLineItem({
        description,
        amount: formatCurrencyInput(amountValue),
      }),
    ];
  });

  return rows.length > 0 ? rows : [createUseOfFundsLineItem()];
}

function buildOperatingHistoryValue(source: Record<string, unknown>): string {
  const directValue = asCoverLetterText(source.operatingHistory);
  if (directValue) {
    return directValue;
  }

  const foundedYear = asCoverLetterText(source.foundedYear);
  if (foundedYear) {
    return foundedYear;
  }

  const yearsInBusiness = asCoverLetterText(source.yearsInBusiness);
  if (yearsInBusiness) {
    return yearsInBusiness;
  }

  return '';
}

function normalizeBusinessModelType(value: unknown): BusinessModelType | '' {
  switch (typeof value === 'string' ? value.trim().toLowerCase() : '') {
    case 'local':
      return 'local';
    case 'regional':
      return 'regional';
    case 'nationwide':
      return 'nationwide';
    case 'online':
      return 'online';
    case 'hybrid':
      return 'hybrid';
    default:
      return '';
  }
}

function inferBusinessModelType(source: Record<string, unknown>): BusinessModelType | '' {
  const explicitValue = normalizeBusinessModelType(source.businessModelType);
  if (explicitValue) {
    return explicitValue;
  }

  const location = asCoverLetterText(source.businessLocation).toLowerCase();
  if (!location) {
    return '';
  }

  if (
    (location.includes('online') || location.includes('e-commerce') || location.includes('ecommerce')) &&
    (location.includes('physical') || location.includes('store') || location.includes('location'))
  ) {
    return 'hybrid';
  }

  if (location.includes('online') || location.includes('e-commerce') || location.includes('ecommerce')) {
    return 'online';
  }

  if (location.includes('nationwide') || location.includes('across the u.s') || location.includes('across the us')) {
    return 'nationwide';
  }

  if (location.includes('multi-state') || location.includes('multiple states') || location.includes('regional')) {
    return 'regional';
  }

  return 'local';
}

function buildBusinessLocationSummary(
  businessModelType: BusinessModelType | '',
  businessLocationDetails: string,
  fallbackLocation = '',
): string {
  const trimmedDetails = businessLocationDetails.trim();

  switch (businessModelType) {
    case 'local':
      return trimmedDetails;
    case 'regional':
      return trimmedDetails ? `serving ${trimmedDetails}` : '';
    case 'nationwide':
      return 'nationwide across the U.S.';
    case 'online':
      return trimmedDetails
        ? `primarily online with customers ${trimmedDetails}`
        : 'primarily online';
    case 'hybrid':
      return trimmedDetails
        ? `through a hybrid model with ${trimmedDetails}`
        : 'through a hybrid physical and online model';
    default:
      return fallbackLocation.trim();
  }
}

function buildBusinessLocationDetails(source: Record<string, unknown>, businessModelType: BusinessModelType | ''): string {
  const explicitDetails = asCoverLetterText(source.businessLocationDetails);
  if (explicitDetails) {
    return explicitDetails;
  }

  if (businessModelType === 'nationwide') {
    return 'Nationwide (U.S.)';
  }

  return asCoverLetterText(source.businessLocation);
}

function sanitizeBusinessTraits(values: string[]): string[] {
  return values.filter((value) => value !== COVER_LETTER_OTHER_VALUE);
}

function toggleSelection(values: string[], option: string, maxSelections?: number): string[] {
  if (values.includes(option)) {
    return values.filter((value) => value !== option);
  }

  if (maxSelections && values.length >= maxSelections) {
    return values;
  }

  return [...values, option];
}

function includesOtherValue(values: string[]): boolean {
  return values.includes(COVER_LETTER_OTHER_VALUE);
}

function buildCoverLetterFormState(inputs: Record<string, unknown> | null | undefined): CoverLetterFormState {
  const source = inputs ?? {};
  const businessModelType = inferBusinessModelType(source);
  const businessLocationDetails = buildBusinessLocationDetails(source, businessModelType);
  const businessLocation = buildBusinessLocationSummary(
    businessModelType,
    businessLocationDetails,
    asCoverLetterText(source.businessLocation),
  );

  return {
    businessDescription:
      asCoverLetterText(source.businessDescription) ||
      asCoverLetterText(source.businessOverview),
    industry: asCoverLetterText(source.industry),
    entityType: asCoverLetterText(source.entityType),
    customerType: asCoverLetterText(source.customerType),
    topCustomers: asCoverLetterText(source.topCustomers),
    websiteUrl: asCoverLetterText(source.websiteUrl),
    ownerManagementExperience: asCoverLetterText(source.ownerManagementExperience),
    businessModelType,
    businessLocationDetails,
    operatingHistory: buildOperatingHistoryValue(source),
    businessLocation,
    currentBusinessTraits: sanitizeBusinessTraits(asCoverLetterStringArray(source.currentBusinessTraits)),
    currentBusinessTraitsOther: asCoverLetterText(source.currentBusinessTraitsOther),
    currentBusinessTraitsDetails: asCoverLetterText(source.currentBusinessTraitsDetails),
    employeeCount: asCoverLetterText(source.employeeCount),
    useOfFundsBreakdown: asUseOfFundsLineItems(source.useOfFundsBreakdown),
    useOfFundsNarrative:
      asCoverLetterText(source.useOfFundsNarrative) ||
      asCoverLetterText(source.fundUseDetails),
    timingNarrative:
      asCoverLetterText(source.timingNarrative) ||
      asCoverLetterText(source.timingDetails) ||
      asCoverLetterText(source.timingReason) ||
      asCoverLetterText(source.urgencyReason),
    noLoanImpact: asCoverLetterText(source.noLoanImpact) || asCoverLetterText(source.fundingDelayImpact),
    withLoanImpact: asCoverLetterText(source.withLoanImpact) || asCoverLetterText(source.projectStatus),
    currentFinancialBaseline: asCoverLetterText(source.currentFinancialBaseline) || asCoverLetterText(source.borrowerContribution),
    projectedFinancialImpact: asCoverLetterText(source.projectedFinancialImpact) || asCoverLetterText(source.projectEvidence),
    repaymentSource: asCoverLetterText(source.repaymentSource),
    repaymentSourceOther: asCoverLetterText(source.repaymentSourceOther),
    revenueStreams: asCoverLetterStringArray(source.revenueStreams),
    revenueStreamsOther: asCoverLetterText(source.revenueStreamsOther),
    financingImpact: asCoverLetterStringArray(source.financingImpact),
    financingImpactOther:
      asCoverLetterText(source.financingImpactOther) ||
      asCoverLetterText(source.expectedOutcome),
    repaymentNotes:
      asCoverLetterText(source.repaymentNotes) ||
      asCoverLetterText(source.repaymentNarrativeNotes),
    supportingFactors: asCoverLetterStringArray(source.supportingFactors),
    supportingFactorsOther:
      asCoverLetterText(source.supportingFactorsOther) ||
      asCoverLetterText(source.ownerStrengths),
    supportingFactorsDetails: asCoverLetterText(source.supportingFactorsDetails),
    collateralDetails: asCoverLetterText(source.collateralDetails),
    personalGuaranteeDetails: asCoverLetterText(source.personalGuaranteeDetails),
    ownerInvestmentDetails: asCoverLetterText(source.ownerInvestmentDetails),
    weaknessMitigation: asCoverLetterText(source.weaknessMitigation),
    additionalLenderNotes:
      asCoverLetterText(source.additionalLenderNotes) ||
      asCoverLetterText(source.additionalContext),
  };
}

function mergeBusinessResearchSuggestions(
  previous: CoverLetterFormState,
  suggestions: BusinessResearchSuggestions,
): CoverLetterFormState {
  const next: CoverLetterFormState = { ...previous };
  const textFields: Array<keyof Pick<CoverLetterFormState,
    | 'businessDescription'
    | 'industry'
    | 'entityType'
    | 'customerType'
    | 'topCustomers'
    | 'websiteUrl'
    | 'ownerManagementExperience'
    | 'operatingHistory'
    | 'businessLocationDetails'
    | 'businessLocation'
    | 'currentBusinessTraitsDetails'
    | 'employeeCount'
    | 'repaymentSource'
    | 'supportingFactorsDetails'
    | 'additionalLenderNotes'
  >> = [
    'businessDescription',
    'industry',
    'entityType',
    'customerType',
    'topCustomers',
    'websiteUrl',
    'ownerManagementExperience',
    'operatingHistory',
    'businessLocationDetails',
    'businessLocation',
    'currentBusinessTraitsDetails',
    'employeeCount',
    'repaymentSource',
    'supportingFactorsDetails',
    'additionalLenderNotes',
  ];

  textFields.forEach((field) => {
    const value = suggestions[field];
    if (typeof value === 'string' && value.trim().length > 0) {
      next[field] = value.trim();
    }
  });

  if (suggestions.businessModelType) {
    next.businessModelType = suggestions.businessModelType;
  }

  if (Array.isArray(suggestions.currentBusinessTraits) && suggestions.currentBusinessTraits.length > 0) {
    next.currentBusinessTraits = suggestions.currentBusinessTraits;
  }

  if (Array.isArray(suggestions.revenueStreams) && suggestions.revenueStreams.length > 0) {
    next.revenueStreams = suggestions.revenueStreams;
  }

  if (Array.isArray(suggestions.supportingFactors) && suggestions.supportingFactors.length > 0) {
    next.supportingFactors = suggestions.supportingFactors;
  }

  return next;
}

function MultiSelectChips({
  options,
  values,
  maxSelections,
  onToggle,
}: {
  options: readonly string[];
  values: string[];
  maxSelections?: number;
  onToggle: (option: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = values.includes(option);
        const disableSelection = Boolean(maxSelections && values.length >= maxSelections && !isSelected);

        return (
          <button
            key={option}
            type="button"
            aria-pressed={isSelected}
            disabled={disableSelection}
            onClick={() => onToggle(option)}
            className={`rounded-full border px-3 py-2 text-left text-sm font-medium transition ${
              isSelected
                ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                : disableSelection
                  ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
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

  const [uploadingRequirementKey, setUploadingRequirementKey] = useState<string | null>(null);
  const [activeRequirementMenuKey, setActiveRequirementMenuKey] = useState<string | null>(null);
  const [packageExclusionDialog, setPackageExclusionDialog] = useState<{
    requirementKey: string;
    displayName: string;
    nextExcludedFromPackage: boolean;
  } | null>(null);
  const [updatingPackageExclusionKey, setUpdatingPackageExclusionKey] = useState<string | null>(null);
  const [buildingPackage, setBuildingPackage] = useState(false);
  const [downloadingPackage, setDownloadingPackage] = useState(false);
  const [packageResult, setPackageResult] = useState<PackageBuildResult | null>(null);
  const [coverLetterDraft, setCoverLetterDraft] = useState('');
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
  const [approvingCoverLetter, setApprovingCoverLetter] = useState(false);
  const [updatingLoanAmountFromUseOfFunds, setUpdatingLoanAmountFromUseOfFunds] = useState(false);
  const [showCoverLetterValidation, setShowCoverLetterValidation] = useState(false);
  const [showCurrentBusinessTraitsDetails, setShowCurrentBusinessTraitsDetails] = useState(false);
  const [researchPanelDismissed, setResearchPanelDismissed] = useState(false);
  const [researchPanelExpanded, setResearchPanelExpanded] = useState(true);
  const [researchBusinessName, setResearchBusinessName] = useState('');
  const [researchLocation, setResearchLocation] = useState('');
  const [researchWebsiteUrl, setResearchWebsiteUrl] = useState('');
  const [researchingBusiness, setResearchingBusiness] = useState(false);
  const [researchSources, setResearchSources] = useState<BusinessResearchResponse['sources']>([]);
  const [activeCoverLetterTab, setActiveCoverLetterTab] = useState<CoverLetterTabId>('business-overview');
  const [expandedWorkflowSections, setExpandedWorkflowSections] = useState<Record<WorkflowSectionId, boolean>>({
    'loan-profile': false,
    documents: false,
    'cover-letter': false,
    package: false,
  });

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

  const legacyTemplateSubmissionById = useMemo(() => {
    const items = dashboard?.legacyTemplateSubmissions ?? [];
    return new Map(items.map((submission) => [submission.id, submission]));
  }, [dashboard?.legacyTemplateSubmissions]);

  const latestLegacyTemplateSubmissionByType = useMemo(() => {
    const items = [...(dashboard?.legacyTemplateSubmissions ?? [])].sort(
      (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
    );

    return new Map(
      items.map((submission) => [submission.template_type, submission] as const),
    );
  }, [dashboard?.legacyTemplateSubmissions]);

  const loanProfileComplete = useMemo(() => {
    return (
      loanForm.businessName.trim().length > 0 &&
      loanForm.loanPurpose.trim().length > 0 &&
      loanForm.loanAmount.trim().length > 0
    );
  }, [loanForm.businessName, loanForm.loanPurpose, loanForm.loanAmount]);
  const loanProfileSummary = useMemo(() => {
    const businessName = loanForm.businessName.trim();
    const loanPurpose = loanForm.loanPurpose.trim();
    const loanAmount = parseNullableNumber(loanForm.loanAmount);
    const summaryParts = [
      businessName,
      loanAmount !== null ? `${formatCurrency(loanAmount)} request` : '',
      loanPurpose,
    ].filter(Boolean);

    return summaryParts.length > 0
      ? summaryParts.join(' • ')
      : 'Business, request amount, use of funds, and estimated loan structure';
  }, [loanForm.businessName, loanForm.loanPurpose, loanForm.loanAmount]);

  const documentsComplete = useMemo(() => {
    const progress = dashboard?.progress;
    if (!progress || progress.totalRequired === 0) {
      return false;
    }

    return progress.completedRequired >= progress.totalRequired;
  }, [dashboard?.progress]);

  const coverLetterComplete = dashboard?.loanRequest?.cover_letter_status === 'approved';
  const isLoanBrokeringRequest = dashboard?.loanRequest?.service_type === 'loan_brokering';

  const packageComplete = isLoanBrokeringRequest
    ? documentsComplete && coverLetterComplete
    : Boolean(dashboard?.loanRequest?.package_zip_path);
  const latestPackageDownloadUrl =
    packageResult?.downloadUrl ?? dashboard?.loanRequest?.package_download_url ?? null;
  const latestPackageFileName =
    packageResult?.archiveFileName ??
    buildPackageDownloadFileName(dashboard?.loanRequest?.business_name);
  const loanAmountValue = parseNullableNumber(loanForm.loanAmount) ?? 0;
  const selectedLoanPurposeLabel = loanForm.loanPurpose.trim() || 'this request';
  const currentFinancingDefaults = getFinancingDefaults(loanForm.loanPurpose);
  const isInterestOnlyFinancing = currentFinancingDefaults.paymentMode === 'interest_only';
  const financingInterestRateValue = parseNullableNumber(financingEstimate.interestRate) ?? currentFinancingDefaults.annualRatePct;
  const financingDownPaymentAmountValue = parseNullableNumber(financingEstimate.downPaymentAmount) ?? 0;
  const financingTermYearsValue = Math.max(
    Math.round(parseNullableNumber(financingEstimate.termYears) ?? currentFinancingDefaults.termMonths / 12),
    1,
  );
  const financingTermMonthsValue = financingTermYearsValue * 12;
  const financedAmount = isInterestOnlyFinancing
    ? loanAmountValue
    : Math.max(loanAmountValue - financingDownPaymentAmountValue, 0);
  const estimatedMonthlyPayment = calculateEstimatedMonthlyPayment(
    financedAmount,
    financingInterestRateValue,
    financingTermMonthsValue,
    currentFinancingDefaults.paymentMode,
  );
  const useOfFundsBreakdownTotal = useMemo(
    () =>
      coverLetterForm.useOfFundsBreakdown.reduce((sum, row) => {
        return sum + (parseNullableNumber(row.amount) ?? 0);
      }, 0),
    [coverLetterForm.useOfFundsBreakdown],
  );
  const useOfFundsBreakdownDifference = useMemo(() => {
    if (loanAmountValue <= 0 || useOfFundsBreakdownTotal <= 0) {
      return null;
    }

    return useOfFundsBreakdownTotal - loanAmountValue;
  }, [loanAmountValue, useOfFundsBreakdownTotal]);
  const useOfFundsPrompt = useMemo<UseOfFundsPromptConfig>(() => {
    return USE_OF_FUNDS_PROMPTS_BY_PURPOSE[loanForm.loanPurpose] ?? DEFAULT_USE_OF_FUNDS_PROMPT;
  }, [loanForm.loanPurpose]);
  const useOfFundsStarterRows = useMemo(() => getUseOfFundsStarterRows(loanForm.loanPurpose), [loanForm.loanPurpose]);
  const useOfFundsSubtotalBeforeBrokerFee = useMemo(
    () =>
      coverLetterForm.useOfFundsBreakdown.reduce((sum, row) => {
        if (row.description.toLowerCase().includes('broker') && row.description.includes('1%')) {
          return sum;
        }

        return sum + (parseNullableNumber(row.amount) ?? 0);
      }, 0),
    [coverLetterForm.useOfFundsBreakdown],
  );
  const brokerFeeAmount = (useOfFundsSubtotalBeforeBrokerFee > 0 ? useOfFundsSubtotalBeforeBrokerFee : loanAmountValue) * 0.01;
  const businessLocationSummary = useMemo(() => {
    return buildBusinessLocationSummary(
      coverLetterForm.businessModelType,
      coverLetterForm.businessLocationDetails,
      coverLetterForm.businessLocation,
    );
  }, [
    coverLetterForm.businessLocation,
    coverLetterForm.businessLocationDetails,
    coverLetterForm.businessModelType,
  ]);
  const operatingHistoryYear = useMemo(() => {
    if (!/^\d{4}$/.test(coverLetterForm.operatingHistory.trim())) {
      return null;
    }

    const parsedYear = Number(coverLetterForm.operatingHistory);
    return parsedYear >= 1900 && parsedYear <= CURRENT_YEAR ? parsedYear : null;
  }, [coverLetterForm.operatingHistory]);
  const yearsInBusinessDisplay = useMemo(() => {
    if (!operatingHistoryYear) {
      return null;
    }

    return Math.max(CURRENT_YEAR - operatingHistoryYear, 0);
  }, [operatingHistoryYear]);
  const currentBusinessTraitsDetailsVisible = showCurrentBusinessTraitsDetails || coverLetterForm.currentBusinessTraitsDetails.trim().length > 0;
  const loanProfileProgressPercentage = useMemo(() => {
    const completedFields = [
      loanForm.businessName.trim(),
      loanForm.loanPurpose.trim(),
      loanForm.loanAmount.trim(),
    ].filter(Boolean).length;

    return (completedFields / 3) * LOAN_PROFILE_PROGRESS_WEIGHT;
  }, [loanForm.businessName, loanForm.loanAmount, loanForm.loanPurpose]);

  const loanProfileMissingFields = useMemo(() => {
    const missing: string[] = [];

    if (!loanForm.businessName.trim()) {
      missing.push('business name');
    }

    if (!loanForm.loanPurpose.trim()) {
      missing.push('loan purpose');
    }

    if (!loanForm.loanAmount.trim()) {
      missing.push('loan amount');
    }

    return missing;
  }, [loanForm.businessName, loanForm.loanAmount, loanForm.loanPurpose]);

  const coverLetterFieldErrors = useMemo<CoverLetterFieldErrors>(() => {
    const errors: CoverLetterFieldErrors = {};

    if (!coverLetterForm.businessDescription.trim()) {
      errors.businessDescription = 'Tell us what the business does.';
    }

    if (!coverLetterForm.industry.trim()) {
      errors.industry = 'Add the industry.';
    }

    if (!coverLetterForm.entityType.trim()) {
      errors.entityType = 'Add the business entity type.';
    }

    if (!coverLetterForm.customerType.trim()) {
      errors.customerType = 'Describe your typical customers.';
    }

    if (!coverLetterForm.topCustomers.trim()) {
      errors.topCustomers = 'Add top customer/client notes, or write none if not applicable.';
    }

    if (!coverLetterForm.ownerManagementExperience.trim()) {
      errors.ownerManagementExperience = 'Add owner or management experience.';
    }

    if (!coverLetterForm.operatingHistory.trim()) {
      errors.operatingHistory = 'Enter the year the business began operating.';
    } else if (!/^\d{4}$/.test(coverLetterForm.operatingHistory.trim())) {
      errors.operatingHistory = 'Use a 4-digit year.';
    } else {
      const operatingYear = Number(coverLetterForm.operatingHistory);
      if (operatingYear < 1900 || operatingYear > CURRENT_YEAR) {
        errors.operatingHistory = `Enter a year between 1900 and ${CURRENT_YEAR}.`;
      }
    }

    if (!coverLetterForm.businessModelType) {
      errors.businessModelType = 'Choose how the business operates.';
    }

    if (!businessLocationSummary.trim()) {
      errors.businessLocationDetails = coverLetterForm.businessModelType === 'online'
        ? 'Add where your customers are primarily located.'
        : 'Add the location or market details for how the business operates.';
    }

    if (coverLetterForm.currentBusinessTraits.length === 0) {
      errors.currentBusinessTraits = 'Choose up to 5 strengths of the business today.';
    }

    const completeUseOfFundsRows = coverLetterForm.useOfFundsBreakdown.filter((row) => {
      return row.description.trim().length > 0 && (parseNullableNumber(row.amount) ?? 0) > 0;
    });
    const hasPartialUseOfFundsRows = coverLetterForm.useOfFundsBreakdown.some((row) => {
      const hasDescription = row.description.trim().length > 0;
      const hasAmount = (parseNullableNumber(row.amount) ?? 0) > 0;
      return hasDescription !== hasAmount;
    });

    if (completeUseOfFundsRows.length === 0) {
      errors.useOfFundsBreakdown = 'Add at least one use-of-funds line item with a description and amount.';
    } else if (hasPartialUseOfFundsRows) {
      errors.useOfFundsBreakdown = 'Finish or remove any incomplete use-of-funds rows.';
    }

    if (!coverLetterForm.useOfFundsNarrative.trim()) {
      errors.useOfFundsNarrative = 'Explain the use of funds in more detail.';
    }

    if (!coverLetterForm.timingNarrative.trim()) {
      errors.timingNarrative = 'Explain why this financing matters right now.';
    }

    if (!coverLetterForm.noLoanImpact.trim()) {
      errors.noLoanImpact = 'Explain what happens if the loan is not approved.';
    }

    if (!coverLetterForm.withLoanImpact.trim()) {
      errors.withLoanImpact = 'Explain what the loan would allow the business to do.';
    }

    if (!coverLetterForm.currentFinancialBaseline.trim()) {
      errors.currentFinancialBaseline = 'Describe the current financial baseline or write not sure.';
    }

    if (!coverLetterForm.projectedFinancialImpact.trim()) {
      errors.projectedFinancialImpact = 'Describe the expected financial impact or write not sure.';
    }

    if (!dashboard?.cashFlowSummary || dashboard.cashFlowSummary.years.length === 0) {
      errors.repaymentNotes = 'Complete the comprehensive cash flow analysis before generating the cover letter.';
    }

    if (!coverLetterForm.repaymentSource) {
      errors.repaymentSource = 'Choose the primary source of repayment.';
    } else if (
      coverLetterForm.repaymentSource === COVER_LETTER_OTHER_VALUE &&
      !coverLetterForm.repaymentSourceOther.trim()
    ) {
      errors.repaymentSourceOther = 'Describe the repayment source.';
    }

    if (coverLetterForm.revenueStreams.length === 0) {
      errors.revenueStreams = 'Choose up to 5 revenue sources.';
    } else if (
      includesOtherValue(coverLetterForm.revenueStreams) &&
      !coverLetterForm.revenueStreamsOther.trim()
    ) {
      errors.revenueStreamsOther = 'Describe the other revenue source.';
    }

    if (coverLetterForm.financingImpact.length === 0) {
      errors.financingImpact = 'Choose up to 3 business impacts.';
    } else if (
      includesOtherValue(coverLetterForm.financingImpact) &&
      !coverLetterForm.financingImpactOther.trim()
    ) {
      errors.financingImpactOther = 'Describe the other expected impact.';
    }

    if (!coverLetterForm.supportingFactorsDetails.trim()) {
      errors.supportingFactorsDetails = 'Explain the strongest supporting factors.';
    }

    return errors;
  }, [coverLetterForm, dashboard?.cashFlowSummary]);

  const coverLetterProgressPercentage = useMemo(() => {
    const requiredFields: Array<keyof CoverLetterFormState | 'repaymentNotes'> = [
      'businessDescription',
      'industry',
      'entityType',
      'customerType',
      'topCustomers',
      'ownerManagementExperience',
      'operatingHistory',
      'businessModelType',
      'businessLocationDetails',
      'currentBusinessTraits',
      'useOfFundsBreakdown',
      'useOfFundsNarrative',
      'timingNarrative',
      'noLoanImpact',
      'withLoanImpact',
      'currentFinancialBaseline',
      'projectedFinancialImpact',
      'repaymentNotes',
      'repaymentSource',
      'revenueStreams',
      'financingImpact',
      'supportingFactorsDetails',
    ];
    const conditionalFields: Array<keyof CoverLetterFormState> = [
      'repaymentSourceOther',
      'revenueStreamsOther',
      'financingImpactOther',
      'currentBusinessTraitsOther',
    ];
    const activeConditionalFields = conditionalFields.filter((field) => Boolean(coverLetterFieldErrors[field]));
    const progressFields = [...requiredFields, ...activeConditionalFields];
    const completedFields = progressFields.filter((field) => !coverLetterFieldErrors[field as keyof CoverLetterFormState]).length;
    const completedUnits = completedFields + (coverLetterComplete ? 1 : 0);
    const totalUnits = progressFields.length + 1;

    return (completedUnits / totalUnits) * COVER_LETTER_PROGRESS_WEIGHT;
  }, [coverLetterComplete, coverLetterFieldErrors]);

  const weightedChecklistProgressPercentage = useMemo(() => {
    const documentProgress = dashboard?.progress.totalRequired
      ? (dashboard.progress.completedRequired / dashboard.progress.totalRequired) * DOCUMENT_CHECKLIST_PROGRESS_WEIGHT
      : 0;

    return Math.min(
      100,
      Math.round(loanProfileProgressPercentage + documentProgress + coverLetterProgressPercentage),
    );
  }, [coverLetterProgressPercentage, dashboard?.progress, loanProfileProgressPercentage]);

  const coverLetterReady = Object.keys(coverLetterFieldErrors).length === 0;
  const coverLetterTabFieldMap: Record<CoverLetterTabId, Array<keyof CoverLetterFormState>> = {
    'business-overview': [
      'businessDescription',
      'industry',
      'entityType',
      'customerType',
      'topCustomers',
      'websiteUrl',
      'ownerManagementExperience',
      'operatingHistory',
      'businessModelType',
      'businessLocationDetails',
      'currentBusinessTraits',
      'currentBusinessTraitsOther',
      'supportingFactorsDetails',
      'weaknessMitigation',
    ],
    'use-of-funds': [
      'useOfFundsBreakdown',
      'useOfFundsNarrative',
      'timingNarrative',
      'noLoanImpact',
      'withLoanImpact',
      'currentFinancialBaseline',
      'projectedFinancialImpact',
    ],
    repayment: [
      'repaymentSource',
      'repaymentSourceOther',
      'revenueStreams',
      'revenueStreamsOther',
      'financingImpact',
      'financingImpactOther',
    ],
    review: [],
  };
  const coverLetterTabHasErrors = useMemo<Record<CoverLetterTabId, boolean>>(() => {
    return {
      'business-overview': coverLetterTabFieldMap['business-overview'].some((field) => Boolean(coverLetterFieldErrors[field])),
      'use-of-funds': coverLetterTabFieldMap['use-of-funds'].some((field) => Boolean(coverLetterFieldErrors[field])),
      repayment: coverLetterTabFieldMap.repayment.some((field) => Boolean(coverLetterFieldErrors[field])),
      review: false,
    };
  }, [coverLetterFieldErrors]);
  const coverLetterTabCompleted = useMemo<Record<CoverLetterTabId, boolean>>(() => {
    return {
      'business-overview': !coverLetterTabHasErrors['business-overview'],
      'use-of-funds': !coverLetterTabHasErrors['use-of-funds'],
      repayment: !coverLetterTabHasErrors.repayment,
      review: coverLetterDraft.trim().length >= 50 || coverLetterComplete,
    };
  }, [coverLetterComplete, coverLetterDraft, coverLetterTabHasErrors]);
  const firstIncompleteCoverLetterTab = useMemo<CoverLetterTabId>(() => {
    if (coverLetterTabHasErrors['business-overview']) {
      return 'business-overview';
    }

    if (coverLetterTabHasErrors['use-of-funds']) {
      return 'use-of-funds';
    }

    if (coverLetterTabHasErrors.repayment) {
      return 'repayment';
    }

    return 'review';
  }, [coverLetterTabHasErrors]);
  const activeCoverLetterTabIndex = useMemo(
    () => Math.max(COVER_LETTER_TABS.findIndex((tab) => tab.id === activeCoverLetterTab), 0),
    [activeCoverLetterTab],
  );
  const coverLetterTabsRef = useRef<HTMLDivElement | null>(null);
  const scrollCoverLetterTabsIntoView = useCallback(() => {
    window.requestAnimationFrame(() => {
      coverLetterTabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);
  const goToCoverLetterTab = useCallback((tabId: CoverLetterTabId) => {
    setActiveCoverLetterTab(tabId);
    scrollCoverLetterTabsIntoView();
  }, [scrollCoverLetterTabsIntoView]);

  const previousCoverLetterTab = activeCoverLetterTabIndex > 0
    ? (COVER_LETTER_TABS[activeCoverLetterTabIndex - 1] ?? null)
    : null;
  const nextCoverLetterTab = activeCoverLetterTabIndex < COVER_LETTER_TABS.length - 1
    ? (COVER_LETTER_TABS[activeCoverLetterTabIndex + 1] ?? null)
    : null;
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
      title: isLoanBrokeringRequest ? 'Lender Outreach' : 'Download Package',
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
        : isLoanBrokeringRequest
          ? 'Your package is ready for broker review and lender outreach.'
          : !packageComplete
            ? 'Build the package ZIP and create lender access once the package is fully ready.'
            : 'Your lender package is ready to download and share.';

  const nextOpenWorkflowSectionId: WorkflowSectionId = !loanProfileComplete
    ? 'loan-profile'
    : !documentsComplete
      ? 'documents'
      : !coverLetterComplete
        ? 'cover-letter'
        : 'package';

  useEffect(() => {
    setExpandedWorkflowSections((previous) => {
      const next = {
        'loan-profile': loanProfileComplete ? false : previous['loan-profile'],
        documents: documentsComplete ? false : previous.documents,
        'cover-letter': coverLetterComplete ? false : previous['cover-letter'],
        package: packageComplete ? false : previous.package,
      };

      next[nextOpenWorkflowSectionId] = true;

      if (
        next['loan-profile'] === previous['loan-profile'] &&
        next.documents === previous.documents &&
        next['cover-letter'] === previous['cover-letter'] &&
        next.package === previous.package
      ) {
        return previous;
      }

      return next;
    });
  }, [coverLetterComplete, documentsComplete, loanProfileComplete, nextOpenWorkflowSectionId, packageComplete]);

  const toggleWorkflowSection = useCallback((sectionId: WorkflowSectionId) => {
    setExpandedWorkflowSections((previous) => ({
      ...previous,
      [sectionId]: !previous[sectionId],
    }));
  }, []);

  const renderWorkflowSectionHeader = (
    sectionId: WorkflowSectionId,
    number: number,
    title: string,
    description: string,
    complete: boolean,
    summary: string,
  ) => {
    const expanded = expandedWorkflowSections[sectionId];

    return (
      <button
        type="button"
        onClick={() => toggleWorkflowSection(sectionId)}
        className="flex min-h-[74px] w-full items-center justify-between gap-4 rounded-2xl px-5 py-3 text-left transition hover:bg-slate-50"
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${complete ? 'bg-emerald-600 text-white' : expanded ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {complete ? <CheckCircle2 className="h-5 w-5" /> : number}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={`${headingClassName} text-lg text-slate-950`}>{title}</h2>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${complete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {complete ? 'Complete' : 'Needs action'}
              </span>
            </div>
            <p className="mt-0.5 whitespace-normal text-xs leading-5 text-slate-500">{expanded ? description : summary}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 sm:inline-flex">
            {expanded ? 'Collapse' : 'Open'}
          </span>
          <ChevronDown className={`h-5 w-5 text-slate-500 transition ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
    );
  };

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

  useEffect(() => {
    if (!activeRequirementMenuKey) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.closest('[data-checklist-menu-root="true"]')) {
        return;
      }

      setActiveRequirementMenuKey(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveRequirementMenuKey(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeRequirementMenuKey]);

  const hydrateDashboardState = useCallback((payload: DashboardPayload) => {
    const nextSharedProfile = payload.sharedProfile ?? sharedProfileRef.current;
    const fallbackBusinessName =
      nextSharedProfile.businessName || nextSharedProfile.businessLegalName || '';

    setSharedProfile(nextSharedProfile);
    setDashboard(payload);
    setCoverLetterDraft(payload.loanRequest?.cover_letter_content ?? '');
    setCoverLetterForm(buildCoverLetterFormState(payload.loanRequest?.cover_letter_inputs));
    setShowCoverLetterValidation(false);

    const loanRequest = payload.loanRequest;
    setResearchBusinessName(loanRequest?.business_name || fallbackBusinessName);
    setResearchLocation(asCoverLetterText(loanRequest?.cover_letter_inputs?.businessLocationDetails));
    setResearchWebsiteUrl(asCoverLetterText(loanRequest?.cover_letter_inputs?.websiteUrl));
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
      if (currentFinancingDefaults.paymentMode === 'interest_only') {
        if (previous.downPaymentPct === '0' && previous.downPaymentAmount === '') {
          return previous;
        }

        return {
          ...previous,
          downPaymentPct: '0',
          downPaymentAmount: '',
        };
      }

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
    currentFinancingDefaults.paymentMode,
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
    setCoverLetterForm((previous) => {
      const brokerFeeDescription = 'Broker fee (1%)';
      const rowsWithoutBrokerFee = previous.useOfFundsBreakdown.filter(
        (row) => !(row.description.toLowerCase().includes('broker') && row.description.includes('1%')),
      );

      if (!isLoanBrokeringRequest) {
        if (rowsWithoutBrokerFee.length === previous.useOfFundsBreakdown.length) {
          return previous;
        }

        return {
          ...previous,
          useOfFundsBreakdown: rowsWithoutBrokerFee.length > 0 ? rowsWithoutBrokerFee : [createUseOfFundsLineItem()],
        };
      }

      if (!(brokerFeeAmount > 0)) {
        return previous;
      }

      const nextBrokerAmount = formatCurrencyInput(String(brokerFeeAmount));
      const existingBrokerFee = previous.useOfFundsBreakdown.find(
        (row) => row.description.toLowerCase().includes('broker') && row.description.includes('1%'),
      );

      if (existingBrokerFee?.amount === nextBrokerAmount && existingBrokerFee.description === brokerFeeDescription) {
        return previous;
      }

      return {
        ...previous,
        useOfFundsBreakdown: [
          ...rowsWithoutBrokerFee.filter((row) => row.description.trim() || row.amount.trim()),
          createUseOfFundsLineItem({
            description: brokerFeeDescription,
            amount: nextBrokerAmount,
          }),
        ],
      };
    });
  }, [brokerFeeAmount, isLoanBrokeringRequest]);

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

  const handleUpdateLoanAmountFromUseOfFunds = useCallback(async () => {
    if (!(useOfFundsBreakdownTotal > 0)) {
      setErrorMessage('Add at least one valid use-of-funds row before updating the loan amount.');
      return;
    }

    const nextLoanAmount = formatCurrencyInput(String(useOfFundsBreakdownTotal));
    const currentCoverLetterForm = coverLetterForm;
    setLoanForm((previous) => ({
      ...previous,
      loanAmount: nextLoanAmount,
    }));

    if (userId) {
      void upsertTemplateSharedProfile(userId, { loanAmount: useOfFundsBreakdownTotal });
      setSharedProfile((previous) => ({
        ...previous,
        loanAmount: useOfFundsBreakdownTotal,
      }));
    }

    if (!accessToken) {
      setStatusMessage('Loan amount updated from the use-of-funds total.');
      return;
    }

    setUpdatingLoanAmountFromUseOfFunds(true);
    setErrorMessage(null);

    try {
      const payload = await apiFetch<DashboardPayload>('/api/loan-packaging/dashboard', {
        method: 'POST',
        body: JSON.stringify({
          loanRequestId: dashboard?.loanRequest?.id,
          serviceType: 'loan_packaging',
          status: dashboard?.loanRequest?.status || 'in_progress',
          businessName: loanForm.businessName,
          loanPurpose: loanForm.loanPurpose,
          loanAmount: useOfFundsBreakdownTotal,
          annualRevenue: parseNullableNumber(loanForm.annualRevenue),
          yearsInBusiness: parseNullableNumber(loanForm.yearsInBusiness),
          businessDescription: loanForm.loanPurposeDescription,
        }),
      });

      hydrateDashboardState(payload);
      setCoverLetterForm(currentCoverLetterForm);
      setStatusMessage(
        coverLetterDraft.trim().length > 0
          ? 'Loan amount updated to match the use-of-funds total. Regenerate the draft so the cover letter reflects the new amount.'
          : 'Loan amount updated to match the use-of-funds total.',
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update the loan amount');
    } finally {
      setUpdatingLoanAmountFromUseOfFunds(false);
    }
  }, [
    accessToken,
    apiFetch,
    coverLetterForm,
    coverLetterDraft,
    dashboard?.loanRequest?.id,
    dashboard?.loanRequest?.status,
    hydrateDashboardState,
    loanForm.annualRevenue,
    loanForm.businessName,
    loanForm.loanPurpose,
    loanForm.loanPurposeDescription,
    loanForm.yearsInBusiness,
    userId,
    useOfFundsBreakdownTotal,
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
    if (currentFinancingDefaults.paymentMode === 'interest_only') {
      setFinancingEstimate((previous) => ({
        ...previous,
        downPaymentPct: '0',
        downPaymentAmount: '',
      }));
      return;
    }

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
  }, [currentFinancingDefaults.paymentMode, loanAmountValue]);

  const handleDownPaymentAmountChange = useCallback((value: string) => {
    if (currentFinancingDefaults.paymentMode === 'interest_only') {
      setFinancingEstimate((previous) => ({
        ...previous,
        downPaymentPct: '0',
        downPaymentAmount: '',
      }));
      return;
    }

    const nextAmount = parseNullableNumber(sanitizeCurrencyInput(value)) ?? 0;
    const cappedAmount = Math.min(nextAmount, loanAmountValue);
    const nextPct = loanAmountValue > 0 ? (cappedAmount / loanAmountValue) * 100 : 0;

    setFinancingEstimate((previous) => ({
      ...previous,
      downPaymentAmount: formatCurrencyInput(String(cappedAmount)),
      downPaymentPct: formatPercentInput(nextPct),
    }));
  }, [currentFinancingDefaults.paymentMode, loanAmountValue]);

  const handleUseOfFundsAmountBlur = useCallback(() => {
    if (useOfFundsBreakdownTotal > loanAmountValue) {
      setLoanForm((previous) => ({
        ...previous,
        loanAmount: formatCurrencyInput(String(useOfFundsBreakdownTotal)),
      }));
    }
  }, [loanAmountValue, useOfFundsBreakdownTotal]);

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

  const formatStatusLabel = useCallback((status: string) => {
    if (status === 'skipped') {
      return 'Skipped';
    }

    return status
      .split('_')
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }, []);

  const isLegacyTemplateSubmissionStarted = useCallback(
    (submission: LegacyTemplateSubmission | null | undefined) => {
      if (!submission) {
        return false;
      }

      if (submission.pdf_url) {
        return true;
      }

      if (submission.template_type === 'income_statement') {
        return (
          getIncomeStatementProgress(
            (submission.form_data ?? {}) as unknown as Parameters<typeof getIncomeStatementProgress>[0],
          ).percent > 0
        );
      }

      return true;
    },
    [],
  );

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

  const handlePackageExclusionUpdate = useCallback(async () => {
    if (!packageExclusionDialog) {
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setUpdatingPackageExclusionKey(packageExclusionDialog.requirementKey);

    try {
      const loanRequestId = await ensureLoanRequest();
      if (!loanRequestId) {
        throw new Error('Unable to initialize loan request.');
      }

      await apiFetch('/api/loan-packaging/documents', {
        method: 'PATCH',
        body: JSON.stringify({
          loanRequestId,
          requirementKey: packageExclusionDialog.requirementKey,
          excludedFromPackage: packageExclusionDialog.nextExcludedFromPackage,
        }),
      });

      await loadDashboard();
      setPackageExclusionDialog(null);
      setActiveRequirementMenuKey(null);
      setStatusMessage(
        packageExclusionDialog.nextExcludedFromPackage
          ? `${packageExclusionDialog.displayName} skipped. You can still upload or complete it later.`
          : `${packageExclusionDialog.displayName} marked as needed again.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to update package document settings',
      );
    } finally {
      setUpdatingPackageExclusionKey(null);
    }
  }, [apiFetch, ensureLoanRequest, loadDashboard, packageExclusionDialog]);

  const openTemplateRoute = useCallback(async (
    requirement: DocumentRequirement,
    submissionId?: string | null,
  ) => {
    if (!requirement.template_key) {
      return;
    }

    setErrorMessage(null);
    try {
      const loanRequestId = await ensureLoanRequest();
      if (!loanRequestId) {
        throw new Error('Unable to initialize loan request.');
      }

      const params = new URLSearchParams({
        source: 'loan-packaging',
        returnTo: 'loan-package',
        loanRequestId,
        requirementKey: requirement.requirement_key,
      });

      if (submissionId) {
        params.set('submissionId', submissionId);
      }

      router.push(`/templates/${requirement.template_key}?${params.toString()}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to open template');
    }
  }, [ensureLoanRequest, router]);

  const handleResearchBusiness = useCallback(async () => {
    const trimmedBusinessName = researchBusinessName.trim() || loanForm.businessName.trim();
    if (trimmedBusinessName.length < 2) {
      setErrorMessage('Add the business name before running research.');
      return;
    }

    setResearchingBusiness(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const loanRequestId = await ensureLoanRequest();
      const payload = await apiFetch<BusinessResearchResponse>('/api/loan-packaging/business-research', {
        method: 'POST',
        body: JSON.stringify({
          loanRequestId,
          businessName: trimmedBusinessName,
          location: researchLocation.trim(),
          websiteUrl: researchWebsiteUrl.trim(),
        }),
      });

      setCoverLetterForm((previous) => mergeBusinessResearchSuggestions(previous, payload.suggestions));
      setResearchSources(payload.sources ?? []);
      setShowCurrentBusinessTraitsDetails(true);
      setResearchPanelExpanded(false);
      setStatusMessage(payload.message || 'Research complete. Review the suggested answers before generating your cover letter.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Business research failed');
    } finally {
      setResearchingBusiness(false);
    }
  }, [apiFetch, ensureLoanRequest, loanForm.businessName, researchBusinessName, researchLocation, researchWebsiteUrl]);

  const handleGenerateCoverLetter = useCallback(async () => {
    setShowCoverLetterValidation(true);

    if (!loanProfileComplete) {
      setActiveCoverLetterTab('use-of-funds');
      setErrorMessage(
        loanProfileMissingFields.length > 0
          ? `Add the ${loanProfileMissingFields.join(' and ')} in Loan Profile before generating the cover letter.`
          : 'Complete the loan profile before generating the cover letter.',
      );
      return;
    }

    if (!coverLetterReady) {
      setActiveCoverLetterTab(firstIncompleteCoverLetterTab);
      setErrorMessage('Complete the required cover letter questions highlighted below before generating the draft.');
      return;
    }

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
          coverLetterInputs: {
            businessDescription: coverLetterForm.businessDescription,
            industry: coverLetterForm.industry,
            entityType: coverLetterForm.entityType,
            customerType: coverLetterForm.customerType,
            topCustomers: coverLetterForm.topCustomers,
            websiteUrl: coverLetterForm.websiteUrl,
            ownerManagementExperience: coverLetterForm.ownerManagementExperience,
            operatingHistory: coverLetterForm.operatingHistory,
            businessModelType: coverLetterForm.businessModelType,
            businessLocationDetails: coverLetterForm.businessLocationDetails,
            businessLocation: businessLocationSummary,
            currentBusinessTraits: coverLetterForm.currentBusinessTraits,
            currentBusinessTraitsOther: coverLetterForm.currentBusinessTraitsOther,
            currentBusinessTraitsDetails: coverLetterForm.currentBusinessTraitsDetails,
            employeeCount: coverLetterForm.employeeCount,
            useOfFundsBreakdown: coverLetterForm.useOfFundsBreakdown
              .map((row) => ({
                description: row.description.trim(),
                amount: parseNullableNumber(row.amount) ?? 0,
              }))
              .filter((row) => row.description.length > 0 && row.amount > 0),
            useOfFundsNarrative: coverLetterForm.useOfFundsNarrative,
            timingNarrative: coverLetterForm.timingNarrative,
            noLoanImpact: coverLetterForm.noLoanImpact,
            withLoanImpact: coverLetterForm.withLoanImpact,
            currentFinancialBaseline: coverLetterForm.currentFinancialBaseline,
            projectedFinancialImpact: coverLetterForm.projectedFinancialImpact,
            cashFlowSummary: dashboard?.cashFlowSummary ?? null,
            repaymentSource: coverLetterForm.repaymentSource,
            repaymentSourceOther: coverLetterForm.repaymentSourceOther,
            revenueStreams: coverLetterForm.revenueStreams,
            revenueStreamsOther: coverLetterForm.revenueStreamsOther,
            financingImpact: coverLetterForm.financingImpact,
            financingImpactOther: coverLetterForm.financingImpactOther,
            repaymentNotes: coverLetterForm.repaymentNotes,
            supportingFactors: coverLetterForm.currentBusinessTraits,
            supportingFactorsOther: coverLetterForm.currentBusinessTraitsOther,
            supportingFactorsDetails: coverLetterForm.supportingFactorsDetails,
            collateralDetails: coverLetterForm.collateralDetails,
            personalGuaranteeDetails: coverLetterForm.personalGuaranteeDetails,
            ownerInvestmentDetails: coverLetterForm.ownerInvestmentDetails,
            weaknessMitigation: coverLetterForm.weaknessMitigation,
            additionalLenderNotes: coverLetterForm.additionalLenderNotes,
          },
        }),
      });

      setCoverLetterDraft(payload.coverLetterContent ?? '');
      setShowCoverLetterValidation(false);
      setActiveCoverLetterTab('review');
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
    coverLetterForm.additionalLenderNotes,
    coverLetterForm.businessDescription,
    coverLetterForm.noLoanImpact,
    coverLetterForm.businessLocation,
    coverLetterForm.businessLocationDetails,
    coverLetterForm.businessModelType,
    coverLetterForm.collateralDetails,
    coverLetterForm.currentBusinessTraits,
    coverLetterForm.currentBusinessTraitsOther,
    coverLetterForm.currentBusinessTraitsDetails,
    coverLetterForm.customerType,
    coverLetterForm.topCustomers,
    coverLetterForm.websiteUrl,
    coverLetterForm.employeeCount,
    coverLetterForm.entityType,
    coverLetterForm.financingImpact,
    coverLetterForm.financingImpactOther,
    coverLetterForm.projectedFinancialImpact,
    coverLetterForm.industry,
    coverLetterForm.ownerInvestmentDetails,
    coverLetterForm.ownerManagementExperience,
    coverLetterForm.personalGuaranteeDetails,
    coverLetterForm.currentFinancialBaseline,
    coverLetterForm.withLoanImpact,
    coverLetterForm.supportingFactorsDetails,
    coverLetterForm.useOfFundsBreakdown,
    coverLetterForm.useOfFundsNarrative,
    coverLetterForm.operatingHistory,
    coverLetterForm.repaymentNotes,
    coverLetterForm.repaymentSource,
    coverLetterForm.repaymentSourceOther,
    coverLetterForm.revenueStreams,
    coverLetterForm.revenueStreamsOther,
    coverLetterForm.supportingFactors,
    coverLetterForm.supportingFactorsOther,
    coverLetterForm.timingNarrative,
    coverLetterForm.weaknessMitigation,
    businessLocationSummary,
    dashboard?.cashFlowSummary,
    coverLetterReady,
    ensureLoanRequest,
    firstIncompleteCoverLetterTab,
    loadDashboard,
    loanForm.annualRevenue,
    loanForm.businessName,
    loanForm.loanAmount,
    loanForm.loanPurpose,
    loanForm.loanPurposeDescription,
    loanProfileComplete,
    loanProfileMissingFields,
  ]);

  const handleApproveCoverLetter = useCallback(async () => {
    if (coverLetterDraft.trim().length < 50) {
      setActiveCoverLetterTab('review');
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
              <p className="text-4xl font-bold text-white">{weightedChecklistProgressPercentage}%</p>
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

        <div className="grid gap-6 xl:grid-cols-[224px,minmax(0,1fr)]">
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
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
              {renderWorkflowSectionHeader(
                'loan-profile',
                1,
                'Loan Profile',
                'Add the core loan details once. We reuse these details across your package so you do not need to retype them.',
                loanProfileComplete,
                loanProfileSummary,
              )}

              {expandedWorkflowSections['loan-profile'] ? (
                <div className="border-t border-slate-100 p-6">
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

              <div className="mt-4 rounded-[26px] border border-blue-100 bg-[linear-gradient(135deg,_rgba(239,246,255,0.98)_0%,_rgba(255,255,255,0.99)_52%,_rgba(240,253,250,0.95)_100%)] p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">Use of Funds</p>
                    <h3 className={`${headingClassName} mt-0.5 text-[1.35rem] leading-tight`}>Tell lenders exactly where the money is going</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Break the request into plain-English line items. Include the main purchase or need, plus normal loan-related costs such as closing costs, appraisal or inspection costs, reserves, delivery, installation, and professional fees when they apply. If the total goes above the loan amount, the loan amount updates so the request stays consistent.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Breakdown Total</p>
                    <p className="mt-1 text-2xl font-bold text-slate-950">{formatCurrency(useOfFundsBreakdownTotal)}</p>
                    <p className="mt-1 text-xs text-slate-500">Loan amount: {formatCurrency(loanAmountValue)}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="text-sm font-semibold text-slate-800">Suggested line items for {loanForm.loanPurpose || 'this loan purpose'}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    The first options are tailored to the selected purpose. The rest are common loan package costs that may apply to many requests.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {useOfFundsStarterRows.map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() =>
                          setCoverLetterForm((previous) => ({
                            ...previous,
                            useOfFundsBreakdown: [
                              ...previous.useOfFundsBreakdown.filter((row) => row.description.trim() || row.amount.trim()),
                              createUseOfFundsLineItem({ description: buildUseOfFundsLineItemLabel(label) }),
                            ],
                          }))
                        }
                        className="min-h-10 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-left text-xs font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-100"
                      >
                        + {label}
                      </button>
                    ))}
                  </div>
                  {isLoanBrokeringRequest && brokerFeeAmount > 0 ? (
                    <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                      Broker fee is being included automatically for this brokering request as a 1% use-of-funds line item.
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="grid grid-cols-[minmax(0,1fr)_160px_48px] border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <span>What the funds will pay for</span>
                    <span>Amount</span>
                    <span className="sr-only">Remove</span>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {coverLetterForm.useOfFundsBreakdown.map((row, index) => (
                      <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_160px_48px] items-center gap-3 px-3 py-3">
                        <input
                          type="text"
                          value={row.description}
                          onChange={(event) =>
                            setCoverLetterForm((previous) => ({
                              ...previous,
                              useOfFundsBreakdown: previous.useOfFundsBreakdown.map((item) =>
                                item.id === row.id ? { ...item, description: event.target.value } : item,
                              ),
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={index === 0 ? 'Property purchase price, equipment, inventory, working capital...' : 'Describe this use of funds'}
                        />
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={row.amount}
                            onChange={(event) =>
                              setCoverLetterForm((previous) => ({
                                ...previous,
                                useOfFundsBreakdown: previous.useOfFundsBreakdown.map((item) =>
                                  item.id === row.id
                                    ? { ...item, amount: formatCurrencyInput(sanitizeCurrencyInput(event.target.value)) }
                                    : item,
                                ),
                              }))
                            }
                            onBlur={handleUseOfFundsAmountBlur}
                            className="w-full rounded-lg border border-slate-300 py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="25,000"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setCoverLetterForm((previous) => {
                              const nextRows = previous.useOfFundsBreakdown.filter((item) => item.id !== row.id);
                              return {
                                ...previous,
                                useOfFundsBreakdown: nextRows.length > 0 ? nextRows : [createUseOfFundsLineItem()],
                              };
                            })
                          }
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-500 transition hover:border-slate-400 hover:text-slate-900"
                          aria-label={`Remove use of funds row ${index + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setCoverLetterForm((previous) => ({
                        ...previous,
                        useOfFundsBreakdown: [...previous.useOfFundsBreakdown, createUseOfFundsLineItem()],
                      }))
                    }
                    className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    Add line
                  </button>
                </div>
              </div>

              {loanAmountValue > 0 ? (
                <div className="mt-4 rounded-[26px] border border-slate-200 bg-[linear-gradient(135deg,_rgba(239,246,255,0.95)_0%,_rgba(255,255,255,0.98)_45%,_rgba(241,245,249,0.95)_100%)] p-4 shadow-sm">
                  <div className="flex flex-col gap-1.5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">Estimated Loan Structure</p>
                      <h3 className={`${headingClassName} mt-0.5 text-[1.35rem] leading-tight`}>See the financing picture right away</h3>
                      <p className="mt-1 max-w-none text-[13px] leading-5 text-slate-600 2xl:max-w-[96%]">
                        {isInterestOnlyFinancing
                          ? `These starting numbers reflect how lenders often size a ${selectedLoanPurposeLabel.toLowerCase()}: assuming the full line is drawn and estimating the payment as amount x rate / 12.`
                          : `These starting numbers reflect what is typically seen for ${selectedLoanPurposeLabel}. If your lender has different terms, requires a different equity injection, or you want to put more down to lower the payment, adjust them here. Otherwise, we recommend leaving them as-is.`}
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
                    </label>

                    <label className="group rounded-2xl border border-slate-200 bg-white/90 p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        <Percent className="h-4 w-4 text-amber-600" />
                        Down Payment
                      </span>
                      <div className="mt-2.5 flex justify-center">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5">
                          {isInterestOnlyFinancing ? (
                            <span className="text-center text-lg font-semibold text-slate-900">0%</span>
                          ) : (
                            <>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={financingEstimate.downPaymentPct}
                                onChange={(event) => handleDownPaymentPctChange(event.target.value)}
                                className="w-[5ch] bg-transparent text-center text-lg font-semibold text-slate-900 outline-none"
                                placeholder="10.00"
                              />
                              <span className="text-sm font-semibold text-slate-500">%</span>
                            </>
                          )}
                        </div>
                      </div>
                    </label>

                    <label className="group rounded-2xl border border-slate-200 bg-white/90 p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        <Clock3 className="h-4 w-4 text-violet-600" />
                        {isInterestOnlyFinancing ? 'Payment Basis' : 'Term'}
                      </span>
                      <div className="mt-2.5 flex justify-center">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5">
                          {isInterestOnlyFinancing ? (
                            <span className="text-center text-lg font-semibold text-slate-900">Amount x rate / 12</span>
                          ) : (
                            <>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={financingEstimate.termYears}
                                onChange={(event) => handleTermYearsChange(event.target.value)}
                                className="w-[3ch] bg-transparent text-center text-lg font-semibold text-slate-900 outline-none"
                                placeholder={String(Math.max(currentFinancingDefaults.termMonths / 12, 1))}
                              />
                              <span className="text-sm font-semibold text-slate-500">yr</span>
                            </>
                          )}
                        </div>
                      </div>
                    </label>

                    <label className="group rounded-2xl border border-slate-200 bg-white/90 p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        <Wallet className="h-4 w-4 text-emerald-600" />
                        Down Payment $
                      </span>
                      <div className="mt-2.5 flex justify-center">
                        <div className="inline-flex min-w-[9.75rem] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2">
                          {isInterestOnlyFinancing ? (
                            <span className="text-center text-lg font-semibold tabular-nums text-slate-900">$0</span>
                          ) : (
                            <>
                              <span className="text-base font-semibold text-slate-500">$</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={financingEstimate.downPaymentAmount}
                                onChange={(event) => handleDownPaymentAmountChange(event.target.value)}
                                className="w-[7ch] bg-transparent text-center text-lg font-semibold tabular-nums text-slate-900 outline-none"
                                placeholder="5,000"
                              />
                            </>
                          )}
                        </div>
                      </div>
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
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

                </div>
              ) : null}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
              {renderWorkflowSectionHeader(
                'documents',
                2,
                'Document Checklist',
                'Upload what you already have, use guided templates where available, and complete generated items directly inside the platform.',
                documentsComplete,
                `${dashboard?.progress.completedRequired ?? 0} of ${dashboard?.progress.totalRequired ?? 0} required documents complete`,
              )}

              {expandedWorkflowSections.documents ? (
                <div className="border-t border-slate-100 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {(dashboard?.requirements ?? []).map((requirement) => {
                  if (requirement.requirement_key === 'cover_letter') {
                    return null;
                  }

                  const isBrokerAgreementRequirement = requirement.requirement_key === 'broker_fee_agreement';
                  const document = documentByRequirementKey.get(requirement.requirement_key);
                  const displayStatus = getDocumentDisplayStatus(document);
                  const isExcludedFromPackage = isDocumentExcludedFromPackage(document);
                  const linkedTemplateSubmissionId =
                    typeof document?.metadata?.template_submission_id === 'string'
                      ? document.metadata.template_submission_id
                      : null;
                  const linkedLegacyTemplateSubmission = linkedTemplateSubmissionId
                    ? legacyTemplateSubmissionById.get(linkedTemplateSubmissionId) ?? null
                    : null;
                  const fallbackLegacyTemplateSubmission = requirement.template_key
                    ? latestLegacyTemplateSubmissionByType.get(requirement.template_key) ?? null
                    : null;
                  const activeLegacyTemplateSubmission =
                    linkedLegacyTemplateSubmission ?? fallbackLegacyTemplateSubmission;
                  const guidedTemplateSubmission = requirement.template_key
                    ? templateSubmissionByKey.get(requirement.template_key)
                    : null;
                  const templateActionLabel = requirement.template_key
                    ? isLegacyTemplateSubmissionStarted(activeLegacyTemplateSubmission)
                      ? 'Continue Template'
                      : 'Start Template'
                    : null;
                  const primaryActionCount =
                    (isBrokerAgreementRequirement ? 1 : 0) +
                    (requirement.template_key ? 1 : 0) +
                    (!isBrokerAgreementRequirement ? 1 : 0) +
                    (document?.download_url ? 1 : 0);
                  const actionGridTemplateColumns = `${Array.from(
                    { length: Math.max(primaryActionCount, 1) },
                    () => 'minmax(0, 1fr)',
                  ).join(' ')} 2.75rem`;
                  const menuOpen = activeRequirementMenuKey === requirement.requirement_key;
                  const canTogglePackageInclusion = requirement.required;
                  const isUpdatingPackageExclusion =
                    updatingPackageExclusionKey === requirement.requirement_key;

                  return (
                    <article
                      key={requirement.requirement_key}
                      className={`rounded-xl border p-4 space-y-3 shadow-sm transition ${
                        isExcludedFromPackage
                          ? 'border-amber-200 bg-amber-50/70'
                          : 'border-slate-200 bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">{requirement.display_name}</h3>
                          <p className="text-xs text-slate-600 mt-1">{requirement.description}</p>
                        </div>
                        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${mapStatusColor(displayStatus)}`}>
                          {formatStatusLabel(displayStatus)}
                        </span>
                      </div>

                      <div
                        className="grid items-stretch gap-2"
                        style={{ gridTemplateColumns: actionGridTemplateColumns }}
                      >
                          {isBrokerAgreementRequirement ? (
                            <button
                              onClick={() => router.push('/loan-brokering/agreement')}
                              className="inline-flex h-11 min-w-0 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-[0.8rem] font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                            >
                              {document?.download_url ? 'Review Agreement' : 'Review & Sign Agreement'}
                            </button>
                          ) : null}

                          {requirement.template_key ? (
                            <button
                              onClick={() => openTemplateRoute(requirement, activeLegacyTemplateSubmission?.id ?? null)}
                              className="inline-flex h-11 min-w-0 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-indigo-300 bg-indigo-50 px-3 text-[0.8rem] font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
                            >
                              {templateActionLabel}
                            </button>
                          ) : null}

                          {!isBrokerAgreementRequirement ? (
                            <label className="inline-flex h-11 min-w-0 w-full cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-blue-300 bg-blue-50 px-3 text-[0.8rem] font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100">
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
                              className="inline-flex h-11 min-w-0 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-[0.8rem] font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                            >
                              <Download className="h-3.5 w-3.5" />
                              {isBrokerAgreementRequirement ? 'View Signed Agreement' : 'View PDF'}
                            </a>
                          ) : null}

                        {canTogglePackageInclusion ? (
                          <div
                            className="relative"
                            data-checklist-menu-root="true"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setActiveRequirementMenuKey((current) =>
                                  current === requirement.requirement_key ? null : requirement.requirement_key,
                                )
                              }
                              disabled={isUpdatingPackageExclusion}
                              aria-haspopup="menu"
                              aria-expanded={menuOpen}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More actions</span>
                            </button>

                            {menuOpen ? (
                              <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.14)]">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPackageExclusionDialog({
                                      requirementKey: requirement.requirement_key,
                                      displayName: requirement.display_name,
                                      nextExcludedFromPackage: !isExcludedFromPackage,
                                    });
                                    setActiveRequirementMenuKey(null);
                                  }}
                                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                >
                                  {isExcludedFromPackage ? 'Mark as needed again' : 'Skip this document'}
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>

                      {isExcludedFromPackage ? (
                        <p className="text-xs font-medium text-amber-900">
                          Skipped for now. Lenders may still request this document, and you can mark it as needed again from the menu.
                        </p>
                      ) : null}

                      {guidedTemplateSubmission ? (
                        <p className="text-xs text-slate-500">
                          Template completion: {guidedTemplateSubmission.completion_pct}%
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
                </div>
              ) : null}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
              {renderWorkflowSectionHeader(
                'cover-letter',
                3,
                'Lender Cover Letter',
                'Create the lender-facing summary that explains your loan request, use of funds, repayment story, and strengths.',
                coverLetterComplete,
                coverLetterComplete ? 'Approved and saved as PDF' : 'Create the lender-facing summary that explains your loan request, use of funds, repayment story, and strengths.',
              )}

              {expandedWorkflowSections['cover-letter'] ? (
                <div className="space-y-5 border-t border-slate-100 p-6">
              {!loanProfileComplete ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Add the {loanProfileMissingFields.join(', ')} in Loan Profile first so the cover letter can reuse those details automatically.
                </div>
              ) : null}

              {showCoverLetterValidation && !coverLetterReady ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  Complete the remaining required questions below before generating the draft.
                </div>
              ) : null}

              {!researchPanelDismissed ? (
                <div className="overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-sm">
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                          <Search className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-950">Save time with business research</p>
                          <p className="text-xs leading-5 text-slate-600">
                            Enter your business name, location, and website. We will pull public business details into the cover letter questions for you to review.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setResearchPanelExpanded((current) => !current)}
                        className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                      >
                        {researchPanelExpanded ? 'Collapse' : 'Use research'}
                        <ChevronDown className={`h-3.5 w-3.5 transition ${researchPanelExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setResearchPanelDismissed(true)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                      >
                        Hide
                      </button>
                    </div>
                  </div>

                  {researchPanelExpanded ? (
                    <div className="border-t border-blue-100 px-4 pb-4">
                      <div className="grid gap-3 pt-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
                        <label className="space-y-1 text-xs font-semibold text-slate-700">
                          Business name
                          <input
                            type="text"
                            value={researchBusinessName}
                            onChange={(event) => setResearchBusinessName(event.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Business name"
                          />
                        </label>
                        <label className="space-y-1 text-xs font-semibold text-slate-700">
                          Location
                          <input
                            type="text"
                            value={researchLocation}
                            onChange={(event) => setResearchLocation(event.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="City, state or market served"
                          />
                        </label>
                        <label className="space-y-1 text-xs font-semibold text-slate-700">
                          Website
                          <input
                            type="url"
                            value={researchWebsiteUrl}
                            onChange={(event) => setResearchWebsiteUrl(event.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://yourbusiness.com"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleResearchBusiness}
                          disabled={researchingBusiness}
                          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 lg:mt-5"
                        >
                          {researchingBusiness ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          {researchingBusiness ? 'Researching...' : 'Research'}
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>Fills matching fields automatically. Please review anything added before generating the final letter.</span>
                        {researchSources.length > 0 ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
                            {researchSources.length} source{researchSources.length === 1 ? '' : 's'} used
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div ref={coverLetterTabsRef} className="scroll-mt-24 flex gap-2 overflow-x-auto pb-1">
                {COVER_LETTER_TABS.map((tab) => {
                  const isActive = activeCoverLetterTab === tab.id;
                  const isComplete = coverLetterTabCompleted[tab.id];
                  const hasErrors = showCoverLetterValidation && coverLetterTabHasErrors[tab.id];

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => goToCoverLetterTab(tab.id)}
                      className={`min-w-[180px] rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                          : hasErrors
                            ? 'border-rose-200 bg-rose-50 text-rose-900'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                            Step {COVER_LETTER_TABS.findIndex((entry) => entry.id === tab.id) + 1}
                          </p>
                          <span className="text-sm font-semibold">{tab.label}</span>
                        </div>
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            isActive
                              ? 'bg-white'
                              : hasErrors
                                ? 'bg-rose-500'
                                : isComplete
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-300'
                          }`}
                        />
                      </div>
                      <p className={`mt-1 text-xs leading-5 ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>
                        {tab.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                {activeCoverLetterTab === 'business-overview' ? (
                  <div className="space-y-4">
                    <label className="block space-y-1.5 text-sm">
                      <span className="font-semibold text-slate-700">What does your business do? *</span>
                      <span className="text-xs text-slate-500">
                        Briefly describe what your business does, what you sell or provide, and who your customers are. Keep it clear and specific in 1 to 2 sentences.
                      </span>
                      <span className="text-xs text-slate-500">Helpful structure: We provide [service/product] to [customer type] in [market].</span>
                      <textarea
                        value={coverLetterForm.businessDescription}
                        onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, businessDescription: event.target.value }))}
                        className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="We provide commercial landscaping services to office parks, retail centers, and industrial properties throughout Central Texas."
                      />
                      {showCoverLetterValidation && coverLetterFieldErrors.businessDescription ? (
                        <p className="text-xs font-medium text-rose-600">{coverLetterFieldErrors.businessDescription}</p>
                      ) : null}
                    </label>

                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="block space-y-1.5 text-sm">
                        <span className="font-semibold text-slate-700">Industry *</span>
                        <input
                          type="text"
                          value={coverLetterForm.industry}
                          onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, industry: event.target.value }))}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Construction, restaurant, trucking, medical practice"
                        />
                        {showCoverLetterValidation && coverLetterFieldErrors.industry ? (
                          <p className="text-xs font-medium text-rose-600">{coverLetterFieldErrors.industry}</p>
                        ) : null}
                      </label>

                      <label className="block space-y-1.5 text-sm">
                        <span className="font-semibold text-slate-700">Entity type *</span>
                        <select
                          value={coverLetterForm.entityType}
                          onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, entityType: event.target.value }))}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select one</option>
                          <option value="Sole Proprietorship">Sole Proprietorship</option>
                          <option value="LLC">LLC</option>
                          <option value="Corporation">Corporation</option>
                          <option value="S Corporation">S Corporation</option>
                          <option value="Partnership">Partnership</option>
                          <option value="Nonprofit">Nonprofit</option>
                          <option value="Other">Other</option>
                        </select>
                        {showCoverLetterValidation && coverLetterFieldErrors.entityType ? (
                          <p className="text-xs font-medium text-rose-600">{coverLetterFieldErrors.entityType}</p>
                        ) : null}
                      </label>

                      <label className="block space-y-1.5 text-sm">
                        <span className="font-semibold text-slate-700">Website URL</span>
                        <input
                          type="url"
                          value={coverLetterForm.websiteUrl}
                          onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, websiteUrl: event.target.value }))}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://yourbusiness.com"
                        />
                      </label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block space-y-1.5 text-sm">
                        <span className="font-semibold text-slate-700">Describe your typical customers *</span>
                        <span className="text-xs text-slate-500">Tell us who buys from you, where they are located, and what problem you solve for them.</span>
                        <textarea
                          value={coverLetterForm.customerType}
                          onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, customerType: event.target.value }))}
                          className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="We primarily serve commercial property managers, general contractors, and local business owners across Central Texas."
                        />
                        {showCoverLetterValidation && coverLetterFieldErrors.customerType ? (
                          <p className="text-xs font-medium text-rose-600">{coverLetterFieldErrors.customerType}</p>
                        ) : null}
                      </label>

                      <label className="block space-y-1.5 text-sm">
                        <span className="font-semibold text-slate-700">Top customers or client notes *</span>
                        <span className="text-xs text-slate-500">List major customers, repeat clients, contracts, concentration risk, or write none if not applicable.</span>
                        <textarea
                          value={coverLetterForm.topCustomers}
                          onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, topCustomers: event.target.value }))}
                          className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Top customers include three repeat commercial accounts representing about 35% of monthly revenue; no single client exceeds 20%."
                        />
                        {showCoverLetterValidation && coverLetterFieldErrors.topCustomers ? (
                          <p className="text-xs font-medium text-rose-600">{coverLetterFieldErrors.topCustomers}</p>
                        ) : null}
                      </label>
                    </div>

                    <label className="block space-y-1.5 text-sm">
                      <span className="font-semibold text-slate-700">Owner or management experience *</span>
                      <span className="text-xs text-slate-500">Include industry experience, licenses, certifications, or background that helps a lender trust the operator.</span>
                      <textarea
                        value={coverLetterForm.ownerManagementExperience}
                        onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, ownerManagementExperience: event.target.value }))}
                        className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="The owner has 12 years of industry experience and directly oversees sales, operations, and customer relationships."
                      />
                      {showCoverLetterValidation && coverLetterFieldErrors.ownerManagementExperience ? (
                        <p className="text-xs font-medium text-rose-600">{coverLetterFieldErrors.ownerManagementExperience}</p>
                      ) : null}
                    </label>

                    <label className="block space-y-1.5 text-sm">
                      <span className="font-semibold text-slate-700">What year did the business start operating? *</span>
                      <span className="text-xs text-slate-500">
                        Enter the 4-digit year the business began operating.
                      </span>
                      <input
                        type="number"
                        min="1900"
                        max={CURRENT_YEAR}
                        value={coverLetterForm.operatingHistory}
                        onChange={(event) =>
                          setCoverLetterForm((previous) => ({
                            ...previous,
                            operatingHistory: event.target.value.replace(/[^\d]/g, '').slice(0, 4),
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="2017"
                      />
                      {yearsInBusinessDisplay != null ? (
                        <span className="text-xs text-slate-500">
                          Approximately {yearsInBusinessDisplay} {yearsInBusinessDisplay === 1 ? 'year' : 'years'} in business.
                        </span>
                      ) : null}
                      {showCoverLetterValidation && coverLetterFieldErrors.operatingHistory ? (
                        <p className="text-xs font-medium text-rose-600">{coverLetterFieldErrors.operatingHistory}</p>
                      ) : null}
                    </label>

                    <div className="space-y-4 rounded-xl border border-slate-200 bg-white px-4 py-4">
                      <label className="block space-y-1.5 text-sm">
                        <span className="font-semibold text-slate-700">Business model type *</span>
                        <span className="text-xs text-slate-500">
                          Choose the operating model that best matches how your business reaches customers.
                        </span>
                        <select
                          value={coverLetterForm.businessModelType}
                          onChange={(event) =>
                            setCoverLetterForm((previous) => {
                              const nextBusinessModelType = normalizeBusinessModelType(event.target.value);
                              const resetDetails = previous.businessModelType === 'nationwide' && nextBusinessModelType !== 'nationwide';
                              return {
                                ...previous,
                                businessModelType: nextBusinessModelType,
                                businessLocationDetails: nextBusinessModelType === 'nationwide'
                                  ? 'Nationwide (U.S.)'
                                  : resetDetails
                                    ? ''
                                    : previous.businessLocationDetails,
                              };
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select one</option>
                          {BUSINESS_MODEL_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        {showCoverLetterValidation && coverLetterFieldErrors.businessModelType ? (
                          <p className="text-xs font-medium text-rose-600">{coverLetterFieldErrors.businessModelType}</p>
                        ) : null}
                      </label>

                      {coverLetterForm.businessModelType ? (
                        <label className="block space-y-1.5 text-sm">
                          <span className="font-semibold text-slate-700">
                            {coverLetterForm.businessModelType === 'online'
                              ? 'Where are your customers primarily located? *'
                              : 'Location details *'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {coverLetterForm.businessModelType === 'local'
                              ? 'Enter the primary city and state where the business operates.'
                              : coverLetterForm.businessModelType === 'regional'
                                ? 'Enter the cities, states, or regions your business primarily serves.'
                                : coverLetterForm.businessModelType === 'nationwide'
                                  ? 'This will be shown as a nationwide U.S. operating footprint.'
                                  : coverLetterForm.businessModelType === 'online'
                                    ? 'Enter the main regions where your customers are located, such as U.S. nationwide, Texas and surrounding states, or global.'
                                    : 'Describe both your physical footprint and your online/customer reach.'}
                          </span>
                          {coverLetterForm.businessModelType === 'nationwide' ? (
                            <input
                              type="text"
                              value="Nationwide (U.S.)"
                              readOnly
                              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-slate-700"
                            />
                          ) : coverLetterForm.businessModelType === 'regional' || coverLetterForm.businessModelType === 'hybrid' ? (
                            <textarea
                              value={coverLetterForm.businessLocationDetails}
                              onChange={(event) =>
                                setCoverLetterForm((previous) => ({
                                  ...previous,
                                  businessLocationDetails: event.target.value,
                                }))
                              }
                              className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={
                                coverLetterForm.businessModelType === 'regional'
                                  ? 'Dallas-Fort Worth, Austin, Houston, and surrounding Texas markets'
                                  : 'Physical showroom in Houston, Texas with online customers across the South and Midwest'
                              }
                            />
                          ) : (
                            <input
                              type="text"
                              value={coverLetterForm.businessLocationDetails}
                              onChange={(event) =>
                                setCoverLetterForm((previous) => ({
                                  ...previous,
                                  businessLocationDetails: event.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={
                                coverLetterForm.businessModelType === 'local'
                                  ? 'San Antonio, Texas'
                                  : 'Across the U.S., primarily Texas, Florida, and California'
                              }
                            />
                          )}
                          {businessLocationSummary ? (
                            <span className="text-xs text-slate-500">Cover letter summary: {businessLocationSummary}</span>
                          ) : null}
                          {showCoverLetterValidation && coverLetterFieldErrors.businessLocationDetails ? (
                            <p className="text-xs font-medium text-rose-600">{coverLetterFieldErrors.businessLocationDetails}</p>
                          ) : null}
                        </label>
                      ) : null}
                    </div>

                    <label className="block space-y-1.5 text-sm">
                      <span className="font-semibold text-slate-700">How many employees do you have?</span>
                      <span className="text-xs text-slate-500">
                        Optional. This helps show business scale and operating capacity.
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={coverLetterForm.employeeCount}
                        onChange={(event) =>
                          setCoverLetterForm((previous) => ({
                            ...previous,
                            employeeCount: event.target.value.replace(/[^\d]/g, ''),
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="12"
                      />
                    </label>

                    <div className="space-y-1.5 text-sm">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-700">Which of the following are strengths of your business today? *</p>
                        <p className="text-xs text-slate-500">Choose up to 5.</p>
                      </div>
                      <MultiSelectChips
                        options={BUSINESS_TODAY_OPTIONS}
                        values={coverLetterForm.currentBusinessTraits}
                        maxSelections={5}
                        onToggle={(option) =>
                          setCoverLetterForm((previous) => ({
                            ...previous,
                            currentBusinessTraits: toggleSelection(previous.currentBusinessTraits, option, 5),
                          }))
                        }
                      />
                      <input
                        type="text"
                        value={coverLetterForm.currentBusinessTraitsOther}
                        onChange={(event) =>
                          setCoverLetterForm((previous) => ({
                            ...previous,
                            currentBusinessTraitsOther: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Other strengths (optional)"
                      />
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-700">Would you like to add more detail about your strengths?</p>
                            <p className="text-xs text-slate-500">Optional, but it can make the cover letter stronger and more specific.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (currentBusinessTraitsDetailsVisible) {
                                setShowCurrentBusinessTraitsDetails(false);
                                return;
                              }

                              setShowCurrentBusinessTraitsDetails(true);
                            }}
                            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                          >
                            {currentBusinessTraitsDetailsVisible ? 'Hide detail field' : 'Add more detail'}
                          </button>
                        </div>
                        {currentBusinessTraitsDetailsVisible ? (
                          <textarea
                            value={coverLetterForm.currentBusinessTraitsDetails}
                            onChange={(event) =>
                              setCoverLetterForm((previous) => ({
                                ...previous,
                                currentBusinessTraitsDetails: event.target.value,
                              }))
                            }
                            className="mt-3 min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Add any lender-friendly detail about why these strengths matter, such as long customer relationships, strong margins, dependable collections, or durable demand."
                          />
                        ) : null}
                      </div>
                      {showCoverLetterValidation && coverLetterFieldErrors.currentBusinessTraits ? (
                        <p className="text-xs font-medium text-rose-600">
                          {coverLetterFieldErrors.currentBusinessTraits}
                        </p>
                      ) : null}
                    </div>

                    <label className="block space-y-1.5 text-sm">
                      <span className="font-semibold text-slate-700">Explain the strongest supporting factors *</span>
                      <span className="text-xs text-slate-500">Give the lender specific context behind the selected strengths.</span>
                      <textarea
                        value={coverLetterForm.supportingFactorsDetails}
                        onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, supportingFactorsDetails: event.target.value }))}
                        className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="The business has served several repeat commercial customers for 5+ years and maintains steady referral activity."
                      />
                      {showCoverLetterValidation && coverLetterFieldErrors.supportingFactorsDetails ? (
                        <p className="text-xs font-medium text-rose-600">{coverLetterFieldErrors.supportingFactorsDetails}</p>
                      ) : null}
                    </label>

                    <label className="block space-y-1.5 text-sm">
                      <span className="font-semibold text-slate-700">Any weaknesses or lender concerns to explain?</span>
                      <span className="text-xs text-slate-500">Optional. Explain revenue dips, short time in business, high debt, credit issues, or other concerns with mitigation.</span>
                      <textarea value={coverLetterForm.weaknessMitigation} onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, weaknessMitigation: event.target.value }))} className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional: explain any risk factors and what the business is doing to address them." />
                    </label>
                  </div>
                ) : null}

                {activeCoverLetterTab === 'use-of-funds' ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Use-of-funds pulled from Loan Profile</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            No need to re-enter the breakdown here. Update Loan Profile if these numbers need to change.
                          </p>
                        </div>
                        <div className="grid gap-2 text-sm sm:grid-cols-3 lg:min-w-[520px]">
                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Purpose</p>
                            <p className="mt-1 truncate font-semibold text-slate-900">{loanForm.loanPurpose || 'Not set'}</p>
                          </div>
                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Loan Amount</p>
                            <p className="mt-1 font-semibold text-slate-900">{formatCurrency(loanAmountValue)}</p>
                          </div>
                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Funds Total</p>
                            <p className="mt-1 font-semibold text-slate-900">{formatCurrency(useOfFundsBreakdownTotal)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {coverLetterForm.useOfFundsBreakdown.filter((row) => row.description.trim() || row.amount.trim()).map((row) => (
                          <div key={row.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                            <span className="min-w-0 truncate font-medium text-slate-700">{row.description || 'Use of funds'}</span>
                            <span className="shrink-0 font-semibold text-slate-950">{formatCurrency(parseNullableNumber(row.amount) ?? 0)}</span>
                          </div>
                        ))}
                      </div>

                      {showCoverLetterValidation && coverLetterFieldErrors.useOfFundsBreakdown ? (
                        <p className="mt-3 text-xs font-medium text-rose-600">{coverLetterFieldErrors.useOfFundsBreakdown}</p>
                      ) : null}
                    </div>

                    <label className="block space-y-1.5 text-sm">
                      <span className="font-semibold text-slate-700">{useOfFundsPrompt.narrativeLabel}</span>
                      <span className="text-xs text-slate-500">
                        {useOfFundsPrompt.narrativeHelper}
                      </span>
                      <textarea
                        value={coverLetterForm.useOfFundsNarrative}
                        onChange={(event) =>
                          setCoverLetterForm((previous) => ({
                            ...previous,
                            useOfFundsNarrative: event.target.value,
                          }))
                        }
                        className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={useOfFundsPrompt.narrativePlaceholder}
                      />
                      {showCoverLetterValidation && coverLetterFieldErrors.useOfFundsNarrative ? (
                        <p className="text-xs font-medium text-rose-600">{coverLetterFieldErrors.useOfFundsNarrative}</p>
                      ) : null}
                    </label>

                    <label className="block space-y-1.5 text-sm">
                      <span className="font-semibold text-slate-700">{useOfFundsPrompt.timingLabel}</span>
                      <span className="text-xs text-slate-500">
                        {useOfFundsPrompt.timingHelper}
                      </span>
                      <textarea
                        value={coverLetterForm.timingNarrative}
                        onChange={(event) =>
                          setCoverLetterForm((previous) => ({
                            ...previous,
                            timingNarrative: event.target.value,
                          }))
                        }
                        className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={useOfFundsPrompt.timingPlaceholder}
                      />
                      {showCoverLetterValidation && coverLetterFieldErrors.timingNarrative ? (
                        <p className="text-xs font-medium text-rose-600">{coverLetterFieldErrors.timingNarrative}</p>
                      ) : null}
                    </label>

                    <div className="space-y-4 rounded-xl border border-slate-200 bg-white px-4 py-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Loan impact comparison</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Help the lender understand the difference between the business staying as-is and the business receiving the requested funds. Estimates are okay.
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {[
                          ['noLoanImpact', 'If you do not get this loan, what happens? *', 'Describe the as-is outcome: delayed growth, cash flow pressure, missed opportunity, higher costs, or operational limits.'],
                          ['withLoanImpact', 'If you do get this loan, what changes? *', 'Describe what the funds unlock: more revenue, lower costs, better capacity, faster delivery, inventory, equipment, staff, or stability.'],
                          ['currentFinancialBaseline', 'Current financial baseline today *', 'Describe current monthly revenue, costs, margins, backlog, capacity, or write not sure if you do not have exact numbers.'],
                          ['projectedFinancialImpact', 'Projected financial impact after funding *', 'Estimate expected revenue increase, cost savings, margin improvement, monthly cash flow impact, or write not sure and explain directionally.'],
                        ].map(([field, label, helper]) => (
                          <label key={field} className="block space-y-1.5 text-sm">
                            <span className="font-semibold text-slate-700">{label}</span>
                            <span className="text-xs text-slate-500">{helper}</span>
                            <textarea
                              value={String(coverLetterForm[field as keyof CoverLetterFormState] ?? '')}
                              onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, [field as string]: event.target.value }))}
                              className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {showCoverLetterValidation && coverLetterFieldErrors[field as keyof CoverLetterFormState] ? (
                              <p className="text-xs font-medium text-rose-600">{coverLetterFieldErrors[field as keyof CoverLetterFormState]}</p>
                            ) : null}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeCoverLetterTab === 'repayment' ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Comprehensive cash flow analysis</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            This cover letter uses the high-level cash flow, debt service, and DSCR results from the comprehensive analysis.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => router.push(dashboard?.latestCashFlowAnalysisId ? `/report-preview?id=${encodeURIComponent(dashboard.latestCashFlowAnalysisId)}` : '/comprehensive-cash-flow-analysis')}
                          className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          {dashboard?.cashFlowSummary ? 'View Analysis' : 'Complete Analysis'}
                        </button>
                      </div>
                      {dashboard?.cashFlowSummary ? (
                        <div className="mt-4 overflow-x-auto">
                          <table className="min-w-full text-left text-sm">
                            <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
                              <tr>
                                <th className="px-3 py-2">Year</th>
                                <th className="px-3 py-2">Revenue</th>
                                <th className="px-3 py-2">Net Income</th>
                                <th className="px-3 py-2">Debt Service</th>
                                <th className="px-3 py-2">DSCR</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {dashboard.cashFlowSummary.years.map((year) => (
                                <tr key={year.label}>
                                  <td className="px-3 py-2 font-semibold text-slate-900">{year.label}</td>
                                  <td className="px-3 py-2">{formatCurrency(year.revenue)}</td>
                                  <td className="px-3 py-2">{formatCurrency(year.netIncome)}</td>
                                  <td className="px-3 py-2">{formatCurrency(year.debtService)}</td>
                                  <td className="px-3 py-2 font-semibold">{year.dscr == null ? 'N/A' : year.dscr.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                          Complete the comprehensive cash flow analysis before generating the cover letter so the repayment narrative is supported by year-over-year financials.
                        </p>
                      )}
                    </div>

                    <label className="block space-y-1.5 text-sm">
                      <span className="font-semibold text-slate-700">What will primarily be used to repay this loan? *</span>
                      <span className="text-xs text-slate-500">Select the main source of money that will be used to make loan payments.</span>
                      <select
                        value={coverLetterForm.repaymentSource}
                        onChange={(event) =>
                          setCoverLetterForm((previous) => ({
                            ...previous,
                            repaymentSource: event.target.value,
                            repaymentSourceOther: event.target.value === COVER_LETTER_OTHER_VALUE ? previous.repaymentSourceOther : '',
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select an option</option>
                        {REPAYMENT_SOURCE_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      {coverLetterForm.repaymentSource === COVER_LETTER_OTHER_VALUE ? (
                        <input
                          type="text"
                          value={coverLetterForm.repaymentSourceOther}
                          onChange={(event) =>
                            setCoverLetterForm((previous) => ({
                              ...previous,
                              repaymentSourceOther: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Please describe"
                        />
                      ) : null}
                      {showCoverLetterValidation && (coverLetterFieldErrors.repaymentSource || coverLetterFieldErrors.repaymentSourceOther) ? (
                        <p className="text-xs font-medium text-rose-600">
                          {coverLetterFieldErrors.repaymentSource ?? coverLetterFieldErrors.repaymentSourceOther}
                        </p>
                      ) : null}
                    </label>

                    <div className="space-y-1.5 text-sm">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-700">How does your business currently make money? *</p>
                        <p className="text-xs text-slate-500">Choose up to 5.</p>
                      </div>
                      <MultiSelectChips
                        options={REVENUE_STREAM_OPTIONS}
                        values={coverLetterForm.revenueStreams}
                        maxSelections={5}
                        onToggle={(option) =>
                          setCoverLetterForm((previous) => {
                            const nextValues = toggleSelection(previous.revenueStreams, option, 5);
                            return {
                              ...previous,
                              revenueStreams: nextValues,
                              revenueStreamsOther: nextValues.includes(COVER_LETTER_OTHER_VALUE)
                                ? previous.revenueStreamsOther
                                : '',
                            };
                          })
                        }
                      />
                      {includesOtherValue(coverLetterForm.revenueStreams) ? (
                        <input
                          type="text"
                          value={coverLetterForm.revenueStreamsOther}
                          onChange={(event) =>
                            setCoverLetterForm((previous) => ({
                              ...previous,
                              revenueStreamsOther: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Please describe"
                        />
                      ) : null}
                      {showCoverLetterValidation && (coverLetterFieldErrors.revenueStreams || coverLetterFieldErrors.revenueStreamsOther) ? (
                        <p className="text-xs font-medium text-rose-600">
                          {coverLetterFieldErrors.revenueStreams ?? coverLetterFieldErrors.revenueStreamsOther}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-1.5 text-sm">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-700">How will this financing help your business? *</p>
                        <p className="text-xs text-slate-500">Choose up to 3.</p>
                      </div>
                      <MultiSelectChips
                        options={FINANCING_IMPACT_OPTIONS}
                        values={coverLetterForm.financingImpact}
                        maxSelections={3}
                        onToggle={(option) =>
                          setCoverLetterForm((previous) => {
                            const nextValues = toggleSelection(previous.financingImpact, option, 3);
                            return {
                              ...previous,
                              financingImpact: nextValues,
                              financingImpactOther: nextValues.includes(COVER_LETTER_OTHER_VALUE)
                                ? previous.financingImpactOther
                                : '',
                            };
                          })
                        }
                      />
                      {includesOtherValue(coverLetterForm.financingImpact) ? (
                        <input
                          type="text"
                          value={coverLetterForm.financingImpactOther}
                          onChange={(event) =>
                            setCoverLetterForm((previous) => ({
                              ...previous,
                              financingImpactOther: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Please describe"
                        />
                      ) : null}
                      {showCoverLetterValidation && (coverLetterFieldErrors.financingImpact || coverLetterFieldErrors.financingImpactOther) ? (
                        <p className="text-xs font-medium text-rose-600">
                          {coverLetterFieldErrors.financingImpact ?? coverLetterFieldErrors.financingImpactOther}
                        </p>
                      ) : null}
                    </div>

                    <label className="block space-y-1.5 text-sm">
                      <span className="font-semibold text-slate-700">Anything else about how your business will repay this loan?</span>
                      <span className="text-xs text-slate-500">
                        Optional. Add a short note if there is important context not captured above.
                      </span>
                      <textarea
                        value={coverLetterForm.repaymentNotes}
                        onChange={(event) =>
                          setCoverLetterForm((previous) => ({
                            ...previous,
                            repaymentNotes: event.target.value,
                          }))
                        }
                        className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional: add repayment context such as seasonal cash flow, new contracts starting soon, recent growth, or refinance details."
                      />
                    </label>
                  </div>
                ) : null}

                {activeCoverLetterTab === 'review' ? (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                      <p className="text-sm font-semibold text-slate-900">Generate from everything you entered above</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        The draft uses your Loan Profile details together with every answer from Business Overview, Use of Funds, and Repayment.
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {COVER_LETTER_TABS.filter((tab) => tab.id !== 'review').map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => goToCoverLetterTab(tab.id)}
                          className={`rounded-xl border px-4 py-3 text-left transition ${
                            coverLetterTabCompleted[tab.id]
                              ? 'border-emerald-200 bg-emerald-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{tab.label}</p>
                          <p className={`mt-2 text-sm font-semibold ${
                            coverLetterTabCompleted[tab.id] ? 'text-emerald-900' : 'text-slate-900'
                          }`}>
                            {coverLetterTabCompleted[tab.id] ? 'Ready' : 'Needs attention'}
                          </p>
                        </button>
                      ))}
                    </div>

                    <label className="block space-y-1.5 text-sm">
                      <span className="font-semibold text-slate-700">Is there anything else a lender should know that strengthens your request?</span>
                      <span className="text-xs text-slate-500">
                        Optional. Include major contracts, recent growth, owner investment, certifications, or anything else worth mentioning.
                      </span>
                      <textarea
                        value={coverLetterForm.additionalLenderNotes}
                        onChange={(event) => setCoverLetterForm((previous) => ({ ...previous, additionalLenderNotes: event.target.value }))}
                        className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional lender notes"
                      />
                    </label>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleGenerateCoverLetter}
                        disabled={generatingCoverLetter || !loanProfileComplete}
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
                        className="min-h-[320px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-medium text-sm leading-6 text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        placeholder="Generate the cover letter to review and refine it here before approval."
                      />
                    </label>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    {activeCoverLetterTab === 'review'
                      ? 'Review the completion cards, add final notes if needed, and generate the lender-facing draft here.'
                      : 'You can move section by section. Every tab saves into the same cover letter draft workflow.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {previousCoverLetterTab ? (
                      <button
                        type="button"
                        onClick={() => goToCoverLetterTab(previousCoverLetterTab.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                      </button>
                    ) : null}

                    {nextCoverLetterTab ? (
                      <button
                        type="button"
                        onClick={() => goToCoverLetterTab(nextCoverLetterTab.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        {nextCoverLetterTab.id === 'review' ? 'Go to Review' : 'Next Section'}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
                </div>
              ) : null}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
              {renderWorkflowSectionHeader(
                'package',
                4,
                isLoanBrokeringRequest ? 'Broker Review & Lender Outreach' : 'Download & Share Loan Package',
                isLoanBrokeringRequest
                  ? 'Once your profile, documents, and cover letter are complete, we review the package, send lender feelers, and connect you with interested lending partners.'
                  : 'Download your completed loan package, create secure lender links, and understand what usually happens after lenders receive the file.',
                packageComplete,
                isLoanBrokeringRequest
                  ? 'After completion, we review the request, contact lending partners, and share the full package when a lender shows interest.'
                  : latestPackageDownloadUrl
                    ? `Latest package available${dashboard?.loanRequest?.package_zip_generated_at ? ` · ${formatDate(dashboard.loanRequest.package_zip_generated_at)}` : ''}`
                    : 'Build and download your completed loan package',
              )}

              {expandedWorkflowSections.package ? (
                <div className="space-y-6 border-t border-slate-100 p-6">
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

              {isLoanBrokeringRequest ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-950">
                    Once everything is complete, your next step is handled through broker outreach instead of downloading the full package. We review the file, send a concise lender summary to potential partners, and only share the complete package with lenders who show interest.
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">1. Review</p>
                      <h3 className={`${headingClassName} mt-1 text-base`}>We check the package</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">We look for obvious gaps, make sure the request is understandable, and prepare the lender-facing story.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">2. Outreach</p>
                      <h3 className={`${headingClassName} mt-1 text-base`}>We send lender feelers</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">We share the high-level deal summary with lending partners to see who may be interested in the request.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">3. Connect</p>
                      <h3 className={`${headingClassName} mt-1 text-base`}>Interested lenders review</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">If a lender is interested, we share the complete package and help connect you for underwriting, closing, and funding.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
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

                  <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-[radial-gradient(circle_at_top_left,_rgba(219,234,254,0.95)_0%,_rgba(255,255,255,0.98)_46%,_rgba(240,253,250,0.9)_100%)] shadow-sm">
                    <div className="border-b border-blue-100 px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">What happens next</p>
                      <h3 className={`${headingClassName} mt-1 text-xl text-slate-950`}>A simple path from package to funding</h3>
                      <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                        Start with a polished lender summary, identify lenders who fit the deal, then share the full package only when there is real interest.
                      </p>
                    </div>

                    <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
                      <div className="relative rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                          <FileCheck2 className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">1. Ready</p>
                        <h4 className={`${headingClassName} mt-1 text-base text-slate-950`}>Download your package</h4>
                        <p className="mt-1 text-sm leading-6 text-slate-600">Your profile, documents, and cover letter are organized. Download the ZIP so it is ready when a lender asks.</p>
                      </div>

                      <div className="relative rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
                        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                          <Send className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo-700">2. Introduce</p>
                        <h4 className={`${headingClassName} mt-1 text-base text-slate-950`}>Send the cover letter first</h4>
                        <p className="mt-1 text-sm leading-6 text-slate-600">Use the cover letter as the short deal summary so lenders can quickly understand the request before reviewing documents.</p>
                      </div>

                      <div className="relative rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                          <Search className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-700">3. Find fit</p>
                        <h4 className={`${headingClassName} mt-1 text-base text-slate-950`}>Connect with lenders</h4>
                        <p className="mt-1 text-sm leading-6 text-slate-600">Look for lenders in your area or industry who fund your loan type, amount, business profile, and use of funds.</p>
                      </div>

                      <div className="relative rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                          <Handshake className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-700">4. Share</p>
                        <h4 className={`${headingClassName} mt-1 text-base text-slate-950`}>Send the full file when asked</h4>
                        <p className="mt-1 text-sm leading-6 text-slate-600">When a lender is interested, share the ZIP or secure lender link so they can review the backup documents.</p>
                      </div>

                      <div className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">5. Close</p>
                        <h4 className={`${headingClassName} mt-1 text-base text-slate-950`}>Terms, underwriting, funding</h4>
                        <p className="mt-1 text-sm leading-6 text-slate-600">The lender may ask questions, request updates, issue terms, verify the file, prepare closing documents, and then fund the loan.</p>
                      </div>
                    </div>

                    <div className="border-t border-blue-100 bg-white/70 px-5 py-4">
                      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className={`${headingClassName} text-base text-slate-950`}>Questions about what to do next?</h4>
                          <p className="mt-1 leading-6">If you have any questions at all, feel free to reach out and we can help you think through the next step.</p>
                        </div>
                        <a
                          href="tel:210-370-7402"
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                          <Phone className="h-4 w-4" />
                          210-370-7402
                        </a>
                      </div>
                    </div>
                  </div>

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
                </>
              )}
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </section>

      <Dialog
        open={Boolean(packageExclusionDialog)}
        onOpenChange={(open) => {
          if (!open && !updatingPackageExclusionKey) {
            setPackageExclusionDialog(null);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl border border-slate-200 bg-white p-0 text-slate-900">
          <div className="px-6 py-5">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className={`${headingClassName} text-xl`}>
                {packageExclusionDialog?.nextExcludedFromPackage ? 'Skip this document?' : 'Mark this document as needed again?'}
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-slate-600">
                {packageExclusionDialog?.nextExcludedFromPackage
                  ? 'You can move forward without this document for now, but lenders may still ask for it before reviewing or approving your loan. This will count toward your checklist progress so you can continue building the package.'
                  : 'This will put the document back into your checklist as an item that still needs to be uploaded or completed.'}
              </DialogDescription>
            </DialogHeader>

            {packageExclusionDialog ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                {packageExclusionDialog.displayName}
              </div>
            ) : null}

            <DialogFooter className="mt-5 gap-2 sm:justify-end sm:space-x-0">
              <button
                type="button"
                onClick={() => setPackageExclusionDialog(null)}
                disabled={Boolean(updatingPackageExclusionKey)}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {packageExclusionDialog?.nextExcludedFromPackage ? 'Do Not Skip' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => void handlePackageExclusionUpdate()}
                disabled={Boolean(updatingPackageExclusionKey)}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  packageExclusionDialog?.nextExcludedFromPackage
                    ? 'bg-slate-900 hover:bg-slate-800'
                    : 'bg-blue-700 hover:bg-blue-600'
                }`}
              >
                {updatingPackageExclusionKey ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {packageExclusionDialog?.nextExcludedFromPackage ? 'Yes, Skip Document' : 'Mark as Needed'}
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {dashboardLoading ? (
        <div className="fixed bottom-6 right-6 rounded-full bg-slate-900 text-white px-4 py-2 shadow-lg flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Syncing dashboard...
        </div>
      ) : null}
    </div>
  );
}
