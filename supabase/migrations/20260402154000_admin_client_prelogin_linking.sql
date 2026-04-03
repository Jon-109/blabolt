alter table public.client_accounts
  alter column email drop not null;

alter table public.client_accounts
  add column if not exists pending_shared_profile jsonb not null default '{}'::jsonb;
