# Business Lending Advocate Platform: As-Is Investor Breakdown

## Scope and Method
This document describes the **current implemented system** in this repository as of February 11, 2026. It is based on:
- Next.js application code in `app/`
- API route implementations in `app/api/`
- Financial and template engines in `lib/`
- Supabase migration state in `supabase/migrations/20260211142000_loan_packaging_platform.sql`
- Frontend product positioning copy in public pages

It intentionally excludes future-state assumptions.

## Executive Summary
Business Lending Advocate is a web platform for small-business financing readiness. The current implementation operates as a hybrid of:
- A free and premium-style DSCR/cash-flow analysis flow
- A comprehensive multi-step underwriting prep workflow
- A lender-facing report/PDF generation pipeline
- A newer, structured loan packaging dashboard with document checklist, template-driven data capture, AI-assisted cover letter generation, ZIP package assembly, and password-protected lender portal links
- A templates hub for standalone lender-format documents
- Marketing and lead capture pages, including contact form and embedded Google Form intake

The product is implemented as a single Next.js app backed by Supabase Auth, Postgres, and Supabase Storage, with Stripe, Browserless, OpenAI, and Resend integrations.

## Target Audience (As Implemented)
Based on live copy and feature set, current target segments are:
- Small business owners seeking debt financing
- Borrowers preparing for SBA 7(a) or conventional loan underwriting
- Borrowers needing lender-ready documentation and narrative packaging
- Borrowers who want quick DSCR self-assessment before full application prep
- Internal advisors/brokers (indirectly) who can use generated outputs
- Lenders receiving shared package links with password access

## Business Goals and Product Intent (As Implemented)
Observed product goals from code and UX:
- Reduce borrower confusion around lender requirements
- Provide guided, structured financial intake and debt normalization
- Generate lender-friendly artifacts (reports, debt summaries, templates, cover letters)
- Improve funding readiness and shorten lender review friction
- Capture qualified leads for manual follow-up and brokering
- Support two monetization paths:
  - Direct checkout for analysis/packaging products
  - Service-led loan brokering narrative with success-fee messaging

## Primary User Journeys
1. Visitor lands on marketing pages (`/`, `/loan-services`, `/cash-flow-analysis`, `/sba-7a-loans`).
2. User runs quick DSCR check (free calculator) or logs in for comprehensive flow.
3. User completes comprehensive intake and debt schedule, data autosaves to Supabase.
4. User reaches report preview and can trigger PDF generation.
5. User enters loan packaging dashboard (`/loan-packaging`) for structured doc prep:
- Save loan profile
- Upload required docs or complete template-driven docs
- Generate/approve cover letter
- Build package ZIP
- Create lender links (password + expiration)
6. Lender accesses shared link (`/lender/[token]`) and authenticates with password.

## Tech Stack and Runtime Architecture
### Frontend
- Next.js 15 App Router
- React 18
- Tailwind + component primitives (Radix/UI utilities)
- Client-heavy flows for forms and dashboards

### Backend/API
- Next.js route handlers under `app/api/*`
- Server-side Node runtime for critical routes (`runtime = 'nodejs'` in multiple handlers)

### Data + Auth
- Supabase Auth for user identity/session
- Supabase Postgres for application state
- Supabase Storage for uploaded docs, generated PDFs, generated package ZIPs

### Third-party Services
- Stripe Checkout + webhook for purchase recording
- Browserless for HTML-to-PDF rendering
- OpenAI Responses API for cover letter generation fallbacking to deterministic template text
- Resend for contact form email delivery

## Pricing and Monetization (As-Is)
### Marketed Pricing Copy
From `app/loan-services/page.tsx`:
- Loan Packaging: `$499`
- Loan Brokering: `1% of loan amount (due at closing)`
- SBA 7(a) Loan Matching: `No cost`

### Programmatic Checkout Pricing (Stripe IDs hardcoded)
From `app/api/create-checkout-session/route.ts`:
- `loan_packaging`: Stripe price `price_1QWsfeBT7qyj5Bco1lgWTNpN`, product `prod_RPi5e24PCy1D1p`
- `cash_flow_analysis`: Stripe price `price_1RPyhHBT7qyj5BcoebrwMMhr`, product `prod_RPjWBW6yTN629z`

### Current Product-State Inconsistency
- UI copy in cash-flow pages marks comprehensive analysis as free/limited-time free.
- Checkout route still supports paid `cash_flow_analysis` session creation.
- This indicates a mixed transitional state: pricing logic and marketing copy are not fully harmonized.

## Service Catalog (Functional Services)
### 1) Quick DSCR Calculator Service (Frontend-only computation)
- Location: `app/(components)/cash-flow/DscrQuickCalculator.tsx`
- Inputs (user-entered):
  - Monthly net income
  - Existing monthly debt buckets (real estate, credit cards, vehicle/equipment, LOC, other)
  - Proposed loan amount, interest, term (for payment calc)
- Key calculations:
  - Amortized or interest-only monthly payment estimator
  - DSCR visualization/gauge with threshold bands
- Output:
  - Immediate in-browser score and risk banding
  - CTA into comprehensive flow

### 2) Comprehensive Cash Flow Analysis Service
- Primary page: `/comprehensive-cash-flow-analysis`
- Data domain: loan info, 2023/2024/YTD financials, business debt schedule
- Persistence table: `cash_flow_analyses` (legacy data model)
- Autosave and submit flow components include:
  - `FinancialsUtils` numeric transformation
  - `ReviewSubmitStep` debt and DSCR assembly
  - `ReportPreviewPageContent` for retrieval and rendering
- Typical captured inputs:
  - Borrower/business identifiers
  - Loan request data (amount, term, rate, down payment/proposed loan)
  - Financial statement line items by year
  - Debt entries by category

### 3) PDF Report Generation Service
- Route: `POST /api/generate-pdf`
- Two modes:
  - Legacy analysis PDFs (`analysisId` + `type=full|summary`)
  - Template submission PDFs (`submissionId` + `templateType`)
- Rendering engine:
  - Browserless endpoint: `https://production-sfo.browserless.io/pdf?token=...`
  - Source pages are internal print routes:
    - `/report/print/[analysisId]/[type]`
    - `/report/template/[submissionId]/[templateType]`
- Storage behavior:
  - Uploads to Supabase storage bucket `pdfs`
  - Returns binary PDF response and exposes `X-PDF-URL` header when available
- Database side effects:
  - For analysis PDFs, updates `cash_flow_analyses.cash_flow_pdf_url` or `debt_summary_pdf_url`
  - For template flow, writes to `template_submissions.pdf_url`

### 4) Loan Packaging Dashboard Service (New Structured System)
- UI entry: `/loan-packaging`
- APIs:
  - `GET/POST/PATCH /api/loan-packaging/dashboard`
  - `POST /api/loan-packaging/documents/upload`
  - `GET/POST /api/loan-packaging/templates`
  - `GET/POST/PATCH /api/loan-packaging/cover-letter`
  - `POST /api/loan-packaging/package`
  - `GET/POST/PATCH /api/loan-packaging/lender-link`
- Core behaviors:
  - Creates/updates a `loan_request`
  - Seeds/loads document requirements
  - Tracks requirement-level completion status
  - Supports file upload with MIME and size enforcement
  - Supports guided template forms + derived metrics
  - AI/fallback cover letter generation and manual approval
  - ZIP package assembly and signed download URL
  - Password-protected share links for lender portal

### 5) Lender Access Service
- Route: `POST /api/lender/access`
- Inputs:
  - `token` (share token)
  - `password`
- Behavior:
  - Validates link existence, revocation state, expiry
  - Verifies password against stored scrypt hash
  - Logs success/failure event with IP + UA
  - Returns signed URLs for completed docs and package ZIP
  - Increments link access counters

### 6) Contact/Lead Service
- Route: `POST /api/send-contact-email`
- Inputs required:
  - `businessName`, `firstName`, `lastName`, `concerns[]`, `message`
- Validations:
  - Required fields, concern count <= 10, length limits
- Output:
  - Sends structured HTML email via Resend to configured recipient

### 7) Profile Session Service
- `GET /api/profile`: returns authenticated Supabase user
- `PUT /api/profile`: returns 501 (profile updates unsupported)

### 8) Stripe Purchase Recording Service
- `POST /api/create-checkout-session`: creates Stripe checkout for selected product
- `POST /api/stripe-webhook`: verifies signature and upserts purchase record
- Purchase persistence target: `purchases` table

### 9) Templates Hub Service
- Hub page: `/templates`
- Data APIs in `lib/templates/*` operate on `template_submissions`
- Access control module currently in dev mode: authenticated users are allowed all templates
- Includes five template types:
  - `balance_sheet`
  - `income_statement`
  - `personal_financial_statement`
  - `personal_debt_summary`
  - `business_debt_summary`

## Database and Storage Model
## New Loan Packaging Schema (from migration)
Main tables:
- `loan_requests`
- `document_requirements`
- `loan_request_documents`
- `template_definitions`
- `guided_template_submissions`
- `generated_reports`
- `lender_access_links`
- `lender_access_events`

Security:
- RLS enabled on all above tables
- Ownership-based policies for user data
- Authenticated read access for shared requirement/template definitions

Storage buckets:
- `loan-package-documents` (private, 25MB default cap, defined MIME list)
- `generated-packages` (private, 100MB cap, ZIP/PDF/text)

### Legacy/Parallel Schema in Active Use
Active code also reads/writes:
- `cash_flow_analyses`
- `template_submissions`
- `purchases`
- Possibly legacy `loan_packaging`, `templates`, `submissions` structures via typed definitions

Implication:
- Platform currently runs with both a legacy analysis/templates data model and a newer packaging model.

## Authentication and Access Control
### Auth Pattern
- Most protected API routes require `Authorization: Bearer <accessToken>`
- `requireApiUser` validates token against Supabase Auth

### Admin Client Usage
- Server routes use service-role Supabase client for privileged operations
- Route-level ownership filters are applied in queries (`eq('user_id', auth.user.id)`)

### Lender Link Security
- Tokens generated with `randomBytes(24)` hex
- Passwords hashed with `scrypt` + random salt
- Verification via timing-safe compare
- Expiry enforced (1 to 90 days)
- Revocation supported
- Access audit events persisted

## Required Inputs by Major API Service
### `POST /api/create-checkout-session`
Required:
- Bearer auth
- Body: `productType` (`loan_packaging` or `cash_flow_analysis`)
Optional:
- `loanPurpose`, `promoCode`

### `POST /api/stripe-webhook`
Required:
- `stripe-signature` header
- Stripe event body with checkout session metadata:
  - `user_id`, `product_type`, `product_id`

### `POST /api/generate-pdf`
Mode A (analysis):
- `analysisId`
- `type` (`full` | `summary`)
- `accessToken`

Mode B (template):
- `submissionId`
- `templateType` (whitelisted)
- `accessToken`

### `GET/POST/PATCH /api/loan-packaging/dashboard`
GET optional query:
- `loanRequestId`
POST upsert payload:
- `loanRequestId?`, `serviceType`, `status?`, plus optional loan profile fields
PATCH payload:
- `loanRequestId` + partial updates

### `POST /api/loan-packaging/documents/upload`
Multipart required:
- `loanRequestId`
- `requirementKey`
- `file`

### `GET/POST /api/loan-packaging/templates`
GET query:
- `loanRequestId`
POST body:
- `loanRequestId`, `templateKey`, `formData`, `markCompleted?`

### `GET/POST/PATCH /api/loan-packaging/cover-letter`
GET query:
- `loanRequestId`
POST body:
- `loanRequestId` plus optional business/funds/repayment/strength fields
PATCH body:
- `loanRequestId`, `content` (50-20000 chars)

### `POST /api/loan-packaging/package`
Required:
- `loanRequestId`

### `GET/POST/PATCH /api/loan-packaging/lender-link`
GET query:
- `loanRequestId`
POST body:
- `loanRequestId`, `password`, `title?`, `expiresInDays? (1-90)`
PATCH body:
- `linkId`, `revoke`

### `POST /api/lender/access`
Required:
- `token`
- `password`

### `POST /api/send-contact-email`
Required:
- `businessName`, `firstName`, `lastName`, `concerns[]`, `message`

## Financial and Risk Calculations
### Financial statement normalization (`FinancialsUtils`)
For each year:
- `grossProfit = revenue - cogs`
- `ebitda = grossProfit - operatingExpenses - depreciation - amortization + nonRecurringIncome - nonRecurringExpenses`
- `adjustedEbitda = ebitda - nonRecurringIncome + nonRecurringExpenses`
- `netIncome = ebitda - interest - taxes`

### Debt summary (`lib/financial/calculations.ts`)
- Sums monthly payment, original loan amount, outstanding balance by category
- `monthlyDebtService = sum(category monthly payments)`
- `annualDebtService = monthlyDebtService * 12`
- Credit utilization:
  - `totalCreditBalance` from credit card + LOC balances
  - `totalCreditLimit` from credit card + LOC original loan amounts
  - `creditUtilizationRate = totalCreditBalance / totalCreditLimit` when denominator > 0

### DSCR logic
Used across flows with slight contextual differences:
- Generic DSCR form:
  - `DSCR = EBITDA / (Annual Existing Debt Service + Annualized Proposed Loan Payment)`
- YTD handling:
  - Existing debt annualization prorated by selected YTD month count
  - Proposed loan payment prorated by month count for YTD
- Quick calculator adds loan payment estimation from amortization formula.

### Template derived metrics (`lib/loan-packaging/template-engine.ts`)
- Personal Financial Statement:
  - `total_assets`, `total_liabilities`, `net_worth`
- Personal Debt Summary:
  - `monthly_debt_service`, `monthly_income`, `debt_to_income_ratio`
- Business Debt Summary:
  - `total_outstanding_debt`, `total_monthly_payment`, `weighted_interest_rate`

## How Report PDF Generation Works (Comprehensive Flow)
1. Client requests `POST /api/generate-pdf` with analysis ID + type + token.
2. Route validates authenticated user and ownership via Supabase.
3. Route builds print URL to internal render path:
- `/report/print/[analysisId]/full`
- `/report/print/[analysisId]/summary`
4. Route calls Browserless PDF API with A4, print background, custom margins.
5. PDF bytes return to server.
6. Server attempts upload to Supabase `pdfs` bucket (`uploadPdfToSupabase`).
7. Signed URL (default) or public URL (if `PDF_URL_MODE=public`) is produced.
8. Route updates `cash_flow_analyses` with PDF URL fields.
9. Route streams file back as downloadable attachment and exposes URL in `X-PDF-URL`.

## How Loan Package ZIP Generation Works
1. User calls `POST /api/loan-packaging/package` with `loanRequestId`.
2. Service loads all completed requirement documents.
3. For each completed doc:
- Determines bucket from metadata (default `loan-package-documents`)
- Downloads bytes from storage
- Builds canonical filename with requirement sort order and slugged display name
4. Adds cover letter `.txt` when present.
5. Adds `summary/loan-package-summary.json` with metadata and completion log.
6. Creates ZIP via custom in-memory zip writer (`lib/loan-packaging/zip.ts`).
7. Uploads ZIP to `generated-packages` bucket.
8. Creates 24-hour signed URL.
9. Writes package path/timestamp to `loan_requests` and audit row to `generated_reports`.

## PDF/Document Infrastructure and Data Usage
### Uses Database
Yes. System persists:
- Analysis records and report URLs (`cash_flow_analyses`)
- Template submissions (`template_submissions`, `guided_template_submissions`)
- Loan package state and artifacts (`loan_requests`, `loan_request_documents`, `generated_reports`)
- Lender link access and audit telemetry (`lender_access_links`, `lender_access_events`)
- Purchase/payment status (`purchases`)

### Uses Object Storage
Yes. Supabase buckets used for:
- Individual uploaded docs
- Generated PDFs
- Generated ZIP packages

### Uses External Compute Services
Yes.
- Browserless for rendering HTML to PDF
- OpenAI for cover letter draft generation

## Product Surface Inventory (Website Areas)
Public/marketing:
- Home page
- Loan services page
- Cash flow analysis page
- SBA 7(a) education page
- FAQ, blog, terms, privacy

Product workspaces:
- Comprehensive cash flow analysis workflow
- Report preview and print routes
- Templates hub and template-specific forms
- Loan packaging dashboard
- Lender portal token route

Lead capture:
- Contact modal/email API
- Embedded Google Form intake page (`/get-funded`)

## Known As-Is Operational Risks and Gaps
1. Pricing/product-state mismatch
- Comprehensive analysis is marketed free while paid checkout flow still exists.

2. Parallel data models
- Legacy (`cash_flow_analyses`, `template_submissions`) and new packaging schema coexist.
- Increases migration, reporting, and maintenance complexity.

3. Type/schema drift
- `types/supabase.ts` appears not fully aligned to latest packaging migration tables.

4. Mixed template ecosystems
- New loan-packaging guided template engine (`guided_template_submissions`) and legacy template submission system (`template_submissions`) both active.

5. Hardcoded Stripe identifiers
- Price/product IDs are embedded in route code.

6. Environment dependency density
- Critical flows depend on multiple env vars (`SUPABASE_*`, `BROWSERLESS_API_KEY`, `STRIPE_*`, `OPENAI_API_KEY`, `RESEND_API_KEY`, site URLs).

7. Dev-only diagnostic routes
- Browserless and print-url test endpoints exist (properly dev-gated, but should stay controlled).

## Environment Variables Required for Full Operation
- Supabase:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - optionally `SUPABASE_URL`
- Stripe:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- PDF:
  - `BROWSERLESS_API_KEY`
  - `SITE_URL` or `NEXT_PUBLIC_APP_URL`
  - optional `PDF_URL_MODE`
- OpenAI:
  - `OPENAI_API_KEY`
  - optional `OPENAI_MODEL`
- Email:
  - `RESEND_API_KEY`

## Investor-Oriented Positioning Snapshot (As-Is)
- Category: SMB financing-readiness SaaS + advisory workflow layer
- Core moat candidate: operationalizing lender-ready packaging and borrower education in one system
- Revenue posture: mixed (direct checkout + services-led broker model)
- Product maturity signal: meaningful end-to-end flows exist, but architecture reflects active transition from legacy to new packaging platform
- Expansion potential already scaffolded in code:
  - lender portal sharing
  - guided template engines
  - AI-generated narratives
  - report artifact automation

## Conclusion
The platform is already beyond brochureware: it includes authenticated workflows, persisted underwriting data, artifact generation, payment plumbing, and lender distribution mechanics. The current as-is system is functionally rich but architecturally transitional, with simultaneous legacy and new data pathways. From an investor perspective, this indicates both execution capability and a near-term consolidation opportunity that can materially improve reliability, analytics consistency, and go-to-market clarity.
