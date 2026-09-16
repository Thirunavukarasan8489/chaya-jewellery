"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LayoutDashboard, Package, MapPin, UserCog, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export function UserNav() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    // Show a placeholder while loading
    return (
      <div className="grid size-10 place-items-center rounded-none text-plum-300">
        <User size={20} strokeWidth={2} />
      </div>
    );
  }

  const isCustomer = (session?.user as any)?.role === "CUSTOMER";

  if (!session || !isCustomer) {
    // Unauthenticated or not a customer: Direct link to login
    return (
      <Link
        href="/login"
        aria-label="Sign In"
        className="grid size-10 place-items-center rounded-none text-plum-800 transition-colors hover:bg-plum-900/6"
      >
        <User size={20} strokeWidth={2} />
      </Link>
    );
  }

  // Authenticated as Customer: Dropdown Menu
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User Account Menu"
        aria-expanded={isOpen}
        className={`grid size-10 place-items-center rounded-none transition-colors ${
          isOpen ? "bg-plum-900/10 text-plum-950" : "text-plum-800 hover:bg-plum-900/6"
        }`}
      >
        <User size={20} strokeWidth={2} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
          <div className="px-4 py-2 border-b border-plum-50">
            <p className="text-sm font-medium text-plum-900 truncate">
              {session.user?.name || "My Account"}
            </p>
          </div>
          <div className="py-1">
            <Link
              href="/account/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-plum-700 hover:bg-plum-50 hover:text-plum-900 transition-colors"
            >
              <LayoutDashboard size={16} strokeWidth={2} />
              Dashboard
            </Link>
            <Link
              href="/account/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-plum-700 hover:bg-plum-50 hover:text-plum-900 transition-colors"
            >
              <Package size={16} strokeWidth={2} />
              Orders
            </Link>
            <Link
              href="/account/addresses"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-plum-700 hover:bg-plum-50 hover:text-plum-900 transition-colors"
            >
              <MapPin size={16} strokeWidth={2} />
              Addresses
            </Link>
            <Link
              href="/account/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-plum-700 hover:bg-plum-50 hover:text-plum-900 transition-colors"
            >
              <UserCog size={16} strokeWidth={2} />
              Profile Settings
            </Link>
          </div>
          <div className="border-t border-plum-50 py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="flex w-full items-center gap-2 text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} strokeWidth={2} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
