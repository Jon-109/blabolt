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
  max_size_mb,
  allowed_mime_types,
  is_active,
  updated_at
)
values
  (
    'additional_supporting_documents',
    'loan_packaging',
    null,
    'other',
    'Additional Supporting Documents',
    'Optional safety-net upload for anything helpful a lender should see, such as formation documents, licenses, quotes, invoices, contracts, leases, estimates, or explanations.',
    false,
    900,
    null,
    50,
    array['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    true,
    now()
  ),
  (
    'additional_supporting_documents_2',
    'loan_packaging',
    null,
    'other',
    'Additional Supporting Documents 2',
    'Optional extra slot for another supporting file the lender may find useful.',
    false,
    901,
    null,
    50,
    array['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    true,
    now()
  ),
  (
    'additional_supporting_documents_3',
    'loan_packaging',
    null,
    'other',
    'Additional Supporting Documents 3',
    'Optional extra slot for another supporting file the lender may find useful.',
    false,
    902,
    null,
    50,
    array['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    true,
    now()
  )
on conflict (requirement_key) do update set
  service_type = excluded.service_type,
  loan_purpose = excluded.loan_purpose,
  category = excluded.category,
  display_name = excluded.display_name,
  description = excluded.description,
  required = excluded.required,
  sort_order = excluded.sort_order,
  template_key = excluded.template_key,
  max_size_mb = excluded.max_size_mb,
  allowed_mime_types = excluded.allowed_mime_types,
  is_active = excluded.is_active,
  updated_at = now();

commit;
