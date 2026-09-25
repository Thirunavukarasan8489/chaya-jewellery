"use client";

import * as React from "react";
import type { CartLine, Product } from "@/lib/types";
import { syncCart } from "@/lib/actions/cart.actions";

const STORAGE_KEY = "chayajewellery.cart.v1";

type CartContextValue = {
  lines: CartLine[];
  /** False during SSR and the hydration render, so both agree on empty UI. */
  hydrated: boolean;
  count: number;
  subtotal: number;
  add: (
    product: Product,
    quantity?: number,
    variantName?: string,
    variantPrice?: number,
    variantId?: string,
    sku?: string,
  ) => void;
  setQuantity: (
    productId: string,
    quantity: number,
    variantId?: string,
  ) => void;
  remove: (productId: string, variantId?: string) => void;
  clear: () => void;
  lastAdded: CartLine | null;
  dismissLastAdded: () => void;
  sessionId: string;
};

const CartContext = React.createContext<CartContextValue | null>(null);

function readStoredLines(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    // Corrupt or unavailable storage: start with an empty cart.
    return [];
  }
}

/**
 * `hydrated` flips to true only after React has finished hydrating, without an
 * effect: getServerSnapshot feeds both SSR and the hydration render, so the
 * first client paint provably matches the server HTML even though `lines` was
 * already restored from localStorage by the state initialiser below.
 */
const noopSubscribe = () => () => {};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const hydrated = React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const [lines, setLines] = React.useState<CartLine[]>(readStoredLines);
  const [lastAdded, setLastAdded] = React.useState<CartLine | null>(null);
  const [sessionId, setSessionId] = React.useState<string>("");

  React.useEffect(() => {
    if (!hydrated) return;

    let sid = window.localStorage.getItem("chayajewellery.cart.sessionId");
    if (!sid) {
      sid = crypto.randomUUID();
      window.localStorage.setItem("chayajewellery.cart.sessionId", sid);
    }
    const timeoutId = setTimeout(() => {
      setSessionId(sid);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [hydrated]);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Private mode / quota exceeded
    }

    // Sync with backend
    if (sessionId) {
      const timeoutId = setTimeout(() => {
        syncCart(sessionId, lines).catch(console.error);
      }, 500); // debounce 500ms
      return () => clearTimeout(timeoutId);
    }
  }, [lines, hydrated, sessionId]);

  const add = React.useCallback(
    (
      product: Product,
      quantity = 1,
      variantName?: string,
      variantPrice?: number,
      variantId?: string,
      sku?: string,
    ) => {
      const line: CartLine = {
        productId: product.id,
        variantId,
        sku,
        slug: product.slug,
        name: product.name,
        image: product.primaryImage?.url,
        gemColor: product.gemColor,
        unitPrice: variantPrice ?? product.sellingPrice,
        quantity,
        variantName,
      };

      setLines((current) => {
        const existing = current.find(
          (l) => l.productId === product.id && l.variantId === variantId,
        );
        if (!existing) return [...current, line];
        return current.map((l) =>
          l.productId === product.id && l.variantId === variantId
            ? { ...l, quantity: l.quantity + quantity }
            : l,
        );
      });
      setLastAdded(line);
    },
    [],
  );

  // Two different variants of the same product share a productId, so the
  // line identity must be productId+variantId — matching on productId alone
  // let adjusting/removing one variant's line silently affect every other
  // variant of that product sitting in the cart too (and produced duplicate
  // React keys in cart-view.tsx when both were present).
  const setQuantity = React.useCallback(
    (productId: string, quantity: number, variantId?: string) => {
      setLines((current) =>
        quantity <= 0
          ? current.filter(
              (l) => !(l.productId === productId && l.variantId === variantId),
            )
          : current.map((l) =>
              l.productId === productId && l.variantId === variantId
                ? { ...l, quantity }
                : l,
            ),
      );
    },
    [],
  );

  const remove = React.useCallback((productId: string, variantId?: string) => {
    setLines((current) =>
      current.filter(
        (l) => !(l.productId === productId && l.variantId === variantId),
      ),
    );
  }, []);

  const clear = React.useCallback(() => setLines([]), []);
  const dismissLastAdded = React.useCallback(() => setLastAdded(null), []);

  const value = React.useMemo<CartContextValue>(
    () => ({
      lines,
      hydrated,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: lines.reduce((n, l) => {
        return n + l.unitPrice * l.quantity;
      }, 0),
      add,
      setQuantity,
      remove,
      clear,
      lastAdded,
      dismissLastAdded,
      sessionId,
    }),
    [
      lines,
      hydrated,
      add,
      setQuantity,
      remove,
      clear,
      lastAdded,
      dismissLastAdded,
      sessionId,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
