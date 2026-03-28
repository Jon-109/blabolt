begin;

alter table if exists public.loan_requests
  add column if not exists template_shared_context jsonb not null default '{}'::jsonb,
  add column if not exists template_data_sources jsonb not null default '{}'::jsonb;

alter table if exists public.guided_template_submissions
  add column if not exists legacy_template_submission_id uuid references public.template_submissions(id) on delete set null;

create index if not exists idx_guided_template_submissions_legacy_submission
  on public.guided_template_submissions(legacy_template_submission_id);

update public.document_requirements
set template_key = 'balance_sheet',
    updated_at = now()
where requirement_key = 'balance_sheet'
  and template_key is distinct from 'balance_sheet';

update public.document_requirements
set template_key = 'income_statement',
    updated_at = now()
where requirement_key = 'income_statement'
  and template_key is distinct from 'income_statement';

insert into public.template_definitions (
  template_key,
  display_name,
  description,
  version,
  schema,
  ui_schema,
  is_active
)
values
  (
    'balance_sheet',
    'Balance Sheet',
    'Guided business balance sheet with built-in balance verification.',
    1,
    '{"fields":["statement_date","business_name","cash","accounts_receivable","inventory","other_current_assets","fixed_assets","accumulated_depreciation","other_assets","accounts_payable","credit_card_liabilities","short_term_loans","long_term_debt","other_liabilities","owners_equity","retained_earnings","notes"]}'::jsonb,
    '{"sections":["Business Snapshot","Assets","Liabilities & Equity"]}'::jsonb,
    true
  ),
  (
    'income_statement',
    'Income Statement',
    'Guided profit and loss statement for small-business lender review.',
    1,
    '{"fields":["period_start","period_end","business_name","gross_sales","service_revenue","other_revenue","cost_of_goods_sold","salaries_wages","rent","utilities","marketing","insurance","depreciation","interest_expense","other_expenses","notes"]}'::jsonb,
    '{"sections":["Reporting Period","Revenue","Expenses"]}'::jsonb,
    true
  )
on conflict (template_key) do update
set
  display_name = excluded.display_name,
  description = excluded.description,
  version = excluded.version,
  schema = excluded.schema,
  ui_schema = excluded.ui_schema,
  is_active = excluded.is_active,
  updated_at = now();

commit;
