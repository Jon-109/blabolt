begin;

alter table public.client_accounts
  add column if not exists business_name text;

commit;
