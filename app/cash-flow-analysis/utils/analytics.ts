type LoanPurposeEvent = {
  action: 'select_category' | 'select_subcategory' | 'enter_custom_purpose' | 'reset';
  category?: string;
  subcategory?: string;
  customPurpose?: string;
};

export const trackLoanPurposeEvent = (event: LoanPurposeEvent): void => {
  // This can be connected to your analytics service (e.g., Google Analytics, Mixpanel)
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics Event:', event);
  }

  // Example implementation for production
  try {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', event.action, {
        event_category: 'loan_purpose',
        event_label: event.category || event.subcategory || event.customPurpose,
      });
    }
  } catch (error) {
    console.error('Analytics Error:', error);
  }
};
