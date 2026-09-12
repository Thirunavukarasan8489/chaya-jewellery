"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gem, Home, MessageCircle, Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/public/cart/cart-provider";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/products", label: "Shop", icon: Gem },
  { href: "/search", label: "Search", icon: Search },
  { href: "/contact", label: "Enquire", icon: MessageCircle },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
];

/**
 * Thumb-reachable primary floating navigation dock.
 * Features a high-performance smooth sliding active tab indicator with spring physics and full route matching.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { count, hydrated } = useCart();

  const isTabActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    if (href === "/products") {
      return (
        pathname === "/products" ||
        pathname.startsWith("/products/")
      );
    }
    if (href === "/cart") {
      return (
        pathname === "/cart" ||
        pathname.startsWith("/cart/") ||
        pathname.startsWith("/checkout")
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const activeIndex = tabs.findIndex(({ href, exact }) =>
    isTabActive(href, exact)
  );
  const safeIndex = activeIndex !== -1 ? activeIndex : 0;

  return (
    <nav
      aria-label="Primary Mobile Navigation"
      className="fixed bottom-[calc(0.625rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-1.5rem)] max-w-md lg:hidden"
      suppressHydrationWarning
    >
      <div className="relative rounded-full border border-gold-500/30 bg-plum-950/92 p-1.5 shadow-[0_10px_35px_-5px_rgba(19,11,27,0.75)] backdrop-blur-xl ring-1 ring-white/10" suppressHydrationWarning>
        {/* Ambient Subtle Gold Glow Ring */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-0.5 rounded-full bg-gradient-to-r from-gold-500/20 via-gold-400/30 to-gold-600/20 opacity-75 blur-sm"
        />

        <ul className="relative grid grid-cols-5 items-center" suppressHydrationWarning>
          {/* Smooth Sliding Gold Active Pill Indicator */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-[20%] p-0.5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{
              transform: `translateX(${safeIndex * 100}%)`,
            }}
          >
            <div className="h-full w-full rounded-full bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 shadow-[0_2px_14px_rgba(201,154,38,0.6)]" />
          </div>

          {tabs.map(({ href, label, icon: Icon, exact }) => {
            const active = isTabActive(href, exact);

            return (
              <li key={href} className="relative z-10" suppressHydrationWarning>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex flex-col items-center justify-center rounded-full py-2 px-1 text-[0.625rem] font-medium tracking-wide transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95",
                    active
                      ? "text-plum-950 font-bold"
                      : "text-plum-200 hover:text-gold-200"
                  )}
                >
                  <span className="relative z-10 flex flex-col items-center gap-0.5">
                    <span className="relative">
                      <Icon
                        size={19}
                        strokeWidth={active ? 2.5 : 1.9}
                        className={cn(
                          "transition-transform duration-300",
                          active
                            ? "scale-110 -translate-y-0.5 text-plum-950"
                            : "group-hover:scale-110 group-hover:text-gold-300 text-plum-200"
                        )}
                      />
                      {href === "/cart" && hydrated && count > 0 && (
                        <span
                          className={cn(
                            "absolute -top-1.5 -right-2.5 grid min-w-4.5 h-4.5 place-items-center rounded-full px-1 text-[0.5625rem] font-bold tabular-nums shadow-sm transition-all duration-300",
                            active
                              ? "bg-plum-950 text-gold-300 ring-1 ring-gold-400"
                              : "bg-gold-400 text-plum-950 ring-2 ring-plum-950 animate-pulse"
                          )}
                        >
                          {count > 9 ? "9+" : count}
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "leading-none transition-colors duration-200",
                        active ? "text-plum-950" : "text-plum-200"
                      )}
                    >
                      {label}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
