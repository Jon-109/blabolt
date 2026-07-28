begin;

alter table public.client_accounts
  add column if not exists phone text,
  add column if not exists company_role text,
  add column if not exists lead_source text,
  add column if not exists deal_stage text not null default 'new_lead',
  add column if not exists priority text not null default 'normal',
  add column if not exists selected_path text,
  add column if not exists last_contacted_at timestamptz,
  add column if not exists target_close_date date,
  add column if not exists estimated_broker_fee numeric(12,2),
  add column if not exists lender_status text not null default 'not_started',
  add column if not exists lender_notes text,
  add column if not exists internal_score integer,
  add column if not exists portal_message text,
  add column if not exists client_portal_enabled boolean not null default true;

alter table public.client_accounts
  drop constraint if exists client_accounts_deal_stage_check,
  add constraint client_accounts_deal_stage_check check (deal_stage in ('new_lead','analysis_purchased','analysis_complete','package_started','package_complete','lender_feeler_ready','lender_feeler_sent','lender_interested','connected_to_lender','funded','closed_lost','nurture'));

alter table public.client_accounts
  drop constraint if exists client_accounts_priority_check,
  add constraint client_accounts_priority_check check (priority in ('low','normal','high','urgent'));

alter table public.client_accounts
  drop constraint if exists client_accounts_lender_status_check,
  add constraint client_accounts_lender_status_check check (lender_status in ('not_started','needs_package','ready_for_feeler','feeler_sent','interested','declined','connected','funded'));

alter table public.client_accounts
  drop constraint if exists client_accounts_selected_path_check,
  add constraint client_accounts_selected_path_check check (selected_path is null or selected_path in ('undecided','self_serve_package','lender_matching','templates_only','analysis_only'));

alter table public.client_accounts
  drop constraint if exists client_accounts_internal_score_check,
  add constraint client_accounts_internal_score_check check (internal_score is null or (internal_score >= 0 and internal_score <= 100));

create index if not exists idx_client_accounts_deal_stage on public.client_accounts(deal_stage);
create index if not exists idx_client_accounts_priority on public.client_accounts(priority);
create index if not exists idx_client_accounts_lender_status on public.client_accounts(lender_status);
create index if not exists idx_client_accounts_target_close_date on public.client_accounts(target_close_date);

commit;
