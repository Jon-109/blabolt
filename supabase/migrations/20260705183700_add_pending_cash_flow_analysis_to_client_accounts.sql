begin;

alter table public.client_accounts
  add column if not exists pending_cash_flow_analysis jsonb not null default '{}'::jsonb;

commit;
