# 📄 Product Requirements Document (PRD)

> Historical planning document. The canonical current product and technical reference is `docs/platform-master-source-of-truth.md`.

## Feature: Loan Packaging & Brokering Dashboard  
**Product**: Business Lending Advocate (BLA)  
**Owner**: Jonathan Aranda  
**Version**: v1.1  
**Status**: Development-ready  

---

## 🎯 Purpose

Build a secure, guided dashboard experience that helps small business owners organize and submit lender-ready documentation for financing. Depending on the selected service type — `loan_packaging` or `loan_brokering` — users will either:

- Receive a downloadable and shareable loan package, or  
- Submit their documents to the BLA team, who will manage lender matchmaking.

The platform should be simple, professional, highly intuitive, and designed to reduce user friction while maximizing confidence, clarity, and conversion.

---

## 👤 Target Users

- Small business owners with limited technical knowledge
- Users who are applying for funding and want help organizing required documents
- People who value step-by-step support, clear progress tracking, and secure file handling
- Users who appreciate smart automation but prefer human-friendly language

---

## 🧭 High-Level User Flow

1. **User logs in** via SupabaseAuth  
2. **Selects service type + loan purpose** and proceeds through a payment or agreement step  
3. **Redirected to the dashboard** with dynamic checklist and floating progress tracker  
4. **Uploads or generates each document** (with templates, file upload, or AI generation)  
5. **Generates and edits Cover Letter**  
6. **Finalizes flow**:  
   - Packaging users: download package + create secure lender page  
   - Brokering users: submit to BLA, no downloads or public sharing  
7. **Optional**: Lender page creation with password protection  

---

## 🧾 Service Type Selection + Payment/Agreement Flow

This replaces the traditional service type form.

### 1. Loan Packaging — $499 via Stripe
- User selects “Loan Packaging”
- Clicks “Continue” → triggers **Stripe Checkout** via connected Stripe API
  - Product: Loan Packaging
  - Price: $499 (one-time payment)
- After successful checkout:
  - User is redirected to the dashboard
  - `loan_packaging` row is created in Supabase
  - Payment confirmation is tracked via webhook or query param

### 2. Loan Brokering — Agreement via JotForm
- User selects “Loan Brokering”
- Clicks “Continue” → redirected to hosted **JotForm**
  - Contains brokering agreement + e-signature
- After submission:
  - JotForm redirects user to dashboard
  - `loan_packaging` row is created in Supabase
  - Optional: use query param or webhook to confirm submission

> 🧠 Both flows result in a unique `loan_packaging` row associated with the authenticated user and flagged by type.

---

## 🧱 Feature Breakdown

### 1. 📋 Loan Dashboard with Progress Checklist Sidebar

- Sticky/floating sidebar showing:
  - “You’ve completed X of Y documents”
  - The next recommended action (e.g., “Next: Upload Profit & Loss Statement”)
- Updates live as documents are uploaded, generated, or marked complete

---

### 2. 📁 Document Checklist Panel

Each document is displayed as an interactive card or row including:

- Document Name  
- Tooltip / Why this matters  
- Status Indicator (Not Started, Uploaded, Generated)  
- Available actions:
  - Upload File  
  - View Template  
  - Start (for AI-generated items)

---

### 3. 📝 Cover Letter Generator (AI-enhanced)

- Form collects:
  - Business name (auto-filled)
  - Requested loan amount
  - Loan purpose (auto-filled)
  - Use of funds
  - Business summary

- On submit:
  - Backend AI generates a letter draft
  - Preview is shown in a styled letter format

- Edits allowed via:
  - Direct inline editing
  - Optional tweak prompt (e.g., “Make it more persuasive”)

- On finalization:
  - PDF is generated
  - Uploaded to Supabase Storage
  - Marked as complete in Supabase

---

### 4. 📂 Other Required Documents

- Allow upload for each required document  
- Show document status: Not Started, Uploaded, Completed  
- View templates for supported formats  
- File validations (type/size)  
- Uploads stored in Supabase Storage  

---

## ✅ Finalization Logic

### A. Loan Packaging

- Once all documents are complete:
  - ✅ Download My Loan Package (ZIP or merged PDF)
  - 🔒 Create Secure Lender Page:
    - Prompts user to enter a password
    - Creates a unique shareable URL (e.g., `/loan-package/abc123`)
    - Displays:
      - Business name
      - Loan purpose
      - Requested amount
      - Downloadable documents
    - Password-protected access

- Copy block shown for user:
