'use client';

import PrintShell from './shared/PrintShell';
import PersonalDebtSummarySvgTemplate from './PersonalDebtSummarySvgTemplate';
import type { PersonalDebtSummaryData } from '@/lib/templates/types';

export default function PersonalDebtSummary({ data }: { data: PersonalDebtSummaryData }) {
  return (
    <PrintShell title={`Personal Debt Summary — As of ${data.asOfDate}`}>
      <PersonalDebtSummarySvgTemplate data={data} />
    </PrintShell>
  );
}
