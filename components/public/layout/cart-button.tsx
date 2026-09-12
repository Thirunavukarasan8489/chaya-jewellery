"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/public/cart/cart-provider";

export function CartButton() {
  const { count, hydrated } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={`Cart${hydrated && count ? `, ${count} items` : ""}`}
      className="relative grid size-10 place-items-center rounded-full text-plum-800 transition-colors hover:bg-plum-900/6"
    >
      <ShoppingBag size={21} strokeWidth={2} />
      {hydrated && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-gold-500 px-1 text-[0.625rem] font-bold text-plum-950 tabular-nums">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
