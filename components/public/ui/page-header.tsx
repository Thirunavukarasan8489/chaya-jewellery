import Link from "next/link";
import { ChevronRight, SearchX } from "lucide-react";
import { OrnamentalBg } from "@/components/public/ui/ornamental-bg";
import { BackButton } from "@/components/public/ui/back-button";
import { cn } from "@/lib/utils";

export function Breadcrumbs({
  items,
  onDark = false,
}: {
  items: { label: string; href?: string }[];
  onDark?: boolean;
}) {
  return (
    <nav aria-label="Breadcrumb">
      <ol
        className={cn(
          "no-scrollbar flex items-center gap-1 overflow-x-auto text-xs whitespace-nowrap",
          onDark ? "text-plum-300" : "text-ink-muted",
        )}
      >
        <li>
          <Link
            href="/"
            className={cn(
              "underline-offset-4 hover:underline",
              onDark ? "hover:text-gold-300" : "hover:text-plum-900",
            )}
          >
            Home
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1">
            <ChevronRight size={13} className="shrink-0 opacity-50" />
            {item.href && i < items.length - 1 ? (
              <Link
                href={item.href}
                className={cn(
                  "underline-offset-4 hover:underline",
                  onDark ? "hover:text-gold-300" : "hover:text-plum-900",
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current="page"
                className={cn(
                  "font-medium",
                  onDark ? "text-ivory-100" : "text-plum-900",
                )}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({
  eyebrow,
  title,
  body,
  breadcrumbs,
  showBack = true,
  backHref = "/",
  backLabel = "Back",
  children,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  breadcrumbs?: { label: string; href?: string }[];
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-plum-950 text-ivory-100">
      <OrnamentalBg glowPosition="15% 0%" />
      <div className="shell gutter relative py-8 sm:py-12 lg:py-14">
        {(showBack || breadcrumbs) && (
          <div className="flex items-center gap-3 flex-wrap mb-4">
            {showBack && (
              <BackButton onDark fallbackHref={backHref} label={backLabel} />
            )}
            {showBack && breadcrumbs && (
              <div className="h-3.5 w-px bg-plum-700/60 hidden sm:block" />
            )}
            {breadcrumbs && <Breadcrumbs items={breadcrumbs} onDark />}
          </div>
        )}
        {eyebrow && (
          <p className="mt-2 text-[0.6875rem] font-semibold tracking-[0.18em] uppercase">
            <span className="text-foil">{eyebrow}</span>
          </p>
        )}
        <h1 className="mt-2 text-[2rem] leading-[1.1] font-semibold sm:text-5xl">
          {title}
        </h1>
        {body && (
          <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-plum-200">
            {body}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-ivory-300 bg-white/60 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-none bg-ivory-200 text-plum-500">
        <SearchX size={22} />
      </span>
      <h2 className="mt-4 font-display text-xl font-semibold text-plum-900">
        {title}
      </h2>
      <p className="mt-2 max-w-sm text-[0.9375rem] leading-relaxed text-ink-muted">
        {body}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
