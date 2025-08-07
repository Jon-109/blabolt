import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { notFound } from 'next/navigation';
import BalanceSheet from '@/app/(components)/templates/BalanceSheet';
import IncomeStatement from '@/app/(components)/templates/IncomeStatement';
import PersonalFinancialStatement from '@/app/(components)/templates/PersonalFinancialStatement';
import PersonalDebtSummary from '@/app/(components)/templates/PersonalDebtSummary';
import BusinessDebtSummary from '@/app/(components)/templates/BusinessDebtSummary';
import type { SubmissionDataMap, TemplateType } from '@/lib/templates/types';

export const dynamic = 'force-dynamic';

async function getSubmission(submissionId: string) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('template_submissions')
    .select('id,user_id,template_type,form_data,pdf_url,created_at,updated_at')
    .eq('id', submissionId)
    .single();

  if (!data || data.user_id !== user.id) return null;
  return data;
}

export default async function PrintPage({ params }: {
  params: Promise<{ submissionId: string; templateType: TemplateType }>
}) {
  const { submissionId, templateType } = await params;
  const submission = await getSubmission(submissionId);
  if (!submission) return notFound();
  if (submission.template_type !== templateType) return notFound();

  // Cast form_data to the appropriate type based on template_type
  const data = submission.form_data as SubmissionDataMap[keyof SubmissionDataMap];

  // Render component by template type
  switch (submission.template_type) {
    case 'balance_sheet':
      return <BalanceSheet data={data as SubmissionDataMap['balance_sheet']} />;
    case 'income_statement':
      return <IncomeStatement data={data as SubmissionDataMap['income_statement']} />;
    case 'personal_financial_statement':
      return <PersonalFinancialStatement data={data as SubmissionDataMap['personal_financial_statement']} />;
    case 'personal_debt_summary':
      return <PersonalDebtSummary data={data as SubmissionDataMap['personal_debt_summary']} />;
    case 'business_debt_summary':
      return <BusinessDebtSummary data={data as SubmissionDataMap['business_debt_summary']} />;
    default:
      return notFound();
  }
}
