begin;

update public.document_requirements
set is_active = false,
    updated_at = now()
where requirement_key in ('business_tax_returns', 'income_statement');

insert into public.document_requirements (
  requirement_key,
  service_type,
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
values
  (
    'income_statement_ytd',
    'loan_packaging',
    'financial_statement',
    'Income Statement - YTD',
    'Current year-to-date profit and loss statement.',
    true,
    50,
    'income_statement',
    array['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    25,
    true
  ),
  (
    'income_statement_annual_year_1',
    'loan_packaging',
    'financial_statement',
    'Income Statement - Annual (Year 1)',
    'Full-year profit and loss statement for the most recent completed year.',
    true,
    51,
    null,
    array['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    25,
    true
  ),
  (
    'income_statement_annual_year_2',
    'loan_packaging',
    'financial_statement',
    'Income Statement - Annual (Year 2)',
    'Full-year profit and loss statement for two years ago.',
    true,
    52,
    null,
    array['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    25,
    true
  ),
  (
    'business_tax_return_year_1',
    'loan_packaging',
    'tax_return',
    'Business Tax Return - Year 1',
    'Signed federal business tax return for the most recent completed year.',
    true,
    60,
    null,
    array['application/pdf'],
    50,
    true
  ),
  (
    'business_tax_return_year_2',
    'loan_packaging',
    'tax_return',
    'Business Tax Return - Year 2',
    'Signed federal business tax return for two years ago.',
    true,
    61,
    null,
    array['application/pdf'],
    50,
    true
  )
on conflict (requirement_key) do update
set
  service_type = excluded.service_type,
  category = excluded.category,
  display_name = excluded.display_name,
  description = excluded.description,
  required = excluded.required,
  sort_order = excluded.sort_order,
  template_key = excluded.template_key,
  allowed_mime_types = excluded.allowed_mime_types,
  max_size_mb = excluded.max_size_mb,
  is_active = excluded.is_active,
  updated_at = now();

update public.document_requirements
set required = false,
    updated_at = now()
where requirement_key = 'cover_letter'
  and service_type = 'loan_packaging';

with candidates as (
  select d.id,
         case
           when d.requirement_key = 'business_tax_returns' then 'business_tax_return_year_1'
           when d.requirement_key = 'income_statement'
             and coalesce(d.metadata->>'period_kind', '') = 'ytd' then 'income_statement_ytd'
           when d.requirement_key = 'income_statement'
             and d.source = 'template' then 'income_statement_ytd'
           when d.requirement_key = 'income_statement' then 'income_statement_annual_year_1'
           else null
         end as next_requirement_key
  from public.loan_request_documents d
  where d.requirement_key in ('business_tax_returns', 'income_statement')
),
filtered as (
  select c.id, c.next_requirement_key
  from candidates c
  where c.next_requirement_key is not null
),
updatable as (
  select f.id, f.next_requirement_key
  from filtered f
  join public.loan_request_documents d on d.id = f.id
  where not exists (
    select 1
    from public.loan_request_documents existing
    where existing.loan_request_id = d.loan_request_id
      and existing.requirement_key = f.next_requirement_key
  )
)
update public.loan_request_documents d
set requirement_key = u.next_requirement_key,
    metadata = coalesce(d.metadata, '{}'::jsonb)
      || jsonb_build_object('migrated_from_requirement_key', d.requirement_key),
    updated_at = now()
from updatable u
where d.id = u.id;

commit;
