begin;

with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, template_type
      order by updated_at desc, created_at desc, id desc
    ) as recency_rank
  from public.template_submissions
  where archived_at is null
    and template_type in (
      'personal_financial_statement',
      'personal_debt_summary',
      'business_debt_summary'
    )
)
update public.template_submissions as template_submissions
set archived_at = now(),
    template_slot = null
from ranked
where template_submissions.id = ranked.id
  and ranked.recency_rank > 1;

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

commit;
