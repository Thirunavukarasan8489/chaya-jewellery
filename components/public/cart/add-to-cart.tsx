"use client";

import * as React from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/public/cart/cart-provider";
import { Button } from "@/components/public/ui/button";
import { availableQuantity, type Product } from "@/lib/types";

export function AddToCart({
  product,
  withQuantity = true,
  variantId,
  variantSku,
  variantName,
  variantPrice,
  maxQuantity,
  variantValue,
  calculatePriceOnVariantValue,
}: {
  product: Product;
  withQuantity?: boolean;
  variantId?: string;
  variantSku?: string;
  variantName?: string;
  variantPrice?: number;
  maxQuantity?: number;
  variantValue?: number;
  calculatePriceOnVariantValue?: boolean;
}) {
  const { add } = useCart();
  const [qty, setQty] = React.useState(1);
  const rawMax = maxQuantity ?? availableQuantity(product);
  const max = isNaN(Number(rawMax)) ? 99 : Number(rawMax);
  const soldOut = max <= 0;

  if (soldOut) {
    return (
      <Button variant="outline" size="lg" full disabled>
        Sold out
      </Button>
    );
  }

  return (
    <div className="flex items-stretch gap-3">
      {withQuantity && (
        <div className="flex h-14 shrink-0 items-center rounded-full border border-plum-900/15 bg-white">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="grid size-12 place-items-center rounded-full text-plum-700 transition-colors hover:bg-ivory-200 disabled:opacity-35"
          >
            <Minus size={16} strokeWidth={2.5} />
          </button>
          <span
            aria-live="polite"
            className="w-7 text-center text-base font-semibold tabular-nums"
          >
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(max, q + 1))}
            disabled={qty >= max}
            aria-label="Increase quantity"
            className="grid size-12 place-items-center rounded-full text-plum-700 transition-colors hover:bg-ivory-200 disabled:opacity-35"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}

      <Button size="lg" full onClick={() => add(product, qty, variantName || product.selectedVariantName, variantPrice || product.sellingPrice, variantValue, calculatePriceOnVariantValue, variantId, variantSku)}>
        <ShoppingBag size={18} strokeWidth={2.25} />
        Add to cart
      </Button>
    </div>
  );
}

/** Compact variant used on product cards in listings and rails. */
export function QuickAdd({ product }: { product: Product }) {
  const { add } = useCart();
  const soldOut = availableQuantity(product) <= 0;

  return (
    <button
      type="button"
      disabled={soldOut}
      aria-label={soldOut ? "Sold out" : `Add ${product.name} to cart`}
      onClick={(e) => {
        e.preventDefault();
        const variant = product.variants?.[0];
        add(product, 1, product.selectedVariantName, product.sellingPrice, variant?.variantValue, undefined, variant?.id, variant?.sku);
      }}
      className="grid size-11 shrink-0 place-items-center rounded-full bg-plum-900 text-ivory-100 shadow-md transition-[background-color,transform] duration-200 hover:bg-gold-500 hover:text-plum-950 active:scale-95 disabled:pointer-events-none disabled:opacity-35"
    >
      <ShoppingBag size={17} strokeWidth={2.25} />
    </button>
  );
}
