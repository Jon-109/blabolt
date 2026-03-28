begin;

alter table public.template_submissions
  add column if not exists template_slot smallint,
  add column if not exists archived_at timestamptz;

with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, template_type
      order by updated_at desc, created_at desc, id desc
    ) as recency_rank
  from public.template_submissions
  where archived_at is null
)
update public.template_submissions as template_submissions
set archived_at = now(),
    template_slot = null
from ranked
where template_submissions.id = ranked.id
  and ranked.recency_rank > 5
  and template_submissions.archived_at is null;

with active_ranked as (
  select
    id,
    row_number() over (
      partition by user_id, template_type
      order by created_at asc, id asc
    )::smallint as template_slot
  from public.template_submissions
  where archived_at is null
)
update public.template_submissions as template_submissions
set template_slot = active_ranked.template_slot
from active_ranked
where template_submissions.id = active_ranked.id
  and template_submissions.template_slot is distinct from active_ranked.template_slot;

alter table public.template_submissions
  drop constraint if exists template_submissions_template_slot_state;

alter table public.template_submissions
  add constraint template_submissions_template_slot_state
  check (
    (archived_at is null and template_slot between 1 and 5)
    or (archived_at is not null and template_slot is null)
  );

create unique index if not exists idx_template_submissions_user_type_slot_active
  on public.template_submissions(user_id, template_type, template_slot)
  where archived_at is null;

create index if not exists idx_template_submissions_user_type_active_updated
  on public.template_submissions(user_id, template_type, updated_at desc)
  where archived_at is null;

create or replace function public.assign_template_submission_slot()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  available_slot smallint;
begin
  if new.archived_at is not null then
    new.template_slot = null;
    return new;
  end if;

  if new.template_slot between 1 and 5 then
    return new;
  end if;

  select slot::smallint
  into available_slot
  from generate_series(1, 5) as slot
  where not exists (
    select 1
    from public.template_submissions existing_submission
    where existing_submission.user_id = new.user_id
      and existing_submission.template_type = new.template_type
      and existing_submission.archived_at is null
      and existing_submission.template_slot = slot
  )
  order by slot
  limit 1;

  if available_slot is null then
    raise exception 'Maximum of 5 % submissions allowed per user.', new.template_type
      using errcode = '23514';
  end if;

  new.template_slot = available_slot;
  return new;
end;
$$;

drop trigger if exists trg_assign_template_submission_slot on public.template_submissions;
create trigger trg_assign_template_submission_slot
before insert on public.template_submissions
for each row execute function public.assign_template_submission_slot();

create or replace function public.enforce_template_submission_limit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  existing_count integer;
begin
  if new.archived_at is not null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    select count(*)
    into existing_count
    from public.template_submissions
    where user_id = new.user_id
      and template_type = new.template_type
      and archived_at is null;

    if existing_count >= 5 then
      raise exception 'Maximum of 5 % submissions allowed per user.', new.template_type
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

commit;
