"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Payment confirmation arrives async via the Cashfree webhook, typically a
 * few seconds after the redirect lands here. Re-fetches this server page a
 * handful of times so a customer sitting on "Confirming Your Payment" sees
 * it flip to success/failure on its own, without a manual refresh. Stops
 * after 10 tries (~50s) rather than polling forever if something's stuck.
 */
export function PendingPaymentRefresh() {
  const router = useRouter();
  const attempts = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      attempts.current += 1;
      if (attempts.current > 10) {
        clearInterval(interval);
        return;
      }
      router.refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [router]);

  return null;
}
