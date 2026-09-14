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
      {/* No overflow-x-hidden here (unlike a previous version of this file):
          per the CSS overflow spec, setting overflow-x to anything but
          `visible` forces the computed overflow-y to `auto` too — even if
          overflow-y is explicitly authored as `visible` — so <main> became
          its own scroll container, redundant with the page's normal body
          scroll and nested one level in, felt on mobile as a janky "inner"
          vertical scroll region right under the hero at the top of every
          public page. `html`/`body` already set overflow-x: hidden
          site-wide (app/globals.css), so this class was redundant for
          horizontal clipping anyway. Same root cause as the hero/rail
          scroll-snap fix in components/public/home/hero-slider.tsx — see
          AGENTS.md's 2026-09-13 scrollbar entry. Don't re-add overflow-x
          here without also setting overflow-y-hidden alongside it. */}
      <main className="flex-1 w-full">{children}</main>
      <SiteFooter />

      {/* Clears the fixed mobile tab bar so the footer is fully scrollable to. */}
      <div aria-hidden className="pb-tabbar bg-plum-950 lg:hidden" />

      <BottomNav />
      <WhatsappFab />
      <CartToast />
    </>
  );
}
