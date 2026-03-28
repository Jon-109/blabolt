'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Button, type ButtonProps } from '@/app/(components)/ui/button';
import { supabase } from '@/supabase/helpers/client';

type AuthAwareRouteButtonProps = Omit<ButtonProps, 'asChild'> & {
  pendingLabel?: React.ReactNode;
  route: string;
};

export default function AuthAwareRouteButton({
  children,
  disabled,
  onClick,
  pendingLabel = 'Continuing...',
  route,
  ...buttonProps
}: AuthAwareRouteButtonProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = React.useState(false);

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = async (event) => {
    onClick?.(event);
    if (event.defaultPrevented || isStarting) {
      return;
    }

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
        router.push(`/login?redirectTo=${encodeURIComponent(route)}`);
        return;
      }

      router.push(route);
    } catch (error) {
      console.error(`Failed to route to ${route}:`, error);
      router.push(`/login?redirectTo=${encodeURIComponent(route)}`);
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
