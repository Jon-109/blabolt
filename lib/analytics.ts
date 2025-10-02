/**
 * Centralized GA4 Analytics Utility
 * 
 * Type-safe event tracking with GA4 recommended events.
 * Includes dev mode guards, parameter validation, and UTM persistence.
 */

// ============================================================================
// Type Definitions
// ============================================================================

declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'consent',
      targetId: string,
      params?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

// GA4 Recommended Event Names
export type GA4EventName =
  | 'page_view'
  | 'generate_lead'
  | 'select_item'
  | 'select_content'
  | 'file_download'
  // Custom events
  | 'lead_submission_error'
  | 'phone_click'
  | 'email_click'
  | 'outbound_click'
  | 'scroll';

// Event Parameter Types
export interface PageViewParams {
  page_location?: string;
  page_path: string;
  page_title?: string;
}

export interface GenerateLeadParams {
  form_id: 'loan_interest' | 'contact';
  submission_method: 'resend';
  loan_amount?: number;
  loan_purpose?: string;
  lead_source?: string;
  status: 'success';
}

export interface LeadSubmissionErrorParams {
  form_id: 'loan_interest' | 'contact';
  error_stage: 'validation' | 'network' | 'server';
  message?: string;
}

export interface SelectItemParams {
  item_list_id: string;
  item_list_name?: string;
  items: Array<{
    item_id: string;
    item_name: string;
    item_category?: string;
  }>;
}

export interface SelectContentParams {
  content_type: 'phone' | 'email' | 'link';
  link_text?: string;
  link_url?: string;
}

export interface FileDownloadParams {
  file_name: string;
  file_extension: string;
  link_url: string;
}

export interface PhoneClickParams {
  link_text?: string;
  link_url: string;
}

export interface EmailClickParams {
  link_text?: string;
  link_url: string;
}

export interface OutboundClickParams {
  link_domain: string;
  link_url: string;
}

export interface ScrollParams {
  percent_scrolled: 90;
}

export type EventParams =
  | PageViewParams
  | GenerateLeadParams
  | LeadSubmissionErrorParams
  | SelectItemParams
  | SelectContentParams
  | FileDownloadParams
  | PhoneClickParams
  | EmailClickParams
  | OutboundClickParams
  | ScrollParams;

// ============================================================================
// Configuration
// ============================================================================

const IS_DEV = process.env.NODE_ENV === 'development';
const IS_BROWSER = typeof window !== 'undefined';

// Allowed parameter keys (security: prevent PII leakage)
const ALLOWED_PARAMS = new Set([
  'page_location',
  'page_path',
  'page_title',
  'form_id',
  'submission_method',
  'loan_amount',
  'loan_purpose',
  'lead_source',
  'status',
  'error_stage',
  'message',
  'item_list_id',
  'item_list_name',
  'items',
  'content_type',
  'link_text',
  'link_url',
  'file_name',
  'file_extension',
  'link_domain',
  'percent_scrolled',
  // UTM parameters
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
]);

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Get GA4 Measurement ID from environment
 */
export function getMeasurementId(): string | undefined {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
}

/**
 * Check if analytics is enabled
 */
export function isAnalyticsEnabled(): boolean {
  return IS_BROWSER && !!getMeasurementId() && typeof window.gtag === 'function';
}

/**
 * Sanitize event parameters (remove disallowed keys)
 */
function sanitizeParams(params?: Record<string, any>): Record<string, any> {
  if (!params) return {};

  const sanitized: Record<string, any> = {};
  const disallowed: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (ALLOWED_PARAMS.has(key)) {
      sanitized[key] = value;
    } else {
      disallowed.push(key);
    }
  }

  if (IS_DEV && disallowed.length > 0) {
    console.warn(
      `[Analytics] Disallowed parameters removed:`,
      disallowed,
      '\nAllowed params:',
      Array.from(ALLOWED_PARAMS)
    );
  }

  return sanitized;
}

/**
 * Track a custom event
 */
export function track(
  eventName: GA4EventName,
  params?: EventParams
): void {
  if (!isAnalyticsEnabled()) {
    if (IS_DEV) {
      console.log(`[Analytics] ${eventName}`, params);
    }
    return;
  }

  try {
    const sanitizedParams = sanitizeParams(params);
    
    if (IS_DEV) {
      console.log(`[Analytics] Tracking: ${eventName}`, sanitizedParams);
    }

    window.gtag!('event', eventName, sanitizedParams);
  } catch (error) {
    console.error('[Analytics] Error tracking event:', error);
  }
}

/**
 * Track page view (for SPA navigation)
 */
export function trackPageview(path: string, title?: string): void {
  if (!isAnalyticsEnabled()) {
    if (IS_DEV) {
      console.log(`[Analytics] page_view`, { path, title });
    }
    return;
  }

  try {
    const params: PageViewParams = {
      page_path: path,
      page_location: window.location.href,
      page_title: title || document.title,
    };

    if (IS_DEV) {
      console.log('[Analytics] Page view:', params);
    }

    window.gtag!('event', 'page_view', params);
  } catch (error) {
    console.error('[Analytics] Error tracking page view:', error);
  }
}

/**
 * Track outbound link click
 */
export function trackOutboundLink(url: string): void {
  try {
    const urlObj = new URL(url);
    const currentDomain = window.location.hostname;

    // Only track if it's actually external
    if (urlObj.hostname !== currentDomain) {
      track('outbound_click', {
        link_domain: urlObj.hostname,
        link_url: url,
      });
    }
  } catch (error) {
    console.error('[Analytics] Error tracking outbound link:', error);
  }
}

/**
 * Track phone click
 */
export function trackPhoneClick(phoneNumber: string, linkText?: string): void {
  track('phone_click', {
    link_url: phoneNumber,
    link_text: linkText,
  });
}

/**
 * Track email click
 */
export function trackEmailClick(email: string, linkText?: string): void {
  // Redact email for privacy - only track that email was clicked
  track('email_click', {
    link_url: 'mailto', // Don't send actual email
    link_text: linkText,
  });
}

/**
 * Track file download
 */
export function trackFileDownload(url: string, fileName?: string): void {
  const name = fileName || url.split('/').pop() || 'unknown';
  const extension = name.split('.').pop() || 'unknown';

  track('file_download', {
    file_name: name,
    file_extension: extension,
    link_url: url,
  });
}

// ============================================================================
// UTM & Campaign Tracking
// ============================================================================

const UTM_STORAGE_KEY = 'ga4_utm_params';
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'];

/**
 * Capture and store UTM parameters from URL
 */
export function captureUTMParams(): void {
  if (!IS_BROWSER) return;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const utmData: Record<string, string> = {};
    let hasUTM = false;

    UTM_PARAMS.forEach((param) => {
      const value = urlParams.get(param);
      if (value) {
        utmData[param] = value;
        hasUTM = true;
      }
    });

    if (hasUTM) {
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utmData));
      if (IS_DEV) {
        console.log('[Analytics] UTM params captured:', utmData);
      }
    }
  } catch (error) {
    console.error('[Analytics] Error capturing UTM params:', error);
  }
}

/**
 * Get stored UTM parameters
 */
export function getStoredUTMParams(): Record<string, string> {
  if (!IS_BROWSER) return {};

  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    return {};
  }
}

/**
 * Get lead source from stored UTM params
 */
export function getLeadSource(): string | undefined {
  const utmParams = getStoredUTMParams();
  return utmParams.utm_source || utmParams.gclid ? 'google' : undefined;
}

// ============================================================================
// Consent Mode
// ============================================================================

export type ConsentParams = {
  ad_storage?: 'granted' | 'denied';
  analytics_storage?: 'granted' | 'denied';
  ad_user_data?: 'granted' | 'denied';
  ad_personalization?: 'granted' | 'denied';
};

/**
 * Update consent mode
 */
export function updateConsent(params: ConsentParams): void {
  if (!isAnalyticsEnabled()) return;

  try {
    window.gtag!('consent', 'update', params);
    if (IS_DEV) {
      console.log('[Analytics] Consent updated:', params);
    }
  } catch (error) {
    console.error('[Analytics] Error updating consent:', error);
  }
}

/**
 * Set default consent (call before GA4 loads)
 */
export function setDefaultConsent(params: ConsentParams): void {
  if (!IS_BROWSER) return;

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(['consent', 'default', params]);
    if (IS_DEV) {
      console.log('[Analytics] Default consent set:', params);
    }
  } catch (error) {
    console.error('[Analytics] Error setting default consent:', error);
  }
}

// ============================================================================
// Scroll Tracking
// ============================================================================

let scrollTracked = false;

/**
 * Track scroll depth (fires once at 90%)
 */
export function initScrollTracking(): void {
  if (!IS_BROWSER || scrollTracked) return;

  const handleScroll = () => {
    const scrollPercent =
      (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;

    if (scrollPercent >= 0.9 && !scrollTracked) {
      scrollTracked = true;
      track('scroll', { percent_scrolled: 90 });
      window.removeEventListener('scroll', handleScroll);
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
}

/**
 * Reset scroll tracking (call on route change)
 */
export function resetScrollTracking(): void {
  scrollTracked = false;
}

// ============================================================================
// Engagement Timing
// ============================================================================

let engagementEvents = 0;
const MAX_ENGAGEMENT_EVENTS = 2;

/**
 * Track engagement timing (10s and 30s heartbeats)
 */
export function initEngagementTracking(): void {
  if (!IS_BROWSER) return;

  // 10 second heartbeat
  setTimeout(() => {
    if (engagementEvents < MAX_ENGAGEMENT_EVENTS) {
      track('select_content', {
        content_type: 'engagement',
        link_text: '10s',
      } as any);
      engagementEvents++;
    }
  }, 10000);

  // 30 second heartbeat
  setTimeout(() => {
    if (engagementEvents < MAX_ENGAGEMENT_EVENTS) {
      track('select_content', {
        content_type: 'engagement',
        link_text: '30s',
      } as any);
      engagementEvents++;
    }
  }, 30000);
}

/**
 * Reset engagement tracking (call on route change)
 */
export function resetEngagementTracking(): void {
  engagementEvents = 0;
}

// ============================================================================
// Global Click Listener
// ============================================================================

/**
 * Initialize global click tracking for tel, mailto, and outbound links
 */
export function initClickTracking(): void {
  if (!IS_BROWSER) return;

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');

    if (!link) return;

    // Skip if explicitly ignored
    if (link.dataset.analytics === 'ignore') return;

    const href = link.getAttribute('href');
    if (!href) return;

    const linkText = link.textContent?.trim();

    // Track tel: links
    if (href.startsWith('tel:')) {
      trackPhoneClick(href, linkText);
    }
    // Track mailto: links
    else if (href.startsWith('mailto:')) {
      trackEmailClick(href, linkText);
    }
    // Track outbound links
    else if (href.startsWith('http') && link.target === '_blank') {
      trackOutboundLink(href);
    }
    // Track file downloads
    else if (href.match(/\.(pdf|doc|docx|xls|xlsx|zip|csv)$/i)) {
      trackFileDownload(href, linkText);
    }
  });
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize all analytics tracking
 * Call this once on app mount
 */
export function initAnalytics(): void {
  if (!IS_BROWSER) return;

  captureUTMParams();
  initClickTracking();
  
  if (IS_DEV) {
    console.log('[Analytics] Initialized', {
      measurementId: getMeasurementId(),
      enabled: isAnalyticsEnabled(),
    });
  }
}
