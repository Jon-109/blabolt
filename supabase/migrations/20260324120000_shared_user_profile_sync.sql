begin;

alter table if exists public.user_template_profiles
  add column if not exists loan_purpose text,
  add column if not exists loan_amount numeric(14,2),
  add column if not exists annual_revenue numeric(14,2),
  add column if not exists years_in_business numeric(5,2),
  add column if not exists business_description text;

update public.loan_requests
set business_name = nullif(btrim(business_name), ''),
    business_description = nullif(btrim(business_description), ''),
    loan_purpose = nullif(btrim(loan_purpose), ''),
    strengths = nullif(btrim(strengths), ''),
    cover_letter_content = nullif(btrim(cover_letter_content), '')
where business_name is not null
   or business_description is not null
   or loan_purpose is not null
   or strengths is not null
   or cover_letter_content is not null;

update public.user_template_profiles
set personal_name = nullif(btrim(personal_name), ''),
    business_name = nullif(btrim(business_name), ''),
    business_legal_name = nullif(btrim(business_legal_name), ''),
    loan_purpose = nullif(btrim(loan_purpose), ''),
    business_description = nullif(btrim(business_description), '')
where personal_name is not null
   or business_name is not null
   or business_legal_name is not null
   or loan_purpose is not null
   or business_description is not null;

with latest_loan_request as (
  select distinct on (user_id)
    user_id,
    business_name,
    loan_purpose,
    loan_amount,
    annual_revenue,
    years_in_business,
    business_description
  from public.loan_requests
  where status in ('draft', 'in_progress', 'submitted', 'completed')
  order by user_id, updated_at desc, created_at desc
)
insert into public.user_template_profiles (
  user_id,
  business_name,
  business_legal_name,
  loan_purpose,
  loan_amount,
  annual_revenue,
  years_in_business,
  business_description
)
select
  latest_loan_request.user_id,
  latest_loan_request.business_name,
  latest_loan_request.business_name,
  latest_loan_request.loan_purpose,
  latest_loan_request.loan_amount,
  latest_loan_request.annual_revenue,
  latest_loan_request.years_in_business,
  latest_loan_request.business_description
from latest_loan_request
on conflict (user_id) do update
set business_name = coalesce(public.user_template_profiles.business_name, excluded.business_name),
    business_legal_name = coalesce(
      public.user_template_profiles.business_legal_name,
      excluded.business_legal_name
    ),
    loan_purpose = coalesce(public.user_template_profiles.loan_purpose, excluded.loan_purpose),
    loan_amount = coalesce(public.user_template_profiles.loan_amount, excluded.loan_amount),
    annual_revenue = coalesce(public.user_template_profiles.annual_revenue, excluded.annual_revenue),
    years_in_business = coalesce(
      public.user_template_profiles.years_in_business,
      excluded.years_in_business
    ),
    business_description = coalesce(
      public.user_template_profiles.business_description,
      excluded.business_description
    ),
    updated_at = now();

with latest_cash_flow as (
  select distinct on (user_id)
    user_id,
    nullif(btrim(business_name), '') as business_name
  from public.cash_flow_analyses
  order by user_id, updated_at desc, created_at desc
)
insert into public.user_template_profiles (
  user_id,
  business_name,
  business_legal_name
)
select
  latest_cash_flow.user_id,
  latest_cash_flow.business_name,
  latest_cash_flow.business_name
from latest_cash_flow
where latest_cash_flow.business_name is not null
on conflict (user_id) do update
set business_name = coalesce(public.user_template_profiles.business_name, excluded.business_name),
    business_legal_name = coalesce(
      public.user_template_profiles.business_legal_name,
      excluded.business_legal_name
    ),
    updated_at = now();

commit;
