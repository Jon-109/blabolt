begin;

alter table public.client_accounts
  add column if not exists granted_template_types text[] not null default array[]::text[];

commit;
