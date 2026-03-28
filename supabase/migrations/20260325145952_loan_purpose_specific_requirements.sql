begin;

alter table public.document_requirements
  add column if not exists loan_purpose text;

create index if not exists idx_document_requirements_service_purpose_active
  on public.document_requirements(service_type, loan_purpose, is_active, sort_order);

update public.loan_requests
set loan_purpose = 'Revolving Line of Credit',
    updated_at = now()
where loan_purpose = 'Line of Credit Support';

update public.user_template_profiles
set loan_purpose = 'Revolving Line of Credit',
    updated_at = now()
where loan_purpose = 'Line of Credit Support';

update public.document_requirements
set loan_purpose = null,
    updated_at = now()
where requirement_key in (
  'personal_debt_summary',
  'personal_financial_statement',
  'business_debt_summary',
  'balance_sheet',
  'income_statement_ytd',
  'income_statement_annual_year_1',
  'income_statement_annual_year_2',
  'business_tax_return_year_1',
  'business_tax_return_year_2',
  'cover_letter'
);

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
  ('working_capital_bank_statements', 'loan_packaging', 'Working Capital', 'bank_statement', 'Business Bank Statements / Account Analysis', 'Provide 3 to 6 months of business bank statements or an account analysis statement.', true, 210, null, array['application/pdf'], 50, true),
  ('working_capital_ar_aging', 'loan_packaging', 'Working Capital', 'other', 'Accounts Receivable Aging', 'Detailed receivables aging to show current collections and customer payment behavior.', true, 211, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('working_capital_ap_aging', 'loan_packaging', 'Working Capital', 'other', 'Accounts Payable Aging', 'Detailed payables aging to show vendor obligations and current working capital pressure.', true, 212, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('equipment_purchase_quote_package', 'loan_packaging', 'Equipment Purchase', 'other', 'Equipment Quote / Invoice / Purchase Order', 'Provide the equipment quote, invoice, whitepaper, or purchase order tied to the request.', true, 220, null, array['application/pdf','image/png','image/jpeg'], 50, true),
  ('equipment_purchase_specs', 'loan_packaging', 'Equipment Purchase', 'other', 'Equipment Specs', 'Manufacturer specifications, model details, or technical information for the equipment.', true, 221, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('inventory_purchase_inventory_aging', 'loan_packaging', 'Inventory Purchase', 'other', 'Inventory Aging', 'Inventory aging report showing stock levels, turns, and aging categories.', true, 230, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('inventory_purchase_supplier_quotes', 'loan_packaging', 'Inventory Purchase', 'other', 'Supplier Quotes / Purchase Orders', 'Quotes or purchase orders supporting the inventory purchase request.', true, 231, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('inventory_purchase_seasonality_explanation', 'loan_packaging', 'Inventory Purchase', 'other', 'Seasonality Explanation', 'Narrative explaining inventory timing, seasonal demand, and expected turnover.', true, 232, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('business_acquisition_loi', 'loan_packaging', 'Business Acquisition', 'other', 'LOI / Purchase Agreement', 'Letter of intent or purchase agreement for the acquisition transaction.', true, 240, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('business_acquisition_target_financials', 'loan_packaging', 'Business Acquisition', 'other', 'Target Company Financials', 'Financial statements for the target company being acquired.', true, 241, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('business_acquisition_valuation', 'loan_packaging', 'Business Acquisition', 'other', 'Valuation', 'Valuation support for the transaction price and business worth.', true, 242, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('business_acquisition_sources_uses', 'loan_packaging', 'Business Acquisition', 'other', 'Source and Use of Funds', 'Detailed sources and uses schedule for the acquisition financing.', true, 243, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('business_acquisition_buyer_resume', 'loan_packaging', 'Business Acquisition', 'other', 'Buyer Resume', 'Resume or background summary for the acquiring principal or operating buyer.', true, 244, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('business_acquisition_post_acquisition_projections', 'loan_packaging', 'Business Acquisition', 'other', 'Post-Acquisition Projections', 'Projected financial performance after closing the acquisition.', true, 245, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('cre_purchase_contract', 'loan_packaging', 'Commercial Real Estate Purchase', 'other', 'Purchase Contract / LOI', 'Purchase contract or letter of intent for the property acquisition.', true, 250, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('cre_purchase_rent_roll', 'loan_packaging', 'Commercial Real Estate Purchase', 'other', 'Rent Roll', 'Current rent roll, if the property has tenants.', true, 251, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('cre_purchase_operating_statements', 'loan_packaging', 'Commercial Real Estate Purchase', 'other', 'Property Operating Statements', 'Historical operating statements for the property, if applicable.', true, 252, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('cre_refinance_payoff_statement', 'loan_packaging', 'Commercial Real Estate Refinance', 'other', 'Payoff Statement', 'Current payoff statement for the loan being refinanced.', true, 260, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('cre_refinance_rent_roll', 'loan_packaging', 'Commercial Real Estate Refinance', 'other', 'Rent Roll', 'Current rent roll for the property, if applicable.', true, 261, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('cre_refinance_operating_statements', 'loan_packaging', 'Commercial Real Estate Refinance', 'other', 'Property Operating Statements', 'Historical operating statements for the property.', true, 262, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('debt_refinance_payoff_letters', 'loan_packaging', 'Debt Refinance / Consolidation', 'other', 'Payoff Letters', 'Payoff letters for each debt that will be refinanced or consolidated.', true, 270, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('debt_refinance_current_statements', 'loan_packaging', 'Debt Refinance / Consolidation', 'other', 'Current Loan Statements', 'Most recent statements for each debt being refinanced or consolidated.', true, 271, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('expansion_lease_loi', 'loan_packaging', 'Business Expansion / New Location', 'other', 'Lease / LOI', 'Lease agreement or letter of intent for the new location.', true, 280, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('expansion_buildout_budget', 'loan_packaging', 'Business Expansion / New Location', 'other', 'Buildout Budget', 'Detailed budget for buildout, opening costs, and location readiness.', true, 281, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('expansion_projections', 'loan_packaging', 'Business Expansion / New Location', 'other', 'Expansion Projections', 'Financial projections showing the impact of the new location or expansion.', true, 282, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('expansion_staffing_plan', 'loan_packaging', 'Business Expansion / New Location', 'other', 'Hiring / Staffing Plan', 'Staffing plan for the expansion, including headcount needs and timing.', true, 283, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('expansion_market_rationale', 'loan_packaging', 'Business Expansion / New Location', 'other', 'Market Rationale', 'Narrative supporting market demand, location fit, and expansion logic.', true, 284, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('expansion_licenses', 'loan_packaging', 'Business Expansion / New Location', 'other', 'Licenses / Permits', 'Relevant licenses or regulatory approvals for the expansion, if applicable.', true, 285, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('tenant_improvement_contractor_bids', 'loan_packaging', 'Tenant Improvements / Renovation', 'other', 'Contractor Bids', 'Contractor bids or proposals for the renovation work.', true, 290, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('tenant_improvement_budget', 'loan_packaging', 'Tenant Improvements / Renovation', 'other', 'Renovation Budget', 'Detailed renovation budget for labor, materials, and related costs.', true, 291, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('tenant_improvement_timeline', 'loan_packaging', 'Tenant Improvements / Renovation', 'other', 'Renovation Timeline', 'Timeline showing project phases, completion expectations, and milestones.', true, 292, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('tenant_improvement_lease_landlord_consent', 'loan_packaging', 'Tenant Improvements / Renovation', 'other', 'Lease and Landlord Consent', 'Current lease and landlord consent or approval for the planned improvements.', true, 293, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('tenant_improvement_contingency_budget', 'loan_packaging', 'Tenant Improvements / Renovation', 'other', 'Contingency Budget', 'Budget buffer for overruns, change orders, and unforeseen renovation costs.', true, 294, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('tenant_improvement_permits', 'loan_packaging', 'Tenant Improvements / Renovation', 'other', 'Permits', 'Relevant permits or permit application evidence, if applicable.', true, 295, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('partner_buyout_operating_agreement', 'loan_packaging', 'Partner Buyout', 'other', 'Operating Agreement', 'Operating agreement or governing document supporting the ownership structure.', true, 300, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('partner_buyout_cap_table', 'loan_packaging', 'Partner Buyout', 'other', 'Cap Table', 'Current capitalization table showing ownership percentages before the buyout.', true, 301, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('partner_buyout_agreement', 'loan_packaging', 'Partner Buyout', 'other', 'Buyout Agreement', 'Agreement governing the partner buyout transaction.', true, 302, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('partner_buyout_valuation', 'loan_packaging', 'Partner Buyout', 'other', 'Valuation', 'Valuation support for the partner buyout price.', true, 303, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('partner_buyout_transfer_docs', 'loan_packaging', 'Partner Buyout', 'other', 'Ownership Transfer Documents', 'Documents supporting the ownership transfer and resulting structure.', true, 304, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('partner_buyout_repayment_impact', 'loan_packaging', 'Partner Buyout', 'other', 'Repayment Impact Explanation', 'Narrative explaining how the buyout affects operations and repayment capacity.', true, 305, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('franchise_agreement_approval', 'loan_packaging', 'Franchise Purchase', 'other', 'Franchise Agreement / Approval', 'Executed franchise agreement or franchisor approval documentation.', true, 310, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('franchise_startup_budget', 'loan_packaging', 'Franchise Purchase', 'other', 'Startup Budget', 'Detailed startup budget for the franchise location or launch.', true, 311, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('franchise_assumptions', 'loan_packaging', 'Franchise Purchase', 'other', 'Franchisor Assumptions', 'Franchisor assumptions, unit economics, or operating benchmarks.', true, 312, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('franchise_operator_resume', 'loan_packaging', 'Franchise Purchase', 'other', 'Operator Resume', 'Resume or operating background for the franchise operator or principal.', true, 313, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('bridge_exit_strategy', 'loan_packaging', 'Bridge Financing', 'other', 'Exit Strategy', 'Clear explanation of the expected bridge takeout or exit source.', true, 320, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('bridge_payoff_source', 'loan_packaging', 'Bridge Financing', 'other', 'Payoff Source', 'Documentation supporting the expected payoff source.', true, 321, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('bridge_collateral_support', 'loan_packaging', 'Bridge Financing', 'other', 'Collateral Support', 'Collateral documentation supporting the bridge request.', true, 322, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('bridge_maturity_timeline', 'loan_packaging', 'Bridge Financing', 'other', 'Maturity Timeline', 'Timeline for maturity, refinance, sale, or bridge exit milestones.', true, 323, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('bridge_pending_sale_refi_docs', 'loan_packaging', 'Bridge Financing', 'other', 'Pending Sale / Refinance Docs', 'Documents evidencing the pending sale, refinance, or exit event.', true, 324, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('bridge_short_term_cash_flow_plan', 'loan_packaging', 'Bridge Financing', 'other', 'Short-Term Cash Flow Plan', 'Short-term cash flow plan covering the bridge period.', true, 325, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('revolving_loc_ar_aging', 'loan_packaging', 'Revolving Line of Credit', 'other', 'Accounts Receivable Aging', 'Receivables aging to support line utilization and collection quality.', true, 330, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('revolving_loc_ap_aging', 'loan_packaging', 'Revolving Line of Credit', 'other', 'Accounts Payable Aging', 'Payables aging to show current obligations and working capital pressure.', true, 331, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('revolving_loc_customer_concentration', 'loan_packaging', 'Revolving Line of Credit', 'other', 'Customer Concentration Report', 'Report showing customer concentration and receivable exposure.', true, 332, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('revolving_loc_inventory_report', 'loan_packaging', 'Revolving Line of Credit', 'other', 'Inventory Report', 'Inventory report, if inventory supports the borrowing base.', true, 333, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('revolving_loc_borrowing_base', 'loan_packaging', 'Revolving Line of Credit', 'other', 'Borrowing-Base Support', 'Borrowing-base calculation or support schedule for the line request.', true, 334, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('revolving_loc_seasonality_explanation', 'loan_packaging', 'Revolving Line of Credit', 'other', 'Seasonality Explanation', 'Narrative explaining seasonal cash flow swings and line usage needs.', true, 335, null, array['application/pdf','image/png','image/jpeg'], 25, true),
  ('revolving_loc_bank_statements', 'loan_packaging', 'Revolving Line of Credit', 'bank_statement', 'Business Bank Statements', 'Provide 3 to 6 months of business bank statements for line underwriting.', true, 336, null, array['application/pdf'], 50, true)
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
