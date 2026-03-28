'use client';
import SBAForm413SvgTemplate from './SBAForm413SvgTemplate';
import type { PersonalFinancialStatementData } from '@/lib/templates/types';

export default function PersonalFinancialStatement({ data }: { data: PersonalFinancialStatementData }) {
  return <SBAForm413SvgTemplate data={data} />;
}
