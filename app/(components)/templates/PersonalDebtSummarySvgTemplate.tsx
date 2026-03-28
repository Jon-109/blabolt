import type { PersonalDebtSummaryData } from '@/lib/templates/types';
import type { ReactElement } from 'react';

type Props = {
  data: PersonalDebtSummaryData;
};

const WIDTH = 816;
const HEIGHT = 1056;

const FONT_SANS = "'IBM Plex Sans', 'Avenir Next', 'Segoe UI', sans-serif";
const FONT_NUM = FONT_SANS;

type CategoryId = 'credit_cards' | 'line_of_credit' | 'real_estate' | 'student_debt' | 'vehicle' | 'other_debt';

const CATEGORY_ORDER: Array<{ id: CategoryId; label: string; utilizationEligible: boolean }> = [
  { id: 'credit_cards', label: 'Credit Cards', utilizationEligible: true },
  { id: 'line_of_credit', label: 'Line of Credit', utilizationEligible: true },
  { id: 'real_estate', label: 'Real Estate', utilizationEligible: false },
  { id: 'student_debt', label: 'Student Debt', utilizationEligible: false },
  { id: 'vehicle', label: 'Vehicle', utilizationEligible: false },
  { id: 'other_debt', label: 'Other Debt', utilizationEligible: false },
];

const GROUPS = [
  { id: 'revolving', label: 'Revolving Debt', categories: ['credit_cards', 'line_of_credit'] as CategoryId[] },
  { id: 'installment', label: 'Installment Debt', categories: ['student_debt', 'vehicle', 'other_debt'] as CategoryId[] },
  { id: 'real_estate', label: 'Real Estate Debt', categories: ['real_estate'] as CategoryId[] },
] as const;

const money = (value: number) =>
  `$${(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const percent = (value: number | null) => (value === null ? '-' : `${value.toFixed(1)}%`);

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

export default function PersonalDebtSummarySvgTemplate({ data }: Props) {
  const debts = data.debts || [];
  const totalMonthlyDebtService = debts.reduce((sum, row) => sum + (row.monthlyPayment || 0), 0);
  const totalDebtExposure = debts.reduce((sum, row) => sum + (row.currentBalance || 0), 0);

  const categoryStats = CATEGORY_ORDER.map((category) => {
    const rows = debts.filter((debt) => (debt.category || 'other_debt') === category.id);
    const totalBalance = rows.reduce((sum, row) => sum + (row.currentBalance || 0), 0);
    const monthlyPayment = rows.reduce((sum, row) => sum + (row.monthlyPayment || 0), 0);
    const totalLimit = rows.reduce((sum, row) => sum + (row.creditLimit || 0), 0);
    const utilization = category.utilizationEligible && totalLimit > 0 ? (totalBalance / totalLimit) * 100 : null;

    return {
      ...category,
      rows,
      accounts: rows.length,
      totalBalance,
      monthlyPayment,
      totalLimit,
      utilization,
    };
  });

  const groupStats = GROUPS.map((group) => {
    const members = categoryStats.filter((category) => group.categories.includes(category.id));
    const totalBalance = members.reduce((sum, row) => sum + row.totalBalance, 0);
    const monthlyPayment = members.reduce((sum, row) => sum + row.monthlyPayment, 0);
    const totalLimit = members.reduce((sum, row) => sum + row.totalLimit, 0);
    const utilization = group.id === 'revolving' && totalLimit > 0 ? (totalBalance / totalLimit) * 100 : null;
    return { ...group, totalBalance, monthlyPayment, totalLimit, utilization };
  });

  const formattedAsOfDate = formatLongDate(data.asOfDate);

  const detailRows = categoryStats.flatMap((category) => {
    if (category.rows.length === 0) return [];
    const header = {
      type: 'category_header' as const,
      category: category.label,
      creditor: `${category.accounts} account${category.accounts === 1 ? '' : 's'}`,
      monthly: category.monthlyPayment,
      balance: category.totalBalance,
      limit: category.totalLimit,
    };

    const entries = category.rows.map((row) => ({
      type: 'entry' as const,
      category: '',
      creditor: row.creditor || '-',
      monthly: row.monthlyPayment || 0,
      balance: row.currentBalance || 0,
      limit: row.creditLimit || 0,
    }));

    return [header, ...entries];
  });

  const topY = 28;
  const summaryTop = 160;
  const summaryCardsTop = summaryTop + 8;
  const detailTop = summaryCardsTop + 72 + 42;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" role="img" aria-label="Personal debt summary template">
      <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="#ffffff" />

      <rect x="44" y={topY} width="728" height="98" rx="10" fill="#0f172a" />
      <text x="64" y={topY + 33} fontSize="23" fontWeight="700" fontFamily={FONT_SANS} fill="#ffffff">
        Personal Debt Summary
      </text>
      <text x="64" y={topY + 57} fontSize="11" fontFamily={FONT_SANS} fill="#cbd5e1">
        Borrower Credit Profile | Category-Based Debt Service Breakdown
      </text>
      <text x="64" y={topY + 81} fontSize="12" fontWeight="600" fontFamily={FONT_SANS} fill="#ffffff">
        Borrower: {data.personalInfo.name || '-'}
      </text>
      <rect x="510" y={topY + 18} width="248" height="40" rx="8" fill="#0b1431" stroke="#334155" />
      <text x="522" y={topY + 33} fontSize="8.8" fontFamily={FONT_SANS} fill="#94a3b8">
        Monthly Debt Service
      </text>
      <text x="522" y={topY + 49} fontSize="11.5" fontWeight="700" fontFamily={FONT_NUM} fill="#e2e8f0">
        {money(totalMonthlyDebtService)}
      </text>
      <text x="640" y={topY + 33} fontSize="8.8" fontFamily={FONT_SANS} fill="#94a3b8">
        Total Debt Exposure
      </text>
      <text x="640" y={topY + 49} fontSize="11.5" fontWeight="700" fontFamily={FONT_NUM} fill="#e2e8f0">
        {money(totalDebtExposure)}
      </text>
      <text x="548" y={topY + 81} fontSize="12" fontWeight="600" fontFamily={FONT_SANS} fill="#ffffff">
        As of Date: {formattedAsOfDate}
      </text>

      <rect x="44" y={summaryTop - 26} width="728" height="28" rx="8" fill="#0f172a" />
      <text x="58" y={summaryTop - 8} fontSize="11" fontWeight="700" fontFamily={FONT_SANS} fill="#ffffff">
        Debt Group Summary
      </text>
      {groupStats.map((group, index) => {
        const cardWidth = 234;
        const gap = 13;
        const x = 44 + index * (cardWidth + gap);
        const accent =
          group.id === 'revolving'
            ? { chip: '#dbeafe', chipText: '#1d4ed8', value: '#1e3a8a' }
            : group.id === 'installment'
            ? { chip: '#ecfdf5', chipText: '#047857', value: '#065f46' }
            : { chip: '#fff7ed', chipText: '#c2410c', value: '#9a3412' };
        return (
          <g key={group.id}>
            <rect x={x} y={summaryCardsTop} width={cardWidth} height="72" rx="12" fill="#ffffff" stroke="#cbd5e1" />
            <rect x={x + 1} y={summaryCardsTop + 1} width={cardWidth - 2} height="18" rx="11" fill={accent.chip} />
            <text x={x + 14} y={summaryCardsTop + 14} fontSize="9.5" fontWeight="700" fontFamily={FONT_SANS} fill={accent.chipText}>
              {group.label}
            </text>
            {group.id === 'revolving' ? (
              <>
                <text x={x + 14} y={summaryCardsTop + 38} fontSize="8.8" fontFamily={FONT_SANS} fill="#64748b">
                  Balance
                </text>
                <text x={x + 14} y={summaryCardsTop + 52} fontSize="10.5" fontWeight="700" fontFamily={FONT_NUM} fill={accent.value}>
                  {money(group.totalBalance)}
                </text>
                <text x={x + 90} y={summaryCardsTop + 38} fontSize="8.8" fontFamily={FONT_SANS} fill="#64748b">
                  Credit Limit
                </text>
                <text x={x + 90} y={summaryCardsTop + 52} fontSize="10.5" fontWeight="700" fontFamily={FONT_NUM} fill="#0f172a">
                  {money(group.totalLimit)}
                </text>
                <text x={x + 176} y={summaryCardsTop + 38} fontSize="8.8" fontFamily={FONT_SANS} fill="#64748b">
                  Utilization
                </text>
                <text x={x + 176} y={summaryCardsTop + 52} fontSize="10.5" fontWeight="700" fontFamily={FONT_NUM} fill="#0f172a">
                  {percent(group.utilization)}
                </text>
              </>
            ) : (
              <>
                <text x={x + 14} y={summaryCardsTop + 38} fontSize="9.5" fontFamily={FONT_SANS} fill="#64748b">
                  Total Balance
                </text>
                <text x={x + 14} y={summaryCardsTop + 52} fontSize="11.5" fontWeight="700" fontFamily={FONT_NUM} fill={accent.value}>
                  {money(group.totalBalance)}
                </text>
                <text x={x + 126} y={summaryCardsTop + 38} fontSize="9.5" fontFamily={FONT_SANS} fill="#64748b">
                  Monthly Payment
                </text>
                <text x={x + 126} y={summaryCardsTop + 52} fontSize="11.5" fontWeight="700" fontFamily={FONT_NUM} fill="#0f172a">
                  {money(group.monthlyPayment)}
                </text>
              </>
            )}
          </g>
        );
      })}

      <rect x="44" y={detailTop - 30} width="728" height="32" rx="8" fill="#0f172a" />
      <text x="58" y={detailTop - 10} fontSize="12" fontWeight="700" fontFamily={FONT_SANS} fill="#ffffff">
        Debt Detail by Category
      </text>

      <rect x="44" y={detailTop} width="728" height="28" fill="#334155" />
      <text x="54" y={detailTop + 19} fontSize="10" fontWeight="700" fontFamily={FONT_SANS} fill="#f8fafc">
        Category
      </text>
      <text x="160" y={detailTop + 19} fontSize="10" fontWeight="700" fontFamily={FONT_SANS} fill="#f8fafc">
        Creditor / Description
      </text>
      <text x="502" y={detailTop + 19} textAnchor="end" fontSize="10" fontWeight="700" fontFamily={FONT_SANS} fill="#f8fafc">
        Monthly Payment
      </text>
      <text x="630" y={detailTop + 19} textAnchor="end" fontSize="10" fontWeight="700" fontFamily={FONT_SANS} fill="#f8fafc">
        Current Balance
      </text>
      <text x="758" y={detailTop + 19} textAnchor="end" fontSize="10" fontWeight="700" fontFamily={FONT_SANS} fill="#f8fafc">
        Credit Limit
      </text>

      {(() => {
        const blocks: ReactElement[] = [];
        let y = detailTop + 28;

        detailRows.slice(0, 20).forEach((row, index) => {
          if (row.type === 'category_header') {
            blocks.push(
              <g key={`${row.category}-header-${index}`}>
                <rect x="44" y={y} width="728" height="24" fill="#e2e8f0" stroke="#cbd5e1" />
                <text x="54" y={y + 16} fontSize="9.5" fontWeight="700" fontFamily={FONT_SANS} fill="#0f172a">
                  {row.category}
                </text>
                <text x="160" y={y + 16} fontSize="9" fontFamily={FONT_SANS} fill="#334155">
                  {row.creditor}
                </text>
                <text x="502" y={y + 16} textAnchor="end" fontSize="9" fontWeight="700" fontFamily={FONT_NUM} fill="#0f172a">
                  {money(row.monthly)}
                </text>
                <text x="630" y={y + 16} textAnchor="end" fontSize="9" fontWeight="700" fontFamily={FONT_NUM} fill="#0f172a">
                  {money(row.balance)}
                </text>
                <text x="758" y={y + 16} textAnchor="end" fontSize="9" fontWeight="700" fontFamily={FONT_NUM} fill="#0f172a">
                  {row.limit > 0 ? money(row.limit) : '-'}
                </text>
              </g>,
            );
            y += 24;
            return;
          }

          blocks.push(
            <g key={`${row.category}-${row.creditor}-${index}`}>
              <rect x="44" y={y} width="728" height="28" fill={index % 2 === 0 ? '#ffffff' : '#f8fafc'} stroke="#e2e8f0" />
              <text x="54" y={y + 18} fontSize="9.5" fontFamily={FONT_SANS} fill="#1e293b">
                -
              </text>
              <text x="160" y={y + 18} fontSize="9.5" fontFamily={FONT_SANS} fill="#1e293b">
                {row.creditor}
              </text>
              <text x="502" y={y + 18} textAnchor="end" fontSize="9.5" fontFamily={FONT_NUM} fill="#111827">
                {money(row.monthly)}
              </text>
              <text x="630" y={y + 18} textAnchor="end" fontSize="9.5" fontFamily={FONT_NUM} fill="#111827">
                {money(row.balance)}
              </text>
              <text x="758" y={y + 18} textAnchor="end" fontSize="9.5" fontFamily={FONT_NUM} fill="#111827">
                {row.limit > 0 ? money(row.limit) : '-'}
              </text>
            </g>,
          );
          y += 28;
        });

        return blocks;
      })()}
    </svg>
  );
}
