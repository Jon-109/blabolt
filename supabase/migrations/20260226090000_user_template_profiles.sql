begin;

create table if not exists public.user_template_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  personal_name text,
  business_name text,
  business_legal_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_template_profiles_updated_at
  on public.user_template_profiles(updated_at desc);

drop trigger if exists trg_set_updated_at_user_template_profiles on public.user_template_profiles;
create trigger trg_set_updated_at_user_template_profiles
before update on public.user_template_profiles
for each row execute function public.set_updated_at();

alter table public.user_template_profiles enable row level security;

drop policy if exists user_template_profiles_select_own on public.user_template_profiles;
create policy user_template_profiles_select_own on public.user_template_profiles
for select using (auth.uid() = user_id);

drop policy if exists user_template_profiles_insert_own on public.user_template_profiles;
create policy user_template_profiles_insert_own on public.user_template_profiles
for insert with check (auth.uid() = user_id);

drop policy if exists user_template_profiles_update_own on public.user_template_profiles;
create policy user_template_profiles_update_own on public.user_template_profiles
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists user_template_profiles_delete_own on public.user_template_profiles;
create policy user_template_profiles_delete_own on public.user_template_profiles
for delete using (auth.uid() = user_id);

commit;
