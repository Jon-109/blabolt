begin;

create table if not exists public.admin_users (
  id bigserial primary key,
  email text not null unique,
  user_id uuid unique references auth.users(id) on delete set null,
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_users_email_lowercase check (email = lower(email))
);

create index if not exists idx_admin_users_active on public.admin_users(is_active);

create table if not exists public.admin_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'blocked', 'done')),
  due_date date,
  owner_user_id uuid references auth.users(id) on delete set null,
  related_loan_request_id uuid references public.loan_requests(id) on delete set null,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_tasks_status_priority on public.admin_tasks(status, priority);
create index if not exists idx_admin_tasks_due_date on public.admin_tasks(due_date);

create table if not exists public.admin_reviews (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  review_type text not null default 'deal' check (review_type in ('deal', 'user', 'template', 'compliance', 'other')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  summary text,
  related_user_id uuid references auth.users(id) on delete set null,
  related_loan_request_id uuid references public.loan_requests(id) on delete set null,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_reviews_status_type on public.admin_reviews(status, review_type);

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    join auth.users u on u.id = check_user_id
    where au.is_active = true
      and (au.user_id = u.id or au.email = lower(u.email))
  );
$$;

grant execute on function public.is_admin(uuid) to authenticated;

alter table public.admin_users enable row level security;
alter table public.admin_tasks enable row level security;
alter table public.admin_reviews enable row level security;

drop trigger if exists trg_set_updated_at_admin_users on public.admin_users;
create trigger trg_set_updated_at_admin_users
before update on public.admin_users
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_admin_tasks on public.admin_tasks;
create trigger trg_set_updated_at_admin_tasks
before update on public.admin_tasks
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_admin_reviews on public.admin_reviews;
create trigger trg_set_updated_at_admin_reviews
before update on public.admin_reviews
for each row execute function public.set_updated_at();

drop policy if exists admin_users_read_admins on public.admin_users;
create policy admin_users_read_admins on public.admin_users
for select using (public.is_admin(auth.uid()));

drop policy if exists admin_users_write_admins on public.admin_users;
create policy admin_users_write_admins on public.admin_users
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists admin_tasks_read_admins on public.admin_tasks;
create policy admin_tasks_read_admins on public.admin_tasks
for select using (public.is_admin(auth.uid()));

drop policy if exists admin_tasks_write_admins on public.admin_tasks;
create policy admin_tasks_write_admins on public.admin_tasks
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists admin_reviews_read_admins on public.admin_reviews;
create policy admin_reviews_read_admins on public.admin_reviews
for select using (public.is_admin(auth.uid()));

drop policy if exists admin_reviews_write_admins on public.admin_reviews;
create policy admin_reviews_write_admins on public.admin_reviews
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

commit;
