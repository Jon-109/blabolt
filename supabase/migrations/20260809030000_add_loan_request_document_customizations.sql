begin;

create table if not exists public.loan_request_document_customizations (
  id uuid primary key default gen_random_uuid(),
  loan_request_id uuid not null references public.loan_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  requirement_key text not null,
  display_name text not null,
  description text not null default '',
  category text not null default 'other' check (category in ('financial_statement', 'debt_schedule', 'tax_return', 'bank_statement', 'cover_letter', 'other')),
  required boolean not null default true,
  sort_order integer not null default 1000,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (loan_request_id, requirement_key)
);

create index if not exists idx_loan_request_document_customizations_request on public.loan_request_document_customizations(loan_request_id, is_active, sort_order);
create index if not exists idx_loan_request_document_customizations_user on public.loan_request_document_customizations(user_id);

drop trigger if exists trg_set_updated_at_loan_request_document_customizations on public.loan_request_document_customizations;
create trigger trg_set_updated_at_loan_request_document_customizations
before update on public.loan_request_document_customizations
for each row execute function public.set_updated_at();

alter table public.loan_request_document_customizations enable row level security;

drop policy if exists loan_request_document_customizations_select_own on public.loan_request_document_customizations;
create policy loan_request_document_customizations_select_own on public.loan_request_document_customizations
for select using (auth.uid() = user_id);

drop policy if exists loan_request_document_customizations_insert_own on public.loan_request_document_customizations;
create policy loan_request_document_customizations_insert_own on public.loan_request_document_customizations
for insert with check (auth.uid() = user_id);

drop policy if exists loan_request_document_customizations_update_own on public.loan_request_document_customizations;
create policy loan_request_document_customizations_update_own on public.loan_request_document_customizations
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists loan_request_document_customizations_delete_own on public.loan_request_document_customizations;
create policy loan_request_document_customizations_delete_own on public.loan_request_document_customizations
for delete using (auth.uid() = user_id);

commit;
