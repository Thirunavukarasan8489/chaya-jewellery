"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn, NAV_DATA } from "@/lib/utils";
import { MegaMenu } from "@/components/public/layout/mega-menu";
import type { MegaMenuData } from "@/lib/services/category-service";

interface PrimaryNavProps {
  megaMenuData?: MegaMenuData;
}

export function PrimaryNav({ megaMenuData }: PrimaryNavProps) {
  const { primaryNav } = NAV_DATA;
  const pathname = usePathname();
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setMegaMenuOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setMegaMenuOpen(false);
    }, 150);
  };

  return (
    <nav
      className="hidden flex-1 justify-center lg:flex"
      suppressHydrationWarning
    >
      <ul className="flex items-center gap-1" suppressHydrationWarning>
        {primaryNav.map((item: any) => {
          const isAllProducts = item.href === "/products";
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          if (isAllProducts && megaMenuData) {
            return (
              <li
                key={item.href}
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                suppressHydrationWarning
              >
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-none px-3.5 py-2 text-sm font-medium transition-colors",
                    active || megaMenuOpen
                      ? "bg-plum-900/8 text-plum-950"
                      : "text-plum-800 hover:bg-plum-900/6 hover:text-plum-950",
                  )}
                >
                  <span>{item.label}</span>
                  <ChevronDown
                    size={14}
                    className={cn(
                      "text-gold-600 transition-transform duration-200",
                      megaMenuOpen && "rotate-180 text-gold-700"
                    )}
                  />
                </Link>

                {megaMenuOpen && (
                  <MegaMenu
                    data={megaMenuData}
                    onClose={() => setMegaMenuOpen(false)}
                  />
                )}
              </li>
            );
          }

          return (
            <li key={item.href} suppressHydrationWarning>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-none px-3.5 py-2 text-sm font-medium transition-colors",
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
