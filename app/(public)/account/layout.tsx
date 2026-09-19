import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import AccountNav from "@/components/public/account/account-nav";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="bg-plum-50/50 min-h-screen py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Responsive Sidebar Navigation */}
        <AccountNav email={session.user?.email} name={session.user?.name} />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
