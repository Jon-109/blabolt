'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  parseTemplatesCartProducts,
  TEMPLATES_CART_CHECKOUT_PATH,
} from '@/lib/stripe/checkout-paths';
import { supabase } from '@/supabase/helpers/client';

export default function TemplatesCartCheckoutRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startedRef = useRef(false);
  const [message, setMessage] = useState('Preparing secure checkout for your selected templates...');

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    const selectedProducts = parseTemplatesCartProducts(searchParams.get('products'));
    if (selectedProducts.length === 0) {
      setMessage('That templates checkout selection is not valid.');
      return;
    }

    const checkoutPath = `${TEMPLATES_CART_CHECKOUT_PATH}?products=${encodeURIComponent(
      selectedProducts.join(','),
    )}`;

    const startCheckout = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace(`/login?redirectTo=${encodeURIComponent(checkoutPath)}`);
        return;
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ productTypes: selectedProducts }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.url) {
        setMessage(payload?.error || 'Unable to start checkout right now.');
        return;
      }

      window.location.assign(payload.url);
    };

    void startCheckout();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white">
      <div className="max-w-md space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">Stripe Checkout</p>
        <h1 className="text-3xl font-black tracking-tight">Redirecting you now</h1>
        <p className="text-sm text-slate-300">{message}</p>
      </div>
    </div>
  );
}
