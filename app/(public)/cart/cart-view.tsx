"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useCart } from "@/components/public/cart/cart-provider";
import { buttonStyles } from "@/components/public/ui/button";
import { GemImage } from "@/components/public/ui/gem-image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { validateCart } from "@/lib/actions/cart.actions";
import { formatINR } from "@/lib/utils";

export function CartView({ settings }: { settings: any }) {
  const { lines, hydrated, subtotal, setQuantity, remove } = useCart();

  if (!hydrated) {
    return (
      <div className="space-y-3" aria-busy>
        {[0, 1].map((i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-ivory-300 bg-white/60 px-6 py-16 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-ivory-200 text-plum-500">
          <ShoppingBag size={26} strokeWidth={1.75} />
        </span>
        <h2 className="mt-5 font-display text-2xl font-semibold text-plum-900">
          Your cart is empty
        </h2>
        <p className="mt-2 max-w-sm text-[0.9375rem] leading-relaxed text-ink-muted">
          Nothing here yet. Browse the catalogue, or tell us what you are looking
          for and we will source it.
        </p>
        <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link href="/products" className={buttonStyles({ size: "lg" })}>
            Browse gemstones
          </Link>
          <Link
            href="/contact"
            className={buttonStyles({ variant: "outline", size: "lg" })}
          >
            Request a stone
          </Link>
        </div>
      </div>
    );
  }

  // shippingFor logic can be implemented here based on settings
  const shipping = subtotal > settings.freeShippingThreshold ? 0 : settings.flatShippingFee;
  const toFreeShipping = settings.freeShippingThreshold - subtotal;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-10">
      <ul className="space-y-3">
        {lines.map((line) => (
          <li
            key={line.productId}
            className="flex gap-3 rounded-2xl border border-ivory-300 bg-white p-3 sm:gap-4 sm:p-4"
          >
            <Link
              href={`/products/${line.slug}`}
              className="shrink-0"
              aria-label={line.name}
            >
              <GemImage
                color={line.gemColor}
                className="size-20 rounded-xl sm:size-28"
              />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <h2 className="line-2 text-[0.875rem] leading-snug font-semibold text-plum-900 sm:text-base">
                  <Link href={`/products/${line.slug}`}>{line.name}</Link>
                </h2>
                <button
                  type="button"
                  onClick={() => remove(line.productId)}
                  aria-label={`Remove ${line.name} from cart`}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-plum-400 transition-colors hover:bg-danger-50 hover:text-danger-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <p className="mt-1 text-xs text-ink-muted tabular-nums">
                {formatINR(line.unitPrice)} each
              </p>

              <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                <div className="flex items-center rounded-full border border-plum-900/15">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(line.productId, line.quantity - 1)
                    }
                    disabled={line.quantity <= 1}
                    aria-label="Decrease quantity"
                    className="grid size-10 place-items-center rounded-full text-plum-700 hover:bg-ivory-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <Minus size={15} strokeWidth={2.5} />
                  </button>
                  <span className="w-7 text-center text-sm font-semibold tabular-nums">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(line.productId, line.quantity + 1)
                    }
                    aria-label="Increase quantity"
                    className="grid size-10 place-items-center rounded-full text-plum-700 hover:bg-ivory-200"
                  >
                    <Plus size={15} strokeWidth={2.5} />
                  </button>
                </div>

                <p className="text-base font-semibold text-plum-900 tabular-nums sm:text-lg">
                  {formatINR(line.unitPrice * line.quantity)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="mt-6 lg:sticky lg:top-28 lg:mt-0">
        <div className="rounded-2xl border border-ivory-300 bg-white p-5">
          <h2 className="font-display text-xl font-semibold text-plum-900">
            Order summary
          </h2>

          <dl className="mt-4 space-y-2.5 text-sm">
            <Row label="Subtotal" value={formatINR(subtotal)} />
            <Row
              label="Shipping"
              value={shipping === 0 ? "Free" : formatINR(shipping)}
              accent={shipping === 0}
            />
            <div className="flex justify-between border-t border-ivory-300 pt-3 text-base font-semibold text-plum-900">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatINR(subtotal + shipping)}</dd>
            </div>
          </dl>

          {toFreeShipping > 0 && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-gold-50 px-3.5 py-3 text-xs leading-relaxed text-gold-800">
              <Truck size={15} className="mt-px shrink-0" />
              Add {formatINR(toFreeShipping)} more for free insured shipping.
            </p>
          )}

          <ProceedToCheckoutButton />

          <Link
            href="/products"
            className={buttonStyles({
              variant: "ghost",
              size: "sm",
              full: true,
              className: "mt-2",
            })}
          >
            Continue shopping
          </Link>

          <p className="mt-4 text-center text-xs leading-relaxed text-ink-muted">
            Guest checkout — no account needed. GST invoice available for
            business purchases.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd
        className={
          accent
            ? "font-semibold text-emerald-700"
            : "font-medium text-plum-900 tabular-nums"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function ProceedToCheckoutButton() {
  const { sessionId } = useCart();
  const [isValidating, setIsValidating] = React.useState(false);
  const router = useRouter();

  const handleCheckout = async () => {
    setIsValidating(true);
    try {
      const res = await validateCart(sessionId);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      router.push("/checkout");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={isValidating}
      className={buttonStyles({ size: "lg", full: true, className: "mt-5" })}
    >
      <Lock size={16} />
      {isValidating ? "Validating..." : "Proceed to checkout"}
    </button>
  );
}
