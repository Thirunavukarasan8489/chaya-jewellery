"use client";

import * as React from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { useCart } from "@/components/public/cart/cart-provider";
import { GemImage } from "@/components/public/ui/gem-image";
import { buttonStyles } from "@/components/public/ui/button";
import { formatINR } from "@/lib/utils";
import Image from "next/image";

/**
 * Confirmation after "add to cart". Sits above the mobile tab bar so it never
 * covers the primary navigation.
 */
export function CartToast() {
  const { lastAdded, dismissLastAdded, count } = useCart();
  React.useEffect(() => {
    if (!lastAdded) return;
    const timer = window.setTimeout(dismissLastAdded, 4500);
    return () => window.clearTimeout(timer);
  }, [lastAdded, dismissLastAdded]);

  if (!lastAdded) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 animate-[rise_.35s_var(--ease-out-soft)_both] lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-96"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-plum-900/10 bg-white p-3 shadow-lg">
        {lastAdded.image ? (
          <Image
            src={lastAdded.image}
            alt={lastAdded.name}
            width={56}
            height={56}
            className="size-14 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <GemImage
            color={lastAdded.gemColor}
            className="size-14 shrink-0 rounded-xl"
          />
        )}

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold tracking-wide text-emerald-700 uppercase">
            <Check size={13} strokeWidth={3} />
            Added to cart
          </p>
          <p className="truncate text-sm font-semibold text-plum-900">
            {lastAdded.name}
          </p>
          <p className="text-xs text-ink-muted">
            {lastAdded.quantity} × {formatINR(lastAdded.unitPrice)}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <button
            type="button"
            onClick={dismissLastAdded}
            aria-label="Dismiss"
            className="grid size-7 place-items-center rounded-full text-plum-400 hover:bg-ivory-200 hover:text-plum-700"
          >
            <X size={15} />
          </button>
          <Link
            href="/cart"
            onClick={dismissLastAdded}
            className={buttonStyles({
              size: "sm",
              className: "h-9 px-3.5 text-xs",
            })}
          >
            View cart ({count})
          </Link>
        </div>
      </div>
    </div>
  );
}
