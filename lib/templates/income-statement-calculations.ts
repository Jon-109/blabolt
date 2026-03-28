import type { IncomeStatementData } from '@/lib/templates/types';

const zero = (value?: number) => value || 0;

type LegacyExpenses = NonNullable<IncomeStatementData['expenses']>;

function getLegacyExpenses(data: IncomeStatementData): LegacyExpenses {
  return data.expenses ?? {};
}

export function getIncomeStatementCogs(data: IncomeStatementData) {
  const legacy = getLegacyExpenses(data);
  return {
    inventoryMaterialsCost: data.cogs?.inventoryMaterialsCost ?? legacy.costOfGoodsSold,
    directLabor: data.cogs?.directLabor,
    shippingPackaging: data.cogs?.shippingPackaging,
    otherDirectCosts: data.cogs?.otherDirectCosts,
  };
}

export function getIncomeStatementOperatingExpenses(data: IncomeStatementData) {
  const legacy = getLegacyExpenses(data);
  const hasLegacyOther = legacy.otherExpenses != null || legacy.depreciation != null;

  return {
    payrollContractorPayments: data.operatingExpenses?.payrollContractorPayments ?? legacy.salariesWages,
    rentFacilityCosts: data.operatingExpenses?.rentFacilityCosts ?? legacy.rent,
    utilitiesInternet: data.operatingExpenses?.utilitiesInternet ?? legacy.utilities,
    marketingAdvertising: data.operatingExpenses?.marketingAdvertising ?? legacy.marketing,
    softwareSubscriptions: data.operatingExpenses?.softwareSubscriptions,
    professionalServices: data.operatingExpenses?.professionalServices,
    insurance: data.operatingExpenses?.insurance ?? legacy.insurance,
    officeAdministrative: data.operatingExpenses?.officeAdministrative,
    vehicleTravel: data.operatingExpenses?.vehicleTravel,
    otherOperatingExpenses:
      data.operatingExpenses?.otherOperatingExpenses ??
      (hasLegacyOther ? zero(legacy.otherExpenses) + zero(legacy.depreciation) : undefined),
  };
}

export function getIncomeStatementInterestExpense(data: IncomeStatementData) {
  return data.interestExpense ?? data.expenses?.interestExpense ?? 0;
}

export function getIncomeStatementTotals(data: IncomeStatementData) {
  const totalRevenue =
    zero(data.revenue.grossSales) +
    zero(data.revenue.serviceRevenue) +
    zero(data.revenue.otherRevenue);
  const cogs = getIncomeStatementCogs(data);
  const operatingExpenses = getIncomeStatementOperatingExpenses(data);
  const interestExpense = getIncomeStatementInterestExpense(data);

  const totalCogs =
    zero(cogs.inventoryMaterialsCost) +
    zero(cogs.directLabor) +
    zero(cogs.shippingPackaging) +
    zero(cogs.otherDirectCosts);
  const grossProfit = totalRevenue - totalCogs;
  const totalOperatingExpenses =
    zero(operatingExpenses.payrollContractorPayments) +
    zero(operatingExpenses.rentFacilityCosts) +
    zero(operatingExpenses.utilitiesInternet) +
    zero(operatingExpenses.marketingAdvertising) +
    zero(operatingExpenses.softwareSubscriptions) +
    zero(operatingExpenses.professionalServices) +
    zero(operatingExpenses.insurance) +
    zero(operatingExpenses.officeAdministrative) +
    zero(operatingExpenses.vehicleTravel) +
    zero(operatingExpenses.otherOperatingExpenses);
  const operatingProfit = grossProfit - totalOperatingExpenses;
  const netProfit = operatingProfit - zero(interestExpense);

  return {
    cogs,
    operatingExpenses,
    interestExpense,
    totalRevenue,
    totalCogs,
    grossProfit,
    totalOperatingExpenses,
    operatingProfit,
    netProfit,
  };
}
