begin;

drop policy if exists financing_leads_deny_client_access on public.financing_leads;
create policy financing_leads_deny_client_access
  on public.financing_leads
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists dscr_email_usage_limits_deny_client_access on public.dscr_email_usage_limits;
create policy dscr_email_usage_limits_deny_client_access
  on public.dscr_email_usage_limits
  for all
  to anon, authenticated
  using (false)
  with check (false);

commit;
