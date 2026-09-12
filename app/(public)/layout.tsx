import { BottomNav } from "@/components/public/layout/bottom-nav";
import { CartToast } from "@/components/public/cart/cart-toast";
import { SiteFooter } from "@/components/public/layout/site-footer";
import { SiteHeader } from "@/components/public/layout/site-header";
import { WhatsappFab } from "@/components/public/layout/whatsapp-fab";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 w-full overflow-x-hidden">{children}</main>
      <SiteFooter />

      {/* Clears the fixed mobile tab bar so the footer is fully scrollable to. */}
      <div aria-hidden className="pb-tabbar bg-plum-950 lg:hidden" />

      <BottomNav />
      <WhatsappFab />
      <CartToast />
    </>
  );
}
