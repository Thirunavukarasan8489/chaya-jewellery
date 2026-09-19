"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LayoutDashboard, Package, MapPin, UserCog, LogOut, ShieldCheck } from "lucide-react";
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

  if (!session) {
    // Unauthenticated: Direct link to login
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

  const role = (session.user as any)?.role;
  const isAdmin = role && role !== "CUSTOMER";

  // Authenticated (Customer or Admin): Smart Dropdown Menu
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User Account Menu"
        aria-expanded={isOpen}
        className={`relative grid size-10 place-items-center rounded-none transition-colors ${
          isOpen ? "bg-plum-900/10 text-plum-950" : "text-plum-800 hover:bg-plum-900/6"
        }`}
      >
        <User size={20} strokeWidth={2} />
        {isAdmin && (
          <span className="absolute top-2 right-2 size-2 rounded-full bg-gold-500 ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl bg-white py-1 shadow-xl ring-1 ring-black/5 focus:outline-none z-50 border border-plum-100/80 divide-y divide-plum-50">
          {/* Header */}
          <div className="px-4 py-3 bg-plum-50/40 rounded-t-2xl">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-plum-950 truncate">
                {session.user?.name || (isAdmin ? "Administrator" : "My Account")}
              </p>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-100 text-gold-800 border border-gold-300 shrink-0 uppercase tracking-wider">
                  <ShieldCheck size={11} className="text-gold-600" />
                  Admin
                </span>
              )}
            </div>
            {session.user?.email && (
              <p className="text-xs text-plum-500 truncate mt-0.5">{session.user.email}</p>
            )}
          </div>

          {/* Navigation Links */}
          <div className="py-1.5">
            {isAdmin ? (
              <>
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-plum-800 hover:bg-plum-50 hover:text-plum-950 transition-colors"
                >
                  <LayoutDashboard size={16} strokeWidth={2} className="text-gold-600" />
                  Admin Dashboard
                </Link>
                <Link
                  href="/admin/orders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-plum-800 hover:bg-plum-50 hover:text-plum-950 transition-colors"
                >
                  <Package size={16} strokeWidth={2} className="text-plum-500" />
                  Manage Orders
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/account/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-plum-700 hover:bg-plum-50 hover:text-plum-900 transition-colors"
                >
                  <LayoutDashboard size={16} strokeWidth={2} className="text-gold-600" />
                  Dashboard
                </Link>
                <Link
                  href="/account/orders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-plum-700 hover:bg-plum-50 hover:text-plum-900 transition-colors"
                >
                  <Package size={16} strokeWidth={2} className="text-plum-500" />
                  Orders
                </Link>
                <Link
                  href="/account/addresses"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-plum-700 hover:bg-plum-50 hover:text-plum-900 transition-colors"
                >
                  <MapPin size={16} strokeWidth={2} className="text-plum-500" />
                  Addresses
                </Link>
                <Link
                  href="/account/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-plum-700 hover:bg-plum-50 hover:text-plum-900 transition-colors"
                >
                  <UserCog size={16} strokeWidth={2} className="text-plum-500" />
                  Profile Settings
                </Link>
              </>
            )}
          </div>

          {/* Footer Action */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="flex w-full items-center gap-2.5 text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} strokeWidth={2} />
              Sign Out
            </button>
            {isAdmin && (
              <p className="px-4 pb-1 text-[11px] text-plum-400">
                Sign out to log in as a customer
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
