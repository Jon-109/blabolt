'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Italianno } from 'next/font/google';
import { supabase } from '@/supabase/helpers/client';
import type { PersonalFinancialStatementData } from '@/lib/templates/types';
import { PersonalFinancialStatementSchema } from '@/lib/templates/validate';
import { getPersonalFinancialStatementProgress } from '@/lib/templates/personal-financial-statement-progress';
import { Input } from '@/app/(components)/ui/input';
import CurrencyInput from '@/app/(components)/templates/shared/CurrencyInput';
import FormField from '@/app/(components)/templates/shared/FormField';
import PdfGenerationOverlay from '@/app/(components)/templates/shared/PdfGenerationOverlay';
import TemplateHeroProgressBar from '@/app/(components)/templates/shared/TemplateHeroProgressBar';
import TemplatePageShell from '@/app/(components)/templates/shared/TemplatePageShell';
import SBAForm413SvgTemplate from '@/app/(components)/templates/SBAForm413SvgTemplate';
import { checkUserTemplateAccess } from '@/lib/templates/access';
import { getTemplateSharedProfile, upsertTemplateSharedProfile } from '@/lib/templates/profile';
import { Trash2 } from 'lucide-react';

type RowWithId = { id: string };
type RealEstateRow = RowWithId & NonNullable<PersonalFinancialStatementData['realEstateOwned']>[number];
type StockRow = RowWithId & NonNullable<PersonalFinancialStatementData['stocksAndBonds']>[number];
type RetirementAccountRow = RowWithId & NonNullable<PersonalFinancialStatementData['retirementAccounts']>[number];
type VehicleRow = RowWithId & NonNullable<PersonalFinancialStatementData['vehiclesOwned']>[number];
type ReceivableRow = RowWithId & NonNullable<PersonalFinancialStatementData['accountsAndNotesReceivable']>[number];
type InsuranceRow = RowWithId & NonNullable<PersonalFinancialStatementData['lifeInsuranceHeld']>[number];
type PersonalLoanEntry = NonNullable<NonNullable<PersonalFinancialStatementData['liabilityDetails']>['personalLoans']>[number];
type LiabilityPersonalLoanRow = RowWithId & PersonalLoanEntry;
type LiabilityTaxRow = RowWithId & NonNullable<NonNullable<PersonalFinancialStatementData['liabilityDetails']>['taxesOwed']>[number];
type LiabilityOtherRow = RowWithId & NonNullable<NonNullable<PersonalFinancialStatementData['liabilityDetails']>['otherObligations']>[number];
type SearchResult = { symbol: string; description: string; exchange: string };

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const signatureFont = Italianno({ subsets: ['latin'], weight: '400', display: 'swap' });
const signatureFontFamily = `"Snell Roundhand", "Apple Chancery", ${signatureFont.style.fontFamily}, "Segoe Script", "Brush Script MT", cursive`;
const SHORT_COUNT_OPTIONS = [0, 1, 2, 3, 4, 5, 6] as const;
const USD_PLACEHOLDER = 'Enter 0 if None';
const PERSONAL_LOAN_TYPE_OPTIONS = [
  { value: 'personal_loan', label: 'Personal loan' },
  { value: 'line_of_credit', label: 'Line of credit' },
  { value: 'heloc', label: 'HELOC' },
  { value: 'business_loan_pg', label: 'Business loan personally guaranteed' },
  { value: 'private_individual_loan', label: 'Private loan from individual' },
] as const;
const COLLATERAL_TYPE_OPTIONS = [
  { value: 'real_estate', label: 'Real estate' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'investment_account', label: 'Investment account / securities' },
  { value: 'business_assets', label: 'Business assets' },
  { value: 'personal_property', label: 'Personal property' },
  { value: 'other', label: 'Other' },
] as const;
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
] as const;

function hasTextValue(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasNumberValue(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

function resolveProgressGate(
  explicitValue: 'yes' | 'no' | undefined,
  rows: unknown[] | undefined,
): 'yes' | 'no' | undefined {
  if (explicitValue) return explicitValue;
  if (Array.isArray(rows) && rows.length > 0) return 'yes';
  return undefined;
}

function ensureRowIds<T extends Record<string, unknown>>(rows: T[] | undefined): T[] {
  return (rows || []).map((row) => {
    const existingId = typeof (row as Partial<RowWithId>).id === 'string' ? (row as Partial<RowWithId>).id?.trim() : '';
    return {
      ...row,
      id: existingId || uid(),
    } as T;
  });
}

function getPersonalLoanTypeLabel(value?: PersonalLoanEntry['loanType']): string {
  switch (value) {
    case 'personal_loan':
      return 'Personal loan';
    case 'line_of_credit':
      return 'Line of credit';
    case 'heloc':
      return 'HELOC';
    case 'business_loan_pg':
      return 'Business loan personally guaranteed';
    case 'private_individual_loan':
      return 'Private loan from individual';
    default:
      return 'Loan';
  }
}

function getPersonalLoanOriginalBalanceLabel(value?: PersonalLoanEntry['loanType']): string {
  switch (value) {
    case 'line_of_credit':
    case 'heloc':
      return 'Credit limit';
    case 'business_loan_pg':
      return 'Original loan amount';
    case 'private_individual_loan':
      return 'Original amount borrowed';
    case 'personal_loan':
    default:
      return 'Original balance';
  }
}

function getCollateralTypeLabel(value?: PersonalLoanEntry['collateralType']): string {
  switch (value) {
    case 'real_estate':
      return 'real estate';
    case 'vehicle':
      return 'vehicle';
    case 'investment_account':
      return 'investment account';
    case 'business_assets':
      return 'business assets';
    case 'personal_property':
      return 'personal property';
    case 'other':
      return 'other collateral';
    default:
      return 'collateral';
  }
}

function getPersonalLoanSecuredQuestion(value?: PersonalLoanEntry['loanType']): string {
  switch (value) {
    case 'business_loan_pg':
      return 'Is this business loan also backed by business assets or other collateral?';
    case 'heloc':
      return 'This HELOC is typically secured by real estate.';
    default:
      return 'Is this loan backed by collateral?';
  }
}

function getPersonalLoanSecuredHelp(value?: PersonalLoanEntry['loanType']): string | undefined {
  switch (value) {
    case 'business_loan_pg':
      return 'Choose Yes if business assets or another asset secure the loan in addition to your personal guarantee.';
    case 'heloc':
      return 'We will treat this as secured by residential real estate in the SBA form.';
    default:
      return 'Collateral means an asset pledged to secure the loan, like a vehicle, property, or investment account.';
  }
}

function buildPersonalLoanHowSecuredOrEndorsed(row: PersonalLoanEntry): string {
  const collateralDescription = row.collateralDescription?.trim();
  const collateralTypeLabel = getCollateralTypeLabel(row.collateralType);

  if (row.loanType === 'business_loan_pg') {
    if (row.isSecured === 'yes') {
      return `Personally guaranteed, secured by ${collateralDescription || collateralTypeLabel}`;
    }
    return 'Personally guaranteed business loan';
  }

  if (row.loanType === 'heloc') {
    return `Secured by ${collateralDescription || 'residential real estate'}`;
  }

  if (row.isSecured === 'yes') {
    return `Secured by ${collateralDescription || collateralTypeLabel}`;
  }

  switch (row.loanType) {
    case 'line_of_credit':
      return 'Unsecured line of credit';
    case 'private_individual_loan':
      return 'Unsecured private loan';
    case 'personal_loan':
    default:
      return 'Unsecured personal loan';
  }
}

function YesNoToggle({
  value,
  onChange,
}: {
  value?: 'yes' | 'no';
  onChange: (value: 'yes' | 'no') => void;
}) {
  return (
    <div className="grid max-w-xs grid-cols-2 gap-2">
      {[
        { value: 'yes' as const, label: 'Yes' },
        { value: 'no' as const, label: 'No' },
      ].map((option) => {
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isSelected}
            className={`h-10 rounded-lg border px-3 text-sm font-semibold transition ${
              isSelected
                ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

const DEFAULT_FORM: PersonalFinancialStatementData = {
  asOfDate: new Date().toISOString().split('T')[0] as string,
  progressState: {
    hasAccountsAndNotesReceivable: undefined,
    hasRetirementAccounts: undefined,
    hasLifeInsuranceCashValue: undefined,
    hasStocksAndBonds: undefined,
  },
  personalInfo: {
    name: '',
    address: '',
    homeStreet: '',
    homeCity: '',
    homeState: '',
    homeZip: '',
    phone: '',
    email: '',
  },
  coApplicant: { name: '', address: '' },
  businessInfo: {
    applicantBusinessName: '',
    businessType: undefined,
    applicantBusinessPhone: '',
    businessAddressDifferentFromHome: true,
    businessStreet: '',
    businessCity: '',
    businessState: '',
    businessZip: '',
  },
  declarations: {
    isMarried: undefined,
    isUsCitizen: undefined,
    hasContingentLiability: undefined,
    contingencyNotes: '',
    hasLawsuitOrJudgment: undefined,
    lawsuitNotes: '',
    hasTaxDelinquency: undefined,
    taxNotes: '',
    hasGuarantees: undefined,
    guaranteesNotes: '',
  },
  assets: {
    cashChecking: undefined,
    cashSavings: undefined,
    accountsNotesReceivable: undefined,
    lifeInsuranceCashSurrender: undefined,
    stocksBonds: undefined,
    realEstate: undefined,
    automobiles: undefined,
    personalProperty: undefined,
    otherAssets: undefined,
  },
  liabilities: {
    creditCards: undefined,
    mortgages: undefined,
    autoLoans: undefined,
    studentLoans: undefined,
    otherDebts: undefined,
  },
  liabilityDetails: {
    creditCards: { hasBalances: undefined, totalBalance: undefined, totalMonthlyPayment: undefined },
    medicalBills: { hasDebts: undefined, totalBalance: undefined },
    studentLoans: { hasLoans: undefined, totalBalance: undefined, totalMonthlyPayment: undefined },
    hasPersonalLoans: undefined,
    personalLoans: [],
    hasTaxesOwed: undefined,
    taxesOwed: [],
    hasOtherObligations: undefined,
    otherObligations: [],
  },
  contingentLiabilities: {
    asEndorserOrCoMaker: { hasExposure: undefined, estimatedAmount: undefined },
    legalClaimsAndJudgments: { hasExposure: undefined, estimatedAmount: undefined },
    provisionForFederalIncomeTax: { hasExposure: undefined, estimatedAmount: undefined },
    otherSpecialDebt: { hasExposure: undefined, estimatedAmount: undefined },
  },
  incomeDetails: {
    employmentIncome: { hasIncome: undefined, averageGrossMonthlyIncome: undefined },
    rentalIncome: { hasIncome: undefined, averageNetMonthlyIncome: undefined },
    investmentIncome: { hasIncome: undefined, averageNetMonthlyIncome: undefined },
    otherIncome: { hasIncome: undefined, averageMonthlyIncome: undefined, description: '', sources: [] },
  },
  annualIncome: {
    salary: undefined,
    netInvestmentIncome: undefined,
    realEstateIncome: undefined,
    otherIncome: undefined,
    incomeContingencies: '',
  },
  realEstateOwned: [],
  stocksAndBonds: [],
  otherPersonalPropertyAndOtherAssets: [],
  retirementAccounts: [],
  vehiclesOwned: [],
  accountsAndNotesReceivable: [],
  notesPayableToBanksAndOthers: [],
  lifeInsuranceHeld: [],
  sba413Page3Entries: [],
  eSignature: {
    fullName: '',
    signedAt: '',
    attested: false,
  },
  notes: '',
};

const STEPS = [
  'Basics',
  'What You Own',
  'What You Owe',
  'Personal Income',
  'Review & Generate',
] as const;

const stripEmptyRealEstateRows = (
  rows: PersonalFinancialStatementData['realEstateOwned'] | undefined,
): PersonalFinancialStatementData['realEstateOwned'] => {
  if (!rows || rows.length === 0) return [];
  return rows.filter((row) => {
    const hasText =
      Boolean(row.propertyType) ||
      Boolean(row.propertyAddress?.trim()) ||
      Boolean(row.datePurchased) ||
      Boolean(row.mortgageHolderName?.trim()) ||
      Boolean(row.mortgageHolderAddress?.trim()) ||
      Boolean(row.mortgageAccountNumber?.trim()) ||
      Boolean(row.status);
    const hasNumbers =
      row.originalCost != null ||
      row.presentMarketValue != null ||
      row.mortgageBalance != null ||
      row.amountOfPaymentPerMonth != null;
    return hasText || hasNumbers;
  });
};

const createEmptyReceivableRow = (): Omit<ReceivableRow, 'id'> => ({
  debtorName: '',
  originalAmountLoaned: undefined,
  currentBalanceOwed: undefined,
  monthlyPaymentReceived: undefined,
  hasWrittenAgreement: undefined,
  isSecuredByCollateral: undefined,
  collateralDescription: '',
});

const createEmptyRetirementAccountRow = (): Omit<RetirementAccountRow, 'id'> => ({
  accountType: undefined,
  institutionName: '',
  currentEstimatedValue: undefined,
  pledgedAsCollateral: undefined,
  lenderName: '',
  lienAmount: undefined,
  monthlyPayment: undefined,
});

const createEmptyInsuranceRow = (): Omit<InsuranceRow, 'id'> => ({
  companyName: '',
  policyType: undefined,
  faceAmount: undefined,
  cashSurrenderValue: undefined,
  beneficiaries: '',
  pledgedAsCollateral: undefined,
  lenderName: '',
  loanAgainstPolicy: undefined,
});

function hydrateSavedPfsForm(saved: PersonalFinancialStatementData): PersonalFinancialStatementData {
  const merged = {
    ...DEFAULT_FORM,
    ...saved,
    progressState: {
      ...DEFAULT_FORM.progressState,
      ...(saved.progressState || {}),
    },
    personalInfo: {
      ...DEFAULT_FORM.personalInfo,
      ...(saved.personalInfo || {}),
    },
    coApplicant: {
      ...DEFAULT_FORM.coApplicant,
      ...(saved.coApplicant || {}),
    },
    businessInfo: {
      ...DEFAULT_FORM.businessInfo,
      ...(saved.businessInfo || {}),
    },
    declarations: {
      ...DEFAULT_FORM.declarations,
      ...(saved.declarations || {}),
    },
    assets: {
      ...DEFAULT_FORM.assets,
      ...(saved.assets || {}),
    },
    liabilities: {
      ...DEFAULT_FORM.liabilities,
      ...(saved.liabilities || {}),
    },
    liabilityDetails: {
      ...DEFAULT_FORM.liabilityDetails,
      ...(saved.liabilityDetails || {}),
      creditCards: {
        ...DEFAULT_FORM.liabilityDetails?.creditCards,
        ...(saved.liabilityDetails?.creditCards || {}),
      },
      medicalBills: {
        ...DEFAULT_FORM.liabilityDetails?.medicalBills,
        ...(saved.liabilityDetails?.medicalBills || {}),
      },
      studentLoans: {
        ...DEFAULT_FORM.liabilityDetails?.studentLoans,
        ...(saved.liabilityDetails?.studentLoans || {}),
      },
      personalLoans: ensureRowIds(saved.liabilityDetails?.personalLoans),
      taxesOwed: ensureRowIds(saved.liabilityDetails?.taxesOwed),
      otherObligations: ensureRowIds(saved.liabilityDetails?.otherObligations),
    },
    contingentLiabilities: {
      ...DEFAULT_FORM.contingentLiabilities,
      ...(saved.contingentLiabilities || {}),
      asEndorserOrCoMaker: {
        ...DEFAULT_FORM.contingentLiabilities?.asEndorserOrCoMaker,
        ...(saved.contingentLiabilities?.asEndorserOrCoMaker || {}),
      },
      legalClaimsAndJudgments: {
        ...DEFAULT_FORM.contingentLiabilities?.legalClaimsAndJudgments,
        ...(saved.contingentLiabilities?.legalClaimsAndJudgments || {}),
      },
      provisionForFederalIncomeTax: {
        ...DEFAULT_FORM.contingentLiabilities?.provisionForFederalIncomeTax,
        ...(saved.contingentLiabilities?.provisionForFederalIncomeTax || {}),
      },
      otherSpecialDebt: {
        ...DEFAULT_FORM.contingentLiabilities?.otherSpecialDebt,
        ...(saved.contingentLiabilities?.otherSpecialDebt || {}),
      },
    },
    incomeDetails: {
      ...DEFAULT_FORM.incomeDetails,
      ...(saved.incomeDetails || {}),
      employmentIncome: {
        ...DEFAULT_FORM.incomeDetails?.employmentIncome,
        ...(saved.incomeDetails?.employmentIncome || {}),
      },
      rentalIncome: {
        ...DEFAULT_FORM.incomeDetails?.rentalIncome,
        ...(saved.incomeDetails?.rentalIncome || {}),
      },
      investmentIncome: {
        ...DEFAULT_FORM.incomeDetails?.investmentIncome,
        ...(saved.incomeDetails?.investmentIncome || {}),
      },
      otherIncome: {
        ...DEFAULT_FORM.incomeDetails?.otherIncome,
        ...(saved.incomeDetails?.otherIncome || {}),
        sources: saved.incomeDetails?.otherIncome?.sources || DEFAULT_FORM.incomeDetails?.otherIncome?.sources || [],
      },
    },
    annualIncome: {
      ...DEFAULT_FORM.annualIncome,
      ...(saved.annualIncome || {}),
    },
    realEstateOwned: ensureRowIds(stripEmptyRealEstateRows(saved.realEstateOwned)),
    stocksAndBonds: ensureRowIds(saved.stocksAndBonds),
    otherPersonalPropertyAndOtherAssets: saved.otherPersonalPropertyAndOtherAssets || DEFAULT_FORM.otherPersonalPropertyAndOtherAssets,
    retirementAccounts: ensureRowIds(saved.retirementAccounts),
    vehiclesOwned: ensureRowIds(saved.vehiclesOwned),
    accountsAndNotesReceivable: ensureRowIds(saved.accountsAndNotesReceivable),
    notesPayableToBanksAndOthers: saved.notesPayableToBanksAndOthers || DEFAULT_FORM.notesPayableToBanksAndOthers,
    lifeInsuranceHeld: ensureRowIds(saved.lifeInsuranceHeld),
    sba413Page3Entries: saved.sba413Page3Entries || DEFAULT_FORM.sba413Page3Entries,
    eSignature: {
      ...DEFAULT_FORM.eSignature,
      ...(saved.eSignature || {}),
    },
  };

  return merged as PersonalFinancialStatementData;
}

function getPfsStepCompletion(form: PersonalFinancialStatementData): boolean[] {
  const basicsComplete = [
    form.personalInfo?.name,
    form.personalInfo?.homeStreet,
    form.personalInfo?.homeCity,
    form.personalInfo?.homeState,
    form.personalInfo?.homeZip,
  ].every(hasTextValue);

  const receivableGate = resolveProgressGate(
    form.progressState?.hasAccountsAndNotesReceivable,
    form.accountsAndNotesReceivable,
  );
  const retirementGate = resolveProgressGate(
    form.progressState?.hasRetirementAccounts,
    form.retirementAccounts,
  );
  const lifeInsuranceGate = resolveProgressGate(
    form.progressState?.hasLifeInsuranceCashValue,
    form.lifeInsuranceHeld,
  );
  const stocksGate = resolveProgressGate(
    form.progressState?.hasStocksAndBonds,
    form.stocksAndBonds,
  );

  const realEstateCountChosen =
    Boolean(form.progressState?.realEstateCountChosen) || (form.realEstateOwned?.length ?? 0) > 0;
  const vehicleCountChosen =
    Boolean(form.progressState?.vehicleCountChosen) || (form.vehiclesOwned?.length ?? 0) > 0;

  const assetsComplete =
    hasNumberValue(form.assets?.cashChecking) &&
    hasNumberValue(form.assets?.cashSavings) &&
    realEstateCountChosen &&
    (form.realEstateOwned ?? []).every((row) =>
      Boolean(row.propertyType) &&
      hasTextValue(row.propertyAddress) &&
      hasNumberValue(row.presentMarketValue) &&
      hasNumberValue(row.mortgageBalance) &&
      hasNumberValue(row.amountOfPaymentPerMonth),
    ) &&
    Boolean(receivableGate) &&
    (
      receivableGate === 'no' ||
      (
        (form.accountsAndNotesReceivable?.length ?? 0) > 0 &&
        (form.accountsAndNotesReceivable ?? []).every((row) =>
          hasTextValue(row.debtorName) &&
          hasNumberValue(row.originalAmountLoaned) &&
          hasNumberValue(row.currentBalanceOwed) &&
          hasNumberValue(row.monthlyPaymentReceived) &&
          Boolean(row.hasWrittenAgreement) &&
          Boolean(row.isSecuredByCollateral) &&
          (row.isSecuredByCollateral !== 'yes' || hasTextValue(row.collateralDescription)),
        )
      )
    ) &&
    Boolean(retirementGate) &&
    (
      retirementGate === 'no' ||
      (
        (form.retirementAccounts?.length ?? 0) > 0 &&
        (form.retirementAccounts ?? []).every((row) =>
          Boolean(row.accountType) &&
          hasTextValue(row.institutionName) &&
          hasNumberValue(row.currentEstimatedValue) &&
          Boolean(row.pledgedAsCollateral) &&
          (row.pledgedAsCollateral !== 'yes' || hasNumberValue(row.lienAmount)),
        )
      )
    ) &&
    Boolean(lifeInsuranceGate) &&
    (
      lifeInsuranceGate === 'no' ||
      (
        (form.lifeInsuranceHeld?.length ?? 0) > 0 &&
        (form.lifeInsuranceHeld ?? []).every((row) =>
          hasTextValue(row.companyName) &&
          Boolean(row.policyType) &&
          hasNumberValue(row.faceAmount) &&
          hasNumberValue(row.cashSurrenderValue) &&
          Boolean(row.pledgedAsCollateral) &&
          (row.pledgedAsCollateral !== 'yes' || hasNumberValue(row.loanAgainstPolicy)),
        )
      )
    ) &&
    Boolean(stocksGate) &&
    (
      stocksGate === 'no' ||
      (
        (form.stocksAndBonds?.length ?? 0) > 0 &&
        (form.stocksAndBonds ?? []).every((row) =>
          (hasTextValue(row.issuerName) || hasTextValue(row.symbol)) &&
          hasNumberValue(row.marketValue),
        )
      )
    ) &&
    vehicleCountChosen &&
    (form.vehiclesOwned ?? []).every((row) =>
      (hasTextValue(row.make) || hasTextValue(row.model) || hasNumberValue(row.year)) &&
      hasNumberValue(row.currentEstimatedValue),
    ) &&
    hasNumberValue(form.assets?.personalProperty) &&
    hasNumberValue(form.assets?.otherAssets);

  const liabilitiesComplete =
    hasNumberValue(form.liabilityDetails?.creditCards?.totalBalance) &&
    Boolean(form.liabilityDetails?.studentLoans?.hasLoans) &&
    (
      form.liabilityDetails?.studentLoans?.hasLoans !== 'yes' ||
      (
        hasNumberValue(form.liabilityDetails.studentLoans.totalBalance) &&
        hasNumberValue(form.liabilityDetails.studentLoans.totalMonthlyPayment)
      )
    ) &&
    Boolean(form.liabilityDetails?.hasPersonalLoans) &&
    (
      form.liabilityDetails?.hasPersonalLoans !== 'yes' ||
      (
        (form.liabilityDetails?.personalLoans?.length ?? 0) > 0 &&
        (form.liabilityDetails?.personalLoans ?? []).every((row) =>
          Boolean(row.loanType) &&
          hasTextValue(row.lenderName) &&
          hasNumberValue(row.originalBalance) &&
          hasNumberValue(row.currentBalance) &&
          hasNumberValue(row.monthlyPayment) &&
          (
            row.loanType === 'heloc' ||
            Boolean(row.isSecured)
          ) &&
          (
            row.loanType === 'heloc' ||
            row.isSecured !== 'yes' ||
            Boolean(row.collateralType)
          ),
        )
      )
    ) &&
    hasNumberValue(form.liabilityDetails?.medicalBills?.totalBalance) &&
    Boolean(form.liabilityDetails?.hasTaxesOwed) &&
    (
      form.liabilityDetails?.hasTaxesOwed !== 'yes' ||
      (
        (form.liabilityDetails?.taxesOwed?.length ?? 0) > 0 &&
        (form.liabilityDetails?.taxesOwed ?? []).every((row) =>
          hasTextValue(row.authority) &&
          hasNumberValue(row.originalBalance) &&
          hasNumberValue(row.balanceOwed) &&
          hasNumberValue(row.monthlyPayment),
        )
      )
    ) &&
    Boolean(form.liabilityDetails?.hasOtherObligations) &&
    (
      form.liabilityDetails?.hasOtherObligations !== 'yes' ||
      (
        (form.liabilityDetails?.otherObligations?.length ?? 0) > 0 &&
        (form.liabilityDetails?.otherObligations ?? []).every((row) =>
          hasTextValue(row.description) &&
          hasNumberValue(row.amountOwed) &&
          hasNumberValue(row.monthlyPayment),
        )
      )
    ) &&
    [
      form.contingentLiabilities?.asEndorserOrCoMaker,
      form.contingentLiabilities?.legalClaimsAndJudgments,
      form.contingentLiabilities?.provisionForFederalIncomeTax,
      form.contingentLiabilities?.otherSpecialDebt,
    ].every((item) => Boolean(item?.hasExposure) && (item?.hasExposure !== 'yes' || hasNumberValue(item.estimatedAmount)));

  const incomeComplete =
    Boolean(form.incomeDetails?.employmentIncome?.hasIncome) &&
    (
      form.incomeDetails?.employmentIncome?.hasIncome !== 'yes' ||
      hasNumberValue(form.incomeDetails.employmentIncome.averageGrossMonthlyIncome)
    ) &&
    Boolean(form.incomeDetails?.rentalIncome?.hasIncome) &&
    (
      form.incomeDetails?.rentalIncome?.hasIncome !== 'yes' ||
      hasNumberValue(form.incomeDetails.rentalIncome.averageNetMonthlyIncome)
    ) &&
    Boolean(form.incomeDetails?.investmentIncome?.hasIncome) &&
    (
      form.incomeDetails?.investmentIncome?.hasIncome !== 'yes' ||
      hasNumberValue(form.incomeDetails.investmentIncome.averageNetMonthlyIncome)
    ) &&
    Boolean(form.incomeDetails?.otherIncome?.hasIncome) &&
    (
      form.incomeDetails?.otherIncome?.hasIncome !== 'yes' ||
      (
        hasNumberValue(form.incomeDetails.otherIncome.averageMonthlyIncome) &&
        hasTextValue(form.incomeDetails.otherIncome.description)
      )
    );

  const reviewUnlocked = basicsComplete && assetsComplete && liabilitiesComplete && incomeComplete;

  const reviewComplete =
    reviewUnlocked &&
    Boolean(form.eSignature?.attested) &&
    hasTextValue(form.eSignature?.fullName) &&
    (form.eSignature?.fullName?.trim().length ?? 0) >= 2;

  return [basicsComplete, assetsComplete, liabilitiesComplete, incomeComplete, reviewComplete];
}

export default function PersonalFinancialStatementFormPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedSubmissionId = searchParams.get('submissionId');
  const loanRequestId = searchParams.get('loanRequestId');
  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [reviewLockedMessage, setReviewLockedMessage] = useState<string | null>(null);
  const [receivablesGate, setReceivablesGate] = useState<'yes' | 'no' | undefined>(undefined);
  const [retirementGate, setRetirementGate] = useState<'yes' | 'no' | undefined>(undefined);
  const [lifeInsuranceGate, setLifeInsuranceGate] = useState<'yes' | 'no' | undefined>(undefined);
  const [stocksGate, setStocksGate] = useState<'yes' | 'no' | undefined>(undefined);
  const [stocksAutoFillEnabled, setStocksAutoFillEnabled] = useState(true);
  const [stockSearchResults, setStockSearchResults] = useState<Record<string, SearchResult[]>>({});
  const [stockSearchLoading, setStockSearchLoading] = useState<Record<string, boolean>>({});
  const [stockSearchError, setStockSearchError] = useState<Record<string, string>>({});
  const [stockQuoteByRow, setStockQuoteByRow] = useState<Record<string, { price: number; sourceName: string; exchange: string; asOfDateTime: string }>>({});
  const [stockQuoteError, setStockQuoteError] = useState<Record<string, string>>({});
  const [stockManualOverride, setStockManualOverride] = useState<Record<string, boolean>>({});
  const [firstErrorKey, setFirstErrorKey] = useState<string | null>(null);
  const [previewConfirmed, setPreviewConfirmed] = useState(false);
  const [signatureName, setSignatureName] = useState('');

  const [form, setForm] = useState<PersonalFinancialStatementData>(DEFAULT_FORM);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stockSearchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    let isActive = true;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const sessionUser = session?.user ?? null;

      if (!sessionUser) {
        router.replace(`/login?redirectTo=${encodeURIComponent(pathname)}`);
        return;
      }

      const access = await checkUserTemplateAccess(sessionUser.id, 'personal_financial_statement');
      if (!access.allowed) {
        router.replace(access.redirectUrl || '/services/templates-bundle');
        return;
      }

      if (!isActive) return;
      setUser(sessionUser);

      const profile = await getTemplateSharedProfile(sessionUser.id);

      const { data: existingSubmission } = requestedSubmissionId
        ? await supabase
            .from('template_submissions')
            .select('id,form_data,pdf_url')
            .eq('user_id', sessionUser.id)
            .eq('template_type', 'personal_financial_statement')
            .eq('id', requestedSubmissionId)
            .is('archived_at', null)
            .maybeSingle()
        : { data: null as { id: string; form_data: unknown; pdf_url: string | null } | null };

      let resolvedSubmission = existingSubmission;
      if (!resolvedSubmission) {
        const { data: latestSubmission } = await supabase
          .from('template_submissions')
          .select('id,form_data,pdf_url')
          .eq('user_id', sessionUser.id)
          .eq('template_type', 'personal_financial_statement')
          .is('archived_at', null)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        resolvedSubmission = latestSubmission;
      }

      if (resolvedSubmission) {
        setSubmissionId(resolvedSubmission.id);
        setPdfUrl(resolvedSubmission.pdf_url);
        const merged = hydrateSavedPfsForm(resolvedSubmission.form_data as PersonalFinancialStatementData);
        const mergedProgressState = merged.progressState ?? {};
        setForm({
          ...merged,
          personalInfo: {
            ...merged.personalInfo,
            name: merged.personalInfo?.name || profile.personalName || '',
          },
          businessInfo: {
            ...merged.businessInfo,
            applicantBusinessName:
              merged.businessInfo?.applicantBusinessName || profile.businessName || profile.businessLegalName || '',
          },
        });
        setReceivablesGate(
          mergedProgressState.hasAccountsAndNotesReceivable
            ?? ((merged.accountsAndNotesReceivable?.length ?? 0) > 0 ? 'yes' : undefined),
        );
        setRetirementGate(
          mergedProgressState.hasRetirementAccounts
            ?? ((merged.retirementAccounts?.length ?? 0) > 0 ? 'yes' : undefined),
        );
        setLifeInsuranceGate(
          mergedProgressState.hasLifeInsuranceCashValue
            ?? ((merged.lifeInsuranceHeld?.length ?? 0) > 0 ? 'yes' : undefined),
        );
        setStocksGate(
          mergedProgressState.hasStocksAndBonds
            ?? ((merged.stocksAndBonds?.length ?? 0) > 0 ? 'yes' : undefined),
        );
        setPreviewConfirmed(Boolean(merged.eSignature?.attested));
        setSignatureName(merged.eSignature?.fullName || '');
      } else if (profile.personalName || profile.businessName || profile.businessLegalName) {
        setForm((prev) => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            name: prev.personalInfo.name || profile.personalName || '',
          },
          businessInfo: {
            ...prev.businessInfo,
            applicantBusinessName:
              prev.businessInfo?.applicantBusinessName || profile.businessName || profile.businessLegalName || '',
          },
        }));
        setPreviewConfirmed(false);
        setSignatureName('');
      }
    };

    checkAuth().finally(() => {
      if (isActive) setIsAuthChecking(false);
    });

    return () => {
      isActive = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [pathname, requestedSubmissionId, router]);

  useEffect(() => {
    if ((form.accountsAndNotesReceivable || []).length > 0 && receivablesGate !== 'yes') {
      setReceivablesGate('yes');
    }
  }, [form.accountsAndNotesReceivable, receivablesGate]);

  useEffect(() => {
    if ((form.retirementAccounts || []).length > 0 && retirementGate !== 'yes') {
      setRetirementGate('yes');
    }
  }, [form.retirementAccounts, retirementGate]);

  useEffect(() => {
    if ((form.lifeInsuranceHeld || []).length > 0 && lifeInsuranceGate !== 'yes') {
      setLifeInsuranceGate('yes');
    }
  }, [form.lifeInsuranceHeld, lifeInsuranceGate]);

  useEffect(() => {
    if ((form.stocksAndBonds || []).length > 0 && stocksGate !== 'yes') {
      setStocksGate('yes');
    }
  }, [form.stocksAndBonds, stocksGate]);

  useEffect(() => {
    return () => {
      Object.values(stockSearchTimers.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const queueSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveDraft();
    }, 1500);
  };

  const saveDraft = async (nextForm?: PersonalFinancialStatementData): Promise<string | null> => {
    if (!user) return submissionId;
    setSaveStatus('saving');
    try {
      const normalizedForm = buildNormalizedForm(nextForm ?? form);
      if (!submissionId) {
        const { data, error } = await supabase
          .from('template_submissions')
          .insert({ user_id: user.id, template_type: 'personal_financial_statement', form_data: normalizedForm })
          .select('id,pdf_url')
          .single();
        if (error) throw error;
        if (data) {
          setSubmissionId(data.id);
          setPdfUrl(data.pdf_url);
          const params = new URLSearchParams(searchParams.toString());
          params.set('submissionId', data.id);
          router.replace(`${pathname}?${params.toString()}`);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 1200);
          return data.id;
        }
      } else {
        const { error } = await supabase
          .from('template_submissions')
          .update({ form_data: normalizedForm })
          .eq('id', submissionId)
          .eq('user_id', user.id);
        if (error) throw error;
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1200);
      return submissionId;
    } catch (error) {
      console.error('Error saving draft:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return submissionId;
    }
  };

  useEffect(() => {
    const flushPendingSave = () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }

      void saveDraft();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingSave();
      }
    };

    window.addEventListener('pagehide', flushPendingSave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', flushPendingSave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [saveDraft]);

  const validateForm = (): { valid: boolean; firstKey: string | null } => {
    const customErrors: Record<string, string> = {};
    const setError = (path: string, message: string) => {
      if (!customErrors[path]) customErrors[path] = message;
    };
    if (!form.personalInfo.name?.trim()) customErrors['personalInfo.name'] = 'Name is required';
    if (!form.personalInfo.homeStreet?.trim()) customErrors['personalInfo.homeStreet'] = 'Home street is required';
    if (!form.personalInfo.homeCity?.trim()) customErrors['personalInfo.homeCity'] = 'Home city is required';
    if (!form.personalInfo.homeState?.trim()) customErrors['personalInfo.homeState'] = 'Home state is required';
    if (!form.personalInfo.homeZip?.trim()) customErrors['personalInfo.homeZip'] = 'Home ZIP is required';

    const requiredUsdPaths = [
      'assets.cashChecking',
      'assets.cashSavings',
      'assets.personalProperty',
      'assets.otherAssets',
      'annualIncome.salary',
      'annualIncome.netInvestmentIncome',
      'annualIncome.realEstateIncome',
      'annualIncome.otherIncome',
    ];

    const normalizedForm = buildNormalizedForm(form);
    const getValue = (path: string) => {
      const keys = path.split('.');
      let current: any = normalizedForm;
      for (const key of keys) current = current?.[key];
      return current;
    };

    requiredUsdPaths.forEach((path) => {
      const value = getValue(path);
      if (value === undefined || value === null || Number.isNaN(Number(value))) {
        const message = 'Required. Enter 0 if none.';
        if (path === 'annualIncome.salary') {
          setError('incomeDetails.employmentIncome.hasIncome', 'Please select yes or no.');
          if (form.incomeDetails?.employmentIncome?.hasIncome === 'yes') {
            setError('incomeDetails.employmentIncome.averageGrossMonthlyIncome', message);
          }
          return;
        }
        if (path === 'annualIncome.netInvestmentIncome') {
          setError('incomeDetails.investmentIncome.hasIncome', 'Please select yes or no.');
          if (form.incomeDetails?.investmentIncome?.hasIncome === 'yes') {
            setError('incomeDetails.investmentIncome.averageNetMonthlyIncome', message);
          }
          return;
        }
        if (path === 'annualIncome.realEstateIncome') {
          setError('incomeDetails.rentalIncome.hasIncome', 'Please select yes or no.');
          if (form.incomeDetails?.rentalIncome?.hasIncome === 'yes') {
            setError('incomeDetails.rentalIncome.averageNetMonthlyIncome', message);
          }
          return;
        }
        if (path === 'annualIncome.otherIncome') {
          setError('incomeDetails.otherIncome.hasIncome', 'Please select yes or no.');
          if (form.incomeDetails?.otherIncome?.hasIncome === 'yes') {
            setError('incomeDetails.otherIncome.averageMonthlyIncome', message);
          }
          return;
        }
        setError(path, message);
      }
    });

    if (form.liabilityDetails?.creditCards?.totalBalance === undefined || form.liabilityDetails?.creditCards?.totalBalance === null || Number.isNaN(Number(form.liabilityDetails?.creditCards?.totalBalance))) {
      setError('liabilities.creditCards', 'Required. Enter 0 if none.');
    }

    if (form.liabilityDetails?.medicalBills?.totalBalance === undefined || form.liabilityDetails?.medicalBills?.totalBalance === null || Number.isNaN(Number(form.liabilityDetails?.medicalBills?.totalBalance))) {
      setError('liabilityDetails.medicalBills.totalBalance', 'Required. Enter 0 if none.');
    }

    if (!form.liabilityDetails?.studentLoans?.hasLoans) {
      setError('liabilityDetails.studentLoans.hasLoans', 'Please select yes or no.');
    }
    if (form.liabilityDetails?.studentLoans?.hasLoans === 'yes') {
      if (form.liabilityDetails?.studentLoans?.totalBalance === undefined || form.liabilityDetails?.studentLoans?.totalBalance === null || Number.isNaN(Number(form.liabilityDetails?.studentLoans?.totalBalance))) {
        setError('liabilities.studentLoans', 'Required. Enter 0 if none.');
      }
      if (form.liabilityDetails?.studentLoans?.totalMonthlyPayment === undefined || form.liabilityDetails?.studentLoans?.totalMonthlyPayment === null || Number.isNaN(Number(form.liabilityDetails?.studentLoans?.totalMonthlyPayment))) {
        setError('liabilityDetails.studentLoans.totalMonthlyPayment', 'Required. Enter 0 if none.');
      }
    }

    realEstateRows.forEach((_, i) => {
      (['presentMarketValue', 'mortgageBalance', 'amountOfPaymentPerMonth'] as const).forEach((field) => {
        const value = form.realEstateOwned?.[i]?.[field];
        if (value === undefined || value === null || Number.isNaN(Number(value))) {
          customErrors[`realEstateOwned.${i}.${field}`] = 'Required. Enter 0 if none.';
        }
      });
      if (!form.realEstateOwned?.[i]?.propertyType) {
        customErrors[`realEstateOwned.${i}.propertyType`] = 'Property type is required.';
      }
      if (!form.realEstateOwned?.[i]?.propertyAddress?.trim()) {
        customErrors[`realEstateOwned.${i}.propertyAddress`] = 'Property address is required.';
      }
    });
    stockRows.forEach((_, i) => {
      const value = form.stocksAndBonds?.[i]?.marketValue;
      if (value === undefined || value === null || Number.isNaN(Number(value))) {
        customErrors[`stocksAndBonds.${i}.marketValue`] = 'Required. Enter 0 if none.';
      }
    });
    retirementRows.forEach((_, i) => {
      const value = form.retirementAccounts?.[i]?.currentEstimatedValue;
      if (value === undefined || value === null || Number.isNaN(Number(value))) {
        customErrors[`retirementAccounts.${i}.currentEstimatedValue`] = 'Required. Enter 0 if none.';
      }
      if (form.retirementAccounts?.[i]?.pledgedAsCollateral === 'yes') {
        const lienAmount = form.retirementAccounts?.[i]?.lienAmount;
        if (lienAmount === undefined || lienAmount === null || Number.isNaN(Number(lienAmount))) {
          customErrors[`retirementAccounts.${i}.lienAmount`] = 'Required. Enter 0 if none.';
        }
      }
    });
    vehicleRows.forEach((_, i) => {
      const value = form.vehiclesOwned?.[i]?.currentEstimatedValue;
      if (value === undefined || value === null || Number.isNaN(Number(value))) {
        customErrors[`vehiclesOwned.${i}.currentEstimatedValue`] = 'Required. Enter 0 if none.';
      }
    });
    receivableRows.forEach((_, i) => {
      (['originalAmountLoaned', 'currentBalanceOwed', 'monthlyPaymentReceived'] as const).forEach((field) => {
        const value = form.accountsAndNotesReceivable?.[i]?.[field];
        if (value === undefined || value === null || Number.isNaN(Number(value))) {
          customErrors[`accountsAndNotesReceivable.${i}.${field}`] = 'Required. Enter 0 if none.';
        }
      });
    });
    insuranceRows.forEach((_, i) => {
      (['faceAmount', 'cashSurrenderValue'] as const).forEach((field) => {
        const value = form.lifeInsuranceHeld?.[i]?.[field];
        if (value === undefined || value === null || Number.isNaN(Number(value))) {
          customErrors[`lifeInsuranceHeld.${i}.${field}`] = 'Required. Enter 0 if none.';
        }
      });
      if (!form.lifeInsuranceHeld?.[i]?.companyName?.trim()) {
        customErrors[`lifeInsuranceHeld.${i}.companyName`] = 'Insurance company name is required.';
      }
      if (!form.lifeInsuranceHeld?.[i]?.policyType) {
        customErrors[`lifeInsuranceHeld.${i}.policyType`] = 'Policy type is required.';
      }
      if (!form.lifeInsuranceHeld?.[i]?.pledgedAsCollateral) {
        customErrors[`lifeInsuranceHeld.${i}.pledgedAsCollateral`] = 'Please select yes or no.';
      }
      if (form.lifeInsuranceHeld?.[i]?.pledgedAsCollateral === 'yes') {
        const loanAmount = form.lifeInsuranceHeld?.[i]?.loanAgainstPolicy;
        if (loanAmount === undefined || loanAmount === null || Number.isNaN(Number(loanAmount))) {
          customErrors[`lifeInsuranceHeld.${i}.loanAgainstPolicy`] = 'Required. Enter 0 if none.';
        }
      }
    });
    personalLoanRows.forEach((_, i) => {
      const row = form.liabilityDetails?.personalLoans?.[i];
      if (!row?.loanType) {
        customErrors[`liabilityDetails.personalLoans.${i}.loanType`] = 'Loan type is required.';
      }
      if (!row?.lenderName?.trim()) {
        customErrors[`liabilityDetails.personalLoans.${i}.lenderName`] = 'Lender name is required.';
      }
      (['originalBalance', 'currentBalance', 'monthlyPayment'] as const).forEach((field) => {
        const value = row?.[field];
        if (value === undefined || value === null || Number.isNaN(Number(value))) {
          customErrors[`liabilityDetails.personalLoans.${i}.${field}`] = 'Required. Enter 0 if none.';
        }
      });
      if (row?.loanType !== 'heloc' && !row?.isSecured) {
        customErrors[`liabilityDetails.personalLoans.${i}.isSecured`] = 'Please select yes or no.';
      }
      if ((row?.loanType === 'heloc' || row?.isSecured === 'yes') && !row?.collateralType) {
        customErrors[`liabilityDetails.personalLoans.${i}.collateralType`] = 'Collateral type is required.';
      }
    });
    taxRows.forEach((_, i) => {
      const row = form.liabilityDetails?.taxesOwed?.[i];
      if (!row?.authority?.trim()) {
        customErrors[`liabilityDetails.taxesOwed.${i}.authority`] = 'Authority is required.';
      }
      (['originalBalance', 'balanceOwed', 'monthlyPayment'] as const).forEach((field) => {
        const value = row?.[field];
        if (value === undefined || value === null || Number.isNaN(Number(value))) {
          customErrors[`liabilityDetails.taxesOwed.${i}.${field}`] = 'Required. Enter 0 if none.';
        }
      });
    });
    if (form.incomeDetails?.otherIncome?.hasIncome === 'yes') {
      const otherIncomeValue = form.incomeDetails.otherIncome.averageMonthlyIncome;
      if (otherIncomeValue === undefined || otherIncomeValue === null || Number.isNaN(Number(otherIncomeValue))) {
        customErrors['incomeDetails.otherIncome.averageMonthlyIncome'] = 'Required. Enter 0 if none.';
      }
      if (!form.incomeDetails.otherIncome.description?.trim()) {
        customErrors['incomeDetails.otherIncome.description'] = 'Description is required.';
      }
    }

    if (Object.keys(customErrors).length > 0) {
      setErrors(customErrors);
      const firstKey = Object.keys(customErrors)[0] || null;
      setFirstErrorKey(firstKey);
      return { valid: false, firstKey };
    }
    try {
      PersonalFinancialStatementSchema.parse(form);
      setErrors({});
      return { valid: true, firstKey: null };
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
      }
      setErrors(newErrors);
      const firstKey = Object.keys(newErrors)[0] || null;
      setFirstErrorKey(firstKey);
      return { valid: false, firstKey };
    }
  };

  const handleValidationFailure = (firstKey: string | null) => {
    const key = firstKey;
    if (key) {
      if (key.startsWith('assets.') || key.startsWith('realEstateOwned.') || key.startsWith('stocksAndBonds.') || key.startsWith('accountsAndNotesReceivable.') || key.startsWith('lifeInsuranceHeld.') || key.startsWith('otherPersonalPropertyAndOtherAssets.')) setStepIndex(1);
      else if (key.startsWith('liabilities.') || key.startsWith('notesPayableToBanksAndOthers.')) setStepIndex(2);
      else if (key.startsWith('annualIncome.') || key.startsWith('incomeDetails.')) setStepIndex(3);
      else if (key.startsWith('declarations.') || key.startsWith('sba413Page3Entries.')) setStepIndex(3);
      else setStepIndex(0);
      setTimeout(() => {
        const escapedKey = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(key) : key.replace(/([\.\[\]])/g, '\\$1');
        const el = document.querySelector(`[name="${escapedKey}"], [data-field-key="${escapedKey}"] input, [data-field-key="${escapedKey}"] textarea, [data-field-key="${escapedKey}"] select, [aria-invalid="true"]`) as HTMLElement | null;
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 60);
    }
  };

  const onGenerate = async () => {
    const currentAsOfDate = new Date().toISOString().split('T')[0] as string;
    const generationForm = buildNormalizedForm({
      ...form,
      asOfDate: currentAsOfDate,
      eSignature: {
        fullName: signatureName.trim(),
        signedAt: new Date().toISOString(),
        attested: previewConfirmed,
      },
    });
    setForm(generationForm);
    const validation = validateForm();
    if (!validation.valid) {
      handleValidationFailure(validation.firstKey);
      return;
    }

    setLoading(true);
    try {
      const resolvedSubmissionId = await saveDraft(generationForm);
      if (!resolvedSubmissionId) throw new Error('Unable to save your form before PDF generation.');

      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          submissionId: resolvedSubmissionId,
          templateType: 'personal_financial_statement',
          loanRequestId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'PDF generation failed');
      }

      const json = await res.json();
      setPdfUrl(json.pdfUrl);
      if (json.pdfUrl) {
        await supabase
          .from('template_submissions')
          .update({ pdf_url: json.pdfUrl })
          .eq('id', resolvedSubmissionId)
          .eq('user_id', user.id);
      }
    } catch (error: any) {
      console.error('PDF generation error:', error);
      alert(`Failed to generate PDF: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (path: string, value: unknown) => {
    setForm((prev) => {
      const updated: Record<string, any> = { ...prev };
      const keys = path.split('.');
      let current: Record<string, any> = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i] as string;
        current[key] = { ...(current[key] || {}) };
        current = current[key] as Record<string, any>;
      }
      const lastKey = keys[keys.length - 1] as string;
      current[lastKey] = value === '' ? undefined : value;
      return updated as PersonalFinancialStatementData;
    });
    queueSave();
  };

  const updateProgressChoice = (
    field:
      | 'hasAccountsAndNotesReceivable'
      | 'hasRetirementAccounts'
      | 'hasLifeInsuranceCashValue'
      | 'hasStocksAndBonds',
    setter: (value: 'yes' | 'no' | undefined) => void,
    value: 'yes' | 'no',
  ) => {
    setter(value);
    updateForm(`progressState.${field}`, value);
  };

  const stockLookupEnabled = stocksAutoFillEnabled && stocksGate === 'yes';

  const scheduleStockSearch = (rowId: string, query: string) => {
    if (!stockLookupEnabled) return;
    if (stockSearchTimers.current[rowId]) clearTimeout(stockSearchTimers.current[rowId]);
    stockSearchTimers.current[rowId] = setTimeout(async () => {
      const q = query.trim();
      if (q.length < 2) {
        setStockSearchResults((prev) => ({ ...prev, [rowId]: [] }));
        setStockSearchError((prev) => ({ ...prev, [rowId]: '' }));
        return;
      }
      try {
        setStockSearchLoading((prev) => ({ ...prev, [rowId]: true }));
        setStockSearchError((prev) => ({ ...prev, [rowId]: '' }));
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(q)}`);
        const json = (await res.json()) as { results?: SearchResult[]; error?: string };
        if (!res.ok) throw new Error(json.error || 'Search failed');
        setStockSearchResults((prev) => ({ ...prev, [rowId]: json.results || [] }));
      } catch {
        setStockSearchResults((prev) => ({ ...prev, [rowId]: [] }));
        setStockSearchError((prev) => ({ ...prev, [rowId]: 'Could not fetch suggestions.' }));
      } finally {
        setStockSearchLoading((prev) => ({ ...prev, [rowId]: false }));
      }
    }, 250);
  };

  const onSelectSecuritySuggestion = async (rowId: string, suggestion: SearchResult) => {
    updateArrayRow<StockRow>('stocksAndBonds', rowId, 'issuerName', suggestion.description);
    updateArrayRow<StockRow>('stocksAndBonds', rowId, 'symbol', suggestion.symbol);
    updateArrayRow<StockRow>('stocksAndBonds', rowId, 'exchange', suggestion.exchange || undefined);
    setStockSearchResults((prev) => ({ ...prev, [rowId]: [] }));
    setStockManualOverride((prev) => ({ ...prev, [rowId]: false }));
    try {
      setStockQuoteError((prev) => ({ ...prev, [rowId]: '' }));
      const res = await fetch(`/api/market/quote?symbol=${encodeURIComponent(suggestion.symbol)}`);
      const json = (await res.json()) as { price?: number; asOfDateTime?: string; sourceName?: string; exchange?: string; error?: string };
      if (!res.ok || json.price == null) throw new Error(json.error || 'Quote unavailable');
      const asOfDate = (json.asOfDateTime || new Date().toISOString()).slice(0, 10);
      updateArrayRow<StockRow>('stocksAndBonds', rowId, 'exchange', json.sourceName || json.exchange || suggestion.exchange || undefined);
      updateArrayRow<StockRow>('stocksAndBonds', rowId, 'dateOfQuote', asOfDate);
      setStockQuoteByRow((prev) => ({
        ...prev,
        [rowId]: {
          price: Number(json.price),
          asOfDateTime: json.asOfDateTime || new Date().toISOString(),
          sourceName: json.sourceName || '',
          exchange: json.exchange || suggestion.exchange || '',
        },
      }));
      updateArrayRow<StockRow>('stocksAndBonds', rowId, 'marketValue', Math.round(Number(json.price)));
    } catch {
      setStockQuoteError((prev) => ({ ...prev, [rowId]: 'Could not fetch quote, please enter value manually.' }));
    }
  };

  const buildNormalizedForm = (source: PersonalFinancialStatementData): PersonalFinancialStatementData => {
    const homeAddress = [
      source.personalInfo.homeStreet,
      [source.personalInfo.homeCity, source.personalInfo.homeState].filter(Boolean).join(', '),
      source.personalInfo.homeZip,
    ].filter(Boolean).join(' ');
    const hasBusinessAddress = Boolean(
      source.businessInfo?.businessStreet?.trim()
      || source.businessInfo?.businessCity?.trim()
      || source.businessInfo?.businessState?.trim()
      || source.businessInfo?.businessZip?.trim()
    );
    const businessStreet = hasBusinessAddress ? source.businessInfo?.businessStreet : source.personalInfo.homeStreet;
    const businessCity = hasBusinessAddress ? source.businessInfo?.businessCity : source.personalInfo.homeCity;
    const businessState = hasBusinessAddress ? source.businessInfo?.businessState : source.personalInfo.homeState;
    const businessZip = hasBusinessAddress ? source.businessInfo?.businessZip : source.personalInfo.homeZip;
    const stocksBondsTotal = (source.stocksAndBonds || []).reduce((sum, row) => {
      const shares = row.numberOfShares;
      const pricePerShare = row.marketValue;
      if (shares != null && pricePerShare != null) return sum + Math.round(Number(shares) * Number(pricePerShare));
      return sum + (pricePerShare || 0);
    }, 0);
    const realEstateTotal = (source.realEstateOwned || []).reduce((sum, row) => sum + (row.presentMarketValue || 0), 0);
    const automobilesTotal = (source.vehiclesOwned || []).reduce((sum, row) => sum + (row.currentEstimatedValue || 0), 0);
    const accountsNotesReceivableTotal = (source.accountsAndNotesReceivable || []).reduce((sum, row) => sum + (row.currentBalanceOwed || 0), 0);
    const lifeInsuranceCashSurrenderTotal = (source.lifeInsuranceHeld || []).reduce((sum, row) => sum + (row.cashSurrenderValue || 0), 0);
    const manualPage3Entries = (source.sba413Page3Entries || []).filter(
      (entry) =>
        entry.section !== 'Section 8 (Auto)' &&
        entry.section !== 'Section 3 (Auto)' &&
        entry.section !== 'Contingent Liabilities (Auto)',
    );
    const stocksPage3Entries = (source.stocksAndBonds || [])
      .filter((row) => row.issuerName || row.marketValue != null || row.cost != null || row.numberOfShares != null)
      .map((row) => {
        const sharesText = `Shares/units: ${row.numberOfShares != null ? Number(row.numberOfShares).toLocaleString() : 'N/A'}.`;
        const lineTotal = row.numberOfShares != null && row.marketValue != null
          ? Math.round(Number(row.numberOfShares) * Number(row.marketValue))
          : (row.marketValue || 0);
        return {
          section: 'Section 3 (Auto)',
          description: `Security: ${row.issuerName || 'Unnamed security'}. ${sharesText} Price per share/unit: ${row.marketValue != null ? `$${Number(row.marketValue).toLocaleString()}` : '$0'}. Total value: $${Number(lineTotal).toLocaleString()}. Date of quotation: ${row.dateOfQuote || new Date().toISOString().split('T')[0]}. Exchange/source: ${row.exchange || 'N/A'}.`,
          amount: lineTotal,
        };
      });
    const lifeInsurancePage3Entries = (source.lifeInsuranceHeld || [])
      .filter((row) => row.companyName || row.faceAmount != null || row.cashSurrenderValue != null || row.beneficiaries)
      .map((row) => {
        const policyLabel =
          row.policyType === 'whole_life' ? 'Whole Life' :
          row.policyType === 'universal_life' ? 'Universal Life' :
          row.policyType === 'variable_life' ? 'Variable Life' :
          row.policyType === 'indexed_universal_life' ? 'Indexed Universal Life' :
          row.policyType === 'other_permanent' ? 'Other Permanent' :
          row.policyType === 'not_sure' ? 'Not Sure' : 'Life Insurance';
        const collateralText = row.pledgedAsCollateral === 'yes'
          ? ` Pledged as collateral to ${row.lenderName || 'lender'} with a current loan balance against the policy of ${row.loanAgainstPolicy != null ? `$${Number(row.loanAgainstPolicy).toLocaleString()}` : '$0'}.`
          : ' Not pledged as collateral.';
        return {
          section: 'Section 8 (Auto)',
          description: `${policyLabel} policy with ${row.companyName || 'insurance company'}. Face amount ${row.faceAmount != null ? `$${Number(row.faceAmount).toLocaleString()}` : '$0'}. Cash surrender value ${row.cashSurrenderValue != null ? `$${Number(row.cashSurrenderValue).toLocaleString()}` : '$0'}. Beneficiary: ${row.beneficiaries || 'N/A'}.${collateralText}`,
          amount: row.cashSurrenderValue || 0,
        };
      });
    const creditCardsBalance = source.liabilityDetails?.creditCards?.totalBalance || 0;
    const medicalBillsBalance = source.liabilityDetails?.medicalBills?.totalBalance || 0;
    const studentLoansBalance = source.liabilityDetails?.studentLoans?.totalBalance || 0;
    const mortgagesBalance = (source.realEstateOwned || []).reduce((sum, row) => sum + (row.mortgageBalance || 0), 0);
    const autoLoansBalance = (source.vehiclesOwned || []).reduce((sum, row) => sum + (row.loanBalance || 0), 0);
    const personalLoansBalance = (source.liabilityDetails?.personalLoans || []).reduce((sum, row) => sum + (row.currentBalance || 0), 0);
    const taxesOwedBalance = (source.liabilityDetails?.taxesOwed || []).reduce((sum, row) => sum + (row.balanceOwed || 0), 0);
    const otherObligationsBalance = (source.liabilityDetails?.otherObligations || []).reduce((sum, row) => sum + (row.amountOwed || 0), 0);
    const loansAgainstInsurance = (source.lifeInsuranceHeld || []).reduce(
      (sum, row) => sum + (row.pledgedAsCollateral === 'yes' ? (row.loanAgainstPolicy || 0) : 0),
      0,
    );
    const mappedNotesPayable = [
      ...(source.liabilityDetails?.personalLoans || []).map((row) => ({
        nameAndAddressOfNoteholder: row.lenderName || '',
        originalBalance: row.originalBalance || 0,
        currentBalance: row.currentBalance || 0,
        paymentAmount: row.monthlyPayment || 0,
        frequency: 'monthly',
        howSecuredOrEndorsed: buildPersonalLoanHowSecuredOrEndorsed(row),
      })),
      ...(source.liabilityDetails?.taxesOwed || []).map((row) => ({
        nameAndAddressOfNoteholder: row.authority || '',
        originalBalance: row.originalBalance || row.balanceOwed || 0,
        currentBalance: row.balanceOwed || 0,
        paymentAmount: row.monthlyPayment || 0,
        frequency: 'monthly',
        howSecuredOrEndorsed: 'Taxes owed',
      })),
    ];
    const contingentEntries = [
      {
        label: 'As Endorser or Co-Maker',
        amount: source.contingentLiabilities?.asEndorserOrCoMaker?.estimatedAmount || 0,
      },
      {
        label: 'Legal Claims & Judgments',
        amount: source.contingentLiabilities?.legalClaimsAndJudgments?.estimatedAmount || 0,
      },
      {
        label: 'Provision for Federal Income Tax',
        amount: source.contingentLiabilities?.provisionForFederalIncomeTax?.estimatedAmount || 0,
      },
      {
        label: 'Other Special Debt',
        amount: source.contingentLiabilities?.otherSpecialDebt?.estimatedAmount || 0,
      },
    ]
      .filter((item) => item.amount > 0)
      .map((item) => ({
        section: 'Contingent Liabilities (Auto)',
        description: item.label,
        amount: item.amount,
      }));
    const hasContingentExposure = [
      source.contingentLiabilities?.asEndorserOrCoMaker?.hasExposure,
      source.contingentLiabilities?.legalClaimsAndJudgments?.hasExposure,
      source.contingentLiabilities?.provisionForFederalIncomeTax?.hasExposure,
      source.contingentLiabilities?.otherSpecialDebt?.hasExposure,
    ].some((value) => value === 'yes');
    const employmentIncomeMonthly =
      source.incomeDetails?.employmentIncome?.hasIncome === 'yes'
        ? (source.incomeDetails?.employmentIncome?.averageGrossMonthlyIncome || 0)
        : source.incomeDetails?.employmentIncome?.hasIncome === 'no'
          ? 0
          : source.annualIncome?.salary;
    const rentalIncomeMonthly =
      source.incomeDetails?.rentalIncome?.hasIncome === 'yes'
        ? (source.incomeDetails?.rentalIncome?.averageNetMonthlyIncome || 0)
        : source.incomeDetails?.rentalIncome?.hasIncome === 'no'
          ? 0
          : source.annualIncome?.realEstateIncome;
    const investmentIncomeMonthly =
      source.incomeDetails?.investmentIncome?.hasIncome === 'yes'
        ? (source.incomeDetails?.investmentIncome?.averageNetMonthlyIncome || 0)
        : source.incomeDetails?.investmentIncome?.hasIncome === 'no'
          ? 0
          : source.annualIncome?.netInvestmentIncome;
    const otherIncomeMonthly =
      source.incomeDetails?.otherIncome?.hasIncome === 'yes'
        ? (source.incomeDetails?.otherIncome?.averageMonthlyIncome || 0)
        : source.incomeDetails?.otherIncome?.hasIncome === 'no'
          ? 0
          : source.annualIncome?.otherIncome;

    return {
      ...source,
      personalInfo: {
        ...source.personalInfo,
        address: homeAddress,
        phone: source.personalInfo.phone || source.personalInfo.primaryPhone || '',
      },
      businessInfo: {
        ...source.businessInfo,
        applicantBusinessPhone: source.businessInfo?.applicantBusinessPhone || '',
        businessStreet,
        businessCity,
        businessState,
        businessZip,
      },
      assets: {
        ...source.assets,
        stocksBonds: stocksBondsTotal,
        realEstate: realEstateTotal,
        automobiles: automobilesTotal,
        accountsNotesReceivable: accountsNotesReceivableTotal,
        lifeInsuranceCashSurrender: lifeInsuranceCashSurrenderTotal,
      },
      liabilities: {
        ...source.liabilities,
        creditCards: creditCardsBalance + medicalBillsBalance,
        mortgages: mortgagesBalance,
        autoLoans: autoLoansBalance,
        studentLoans: studentLoansBalance,
        otherDebts: personalLoansBalance + taxesOwedBalance + otherObligationsBalance + loansAgainstInsurance,
      },
      annualIncome: {
        ...source.annualIncome,
        salary: employmentIncomeMonthly,
        realEstateIncome: rentalIncomeMonthly,
        netInvestmentIncome: investmentIncomeMonthly,
        otherIncome: otherIncomeMonthly,
      },
      realEstateOwned: ensureRowIds(stripEmptyRealEstateRows(source.realEstateOwned)),
      stocksAndBonds: ensureRowIds(source.stocksAndBonds),
      retirementAccounts: ensureRowIds(source.retirementAccounts),
      vehiclesOwned: ensureRowIds(source.vehiclesOwned),
      accountsAndNotesReceivable: ensureRowIds(source.accountsAndNotesReceivable),
      lifeInsuranceHeld: ensureRowIds(source.lifeInsuranceHeld),
      declarations: {
        ...source.declarations,
        hasContingentLiability: hasContingentExposure ? 'yes' : source.declarations?.hasContingentLiability,
        hasLawsuitOrJudgment:
          source.contingentLiabilities?.legalClaimsAndJudgments?.hasExposure === 'yes'
            ? 'yes'
            : source.declarations?.hasLawsuitOrJudgment,
      },
      liabilityDetails: {
        ...source.liabilityDetails,
        personalLoans: ensureRowIds(source.liabilityDetails?.personalLoans),
        taxesOwed: ensureRowIds(source.liabilityDetails?.taxesOwed),
        otherObligations: ensureRowIds(source.liabilityDetails?.otherObligations),
      },
      notesPayableToBanksAndOthers: mappedNotesPayable,
      sba413Page3Entries: [...manualPage3Entries, ...stocksPage3Entries, ...lifeInsurancePage3Entries, ...contingentEntries],
    };
  };

  const updateArrayRow = <T extends RowWithId>(
    key: keyof PersonalFinancialStatementData,
    rowId: string,
    field: string,
    value: unknown,
  ) => {
    setForm((prev) => {
      const currentRows = ((prev[key] as T[]) || []) as T[];
      const nextRows = currentRows.map((row) => (row.id === rowId ? { ...row, [field]: value === '' ? undefined : value } : row));
      return { ...prev, [key]: nextRows };
    });
    queueSave();
  };

  const addRow = <T extends RowWithId>(key: keyof PersonalFinancialStatementData, row: Omit<T, 'id'>) => {
    setForm((prev) => {
      const currentRows = ((prev[key] as T[]) || []) as T[];
      return { ...prev, [key]: [...currentRows, { id: uid(), ...row }] };
    });
    queueSave();
  };

  const removeRow = <T extends RowWithId>(key: keyof PersonalFinancialStatementData, rowId: string) => {
    setForm((prev) => {
      const currentRows = ((prev[key] as T[]) || []) as T[];
      return { ...prev, [key]: currentRows.filter((row) => row.id !== rowId) };
    });
    queueSave();
  };

  const setArrayCount = <T extends RowWithId>(
    key: keyof PersonalFinancialStatementData,
    count: number,
    createRow: () => Omit<T, 'id'>,
  ) => {
    const bounded = Math.max(0, Math.min(10, count));
    setForm((prev) => {
      const currentRows = ((prev[key] as T[]) || []) as T[];
      const nextRows = Array.from({ length: bounded }, (_, i) => {
        const existing = currentRows[i];
        return existing ? existing : ({ id: uid(), ...createRow() } as T);
      });
      return { ...prev, [key]: nextRows };
    });
    queueSave();
  };

  const updateLiabilityArrayRow = (
    key: 'personalLoans' | 'taxesOwed' | 'otherObligations',
    rowId: string,
    field: string,
    value: unknown,
  ) => {
    setForm((prev) => {
      const rows = ((prev.liabilityDetails?.[key] as RowWithId[]) || []) as RowWithId[];
      const nextRows = rows.map((row) => (row.id === rowId ? { ...row, [field]: value === '' ? undefined : value } : row));
      return {
        ...prev,
        liabilityDetails: {
          ...(prev.liabilityDetails || {}),
          [key]: nextRows,
        },
      };
    });
    queueSave();
  };

  const addLiabilityRow = (
    key: 'personalLoans' | 'taxesOwed' | 'otherObligations',
    row: Record<string, unknown>,
  ) => {
    setForm((prev) => {
      const rows = ((prev.liabilityDetails?.[key] as RowWithId[]) || []) as RowWithId[];
      return {
        ...prev,
        liabilityDetails: {
          ...(prev.liabilityDetails || {}),
          [key]: [...rows, { id: uid(), ...row }],
        },
      };
    });
    queueSave();
  };

  const removeLiabilityRow = (key: 'personalLoans' | 'taxesOwed' | 'otherObligations', rowId: string) => {
    setForm((prev) => {
      const rows = ((prev.liabilityDetails?.[key] as RowWithId[]) || []) as RowWithId[];
      return {
        ...prev,
        liabilityDetails: {
          ...(prev.liabilityDetails || {}),
          [key]: rows.filter((row) => row.id !== rowId),
        },
      };
    });
    queueSave();
  };


  const realEstateRows = (form.realEstateOwned as RealEstateRow[] | undefined) || [];
  const stockRows = (form.stocksAndBonds as StockRow[] | undefined) || [];
  const retirementRows = (form.retirementAccounts as RetirementAccountRow[] | undefined) || [];
  const vehicleRows = (form.vehiclesOwned as VehicleRow[] | undefined) || [];
  const receivableRows = (form.accountsAndNotesReceivable as ReceivableRow[] | undefined) || [];
  const insuranceRows = (form.lifeInsuranceHeld as InsuranceRow[] | undefined) || [];
  const personalLoanRows = (form.liabilityDetails?.personalLoans as LiabilityPersonalLoanRow[] | undefined) || [];
  const taxRows = (form.liabilityDetails?.taxesOwed as LiabilityTaxRow[] | undefined) || [];
  const otherObligationRows = (form.liabilityDetails?.otherObligations as LiabilityOtherRow[] | undefined) || [];
  const derivedRealEstateTotal = useMemo(
    () => realEstateRows.reduce((sum, row) => sum + (row.presentMarketValue || 0), 0),
    [realEstateRows],
  );
  const derivedVehicleTotal = useMemo(
    () => vehicleRows.reduce((sum, row) => sum + (row.currentEstimatedValue || 0), 0),
    [vehicleRows],
  );
  const derivedRetirementTotal = useMemo(
    () => retirementRows.reduce((sum, row) => sum + (row.currentEstimatedValue || 0), 0),
    [retirementRows],
  );
  const derivedStocksTotal = useMemo(
    () => stockRows.reduce((sum, row) => {
      if (row.numberOfShares != null && row.marketValue != null) {
        return sum + Math.round(Number(row.numberOfShares) * Number(row.marketValue));
      }
      return sum + (row.marketValue || 0);
    }, 0),
    [stockRows],
  );
  const derivedLifeInsuranceCashValueTotal = useMemo(
    () => insuranceRows.reduce((sum, row) => sum + (row.cashSurrenderValue || 0), 0),
    [insuranceRows],
  );
  const derivedLifeInsurancePledgedTotal = useMemo(
    () => insuranceRows.reduce((sum, row) => sum + (row.pledgedAsCollateral === 'yes' ? (row.loanAgainstPolicy || 0) : 0), 0),
    [insuranceRows],
  );
  const derivedAutoLoanBalanceTotal = useMemo(
    () => vehicleRows.reduce((sum, row) => sum + (row.loanBalance || 0), 0),
    [vehicleRows],
  );
  const derivedAutoLoanMonthlyTotal = useMemo(
    () => vehicleRows.reduce((sum, row) => sum + (row.monthlyPayment || 0), 0),
    [vehicleRows],
  );
  const derivedMortgageBalanceTotal = useMemo(
    () => realEstateRows.reduce((sum, row) => sum + (row.mortgageBalance || 0), 0),
    [realEstateRows],
  );
  const derivedMortgageMonthlyTotal = useMemo(
    () => realEstateRows.reduce((sum, row) => sum + (row.amountOfPaymentPerMonth || 0), 0),
    [realEstateRows],
  );
  const derivedPersonalLoansBalanceTotal = useMemo(
    () => personalLoanRows.reduce((sum, row) => sum + (row.currentBalance || 0), 0),
    [personalLoanRows],
  );
  const derivedPersonalLoansMonthlyTotal = useMemo(
    () => personalLoanRows.reduce((sum, row) => sum + (row.monthlyPayment || 0), 0),
    [personalLoanRows],
  );
  const derivedTaxesBalanceTotal = useMemo(
    () => taxRows.reduce((sum, row) => sum + (row.balanceOwed || 0), 0),
    [taxRows],
  );
  const derivedTaxesMonthlyTotal = useMemo(
    () => taxRows.reduce((sum, row) => sum + (row.monthlyPayment || 0), 0),
    [taxRows],
  );
  const derivedOtherObligationsBalanceTotal = useMemo(
    () => otherObligationRows.reduce((sum, row) => sum + (row.amountOwed || 0), 0),
    [otherObligationRows],
  );
  const derivedOtherObligationsMonthlyTotal = useMemo(
    () => otherObligationRows.reduce((sum, row) => sum + (row.monthlyPayment || 0), 0),
    [otherObligationRows],
  );
  const hasLifeInsuranceLoans = derivedLifeInsurancePledgedTotal > 0;
  const derivedLifeInsuranceNetAvailable = Math.max(0, derivedLifeInsuranceCashValueTotal - derivedLifeInsurancePledgedTotal);
  const derivedReceivableTotal = useMemo(
    () => receivableRows.reduce((sum, row) => sum + (row.currentBalanceOwed || 0), 0),
    [receivableRows],
  );
  const totalAssets = useMemo(() => {
    return (form.assets.cashChecking || 0) +
      (form.assets.cashSavings || 0) +
      derivedReceivableTotal +
      derivedLifeInsuranceCashValueTotal +
      derivedStocksTotal +
      derivedRealEstateTotal +
      derivedVehicleTotal +
      (form.assets.personalProperty || 0) +
      (form.assets.otherAssets || 0) +
      derivedRetirementTotal;
  }, [form.assets, derivedReceivableTotal, derivedLifeInsuranceCashValueTotal, derivedStocksTotal, derivedRealEstateTotal, derivedVehicleTotal, derivedRetirementTotal]);
  const totalLiabilities = useMemo(
    () =>
      (form.liabilityDetails?.creditCards?.totalBalance || 0) +
      (form.liabilityDetails?.medicalBills?.totalBalance || 0) +
      derivedMortgageBalanceTotal +
      derivedAutoLoanBalanceTotal +
      (form.liabilityDetails?.studentLoans?.totalBalance || 0) +
      derivedPersonalLoansBalanceTotal +
      derivedTaxesBalanceTotal +
      derivedOtherObligationsBalanceTotal +
      derivedLifeInsurancePledgedTotal,
    [
      form.liabilityDetails?.creditCards?.totalBalance,
      form.liabilityDetails?.medicalBills?.totalBalance,
      derivedMortgageBalanceTotal,
      derivedAutoLoanBalanceTotal,
      form.liabilityDetails?.studentLoans?.totalBalance,
      derivedPersonalLoansBalanceTotal,
      derivedTaxesBalanceTotal,
      derivedOtherObligationsBalanceTotal,
      derivedLifeInsurancePledgedTotal,
    ],
  );
  const netWorth = totalAssets - totalLiabilities;
  const previewData = useMemo(() => buildNormalizedForm(form), [form]);
  const signaturePreviewName = signatureName.trim();
  const signatureNameIsValid = signaturePreviewName.length >= 2;
  const previewSignatureUnits =
    signaturePreviewName.replace(/\s/g, '').length * 0.42 + (signaturePreviewName.match(/\s/g)?.length ?? 0) * 0.16;
  const previewSignatureSize = signaturePreviewName
    ? Math.max(44, Math.min(60, 760 / Math.max(previewSignatureUnits, 1)))
    : 60;
  const totalMonthlyIncomeForReview =
    (form.incomeDetails?.employmentIncome?.hasIncome === 'yes' ? (form.incomeDetails?.employmentIncome?.averageGrossMonthlyIncome || 0) : 0) +
    (form.incomeDetails?.rentalIncome?.hasIncome === 'yes' ? (form.incomeDetails?.rentalIncome?.averageNetMonthlyIncome || 0) : 0) +
    (form.incomeDetails?.investmentIncome?.hasIncome === 'yes' ? (form.incomeDetails?.investmentIncome?.averageNetMonthlyIncome || 0) : 0) +
    (form.incomeDetails?.otherIncome?.hasIncome === 'yes' ? (form.incomeDetails?.otherIncome?.averageMonthlyIncome || 0) : 0);
  const progressPercent = useMemo(() => getPersonalFinancialStatementProgress(form).percent, [form]);
  const stepCompletion = useMemo(() => getPfsStepCompletion(form), [form]);

  const sectionCardClassName = 'rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-5';

  const statusTone =
    saveStatus === 'saving' ? 'saving' : saveStatus === 'saved' ? 'saved' : saveStatus === 'error' ? 'error' : 'neutral';

  const statusLabel =
    saveStatus === 'saving'
      ? 'Saving changes...'
      : saveStatus === 'saved'
        ? 'All changes saved'
        : saveStatus === 'error'
          ? 'Save failed'
          : 'Ready to edit';
  const canGoBack = stepIndex > 0;
  const canGoNext = stepIndex < STEPS.length - 1;
  const allSectionsComplete = stepCompletion.every(Boolean);
  const reviewUnlocked = stepCompletion.slice(0, STEPS.length - 1).every(Boolean);

  const goToStep = (nextIndex: number) => {
    if (nextIndex === STEPS.length - 1 && !reviewUnlocked) {
      setReviewLockedMessage('Finish the Basic Details, What You Own, What You Owe, and Income & Contingencies sections before opening Review and Generate.');
      return;
    }
    setReviewLockedMessage(null);
    setStepIndex(nextIndex);
  };

  const handleBackStep = () => {
    setReviewLockedMessage(null);
    setStepIndex((s) => Math.max(0, s - 1));
  };

  const handleContinueStep = () => {
    const nextIndex = Math.min(STEPS.length - 1, stepIndex + 1);
    goToStep(nextIndex);
  };

  const handleStickySubmit = () => {
    if (!allSectionsComplete) {
      setReviewLockedMessage('Finish the remaining sections before moving to Review and Generate.');
      goToStep(STEPS.length - 1);
      return;
    }
    if (stepIndex !== 4) {
      goToStep(STEPS.length - 1);
      return;
    }
    void onGenerate();
  };

  useEffect(() => {
    if (reviewUnlocked) return;
    if (stepIndex === STEPS.length - 1) {
      setStepIndex(STEPS.length - 2);
      setReviewLockedMessage('Finish the other sections before opening Review and Generate.');
    }
    if (previewConfirmed || form.eSignature?.attested) {
      setPreviewConfirmed(false);
      updateForm('eSignature.attested', false);
    }
  }, [reviewUnlocked, stepIndex, previewConfirmed, form.eSignature?.attested]);

  const stepTabs = (
    <>
      <div className="mb-3 md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STEPS.map((step, idx) => {
            const active = idx === stepIndex;
            const done = stepCompletion[idx] ?? false;
            const locked = idx === STEPS.length - 1 && !reviewUnlocked;
            return (
              <button
                key={`mobile-${step}`}
                type="button"
                onClick={() => goToStep(idx)}
                className={`flex-none whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : done
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : locked
                    ? 'border-amber-300 bg-amber-50 text-amber-900'
                    : 'border-slate-300 bg-white text-slate-700'
                }`}
              >
                {done && !active ? '✓ ' : locked ? 'Lock ' : ''}
                {step}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4 hidden gap-3 md:grid md:grid-cols-5">
        {STEPS.map((step, idx) => {
          const active = idx === stepIndex;
          const done = stepCompletion[idx] ?? false;
          const locked = idx === STEPS.length - 1 && !reviewUnlocked;
          return (
            <button
              key={step}
              type="button"
              onClick={() => goToStep(idx)}
              className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                active
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : done
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : locked
                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                  : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-semibold uppercase tracking-wide">{active ? 'Current' : done ? 'Complete' : locked ? 'Locked' : 'Pending'}</div>
              <div className="text-sm font-semibold">{step}</div>
            </button>
          );
        })}
      </div>
      {reviewLockedMessage ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {reviewLockedMessage}
        </div>
      ) : null}
    </>
  );

  if (isAuthChecking || !user) {
    return <div className="mx-auto max-w-7xl px-4 py-8">Loading...</div>;
  }
  return (
    <TemplatePageShell
      title="Personal Financial Statement (SBA 413)"
      subtitle="Guided version for first-time users."
      description="Answer one section at a time in plain English. We turn this into the lender-ready SBA 413 style output for you."
      metricLabel={netWorth >= 0 ? 'Estimated Net Worth' : 'Estimated Net Deficit'}
      metricValue={`$${Math.abs(netWorth).toLocaleString()}`}
      metricSubvalue={`${totalAssets.toLocaleString()} assets vs ${totalLiabilities.toLocaleString()} liabilities`}
      statusLabel={statusLabel}
      statusTone={statusTone}
      fullWidthBelowHero={
        <TemplateHeroProgressBar
          label={`Form completion: ${progressPercent}% of key fields complete`}
          percent={progressPercent}
        />
      }
    >
      {stepIndex === 0 && (
        <section className={sectionCardClassName}>
          {stepTabs}
          <h2 className="text-xl font-bold text-slate-900">Basic borrower details</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <FormField label="Your full legal name" required error={errors['personalInfo.name']} help="Required. This identifies who the statement belongs to.">
              <Input
                value={form.personalInfo.name}
                onChange={(e) => updateForm('personalInfo.name', e.target.value)}
                onBlur={() => {
                  if (!user) return;
                  void upsertTemplateSharedProfile(user.id, { personalName: form.personalInfo.name?.trim() || '' });
                }}
                placeholder="Jane Marie Smith"
              />
            </FormField>
            <FormField label="Business name (optional)" error={errors['businessInfo.applicantBusinessName']} help="Name of business applying for a loan. Leave blank if not for a business loan.">
              <Input
                value={form.businessInfo?.applicantBusinessName || ''}
                onChange={(e) => updateForm('businessInfo.applicantBusinessName', e.target.value)}
                onBlur={() => {
                  if (!user) return;
                  const nextName = form.businessInfo?.applicantBusinessName?.trim() || '';
                  void upsertTemplateSharedProfile(user.id, { businessName: nextName, businessLegalName: nextName });
                }}
                placeholder="Business legal name (if applicable)"
              />
            </FormField>

            <div className="space-y-6">
              <FormField label="Primary address street" required error={errors['personalInfo.homeStreet']} help="Use your main personal mailing or residential address.">
                <Input value={form.personalInfo.homeStreet || ''} onChange={(e) => updateForm('personalInfo.homeStreet', e.target.value)} placeholder="123 Main St" />
              </FormField>
              <FormField label="Primary address city" required error={errors['personalInfo.homeCity']}>
                <Input value={form.personalInfo.homeCity || ''} onChange={(e) => updateForm('personalInfo.homeCity', e.target.value)} placeholder="City" />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Primary address state" required error={errors['personalInfo.homeState']}>
                  <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.personalInfo.homeState || ''} onChange={(e) => updateForm('personalInfo.homeState', e.target.value)}>
                    <option value="">Select state</option>
                    {US_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
                  </select>
                </FormField>
                <FormField label="Primary address ZIP" required error={errors['personalInfo.homeZip']}>
                  <Input value={form.personalInfo.homeZip || ''} onChange={(e) => updateForm('personalInfo.homeZip', e.target.value)} placeholder="ZIP" />
                </FormField>
              </div>
            </div>

            <div className="space-y-6">
              <FormField label="Business type (optional)" error={errors['businessInfo.businessType']} help="If this is not for a business loan, you can leave this blank.">
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.businessInfo?.businessType || ''} onChange={(e) => updateForm('businessInfo.businessType', e.target.value || undefined)}>
                  <option value="">Select business type</option>
                  <option value="sole_proprietor">Sole Proprietor</option>
                  <option value="llc">LLC</option>
                  <option value="corporation">Corporation</option>
                  <option value="s_corp">S-Corp</option>
                  <option value="partnership">Partnership</option>
                </select>
              </FormField>
              <FormField label="Business street address (optional)" help="Leave blank if your business uses the same address as your primary address.">
                <Input value={form.businessInfo?.businessStreet || ''} onChange={(e) => updateForm('businessInfo.businessStreet', e.target.value)} placeholder="123 Business Ave" />
              </FormField>
              <FormField label="Business city (optional)">
                <Input value={form.businessInfo?.businessCity || ''} onChange={(e) => updateForm('businessInfo.businessCity', e.target.value)} placeholder="City" />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Business state (optional)">
                  <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.businessInfo?.businessState || ''} onChange={(e) => updateForm('businessInfo.businessState', e.target.value)}>
                    <option value="">Select state</option>
                    {US_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
                  </select>
                </FormField>
                <FormField label="Business ZIP (optional)">
                  <Input value={form.businessInfo?.businessZip || ''} onChange={(e) => updateForm('businessInfo.businessZip', e.target.value)} placeholder="ZIP" />
                </FormField>
              </div>
            </div>
          </div>
        </section>
      )}

      {stepIndex === 1 && (
        <section className={sectionCardClassName}>
          {stepTabs}
          <h2 className="text-xl font-bold text-slate-900">What you own (assets)</h2>
          <p className="mt-1 text-sm text-slate-600">Use personal amounts only under your name. Enter your best estimate for today.</p>
          <div className="mt-6 space-y-6">
            <FormField htmlFor="assets.cashChecking" label="How much money do you personally have in all checking accounts today?" error={errors['assets.cashChecking']} help="Include only personal checking accounts in your name.">
              <CurrencyInput compact value={form.assets.cashChecking} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateForm('assets.cashChecking', v)} />
            </FormField>
            <FormField htmlFor="assets.cashSavings" label="How much money do you personally have in all savings accounts today?" error={errors['assets.cashSavings']} help="Include only personal savings accounts in your name.">
              <CurrencyInput compact value={form.assets.cashSavings} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateForm('assets.cashSavings', v)} />
            </FormField>
          </div>

          <div className="mt-8 flex flex-col gap-8">
            <div className="order-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Real Estate Owned</h3>
              <p className="mt-1 text-sm text-slate-600">List each property you personally own (primary residence, rentals, land, etc.). Do not include property owned only by your business.</p>
              <p className="mt-2 text-sm text-slate-600">How many properties do you personally own?</p>
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
                {SHORT_COUNT_OPTIONS.map((count) => (
                  <button
                    key={`real-estate-${count}`}
                    type="button"
                    onClick={() => {
                      updateForm('progressState.realEstateCountChosen', true);
                      setArrayCount<RealEstateRow>('realEstateOwned', count, () => ({
                        propertyType: undefined,
                        propertyAddress: '',
                        datePurchased: '',
                        originalCost: undefined,
                        presentMarketValue: undefined,
                        mortgageHolderName: '',
                        mortgageHolderAddress: '',
                        mortgageAccountNumber: '',
                        mortgageBalance: undefined,
                        amountOfPaymentPerMonth: undefined,
                        status: undefined,
                      }));
                    }}
                    className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold transition ${
                      realEstateRows.length === count ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">Total real estate value auto-calculated: ${derivedRealEstateTotal.toLocaleString()}</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {realEstateRows.map((row, index) => (
                  <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h4 className="text-sm font-semibold text-slate-900">Property #{index + 1}</h4>
                      <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100" onClick={() => removeRow<RealEstateRow>('realEstateOwned', row.id)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                    <div className="space-y-5">
                      <div>
                        <h5 className="text-sm font-semibold text-slate-900">Property Details</h5>
                        <div className="mt-2 space-y-4">
                          <FormField label="Property type" error={errors[`realEstateOwned.${index}.propertyType`]}>
                            <select className="h-10 w-fit min-w-[13rem] max-w-full rounded-md border border-input bg-background px-3 text-sm" value={row.propertyType || ''} onChange={(e) => updateArrayRow<RealEstateRow>('realEstateOwned', row.id, 'propertyType', e.target.value || undefined)}>
                              <option value="">Select property type</option>
                              <option value="primary_residence">Primary residence</option>
                              <option value="rental_property">Rental property</option>
                              <option value="second_home">Second home</option>
                              <option value="land">Land</option>
                              <option value="commercial_property">Commercial property</option>
                              <option value="other">Other</option>
                            </select>
                          </FormField>
                          <FormField label="Property address" error={errors[`realEstateOwned.${index}.propertyAddress`]}>
                            <Input value={row.propertyAddress || ''} onChange={(e) => updateArrayRow<RealEstateRow>('realEstateOwned', row.id, 'propertyAddress', e.target.value)} placeholder="Street, city, state, ZIP" />
                          </FormField>
                          <FormField label="Date purchased">
                            <Input className="w-fit min-w-[11rem] max-w-full" type="date" value={row.datePurchased || ''} onChange={(e) => updateArrayRow<RealEstateRow>('realEstateOwned', row.id, 'datePurchased', e.target.value)} />
                          </FormField>
                          <FormField label="Original purchase price (optional)" help="Enter the price you originally paid for the property.">
                            <CurrencyInput compact value={row.originalCost} withDollarPrefix onValueChange={(v) => updateArrayRow<RealEstateRow>('realEstateOwned', row.id, 'originalCost', v)} placeholder={USD_PLACEHOLDER} />
                          </FormField>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-semibold text-slate-900">Estimated Current Market Value</h5>
                        <div className="mt-2 space-y-4">
                          <FormField label="" error={errors[`realEstateOwned.${index}.presentMarketValue`]} help="Estimate based on recent appraisal, tax value, or market comps.">
                            <CurrencyInput compact value={row.presentMarketValue} withDollarPrefix onValueChange={(v) => updateArrayRow<RealEstateRow>('realEstateOwned', row.id, 'presentMarketValue', v)} placeholder={USD_PLACEHOLDER} />
                          </FormField>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-semibold text-slate-900">Mortgage Details (if applicable)</h5>
                        <p className="mt-1 text-xs text-slate-500">If this property has no mortgage, enter 0 for balance.</p>
                        <div className="mt-2 space-y-4">
                          <FormField label="Status of mortgage">
                            <select className="h-10 w-fit min-w-[11rem] max-w-full rounded-md border border-input bg-background px-3 text-sm" value={row.status || ''} onChange={(e) => updateArrayRow<RealEstateRow>('realEstateOwned', row.id, 'status', e.target.value || undefined)}>
                              <option value="">Select status</option>
                              <option value="current">Current</option>
                              <option value="thirty_days_late">30 days late</option>
                              <option value="sixty_plus_days_late">60+ days late</option>
                              <option value="paid_off">Paid off</option>
                            </select>
                          </FormField>
                          <FormField label="Mortgage lender name">
                            <Input value={row.mortgageHolderName || ''} onChange={(e) => updateArrayRow<RealEstateRow>('realEstateOwned', row.id, 'mortgageHolderName', e.target.value)} placeholder="Lender name" />
                          </FormField>
                          <FormField label="Current mortgage balance" error={errors[`realEstateOwned.${index}.mortgageBalance`]}>
                            <CurrencyInput compact value={row.mortgageBalance} withDollarPrefix onValueChange={(v) => updateArrayRow<RealEstateRow>('realEstateOwned', row.id, 'mortgageBalance', v)} placeholder={USD_PLACEHOLDER} />
                          </FormField>
                          <FormField label="Monthly payment amount" error={errors[`realEstateOwned.${index}.amountOfPaymentPerMonth`]}>
                            <CurrencyInput compact value={row.amountOfPaymentPerMonth} withDollarPrefix onValueChange={(v) => updateArrayRow<RealEstateRow>('realEstateOwned', row.id, 'amountOfPaymentPerMonth', v)} placeholder={USD_PLACEHOLDER} />
                          </FormField>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Money owed to you (personal)</h3>
              <p className="mt-1 text-sm text-slate-600">Are you personally owed money by anyone right now? Do not include invoices owed to your business. Those belong on business financial statements.</p>
              <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">What to include here</p>
                <p className="mt-1">Include money people owe you personally, for example:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
                  <li>You personally loaned someone money and they are paying you back.</li>
                  <li>You sold a car, equipment, or another item and are being paid over time.</li>
                  <li>You hold a written payment agreement where you are the person receiving payments.</li>
                </ul>
                <p className="mt-2 text-xs text-slate-500">If none of these apply, choose No and we will use 0.</p>
              </div>
              <div className="mt-3 grid max-w-md grid-cols-2 gap-2">
                {[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ].map((option) => (
                  <button
                    key={`receivable-has-${option.value}`}
                    type="button"
                    onClick={() => {
                      updateProgressChoice('hasAccountsAndNotesReceivable', setReceivablesGate, option.value as 'yes' | 'no');
                      if (option.value === 'no') setArrayCount<ReceivableRow>('accountsAndNotesReceivable', 0, createEmptyReceivableRow);
                      if (option.value === 'yes' && receivableRows.length === 0) setArrayCount<ReceivableRow>('accountsAndNotesReceivable', 1, createEmptyReceivableRow);
                    }}
                    className={`h-10 rounded-lg border px-3 text-sm font-semibold transition ${
                      receivablesGate === option.value
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {receivableRows.length > 0 ? (
                <>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {receivableRows.map((row, index) => (
                      <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h4 className="text-sm font-semibold text-slate-900">Money owed entry #{index + 1}</h4>
                          <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100" onClick={() => {
                            removeRow<ReceivableRow>('accountsAndNotesReceivable', row.id);
                            if (receivableRows.length === 1) {
                              updateProgressChoice('hasAccountsAndNotesReceivable', setReceivablesGate, 'no');
                              setArrayCount<ReceivableRow>('accountsAndNotesReceivable', 0, createEmptyReceivableRow);
                            }
                          }}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                        <div className="space-y-4">
                          <FormField label="Who owes you this money?" help="Enter the person or company name.">
                            <Input value={row.debtorName || ''} onChange={(e) => updateArrayRow<ReceivableRow>('accountsAndNotesReceivable', row.id, 'debtorName', e.target.value)} placeholder="Example: John Smith" />
                          </FormField>
                          <FormField label="How much did you originally lend or finance?" help="The starting amount when this began.">
                            <CurrencyInput compact value={row.originalAmountLoaned} withDollarPrefix onValueChange={(v) => updateArrayRow<ReceivableRow>('accountsAndNotesReceivable', row.id, 'originalAmountLoaned', v)} placeholder={USD_PLACEHOLDER} />
                          </FormField>
                          <FormField label="How much is still owed to you today?" help="Current unpaid balance right now.">
                            <CurrencyInput compact value={row.currentBalanceOwed} withDollarPrefix onValueChange={(v) => updateArrayRow<ReceivableRow>('accountsAndNotesReceivable', row.id, 'currentBalanceOwed', v)} placeholder={USD_PLACEHOLDER} />
                          </FormField>
                          <FormField label="How much do you usually receive each month?" help="If payments are irregular, use your best monthly estimate.">
                            <CurrencyInput compact value={row.monthlyPaymentReceived} withDollarPrefix onValueChange={(v) => updateArrayRow<ReceivableRow>('accountsAndNotesReceivable', row.id, 'monthlyPaymentReceived', v)} placeholder={USD_PLACEHOLDER} />
                          </FormField>
                          <FormField label="Is there a written payment agreement?" help="For example: signed agreement, loan document, or promissory note.">
                            <YesNoToggle value={row.hasWrittenAgreement} onChange={(value) => updateArrayRow<ReceivableRow>('accountsAndNotesReceivable', row.id, 'hasWrittenAgreement', value)} />
                          </FormField>
                          <FormField label="Is this backed by collateral?" help="Collateral means something of value the borrower pledged, like a vehicle or equipment.">
                            <YesNoToggle value={row.isSecuredByCollateral} onChange={(value) => updateArrayRow<ReceivableRow>('accountsAndNotesReceivable', row.id, 'isSecuredByCollateral', value)} />
                          </FormField>
                          {row.isSecuredByCollateral === 'yes' ? (
                            <div className="md:col-span-2">
                              <FormField label="What collateral was pledged?" help="Example: 2019 Ford F-150, trailer, or equipment.">
                                <Input value={row.collateralDescription || ''} onChange={(e) => updateArrayRow<ReceivableRow>('accountsAndNotesReceivable', row.id, 'collateralDescription', e.target.value)} placeholder="Describe the collateral" />
                              </FormField>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="mt-4 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold" onClick={() => addRow<ReceivableRow>('accountsAndNotesReceivable', createEmptyReceivableRow())}>+ Add money owed to me</button>
                </>
              ) : null}
              <p className="mt-2 text-sm font-semibold text-slate-800">Total accounts & notes receivable: ${derivedReceivableTotal.toLocaleString()}</p>
            </div>

            <div className="order-1 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Retirement accounts (IRA / 401k / similar)</h3>
              <p className="mt-1 text-sm text-slate-600">
                Do you have any retirement accounts such as an IRA, 401(k), SEP-IRA, SIMPLE IRA, Roth IRA, or other retirement investment accounts?
              </p>
              <div className="mt-3 grid max-w-md grid-cols-2 gap-2">
                {[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ].map((option) => (
                  <button
                    key={`retirement-has-${option.value}`}
                    type="button"
                    onClick={() => {
                      updateProgressChoice('hasRetirementAccounts', setRetirementGate, option.value as 'yes' | 'no');
                      if (option.value === 'no') setArrayCount<RetirementAccountRow>('retirementAccounts', 0, createEmptyRetirementAccountRow);
                      if (option.value === 'yes' && retirementRows.length === 0) setArrayCount<RetirementAccountRow>('retirementAccounts', 1, createEmptyRetirementAccountRow);
                    }}
                    className={`h-10 rounded-lg border px-3 text-sm font-semibold transition ${
                      retirementGate === option.value
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {retirementRows.length > 0 ? (
                <>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {retirementRows.map((row, index) => (
                      <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h4 className="text-sm font-semibold text-slate-900">Retirement account #{index + 1}</h4>
                          <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100" onClick={() => {
                            removeRow<RetirementAccountRow>('retirementAccounts', row.id);
                            if (retirementRows.length === 1) {
                              updateProgressChoice('hasRetirementAccounts', setRetirementGate, 'no');
                              setArrayCount<RetirementAccountRow>('retirementAccounts', 0, createEmptyRetirementAccountRow);
                            }
                          }}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                        <div className="space-y-4">
                          <FormField label="Retirement account type" help="Choose the type that best matches this account.">
                            <select className="h-10 w-fit min-w-[12rem] max-w-full rounded-md border border-input bg-background px-3 text-sm" value={row.accountType || ''} onChange={(e) => updateArrayRow<RetirementAccountRow>('retirementAccounts', row.id, 'accountType', e.target.value || undefined)}>
                              <option value="">Select account type</option>
                              <option value="traditional_ira">Traditional IRA</option>
                              <option value="roth_ira">Roth IRA</option>
                              <option value="401k">401(k)</option>
                              <option value="sep_ira">SEP-IRA</option>
                              <option value="simple_ira">SIMPLE IRA</option>
                              <option value="solo_401k">Solo 401(k)</option>
                              <option value="other">Other</option>
                            </select>
                          </FormField>
                          <FormField label="Financial institution name" help="Enter the company holding the account, like Fidelity, Vanguard, or Schwab.">
                            <Input value={row.institutionName || ''} onChange={(e) => updateArrayRow<RetirementAccountRow>('retirementAccounts', row.id, 'institutionName', e.target.value)} placeholder="Example: Fidelity" />
                          </FormField>
                          <FormField label="Current account value" help="Enter the current balance or latest estimated value shown on your statement." error={errors[`retirementAccounts.${index}.currentEstimatedValue`]}>
                            <CurrencyInput compact value={row.currentEstimatedValue} withDollarPrefix onValueChange={(v) => updateArrayRow<RetirementAccountRow>('retirementAccounts', row.id, 'currentEstimatedValue', v)} placeholder={USD_PLACEHOLDER} />
                          </FormField>
                          <FormField label="Is this account pledged as collateral?" help="Choose Yes only if this retirement account is being used to secure a loan.">
                            <YesNoToggle value={row.pledgedAsCollateral} onChange={(value) => updateArrayRow<RetirementAccountRow>('retirementAccounts', row.id, 'pledgedAsCollateral', value)} />
                          </FormField>
                          {row.pledgedAsCollateral === 'yes' ? (
                            <>
                              <FormField label="Lender name" help="Enter the lender or institution that holds the lien against this account.">
                                <Input value={row.lenderName || ''} onChange={(e) => updateArrayRow<RetirementAccountRow>('retirementAccounts', row.id, 'lenderName', e.target.value)} placeholder="Example: Bank of America" />
                              </FormField>
                              <FormField label="Amount pledged or lien amount" help="Enter how much of the account is tied to the loan." error={errors[`retirementAccounts.${index}.lienAmount`]}>
                                <CurrencyInput compact value={row.lienAmount} withDollarPrefix onValueChange={(v) => updateArrayRow<RetirementAccountRow>('retirementAccounts', row.id, 'lienAmount', v)} placeholder={USD_PLACEHOLDER} />
                              </FormField>
                              <FormField label="Monthly payment tied to this loan (if any)" help="If there is no regular payment, enter 0.">
                                <CurrencyInput compact value={row.monthlyPayment} withDollarPrefix onValueChange={(v) => updateArrayRow<RetirementAccountRow>('retirementAccounts', row.id, 'monthlyPayment', v)} placeholder={USD_PLACEHOLDER} />
                              </FormField>
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="mt-4 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold" onClick={() => addRow<RetirementAccountRow>('retirementAccounts', createEmptyRetirementAccountRow())}>+ Add retirement account</button>
                  <p className="mt-2 text-sm font-semibold text-slate-800">Total retirement assets: ${derivedRetirementTotal.toLocaleString()}</p>
                </>
              ) : null}
            </div>

            <div className="order-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Life insurance (cash value only)</h3>
              <p className="mt-1 text-sm text-slate-600">Do you have any life insurance policies that have cash value? Include whole life or other permanent policies. Do not include term life policies with no cash value.</p>
              <div className="mt-3 grid max-w-md grid-cols-2 gap-2">
                {[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ].map((option) => (
                  <button
                    key={`life-insurance-gate-${option.value}`}
                    type="button"
                    onClick={() => {
                      updateProgressChoice('hasLifeInsuranceCashValue', setLifeInsuranceGate, option.value as 'yes' | 'no');
                      if (option.value === 'no') {
                        setArrayCount<InsuranceRow>('lifeInsuranceHeld', 0, createEmptyInsuranceRow);
                      }
                      if (option.value === 'yes' && insuranceRows.length === 0) {
                        setArrayCount<InsuranceRow>('lifeInsuranceHeld', 1, createEmptyInsuranceRow);
                      }
                    }}
                    className={`h-10 rounded-lg border px-3 text-sm font-semibold transition ${
                      lifeInsuranceGate === option.value
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
                            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Examples</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
                  <li>If you only have term life with no cash value, choose <strong>No</strong> above (do not add a policy entry).</li>
                  <li>Whole life policy with $18,500 cash value: include $18,500 here.</li>
                  <li>Universal life policy with cash value: include only current cash surrender value.</li>
                </ul>
              </div>
              {insuranceRows.length > 0 ? (
                <>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {insuranceRows.map((row, index) => (
                      <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h4 className="text-sm font-semibold text-slate-900">Life insurance policy #{index + 1}</h4>
                          <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100" onClick={() => {
                            removeRow<InsuranceRow>('lifeInsuranceHeld', row.id);
                            if (insuranceRows.length === 1) {
                              updateProgressChoice('hasLifeInsuranceCashValue', setLifeInsuranceGate, 'no');
                              setArrayCount<InsuranceRow>('lifeInsuranceHeld', 0, createEmptyInsuranceRow);
                            }
                          }}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                        <div className="space-y-4">
                          <FormField label="Insurance company name" error={errors[`lifeInsuranceHeld.${index}.companyName`]}>
                            <Input value={row.companyName || ''} onChange={(e) => updateArrayRow<InsuranceRow>('lifeInsuranceHeld', row.id, 'companyName', e.target.value)} placeholder="Example: Northwestern Mutual" />
                          </FormField>
                          <FormField label="Policy type" error={errors[`lifeInsuranceHeld.${index}.policyType`]}>
                            <select className="h-10 w-fit min-w-[12rem] max-w-full rounded-md border border-input bg-background px-3 text-sm" value={row.policyType || ''} onChange={(e) => updateArrayRow<InsuranceRow>('lifeInsuranceHeld', row.id, 'policyType', e.target.value || undefined)}>
                              <option value="">Select policy type</option>
                              <option value="whole_life">Whole Life</option>
                              <option value="universal_life">Universal Life</option>
                              <option value="variable_life">Variable Life</option>
                              <option value="indexed_universal_life">Indexed Universal Life</option>
                              <option value="other_permanent">Other Permanent</option>
                              <option value="not_sure">Not sure</option>
                            </select>
                          </FormField>
                          <FormField label="Face amount (death benefit)" error={errors[`lifeInsuranceHeld.${index}.faceAmount`]}>
                            <CurrencyInput compact value={row.faceAmount} withDollarPrefix onValueChange={(v) => updateArrayRow<InsuranceRow>('lifeInsuranceHeld', row.id, 'faceAmount', v)} placeholder={USD_PLACEHOLDER} />
                          </FormField>
                          <FormField label="Current cash surrender value (from latest policy statement)" error={errors[`lifeInsuranceHeld.${index}.cashSurrenderValue`]}>
                            <CurrencyInput compact value={row.cashSurrenderValue} withDollarPrefix onValueChange={(v) => updateArrayRow<InsuranceRow>('lifeInsuranceHeld', row.id, 'cashSurrenderValue', v)} placeholder={USD_PLACEHOLDER} />
                          </FormField>
                          <FormField label="Beneficiary (optional)">
                            <Input value={row.beneficiaries || ''} onChange={(e) => updateArrayRow<InsuranceRow>('lifeInsuranceHeld', row.id, 'beneficiaries', e.target.value)} placeholder="Example: Spouse" />
                          </FormField>
                          <FormField label="Is this policy pledged as collateral?" error={errors[`lifeInsuranceHeld.${index}.pledgedAsCollateral`]}>
                            <YesNoToggle value={row.pledgedAsCollateral} onChange={(value) => updateArrayRow<InsuranceRow>('lifeInsuranceHeld', row.id, 'pledgedAsCollateral', value)} />
                          </FormField>
                          {row.pledgedAsCollateral === 'yes' ? (
                            <>
                              <FormField label="Lender name">
                                <Input value={row.lenderName || ''} onChange={(e) => updateArrayRow<InsuranceRow>('lifeInsuranceHeld', row.id, 'lenderName', e.target.value)} placeholder="Lender name" />
                              </FormField>
                              <FormField label="Loan balance against the policy" error={errors[`lifeInsuranceHeld.${index}.loanAgainstPolicy`]}>
                                <CurrencyInput compact value={row.loanAgainstPolicy} withDollarPrefix onValueChange={(v) => updateArrayRow<InsuranceRow>('lifeInsuranceHeld', row.id, 'loanAgainstPolicy', v)} placeholder={USD_PLACEHOLDER} />
                              </FormField>
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="mt-4 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold" onClick={() => addRow<InsuranceRow>('lifeInsuranceHeld', createEmptyInsuranceRow())}>+ Add life insurance policy</button>
                </>
              ) : null}
              <p className="mt-2 text-xs text-slate-500">This asset increases net worth but may not be considered liquid unless surrendered.</p>
              <div className="mt-2 space-y-1 text-sm font-semibold text-slate-800">
                <p>Total life insurance cash value: ${derivedLifeInsuranceCashValueTotal.toLocaleString()}</p>
                <p>Amount pledged: ${derivedLifeInsurancePledgedTotal.toLocaleString()}</p>
                <p>Net available cash value: ${derivedLifeInsuranceNetAvailable.toLocaleString()}</p>
              </div>
            </div>

            <div className="order-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Stocks and bonds details</h3>
              <p className="mt-1 text-sm text-slate-600">Do you personally own any stocks, bonds, mutual funds, ETFs, or other marketable securities? List each stock, bond, or investment separately. Use your latest statement for market value if entering manually.</p>
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={stocksAutoFillEnabled}
                  onChange={(e) => setStocksAutoFillEnabled(e.target.checked)}
                />
                Auto-fill market value using live quote (optional)
              </label>
              <div className="mt-3 grid max-w-md grid-cols-2 gap-2">
                {[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ].map((option) => (
                  <button
                    key={`stocks-gate-${option.value}`}
                    type="button"
                    onClick={() => {
                      updateProgressChoice('hasStocksAndBonds', setStocksGate, option.value as 'yes' | 'no');
                      if (option.value === 'no') {
                        setArrayCount<StockRow>('stocksAndBonds', 0, () => ({ symbol: undefined, issuerName: '', numberOfShares: undefined, cost: undefined, marketValue: undefined, dateOfQuote: '', exchange: '' }));
                      }
                      if (option.value === 'yes' && stockRows.length === 0) {
                        const today = new Date().toISOString().split('T')[0] || '';
                        addRow<StockRow>('stocksAndBonds', { symbol: undefined, issuerName: '', numberOfShares: undefined, cost: undefined, marketValue: undefined, dateOfQuote: today, exchange: '' });
                      }
                    }}
                    className={`h-10 rounded-lg border px-3 text-sm font-semibold transition ${
                      stocksGate === option.value ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {stockRows.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold" onClick={() => addRow<StockRow>('stocksAndBonds', { symbol: undefined, issuerName: '', numberOfShares: undefined, cost: undefined, marketValue: undefined, dateOfQuote: new Date().toISOString().split('T')[0] || '', exchange: '' })}>+ Add Security</button>
                </div>
              ) : null}
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {stockRows.map((row, index) => (
                  <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h4 className="text-sm font-semibold text-slate-900">Security #{index + 1}</h4>
                      <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100" onClick={() => {
                        removeRow<StockRow>('stocksAndBonds', row.id);
                        if (stockRows.length === 1) {
                          updateProgressChoice('hasStocksAndBonds', setStocksGate, 'no');
                          setArrayCount<StockRow>('stocksAndBonds', 0, () => ({ symbol: undefined, issuerName: '', numberOfShares: undefined, cost: undefined, marketValue: undefined, dateOfQuote: '', exchange: '' }));
                        }
                      }}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-4">
                        <FormField label="Number of shares">
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            value={row.numberOfShares ?? ''}
                            onChange={(e) => {
                              const nextShares = e.target.value === '' ? undefined : Number(e.target.value);
                              updateArrayRow<StockRow>('stocksAndBonds', row.id, 'numberOfShares', nextShares);
                            }}
                            placeholder="Enter number"
                          />
                        </FormField>
                        <FormField label="Name of security">
                          <div>
                            <div className="relative">
                              <Input
                                value={row.issuerName || ''}
                                onChange={(e) => {
                                  updateArrayRow<StockRow>('stocksAndBonds', row.id, 'issuerName', e.target.value);
                                  if (stockLookupEnabled) scheduleStockSearch(row.id, e.target.value);
                                }}
                                placeholder="Example: Apple Inc. or U.S. Treasury Bond"
                              />
                              {stockLookupEnabled && (stockSearchResults[row.id]?.length || stockSearchLoading[row.id]) ? (
                                <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow">
                                  {stockSearchLoading[row.id] ? (
                                    <div className="px-3 py-2 text-xs text-slate-500">Searching...</div>
                                  ) : (
                                    (stockSearchResults[row.id] || []).map((item) => (
                                      <button
                                        key={`${row.id}-${item.symbol}-${item.exchange}`}
                                        type="button"
                                        onClick={() => void onSelectSecuritySuggestion(row.id, item)}
                                        className="block w-full border-b border-slate-100 px-3 py-2 text-left text-xs hover:bg-slate-50"
                                      >
                                        <div className="font-semibold">{item.symbol}</div>
                                        <div className="text-slate-600">{item.description}</div>
                                        <div className="text-slate-500">{item.exchange}</div>
                                      </button>
                                    ))
                                  )}
                                </div>
                              ) : null}
                            </div>
                            {stockSearchError[row.id] ? <p className="text-xs text-red-600">{stockSearchError[row.id]}</p> : null}
                            {stockQuoteError[row.id] ? <p className="text-xs text-red-600">{stockQuoteError[row.id]}</p> : null}
                          </div>
                        </FormField>
                      </div>
                      <FormField label="Current market price per share/unit for this security">
                        <div>
                          <CurrencyInput compact value={row.marketValue} withDollarPrefix onValueChange={(v) => {
                            setStockManualOverride((prev) => ({ ...prev, [row.id]: true }));
                            updateArrayRow<StockRow>('stocksAndBonds', row.id, 'marketValue', v);
                          }} placeholder={USD_PLACEHOLDER} />
                          {stockQuoteByRow[row.id] ? <p className="mt-1 text-xs text-slate-500">Auto-filled. You can override to match your latest statement.</p> : null}
                        </div>
                      </FormField>
                      <FormField label="Exchange or source of quotation (optional)">
                        <Input value={row.exchange || ''} onChange={(e) => updateArrayRow<StockRow>('stocksAndBonds', row.id, 'exchange', e.target.value)} placeholder="Example: NASDAQ or Fidelity statement" />
                      </FormField>
                      <FormField label="Date of quotation">
                        <Input className="w-fit min-w-[11rem] max-w-full" type="date" value={row.dateOfQuote || ''} onChange={(e) => updateArrayRow<StockRow>('stocksAndBonds', row.id, 'dateOfQuote', e.target.value)} />
                      </FormField>
                      {row.numberOfShares != null && row.marketValue != null ? (
                        <FormField label="Total value (auto)">
                          <Input disabled value={`$${Math.round(Number(row.numberOfShares) * Number(row.marketValue)).toLocaleString()}`} />
                        </FormField>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">Total stocks and bonds value auto-calculated: ${derivedStocksTotal.toLocaleString()}</p>
            </div>

            <div className="order-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Vehicle details</h3>
              <p className="mt-1 text-sm text-slate-600">How many vehicles do you personally own?</p>
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
                {SHORT_COUNT_OPTIONS.map((count) => (
                  <button
                    key={`vehicles-${count}`}
                    type="button"
                    onClick={() => {
                      updateForm('progressState.vehicleCountChosen', true);
                      setArrayCount<VehicleRow>('vehiclesOwned', count, () => ({ year: undefined, make: '', model: '', description: '', currentEstimatedValue: undefined, loanBalance: undefined, monthlyPayment: undefined }));
                    }}
                    className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold transition ${
                      vehicleRows.length === count ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">Total vehicle value auto-calculated: ${derivedVehicleTotal.toLocaleString()}</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {vehicleRows.map((row, index) => (
                  <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h4 className="text-sm font-semibold text-slate-900">Vehicle #{index + 1}</h4>
                      <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100" onClick={() => removeRow<VehicleRow>('vehiclesOwned', row.id)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                    <div className="space-y-4">
                      <FormField label="Year">
                        <Input type="number" min={1886} max={2100} value={row.year ?? ''} onChange={(e) => updateArrayRow<VehicleRow>('vehiclesOwned', row.id, 'year', e.target.value === '' ? undefined : Number(e.target.value))} placeholder="Example: 2021" />
                      </FormField>
                      <FormField label="Make">
                        <Input value={row.make || ''} onChange={(e) => updateArrayRow<VehicleRow>('vehiclesOwned', row.id, 'make', e.target.value)} placeholder="Example: Toyota" />
                      </FormField>
                      <FormField label="Model">
                        <Input value={row.model || ''} onChange={(e) => updateArrayRow<VehicleRow>('vehiclesOwned', row.id, 'model', e.target.value)} placeholder="Example: Camry" />
                      </FormField>
                      <FormField label="Current estimated value">
                        <CurrencyInput compact value={row.currentEstimatedValue} withDollarPrefix onValueChange={(v) => updateArrayRow<VehicleRow>('vehiclesOwned', row.id, 'currentEstimatedValue', v)} placeholder={USD_PLACEHOLDER} />
                      </FormField>
                      <FormField label="Loan balance owed (if any)">
                        <CurrencyInput compact value={row.loanBalance} withDollarPrefix onValueChange={(v) => updateArrayRow<VehicleRow>('vehiclesOwned', row.id, 'loanBalance', v)} placeholder={USD_PLACEHOLDER} />
                      </FormField>
                      <FormField label="Monthly payment (if any)">
                        <CurrencyInput compact value={row.monthlyPayment} withDollarPrefix onValueChange={(v) => updateArrayRow<VehicleRow>('vehiclesOwned', row.id, 'monthlyPayment', v)} placeholder={USD_PLACEHOLDER} />
                      </FormField>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-7 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Other personal assets</h3>
              <div className="mt-4 space-y-6">
                <FormField htmlFor="assets.personalProperty" label="Valuable Personal Items (Physical Property)" error={errors['assets.personalProperty']} help="Include gold, silver, jewelry, artwork, collectibles, boats, firearms, antiques, and other high-value personal items not already listed above. Do not include vehicles, real estate, stocks, retirement accounts, or normal household goods. Enter the total estimated resale value. If none, enter 0.">
                  <CurrencyInput compact value={form.assets.personalProperty} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateForm('assets.personalProperty', v)} />
                </FormField>
                <FormField htmlFor="assets.otherAssets" label="Other Financial or Miscellaneous Assets" error={errors['assets.otherAssets']} help="Include cryptocurrency, annuities, trust interests, royalties, tax refunds owed to you, escrow funds, and other financial assets not listed above. Do not include cash, retirement accounts, stocks, or money owed to you. Enter the total value. If none, enter 0.">
                  <CurrencyInput compact value={form.assets.otherAssets} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateForm('assets.otherAssets', v)} />
                </FormField>
              </div>
            </div>
          </div>
        </section>
      )}

      {stepIndex === 2 && (
        <section className={sectionCardClassName}>
          {stepTabs}
          <h2 className="text-xl font-bold text-slate-900">Personal Debts & Financial Obligations</h2>
          <p className="mt-1 text-sm text-slate-600">Tell us about any money you currently owe. We auto-map this to SBA Form 413 categories behind the scenes.</p>

          <div className="mt-6 space-y-6">
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">1) Credit cards</h3>
              <p className="mt-1 text-sm text-slate-600">Enter your total outstanding credit card balance across all personal credit cards.</p>
              <div className="mt-4 max-w-sm">
                <FormField htmlFor="liabilities.creditCards" label="Current balance" error={errors['liabilities.creditCards']}>
                  <CurrencyInput compact value={form.liabilityDetails?.creditCards?.totalBalance} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateForm('liabilityDetails.creditCards.totalBalance', v)} />
                </FormField>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">2) Student loans</h3>
              <p className="mt-1 text-sm text-slate-600">Do you have any student loans? If yes, enter the combined totals for all of them, not each loan separately.</p>
              <div className="mt-3 grid max-w-md grid-cols-2 gap-2">
                {[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ].map((option) => (
                  <button
                    key={`student-loans-${option.value}`}
                    type="button"
                    onClick={() => {
                      updateForm('liabilityDetails.studentLoans.hasLoans', option.value);
                      if (option.value === 'no') {
                        updateForm('liabilityDetails.studentLoans.totalBalance', 0);
                        updateForm('liabilityDetails.studentLoans.totalMonthlyPayment', 0);
                      }
                    }}
                    className={`h-10 rounded-lg border px-3 text-sm font-semibold transition ${
                      form.liabilityDetails?.studentLoans?.hasLoans === option.value
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {errors['liabilityDetails.studentLoans.hasLoans'] ? (
                <p className="mt-2 text-xs text-red-600">{errors['liabilityDetails.studentLoans.hasLoans']}</p>
              ) : null}
              {form.liabilityDetails?.studentLoans?.hasLoans === 'yes' ? (
                <div className="mt-4 flex max-w-2xl flex-col gap-4 sm:flex-row">
                  <div className="flex-1">
                    <FormField htmlFor="liabilities.studentLoans" label="Combined current balance for all student loans" error={errors['liabilities.studentLoans']}>
                      <CurrencyInput value={form.liabilityDetails?.studentLoans?.totalBalance} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateForm('liabilityDetails.studentLoans.totalBalance', v)} />
                    </FormField>
                  </div>
                  <div className="flex-1">
                    <FormField htmlFor="liabilityDetails.studentLoans.totalMonthlyPayment" label="Combined monthly payment for all student loans" labelClassName="whitespace-nowrap" error={errors['liabilityDetails.studentLoans.totalMonthlyPayment']}>
                      <CurrencyInput value={form.liabilityDetails?.studentLoans?.totalMonthlyPayment} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateForm('liabilityDetails.studentLoans.totalMonthlyPayment', v)} />
                    </FormField>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">3) Personal loans or bank loans</h3>
              <p className="mt-2 text-sm text-slate-600">Do you have any personal bank loans, lines of credit, or personal loans?</p>
              <div className="mt-4 grid max-w-md grid-cols-2 gap-2">
                {[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ].map((option) => (
                  <button
                    key={`personal-loans-${option.value}`}
                    type="button"
                    onClick={() => {
                      updateForm('liabilityDetails.hasPersonalLoans', option.value);
                      if (option.value === 'no') {
                        updateForm('liabilityDetails.personalLoans', []);
                      }
                      if (option.value === 'yes' && personalLoanRows.length === 0) {
                        addLiabilityRow('personalLoans', {
                          loanType: undefined,
                          lenderName: '',
                          originalBalance: undefined,
                          currentBalance: undefined,
                          monthlyPayment: undefined,
                          isSecured: undefined,
                          collateralType: undefined,
                          collateralDescription: '',
                        });
                      }
                    }}
                    className={`h-10 rounded-lg border px-3 text-sm font-semibold transition ${
                      form.liabilityDetails?.hasPersonalLoans === option.value
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {form.liabilityDetails?.hasPersonalLoans === 'yes' ? (
                <>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {personalLoanRows.map((row, index) => (
                      <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h4 className="text-sm font-semibold text-slate-900">Loan #{index + 1}</h4>
                          <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100" onClick={() => {
                            removeLiabilityRow('personalLoans', row.id);
                            if (personalLoanRows.length === 1) {
                              updateForm('liabilityDetails.hasPersonalLoans', 'no');
                            }
                          }}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                        <div className="space-y-4">
                          <FormField label="Loan type" error={errors[`liabilityDetails.personalLoans.${index}.loanType`]}>
                            <select
                              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                              value={row.loanType || ''}
                              onChange={(e) => {
                                const nextLoanType = (e.target.value || undefined) as LiabilityPersonalLoanRow['loanType'];
                                updateLiabilityArrayRow('personalLoans', row.id, 'loanType', nextLoanType);
                                if (nextLoanType === 'heloc') {
                                  updateLiabilityArrayRow('personalLoans', row.id, 'isSecured', 'yes');
                                  updateLiabilityArrayRow('personalLoans', row.id, 'collateralType', 'real_estate');
                                }
                              }}
                            >
                              <option value="">Select loan type</option>
                              {PERSONAL_LOAN_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </FormField>
                          <FormField label="Lender name">
                            <Input value={row.lenderName || ''} onChange={(e) => updateLiabilityArrayRow('personalLoans', row.id, 'lenderName', e.target.value)} placeholder="Example: Chase Bank" />
                          </FormField>
                          <div className="grid gap-4 sm:grid-cols-3">
                            <FormField label={getPersonalLoanOriginalBalanceLabel(row.loanType)} error={errors[`liabilityDetails.personalLoans.${index}.originalBalance`]}>
                              <CurrencyInput value={row.originalBalance} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateLiabilityArrayRow('personalLoans', row.id, 'originalBalance', v)} />
                            </FormField>
                            <FormField label="Current balance" error={errors[`liabilityDetails.personalLoans.${index}.currentBalance`]}>
                              <CurrencyInput value={row.currentBalance} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateLiabilityArrayRow('personalLoans', row.id, 'currentBalance', v)} />
                            </FormField>
                            <FormField label="Monthly payment" error={errors[`liabilityDetails.personalLoans.${index}.monthlyPayment`]}>
                              <CurrencyInput value={row.monthlyPayment} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateLiabilityArrayRow('personalLoans', row.id, 'monthlyPayment', v)} />
                            </FormField>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <FormField
                              label={getPersonalLoanSecuredQuestion(row.loanType)}
                              help={getPersonalLoanSecuredHelp(row.loanType)}
                              error={errors[`liabilityDetails.personalLoans.${index}.isSecured`]}
                            >
                              {row.loanType === 'heloc' ? (
                                <Input value="Yes" disabled className="bg-slate-100 text-slate-600" />
                              ) : (
                                <YesNoToggle
                                  value={row.isSecured}
                                  onChange={(value) => {
                                    updateLiabilityArrayRow('personalLoans', row.id, 'isSecured', value);
                                    if (value === 'no') {
                                      updateLiabilityArrayRow('personalLoans', row.id, 'collateralType', undefined);
                                      updateLiabilityArrayRow('personalLoans', row.id, 'collateralDescription', '');
                                    }
                                  }}
                                />
                              )}
                            </FormField>

                            {(row.loanType === 'heloc' || row.isSecured === 'yes') ? (
                              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <FormField label="Collateral type" error={errors[`liabilityDetails.personalLoans.${index}.collateralType`]}>
                                  <select
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    value={row.collateralType || ''}
                                    onChange={(e) => updateLiabilityArrayRow('personalLoans', row.id, 'collateralType', e.target.value || undefined)}
                                  >
                                    <option value="">Select collateral type</option>
                                    {COLLATERAL_TYPE_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </FormField>
                                <FormField label={row.loanType === 'heloc' ? 'Property or collateral description (optional)' : 'Describe collateral (optional)'}>
                                  <Input
                                    value={row.collateralDescription || ''}
                                    onChange={(e) => updateLiabilityArrayRow('personalLoans', row.id, 'collateralDescription', e.target.value)}
                                    placeholder={row.loanType === 'heloc' ? 'Example: Primary residence' : 'Example: 2020 Toyota Tacoma'}
                                  />
                                </FormField>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-4 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
                    onClick={() =>
                      addLiabilityRow('personalLoans', {
                        loanType: undefined,
                        lenderName: '',
                        originalBalance: undefined,
                        currentBalance: undefined,
                        monthlyPayment: undefined,
                        isSecured: undefined,
                        collateralType: undefined,
                        collateralDescription: '',
                      })
                    }
                  >
                    + Add personal/bank loan
                  </button>
                </>
              ) : null}
              <p className="mt-2 text-xs text-slate-500">Total personal/bank loan balance: ${derivedPersonalLoansBalanceTotal.toLocaleString()} | Monthly: ${derivedPersonalLoansMonthlyTotal.toLocaleString()}</p>
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">4) Medical bills or other unpaid personal bills</h3>
              <p className="mt-1 text-sm text-slate-600">Enter the combined total you owe for all medical bills or other unpaid personal bills.</p>
              <div className="mt-4 max-w-sm">
                <FormField htmlFor="liabilityDetails.medicalBills.totalBalance" label="Combined total balance owed" error={errors['liabilityDetails.medicalBills.totalBalance']}>
                  <CurrencyInput compact value={form.liabilityDetails?.medicalBills?.totalBalance} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => {
                    updateForm('liabilityDetails.medicalBills.totalBalance', v);
                    updateForm('liabilityDetails.medicalBills.hasDebts', (v || 0) > 0 ? 'yes' : 'no');
                  }} />
                </FormField>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">5) Taxes owed</h3>
              <p className="mt-2 text-sm text-slate-600">
                Do you currently owe any unpaid federal, state, or local taxes right now? Use this for taxes
                that have already been filed, assessed, billed, or put on a payment plan.
              </p>
              <div className="mt-4 grid max-w-md grid-cols-2 gap-2">
                {[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ].map((option) => (
                  <button
                    key={`taxes-owed-${option.value}`}
                    type="button"
                    onClick={() => {
                      updateForm('liabilityDetails.hasTaxesOwed', option.value);
                      if (option.value === 'no') {
                        updateForm('liabilityDetails.taxesOwed', []);
                      }
                      if (option.value === 'yes' && taxRows.length === 0) {
                        addLiabilityRow('taxesOwed', {
                          authority: '',
                          originalBalance: undefined,
                          balanceOwed: undefined,
                          monthlyPayment: undefined,
                        });
                      }
                    }}
                    className={`h-10 rounded-lg border px-3 text-sm font-semibold transition ${
                      form.liabilityDetails?.hasTaxesOwed === option.value
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {form.liabilityDetails?.hasTaxesOwed === 'yes' ? (
                <>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {taxRows.map((row, index) => (
                      <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h4 className="text-sm font-semibold text-slate-900">Tax Item #{index + 1}</h4>
                          <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100" onClick={() => {
                            removeLiabilityRow('taxesOwed', row.id);
                            if (taxRows.length === 1) {
                              updateForm('liabilityDetails.hasTaxesOwed', 'no');
                            }
                          }}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                        <div className="space-y-4">
                          <FormField label="Authority" error={errors[`liabilityDetails.taxesOwed.${index}.authority`]}>
                            <Input value={row.authority || ''} onChange={(e) => updateLiabilityArrayRow('taxesOwed', row.id, 'authority', e.target.value)} placeholder="Example: IRS or CA FTB" />
                          </FormField>
                          <div className="grid gap-4 sm:grid-cols-3">
                            <FormField label="Original amount first assessed or billed" error={errors[`liabilityDetails.taxesOwed.${index}.originalBalance`]}>
                              <CurrencyInput value={row.originalBalance} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateLiabilityArrayRow('taxesOwed', row.id, 'originalBalance', v)} />
                            </FormField>
                            <FormField label="Current balance still owed" error={errors[`liabilityDetails.taxesOwed.${index}.balanceOwed`]}>
                              <CurrencyInput value={row.balanceOwed} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateLiabilityArrayRow('taxesOwed', row.id, 'balanceOwed', v)} />
                            </FormField>
                            <FormField label="Monthly payment (enter $0 if none)" error={errors[`liabilityDetails.taxesOwed.${index}.monthlyPayment`]}>
                              <CurrencyInput value={row.monthlyPayment} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateLiabilityArrayRow('taxesOwed', row.id, 'monthlyPayment', v)} />
                            </FormField>
                          </div>
                          <p className="text-xs text-slate-500">
                            Enter the original amount that was first billed or assessed, then the balance you still owe today. If you are not on a payment plan, enter $0 for monthly payment.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-4 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
                    onClick={() =>
                      addLiabilityRow('taxesOwed', {
                        authority: '',
                        originalBalance: undefined,
                        balanceOwed: undefined,
                        monthlyPayment: undefined,
                      })
                    }
                  >
                    + Add tax item
                  </button>
                </>
              ) : null}
              <p className="mt-2 text-xs text-slate-500">Total taxes owed: ${derivedTaxesBalanceTotal.toLocaleString()} | Monthly: ${derivedTaxesMonthlyTotal.toLocaleString()}</p>
            </section>

            {hasLifeInsuranceLoans ? (
              <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-lg font-semibold text-slate-900">6) Loans against life insurance</h3>
                <p className="mt-2 text-sm text-slate-600">Pulled automatically from your life insurance section based on the current loan balance against any policy pledged as collateral.</p>
                <p className="mt-2 text-xs text-slate-500">Auto-collected: ${derivedLifeInsurancePledgedTotal.toLocaleString()}</p>
              </section>
            ) : null}

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">{hasLifeInsuranceLoans ? '7) Other financial obligations' : '6) Other financial obligations'}</h3>
              <p className="mt-2 text-sm text-slate-600">
                Do you have other required payments or obligations not already listed above, such as child support,
                alimony, court-ordered payments, settlement agreements, or other recurring debts?
              </p>
              <div className="mt-4 grid max-w-md grid-cols-2 gap-2">
                {[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ].map((option) => (
                  <button
                    key={`other-obligations-${option.value}`}
                    type="button"
                    onClick={() => {
                      updateForm('liabilityDetails.hasOtherObligations', option.value);
                      if (option.value === 'no') {
                        updateForm('liabilityDetails.otherObligations', []);
                      }
                      if (option.value === 'yes' && otherObligationRows.length === 0) {
                        addLiabilityRow('otherObligations', { description: '', amountOwed: undefined, monthlyPayment: undefined });
                      }
                    }}
                    className={`h-10 rounded-lg border px-3 text-sm font-semibold transition ${
                      form.liabilityDetails?.hasOtherObligations === option.value
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {form.liabilityDetails?.hasOtherObligations === 'yes' ? (
                <>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {otherObligationRows.map((row, index) => (
                      <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h4 className="text-sm font-semibold text-slate-900">Other Obligation #{index + 1}</h4>
                          <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100" onClick={() => {
                            removeLiabilityRow('otherObligations', row.id);
                            if (otherObligationRows.length === 1) {
                              updateForm('liabilityDetails.hasOtherObligations', 'no');
                            }
                          }}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                        <div className="space-y-4">
                          <FormField label="Description">
                            <Input value={row.description || ''} onChange={(e) => updateLiabilityArrayRow('otherObligations', row.id, 'description', e.target.value)} placeholder="Description" />
                          </FormField>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <FormField label="Amount owed">
                              <CurrencyInput value={row.amountOwed} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateLiabilityArrayRow('otherObligations', row.id, 'amountOwed', v)} />
                            </FormField>
                            <FormField label="Monthly payment">
                              <CurrencyInput value={row.monthlyPayment} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateLiabilityArrayRow('otherObligations', row.id, 'monthlyPayment', v)} />
                            </FormField>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="mt-4 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold" onClick={() => addLiabilityRow('otherObligations', { description: '', amountOwed: undefined, monthlyPayment: undefined })}>+ Add other obligation</button>
                </>
              ) : null}
              <p className="mt-2 text-xs text-slate-500">Total other obligations: ${derivedOtherObligationsBalanceTotal.toLocaleString()} | Monthly: ${derivedOtherObligationsMonthlyTotal.toLocaleString()}</p>
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Potential Future Financial Obligations</h3>
              <p className="mt-1 text-sm text-slate-600">These are legal or contractual obligations you could become responsible for, even if you are not currently making payments.</p>

              <div className="mt-4 space-y-5">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Have you co-signed or personally guaranteed a loan for someone else?</p>
                  <p className="mt-1 text-xs text-slate-600">For example: co-signing a car loan, mortgage, student loan, or business loan.</p>
                  <div className="mt-3 grid max-w-xs grid-cols-2 gap-2">
                    {(['yes', 'no'] as const).map((option) => (
                      <button
                        key={`contingent-cosigner-${option}`}
                        type="button"
                        onClick={() => {
                          updateForm('contingentLiabilities.asEndorserOrCoMaker.hasExposure', option);
                          if (option === 'no') updateForm('contingentLiabilities.asEndorserOrCoMaker.estimatedAmount', 0);
                        }}
                        className={`h-10 rounded-lg border px-3 text-sm font-semibold transition ${
                          form.contingentLiabilities?.asEndorserOrCoMaker?.hasExposure === option
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {option === 'yes' ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </div>
                  {form.contingentLiabilities?.asEndorserOrCoMaker?.hasExposure === 'yes' ? (
                    <div className="mt-3 max-w-sm">
                      <FormField label="Remaining balance on co-signed/guaranteed loan">
                        <CurrencyInput compact value={form.contingentLiabilities?.asEndorserOrCoMaker?.estimatedAmount} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateForm('contingentLiabilities.asEndorserOrCoMaker.estimatedAmount', v)} />
                      </FormField>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Are you currently being sued, involved in a legal dispute, or subject to a court judgment that could require payment?</p>
                  <div className="mt-3 grid max-w-xs grid-cols-2 gap-2">
                    {(['yes', 'no'] as const).map((option) => (
                      <button
                        key={`contingent-legal-${option}`}
                        type="button"
                        onClick={() => {
                          updateForm('contingentLiabilities.legalClaimsAndJudgments.hasExposure', option);
                          if (option === 'no') updateForm('contingentLiabilities.legalClaimsAndJudgments.estimatedAmount', 0);
                        }}
                        className={`h-10 rounded-lg border px-3 text-sm font-semibold transition ${
                          form.contingentLiabilities?.legalClaimsAndJudgments?.hasExposure === option
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {option === 'yes' ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </div>
                  {form.contingentLiabilities?.legalClaimsAndJudgments?.hasExposure === 'yes' ? (
                    <div className="mt-3 max-w-sm">
                      <FormField label="Estimated amount you could be required to pay">
                        <CurrencyInput compact value={form.contingentLiabilities?.legalClaimsAndJudgments?.estimatedAmount} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateForm('contingentLiabilities.legalClaimsAndJudgments.estimatedAmount', v)} />
                      </FormField>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Do you expect to owe federal income taxes for a recent year that are not yet filed,
                    assessed, or billed?
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    This is for estimated federal taxes you likely will owe in the future. Do not include taxes
                    you already owe today and entered above in section 5.
                  </p>
                  <div className="mt-3 grid max-w-xs grid-cols-2 gap-2">
                    {(['yes', 'no'] as const).map((option) => (
                      <button
                        key={`contingent-federal-tax-${option}`}
                        type="button"
                        onClick={() => {
                          updateForm('contingentLiabilities.provisionForFederalIncomeTax.hasExposure', option);
                          if (option === 'no') updateForm('contingentLiabilities.provisionForFederalIncomeTax.estimatedAmount', 0);
                        }}
                        className={`h-10 rounded-lg border px-3 text-sm font-semibold transition ${
                          form.contingentLiabilities?.provisionForFederalIncomeTax?.hasExposure === option
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {option === 'yes' ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </div>
                  {form.contingentLiabilities?.provisionForFederalIncomeTax?.hasExposure === 'yes' ? (
                    <div className="mt-3 max-w-sm">
                      <FormField label="Estimated federal tax amount you expect to owe">
                        <CurrencyInput compact value={form.contingentLiabilities?.provisionForFederalIncomeTax?.estimatedAmount} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateForm('contingentLiabilities.provisionForFederalIncomeTax.estimatedAmount', v)} />
                      </FormField>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Do you have any other payment obligations not already listed above that you may be required to pay later?
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Examples: a personal guarantee you signed, a court-ordered payment, a settlement you agreed to pay,
                    or another contract that could make you responsible for future payments.
                  </p>
                  <div className="mt-3 grid max-w-xs grid-cols-2 gap-2">
                    {(['yes', 'no'] as const).map((option) => (
                      <button
                        key={`contingent-other-${option}`}
                        type="button"
                        onClick={() => {
                          updateForm('contingentLiabilities.otherSpecialDebt.hasExposure', option);
                          if (option === 'no') updateForm('contingentLiabilities.otherSpecialDebt.estimatedAmount', 0);
                        }}
                        className={`h-10 rounded-lg border px-3 text-sm font-semibold transition ${
                          form.contingentLiabilities?.otherSpecialDebt?.hasExposure === option
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {option === 'yes' ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </div>
                  {form.contingentLiabilities?.otherSpecialDebt?.hasExposure === 'yes' ? (
                    <div className="mt-3 max-w-sm">
                      <FormField label="Estimated amount">
                        <CurrencyInput compact value={form.contingentLiabilities?.otherSpecialDebt?.estimatedAmount} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateForm('contingentLiabilities.otherSpecialDebt.estimatedAmount', v)} />
                      </FormField>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </div>

        </section>
      )}

      {stepIndex === 3 && (
        <section className={sectionCardClassName}>
          {stepTabs}
          <h2 className="text-xl font-bold text-slate-900">Personal Income & Additional Details</h2>
          <p className="mt-1 text-sm text-slate-600">Enter your average monthly income. For employment, enter the amount before personal taxes. For rental and investments, enter the amount after expenses.</p>

          <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="space-y-5">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Do you currently earn income from employment?</p>
                <p className="mt-1 text-xs text-slate-600">Include salary, wages, commissions, and bonuses before taxes.</p>
                <div className="mt-3 grid max-w-xs grid-cols-2 gap-2">
                  {(['yes', 'no'] as const).map((option) => (
                    <button
                      key={`income-employment-${option}`}
                      type="button"
                      onClick={() => {
                        updateForm('incomeDetails.employmentIncome.hasIncome', option);
                        if (option === 'no') updateForm('incomeDetails.employmentIncome.averageGrossMonthlyIncome', 0);
                      }}
                      className={`h-10 rounded-lg border px-3 text-sm font-semibold transition ${
                        form.incomeDetails?.employmentIncome?.hasIncome === option
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {option === 'yes' ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
                {errors['incomeDetails.employmentIncome.hasIncome'] ? (
                  <p className="mt-2 text-xs text-red-600">{errors['incomeDetails.employmentIncome.hasIncome']}</p>
                ) : null}
                {form.incomeDetails?.employmentIncome?.hasIncome === 'yes' ? (
                  <div className="mt-3 w-full">
                    <p className="mb-2 text-xs text-slate-600">Enter the amount you earn each month before taxes are deducted.</p>
                    <FormField label="How much do you earn per month before taxes?" error={errors['incomeDetails.employmentIncome.averageGrossMonthlyIncome']}>
                      <CurrencyInput compact value={form.incomeDetails?.employmentIncome?.averageGrossMonthlyIncome} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateForm('incomeDetails.employmentIncome.averageGrossMonthlyIncome', v)} />
                    </FormField>
                  </div>
                ) : null}
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Do you receive income from rental properties?</p>
                <p className="mt-1 text-xs text-slate-600">After mortgage, taxes, insurance, and other property expenses.</p>
                <div className="mt-3 grid max-w-xs grid-cols-2 gap-2">
                  {(['yes', 'no'] as const).map((option) => (
                    <button
                      key={`income-rental-${option}`}
                      type="button"
                      onClick={() => {
                        updateForm('incomeDetails.rentalIncome.hasIncome', option);
                        if (option === 'no') updateForm('incomeDetails.rentalIncome.averageNetMonthlyIncome', 0);
                      }}
                      className={`h-10 rounded-lg border px-3 text-sm font-semibold transition ${
                        form.incomeDetails?.rentalIncome?.hasIncome === option
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {option === 'yes' ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
                {errors['incomeDetails.rentalIncome.hasIncome'] ? (
                  <p className="mt-2 text-xs text-red-600">{errors['incomeDetails.rentalIncome.hasIncome']}</p>
                ) : null}
                {form.incomeDetails?.rentalIncome?.hasIncome === 'yes' ? (
                  <div className="mt-3 w-full">
                    <p className="mb-2 text-xs text-slate-600">Enter the amount you keep each month after property expenses.</p>
                    <FormField label="How much do you keep per month after rental expenses?" error={errors['incomeDetails.rentalIncome.averageNetMonthlyIncome']}>
                      <CurrencyInput compact value={form.incomeDetails?.rentalIncome?.averageNetMonthlyIncome} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateForm('incomeDetails.rentalIncome.averageNetMonthlyIncome', v)} />
                    </FormField>
                  </div>
                ) : null}
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Do you receive income from investments?</p>
                <p className="mt-1 text-xs text-slate-600">Include dividends, interest, or income from stocks, bonds, or notes.</p>
                <div className="mt-3 grid max-w-xs grid-cols-2 gap-2">
                  {(['yes', 'no'] as const).map((option) => (
                    <button
                      key={`income-investment-${option}`}
                      type="button"
                      onClick={() => {
                        updateForm('incomeDetails.investmentIncome.hasIncome', option);
                        if (option === 'no') updateForm('incomeDetails.investmentIncome.averageNetMonthlyIncome', 0);
                      }}
                      className={`h-10 rounded-lg border px-3 text-sm font-semibold transition ${
                        form.incomeDetails?.investmentIncome?.hasIncome === option
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {option === 'yes' ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
                {errors['incomeDetails.investmentIncome.hasIncome'] ? (
                  <p className="mt-2 text-xs text-red-600">{errors['incomeDetails.investmentIncome.hasIncome']}</p>
                ) : null}
                {form.incomeDetails?.investmentIncome?.hasIncome === 'yes' ? (
                  <div className="mt-3 w-full">
                    <p className="mb-2 text-xs text-slate-600">Enter the investment income you keep each month after expenses.</p>
                    <FormField label="How much investment income do you receive per month after expenses?" error={errors['incomeDetails.investmentIncome.averageNetMonthlyIncome']}>
                      <CurrencyInput compact value={form.incomeDetails?.investmentIncome?.averageNetMonthlyIncome} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateForm('incomeDetails.investmentIncome.averageNetMonthlyIncome', v)} />
                    </FormField>
                  </div>
                ) : null}
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Do you receive money each month from other sources not already listed above?
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Examples: Social Security, pension, disability, trust distributions, annuity income,
                  child support or alimony you want counted, side consulting, gig work, or other regular payments.
                </p>
                <div className="mt-3 grid max-w-xs grid-cols-2 gap-2">
                  {(['yes', 'no'] as const).map((option) => (
                    <button
                      key={`income-other-${option}`}
                      type="button"
                      onClick={() => {
                        updateForm('incomeDetails.otherIncome.hasIncome', option);
                        if (option === 'no') {
                          updateForm('incomeDetails.otherIncome.averageMonthlyIncome', 0);
                          updateForm('incomeDetails.otherIncome.description', '');
                        }
                      }}
                      className={`h-10 rounded-lg border px-3 text-sm font-semibold transition ${
                        form.incomeDetails?.otherIncome?.hasIncome === option
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {option === 'yes' ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
                {errors['incomeDetails.otherIncome.hasIncome'] ? (
                  <p className="mt-2 text-xs text-red-600">{errors['incomeDetails.otherIncome.hasIncome']}</p>
                ) : null}
                {form.incomeDetails?.otherIncome?.hasIncome === 'yes' ? (
                  <div className="mt-3 w-full">
                    <FormField label="How much do you receive per month from these other income sources?" error={errors['incomeDetails.otherIncome.averageMonthlyIncome']}>
                      <CurrencyInput compact value={form.incomeDetails?.otherIncome?.averageMonthlyIncome} withDollarPrefix placeholder={USD_PLACEHOLDER} onValueChange={(v) => updateForm('incomeDetails.otherIncome.averageMonthlyIncome', v)} />
                    </FormField>
                    <FormField
                      label="Describe these other income sources (required)"
                      error={errors['incomeDetails.otherIncome.description']}
                      help="Explain what the income is, how often you receive it, and whether it is ongoing. Child support or alimony should only be included if you want it counted toward your income."
                    >
                      <Input value={form.incomeDetails?.otherIncome?.description || ''} onChange={(e) => updateForm('incomeDetails.otherIncome.description', e.target.value)} placeholder="Example: Social Security received monthly, pension, trust distribution, or side consulting income" />
                    </FormField>
                  </div>
                ) : null}
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">Total Monthly Income: ${((form.incomeDetails?.employmentIncome?.hasIncome === 'yes' ? (form.incomeDetails?.employmentIncome?.averageGrossMonthlyIncome || 0) : 0) + (form.incomeDetails?.rentalIncome?.hasIncome === 'yes' ? (form.incomeDetails?.rentalIncome?.averageNetMonthlyIncome || 0) : 0) + (form.incomeDetails?.investmentIncome?.hasIncome === 'yes' ? (form.incomeDetails?.investmentIncome?.averageNetMonthlyIncome || 0) : 0) + (form.incomeDetails?.otherIncome?.hasIncome === 'yes' ? (form.incomeDetails?.otherIncome?.averageMonthlyIncome || 0) : 0)).toLocaleString()}</p>
          </section>

        </section>
      )}

      {stepIndex === 4 && reviewUnlocked && (
        <section className={sectionCardClassName}>
          {stepTabs}
          <h2 className="text-xl font-bold text-slate-900">Review and generate</h2>
          <p className="mt-1 text-sm text-slate-600">Quick check before generating your lender-ready PDF.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-green-50 p-4">
              <div className="text-sm font-semibold text-green-700">Total Assets</div>
              <div className="text-2xl font-bold text-green-800">${totalAssets.toLocaleString()}</div>
            </div>
            <div className="rounded-xl bg-red-50 p-4">
              <div className="text-sm font-semibold text-red-700">Total Liabilities</div>
              <div className="text-2xl font-bold text-red-800">${totalLiabilities.toLocaleString()}</div>
            </div>
            <div className={`rounded-xl p-4 ${netWorth >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <div className={`text-sm font-semibold ${netWorth >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net Position</div>
              <div className={`text-2xl font-bold ${netWorth >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>{netWorth >= 0 ? '$' : '-$'}{Math.abs(netWorth).toLocaleString()}</div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-100 p-2 sm:p-3">
            <div className="mx-auto w-full max-w-[816px] bg-white shadow-lg">
              <SBAForm413SvgTemplate data={previewData} />
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                checked={previewConfirmed}
                disabled={!reviewUnlocked}
                onChange={(event) => {
                  setPreviewConfirmed(event.target.checked);
                  updateForm('eSignature.attested', event.target.checked);
                }}
              />
              <span>
                I have reviewed all entered information and confirm it is true, complete, and accurate to the best of my knowledge.
              </span>
            </label>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FormField label="Type your full legal name for e-signature">
                <Input
                  value={signatureName}
                  onChange={(e) => {
                    setSignatureName(e.target.value);
                    updateForm('eSignature.fullName', e.target.value);
                  }}
                  placeholder={previewConfirmed ? 'Enter your full legal name' : 'Check the confirmation box first to enable e-signature'}
                  disabled={!previewConfirmed}
                />
              </FormField>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Signature Preview</div>
                <div
                  className={`mt-2 flex min-h-[78px] items-center overflow-visible border-b border-slate-300 pb-0 pl-6 pr-5 pt-1 ${signaturePreviewName ? signatureFont.className : ''} ${signaturePreviewName ? 'leading-[0.9] text-slate-900' : 'text-sm leading-6 text-slate-400'}`}
                  style={{
                    transform: signaturePreviewName ? 'translateY(-3px) skewX(-1deg) rotate(-0.15deg) scaleX(0.95)' : 'none',
                    letterSpacing: signaturePreviewName ? '-0.02em' : 'normal',
                    textShadow: 'none',
                    fontVariationSettings: signaturePreviewName ? '"wght" 400' : undefined,
                    fontFamily: signaturePreviewName ? signatureFontFamily : undefined,
                    fontStyle: signaturePreviewName ? 'italic' : 'normal',
                    fontSize: signaturePreviewName ? `${previewSignatureSize}px` : undefined,
                  }}
                >
                  {signaturePreviewName || (previewConfirmed ? 'Your signature will appear here as you type.' : 'Check the box above to enable your e-signature.')}
                </div>
              </div>
            </div>
          </div>

        </section>
      )}

      <section className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-600">Changes save automatically as you type. No manual save needed.</p>
              <div className={`text-sm font-semibold ${allSectionsComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
                {allSectionsComplete ? 'All sections are complete. Generate PDF when ready.' : 'Continue to the next step when ready.'}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBackStep}
                  disabled={!canGoBack}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Back
                </button>
              </div>
              <div className="flex items-center gap-4">
                {pdfUrl && (
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-700 underline hover:text-blue-900">
                    Open PDF
                  </a>
                )}
                {canGoNext ? (
                  <button
                    type="button"
                    onClick={handleContinueStep}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Continue
                  </button>
                ) : null}
                {stepIndex === 4 ? (
                  <button
                    type="button"
                    onClick={handleStickySubmit}
                    className={`rounded-lg px-5 py-2 text-sm font-semibold text-white ${
                      allSectionsComplete && previewConfirmed && signatureNameIsValid ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-400 hover:bg-slate-500'
                    }`}
                    disabled={!allSectionsComplete || !previewConfirmed || !signatureNameIsValid || loading}
                  >
                    {loading ? 'Generating PDF...' : 'Generate PDF'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
      {loading ? <PdfGenerationOverlay templateLabel="personal financial statement" /> : null}
    </TemplatePageShell>
  );
}
