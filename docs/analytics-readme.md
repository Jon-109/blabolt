# GA4 Analytics Implementation Guide

**Framework:** Next.js 15 (App Router)  
**Analytics:** Google Analytics 4 (GA4)  
**Utility:** `lib/analytics.ts`

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Event Catalog](#event-catalog)
4. [How to Track Events](#how-to-track-events)
5. [GA4 Admin Setup](#ga4-admin-setup)
6. [Development & Testing](#development--testing)
7. [Security & Privacy](#security--privacy)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Add GA4 Measurement ID

Add to `.env.local`:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 2. Track Custom Events

```typescript
import { track } from '@/lib/analytics';

// Track a lead generation
track('generate_lead', {
  form_id: 'loan_interest',
  submission_method: 'resend',
  lead_source: 'google',
  status: 'success',
});

// Track a phone click
track('phone_click', {
  link_url: 'tel:+1234567890',
  link_text: 'Call Now',
});
```

### 3. Verify in GA4

1. Open GA4 → **Reports** → **Realtime**
2. Trigger an event on your site
3. See it appear within ~10 seconds

---

## Environment Setup

### Required Environment Variables

```bash
# .env.local
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX  # Your GA4 Measurement ID
```

### Get Your Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Admin → Data Streams → Select your web stream
3. Copy the **Measurement ID** (starts with `G-`)

### Development vs Production

- **Development:** Events are logged to console only (no GA4 tracking)
- **Production:** Events are sent to GA4 when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set

---

## Event Catalog

### Standard Events (GA4 Recommended)

| Event Name | Description | When to Use | Key Parameters |
|------------|-------------|-------------|----------------|
| `page_view` | User views a page | **Automatic** on route change | `page_path`, `page_title`, `page_location` |
| `generate_lead` | User submits lead form | Form submission success | `form_id`, `submission_method`, `lead_source`, `status` |
| `select_item` | User selects an item | Dropdown/list selection | `item_list_id`, `items[]` |
| `file_download` | User downloads a file | PDF/doc download | `file_name`, `file_extension`, `link_url` |

### Custom Events

| Event Name | Description | When to Use | Key Parameters |
|------------|-------------|-------------|----------------|
| `lead_submission_error` | Form submission fails | Validation/network error | `form_id`, `error_stage`, `message` |
| `phone_click` | User clicks phone link | Click on `tel:` link | `link_url`, `link_text` |
| `email_click` | User clicks email link | Click on `mailto:` link | `link_text` (email redacted) |
| `outbound_click` | User clicks external link | Click on external domain | `link_domain`, `link_url` |
| `scroll` | User scrolls 90% of page | Deep engagement | `percent_scrolled: 90` |

---

## How to Track Events

### 1. Import the Utility

```typescript
import { track, trackPageview, trackPhoneClick } from '@/lib/analytics';
```

### 2. Track Standard Events

#### Page Views (Automatic)

Page views are **automatically tracked** on route changes. No code needed.

To manually track:

```typescript
trackPageview('/custom-path', 'Custom Page Title');
```

#### Lead Generation

```typescript
import { track, getLeadSource } from '@/lib/analytics';

// On successful form submission
track('generate_lead', {
  form_id: 'loan_interest',
  submission_method: 'resend',
  loan_amount: 50000,           // Optional
  loan_purpose: 'equipment',    // Optional
  lead_source: getLeadSource(), // Auto-detects from UTM
  status: 'success',
});
```

#### Form Errors

```typescript
// Validation error
track('lead_submission_error', {
  form_id: 'loan_interest',
  error_stage: 'validation',
  message: 'Missing required fields',
});

// Network error
track('lead_submission_error', {
  form_id: 'loan_interest',
  error_stage: 'network',
  message: 'API request failed',
});
```

### 3. Track Click Events

#### Phone Clicks (Automatic)

Phone clicks are **automatically tracked** via global click listener.

To manually track:

```typescript
trackPhoneClick('tel:+1234567890', 'Call Support');
```

#### Email Clicks (Automatic)

Email clicks are **automatically tracked** (email address is redacted for privacy).

To manually track:

```typescript
trackEmailClick('mailto:support@example.com', 'Email Support');
```

#### Outbound Links (Automatic)

External links with `target="_blank"` are **automatically tracked**.

To manually track:

```typescript
trackOutboundLink('https://external-site.com/page');
```

#### File Downloads (Automatic)

Links to `.pdf`, `.doc`, `.xlsx`, etc. are **automatically tracked**.

To manually track:

```typescript
trackFileDownload('/path/to/document.pdf', 'Loan Application');
```

### 4. Disable Automatic Tracking

To prevent a link from being tracked:

```html
<a href="tel:+1234567890" data-analytics="ignore">
  Don't track this
</a>
```

### 5. Track Custom Item Selection

```typescript
track('select_item', {
  item_list_id: 'loan_purpose',
  item_list_name: 'Loan Purpose Selector',
  items: [{
    item_id: 'real_estate',
    item_name: 'Real Estate',
    item_category: 'loan_purpose',
  }],
});
```

---

## GA4 Admin Setup

### Mark Events as Conversions

To track business goals, mark key events as conversions:

1. Go to **GA4 Admin** → **Events**
2. Find these events and toggle **Mark as conversion**:
   - ✅ `generate_lead` (primary conversion)
   - ✅ `phone_click`
   - ✅ `email_click`
   - ✅ `file_download` (optional)

### Create Custom Dimensions (Optional)

For better reporting, create custom dimensions:

1. **GA4 Admin** → **Custom Definitions** → **Create custom dimension**

| Dimension Name | Event Parameter | Scope |
|----------------|-----------------|-------|
| Form ID | `form_id` | Event |
| Lead Source | `lead_source` | Event |
| Error Stage | `error_stage` | Event |
| Loan Purpose | `loan_purpose` | Event |

### Set Up Audiences

Create audiences for retargeting:

1. **GA4 Admin** → **Audiences** → **New audience**

**Example: "Lead Form Abandoners"**
- Include: `select_content` with `content_type = 'form_start'`
- Exclude: `generate_lead`
- Membership duration: 30 days

---

## Development & Testing

### Local Development

When `NODE_ENV=development`, events are:
- ✅ Logged to browser console
- ❌ NOT sent to GA4

```bash
npm run dev
# Open console to see: [Analytics] generate_lead { form_id: 'loan_interest', ... }
```

### Production Testing

1. Deploy to production or set `NODE_ENV=production` locally
2. Open **GA4 Realtime** view
3. Trigger events on your site
4. Verify they appear in Realtime (within ~10 seconds)

### Debug Mode

Check if analytics is enabled:

```typescript
import { isAnalyticsEnabled, getMeasurementId } from '@/lib/analytics';

console.log('Enabled:', isAnalyticsEnabled());
console.log('Measurement ID:', getMeasurementId());
```

### Parameter Validation

The utility **automatically removes disallowed parameters** to prevent PII leakage.

In development, you'll see warnings:

```
[Analytics] Disallowed parameters removed: ['email', 'phone_number']
Allowed params: ['form_id', 'submission_method', ...]
```

---

## Security & Privacy

### PII Protection

The analytics utility **prevents PII from being sent to GA4**:

✅ **Allowed Parameters:**
- `form_id`, `submission_method`, `loan_amount`, `loan_purpose`
- `link_text`, `link_url`, `file_name`, `link_domain`
- UTM parameters (`utm_source`, `utm_medium`, etc.)

❌ **Blocked (Auto-Removed):**
- `email`, `phone_number`, `name`, `address`
- Any parameter not in the allowlist

### Email Redaction

Email clicks are tracked, but the actual email address is **redacted**:

```typescript
// User clicks: mailto:john@example.com
// Tracked as:
{
  link_url: 'mailto',  // Email address removed
  link_text: 'Contact Support'
}
```

### Consent Mode

Default consent is set to **granted** for all purposes:

```javascript
gtag('consent', 'default', {
  'ad_storage': 'granted',
  'analytics_storage': 'granted',
  'ad_user_data': 'granted',
  'ad_personalization': 'granted'
});
```

To update consent (e.g., after user accepts cookies):

```typescript
import { updateConsent } from '@/lib/analytics';

updateConsent({
  ad_storage: 'granted',
  analytics_storage: 'granted',
});
```

---

## Troubleshooting

### Events Not Appearing in GA4

**Check 1: Measurement ID**
```bash
# Verify it's set
echo $NEXT_PUBLIC_GA_MEASUREMENT_ID
```

**Check 2: Browser Console**
```javascript
// Open DevTools → Console
console.log(window.gtag);  // Should be a function
console.log(window.dataLayer);  // Should be an array
```

**Check 3: Network Tab**
1. Open DevTools → Network
2. Filter: `google-analytics.com`
3. Trigger an event
4. Look for `collect?` requests

**Check 4: GA4 Realtime**
- Events can take up to 30 seconds to appear
- Realtime only shows last 30 minutes of data

### Events Tracked Twice

**Cause:** Both GTM and GA4 direct implementation are active.

**Solution:** Choose one:
- **Option A:** Use GA4 direct (current setup) and disable GTM
- **Option B:** Use GTM and remove GA4 scripts from `layout.tsx`

### TypeScript Errors

**Error:** `Property 'gtag' does not exist on type 'Window'`

**Solution:** The types are defined in `lib/analytics.ts`. Ensure you import from there:

```typescript
import { track } from '@/lib/analytics';  // ✅ Correct
// Don't use window.gtag directly
```

### UTM Parameters Not Captured

**Check:** UTM params are captured on **first page load** only.

```typescript
import { getStoredUTMParams } from '@/lib/analytics';

console.log(getStoredUTMParams());
// { utm_source: 'google', utm_medium: 'cpc', ... }
```

To test:
1. Clear localStorage
2. Visit: `http://localhost:3000?utm_source=test&utm_medium=email`
3. Check localStorage for `ga4_utm_params`

---

## Adding New Events

### Step 1: Define Event Type

Edit `lib/analytics.ts`:

```typescript
// Add to GA4EventName union
export type GA4EventName =
  | 'page_view'
  | 'generate_lead'
  | 'your_new_event';  // ← Add here

// Create parameter interface
export interface YourNewEventParams {
  custom_param: string;
  another_param?: number;
}

// Add to EventParams union
export type EventParams =
  | PageViewParams
  | GenerateLeadParams
  | YourNewEventParams;  // ← Add here
```

### Step 2: Add Allowed Parameters

```typescript
const ALLOWED_PARAMS = new Set([
  // ... existing params
  'custom_param',
  'another_param',
]);
```

### Step 3: Track the Event

```typescript
import { track } from '@/lib/analytics';

track('your_new_event', {
  custom_param: 'value',
  another_param: 123,
});
```

### Step 4: Mark as Conversion (Optional)

1. Deploy to production
2. Trigger the event at least once
3. GA4 Admin → Events → Mark as conversion

---

## Best Practices

### ✅ Do's

- **Use GA4 recommended events** when possible (`generate_lead`, `select_item`, etc.)
- **Track meaningful user actions** (form submissions, downloads, key clicks)
- **Add UTM parameters** to marketing campaigns for attribution
- **Test in GA4 Realtime** before deploying to production
- **Document custom events** in this README

### ❌ Don'ts

- **Don't send PII** (emails, phone numbers, names, addresses)
- **Don't track every click** (creates noise, use sparingly)
- **Don't use legacy GA event names** (`event_category`, `event_label`)
- **Don't hardcode measurement IDs** (use environment variables)
- **Don't track in development** (pollutes analytics data)

---

## Migration from Legacy Analytics

If you have old analytics code using Universal Analytics patterns:

### Before (Legacy)

```typescript
window.gtag('event', 'click', {
  event_category: 'button',
  event_label: 'signup',
});
```

### After (GA4)

```typescript
import { track } from '@/lib/analytics';

track('select_content', {
  content_type: 'button',
  link_text: 'signup',
});
```

Or use a GA4 recommended event:

```typescript
track('sign_up', {
  method: 'email',
});
```

---

## Support & Resources

### Documentation

- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [GA4 Recommended Events](https://support.google.com/analytics/answer/9267735)
- [Consent Mode](https://developers.google.com/tag-platform/security/guides/consent)

### Internal Files

- **Analytics Utility:** `lib/analytics.ts`
- **Route Tracking:** `app/(components)/AnalyticsProvider.tsx`
- **Form Tracking:** `app/(components)/shared/ContactFormModal.tsx`
- **Audit Report:** `docs/analytics-audit.md`

### Common Issues

| Issue | Solution |
|-------|----------|
| Events not tracking | Check `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set |
| Duplicate page views | Ensure only one analytics provider is active |
| PII in events | Use parameter allowlist in `lib/analytics.ts` |
| TypeScript errors | Import from `@/lib/analytics`, not `window.gtag` |

---

**Last Updated:** 2025-10-02  
**Maintained By:** Development Team
