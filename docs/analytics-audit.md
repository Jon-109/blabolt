# GA4 Analytics Implementation Audit

**Date:** 2025-10-02  
**Auditor:** Senior Analytics Engineer  
**Framework:** Next.js 15.3.1 (App Router)

---

## Executive Summary

The current implementation uses **Google Tag Manager (GTM)** with minimal custom event tracking. There is no GA4 Measurement ID configured, no SPA route change tracking, and limited structured event tracking beyond one custom loan purpose selector.

### Critical Issues Found

1. ❌ **No GA4 Measurement ID** - Only GTM container (GTM-NGD7MTC9) is configured
2. ❌ **No SPA page view tracking** - Route changes don't fire page_view events
3. ❌ **No centralized analytics utility** - Events scattered, inconsistent naming
4. ❌ **Non-GA4 event naming** - Using legacy GA Universal Analytics patterns
5. ❌ **No form tracking** - Contact form submissions not tracked
6. ❌ **No click tracking** - tel:, mailto:, outbound links not tracked
7. ❌ **No UTM persistence** - Campaign parameters not captured/stored
8. ❌ **No consent mode** - GDPR/privacy compliance not implemented

---

## Current Implementation Inventory

### 1. Analytics Infrastructure

**File:** `app/layout.tsx`
- **Technology:** Google Tag Manager (GTM-NGD7MTC9)
- **Implementation:** Inline script in `<head>` + noscript iframe
- **Issues:** 
  - GTM is loaded but no GA4 tag configuration found
  - No environment-based loading (runs in dev/prod)
  - Missing GA4 Measurement ID

**File:** `app/(components)/AnalyticsWrapper.tsx`
- **Technology:** Vercel Analytics
- **Purpose:** Vercel's built-in page view tracking
- **Scope:** Limited to Vercel platform metrics, not GA4

### 2. Custom Event Tracking

**File:** `app/cash-flow-analysis/utils/analytics.ts`

```typescript
trackLoanPurposeEvent({
  action: 'select_category' | 'select_subcategory' | 'enter_custom_purpose' | 'reset',
  category?: string,
  subcategory?: string,
  customPurpose?: string
})
```

**Issues:**
- ✅ Has dev mode guard
- ❌ Uses legacy GA event structure (`event_category`, `event_label`)
- ❌ Should use GA4 recommended events (e.g., `select_item`)
- ❌ No TypeScript safety for gtag calls
- ❌ Only used in one component (LoanPurposeSelector)

### 3. Forms Without Tracking

**File:** `app/(components)/shared/ContactFormModal.tsx`
- **Form Type:** Loan interest / contact form
- **Backend:** Resend API (`/api/send-contact-email`)
- **Current Tracking:** ❌ None
- **Should Track:**
  - Form start (first interaction)
  - Validation errors (client-side)
  - Submit success → `generate_lead` event
  - Submit failure → `lead_submission_error` event

**File:** `app/api/send-contact-email/route.ts`
- **Technology:** Resend email service
- **Current Tracking:** ❌ None
- **Should Track:** Server-side success/failure (via client callback)

### 4. Interactive Elements Without Tracking

**Tel Links:** Found in 3 files
- `app/(components)/analysis/FAQPrompt.tsx`
- `app/(components)/shared/Footer.tsx`
- `app/faq/page.tsx`
- **Current Tracking:** ❌ None

**Mailto Links:** Found in 4 files
- `app/privacy-policy/page.tsx`
- `app/terms-of-service/page.tsx`
- `app/(components)/shared/ContactFormModal.tsx`
- `app/faq/page.tsx`
- **Current Tracking:** ❌ None

**Outbound Links (target="_blank"):** Found in 6 files
- Template preview links
- PDF download links
- **Current Tracking:** ❌ None

### 5. Route Changes

**Router Type:** App Router (Next.js 15)
- **Hooks Available:** `usePathname()`, `useSearchParams()`
- **Current Tracking:** ❌ None
- **Issue:** SPA navigation doesn't fire page_view events after initial load

---

## Gaps & Recommendations

### High Priority

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| No GA4 Measurement ID | Analytics not collecting | Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` to `.env.local` |
| No SPA page views | Route changes invisible | Implement `usePathname()` effect in layout |
| No form tracking | Lead conversion invisible | Add `generate_lead` event on contact form success |
| No click tracking | User engagement invisible | Add delegated click listener for tel/mailto/outbound |

### Medium Priority

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| Non-standard event names | Poor GA4 integration | Migrate to GA4 recommended events |
| No UTM persistence | Attribution loss | Store UTM params in localStorage on first visit |
| No centralized utility | Maintenance burden | Create `lib/analytics.ts` with type-safe API |

### Low Priority

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| No consent mode | GDPR risk | Add basic consent mode hook (default granted) |
| No scroll tracking | Engagement data missing | Add 90% scroll depth event (opt-in) |
| No engagement timing | Session quality unknown | Add 10s/30s heartbeat (capped at 2 events) |

---

## Event Naming Migration

### Current (Legacy GA)

```typescript
gtag('event', 'select_category', {
  event_category: 'loan_purpose',
  event_label: 'Real Estate'
})
```

### Recommended (GA4)

```typescript
gtag('event', 'select_item', {
  item_list_id: 'loan_purpose',
  item_list_name: 'Loan Purpose Selector',
  items: [{
    item_id: 'real_estate',
    item_name: 'Real Estate',
    item_category: 'loan_purpose'
  }]
})
```

---

## Proposed Event Catalog

### Standard Events (GA4 Recommended)

| Event Name | Trigger | Parameters |
|------------|---------|------------|
| `page_view` | Initial load + route change | `page_location`, `page_path`, `page_title` |
| `generate_lead` | Contact form success | `form_id`, `submission_method`, `loan_amount?`, `loan_purpose?`, `lead_source?` |
| `select_item` | Loan purpose selection | `item_list_id`, `items[]` |

### Custom Events

| Event Name | Trigger | Parameters |
|------------|---------|------------|
| `lead_submission_error` | Form validation/network error | `form_id`, `error_stage`, `message?` |
| `phone_click` | Click on tel: link | `link_text?`, `link_url` |
| `email_click` | Click on mailto: link | `link_text?`, `link_url` |
| `outbound_click` | Click external link | `link_domain`, `link_url` |
| `file_download` | PDF/file download | `file_name`, `file_extension`, `link_url` |
| `scroll` | 90% page scroll | `percent_scrolled: 90` |

---

## Technical Debt

1. **GTM vs GA4 Direct:** Currently using GTM but no GA4 tag configured inside it. Recommend direct GA4 implementation via gtag.js for simplicity.

2. **Vercel Analytics Duplication:** Both Vercel Analytics and GTM are loaded. Consider if both are needed or consolidate.

3. **No Error Boundaries:** Analytics errors could break UI. Need try/catch wrappers.

4. **No Dev/Prod Separation:** GTM loads in development. Should gate on `NODE_ENV` or use separate GTM containers.

5. **Type Safety:** All gtag calls use `any` type. Need proper TypeScript definitions.

---

## Security & Privacy Concerns

1. ❌ **PII Risk:** Contact form collects business name, first/last name, concerns, message. Must NOT send to GA4.
2. ❌ **No Consent Management:** No CMP (Consent Management Platform) implemented.
3. ❌ **No Data Redaction:** Email addresses in mailto: links could leak to GA4 if not careful.

**Recommendation:** Implement strict parameter allowlisting in analytics utility.

---

## Next Steps

1. ✅ Create centralized `lib/analytics.ts` with type-safe API
2. ✅ Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` to environment
3. ✅ Implement SPA page view tracking in `app/layout.tsx`
4. ✅ Add contact form event tracking
5. ✅ Implement global click tracking (tel/mailto/outbound)
6. ✅ Create analytics documentation
7. ⏳ Test in GA4 Realtime view
8. ⏳ Mark key events as conversions in GA4 Admin

---

## Files Requiring Changes

- ✅ `lib/analytics.ts` (new)
- ✅ `app/layout.tsx` (add GA4 script + route tracking)
- ✅ `app/(components)/AnalyticsProvider.tsx` (new - route change listener)
- ✅ `app/(components)/shared/ContactFormModal.tsx` (add form tracking)
- ✅ `app/cash-flow-analysis/utils/analytics.ts` (migrate to new utility)
- ✅ `.env.local` (add GA4 Measurement ID)
- ✅ `docs/analytics-readme.md` (new)

---

**End of Audit**
