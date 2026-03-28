create table if not exists public.broker_fee_agreements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  loan_request_id uuid references public.loan_requests(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'signed')),
  business_name text,
  signer_name text,
  agreed_to_terms boolean not null default false,
  signed_at timestamptz,
  pdf_path text,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists broker_fee_agreements_loan_request_id_idx
  on public.broker_fee_agreements (loan_request_id);

alter table public.broker_fee_agreements enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'broker_fee_agreements'
      and policyname = 'broker_fee_agreements_select_own'
  ) then
    create policy broker_fee_agreements_select_own
      on public.broker_fee_agreements
      for select
      using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'broker_fee_agreements'
      and policyname = 'broker_fee_agreements_insert_own'
  ) then
    create policy broker_fee_agreements_insert_own
      on public.broker_fee_agreements
      for insert
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'broker_fee_agreements'
      and policyname = 'broker_fee_agreements_update_own'
  ) then
    create policy broker_fee_agreements_update_own
      on public.broker_fee_agreements
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

drop trigger if exists set_broker_fee_agreements_updated_at on public.broker_fee_agreements;
create trigger set_broker_fee_agreements_updated_at
before update on public.broker_fee_agreements
for each row
execute function public.set_updated_at();

alter table public.generated_reports
  drop constraint if exists generated_reports_source_type_check;

alter table public.generated_reports
  add constraint generated_reports_source_type_check
  check (
    source_type in (
      'template_submission',
      'cash_flow_analysis',
      'loan_packaging',
      'cover_letter',
      'broker_fee_agreement'
    )
  );

insert into public.document_requirements (
  requirement_key,
  service_type,
  loan_purpose,
  category,
  display_name,
  description,
  required,
  sort_order,
  template_key,
  allowed_mime_types,
  max_size_mb,
  is_active
)
values (
  'broker_fee_agreement',
  'loan_brokering',
  null,
  'other',
  'Signed Broker Fee Agreement',
  'Executed broker fee agreement authorizing BLA to broker the financing request and earn the closing-based fee only if funding occurs.',
  true,
  5,
  null,
  array['application/pdf'],
  10,
  true
)
on conflict (requirement_key) do update
set
  service_type = excluded.service_type,
  loan_purpose = excluded.loan_purpose,
  category = excluded.category,
  display_name = excluded.display_name,
  description = excluded.description,
  required = excluded.required,
  sort_order = excluded.sort_order,
  template_key = excluded.template_key,
  allowed_mime_types = excluded.allowed_mime_types,
  max_size_mb = excluded.max_size_mb,
  is_active = excluded.is_active;
