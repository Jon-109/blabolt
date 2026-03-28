begin;

update public.loan_requests as loan_request
set business_name = coalesce(
      loan_request.business_name,
      profile.business_name,
      profile.business_legal_name
    ),
    loan_purpose = coalesce(loan_request.loan_purpose, profile.loan_purpose),
    loan_amount = coalesce(loan_request.loan_amount, profile.loan_amount),
    annual_revenue = coalesce(loan_request.annual_revenue, profile.annual_revenue),
    years_in_business = coalesce(loan_request.years_in_business, profile.years_in_business),
    business_description = coalesce(
      loan_request.business_description,
      profile.business_description
    ),
    updated_at = now()
from public.user_template_profiles as profile
where profile.user_id = loan_request.user_id
  and loan_request.status in ('draft', 'in_progress', 'submitted', 'completed')
  and (
    (loan_request.business_name is null and (profile.business_name is not null or profile.business_legal_name is not null))
    or (loan_request.loan_purpose is null and profile.loan_purpose is not null)
    or (loan_request.loan_amount is null and profile.loan_amount is not null)
    or (loan_request.annual_revenue is null and profile.annual_revenue is not null)
    or (loan_request.years_in_business is null and profile.years_in_business is not null)
    or (loan_request.business_description is null and profile.business_description is not null)
  );

commit;
