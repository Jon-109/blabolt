begin;

create table if not exists public.financing_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text,
  business_name text,
  source text not null default 'dscr_quick_calculator',
  status text not null default 'active' check (status in ('active', 'unsubscribed', 'bounced', 'complained')),
  dscr numeric(10,4) not null check (dscr >= 0 and dscr <= 1000),
  dscr_band text not null check (dscr_band in ('needs-improvement', 'very-tight', 'borderline', 'solid-start', 'strong-position', 'excellent-cushion')),
  loan_purpose text not null,
  requested_amount numeric(14,2) not null check (requested_amount > 0),
  monthly_net_income numeric(14,2) not null check (monthly_net_income > 0),
  current_monthly_debt_service numeric(14,2) not null check (current_monthly_debt_service >= 0),
  proposed_monthly_payment numeric(14,2) not null check (proposed_monthly_payment >= 0),
  total_monthly_debt_service numeric(14,2) not null check (total_monthly_debt_service > 0),
  interest_rate_pct numeric(7,4) not null check (interest_rate_pct >= 0 and interest_rate_pct <= 100),
  term_months integer not null check (term_months >= 1 and term_months <= 600),
  down_payment_pct numeric(7,4) not null default 0 check (down_payment_pct >= 0 and down_payment_pct <= 100),
  recommended_action text check (recommended_action in ('analysis', 'packaging')),
  result_email_requested boolean not null default true,
  marketing_consent boolean not null default false,
  consent_text_version text,
  consented_at timestamptz,
  unsubscribed_at timestamptz,
  unsubscribe_token_hash text not null unique check (unsubscribe_token_hash ~ '^[0-9a-f]{64}$'),
  request_identity_hash text not null check (request_identity_hash ~ '^[0-9a-f]{64}$'),
  attribution jsonb not null default '{}'::jsonb,
  result_email_status text not null default 'pending' check (result_email_status in ('pending', 'sent', 'delivered', 'failed', 'bounced', 'complained')),
  result_email_id text unique,
  result_email_sent_at timestamptz,
  result_email_delivered_at timestamptz,
  result_email_failed_at timestamptz,
  result_email_error text,
  last_email_event text,
  last_email_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financing_leads_email_normalized check (email = lower(btrim(email))),
  constraint financing_leads_marketing_consent_timestamp check (
    (marketing_consent = false and consented_at is null)
    or (marketing_consent = true and consented_at is not null and consent_text_version is not null)
  )
);

create index if not exists idx_financing_leads_created_at on public.financing_leads(created_at desc);
create index if not exists idx_financing_leads_email on public.financing_leads(email);
create index if not exists idx_financing_leads_dscr_band on public.financing_leads(dscr_band, created_at desc);
create index if not exists idx_financing_leads_marketing on public.financing_leads(marketing_consent, status, created_at desc);

alter table public.financing_leads enable row level security;
revoke all on table public.financing_leads from public, anon, authenticated;

drop trigger if exists trg_set_updated_at_financing_leads on public.financing_leads;
create trigger trg_set_updated_at_financing_leads
before update on public.financing_leads
for each row execute function public.set_updated_at();

create table if not exists public.dscr_email_usage_limits (
  usage_key_hash text not null,
  usage_date date not null,
  request_count integer not null default 0 check (request_count >= 0),
  burst_started_at timestamptz not null default now(),
  burst_count integer not null default 0 check (burst_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (usage_key_hash, usage_date),
  constraint dscr_email_usage_key_hash_format check (usage_key_hash ~ '^[0-9a-f]{64}$')
);

create index if not exists idx_dscr_email_usage_limits_date on public.dscr_email_usage_limits(usage_date);
alter table public.dscr_email_usage_limits enable row level security;
revoke all on table public.dscr_email_usage_limits from public, anon, authenticated;

create or replace function public.consume_dscr_email_quota(
  p_usage_key_hash text,
  p_daily_limit integer,
  p_burst_limit integer,
  p_burst_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer,
  reason text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_today date := (v_now at time zone 'UTC')::date;
  v_row public.dscr_email_usage_limits%rowtype;
  v_burst_started_at timestamptz;
  v_burst_count integer;
  v_retry_after integer;
begin
  if p_usage_key_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid usage key';
  end if;

  if p_daily_limit < 1 or p_burst_limit < 1 or p_burst_window_seconds < 1 then
    raise exception 'Invalid quota configuration';
  end if;

  insert into public.dscr_email_usage_limits (
    usage_key_hash,
    usage_date,
    request_count,
    burst_started_at,
    burst_count,
    updated_at
  )
  values (p_usage_key_hash, v_today, 0, v_now, 0, v_now)
  on conflict (usage_key_hash, usage_date) do nothing;

  select usage.*
  into v_row
  from public.dscr_email_usage_limits as usage
  where usage.usage_key_hash = p_usage_key_hash
    and usage.usage_date = v_today
  for update;

  if v_row.request_count >= p_daily_limit then
    v_retry_after := greatest(
      1,
      ceil(extract(epoch from (((v_today + 1)::timestamp at time zone 'UTC') - v_now)))::integer
    );
    return query select false, 0, v_retry_after, 'daily'::text;
    return;
  end if;

  if v_row.burst_started_at + make_interval(secs => p_burst_window_seconds) <= v_now then
    v_burst_started_at := v_now;
    v_burst_count := 0;
  else
    v_burst_started_at := v_row.burst_started_at;
    v_burst_count := v_row.burst_count;
  end if;

  if v_burst_count >= p_burst_limit then
    v_retry_after := greatest(
      1,
      ceil(extract(epoch from ((v_burst_started_at + make_interval(secs => p_burst_window_seconds)) - v_now)))::integer
    );
    return query select false, p_daily_limit - v_row.request_count, v_retry_after, 'burst'::text;
    return;
  end if;

  update public.dscr_email_usage_limits as usage
  set request_count = v_row.request_count + 1,
      burst_started_at = v_burst_started_at,
      burst_count = v_burst_count + 1,
      updated_at = v_now
  where usage.usage_key_hash = p_usage_key_hash
    and usage.usage_date = v_today;

  if random() < 0.01 then
    delete from public.dscr_email_usage_limits where usage_date < v_today - 35;
  end if;

  return query select true, p_daily_limit - (v_row.request_count + 1), 0, null::text;
end;
$$;

revoke all on function public.consume_dscr_email_quota(text, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_dscr_email_quota(text, integer, integer, integer)
  to service_role;

commit;
