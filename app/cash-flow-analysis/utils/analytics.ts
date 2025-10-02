/**
 * @deprecated Use centralized analytics from @/lib/analytics instead
 * This file is kept for backwards compatibility
 */

import { track } from '@/lib/analytics';

type LoanPurposeEvent = {
  action: 'select_category' | 'select_subcategory' | 'enter_custom_purpose' | 'reset';
  category?: string;
  subcategory?: string;
  customPurpose?: string;
};

/**
 * @deprecated Use track('select_item', {...}) from @/lib/analytics instead
 */
export const trackLoanPurposeEvent = (event: LoanPurposeEvent): void => {
  // Map to GA4 recommended event: select_item
  const itemName = event.category || event.subcategory || event.customPurpose || 'unknown';
  
  track('select_item', {
    item_list_id: 'loan_purpose',
    item_list_name: 'Loan Purpose Selector',
    items: [{
      item_id: itemName.toLowerCase().replace(/\s+/g, '_'),
      item_name: itemName,
      item_category: 'loan_purpose',
    }],
  });
};
