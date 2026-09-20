"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  MapPin,
  User,
  ChevronRight,
} from "lucide-react";
import { SignOutButton } from "@/components/public/auth/sign-out-button";

interface AccountNavProps {
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

const navItems = [
  { name: "Dashboard", href: "/account/dashboard", icon: LayoutDashboard },
  { name: "Order History", href: "/account/orders", icon: Package },
  { name: "Saved Addresses", href: "/account/addresses", icon: MapPin },
  { name: "Profile Settings", href: "/account/profile", icon: User },
];

export default function AccountNav({ email, name, image }: AccountNavProps) {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === "/account/dashboard") {
      return (
        pathname === href ||
        pathname === "/account" ||
        pathname === "/dashboard"
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "C";

  return (
    <aside className="w-full md:w-72 shrink-0 space-y-4">
      {/* Mobile User Summary & Scrollable Nav */}
      <div className="block md:hidden bg-white rounded-2xl shadow-sm border border-plum-100 p-4">
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-plum-100">
          <div className="flex min-w-0 items-center gap-3">
            <div className="size-10 shrink-0 overflow-hidden rounded-xl bg-plum-900 text-gold-400 font-semibold flex items-center justify-center text-sm shadow-inner">
              {image ? (
                <Image
                  src={image}
                  alt={name || "Your profile"}
                  width={40}
                  height={40}
                  unoptimized
                  className="size-10 object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-plum-950 truncate">
                {name || "Customer Account"}
              </h2>
              <p className="text-xs text-plum-500 truncate">{email}</p>
            </div>
          </div>
          <SignOutButton
            iconOnly
            className="px-3 text-danger-600 hover:bg-danger-50"
          />
        </div>

        {/* Scrollable Pills for Mobile */}
        <nav className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
          {navItems.map((item) => {
            const active = isItemActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  active
                    ? "bg-plum-900 text-gold-400 shadow-sm"
                    : "bg-plum-50/70 text-plum-700 hover:bg-plum-100 hover:text-plum-900"
                }`}
              >
                <Icon
                  size={15}
                  className={active ? "text-gold-400" : "text-plum-500"}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Desktop Sidebar Card */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-plum-100 p-6">
        <div className="mb-6 pb-6 border-b border-plum-100 flex items-center gap-3.5">
          <div className="size-12 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-plum-900 to-plum-800 text-gold-400 font-display font-bold flex items-center justify-center text-lg shadow-md ring-2 ring-gold-400/20">
            {image ? (
              <Image
                src={image}
                alt={name || "Your profile"}
                width={48}
                height={48}
                unoptimized
                className="size-12 object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-display font-bold text-plum-950 truncate">
              {name || "My Account"}
            </h2>
            <p className="text-plum-500 text-xs mt-0.5 truncate">{email}</p>
          </div>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const active = isItemActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all group ${
                  active
                    ? "bg-plum-900 text-gold-400 font-semibold shadow-sm"
                    : "text-plum-700 hover:bg-plum-50 hover:text-gold-600 font-medium"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={`transition-colors ${
                      active
                        ? "text-gold-400"
                        : "text-plum-400 group-hover:text-gold-500"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                <ChevronRight
                  size={16}
                  className={`transition-all ${
                    active
                      ? "text-gold-400 opacity-100 translate-x-0"
                      : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 text-gold-500"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 pt-6 border-t border-plum-100">
          <SignOutButton className="w-full justify-start text-danger-600 hover:bg-danger-50" />
        </div>
      </div>
    </aside>
  );
}
