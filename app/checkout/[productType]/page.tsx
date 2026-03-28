'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase/helpers/client';
import { isStripeCheckoutProductType } from '@/lib/stripe/catalog';

export default function CheckoutRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const startedRef = useRef(false);
  const [message, setMessage] = useState('Preparing secure checkout...');

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    const productType = typeof params.productType === 'string' ? params.productType : '';
    if (!productType || !isStripeCheckoutProductType(productType)) {
      setMessage('That checkout link is not valid.');
      return;
    }

    const startCheckout = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace(`/login?redirectTo=${encodeURIComponent(`/checkout/${productType}`)}`);
        return;
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ productType }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.url) {
        setMessage(payload?.error || 'Unable to start checkout right now.');
        return;
      }

      window.location.assign(payload.url);
    };

    void startCheckout();
  }, [params.productType, router]);

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
