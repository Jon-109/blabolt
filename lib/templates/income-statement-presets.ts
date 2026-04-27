import type { IncomeStatementData } from '@/lib/templates/types';
import { deriveIncomeStatementLabel, normalizeIncomeStatementType } from '@/lib/templates/income-statement-labels';

export const INCOME_STATEMENT_REQUIREMENT_KEYS = [
  'income_statement_annual_year_1',
  'income_statement_annual_year_2',
  'income_statement_ytd',
] as const;

export type IncomeStatementRequirementKey = (typeof INCOME_STATEMENT_REQUIREMENT_KEYS)[number];

export interface IncomeStatementPreset {
  requirementKey: IncomeStatementRequirementKey;
  templateSlot: number;
  statementType: 'annual' | 'ytd';
  periodStart: string;
  periodEnd: string;
  statementLabel: string;
}

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function todayIsoDate(now: Date) {
  return toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function buildIncomeStatementPresets(now = new Date()): IncomeStatementPreset[] {
  const currentYear = now.getFullYear();

  return [
    {
      requirementKey: 'income_statement_annual_year_1',
      templateSlot: 1,
      statementType: 'annual',
      periodStart: toIsoDate(currentYear - 1, 1, 1),
      periodEnd: toIsoDate(currentYear - 1, 12, 31),
      statementLabel: deriveIncomeStatementLabel({
        statementType: 'annual',
        periodEnd: toIsoDate(currentYear - 1, 12, 31),
      }),
    },
    {
      requirementKey: 'income_statement_annual_year_2',
      templateSlot: 2,
      statementType: 'annual',
      periodStart: toIsoDate(currentYear - 2, 1, 1),
      periodEnd: toIsoDate(currentYear - 2, 12, 31),
      statementLabel: deriveIncomeStatementLabel({
        statementType: 'annual',
        periodEnd: toIsoDate(currentYear - 2, 12, 31),
      }),
    },
    {
      requirementKey: 'income_statement_ytd',
      templateSlot: 3,
      statementType: 'ytd',
      periodStart: toIsoDate(currentYear, 1, 1),
      periodEnd: todayIsoDate(now),
      statementLabel: deriveIncomeStatementLabel({
        statementType: 'ytd',
        periodEnd: todayIsoDate(now),
      }),
    },
  ];
}

export function buildIncomeStatementFormFromPreset(
  preset: IncomeStatementPreset,
): IncomeStatementData {
  return {
    statementLabel: preset.statementLabel,
    statementType: preset.statementType,
    periodStart: preset.periodStart,
    periodEnd: preset.periodEnd,
    businessInfo: {
      name: '',
    },
    revenue: {},
    cogs: {},
    operatingExpenses: {},
    interestExpense: undefined,
    notes: '',
  };
}

export function matchesIncomeStatementPreset(
  formData: unknown,
  preset: IncomeStatementPreset,
): boolean {
  if (!formData || typeof formData !== 'object') {
    return false;
  }

  const row = formData as Record<string, unknown>;
  const periodStart = typeof row.periodStart === 'string' ? row.periodStart : '';
  const periodEnd = typeof row.periodEnd === 'string' ? row.periodEnd : '';
  const statementType = normalizeIncomeStatementType(
    typeof row.statementType === 'string' ? (row.statementType as IncomeStatementData['statementType']) : undefined,
    periodStart,
    periodEnd,
  );

  return (
    periodStart === preset.periodStart &&
    periodEnd === preset.periodEnd &&
    statementType === preset.statementType
  );
}

export function getIncomeStatementPresetByRequirementKey(
  requirementKey: string | null | undefined,
  now = new Date(),
): IncomeStatementPreset | null {
  if (!requirementKey) {
    return null;
  }

  return buildIncomeStatementPresets(now).find((preset) => preset.requirementKey === requirementKey) ?? null;
}
