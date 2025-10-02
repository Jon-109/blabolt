"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  initAnalytics,
  trackPageview,
  resetScrollTracking,
  resetEngagementTracking,
  initScrollTracking,
  initEngagementTracking,
} from '@/lib/analytics';

/**
 * Analytics Provider
 * 
 * Handles:
 * - Initial analytics setup
 * - SPA route change tracking
 * - Scroll depth tracking (optional)
 * - Engagement timing (optional)
 */
export default function AnalyticsProvider({
  children,
  enableScrollTracking = false,
  enableEngagementTracking = false,
}: {
  children: React.ReactNode;
  enableScrollTracking?: boolean;
  enableEngagementTracking?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize analytics once on mount
  useEffect(() => {
    initAnalytics();
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (pathname) {
      const url = searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;

      trackPageview(url);

      // Reset tracking state for new page
      resetScrollTracking();
      resetEngagementTracking();

      // Re-initialize optional tracking
      if (enableScrollTracking) {
        initScrollTracking();
      }
      if (enableEngagementTracking) {
        initEngagementTracking();
      }
    }
  }, [pathname, searchParams, enableScrollTracking, enableEngagementTracking]);

  return <>{children}</>;
}
