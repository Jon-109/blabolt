begin;

create table if not exists public.client_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  user_id uuid unique references auth.users(id) on delete set null,
  service_level text not null default 'none' check (service_level in ('none', 'comprehensive', 'templates', 'packaging', 'brokering')),
  access_comprehensive boolean not null default false,
  access_templates boolean not null default false,
  access_packaging boolean not null default false,
  next_step text,
  notes text,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_accounts_email_lowercase check (email = lower(email))
);

create index if not exists idx_client_accounts_service_level on public.client_accounts(service_level);
create index if not exists idx_client_accounts_updated_at on public.client_accounts(updated_at desc);

alter table public.client_accounts enable row level security;

drop trigger if exists trg_set_updated_at_client_accounts on public.client_accounts;
create trigger trg_set_updated_at_client_accounts
before update on public.client_accounts
for each row execute function public.set_updated_at();

drop policy if exists client_accounts_read_admins on public.client_accounts;
create policy client_accounts_read_admins on public.client_accounts
for select using (public.is_admin(auth.uid()));

drop policy if exists client_accounts_write_admins on public.client_accounts;
create policy client_accounts_write_admins on public.client_accounts
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

commit;
