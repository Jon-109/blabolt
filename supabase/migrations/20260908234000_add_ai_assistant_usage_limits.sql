begin;

create table if not exists public.ai_assistant_usage_limits (
  usage_key_hash text not null,
  usage_date date not null,
  request_count integer not null default 0 check (request_count >= 0),
  burst_started_at timestamptz not null default now(),
  burst_count integer not null default 0 check (burst_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (usage_key_hash, usage_date),
  constraint ai_assistant_usage_key_hash_format check (usage_key_hash ~ '^[0-9a-f]{64}$')
);

create index if not exists idx_ai_assistant_usage_limits_date
  on public.ai_assistant_usage_limits(usage_date);

alter table public.ai_assistant_usage_limits enable row level security;

revoke all on table public.ai_assistant_usage_limits from public, anon, authenticated;

create or replace function public.consume_ai_assistant_quota(
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
  v_row public.ai_assistant_usage_limits%rowtype;
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

  insert into public.ai_assistant_usage_limits (
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
  from public.ai_assistant_usage_limits as usage
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
      ceil(extract(epoch from (
        (v_burst_started_at + make_interval(secs => p_burst_window_seconds)) - v_now
      )))::integer
    );

    return query select false, p_daily_limit - v_row.request_count, v_retry_after, 'burst'::text;
    return;
  end if;

  update public.ai_assistant_usage_limits as usage
  set request_count = v_row.request_count + 1,
      burst_started_at = v_burst_started_at,
      burst_count = v_burst_count + 1,
      updated_at = v_now
  where usage.usage_key_hash = p_usage_key_hash
    and usage.usage_date = v_today;

  if random() < 0.01 then
    delete from public.ai_assistant_usage_limits
    where usage_date < v_today - 35;
  end if;

  return query select true, p_daily_limit - (v_row.request_count + 1), 0, null::text;
end;
$$;

revoke all on function public.consume_ai_assistant_quota(text, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_ai_assistant_quota(text, integer, integer, integer)
  to service_role;

commit;
