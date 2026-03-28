'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Button, type ButtonProps } from '@/app/(components)/ui/button';
import type { StripeCheckoutProductType } from '@/lib/stripe/catalog';
import { getCheckoutPath } from '@/lib/stripe/checkout-paths';
import { supabase } from '@/supabase/helpers/client';

type AuthAwareCheckoutButtonProps = Omit<ButtonProps, 'asChild'> & {
  pendingLabel?: React.ReactNode;
  productType: StripeCheckoutProductType;
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
