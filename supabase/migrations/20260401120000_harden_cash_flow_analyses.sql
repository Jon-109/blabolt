begin;

update public.cash_flow_analyses
set
  business_name = coalesce(nullif(btrim(business_name), ''), ''),
  term = nullif(btrim(term), ''),
  down_payment293 = nullif(btrim(down_payment293), '')
where
  business_name is null
  or business_name <> coalesce(nullif(btrim(business_name), ''), '')
  or term is distinct from nullif(btrim(term), '')
  or down_payment293 is distinct from nullif(btrim(down_payment293), '');

alter table public.cash_flow_analyses
  alter column business_name set default '',
  alter column business_name set not null,
  alter column created_at set default timezone('utc'::text, now()),
  alter column updated_at set default timezone('utc'::text, now()),
  alter column status set default 'inprogress',
  alter column user_id set not null;

drop trigger if exists set_timestamp on public.cash_flow_analyses;

drop policy if exists "Users can upsert their own analyses" on public.cash_flow_analyses;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cash_flow_analyses_business_name_length_check'
  ) then
    alter table public.cash_flow_analyses
      add constraint cash_flow_analyses_business_name_length_check
      check (char_length(business_name) <= 180);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'cash_flow_analyses_first_name_length_check'
  ) then
    alter table public.cash_flow_analyses
      add constraint cash_flow_analyses_first_name_length_check
      check (first_name is null or char_length(first_name) between 2 and 30);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'cash_flow_analyses_last_name_length_check'
  ) then
    alter table public.cash_flow_analyses
      add constraint cash_flow_analyses_last_name_length_check
      check (last_name is null or char_length(last_name) between 2 and 30);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'cash_flow_analyses_desired_amount_range_check'
  ) then
    alter table public.cash_flow_analyses
      add constraint cash_flow_analyses_desired_amount_range_check
      check (desired_amount is null or (desired_amount >= 0 and desired_amount <= 100000000));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'cash_flow_analyses_estimated_payment_nonnegative_check'
  ) then
    alter table public.cash_flow_analyses
      add constraint cash_flow_analyses_estimated_payment_nonnegative_check
      check (estimated_payment is null or estimated_payment >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'cash_flow_analyses_down_payment_nonnegative_check'
  ) then
    alter table public.cash_flow_analyses
      add constraint cash_flow_analyses_down_payment_nonnegative_check
      check (down_payment is null or down_payment >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'cash_flow_analyses_proposed_loan_nonnegative_check'
  ) then
    alter table public.cash_flow_analyses
      add constraint cash_flow_analyses_proposed_loan_nonnegative_check
      check (proposed_loan is null or proposed_loan >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'cash_flow_analyses_annualized_loan_nonnegative_check'
  ) then
    alter table public.cash_flow_analyses
      add constraint cash_flow_analyses_annualized_loan_nonnegative_check
      check (annualized_loan is null or annualized_loan >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'cash_flow_analyses_interest_rate_range_check'
  ) then
    alter table public.cash_flow_analyses
      add constraint cash_flow_analyses_interest_rate_range_check
      check (interest_rate is null or (interest_rate >= 0 and interest_rate <= 100));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'cash_flow_analyses_term_format_check'
  ) then
    alter table public.cash_flow_analyses
      add constraint cash_flow_analyses_term_format_check
      check (
        term is null
        or (
          term ~ '^[0-9]+$'
          and term::integer between 1 and 480
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'cash_flow_analyses_down_payment293_format_check'
  ) then
    alter table public.cash_flow_analyses
      add constraint cash_flow_analyses_down_payment293_format_check
      check (
        down_payment293 is null
        or (
          down_payment293 ~ '^[0-9]+(\.[0-9]+)?$'
          and down_payment293::numeric between 0 and 100
        )
      );
  end if;
end $$;

create index if not exists cash_flow_analyses_user_status_updated_at_idx
  on public.cash_flow_analyses (user_id, status, updated_at desc);

commit;
