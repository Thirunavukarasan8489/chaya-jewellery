"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, NAV_DATA } from "@/lib/utils";

export function PrimaryNav() {
  const { primaryNav } = NAV_DATA;
  const pathname = usePathname();

  return (
    <nav className="hidden flex-1 justify-center lg:flex" suppressHydrationWarning>
      <ul className="flex items-center gap-1" suppressHydrationWarning>
        {primaryNav.map((item: any) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href} suppressHydrationWarning>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-plum-900/8 text-plum-950"
                    : "text-plum-800 hover:bg-plum-900/6 hover:text-plum-950",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
