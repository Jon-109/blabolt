begin;

alter table public.loan_request_documents
  add column if not exists excluded_from_package boolean not null default false,
  add column if not exists excluded_at timestamptz;

update public.loan_request_documents
set excluded_from_package = false
where excluded_from_package is null;

create index if not exists idx_loan_documents_request_excluded
  on public.loan_request_documents(loan_request_id, excluded_from_package);

commit;
