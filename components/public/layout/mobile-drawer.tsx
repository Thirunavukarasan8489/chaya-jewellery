"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Menu,
  MessageCircle,
  Phone,
  X,
  User,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";
import { Logo } from "@/components/public/layout/logo";
import { buttonStyles } from "@/components/public/ui/button";
import {
  categoryTerms,
  gemColorFor,
  NAV_DATA,
  whatsappLink,
} from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";

function AuthLinksMobile({ close }: { close: () => void }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="text-sm text-plum-400">Loading...</div>;
  }

  if (!session) {
    return (
      <Link
        href="/login"
        onClick={close}
        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-plum-800 hover:bg-plum-900/6"
      >
        <User size={18} />
        Sign In / Register
      </Link>
    );
  }

  const role = (session?.user as any)?.role;
  const isAdmin = role && role !== "CUSTOMER";

  if (isAdmin) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-3 py-2 bg-plum-50/60 rounded-xl border border-plum-100">
          <div className="min-w-0">
            <p className="text-xs font-bold text-plum-950 truncate">
              {session.user?.name || "Administrator"}
            </p>
            <p className="text-[11px] text-plum-500 truncate">
              {session.user?.email}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-100 text-gold-800 border border-gold-300 shrink-0 uppercase tracking-wider">
            <ShieldCheck size={10} className="text-gold-600" />
            Admin
          </span>
        </div>
        <ul className="space-y-1">
          <li>
            <Link
              href="/admin"
              onClick={close}
              className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-plum-800 hover:bg-plum-900/6 rounded-xl"
            >
              <LayoutDashboard size={16} className="text-gold-600" />
              Admin Dashboard
            </Link>
          </li>
          <li>
            <button
              onClick={() => {
                close();
                signOut({ callbackUrl: "/" });
              }}
              className="block w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl"
            >
              Sign Out
            </button>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      <li>
        <Link
          href="/account/dashboard"
          onClick={close}
          className="block px-3 py-2 text-sm font-medium text-plum-800 hover:bg-plum-900/6 rounded-xl"
        >
          Dashboard
        </Link>
      </li>
      <li>
        <Link
          href="/account/orders"
          onClick={close}
          className="block px-3 py-2 text-sm font-medium text-plum-800 hover:bg-plum-900/6 rounded-xl"
        >
          Orders
        </Link>
      </li>
      <li>
        <Link
          href="/account/addresses"
          onClick={close}
          className="block px-3 py-2 text-sm font-medium text-plum-800 hover:bg-plum-900/6 rounded-xl"
        >
          Saved Addresses
        </Link>
      </li>
      <li>
        <Link
          href="/account/profile"
          onClick={close}
          className="block px-3 py-2 text-sm font-medium text-plum-800 hover:bg-plum-900/6 rounded-xl"
        >
          Profile Settings
        </Link>
      </li>
      <li>
        <button
          onClick={() => {
            close();
            signOut({ callbackUrl: "/" });
          }}
          className="block w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl"
        >
          Sign Out
        </button>
      </li>
    </ul>
  );
}

export function MobileDrawer({ categories }: { categories: any[] }) {
  const { business, primaryNav, secondaryNav } = NAV_DATA;
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Close on route change so the drawer never survives a navigation. Adjusted
  // during render rather than in an effect, so the drawer is already gone on
  // the first frame of the new route instead of flashing for one paint.
  const [renderedPath, setRenderedPath] = React.useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setOpen(false);
  }

  React.useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);

    // Lock the page behind the drawer without losing scroll position.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="grid size-10 shrink-0 place-items-center rounded-none text-plum-800 transition-colors hover:bg-plum-900/6 lg:hidden"
      >
        <Menu size={22} strokeWidth={2} />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[100] lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="absolute inset-0 animate-[rise_.2s_ease-out_both] bg-plum-950/55 backdrop-blur-sm"
            />

            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              tabIndex={-1}
              className="absolute inset-y-0 left-0 flex h-full w-[86%] max-w-sm translate-x-0 flex-col bg-ivory-100 shadow-2xl outline-none"
              style={{ animation: "drawer-in .3s var(--ease-out-soft) both" }}
            >
              <div className="flex items-center justify-between border-b border-ivory-300 px-4 py-3">
                <Logo />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="grid size-10 place-items-center rounded-none text-plum-700 hover:bg-plum-900/6"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">
                <p className="mb-3 flex items-center gap-1.5 text-[0.625rem] font-semibold tracking-[0.18em] text-gold-700 uppercase">
                  Shop by stone
                  <span className="font-devanagari font-normal tracking-normal normal-case text-gold-600">
                    · रत्न
                  </span>
                </p>
                <ul className="mb-7 grid grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const terms = categoryTerms(cat.name);
                    const color = cat.gemColor || gemColorFor(cat.slug);
                    return (
                      <li key={cat.slug}>
                        <Link
                          href={`/products?category=${cat.slug}`}
                          className="flex h-full items-center gap-2.5 rounded-xl border border-ivory-300 bg-white p-3 text-[0.8125rem] leading-tight font-medium text-plum-800 active:scale-[0.98]"
                        >
                          <span
                            aria-hidden
                            className="size-6 shrink-0 rotate-45 rounded-none"
                            style={{
                              background: `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 45%, #16001d))`,
                            }}
                          />
                          <span>
                            {terms.primary}
                            {terms.secondary && (
                              <span className="block text-[0.6875rem] font-normal text-ink-muted">
                                {terms.secondary}
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                <ul className="mb-7 space-y-0.5">
                  {primaryNav.map((item: any) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="flex items-center justify-between rounded-xl px-3 py-3.5 font-display text-xl font-medium text-plum-900 active:bg-plum-900/5"
                      >
                        {item.label}
                        <ArrowRight size={17} className="text-plum-300" />
                      </Link>
                    </li>
                  ))}
                </ul>

                <ul className="flex flex-wrap gap-x-5 gap-y-2 border-t border-ivory-300 pt-5 mb-5">
                  {secondaryNav.map((item: any) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-sm text-ink-muted underline-offset-4 hover:text-plum-900 hover:underline"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Auth Links */}
                <div className="border-t border-ivory-300 pt-5">
                  <p className="mb-3 text-[0.625rem] font-semibold tracking-[0.18em] text-plum-500 uppercase">
                    My Account
                  </p>
                  <AuthLinksMobile close={() => setOpen(false)} />
                </div>
              </nav>

              <div className="safe-b border-t border-ivory-300 bg-white px-4 py-4">
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={business.phoneHref}
                    className={buttonStyles({ variant: "outline", size: "sm" })}
                  >
                    <Phone size={16} />
                    Call us
                  </a>
                  <a
                    href={whatsappLink(
                      business,
                      "Hi Chaya Jewellery, I have a question.",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonStyles({
                      variant: "whatsapp",
                      size: "sm",
                    })}
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </a>
                </div>
                <p className="mt-3 text-center text-xs text-ink-muted">
                  {business.hours}
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <style>{`
        @keyframes drawer-in {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
