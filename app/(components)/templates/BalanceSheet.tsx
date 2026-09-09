'use client';

import PrintShell from './shared/PrintShell';
import BalanceSheetSvgTemplate from './BalanceSheetSvgTemplate';
import type { BalanceSheetData } from '@/lib/templates/types';

export default function BalanceSheet({ data }: { data: BalanceSheetData }) {
  return (
    <PrintShell title={`Balance Sheet as of ${data.asOfDate}`}>
      <BalanceSheetSvgTemplate data={data} />
    </PrintShell>
  );
}
