import type { BalanceSheetData } from '@/lib/templates/types';
import { computeBalanceSheetTotals } from '@/lib/templates/balance-sheet-calculations';

type Props = {
  data: BalanceSheetData;
};

type Row = {
  label: string;
  value: string;
  indent?: boolean;
  muted?: boolean;
  total?: boolean;
  dividerBefore?: boolean;
};

const WIDTH = 816;
const HEIGHT = 1056;
const FONT_SANS = "'IBM Plex Sans', 'Avenir Next', 'Segoe UI', sans-serif";

const money = (value: number) =>
  `$${(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const rowValue = (value?: number) => (value && value !== 0 ? money(value) : '-');

const toOrdinal = (day: number) => {
  const mod10 = day % 10;
  const mod100 = day % 100;
  if (mod10 === 1 && mod100 !== 11) return `${day}st`;
  if (mod10 === 2 && mod100 !== 12) return `${day}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${day}rd`;
  return `${day}th`;
};

const formatLongDate = (input: string) => {
  if (!input) return '-';
  const date = new Date(`${input}T00:00:00`);
  if (Number.isNaN(date.getTime())) return input;
  const month = date.toLocaleString('en-US', { month: 'long' });
  return `${month} ${toOrdinal(date.getDate())}, ${date.getFullYear()}`;
};

function renderColumn(args: {
  x: number;
  y: number;
  width: number;
  title: string;
  sections: Array<{ label: string; rows: Row[] }>;
}) {
  const { x, y, width, title, sections } = args;
  const headerHeight = 48;
  const rowHeight = 27;
  const sectionGap = 16;
  const cardPadding = 20;
  const contentHeight =
    sections.reduce((sum, section) => sum + 26 + section.rows.length * rowHeight, 0) +
    Math.max(0, sections.length - 1) * sectionGap;
  const cardHeight = headerHeight + cardPadding + contentHeight + 14;

  let cursorY = y + headerHeight + cardPadding;

  return (
    <g>
      <rect x={x} y={y} width={width} height={cardHeight} fill="#ffffff" stroke="#d7e1ec" />
      <rect x={x} y={y} width={width} height={headerHeight} fill="#f8fafc" stroke="#d7e1ec" />
      <line x1={x} y1={y + headerHeight} x2={x + width} y2={y + headerHeight} stroke="#d7e1ec" />
      <text x={x + 18} y={y + 30} fontSize="16" fontWeight="700" fontFamily={FONT_SANS} fill="#0f172a">
        {title}
      </text>

      {sections.map((section) => {
        const startY = cursorY;
        cursorY += 26;

        const sectionRows = section.rows.map((row, index) => {
          const rowY = cursorY + index * rowHeight;
          const labelX = x + (row.indent ? 34 : 18);
          const rowNode = (
            <g key={`${section.label}-${row.label}`}>
              {row.dividerBefore ? (
                <line
                  x1={x + 18}
                  y1={rowY - 13}
                  x2={x + width - 18}
                  y2={rowY - 13}
                  stroke="#d7e1ec"
                />
              ) : null}
              <text
                x={labelX}
                y={rowY}
                fontSize={row.total ? 10.8 : 9.9}
                fontWeight={row.total ? '700' : row.muted ? '500' : '600'}
                fontFamily={FONT_SANS}
                fill={row.total ? '#0f172a' : row.muted ? '#64748b' : '#334155'}
              >
                {row.label}
              </text>
              <text
                x={x + width - 18}
                y={rowY}
                textAnchor="end"
                fontSize={row.total ? 10.8 : 9.9}
                fontWeight={row.total ? '700' : '600'}
                fontFamily={FONT_SANS}
                fill="#0f172a"
              >
                {row.value}
              </text>
            </g>
          );
          return rowNode;
        });

        const sectionNode = (
          <g key={section.label}>
            <text x={x + 18} y={startY} fontSize="10.8" fontWeight="700" fontFamily={FONT_SANS} fill="#1d4ed8">
              {section.label}
            </text>
            {sectionRows}
          </g>
        );

        cursorY += section.rows.length * rowHeight + sectionGap;
        return sectionNode;
      })}
    </g>
  );
}

export default function BalanceSheetSvgTemplate({ data }: Props) {
  const assets = data.assets || {};
  const liabilities = data.liabilities || {};
  const equity = data.equity || {};
  const fixedAssets = assets.fixedAssetBreakdown || {};
  const {
    totalCurrentAssets,
    grossFixedAssets,
    netFixedAssets,
    totalNonCurrentAssets,
    totalAssets,
    totalCurrentLiabilities,
    totalLongTermLiabilities,
    totalLiabilities,
    retainedEarnings,
    totalEquity,
    liabilitiesAndEquity,
  } = computeBalanceSheetTotals(data);

  const assetsSections = [
    {
      label: 'CURRENT ASSETS',
      rows: [
        { label: 'Cash & Cash Equivalents', value: rowValue(assets.cashAndCashEquivalents) },
        { label: 'Accounts Receivable', value: rowValue(assets.accountsReceivable) },
        { label: 'Inventory', value: rowValue(assets.inventory) },
        { label: 'Prepaid Expenses', value: rowValue(assets.prepaidExpenses) },
        { label: 'Other Current Assets', value: rowValue(assets.otherCurrentAssets) },
        { label: 'Total Current Assets', value: money(totalCurrentAssets), total: true, dividerBefore: true },
      ],
    },
    {
      label: 'PROPERTY & EQUIPMENT',
      rows: [
        { label: 'Business Real Estate', value: rowValue(fixedAssets.businessRealEstate), indent: true },
        { label: 'Vehicles', value: rowValue(fixedAssets.vehicles), indent: true },
        { label: 'Machinery & Equipment', value: rowValue(fixedAssets.machineryEquipment), indent: true },
        { label: 'Furniture & Fixtures', value: rowValue(fixedAssets.furnitureFixtures), indent: true },
        { label: 'Leasehold Improvements', value: rowValue(fixedAssets.leaseholdImprovements), indent: true },
        { label: 'Gross Property & Equipment', value: money(grossFixedAssets), muted: true, dividerBefore: true },
        { label: 'Less: Accumulated Depreciation', value: rowValue(assets.accumulatedDepreciation), indent: true, muted: true },
        { label: 'Net Property & Equipment', value: money(netFixedAssets), total: true },
      ],
    },
    {
      label: 'OTHER LONG-TERM ASSETS',
      rows: [
        { label: 'Notes Receivable', value: rowValue(assets.notesReceivable) },
        { label: 'Intangible Assets', value: rowValue(assets.intangibleAssets) },
        { label: 'Investments', value: rowValue(assets.investments) },
        { label: 'Other Non-Current Assets', value: rowValue(assets.otherNonCurrentAssets) },
        { label: 'Total Long-Term Assets', value: money(totalNonCurrentAssets), total: true, dividerBefore: true },
        { label: 'Total Assets', value: money(totalAssets), total: true, dividerBefore: true },
      ],
    },
  ];

  const liabilitiesEquitySections = [
    {
      label: 'CURRENT LIABILITIES',
      rows: [
        { label: 'Accounts Payable', value: rowValue(liabilities.accountsPayable) },
        { label: 'Accrued Expenses', value: rowValue(liabilities.accruedExpenses) },
        { label: 'Taxes Payable', value: rowValue(liabilities.taxesPayable) },
        { label: 'Current Portion of Long-Term Debt', value: rowValue(liabilities.currentPortionLongTermDebt) },
        { label: 'Credit Cards & Lines of Credit', value: rowValue(liabilities.creditCardsAndLines) },
        { label: 'Deferred Revenue', value: rowValue(liabilities.deferredRevenue) },
        { label: 'Other Current Liabilities', value: rowValue(liabilities.otherCurrentLiabilities) },
        { label: 'Total Current Liabilities', value: money(totalCurrentLiabilities), total: true, dividerBefore: true },
      ],
    },
    {
      label: 'LONG-TERM LIABILITIES',
      rows: [
        { label: 'Long-Term Debt', value: rowValue(liabilities.longTermDebt) },
        { label: 'Shareholder / Owner Loans', value: rowValue(liabilities.shareholderLoans) },
        { label: 'Other Long-Term Liabilities', value: rowValue(liabilities.otherLongTermLiabilities) },
        { label: 'Total Long-Term Liabilities', value: money(totalLongTermLiabilities), total: true, dividerBefore: true },
        { label: 'Total Liabilities', value: money(totalLiabilities), total: true, dividerBefore: true },
      ],
    },
    {
      label: 'EQUITY',
      rows: [
        { label: 'Owner Contributions', value: rowValue(equity.ownerContributions) },
        { label: 'Less: Owner Distributions', value: rowValue(equity.ownerDistributions), indent: true, muted: true },
        { label: 'Other Equity', value: rowValue(equity.otherEquity) },
        { label: 'Retained Earnings', value: rowValue(retainedEarnings) },
        { label: 'Total Equity', value: money(totalEquity), total: true, dividerBefore: true },
        { label: 'Total Liabilities + Equity', value: money(liabilitiesAndEquity), total: true, dividerBefore: true },
      ],
    },
  ];

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" role="img" aria-label="Balance sheet template">
      <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="#f4f7fb" />

      <rect x="32" y="28" width="752" height="132" fill="#0f172a" />
      <text x="52" y="88" fontSize="31" fontWeight="700" fontFamily={FONT_SANS} fill="#ffffff">
        Balance Sheet
      </text>
      <text x="52" y="113" fontSize="12.4" fontFamily={FONT_SANS} fill="#cbd5e1">
        Assets, liabilities, and equity presented as of a single reporting date
      </text>
      <text x="52" y="136" fontSize="12.2" fontWeight="600" fontFamily={FONT_SANS} fill="#ffffff">
        As of {formatLongDate(data.asOfDate)}
      </text>

      <rect x="516" y="46" width="248" height="96" fill="#111c31" stroke="#334155" />
      <text x="536" y="74" fontSize="10.4" fontWeight="700" fontFamily={FONT_SANS} fill="#93c5fd">
        REPORTING DETAILS
      </text>
      <text x="536" y="97" fontSize="11.8" fontWeight="600" fontFamily={FONT_SANS} fill="#ffffff">
        Business: {data.businessInfo?.legalName || '-'}
      </text>
      <text x="536" y="118" fontSize="11.8" fontWeight="600" fontFamily={FONT_SANS} fill="#ffffff">
        {(data.businessInfo?.reportBasis || 'accrual').toUpperCase()}
      </text>
      <text x="664" y="118" fontSize="11.8" fontWeight="600" fontFamily={FONT_SANS} fill="#ffffff">
        {data.statementLabel || 'Balance Sheet'}
      </text>

      {renderColumn({
        x: 32,
        y: 180,
        width: 364,
        title: 'Assets',
        sections: assetsSections,
      })}

      {renderColumn({
        x: 420,
        y: 180,
        width: 364,
        title: 'Liabilities & Equity',
        sections: liabilitiesEquitySections,
      })}

      <text x="32" y="1030" fontSize="11" fontFamily={FONT_SANS} fill="#64748b">
        Prepared from user-provided balances for lender-ready presentation.
      </text>
    </svg>
  );
}
