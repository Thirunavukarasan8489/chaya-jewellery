import AccountLayout from "@/app/(public)/account/layout";
import AccountDashboardPage from "@/app/(public)/account/dashboard/page";

// Keep the existing customer dashboard and all its order/profile relationships.
// Both the layout and page check the server session before displaying data.
export default function DashboardPage() {
  return (
    <AccountLayout>
      <AccountDashboardPage />
    </AccountLayout>
  );
}
