import type { PersonalFinancialStatementData } from '@/lib/templates/types';

type YesNo = 'yes' | 'no';

export type PersonalFinancialStatementProgress = {
  answered: number;
  total: number;
  percent: number;
};

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

function resolveGate(
  explicitValue: YesNo | undefined,
  rows: unknown[] | undefined,
): YesNo | undefined {
  if (explicitValue) return explicitValue;
  if (Array.isArray(rows) && rows.length > 0) return 'yes';
  return undefined;
}

export function getPersonalFinancialStatementProgress(
  form: PersonalFinancialStatementData | null | undefined,
): PersonalFinancialStatementProgress {
  if (!form) {
    return { answered: 0, total: 0, percent: 0 };
  }

  let answered = 0;
  let total = 0;

  const track = (isAnswered: boolean) => {
    total += 1;
    if (isAnswered) answered += 1;
  };

  track(hasText(form.personalInfo?.name));
  track(hasText(form.personalInfo?.homeStreet));
  track(hasText(form.personalInfo?.homeCity));
  track(hasText(form.personalInfo?.homeState));
  track(hasText(form.personalInfo?.homeZip));

  track(hasNumber(form.assets?.cashChecking));
  track(hasNumber(form.assets?.cashSavings));
  track(hasNumber(form.assets?.personalProperty));
  track(hasNumber(form.assets?.otherAssets));

  const receivableGate = resolveGate(
    form.progressState?.hasAccountsAndNotesReceivable,
    form.accountsAndNotesReceivable,
  );
  track(Boolean(receivableGate));
  if (receivableGate === 'yes') {
    const rows = form.accountsAndNotesReceivable ?? [];
    track(rows.length > 0);
    rows.forEach((row) => {
      track(hasText(row.debtorName));
      track(hasNumber(row.originalAmountLoaned));
      track(hasNumber(row.currentBalanceOwed));
      track(hasNumber(row.monthlyPaymentReceived));
      track(Boolean(row.hasWrittenAgreement));
      track(Boolean(row.isSecuredByCollateral));
      if (row.isSecuredByCollateral === 'yes') {
        track(hasText(row.collateralDescription));
      }
    });
  }

  const retirementGate = resolveGate(
    form.progressState?.hasRetirementAccounts,
    form.retirementAccounts,
  );
  track(Boolean(retirementGate));
  if (retirementGate === 'yes') {
    const rows = form.retirementAccounts ?? [];
    track(rows.length > 0);
    rows.forEach((row) => {
      track(Boolean(row.accountType));
      track(hasText(row.institutionName));
      track(hasNumber(row.currentEstimatedValue));
      track(Boolean(row.pledgedAsCollateral));
      if (row.pledgedAsCollateral === 'yes') {
        track(hasNumber(row.lienAmount));
      }
    });
  }

  const lifeInsuranceGate = resolveGate(
    form.progressState?.hasLifeInsuranceCashValue,
    form.lifeInsuranceHeld,
  );
  track(Boolean(lifeInsuranceGate));
  if (lifeInsuranceGate === 'yes') {
    const rows = form.lifeInsuranceHeld ?? [];
    track(rows.length > 0);
    rows.forEach((row) => {
      track(hasText(row.companyName));
      track(Boolean(row.policyType));
      track(hasNumber(row.faceAmount));
      track(hasNumber(row.cashSurrenderValue));
      track(Boolean(row.pledgedAsCollateral));
      if (row.pledgedAsCollateral === 'yes') {
        track(hasNumber(row.loanAgainstPolicy));
      }
    });
  }

  const stocksGate = resolveGate(
    form.progressState?.hasStocksAndBonds,
    form.stocksAndBonds,
  );
  track(Boolean(stocksGate));
  if (stocksGate === 'yes') {
    const rows = form.stocksAndBonds ?? [];
    track(rows.length > 0);
    rows.forEach((row) => {
      track(hasText(row.issuerName) || hasText(row.symbol));
      track(hasNumber(row.marketValue));
    });
  }

  (form.realEstateOwned ?? []).forEach((row) => {
    track(Boolean(row.propertyType));
    track(hasText(row.propertyAddress));
    track(hasNumber(row.presentMarketValue));
    track(hasNumber(row.mortgageBalance));
    track(hasNumber(row.amountOfPaymentPerMonth));
  });

  (form.vehiclesOwned ?? []).forEach((row) => {
    track(hasText(row.make) || hasText(row.model) || hasNumber(row.year));
    track(hasNumber(row.currentEstimatedValue));
  });

  track(hasNumber(form.liabilityDetails?.creditCards?.totalBalance));
  track(Boolean(form.liabilityDetails?.studentLoans?.hasLoans));
  if (form.liabilityDetails?.studentLoans?.hasLoans === 'yes') {
    track(hasNumber(form.liabilityDetails.studentLoans.totalBalance));
    track(hasNumber(form.liabilityDetails.studentLoans.totalMonthlyPayment));
  }

  track(Boolean(form.liabilityDetails?.hasPersonalLoans));
  if (form.liabilityDetails?.hasPersonalLoans === 'yes') {
    const rows = form.liabilityDetails?.personalLoans ?? [];
    track(rows.length > 0);
    rows.forEach((row) => {
      track(hasText(row.lenderName));
      track(hasNumber(row.currentBalance));
      track(hasNumber(row.monthlyPayment));
    });
  }

  track(hasNumber(form.liabilityDetails?.medicalBills?.totalBalance));

  track(Boolean(form.liabilityDetails?.hasTaxesOwed));
  if (form.liabilityDetails?.hasTaxesOwed === 'yes') {
    const rows = form.liabilityDetails?.taxesOwed ?? [];
    track(rows.length > 0);
    rows.forEach((row) => {
      track(hasText(row.authority));
      track(hasNumber(row.balanceOwed));
      track(hasNumber(row.monthlyPayment));
    });
  }

  track(Boolean(form.liabilityDetails?.hasOtherObligations));
  if (form.liabilityDetails?.hasOtherObligations === 'yes') {
    const rows = form.liabilityDetails?.otherObligations ?? [];
    track(rows.length > 0);
    rows.forEach((row) => {
      track(hasText(row.description));
      track(hasNumber(row.amountOwed));
      track(hasNumber(row.monthlyPayment));
    });
  }

  const contingentKeys = [
    form.contingentLiabilities?.asEndorserOrCoMaker,
    form.contingentLiabilities?.legalClaimsAndJudgments,
    form.contingentLiabilities?.provisionForFederalIncomeTax,
    form.contingentLiabilities?.otherSpecialDebt,
  ];

  contingentKeys.forEach((item) => {
    track(Boolean(item?.hasExposure));
    if (item?.hasExposure === 'yes') {
      track(hasNumber(item.estimatedAmount));
    }
  });

  track(Boolean(form.incomeDetails?.employmentIncome?.hasIncome));
  if (form.incomeDetails?.employmentIncome?.hasIncome === 'yes') {
    track(hasNumber(form.incomeDetails.employmentIncome.averageGrossMonthlyIncome));
  }

  track(Boolean(form.incomeDetails?.rentalIncome?.hasIncome));
  if (form.incomeDetails?.rentalIncome?.hasIncome === 'yes') {
    track(hasNumber(form.incomeDetails.rentalIncome.averageNetMonthlyIncome));
  }

  track(Boolean(form.incomeDetails?.investmentIncome?.hasIncome));
  if (form.incomeDetails?.investmentIncome?.hasIncome === 'yes') {
    track(hasNumber(form.incomeDetails.investmentIncome.averageNetMonthlyIncome));
  }

  track(Boolean(form.incomeDetails?.otherIncome?.hasIncome));
  if (form.incomeDetails?.otherIncome?.hasIncome === 'yes') {
    track(hasNumber(form.incomeDetails.otherIncome.averageMonthlyIncome));
    track(hasText(form.incomeDetails.otherIncome.description));
  }

  const basePercent = total === 0 ? 0 : Math.round((answered / total) * 99);
  const isComplete = total > 0 && answered >= total;
  const percent = isComplete
    ? (form.eSignature?.attested ? 100 : 99)
    : basePercent;

  return { answered, total, percent };
}
