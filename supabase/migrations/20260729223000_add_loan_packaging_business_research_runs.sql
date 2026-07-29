begin;

create table if not exists public.loan_packaging_business_research_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  loan_request_id uuid references public.loan_requests(id) on delete cascade,
  business_name text not null,
  location text,
  website_url text,
  status text not null default 'completed' check (status in ('completed', 'failed')),
  model text,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  sources jsonb not null default '[]'::jsonb,
  suggestions jsonb not null default '{}'::jsonb,
  raw_response jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_business_research_runs_user_created
  on public.loan_packaging_business_research_runs(user_id, created_at desc);

create index if not exists idx_business_research_runs_loan_request_created
  on public.loan_packaging_business_research_runs(loan_request_id, created_at desc);

alter table public.loan_packaging_business_research_runs enable row level security;

drop policy if exists business_research_runs_select_own on public.loan_packaging_business_research_runs;
create policy business_research_runs_select_own on public.loan_packaging_business_research_runs
for select using (auth.uid() = user_id);

drop policy if exists business_research_runs_insert_own on public.loan_packaging_business_research_runs;
create policy business_research_runs_insert_own on public.loan_packaging_business_research_runs
for insert with check (auth.uid() = user_id);

commit;
