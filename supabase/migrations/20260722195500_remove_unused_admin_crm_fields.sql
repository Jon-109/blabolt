alter table public.client_accounts
  drop column if exists internal_score,
  drop column if exists lender_notes;
