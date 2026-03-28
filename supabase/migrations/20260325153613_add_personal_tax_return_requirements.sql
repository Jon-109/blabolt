begin;

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
values
  (
    'personal_tax_return_year_1',
    'loan_packaging',
    null,
    'tax_return',
    'Personal Tax Return - Year 1',
    'Signed federal personal tax return for the most recent completed year.',
    true,
    25,
    null,
    array['application/pdf'],
    50,
    true
  ),
  (
    'personal_tax_return_year_2',
    'loan_packaging',
    null,
    'tax_return',
    'Personal Tax Return - Year 2',
    'Signed federal personal tax return for two years ago.',
    true,
    26,
    null,
    array['application/pdf'],
    50,
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
  is_active = excluded.is_active,
  updated_at = now();

commit;
