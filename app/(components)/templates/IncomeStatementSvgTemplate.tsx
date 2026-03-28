import type { ReactElement } from 'react';
import type { IncomeStatementData } from '@/lib/templates/types';
import { getIncomeStatementTotals } from '@/lib/templates/income-statement-calculations';
import {
  deriveIncomeStatementLabel,
  deriveIncomeStatementTitle,
  formatIncomeStatementDate,
} from '@/lib/templates/income-statement-labels';

type Props = {
  data: IncomeStatementData;
};

type LineItem = {
  label: string;
  value?: number;
};

const WIDTH = 816;
const HEIGHT = 1056;
const PAGE_X = 44;
const PAGE_WIDTH = 728;
const TABLE_X = 52;
const TABLE_WIDTH = 712;
const VALUE_X = 748;
const ROW_HEIGHT = 26;
const FONT_SANS = "'Public Sans', 'IBM Plex Sans', 'Avenir Next', 'Segoe UI', sans-serif";
const FONT_NUM = FONT_SANS;

const money = (value?: number) =>
  `$${(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

function rowValue(value?: number) {
  return value == null ? '-' : money(value);
}

function renderDetailRows(items: LineItem[], startY: number) {
  const rows: ReactElement[] = [];
  let y = startY;

  items.forEach((item, index) => {
    rows.push(
      <g key={`${item.label}-${index}`}>
        <rect
          x={TABLE_X}
          y={y}
          width={TABLE_WIDTH}
          height={ROW_HEIGHT}
          fill={index % 2 === 0 ? '#ffffff' : '#f8fafc'}
        />
        <line x1={TABLE_X} y1={y + ROW_HEIGHT} x2={TABLE_X + TABLE_WIDTH} y2={y + ROW_HEIGHT} stroke="#e2e8f0" />
        <text x="66" y={y + 17} fontSize="10.5" fontFamily={FONT_SANS} fill="#1e293b">
          {item.label}
        </text>
        <text
          x={VALUE_X}
          y={y + 17}
          textAnchor="end"
          fontSize="10.5"
          fontWeight="600"
          fontFamily={FONT_NUM}
          fill="#0f172a"
        >
          {rowValue(item.value)}
        </text>
      </g>,
    );
    y += ROW_HEIGHT;
  });

  return { rows, nextY: y };
}

function SummaryRow({
  y,
  label,
  value,
  fill,
  color,
}: {
  y: number;
  label: string;
  value: string;
  fill: string;
  color: string;
}) {
  return (
    <g>
      <rect x={TABLE_X} y={y} width={TABLE_WIDTH} height="28" fill={fill} />
      <line x1={TABLE_X} y1={y + 28} x2={TABLE_X + TABLE_WIDTH} y2={y + 28} stroke="#e2e8f0" />
      <text x="66" y={y + 18} fontSize="10.5" fontWeight="700" fontFamily={FONT_SANS} fill={color}>
        {label}
      </text>
      <text
        x={VALUE_X}
        y={y + 18}
        textAnchor="end"
        fontSize="10.5"
        fontWeight="700"
        fontFamily={FONT_NUM}
        fill={color}
      >
        {value}
      </text>
    </g>
  );
}

function SectionHeader({ y, title }: { y: number; title: string }) {
  return (
    <g>
      <rect x={PAGE_X} y={y} width={PAGE_WIDTH} height="24" fill="#111827" />
      <text x="58" y={y + 16} fontSize="11" fontWeight="700" fontFamily={FONT_SANS} fill="#ffffff">
        {title}
      </text>
    </g>
  );
}

export default function IncomeStatementSvgTemplate({ data }: Props) {
  const {
    cogs,
    operatingExpenses,
    interestExpense,
    totalRevenue,
    totalCogs,
    grossProfit,
    totalOperatingExpenses,
    operatingProfit,
    netProfit,
  } = getIncomeStatementTotals(data);

  const revenueRows: LineItem[] = [
    { label: 'Product Sales Revenue', value: data.revenue.grossSales },
    { label: 'Service Revenue', value: data.revenue.serviceRevenue },
    { label: 'Other Revenue', value: data.revenue.otherRevenue },
  ];
  const cogsRows: LineItem[] = [
    { label: 'Inventory or Materials Cost', value: cogs.inventoryMaterialsCost },
    { label: 'Direct Labor', value: cogs.directLabor },
    { label: 'Shipping and Packaging', value: cogs.shippingPackaging },
    { label: 'Other Direct Costs', value: cogs.otherDirectCosts },
  ];
  const operatingExpenseRows: LineItem[] = [
    { label: 'Payroll and Contractor Payments', value: operatingExpenses.payrollContractorPayments },
    { label: 'Rent or Facility Costs', value: operatingExpenses.rentFacilityCosts },
    { label: 'Utilities and Internet', value: operatingExpenses.utilitiesInternet },
    { label: 'Marketing and Advertising', value: operatingExpenses.marketingAdvertising },
    { label: 'Software and Subscriptions', value: operatingExpenses.softwareSubscriptions },
    { label: 'Professional Services', value: operatingExpenses.professionalServices },
    { label: 'Insurance', value: operatingExpenses.insurance },
    { label: 'Office and Administrative', value: operatingExpenses.officeAdministrative },
    { label: 'Vehicle and Travel', value: operatingExpenses.vehicleTravel },
    { label: 'Other Operating Expenses', value: operatingExpenses.otherOperatingExpenses },
  ];

  const periodLabel = `${formatIncomeStatementDate(data.periodStart) || data.periodStart} - ${
    formatIncomeStatementDate(data.periodEnd) || data.periodEnd
  }`;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const revenueHeaderY = 172;
  const revenueTableHeaderY = revenueHeaderY + 28;
  const revenueBlock = renderDetailRows(revenueRows, revenueTableHeaderY + 22);
  const revenueTotalY = revenueBlock.nextY;

  const cogsHeaderY = revenueTotalY + 42;
  const cogsTableHeaderY = cogsHeaderY + 28;
  const cogsBlock = renderDetailRows(cogsRows, cogsTableHeaderY + 22);
  const cogsTotalY = cogsBlock.nextY;
  const grossProfitY = cogsTotalY + 28;

  const expensesHeaderY = grossProfitY + 42;
  const expensesTableHeaderY = expensesHeaderY + 28;
  const expenseBlock = renderDetailRows(operatingExpenseRows, expensesTableHeaderY + 22);
  const totalExpensesY = expenseBlock.nextY;
  const operatingProfitY = totalExpensesY + 28;
  const interestExpenseY = operatingProfitY + 28;
  const finalBandY = interestExpense ? interestExpenseY + 44 : operatingProfitY + 44;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" role="img" aria-label="Income statement template preview">
      <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="#ffffff" />

      <rect x={PAGE_X} y="28" width={PAGE_WIDTH} height="108" fill="#0f172a" />
      <text x="58" y="61" fontSize="28" fontWeight="700" fontFamily={FONT_SANS} fill="#ffffff">
        {deriveIncomeStatementTitle(data)}
      </text>
      <text x="58" y="82" fontSize="11" fontWeight="500" fontFamily={FONT_SANS} fill="#cbd5e1">
        Lender-ready profit and loss statement
      </text>

      <text x="58" y="106" fontSize="9" fontWeight="700" fontFamily={FONT_SANS} fill="#94a3b8">
        BUSINESS
      </text>
      <text x="58" y="122" fontSize="12" fontWeight="600" fontFamily={FONT_SANS} fill="#ffffff">
        {data.businessInfo?.name || '-'}
      </text>

      <line x1="514" y1="44" x2="514" y2="122" stroke="#334155" />

      <text x="534" y="60" fontSize="8.5" fontWeight="700" fontFamily={FONT_SANS} fill="#94a3b8">
        STATEMENT LABEL
      </text>
      <text x="534" y="76" fontSize="12" fontWeight="600" fontFamily={FONT_SANS} fill="#ffffff">
        {deriveIncomeStatementLabel(data)}
      </text>
      <text x="534" y="96" fontSize="8.5" fontWeight="700" fontFamily={FONT_SANS} fill="#94a3b8">
        REPORTING PERIOD
      </text>
      <text x="534" y="112" fontSize="11" fontWeight="500" fontFamily={FONT_SANS} fill="#e2e8f0">
        {periodLabel}
      </text>

      <SectionHeader y={revenueHeaderY} title="Revenue" />
      <rect x={TABLE_X} y={revenueTableHeaderY} width={TABLE_WIDTH} height="22" fill="#e2e8f0" />
      <text x="66" y={revenueTableHeaderY + 14} fontSize="8.5" fontWeight="700" fontFamily={FONT_SANS} fill="#475569">
        DESCRIPTION
      </text>
      <text
        x={VALUE_X}
        y={revenueTableHeaderY + 14}
        textAnchor="end"
        fontSize="8.5"
        fontWeight="700"
        fontFamily={FONT_SANS}
        fill="#475569"
      >
        AMOUNT
      </text>
      {revenueBlock.rows}
      <SummaryRow y={revenueTotalY} label="Total Revenue" value={money(totalRevenue)} fill="#f0fdf4" color="#166534" />

      <SectionHeader y={cogsHeaderY} title="Cost of Goods Sold" />
      <rect x={TABLE_X} y={cogsTableHeaderY} width={TABLE_WIDTH} height="22" fill="#e2e8f0" />
      <text x="66" y={cogsTableHeaderY + 14} fontSize="8.5" fontWeight="700" fontFamily={FONT_SANS} fill="#475569">
        DESCRIPTION
      </text>
      <text
        x={VALUE_X}
        y={cogsTableHeaderY + 14}
        textAnchor="end"
        fontSize="8.5"
        fontWeight="700"
        fontFamily={FONT_SANS}
        fill="#475569"
      >
        AMOUNT
      </text>
      {cogsBlock.rows}
      <SummaryRow y={cogsTotalY} label="Total Cost of Goods Sold" value={money(totalCogs)} fill="#fff7ed" color="#c2410c" />
      <SummaryRow y={grossProfitY} label="Gross Profit" value={money(grossProfit)} fill="#eff6ff" color="#1d4ed8" />

      <SectionHeader y={expensesHeaderY} title="Operating Expenses" />
      <rect x={TABLE_X} y={expensesTableHeaderY} width={TABLE_WIDTH} height="22" fill="#e2e8f0" />
      <text x="66" y={expensesTableHeaderY + 14} fontSize="8.5" fontWeight="700" fontFamily={FONT_SANS} fill="#475569">
        DESCRIPTION
      </text>
      <text
        x={VALUE_X}
        y={expensesTableHeaderY + 14}
        textAnchor="end"
        fontSize="8.5"
        fontWeight="700"
        fontFamily={FONT_SANS}
        fill="#475569"
      >
        AMOUNT
      </text>
      {expenseBlock.rows}
      <SummaryRow
        y={totalExpensesY}
        label="Total Operating Expenses"
        value={money(totalOperatingExpenses)}
        fill="#fef2f2"
        color="#b91c1c"
      />
      <SummaryRow y={operatingProfitY} label="Operating Profit" value={money(operatingProfit)} fill="#f8fafc" color="#0f172a" />

      {interestExpense ? (
        <SummaryRow
          y={interestExpenseY}
          label="Interest Expense"
          value={money(interestExpense)}
          fill="#fff7ed"
          color="#9a3412"
        />
      ) : null}

      <rect x={PAGE_X} y={finalBandY} width={PAGE_WIDTH} height="54" fill="#111827" />
      <text x="58" y={finalBandY + 20} fontSize="9" fontWeight="700" fontFamily={FONT_SANS} fill="#94a3b8">
        FINAL RESULT
      </text>
      <text x="58" y={finalBandY + 39} fontSize="16" fontWeight="700" fontFamily={FONT_SANS} fill="#ffffff">
        Net Profit
      </text>
      <text
        x="748"
        y={finalBandY + 39}
        textAnchor="end"
        fontSize="24"
        fontWeight="700"
        fontFamily={FONT_NUM}
        fill={netProfit >= 0 ? '#86efac' : '#fca5a5'}
      >
        {money(Math.abs(netProfit))}
      </text>

      <line x1={PAGE_X} y1={finalBandY + 76} x2={PAGE_X + PAGE_WIDTH} y2={finalBandY + 76} stroke="#cbd5e1" />
      <text x="52" y={finalBandY + 96} fontSize="9.5" fontWeight="700" fontFamily={FONT_SANS} fill="#475569">
        Net Margin
      </text>
      <text
        x="118"
        y={finalBandY + 96}
        fontSize="9.5"
        fontFamily={FONT_SANS}
        fill="#64748b"
      >{`${Math.abs(profitMargin).toFixed(1)}% of total revenue`}</text>
    </svg>
  );
}
