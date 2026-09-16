"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  Image as ImageIcon,
  ShoppingCart,
  Users,
  CreditCard,
  Truck,
  RotateCcw,
  UserCheck,
  Calendar,
  BarChart3,
  Globe,
  Megaphone,
  FileSpreadsheet,
  BookOpen,
  FileText,
  PhoneCall,
  ShieldAlert,
  UserCog,
  List,
  Star,
  Settings as SettingsIcon,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Role = "SUPER_ADMIN" | "CONTENT_MANAGER" | "LEAD_MANAGER";

const hasAccess = (itemHref: string, role: string) => {
  if (role === "SUPER_ADMIN") return true;

  if (role === "LEAD_MANAGER") {
    if (itemHref === "/admin") return true;
    if (itemHref.startsWith("/admin/leads")) return true;
    if (itemHref.startsWith("/admin/customers")) return true;
    return false;
  }

  if (role === "CONTENT_MANAGER") {
    if (itemHref === "/admin") return true;
    if (
      itemHref.startsWith("/admin/categories") ||
      itemHref.startsWith("/admin/products") ||
      itemHref.startsWith("/admin/productvarients") ||
      itemHref.startsWith("/admin/inventory") ||
      itemHref.startsWith("/admin/website")
    ) {
      return true;
    }
    return false;
  }

  return false;
};

const sidebarGroups = [
  {
    title: "DASHBOARD",
    items: [{ name: "Overview", href: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "CATALOGUE",
    items: [
      { name: "Categories", href: "/admin/categories", icon: Layers },
      { name: "Products", href: "/admin/products", icon: Package },
      { name: "Product Variants", href: "/admin/productvarients", icon: List },
      { name: "Inventory", href: "/admin/inventory", icon: Boxes },
    ],
  },
  {
    title: "COMMERCE",
    items: [
      { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { name: "Customers", href: "/admin/customers", icon: Users },
      { name: "Payments", href: "/admin/payments", icon: CreditCard },
      { name: "Shipments", href: "/admin/shipments", icon: Truck },
      { name: "Returns", href: "/admin/returns", icon: RotateCcw },
    ],
  },
  {
    title: "LEAD MANAGEMENT",
    items: [
      { name: "Leads", href: "/admin/leads", icon: UserCheck },
      { name: "Follow-ups", href: "/admin/leads/follow-ups", icon: Calendar },
      { name: "Analytics", href: "/admin/leads/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "WEBSITE",
    items: [
      {
        name: "Hero Section",
        href: "/admin/website/hero-section",
        icon: Megaphone,
      },
    ],
  },

  {
    title: "SYSTEM & SETTINGS",
    items: [
      {
        name: "Company Settings",
        href: "/admin/settings/company",
        icon: SettingsIcon,
      },
      { name: "Audit Logs", href: "/admin/system/audit", icon: ShieldAlert },
      {
        name: "Users & Permissions",
        href: "/admin/system/users",
        icon: UserCog,
      },
    ],
  },
];

export default function Sidebar({
  isOpen,
  setIsOpen,
  onDark = false,
}: {
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  onDark?: boolean;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "SUPER_ADMIN";

  // Find the longest matching href across all sidebar items to handle nested routes properly
  const allItems = sidebarGroups.flatMap((g) => g.items);
  let bestMatch = "";
  let maxLength = 0;

  allItems.forEach((item) => {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      if (item.href.length > maxLength) {
        maxLength = item.href.length;
        bestMatch = item.href;
      }
    }
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-plum-950/70 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsOpen && setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-plum-950 text-ivory-100 flex flex-col h-full overflow-y-auto transition-transform duration-300 ease-in-out md:static md:translate-x-0 border-r border-plum-900 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="py-2 border-b border-plum-900 bg-ivory-50 flex items-center justify-center">
          <span className="relative flex gap-2 shrink-0 place-items-center">
            <Image
              src="/logo.png"
              alt="Chaya Jewellery Logo"
              width={1254}
              height={1254}
              className="object-contain w-12 h-12"
              priority
            />
            <span className="flex flex-col leading-none">
              <span
                className={cn(
                  "font-display text-base font-semibold tracking-tight sm:text-lg uppercase",
                  onDark ? "text-ivory-100" : "text-plum-900",
                )}
              >
                Chaya Jewellery
              </span>
              <span
                className={cn(
                  "mt-0.5 text-[0.5rem] font-semibold tracking-[0.2em] uppercase sm:text-[0.5625rem] sm:tracking-[0.22em]",
                  onDark ? "text-gold-400" : "text-gold-700",
                )}
              >
                Certified Jewellery
              </span>
            </span>
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-6">
          {sidebarGroups.map((group) => {
            const visibleItems = group.items.filter((item) =>
              hasAccess(item.href, userRole),
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title}>
                <h2 className="text-[0.75rem] font-semibold text-gold-300 uppercase tracking-[0.14em] mb-2 px-2">
                  {group.title}
                </h2>
                <ul className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive = item.href === bestMatch;
                    const Icon = item.icon;

                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                            isActive
                              ? "bg-plum-800 text-white font-semibold border-l-3 border-gold-400 shadow-xs"
                              : "text-plum-200 hover:bg-plum-900/70 hover:text-white border border-transparent"
                          }`}
                        >
                          <Icon
                            size={18}
                            className={`transition-colors duration-200 ${isActive ? "text-gold-400" : "text-plum-400 group-hover:text-plum-200"}`}
                          />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
