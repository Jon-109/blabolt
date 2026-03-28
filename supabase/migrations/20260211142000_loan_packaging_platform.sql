begin;

create extension if not exists pgcrypto;

-- Core loan packaging request owned by each authenticated user.
create table if not exists public.loan_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_type text not null check (service_type in ('loan_packaging', 'loan_brokering')),
  status text not null default 'draft' check (status in ('draft', 'in_progress', 'submitted', 'completed', 'archived')),
  business_name text,
  business_description text,
  loan_purpose text,
  loan_amount numeric(14,2),
  annual_revenue numeric(14,2),
  years_in_business numeric(5,2),
  strengths text,
  cover_letter_status text not null default 'not_started' check (cover_letter_status in ('not_started', 'draft', 'generated', 'approved')),
  cover_letter_inputs jsonb not null default '{}'::jsonb,
  cover_letter_content text,
  package_zip_path text,
  package_zip_generated_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Canonical requirements for each service type.
create table if not exists public.document_requirements (
  requirement_key text primary key,
  service_type text not null check (service_type in ('loan_packaging', 'loan_brokering')),
  category text not null check (category in ('financial_statement', 'debt_schedule', 'tax_return', 'bank_statement', 'cover_letter', 'other')),
  display_name text not null,
  description text not null,
  required boolean not null default true,
  sort_order integer not null default 100,
  template_key text,
  allowed_mime_types text[] not null default array['application/pdf', 'image/png', 'image/jpeg'],
  max_size_mb integer not null default 25,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User-specific upload/generated document rows tied to a request + requirement.
create table if not exists public.loan_request_documents (
  id uuid primary key default gen_random_uuid(),
  loan_request_id uuid not null references public.loan_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  requirement_key text not null references public.document_requirements(requirement_key),
  status text not null default 'not_started' check (status in ('not_started', 'uploaded', 'generated', 'approved')),
  source text not null default 'upload' check (source in ('upload', 'template', 'generated')),
  file_path text,
  mime_type text,
  file_size_bytes bigint,
  metadata jsonb not null default '{}'::jsonb,
  uploaded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (loan_request_id, requirement_key)
);

-- Template metadata/config for guided template engine.
create table if not exists public.template_definitions (
  template_key text primary key,
  display_name text not null,
  description text not null,
  version integer not null default 1,
  schema jsonb not null,
  ui_schema jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Per-user template submissions linked to a loan request.
create table if not exists public.guided_template_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  loan_request_id uuid not null references public.loan_requests(id) on delete cascade,
  template_key text not null references public.template_definitions(template_key),
  status text not null default 'draft' check (status in ('draft', 'completed', 'generated')),
  completion_pct integer not null default 0 check (completion_pct >= 0 and completion_pct <= 100),
  form_data jsonb not null default '{}'::jsonb,
  derived_metrics jsonb not null default '{}'::jsonb,
  pdf_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (loan_request_id, template_key)
);

-- Generated outputs for reporting/auditability.
create table if not exists public.generated_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  loan_request_id uuid references public.loan_requests(id) on delete cascade,
  report_type text not null,
  source_type text not null check (source_type in ('cash_flow_analysis', 'template', 'cover_letter', 'package')),
  source_id text,
  file_path text not null,
  mime_type text not null default 'application/pdf',
  file_size_bytes bigint,
  visibility text not null default 'private' check (visibility in ('private', 'lender_link')),
  created_at timestamptz not null default now()
);

-- Password-protected tokenized lender access links.
create table if not exists public.lender_access_links (
  id uuid primary key default gen_random_uuid(),
  loan_request_id uuid not null references public.loan_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  password_hash text not null,
  title text,
  expires_at timestamptz not null,
  is_revoked boolean not null default false,
  access_count integer not null default 0,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Access audit events for lender portal authentication attempts.
create table if not exists public.lender_access_events (
  id bigserial primary key,
  lender_access_link_id uuid not null references public.lender_access_links(id) on delete cascade,
  success boolean not null,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_loan_requests_user_created on public.loan_requests(user_id, created_at desc);
create index if not exists idx_loan_requests_status on public.loan_requests(status);
create index if not exists idx_loan_documents_request on public.loan_request_documents(loan_request_id);
create index if not exists idx_loan_documents_user on public.loan_request_documents(user_id);
create index if not exists idx_template_submissions_request on public.guided_template_submissions(loan_request_id);
create index if not exists idx_reports_user_created on public.generated_reports(user_id, created_at desc);
create index if not exists idx_lender_links_token on public.lender_access_links(token);
create index if not exists idx_lender_links_request on public.lender_access_links(loan_request_id);
create index if not exists idx_lender_events_link_created on public.lender_access_events(lender_access_link_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at_loan_requests on public.loan_requests;
create trigger trg_set_updated_at_loan_requests
before update on public.loan_requests
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_document_requirements on public.document_requirements;
create trigger trg_set_updated_at_document_requirements
before update on public.document_requirements
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_loan_request_documents on public.loan_request_documents;
create trigger trg_set_updated_at_loan_request_documents
before update on public.loan_request_documents
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_template_definitions on public.template_definitions;
create trigger trg_set_updated_at_template_definitions
before update on public.template_definitions
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_guided_template_submissions on public.guided_template_submissions;
create trigger trg_set_updated_at_guided_template_submissions
before update on public.guided_template_submissions
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_lender_access_links on public.lender_access_links;
create trigger trg_set_updated_at_lender_access_links
before update on public.lender_access_links
for each row execute function public.set_updated_at();

alter table public.loan_requests enable row level security;
alter table public.document_requirements enable row level security;
alter table public.loan_request_documents enable row level security;
alter table public.template_definitions enable row level security;
alter table public.guided_template_submissions enable row level security;
alter table public.generated_reports enable row level security;
alter table public.lender_access_links enable row level security;
alter table public.lender_access_events enable row level security;

drop policy if exists loan_requests_select_own on public.loan_requests;
create policy loan_requests_select_own on public.loan_requests
for select using (auth.uid() = user_id);

drop policy if exists loan_requests_insert_own on public.loan_requests;
create policy loan_requests_insert_own on public.loan_requests
for insert with check (auth.uid() = user_id);

drop policy if exists loan_requests_update_own on public.loan_requests;
create policy loan_requests_update_own on public.loan_requests
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists loan_requests_delete_own on public.loan_requests;
create policy loan_requests_delete_own on public.loan_requests
for delete using (auth.uid() = user_id);

drop policy if exists document_requirements_select_authenticated on public.document_requirements;
create policy document_requirements_select_authenticated on public.document_requirements
for select to authenticated using (true);

drop policy if exists loan_request_documents_select_own on public.loan_request_documents;
create policy loan_request_documents_select_own on public.loan_request_documents
for select using (auth.uid() = user_id);

drop policy if exists loan_request_documents_insert_own on public.loan_request_documents;
create policy loan_request_documents_insert_own on public.loan_request_documents
for insert with check (auth.uid() = user_id);

drop policy if exists loan_request_documents_update_own on public.loan_request_documents;
create policy loan_request_documents_update_own on public.loan_request_documents
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists loan_request_documents_delete_own on public.loan_request_documents;
create policy loan_request_documents_delete_own on public.loan_request_documents
for delete using (auth.uid() = user_id);

drop policy if exists template_definitions_select_authenticated on public.template_definitions;
create policy template_definitions_select_authenticated on public.template_definitions
for select to authenticated using (true);

drop policy if exists guided_template_submissions_select_own on public.guided_template_submissions;
create policy guided_template_submissions_select_own on public.guided_template_submissions
for select using (auth.uid() = user_id);

drop policy if exists guided_template_submissions_insert_own on public.guided_template_submissions;
create policy guided_template_submissions_insert_own on public.guided_template_submissions
for insert with check (auth.uid() = user_id);

drop policy if exists guided_template_submissions_update_own on public.guided_template_submissions;
create policy guided_template_submissions_update_own on public.guided_template_submissions
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists guided_template_submissions_delete_own on public.guided_template_submissions;
create policy guided_template_submissions_delete_own on public.guided_template_submissions
for delete using (auth.uid() = user_id);

drop policy if exists generated_reports_select_own on public.generated_reports;
create policy generated_reports_select_own on public.generated_reports
for select using (auth.uid() = user_id);

drop policy if exists generated_reports_insert_own on public.generated_reports;
create policy generated_reports_insert_own on public.generated_reports
for insert with check (auth.uid() = user_id);

drop policy if exists lender_access_links_select_own on public.lender_access_links;
create policy lender_access_links_select_own on public.lender_access_links
for select using (auth.uid() = user_id);

drop policy if exists lender_access_links_insert_own on public.lender_access_links;
create policy lender_access_links_insert_own on public.lender_access_links
for insert with check (auth.uid() = user_id);

drop policy if exists lender_access_links_update_own on public.lender_access_links;
create policy lender_access_links_update_own on public.lender_access_links
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists lender_access_events_select_own on public.lender_access_events;
create policy lender_access_events_select_own on public.lender_access_events
for select using (
  exists (
    select 1
    from public.lender_access_links l
    where l.id = lender_access_events.lender_access_link_id
      and l.user_id = auth.uid()
  )
);

-- Private storage buckets used by dashboard uploads and final package archives.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('loan-package-documents', 'loan-package-documents', false, 26214400, array['application/pdf', 'image/png', 'image/jpeg', 'text/plain']),
  ('generated-packages', 'generated-packages', false, 104857600, array['application/zip', 'application/pdf', 'text/plain'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists loan_package_docs_select_own on storage.objects;
create policy loan_package_docs_select_own on storage.objects
for select to authenticated
using (
  bucket_id = 'loan-package-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists loan_package_docs_insert_own on storage.objects;
create policy loan_package_docs_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'loan-package-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists loan_package_docs_update_own on storage.objects;
create policy loan_package_docs_update_own on storage.objects
for update to authenticated
using (
  bucket_id = 'loan-package-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'loan-package-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists loan_package_docs_delete_own on storage.objects;
create policy loan_package_docs_delete_own on storage.objects
for delete to authenticated
using (
  bucket_id = 'loan-package-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists generated_packages_select_own on storage.objects;
create policy generated_packages_select_own on storage.objects
for select to authenticated
using (
  bucket_id = 'generated-packages'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists generated_packages_insert_own on storage.objects;
create policy generated_packages_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'generated-packages'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists generated_packages_update_own on storage.objects;
create policy generated_packages_update_own on storage.objects
for update to authenticated
using (
  bucket_id = 'generated-packages'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'generated-packages'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists generated_packages_delete_own on storage.objects;
create policy generated_packages_delete_own on storage.objects
for delete to authenticated
using (
  bucket_id = 'generated-packages'
  and (storage.foldername(name))[1] = auth.uid()::text
);

insert into public.document_requirements (
  requirement_key,
  service_type,
  category,
  display_name,
  description,
  required,
  sort_order,
  template_key,
  allowed_mime_types,
  max_size_mb,
  is_active
)
values
  (
    'personal_financial_statement',
    'loan_packaging',
    'financial_statement',
    'Personal Financial Statement',
    'Personal statement of assets and liabilities used for guarantor strength analysis.',
    true,
    10,
    'personal_financial_statement',
    array['application/pdf', 'image/png', 'image/jpeg'],
    25,
    true
  ),
  (
    'personal_debt_summary',
    'loan_packaging',
    'debt_schedule',
    'Personal Debt Summary',
    'Complete list of personal liabilities, monthly payments, and outstanding balances.',
    true,
    20,
    'personal_debt_summary',
    array['application/pdf', 'image/png', 'image/jpeg'],
    25,
    true
  ),
  (
    'business_debt_summary',
    'loan_packaging',
    'debt_schedule',
    'Business Debt Summary',
    'Current business obligations including lender, balance, payment, and maturity.',
    true,
    30,
    'business_debt_summary',
    array['application/pdf', 'image/png', 'image/jpeg'],
    25,
    true
  ),
  (
    'balance_sheet',
    'loan_packaging',
    'financial_statement',
    'Current Balance Sheet',
    'Most recent balance sheet prepared in lender-ready format.',
    true,
    40,
    'balance_sheet',
    array['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    25,
    true
  ),
  (
    'income_statement',
    'loan_packaging',
    'financial_statement',
    'Year-to-Date Income Statement',
    'Profit and loss statement aligned to year-to-date reporting period.',
    true,
    50,
    'income_statement',
    array['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    25,
    true
  ),
  (
    'business_tax_returns',
    'loan_packaging',
    'tax_return',
    'Business Tax Returns (2 Years)',
    'Complete signed federal business tax returns for the last two fiscal years.',
    true,
    60,
    null,
    array['application/pdf'],
    50,
    true
  ),
  (
    'cover_letter',
    'loan_packaging',
    'cover_letter',
    'Lender Cover Letter',
    'Structured narrative summarizing purpose, strengths, repayment capacity, and request terms.',
    true,
    70,
    null,
    array['application/pdf', 'text/plain'],
    10,
    true
  )
on conflict (requirement_key) do update
set
  service_type = excluded.service_type,
  category = excluded.category,
  display_name = excluded.display_name,
  description = excluded.description,
  required = excluded.required,
  sort_order = excluded.sort_order,
  template_key = excluded.template_key,
  allowed_mime_types = excluded.allowed_mime_types,
  max_size_mb = excluded.max_size_mb,
  is_active = excluded.is_active,
  updated_at = now();

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
    'personal_financial_statement',
    'Personal Financial Statement',
    'Guided net worth template with lender-aligned totals and validation.',
    1,
    '{"fields":["statement_date","owner_name","cash_on_hand","marketable_securities","retirement_accounts","real_estate_value","business_ownership_value","personal_property_value","other_assets","credit_card_debt","mortgage_debt","auto_loans","student_loans","tax_liabilities","other_liabilities","contingent_liabilities","contingent_liabilities_notes"]}'::jsonb,
    '{"sections":["Profile","Assets","Liabilities","Contingent Liabilities"]}'::jsonb,
    true
  ),
  (
    'personal_debt_summary',
    'Personal Debt Summary',
    'Structured monthly debt service roll-up for guarantor global cash flow review.',
    1,
    '{"fields":["report_date","borrower_name","monthly_income","mortgage_payment","auto_payment","credit_card_payment","student_loan_payment","personal_loan_payment","other_payment","past_due_debt","past_due_amount"]}'::jsonb,
    '{"sections":["Borrower Profile","Monthly Debt Service","Delinquency"]}'::jsonb,
    true
  ),
  (
    'business_debt_summary',
    'Business Debt Summary',
    'Debt schedule template for current obligations and weighted average interest profile.',
    1,
    '{"fields":["report_date","business_name","term_loan_balance","line_of_credit_balance","equipment_loan_balance","commercial_mortgage_balance","other_business_debt_balance","term_loan_payment","line_of_credit_payment","equipment_loan_payment","commercial_mortgage_payment","other_business_debt_payment","weighted_interest_rate","personal_guarantees_present","personal_guarantees_notes"]}'::jsonb,
    '{"sections":["Business Profile","Outstanding Balances","Monthly Debt Service","Guarantees"]}'::jsonb,
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
