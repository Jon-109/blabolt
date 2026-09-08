'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Button, type ButtonProps } from '@/app/(components)/ui/button';
import type { StripeCheckoutProductType } from '@/lib/stripe/catalog';
import { getCheckoutPath } from '@/lib/stripe/checkout-paths';
import { trackBeginCheckout } from '@/lib/analytics';
import { supabase } from '@/supabase/helpers/client';

type AuthAwareCheckoutButtonProps = Omit<ButtonProps, 'asChild'> & {
  pendingLabel?: React.ReactNode;
  productType: StripeCheckoutProductType;
};

const checkoutEventMeta: Record<StripeCheckoutProductType, { itemName: string; value: number }> = {
  balance_sheet: { itemName: 'Balance Sheet Template', value: 9.99 },
  income_statement: { itemName: 'Profit and Loss Statement Template', value: 9.99 },
  business_debt_summary: { itemName: 'Business Debt Summary Template', value: 9.99 },
  personal_financial_statement: { itemName: 'Personal Financial Statement Template', value: 9.99 },
  personal_debt_summary: { itemName: 'Personal Debt Summary Template', value: 9.99 },
  templates_bundle: { itemName: 'Loan Document Templates Bundle', value: 29.99 },
  loan_packaging: { itemName: 'Loan Packaging', value: 499 },
  cash_flow_analysis: { itemName: 'Free Bank-Level Cash Flow Analysis', value: 0 },
};

export default function AuthAwareCheckoutButton({
  children,
  disabled,
  onClick,
  pendingLabel = 'Continuing...',
  productType,
  ...buttonProps
}: AuthAwareCheckoutButtonProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = React.useState(false);

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = async (event) => {
    onClick?.(event);
    if (event.defaultPrevented || isStarting) {
      return;
    }

    const checkoutPath = getCheckoutPath(productType);
    const eventMeta = checkoutEventMeta[productType];
    trackBeginCheckout({
      item_id: productType,
      item_name: eventMeta.itemName,
      value: eventMeta.value,
      currency: 'USD',
    });
    setIsStarting(true);

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (!session?.access_token) {
        router.push(`/login?redirectTo=${encodeURIComponent(checkoutPath)}`);
        return;
      }

      router.push(checkoutPath);
    } catch (error) {
      console.error(`Failed to start checkout for ${productType}:`, error);
      router.push(`/login?redirectTo=${encodeURIComponent(checkoutPath)}`);
    }
  };

  return (
    <Button
      {...buttonProps}
      disabled={disabled || isStarting}
      onClick={handleClick}
    >
      {isStarting ? pendingLabel : children}
    </Button>
  );
}
