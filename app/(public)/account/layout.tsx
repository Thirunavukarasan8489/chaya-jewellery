import { ReactNode } from "react";
import Link from "next/link";
import { LogOut, LayoutDashboard, Package, MapPin, User, ChevronRight } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/public/layout/signout-button";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const navItems = [
    { name: "Dashboard", href: "/account/dashboard", icon: LayoutDashboard },
    { name: "Order History", href: "/account/orders", icon: Package },
    { name: "Saved Addresses", href: "/account/addresses", icon: MapPin },
    { name: "Profile Settings", href: "/account/profile", icon: User },
  ];

  return (
    <div className="bg-plum-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <aside className="w-full md:w-72 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-plum-100 p-6">
            <div className="mb-6 pb-6 border-b border-plum-100">
              <h2 className="text-xl font-display font-bold text-plum-900">My Account</h2>
              <p className="text-plum-500 text-sm mt-1 truncate">{session.user?.email}</p>
            </div>
            
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-plum-700 hover:bg-plum-50 hover:text-gold-600 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="text-plum-400 group-hover:text-gold-500 transition-colors" />
                    {item.name}
                  </div>
                  <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-gold-500" />
                </Link>
              ))}
            </nav>

            <div className="mt-8 pt-6 border-t border-plum-100">
              <SignOutButton />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1">
          {children}
        </main>
        
      </div>
    </div>
  );
}
