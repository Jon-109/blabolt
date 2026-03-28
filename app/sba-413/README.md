# SBA Form 413 Personal Financial Statement Generator

A comprehensive, mobile-first, ultra-simple form builder for creating SBA Form 413 Personal Financial Statements with intelligent section visibility and lender-proof output.

## 🎯 Project Status

### ✅ Completed (Foundation - Phase 1)

1. **Type System** (`types.ts`)
   - Complete TypeScript interfaces for all data models
   - Smart Gate flags, Identity, Assets, Liabilities, Income, Contingent, Declarations, Signatures
   - Validation state management

2. **Smart Gate Component** (`components/SmartGate.tsx`)
   - 60-second questionnaire (13 questions)
   - Adaptive Yes/No flow with progress tracking
   - Dynamic section visibility based on answers
   - "Skip to all sections" option for advanced users
   - Mobile-optimized with large tap targets
   - Visual progress indicator

3. **Main Form Shell** (`page.tsx`)
   - Multi-step wizard with visual progress
   - Step navigation (Next/Back)
   - Form data state management
   - Responsive layout with gradient backgrounds
   - Progress indicator with step completion tracking

4. **Identity Page** (`components/IdentityPage.tsx`)
   - As of Date (with 90-120 day guidance)
   - Filing type (Individual vs Joint)
   - Applicant information (name, email, phone, address)
   - Spouse information (if joint filing)
   - Business information (optional)
   - Community property state detection and helper
   - Basic validation before proceeding

5. **Calculation Engine** (`utils/calculations.ts`)
   - Total assets calculation
   - Total liabilities calculation
   - Net worth calculation (Assets - Liabilities)
   - Liquid assets calculation
   - Monthly debt service calculation
   - Balance sheet validation (Assets = Liabilities + Net Worth)
   - Currency and percentage formatting
   - Unique ID generation for form items

## 📋 What's Next (Remaining Work)

### Phase 2: Asset Forms (Priority: HIGH)
- [ ] **Cash & Savings Cards**
  - Multiple account support
  - Institution, type, balance
  - Quick "single total" entry option
  
- [ ] **Securities/Investments** (if `has_securities = true`)
  - Section 3 SBA Form 413
  - Holdings with ticker, shares, market value
  - Valuation date requirement
  - Bulk add/import option

- [ ] **Retirement Accounts** (if `has_retirement = true`)
  - 401(k), IRA, SEP, Roth IRA
  - Institution, plan type, balance
  - Valuation date requirement

- [ ] **Life Insurance CSV** (if `has_life_csv = true`)
  - Section 8 SBA Form 413
  - Policy details, cash surrender value
  - Loan against policy tracking (links to liabilities)

- [ ] **Real Estate** (if `has_real_estate = true`)
  - Section 4 SBA Form 413
  - Property cards with address autocomplete
  - AVM hints (Zillow/Redfin estimates)
  - Original cost, market value, valuation source
  - Status tracking (current/late/forbearance)
  - Links to mortgages

- [ ] **Autos & Personal Property** (if `has_vehicles = true`)
  - Section 5 SBA Form 413
  - Vehicle details (year, make, model, value)
  - Other property (boats, RVs, equipment, jewelry)
  - Lien tracking (auto-creates installment debt)

- [ ] **Crypto & Other Assets** (if `has_crypto = true`)
  - Exchange, asset type, quantity, value
  - Date-stamped valuation requirement
  - HSA, trust interests

### Phase 3: Liability Forms (Priority: HIGH)
- [ ] **Credit Cards** (if `has_personal_debt = true`)
  - Section 2 SBA Form 413
  - Issuer, balance, minimum payment

- [ ] **Notes/Loans/Lines** (if `has_personal_debt = true`)
  - Section 2 SBA Form 413
  - Lender details, payment terms
  - Secured vs unsecured
  - Collateral description
  - Cross-link to pledged assets

- [ ] **Installment Accounts** (if `has_personal_debt = true`)
  - Auto-created from financed vehicles
  - Other installments (furniture, electronics)

- [ ] **Mortgages** (if `has_real_estate = true`)
  - Section 4 SBA Form 413
  - Link to specific properties (required)
  - HELOC tracking and limits
  - Payment amount, escrow status
  - Status (current/late/forbearance)

- [ ] **Life Insurance Loans** (if `has_life_csv = true`)
  - Auto-populated from life insurance section
  - Balance and terms

- [ ] **Unpaid Taxes** (if `owes_taxes = true`)
  - Section 6 SBA Form 413
  - Type (Federal/State/Property)
  - Tax years, to whom payable
  - Payment plan terms (required)
  - Lien status and property reference

- [ ] **Other Liabilities**
  - Section 7 SBA Form 413
  - 401(k) loans, BNPL, settlements, obligations

### Phase 4: Income & Contingent (Priority: MEDIUM)
- [ ] **Annual Income**
  - Section 1 SBA Form 413
  - Salary/W-2
  - Net investment income
  - Real estate income
  - Other income (with description)
  - Alimony/child support opt-in

- [ ] **Contingent Liabilities**
  - Endorser/co-maker/guarantor amounts
  - Legal claims & judgments
  - Federal income tax provision
  - Other special debt

- [ ] **Personal Guarantees** (if `has_personal_guarantees = true`)
  - Business name, lender, amounts
  - Purpose/type (term/equipment/LOC/lease/MCA)
  - Guarantee type (limited/unlimited)
  - Collateral description
  - Mark as contingent (don't double-count)

### Phase 5: Declarations & Signatures (Priority: MEDIUM)
- [ ] **Declarations**
  - Lawsuits/judgments/bankruptcy (Y/N + explanation)
  - Unlisted leases/contracts
  - Partner/officer elsewhere
  - Jointly held or trust assets

- [ ] **Signature Capture**
  - Canvas-based signature drawing
  - Applicant signature, date, printed name
  - SSN input (masked in UI, full in PDF only)
  - Spouse signature (if joint filing)
  - Certification & authorization text

### Phase 6: Review & Validation (Priority: HIGH)
- [ ] **Review Screen**
  - Summary cards for all sections
  - Edit navigation (jump to any field)
  - Real-time totals display
    - Total Assets
    - Total Liabilities
    - Net Worth
    - Liquid Assets
    - Monthly Debt Service
  - Green "Ready to generate" gate when valid
  - Validation error list with jump-to-fix links

- [ ] **Validation Rules**
  - Assets = Liabilities + Net Worth check
  - Required valuation dates (securities, crypto, retirement)
  - Payment amount + frequency for all debts
  - Mortgages linked to properties
  - Life insurance loans matched to policies
  - Unpaid taxes have year(s) + plan terms
  - Declarations with "Yes" have explanations

### Phase 7: PDF Generation (Priority: MEDIUM)
- [ ] **SBA Form 413 PDF**
  - Exact field mapping to official SBA form
  - Sections 1-8 with correct labels
  - Computed totals
  - Federal notices pages
  - OMB box preservation
  - Zero-filled non-visible lines
  - Signature placement

- [ ] **Optional Cover Page**
  - 1-page banker summary
  - Snapshot metrics (assets, liabilities, net worth)
  - Liquidity ratio
  - Real estate LTV table
  - Personal guarantee summary
  - "See attached SBA Form 413" note

### Phase 8: UX Enhancements (Priority: LOW)
- [ ] **Auto-save & Resume**
  - Persist draft to localStorage
  - Warn if "as of" date ages past 90-120 days
  - Session recovery

- [ ] **Statement Assist (Optional)**
  - Upload bank/brokerage/mortgage statements
  - OCR to pre-fill balances
  - PDF parsing

- [ ] **Spouse Invite**
  - Email link to shared form
  - Lock completed fields
  - Require spouse signature

- [ ] **Address Autocomplete**
  - Google Places API integration
  - Quick AVM hints for real estate

- [ ] **Bulk Add Features**
  - Paste ticker/quantity for securities
  - CSV import for multiple accounts

### Phase 9: Accessibility & i18n (Priority: MEDIUM)
- [ ] **Accessibility**
  - Full keyboard navigation
  - Screen reader compatibility
  - WCAG contrast compliance
  - Clear focus states
  - Descriptive error messages

- [ ] **Internationalization**
  - EN/ES UI toggle
  - PDF remains English (SBA standard)
  - Bilingual helper text

### Phase 10: Testing & QA (Priority: HIGH before launch)
- [ ] **Automated Tests**
  - Minimal case (W-2 renter, no investments) → valid PDF
  - Typical case (home + car + cards + W-2)
  - Complex case (multiple rentals, HELOC, securities, retirement, CSV, unpaid taxes, PGs)
  - Edge case (negative net worth, late mortgages, bankruptcy disclosed)

- [ ] **Telemetry**
  - Completion rate tracking
  - Drop-off step analysis
  - Average time per page
  - % Basic vs Full mode usage
  - % with spouse, RE, etc.

## 🏗️ Architecture

### File Structure
```
app/sba-413/
├── page.tsx                    # Main form controller
├── types.ts                    # TypeScript interfaces
├── README.md                   # This file
├── components/
│   ├── SmartGate.tsx          # ✅ 60-sec questionnaire
│   ├── IdentityPage.tsx       # ✅ Identity & basics
│   ├── AssetsPage.tsx         # TODO: Assets wizard
│   ├── LiabilitiesPage.tsx    # TODO: Liabilities wizard
│   ├── IncomePage.tsx         # TODO: Income & contingent
│   ├── DeclarationsPage.tsx   # TODO: Declarations & signatures
│   ├── ReviewPage.tsx         # TODO: Review & validation
│   └── shared/                # Reusable components
│       ├── AssetCard.tsx      # TODO: Asset entry cards
│       ├── LiabilityCard.tsx  # TODO: Liability entry cards
│       └── SignatureCanvas.tsx # TODO: Signature capture
└── utils/
    ├── calculations.ts        # ✅ Financial calculations
    ├── validation.ts          # TODO: Form validation rules
    └── pdf-generator.ts       # TODO: PDF creation logic
```

### Data Flow
1. **Smart Gate** → Collect visibility flags
2. **Identity** → Basic applicant info
3. **Assets** → What you own (dynamic sections based on flags)
4. **Liabilities** → What you owe (cross-linked to assets)
5. **Income & Contingent** → Earnings & guarantees
6. **Declarations** → Legal disclosures
7. **Review** → Validate & fix
8. **Generate** → Create SBA Form 413 PDF

### State Management
- Single `SBA413FormData` object in main form
- Props drilling for child components
- No complex state management needed (no auth, no DB for now)
- LocalStorage for draft persistence (Phase 8)

## 🎨 Design Principles

1. **Mobile-First**: Large tap targets, thumb-friendly navigation
2. **Plain English**: No jargon, real-world examples everywhere
3. **Progressive Disclosure**: Show only what's relevant based on Smart Gate
4. **Forgiving Validation**: Estimates are okay, guide users gently
5. **Visual Feedback**: Progress bars, save status, live totals
6. **Accessibility**: Keyboard nav, screen readers, high contrast

## 🔐 Security & Privacy (Future)

- Encrypt PII at rest (when DB integration added)
- Mask SSNs everywhere except final PDF
- Never log sensitive data
- "Delete my data" action
- Session timeout warnings

## 🚀 How to Test Current Progress

1. Navigate to `/app/sba-413`
2. Complete the Smart Gate (13 questions)
3. Fill in Identity & Basics
4. See placeholder pages for remaining steps

## 📝 Notes

- **No authentication** yet (as requested)
- **No database** yet (as requested)
- **No PDF generation** yet (deferred to Phase 7)
- Form state is in-memory only
- Can be tested immediately without backend setup

## 🎯 Success Metrics (When Complete)

- [ ] Smart Gate takes ≤60 seconds
- [ ] Basic mode completion ≤10-15 minutes
- [ ] Full mode completion ≤20-25 minutes
- [ ] Generated PDF is lender-ready SBA Form 413
- [ ] Assets = Liabilities + Net Worth validates
- [ ] All sections keyboard navigable
- [ ] WCAG AA compliant

## 🤝 Next Steps for Development

1. **Immediate**: Build AssetsPage.tsx with dynamic sections
2. **Then**: Build LiabilitiesPage.tsx with cross-linking
3. **Then**: Build IncomePage.tsx with contingent liabilities
4. **Then**: Build DeclarationsPage.tsx with signature capture
5. **Then**: Build ReviewPage.tsx with validation
6. **Finally**: Implement PDF generation

Each component should follow the pattern established in IdentityPage.tsx:
- Card-based layout
- Helper text with examples
- Real-time validation
- OnNext callback with validation
- Mobile-responsive grid
