import type { BalanceSheetData, LegacyBalanceSheetData } from '@/lib/templates/types';

type BalanceSheetLike =
  | Partial<Pick<BalanceSheetData, 'statementType' | 'asOfDate' | 'periodStartDate' | 'periodEndDate' | 'statementLabel'>>
  | Partial<Pick<LegacyBalanceSheetData, 'statementType' | 'asOfDate' | 'statementLabel'>>
  | Record<string, unknown>
  | null
  | undefined;

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function readString(raw: BalanceSheetLike, key: string): string | undefined {
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

function getQuarter(month: number) {
  if (month <= 3) return 'Q1';
  if (month <= 6) return 'Q2';
  if (month <= 9) return 'Q3';
  return 'Q4';
}

function getStatementType(raw: BalanceSheetLike): BalanceSheetData['statementType'] {
  const type = readString(raw, 'statementType');
  if (type === 'year_end' || type === 'ytd' || type === 'interim' || type === 'custom') {
    return type;
  }
  return 'ytd';
}

export function getBalanceSheetAsOfDate(raw: BalanceSheetLike): string | undefined {
  return readString(raw, 'asOfDate');
}

export function formatBalanceSheetDate(value?: string): string | null {
  const parsed = parseIsoDate(value);
  if (!parsed) return null;
  return `${String(parsed.month).padStart(2, '0')}/${String(parsed.day).padStart(2, '0')}/${parsed.year}`;
}

export function deriveBalanceSheetStatementLabel(raw: BalanceSheetLike): string {
  const statementType = getStatementType(raw);
  const asOfDate = getBalanceSheetAsOfDate(raw);
  const parsed = parseIsoDate(asOfDate);

  if (!parsed) {
    if (statementType === 'year_end') return 'Year-End';
    if (statementType === 'interim') return 'Interim';
    if (statementType === 'custom') return 'Custom';
    return 'YTD';
  }

  if (statementType === 'year_end') return `${parsed.year} Year-End`;
  if (statementType === 'interim') return `${parsed.year} ${getQuarter(parsed.month)}`;
  if (statementType === 'custom') return `Custom ${formatBalanceSheetDate(asOfDate) ?? parsed.year}`;

  const monthLabel = MONTH_SHORT[parsed.month - 1] ?? `${parsed.month}`;
  return `${monthLabel} ${parsed.year} YTD`;
}

export function deriveBalanceSheetTitle(raw: BalanceSheetLike): string {
  const statementType = getStatementType(raw);
  const asOfDate = getBalanceSheetAsOfDate(raw);
  const parsed = parseIsoDate(asOfDate);

  if (!parsed) {
    if (statementType === 'year_end') return 'Year-End Balance Sheet';
    if (statementType === 'interim') return 'Interim Balance Sheet';
    if (statementType === 'custom') return 'Custom Balance Sheet';
    if (statementType === 'ytd') return 'YTD Balance Sheet';
    return 'Balance Sheet';
  }

  if (statementType === 'year_end') return `${parsed.year} Balance Sheet`;
  if (statementType === 'interim') return `${parsed.year} ${getQuarter(parsed.month)} Balance Sheet`;
  if (statementType === 'custom') return `${parsed.year} Custom Balance Sheet`;
  return `${parsed.year} YTD Balance Sheet`;
}

export function deriveBalanceSheetDashboardMeta(raw: BalanceSheetLike, sequenceNumber?: number | null): string | null {
  const statementType = getStatementType(raw);
  const asOfDate = getBalanceSheetAsOfDate(raw);
  const pieces: string[] = [];

  if (sequenceNumber && sequenceNumber > 0) {
    pieces.push(`Statement #${sequenceNumber}`);
  }

  if (statementType === 'year_end') {
    pieces.push('Year-End');
  } else if (statementType === 'interim') {
    pieces.push('Interim');
  } else if (statementType === 'custom') {
    pieces.push('Custom');
  } else {
    pieces.push('YTD');
  }

  const formattedDate = formatBalanceSheetDate(asOfDate);
  if (formattedDate) {
    pieces.push(`As of ${formattedDate}`);
  }

  return pieces.length > 0 ? pieces.join(' • ') : null;
}
