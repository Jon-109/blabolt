import type { IncomeStatementData } from '@/lib/templates/types';

type IncomeStatementLike =
  | Partial<Pick<IncomeStatementData, 'statementType' | 'periodStart' | 'periodEnd' | 'statementLabel'>>
  | Record<string, unknown>
  | null
  | undefined;

function readString(raw: IncomeStatementLike, key: string): string | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const value = (raw as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function parseIsoDate(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (!year || !month || !day) return null;
  return { year, month, day };
}

export function normalizeIncomeStatementType(
  statementType?: IncomeStatementData['statementType'],
  periodStart?: string,
  periodEnd?: string,
): 'annual' | 'ytd' {
  if (statementType === 'annual' || statementType === 'ytd') return statementType;

  const parsedStart = parseIsoDate(periodStart);
  const parsedEnd = parseIsoDate(periodEnd);
  if (
    parsedStart &&
    parsedEnd &&
    parsedStart.year === parsedEnd.year &&
    parsedStart.month === 1 &&
    parsedStart.day === 1 &&
    parsedEnd.month === 12 &&
    parsedEnd.day === 31
  ) {
    return 'annual';
  }

  return 'ytd';
}

function getIncomeStatementType(raw: IncomeStatementLike): 'annual' | 'ytd' {
  return normalizeIncomeStatementType(
    readString(raw, 'statementType') as IncomeStatementData['statementType'],
    readString(raw, 'periodStart'),
    readString(raw, 'periodEnd'),
  );
}

export function formatIncomeStatementDate(value?: string): string | null {
  const parsed = parseIsoDate(value);
  if (!parsed) return null;
  return `${String(parsed.month).padStart(2, '0')}/${String(parsed.day).padStart(2, '0')}/${parsed.year}`;
}

export function deriveIncomeStatementLabel(raw: IncomeStatementLike): string {
  const statementType = getIncomeStatementType(raw);
  const periodEnd = readString(raw, 'periodEnd');
  const parsedEnd = parseIsoDate(periodEnd);

  if (!parsedEnd) return statementType === 'annual' ? 'Annual Statement' : 'YTD Statement';
  return statementType === 'annual' ? `${parsedEnd.year} Annual` : `${parsedEnd.year} YTD`;
}

export function deriveIncomeStatementTitle(raw: IncomeStatementLike): string {
  const statementType = getIncomeStatementType(raw);
  const periodEnd = readString(raw, 'periodEnd');
  const parsedEnd = parseIsoDate(periodEnd);

  if (!parsedEnd) {
    return statementType === 'annual' ? 'Income Statement' : 'YTD Income Statement';
  }

  return statementType === 'annual'
    ? `${parsedEnd.year} Income Statement`
    : `${parsedEnd.year} YTD Income Statement`;
}

export function deriveIncomeStatementDashboardMeta(raw: IncomeStatementLike, sequenceNumber?: number | null): string | null {
  const statementType = getIncomeStatementType(raw);
  const periodStart = readString(raw, 'periodStart');
  const periodEnd = readString(raw, 'periodEnd');
  const pieces: string[] = [];

  if (sequenceNumber && sequenceNumber > 0) {
    pieces.push(`Statement #${sequenceNumber}`);
  }

  pieces.push(statementType === 'annual' ? 'Annual' : 'YTD');

  const formattedStart = formatIncomeStatementDate(periodStart);
  const formattedEnd = formatIncomeStatementDate(periodEnd);
  if (formattedStart && formattedEnd) {
    pieces.push(`${formattedStart} - ${formattedEnd}`);
  }

  return pieces.length > 0 ? pieces.join(' • ') : null;
}
