begin;

create or replace function public.enforce_template_submission_limit()
returns trigger
language plpgsql
as $$
declare
  existing_count integer;
begin
  if new.template_type in ('income_statement', 'balance_sheet') then
    if tg_op = 'INSERT' then
      select count(*) into existing_count
      from public.template_submissions
      where user_id = new.user_id
        and template_type = new.template_type;

      if existing_count >= 5 then
        raise exception 'Maximum of 5 % submissions allowed per user.', new.template_type
          using errcode = '23514';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_template_submission_limit on public.template_submissions;
create trigger trg_template_submission_limit
before insert on public.template_submissions
for each row execute function public.enforce_template_submission_limit();

create index if not exists idx_template_submissions_user_type_updated
  on public.template_submissions(user_id, template_type, updated_at desc);

commit;
