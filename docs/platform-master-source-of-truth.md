# Business Lending Advocate: Platform Master Source of Truth

**Status:** Canonical product, business, and technical reference  
**Last verified:** September 23, 2026  
**Verified against repository:** `main` at `721e38f`  
**Legal entity shown in current Terms:** Lending Advocate, LLC  
**Public brand:** Business Lending Advocate (BLA)

## 1. How to Use This Document

This is the primary internal source of truth for what Business Lending Advocate is, who it serves, what it sells, how users move through it, how the software works, and what should be built next.

When sources disagree, use this precedence order:

1. Current production code and database migrations
2. Current customer-facing product pages
3. This document
4. Older PRDs and implementation notes

The following files remain useful historical references but are not canonical:

- `docs/platform-as-is-investor-breakdown.md` — February 2026 snapshot; now partially stale
- `docs/loan-packaging-dashboard-PRD.md` — original dashboard plan; the JotForm brokering path has been replaced by a native agreement workflow
- `docs/loan-packaging-platform-implementation.md` — implementation notes rather than current business truth
- `docs/analytics-readme.md` and `docs/analytics-audit.md` — analytics-specific references

Update this file whenever pricing, positioning, entitlements, core workflows, official-form versions, or major integrations change.

---

## 2. Executive Summary

Business Lending Advocate is a **small-business financing readiness and loan-application operating system**. It helps business owners understand borrowing capacity, prepare lender-ready financial documents, assemble a coherent loan package, and optionally receive hands-on lender matching and brokering support.

The core customer problem is not merely “finding a lender.” It is that many borrowers approach lenders with:

- An unclear request or use of funds
- Incomplete or inconsistent financial information
- Missing lender-required documents
- No defensible repayment narrative
- Limited understanding of DSCR, debt burden, collateral, guarantees, or lender fit
- Repetitive application work across lenders
- No organized way to track readiness and next steps

BLA addresses this through a product ladder:

1. **Free education and readiness tools** create understanding and qualified demand.
2. **Guided financial templates** turn borrower information into lender-readable documents.
3. **Loan Packaging** organizes the request, documents, financial analysis, and lender narrative.
4. **Loan Brokering** adds human lender matching, outreach, follow-up, and deal support.

The strongest strategic positioning is:

> Business Lending Advocate helps small-business owners become lender-ready before they apply—then gives them the tools or hands-on support to move a complete, understandable financing request through the market.

BLA is not a lender and does not make credit decisions. Its value is borrower preparation, consistency, education, packaging, and process support.

---

## 3. Mission, Product Promise, and Boundaries

### Mission

Reduce the confusion, rework, and avoidable rejection that small-business borrowers experience when seeking debt financing.

### Product promise

Help a borrower answer the questions lenders actually care about:

1. Who is the borrower and what does the business do?
2. How much financing is requested?
3. What exactly will the money be used for?
4. How will the business repay it?
5. What historical evidence supports repayment capacity?
6. What collateral, guarantees, equity, experience, or other mitigants support the request?
7. Is the application package complete, internally consistent, and easy to review?

### What BLA is

- A financing-readiness platform
- A guided document and application-preparation system
- A loan-packaging workspace
- An educational layer for first-time and inexperienced borrowers
- A human-assisted brokering workflow for customers who choose that path
- A secure handoff layer between borrower information and lender review

### What BLA is not

- A bank or direct lender
- A promise or guarantee of approval
- A replacement for lender underwriting
- A CPA, law firm, or financial advisory firm
- An official SBA website or an SBA affiliate
- A system that should make unsupported credit, legal, tax, or eligibility determinations

---

## 4. Target Market and Ideal Customers

### Primary market

U.S. small-business owners seeking debt financing, especially those who do not already have a sophisticated finance team or an experienced commercial banker guiding the application.

### Primary customer segments

#### 4.1 First-time business borrowers

Needs:

- Plain-English education
- Help choosing a loan type and amount
- A list of required documents
- Confidence that the request is coherent
- Explanations of DSCR, guarantees, collateral, and lender expectations

Best entry points:

- Loan guides
- Free DSCR calculator
- Free comprehensive cash-flow analysis
- Lending assistant
- Templates and Loan Packaging

#### 4.2 Established businesses pursuing growth

Typical purposes:

- Working capital
- Equipment
- Inventory
- Expansion or a new location
- Tenant improvements
- Commercial real estate
- Debt refinancing

Needs:

- Multi-period cash-flow analysis
- Current financial statements
- Purpose-specific use-of-funds support
- A lender-facing executive narrative
- Faster assembly and fewer repeated requests

#### 4.3 Business acquisition and franchise borrowers

Needs:

- Sources-and-uses clarity
- Acquisition or franchise documentation
- Equity injection tracking
- Historical and projected cash flow
- Seller-note and debt-service treatment
- Transaction-specific checklist guidance

This segment is strategically attractive because the package is complex and willingness to pay is higher.

#### 4.4 Borrowers who have been declined or are uncertain about eligibility

Needs:

- A clear explanation of readiness gaps
- Repayment-capacity analysis
- Document and data cleanup
- Honest next steps instead of false approval promises
- Alternative paths such as improving cash flow, reducing debt, changing request size, or waiting

#### 4.5 DIY borrowers

These owners want to prepare the package themselves and contact lenders directly. They are the primary customer for the $499 Loan Packaging product.

#### 4.6 Assisted or brokered borrowers

These owners want BLA to manage lender matching and outreach. They are the primary customer for Loan Brokering at a success fee.

### Secondary users

- Internal BLA admins and loan advisors
- Accountants and bookkeepers helping clients prepare financials
- Business brokers and acquisition advisors
- Independent loan brokers and consultants
- SBDCs and other borrower-support organizations
- Lenders receiving a secure package link

### Buyer characteristics

The most natural early customer is:

- Applying for roughly $50,000 to $5 million
- Time-constrained
- Comfortable entering sensitive financial information into a secure portal
- Motivated by a near-term financing event
- Missing either expertise, organization, lender access, or all three
- Willing to pay to avoid delays, confusion, and repeated document work

---

## 5. Jobs to Be Done

Customers hire BLA to:

- Determine whether the business appears able to support a proposed loan payment
- Understand what lenders will ask for before starting applications
- Turn raw numbers into correctly structured financial documents
- Reuse the same borrower information instead of re-entering it repeatedly
- Identify missing documents and complete them in the right order
- Explain the request in lender language without exaggeration
- Package files so a lender can quickly understand the deal
- Share documents securely rather than sending uncontrolled email attachments
- Find lenders that fit the amount, purpose, industry, geography, collateral, and borrower profile
- Compare offers and avoid unexpectedly expensive financing
- Know what to do next when the application stalls

For inexperienced borrowers, the emotional job is equally important: replace uncertainty and embarrassment with a guided, credible process.

---

## 6. Current Product and Service Catalog

### 6.1 Free loan education and acquisition funnel

#### Public education

Implemented surfaces include:

- Home page
- SBA 7(a) borrower guide
- Loan-purpose guides
- FAQ
- Blog
- Loan payment calculator
- Loan Packaging demo

Purpose:

- Capture high-intent organic traffic
- Explain lending concepts
- Move visitors into readiness tools or a paid/assisted workflow

#### Free quick DSCR calculator

Route and surface:

- `/cash-flow-analysis`
- Quick calculator can be opened from public pages
- After receiving a result, visitors can request a transactional result email and separately opt into future financing-readiness guidance

Inputs include current cash flow, existing debt, and proposed financing assumptions. The calculator estimates payment structure and DSCR without creating a lender decision. Requested email results persist the DSCR band, assumptions, attribution, consent state, and delivery status in the protected financing-lead system.

Primary benefit:

- Immediate self-assessment
- Low-friction lead qualification
- Natural bridge into the comprehensive analysis

Price: **Free**

#### Free comprehensive cash-flow analysis

Route:

- `/comprehensive-cash-flow-analysis`

Current workflow:

1. Loan information
2. Multi-period financials
3. Existing business debts
4. Review and submit
5. Report preview and downloadable lender-facing reports

Outputs include:

- Cash-flow and DSCR analysis
- Business debt summary
- Multi-period financial interpretation
- PDF reports for inclusion in a loan package

Canonical current price: **Free with an account**

Both cash-flow tools are permanently free:

- The quick calculator provides an immediate high-level DSCR estimate without documents or a credit pull.
- The comprehensive workflow provides the deeper multi-period, debt-adjusted analysis and both lender-ready PDF reports after account creation.

The paid `cash_flow_analysis` checkout product has been retired. Legacy purchase records remain recognized for backward compatibility but are no longer required for access.

### 6.2 Lender-ready financial templates

Current templates:

1. Balance Sheet
2. Income Statement / Profit and Loss Statement
3. Business Debt Summary
4. SBA Form 413 Personal Financial Statement (current version effective February 13, 2025)
5. Personal Debt Summary

Capabilities:

- Guided plain-English inputs
- Autosave and saved submissions
- Calculated totals and validation
- Multiple submission slots/versions
- Browserless-generated PDFs
- Shared profile reuse
- In-context lending assistant
- Integration into Loan Packaging requirements

Pricing:

- **$9.99 per individual template**
- **$29.99 for all five templates**
- Full à-la-carte total: $49.95
- Bundle savings: $19.96
- Bundle limit: up to five submissions per template

Routes:

- Marketing: `/services/templates/*` and `/services/templates-bundle`
- Workspace: `/templates` and `/templates/[template_type]`

### 6.3 Loan Packaging

Price: **$499 one-time**

Audience:

- Borrowers who want a complete software workflow and intend to contact lenders themselves

Core workflow:

1. Create and maintain a reusable loan profile
2. Select loan purpose and define the request
3. Build an itemized use-of-funds schedule
4. View a purpose-specific document checklist
5. Upload files individually or in bulk
6. Complete included guided templates where documents are missing
7. Run or reuse comprehensive cash-flow analysis
8. Complete the lender cover-letter intake
9. Generate, edit, approve, and save the standardized lender cover letter
10. Build and download the package ZIP
11. Create password-protected, expiring lender links

Included features:

- Full Loan Packaging dashboard
- All five guided templates
- Dynamic checklist based on loan purpose and use-of-funds signals
- Required and optional document slots
- Bulk upload with checklist matching
- Skip/restore controls for documents
- Standardized OpenAI-assisted lender cover letter with deterministic fallback
- Business research assistance for cover-letter inputs
- Package ZIP creation
- Secure lender portal links
- Progress tracking and next-step guidance
- Context-aware lending assistant

Primary benefit:

- Convert a scattered application into one coherent lender file while reducing repetitive entry and missing-document friction

### 6.4 Loan Brokering

Price: **1% of the funded amount, due only if financing closes through a lender BLA introduces**

Upfront broker fee: **$0**

Current entry path:

1. User selects the brokering path.
2. User reviews and signs the native Broker Fee Agreement.
3. BLA creates or updates a `loan_brokering` request.
4. Signed agreement PDF is stored in the package.
5. User receives Loan Packaging and all-template access.
6. User completes the same borrower-readiness and packaging workflow.
7. BLA reviews the package and conducts lender outreach.

Brokering adds:

- Lender matching
- Lender feelers/outreach
- Follow-up and process support
- Interested-lender handoff
- Underwriting and closing coordination support

The software currently represents lender outreach primarily as an admin-operated workflow, not an automated open lender marketplace.

### 6.5 Context-aware AI lending assistant

Scopes:

- Global/public assistant
- Authenticated Loan Packaging dashboard assistant
- Template-specific assistant

Capabilities:

- Answers small-business lending questions
- Uses authenticated account, package, cash-flow, and template context when permitted
- Explains missing requirements and next steps
- Suggests verified in-app navigation actions
- Does not invent URLs
- Applies per-identity and global rate limits

Current limits:

- 25 questions per identity per day
- 5 questions per minute per identity
- 500 questions globally per day
- 50 questions globally per minute

The assistant is an educational and workflow-support feature, not an underwriter or approval engine.

### 6.6 Customer dashboard

Route:

- `/customer-dashboard`

Purpose:

- Show services assigned to the account
- Show DSCR snapshot
- Show template and package progress
- Show next required documents
- Display a message from BLA
- Provide direct links into active services

Service cards:

- Comprehensive Cash Flow Analysis
- Lender-Ready Templates
- Loan Packaging Workspace
- Loan Brokering

### 6.7 Admin operations and CRM

The internal admin dashboard supports:

- Client creation and account linking
- Service and template entitlement assignment
- Client portal activation and custom messages
- Cash-flow, template, packaging, and document visibility
- Deal stage, priority, selected path, next step, and target close date
- Lender outreach status
- Estimated broker fee
- Internal notes, reviews, and tasks
- Admin preview of customer dashboards
- Admin-assisted cash-flow and template workflows

This makes the platform a hybrid SaaS and service-operations system.

### 6.8 SBA Form 413 Personal Financial Statement

Canonical routes:

- Public/product entry: `/sba-413` and `/services/templates/personal-financial-statement`
- Authenticated workspace: `/templates/personal_financial_statement`

Current status: **production template product**

The obsolete local-only `/sba-413` prototype is bypassed by a canonical redirect into the production Personal Financial Statement workflow, preventing a third duplicate personal-financial data model.

Implemented:

- Current form version marker: February 13, 2025
- Authenticated Supabase persistence and autosave
- Multiple saved submissions/versions
- Shared borrower-profile prefill
- Guided identity, assets, liabilities, income, contingent obligations, declarations, and supporting schedules
- Validation and balance calculations
- Required attestation and typed e-signature
- Server-side signature/version validation before PDF generation
- Complete four-page SBA Form 413 background set and lender-ready PDF rendering
- Private Supabase PDF storage and signed access
- Standalone $9.99 entitlement, five-template bundle access, and inclusion with Loan Packaging/Brokering
- Customer dashboard, admin, lending-assistant, and Loan Packaging integration
- Form-version metadata in saved form data and generated package documents

---

## 7. Pricing and Monetization Source of Truth

| Offering | Current price | Billing model | Current role |
|---|---:|---|---|
| Quick DSCR Calculator | $0 | Free | Acquisition and education |
| Comprehensive Cash-Flow Analysis | $0 | Free with account | Lead qualification and readiness |
| Individual financial template | $9.99 | One-time | Low-ticket self-service |
| Five-template bundle | $29.99 | One-time | Entry paid product |
| Loan Packaging | $499 | One-time | Core self-service / done-with-you product |
| Loan Brokering | 1% funded amount | Success fee at closing | High-value assisted service |
| SBA Form 413 Personal Financial Statement | $9.99 standalone; included in bundle/full service | One-time | Guided official-form workflow |

### Monetization ladder

Recommended conceptual ladder:

1. Free education
2. Free readiness analysis
3. $9.99 template
4. $29.99 template bundle
5. Future SBA Application Kit
6. $499 Loan Packaging
7. 1% success-fee Loan Brokering
8. Future B2B/white-label subscription

### Pricing policy

1. Both quick and comprehensive cash-flow analysis are permanently free lead-generation and readiness products.
2. SBA Form 413 is the current Personal Financial Statement template: $9.99 standalone and included in the $29.99 bundle, Loan Packaging, and Loan Brokering.
3. All current customer software products are one-time purchases; brokering creates variable service revenue.
4. The template pricing structure should be revisited when the library expands beyond the current five products.

---

## 8. User Journeys

### 8.1 Anonymous education-to-readiness path

1. Visitor arrives from search, ad, direct traffic, or referral.
2. Visitor reads a loan guide, SBA guide, FAQ, or blog article.
3. Visitor uses the quick DSCR calculator.
4. Visitor is invited to create an account for comprehensive analysis.
5. User completes analysis and receives reports.
6. User is offered templates, Loan Packaging, or Brokering based on readiness and intent.

### 8.2 Individual-template buyer

1. Visitor lands on a template service page or bundle page.
2. User chooses one or more templates.
3. User signs in or creates an account.
4. Stripe Checkout processes payment.
5. Webhook records purchases.
6. Entitlements expose only purchased or assigned templates.
7. User completes forms, saves versions, and generates PDFs.
8. User can later upgrade to the bundle or Loan Packaging.

### 8.3 Loan Packaging buyer

1. User chooses Loan Packaging from `/loan-services`.
2. Readiness modal collects path and request context.
3. User authenticates.
4. Stripe Checkout processes $499.
5. Purchase confirmation and webhook grant access.
6. User enters `/loan-packaging`.
7. User completes profile, documents, analysis, and cover letter.
8. User exports ZIP and/or creates secure lender links.
9. User handles lender outreach independently.

### 8.4 Loan Brokering customer

1. User chooses Brokering.
2. User authenticates and reviews the native agreement.
3. User types signature, accepts the 1% closing-based fee, and signs.
4. Browserless renders the signed PDF.
5. Agreement and package requirement are persisted.
6. User is redirected to Loan Packaging with full access.
7. User completes the package.
8. BLA reviews, sends lender feelers, and tracks interest.
9. BLA connects interested lenders and supports underwriting/closing.
10. If a BLA-introduced financing closes, the 1% fee becomes due.

### 8.5 Admin-created client

1. Admin creates or links a client account.
2. Admin assigns services and/or specific templates.
3. Admin can seed pending analysis data before login.
4. Client signs in and is linked by user ID or normalized email.
5. Client sees assigned services in the customer dashboard.
6. Admin monitors progress, updates pipeline data, and posts portal messages.

### 8.6 Lender recipient

1. Borrower creates a password-protected lender link with an expiration date.
2. Lender opens `/lender/[token]`.
3. Lender enters the password.
4. System checks token, expiry, revocation, and password hash.
5. Lender receives signed URLs for available package artifacts.
6. Access event and count are recorded.

---

## 9. Core Feature-to-Benefit Map

| Feature | Customer benefit |
|---|---|
| Quick DSCR calculator | Immediate view of repayment coverage before applying |
| Multi-period cash-flow analysis | Shows how lenders may interpret historical and YTD performance |
| Existing-debt schedule | Prevents understated obligations and clarifies total debt service |
| Shared profile | Reduces repetitive entry across services |
| Guided templates | Converts raw data into lender-readable formats without spreadsheet expertise |
| Purpose-specific checklist | Tells borrowers what is needed for the actual use of funds |
| Bulk upload | Reduces one-file-at-a-time friction |
| Standardized cover letter | Gives lenders a concise request, repayment, and risk narrative |
| Business research assistance | Reduces intake effort while requiring borrower review |
| Package ZIP | Produces a controlled, organized lender file |
| Secure lender links | Avoids uncontrolled attachment chains and supports access revocation |
| Lending assistant | Explains questions at the moment of confusion |
| Customer dashboard | Centralizes progress and next actions |
| Admin CRM | Lets BLA operate the human service efficiently |
| Brokering workflow | Extends preparation into lender matching and closing support |

---

## 10. Product Positioning and Messaging

### Recommended category

**Small-business financing readiness and loan-application software with optional human lender support.**

“Loan marketplace” is not an accurate primary category today because the app does not expose a self-serve, multi-lender marketplace. “Document templates” is too narrow because the package, analysis, secure sharing, AI support, and brokering workflow are broader.

### Core differentiation

BLA combines elements that are usually fragmented:

- Borrower education
- Repayment-capacity analysis
- Financial document generation
- Purpose-specific document requirements
- Lender narrative generation
- Secure package delivery
- Human lender outreach

### Recommended one-line explanation

> Understand your borrowing position, build the documents lenders expect, and deliver one organized loan request—with optional help finding the right lender.

### Message hierarchy

1. **Clarity:** Know what lenders need and why.
2. **Readiness:** Fix missing or inconsistent information before applying.
3. **Efficiency:** Enter information once and reuse it.
4. **Credibility:** Present a professional, internally consistent package.
5. **Choice:** Contact lenders yourself or use BLA’s brokering support.

### Claims to avoid or substantiate

Current copy should be reviewed before broad paid acquisition for claims such as:

- “Cuts 25–40% off review time”
- “Guarantees a bank-quality package”
- Negotiating personal-guarantee burn-offs as a general expectation
- Specific underwriting timelines presented as universal
- Statements that imply increased approval odds without evidence

Prefer verifiable claims about organization, completeness, calculations, and workflow behavior.

---

## 11. Technical Architecture

### Application layer

- Next.js 15 App Router
- React 18
- TypeScript
- Tailwind CSS
- Radix-based UI primitives plus MUI/Emotion in legacy areas
- Server and client components
- Next.js route handlers for backend APIs

### Identity, database, and storage

- Supabase Auth
- Supabase Postgres
- Supabase Row Level Security
- Supabase Storage
- Service-role server client for privileged route operations
- Bearer-token validation for protected APIs

### Payments

- Stripe Checkout
- Environment-configured product and price IDs
- One-time payment mode
- Promotion-code support
- Webhook signature verification
- Purchase entitlements persisted in `purchases`
- Checkout-session confirmation fallback after redirect

### AI

- OpenAI Responses API
- Global, dashboard, and template assistant contexts
- Standardized Loan Packaging cover-letter generation
- Deterministic cover-letter fallback
- Public website research assistance for cover-letter fields
- Per-user/IP and global assistant quotas
- Model context sanitization and prompt-injection boundary language

### Documents and PDFs

- Browserless HTML-to-PDF rendering
- Supabase private storage
- Signed URLs
- PDF report pages for analyses, templates, cover letters, and broker agreements
- ZIP package assembly with canonical filenames and package summary metadata

### Communications and acquisition

- Resend contact email
- Embedded Google Form at `/get-funded` as a legacy intake surface
- GA4
- Google Ads conversion tracking
- Google Tag Manager
- UTM capture and analytics allowlisting to limit PII exposure

### Search/SEO

- Next.js metadata and structured data
- Loan-purpose guides
- SBA 7(a) education page
- Blog
- Dynamic sitemap and robots routes plus `next-sitemap` postbuild

---

## 12. Core Data Model

### Current primary tables

- `cash_flow_analyses`
- `purchases`
- `user_template_profiles`
- `template_submissions`
- `loan_requests`
- `document_requirements`
- `loan_request_documents`
- `loan_request_document_customizations`
- `guided_template_submissions`
- `template_definitions`
- `generated_reports`
- `lender_access_links`
- `lender_access_events`
- `broker_fee_agreements`
- `client_accounts`
- `admin_users`
- `admin_tasks`
- `admin_reviews`
- `loan_packaging_business_research_runs`
- `ai_assistant_usage_limits`

### Active parallel systems

The platform still contains two overlapping generations of data flows:

- Legacy analysis/templates: `cash_flow_analyses`, `template_submissions`, legacy `loan_packaging`
- New packaging platform: `loan_requests`, `guided_template_submissions`, `loan_request_documents`, and related tables

This coexistence is intentional for compatibility but increases maintenance, entitlement, reporting, and migration complexity.

### Storage buckets in active workflows

- `pdfs`
- `loan-package-documents`
- `generated-packages`

All financing documents should remain private by default and be exposed through time-limited signed URLs or the authenticated lender-link flow.

---

## 13. Authentication and Entitlements

### Access sources

Access can be granted by:

- Paid Stripe purchase
- Existing loan request/service record
- Signed broker agreement
- Admin-assigned `client_accounts` service level
- Explicit template grants
- Admin status
- Legacy packaging records

### Roles represented in code

- Anonymous
- Basic authenticated user
- Comprehensive-only
- Full service
- Admin
- Lender-link recipient, which is token/password based rather than an account role

### Current entitlement behavior

- Comprehensive analysis is available to authenticated users.
- Individual template purchase grants that template.
- Template bundle grants all five templates.
- Loan Packaging or Brokering grants all templates plus packaging access.
- A signed broker agreement grants brokering/full-service access.
- Admin-assigned account flags can grant comprehensive, template, and packaging access.

### Entitlement risk to address

`hasLoanPackaging` can currently be inferred from an existing `loan_requests` service record, not exclusively a confirmed purchase or explicit admin grant. This may be intentional for migrated/manual clients, but it should be formalized as a documented entitlement source and covered by tests to prevent accidental access escalation.

---

## 14. Security, Privacy, and Compliance Posture

### Implemented safeguards

- Supabase authentication
- RLS on major user-owned tables
- Server-side service-role operations with ownership filters
- Private document buckets
- Signed URLs
- Lender-link password hashing with scrypt
- Timing-safe password comparison
- Link expiration and revocation
- Lender access audit events
- Stripe webhook signature verification
- File type and size validation
- AI rate limits
- Context sanitization before model calls
- Analytics parameter allowlist and email redaction
- Development-only diagnostic route guards

### Known security/operations backlog

- Supabase advisor findings around function execution, mutable search paths, auth settings, RLS policy performance, missing policies on some legacy/internal tables, and unindexed foreign keys
- Remaining dependency advisories that require breaking Next.js/sharp upgrades
- Repository-wide lint debt
- No established automated test suite
- Sensitive financial uploads increase the need for retention/deletion rules, incident response, and access reviews
- Legacy and new schemas increase the chance of inconsistent policies

### Compliance principles for SBA-form products

Any official-form generator must:

- Pin outputs to a named form version and effective date
- Preserve a copy of the source form/version mapping
- Avoid implying SBA affiliation or endorsement
- Distinguish borrower-entered facts from calculated fields
- Require user review before finalization
- Preserve signed/dated output where required
- Support form-version migration without silently changing historical records
- Receive legal/compliance review before paid launch

SBA forms and program rules change. Official SBA sources, current lender instructions, and applicable SOPs must outrank static product assumptions.

---

## 15. Environment and Operational Dependencies

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Optional `SUPABASE_URL`

### Stripe

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Per-product `STRIPE_PRICE_ID_*`
- Per-product `NEXT_PUBLIC_STRIPE_PRODUCT_ID_*`

### PDF rendering

- `BROWSERLESS_API_KEY`
- `SITE_URL`, `NEXT_PUBLIC_SITE_URL`, or `NEXT_PUBLIC_APP_URL`
- Optional `PDF_URL_MODE`
- Optional `PDF_RENDER_SECRET`

### OpenAI

- `OPENAI_API_KEY`
- Optional `OPENAI_MODEL`
- Optional `OPENAI_ASSISTANT_MODEL`
- Optional `OPENAI_RESEARCH_MODEL`

### Email

- `RESEND_API_KEY`
- `EMAIL_FROM` — use `Business Lending Advocate <onboarding@resend.dev>` until the production domain is verified, then switch to a verified branded sender
- `EMAIL_INTERNAL_TO` — internal DSCR/contact lead notifications
- `EMAIL_REPLY_TO` — customer-facing reply address
- `RESEND_WEBHOOK_SECRET` — required for verified delivery, bounce, complaint, and failure events

DSCR email operations:

- Result endpoint: `POST /api/dscr-results/email`
- Unsubscribe endpoint: `POST /api/email/unsubscribe`
- Public confirmation page: `/email/unsubscribe?token=...`
- Resend webhook: `POST /api/webhooks/resend`
- Subscribe the Resend webhook to sent, delivered, failed, bounced, and complained events.
- Until the domain is verified, the fallback sender is `Business Lending Advocate <onboarding@resend.dev>`; Resend may restrict that sender to account-owned test recipients.
- After verification, set `EMAIL_FROM` to a branded address such as `Business Lending Advocate <results@businesslendingadvocate.com>`.

### Admin

- `ADMIN_BOOTSTRAP_EMAILS`

### Analytics and advertising

- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_GOOGLE_ADS_ID`
- `NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION_LABEL`
- `NEXT_PUBLIC_GOOGLE_ADS_CHECKOUT_CONVERSION_LABEL`
- `NEXT_PUBLIC_GTM_ID`

### Deployment

- `VERCEL_URL` is used as a fallback origin in several server flows.

Critical production checks should cover all of these integrations because successful compilation does not prove that remote credentials, webhooks, buckets, or callbacks are configured correctly.

---

## 16. Current Product Gaps and Inconsistencies

### P0: Customer-facing truth and lead operations

1. FAQ contains claims that should be reviewed for substantiation and legal risk.
2. `/get-funded` is a legacy embedded Google Form disconnected from the main portal and CRM experience.
3. The quick DSCR calculator now captures contactable leads only when the visitor explicitly requests an emailed result; calculator use remains available without surrendering contact information.
4. Immediate DSCR result emails, consent, unsubscribe handling, delivery events, attribution, rate limits, and internal notifications are implemented. Multi-step automated nurture sequences are not yet scheduled.
5. The comprehensive analysis creates an authenticated borrower record with DSCR, but it is not yet linked into the financing-lead nurture sequence.
6. Historical PRDs and investor snapshots remain intentionally stale but are labeled as historical and point to this canonical document.

### P0: Production confidence

1. No automated unit, integration, or end-to-end test suite.
2. Full-repository lint does not pass.
3. Remaining dependency advisories require planned major upgrades.
4. Supabase security advisor items remain open.
5. Authenticated production workflows need repeatable smoke tests.

### P1: Product consistency

1. Legacy and new template engines coexist.
2. Legacy and new packaging records coexist.
3. `types/supabase.ts` may not fully represent current migrations.
4. Entitlement sources are broad and not covered by a formal policy test matrix.
5. Admin CRM tracks lender status, but lender matching itself remains largely manual.
6. Analytics coverage is stronger for leads than for product activation, completion, package sharing, and brokering milestones.

### P1: SBA 413 hardening

1. Add automated regression fixtures that verify totals and field placement against the current official form.
2. Complete a legal/compliance review before making broader “official form” marketing claims.
3. Establish a form-version update procedure for future SBA revisions.
4. Replace expiring signed URLs stored in legacy template rows with durable storage paths plus freshly generated signed URLs.
5. Decide whether spouse/co-applicant scenarios require separate Form 413 submissions or additional workflow guidance for the selected SBA program.

---

## 17. Strategic Product Thesis

BLA should not try to win by becoming another generic loan marketplace. Large marketplaces compete on lead volume and lender inventory. BLA’s more defensible wedge is the **borrower data and readiness layer before lender submission**.

The strategic sequence should be:

1. Make the borrower’s information complete and internally consistent.
2. Convert that information into reusable lender and SBA artifacts.
3. Score readiness and expose missing evidence.
4. Route a clean package to appropriate lenders.
5. Track lender requests and closing conditions.
6. Reuse the borrower’s verified financial profile for future financing events.

This creates a compounding asset: a structured borrower profile and document graph, not merely a one-time PDF.

---

## 18. Recommended Product Roadmap

### Phase 0 — Stabilize the commercial foundation

**Priority: immediate**

1. Verify the Business Lending Advocate sending domain in Resend, configure the branded sender variables, and activate the signed delivery webhook.
2. Segment authenticated comprehensive-analysis leads by DSCR band, request amount, purpose, and completion status.
3. Add scheduled consent-aware follow-up sequences that route users toward education, Loan Packaging, or Loan Brokering based on DSCR and readiness.
4. Remove or integrate the legacy Google Form intake.
5. Add a production smoke-test checklist for checkout, webhook, PDF, OpenAI, uploads, package ZIP, lender link, agreement, and entitlement flows.
6. Add Playwright or equivalent end-to-end tests for the highest-revenue paths.
7. Resolve Supabase security advisor findings.
8. Plan Next.js/sharp dependency upgrades.
9. Establish product funnel analytics from landing page through completion and upgrade.

Why first: adding products before pricing, legal copy, access rules, and testing are consistent multiplies operational risk.

### Phase 1 — SBA Form 413 production workflow

**Status: implemented; hardening remains**

Completed scope:

1. Unified `/sba-413` with the existing authenticated Personal Financial Statement product instead of creating a third data model.
2. Pinned saved data and generated package metadata to the February 13, 2025 form version.
3. Retained Supabase autosave, multiple submissions, ownership controls, shared-profile reuse, and existing entitlements.
4. Retained the comprehensive guided assets, liabilities, income, contingent-obligation, declaration, and supporting-schedule workflow.
5. Required review attestation and typed e-signature in both the client and PDF API.
6. Retained official-page rendering, Browserless PDF generation, private storage, customer/admin visibility, and Loan Packaging integration.

Remaining hardening:

1. Add official-form field-placement regression fixtures.
2. Add durable PDF paths and refreshed signed URLs for standalone template history.
3. Complete compliance review and document spouse/co-applicant instructions.
4. Add explicit monitoring for PDF failures and SBA form-version changes.

### Phase 2 — Build an SBA Application Kit, not a random collection of forms

**Priority: high**

Recommended first kit:

1. SBA Form 413 Personal Financial Statement
2. SBA Form 1919 Borrower Information intake/output
3. Ownership and affiliate schedule
4. Business debt schedule
5. Personal debt schedule
6. Sources and uses of funds
7. Management experience/resume builder
8. Business history and loan-request narrative
9. Financial projection builder with assumptions
10. Document checklist for tax returns, interim financials, ownership, transaction, and collateral support

Why this ordering:

- Form 1919 is borrower-facing and central to 7(a) applications.
- Form 413 is reused across multiple SBA programs.
- Sources/uses, projections, debts, ownership, and management information create more borrower value than simply reproducing isolated PDFs.
- Much of the data already exists in BLA and can prefill the kit.

Forms to approach carefully:

- SBA Form 159 involves fee disclosure and lender/agent participation; it is relevant to BLA’s paid packaging/brokering activity but should be implemented as a compliance workflow, not marketed as a general borrower template.
- SBA Form 1244 and other 504 documents involve CDC/lender responsibilities and should follow a dedicated 504 workflow rather than being sold blindly as self-service forms.
- Working Capital Pilot and other addenda should appear only when eligibility/program selection activates them.

### Phase 3 — Launch an SBA Application Bundle

**Priority: high after Form 413/1919 quality is proven**

Proposed packaging:

- **Free:** SBA readiness checklist and eligibility orientation
- **Single official-form workflow:** test $19–$39
- **SBA Borrower Application Kit:** test $79–$149 per application
- **Loan Packaging:** retain $499, includes SBA kit when applicable
- **Loan Brokering:** retain success-fee path, includes all preparation tools

Pricing should be validated through checkout and willingness-to-pay experiments rather than assumed. The value is not the blank form; official PDFs are free. The value is guided completion, reuse, validation, schedules, package integration, and error prevention.

### Highest-value lender template expansion

Prioritize templates that are broadly requested, require calculations or structured schedules, and can reuse existing borrower data. A generic blank form is easy to copy; a guided workflow with validation and package integration is monetizable.

#### Tier 1 — Broad demand across business loans

1. **Sources and Uses of Funds Statement** — requested amount, borrower injection, seller financing, lender proceeds, fees, and itemized uses that must reconcile.
2. **Accounts Receivable Aging** — current, 1–30, 31–60, 61–90, and 90+ day receivables with concentration flags.
3. **Accounts Payable Aging** — vendor obligations by aging bucket, past-due exposure, and total trade debt.
4. **Financial Projections with Assumptions** — monthly year-one and annual years two/three income, cash flow, debt service, DSCR, and stated assumptions.
5. **Business Ownership and Guarantor Schedule** — legal entities, ownership percentages, affiliates, management roles, and guarantor status.
6. **Collateral Schedule** — asset description, owner, location, value source/date, liens, balance, and available equity.
7. **Business History and Management Resume** — operating history, relevant experience, licenses, key personnel, and succession/key-person considerations.

#### Tier 2 — High-value purpose-specific products

1. **Business Acquisition Sources-and-Uses Package** — purchase price allocation, buyer injection, seller note, working capital, fees, and transition assumptions.
2. **Debt Refinance and Payoff Schedule** — creditor, payoff amount, payment, rate, maturity, prepayment penalty, and expected post-refinance savings.
3. **Equipment Purchase Schedule** — vendor, quote, equipment description, useful life, installation, delivery, down payment, and collateral details.
4. **Commercial Real Estate Property Schedule** — property details, occupancy, rents, operating expenses, existing debt, appraised value, and environmental/appraisal status.
5. **Franchise Project Cost Schedule** — franchise fee, buildout, equipment, training, opening inventory, working capital, and franchisor requirements.
6. **Working Capital Build-Up Schedule** — payroll, inventory, receivables gap, vendor payments, seasonality, and operating reserve by month.

#### Tier 3 — Specialized or lender-driven

- Borrowing-base certificate for asset-based lines
- Rent roll for investment/owner-occupied mixed properties
- Global cash-flow schedule across affiliated businesses and guarantors
- Construction budget and draw schedule
- Covenant compliance certificate
- Personal cash-flow statement

#### Suggested future pricing architecture

- Individual standard template: continue testing around **$9.99–$19**
- Expanded Core Lender Document Bundle: test **$49–$79**
- SBA Borrower Application Kit: test **$79–$149**
- Purpose-specific acquisition/CRE/franchise module: test **$49–$99**
- Loan Packaging: retain **$499** and include all applicable templates
- Loan Brokering: include all preparation tools under the success-fee path

Do not promise “all templates forever” in the current $29.99 bundle. Define it as the current five-template bundle, then introduce clearly named expanded bundles as the library grows.

### Phase 4 — Add a dynamic Readiness and Missing-Evidence Engine

**Priority: high**

Create a clear readiness result across:

- Request clarity
- Historical cash flow
- Proposed debt service
- Financial recency
- Document completeness
- Owner/guarantor information
- Use-of-funds evidence
- Collateral evidence when applicable
- Management experience
- Purpose-specific transaction documents

Output should be:

- Ready
- Needs attention
- Blocked pending evidence

Do not present it as an approval score. Present it as application completeness and supportability.

### Phase 5 — Build the collaborative document room

**Priority: medium-high**

Capabilities:

- Invite accountant, bookkeeper, partner, attorney, or seller
- Assign specific requested documents
- Upload without exposing the full borrower dashboard
- Comment/request/revise workflow
- Document expiration and recency tracking
- Audit trail
- Automated reminders

This directly attacks two common borrower pain points: required-document volume and repetitive follow-up.

### Phase 6 — Automate document intake with human verification

**Priority: medium-high**

Potential features:

- Tax-return field extraction
- P&L and balance-sheet import
- Bank-statement transaction categorization
- Debt detection and payment extraction
- Automatic checklist matching
- Cross-document consistency checks
- “Needs borrower confirmation” review queue

Never let extraction silently become source-of-truth financial data. Every imported value should retain provenance and require review.

### Phase 7 — Build a lender-fit engine

**Priority: medium**

Start internally for BLA admins before exposing it to customers.

Match on:

- Loan amount
- Purpose
- Product type
- Industry/NAICS
- Geography
- Time in business
- Revenue
- DSCR
- Collateral
- Credit profile bands
- SBA/conventional preference
- Acquisition/startup/refinance appetite

Track actual outcomes to improve fit. The moat comes from observed lender behavior and funded outcomes, not generic lender lists.

### Phase 8 — Add lender outreach and condition tracking

**Priority: medium**

- Lender feeler templates
- Deal summary generated from verified package data
- Outreach log
- Interest/decline reasons
- Document requests
- Conditions checklist
- Term-sheet storage
- Closing timeline
- Borrower status notifications

This turns the admin CRM into a true deal execution system.

### Phase 9 — Build an offer comparison and cost-of-capital tool

**Priority: medium**

Help borrowers compare:

- Interest rate
- APR/effective cost
- Fees
- Amortization
- Balloon payment
- Prepayment penalty
- Collateral
- Personal guarantee
- Covenants
- Payment frequency
- Total dollars repaid

This is especially valuable because borrowers often focus on speed or payment amount while missing total cost and restrictive terms.

### Phase 10 — Introduce B2B and white-label distribution

**Priority: after consumer workflow is stable**

Potential customers:

- Independent loan brokers
- CPAs and bookkeeping firms
- Business brokers
- Franchise consultants
- SBDCs and nonprofit lenders
- Community banks and credit unions for pre-application intake

Potential model:

- Per-seat subscription
- Per-package fee
- Branded portal
- Admin CRM and client entitlements
- Template/SBA kit library
- Lender-fit and outreach modules

The current admin/customer-account architecture already provides an early foundation.

### Phase 11 — Create a financing lifecycle product

**Longer-term**

After funding:

- Covenant calendar
- Annual financial update reminders
- DSCR monitoring
- Document vault
- Refinance readiness
- Maturity alerts
- Additional capital planning
- Renewal package generation

This creates recurring value and recurring revenue instead of ending the relationship at closing.

---

## 19. What Not to Build Yet

Avoid diverting focus into:

- A broad public lender marketplace before BLA has structured lender-fit data
- Dozens of standalone official forms with no shared profile or package integration
- Automated “approval probability” claims without validated outcome data
- Direct credit-score pulls before the core conversion funnel proves demand
- Fully automated underwriting decisions
- Native mobile apps before the responsive web workflows are measured and stable
- Complex subscription tiers before repeat usage exists
- OCR that writes financial data without user confirmation

---

## 20. Recommended 30/60/90-Day Plan

### Next 30 days

1. Verify the Resend sender domain and monitor DSCR result delivery, bounce, complaint, consent, and conversion data.
2. Add complete funnel analytics:
   - Readiness tool started/completed
   - Quick result lead captured
   - Account created
   - Comprehensive analysis completed and DSCR band
   - Template viewed/checkout/completed/PDF generated
   - Packaging checkout/profile/checklist/cover letter/package completion
   - Brokering agreement signed/package ready/lender outreach/funded
3. Add end-to-end tests for checkout, SBA Form 413, packaging, brokering agreement, bulk upload, cover letter, and lender link.
4. Add SBA Form 413 field-placement fixtures and compliance review.
5. Define DSCR lead bands and the approved messaging/CTA for each band.
6. Interview at least 10 recent or prospective borrowers about application confusion, documents, lender selection, and willingness to pay.

### Days 31–60

1. Launch consent-aware DSCR follow-up emails and measure progression into Packaging and Brokering.
2. Replace legacy expiring template PDF URLs with durable storage paths and refreshed signed links.
3. Build the readiness/missing-evidence model behind a feature flag.
4. Resolve the highest-priority Supabase security and dependency findings.
5. Start an internal lender criteria database for BLA use.
6. Reassess template pricing and bundle structure using actual completion and upgrade data.

### Days 61–90

1. Measure SBA Form 413 completion, PDF errors, support requests, and package upgrades.
2. Decide whether to begin Form 1919 and the shared SBA Application Kit based on customer demand.
3. Add collaborator document requests and reminders.
4. Add internal lender-feeler and outcome tracking.
5. Pilot the offer-comparison workflow with brokered clients.
6. Decide whether B2B broker/CPA pilots should begin based on admin workflow stability.

---

## 21. Metrics and Operating Dashboard

### Acquisition

- Organic sessions by loan purpose
- Paid sessions and cost per qualified lead
- DSCR calculator starts/completions
- Visitor-to-account conversion
- Lead-form conversion

### Activation

- Comprehensive analysis started/completed
- Time to first useful output
- Template started/completed
- Packaging profile completed
- First document uploaded

### Monetization

- Individual template conversion
- Bundle conversion
- Template-to-Packaging upgrade
- Packaging checkout conversion
- Brokering agreement conversion
- Revenue per activated account
- Funded volume and realized broker fees

### Product completion

- Checklist completion rate
- Median time to package-ready
- Cover-letter approval rate
- Package ZIP generation rate
- Lender-link creation and access rate
- Drop-off by workflow step
- Support questions per completed package

### Brokering operations

- Package-ready to first outreach time
- Lenders contacted per deal
- Interest rate
- Decline reasons
- Term sheets received
- Approval and funding rate
- Days to funding
- Funded amount vs requested amount
- Effective broker revenue per lead

### Quality and trust

- Document correction rate
- AI fallback/error rate
- PDF failure rate
- Upload failure rate
- Entitlement support incidents
- Security incidents
- Refund/chargeback rate
- Customer satisfaction after package completion

---

## 22. Key Strategic Decisions Still Needed

1. Should the free comprehensive analysis remain unlimited, or should usage limits apply only after the first completed report?
2. Is Loan Packaging primarily self-service software, a done-with-you service, or both with explicit service levels?
3. Does the 1% broker fee apply only to BLA-introduced lenders, and is all public/legal wording consistent?
4. Should SBA Application Kit users receive one application, unlimited access, or time-limited access?
5. Should the five-template bundle remain $29.99 after SBA forms are introduced?
6. Which borrower segment is the initial go-to-market focus: general SMB, acquisition, franchise, CRE, or SBA 7(a)?
7. Which lender criteria and outcomes can BLA legally and operationally track?
8. What is the retention policy for tax returns, personal financial statements, and lender package files?
9. When should BLA introduce recurring subscriptions: borrower lifecycle, B2B portals, or both?
10. Which claims about speed, approval, savings, or lender fit can be substantiated with measured data?

---

## 23. Recommended Strategic Focus

The highest-leverage next move is not to add many disconnected tools. It is to turn the current platform into a **single reusable borrower application profile** that powers:

- Cash-flow analysis
- Existing five templates
- SBA Form 413
- SBA Form 1919
- Sources and uses
- Loan Packaging
- Lender summaries
- Lender matching
- Future renewals and refinancing

Every new product should reuse that profile, contribute structured data back to it, and produce a verifiable lender artifact. This reduces customer work, improves data consistency, strengthens the brokering operation, and creates a more defensible platform than a collection of downloadable templates.

The recommended immediate sequence is:

1. Add DSCR lead capture, segmentation, consent, and follow-up automation.
2. Add tests, security hardening, and SBA Form 413 regression fixtures.
3. Measure Form 413 demand and decide when to build Form 1919 and the shared SBA Application Kit.
4. Add readiness/missing-evidence intelligence.
5. Add collaboration and document automation.
6. Build lender-fit data and outreach operations.
7. Expand into B2B/white-label and post-funding lifecycle products.

That sequence aligns customer value, revenue, operational leverage, and long-term defensibility.

---

## 24. Official and Market References Used for Strategy

- SBA Lender Match readiness guidance: https://www.sba.gov/loans/lender-match/
- SBA Form 413: https://www.sba.gov/document/sba-form-413-personal-financial-statement
- SBA Form 1919: https://www.sba.gov/document/sba-form-1919-borrower-information-form
- SBA Form 159: https://www.sba.gov/document/sba-form-159-fee-disclosure-compensation-agreement
- Federal Reserve Small Business Credit Survey: https://www.fedsmallbusiness.org/reports/survey
- 2026 Report on Employer Firms: https://www.fedsmallbusiness.org/reports/survey/2026/2026-report-on-employer-firms

External references inform strategy; current SBA forms, program rules, lender instructions, and legal advice must be re-verified before implementation or launch.
