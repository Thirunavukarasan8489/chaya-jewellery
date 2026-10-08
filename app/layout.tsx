import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  Hind,
  Noto_Sans_Devanagari,
} from "next/font/google";
import { CartProvider } from "@/components/public/cart/cart-provider";
import AuthProvider from "@/components/shared/AuthProvider";
import { Toaster } from "react-hot-toast";
import "./globals.css";

// Display face for headings — tall, engraved-catalogue serif.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// UI face — Hind is a Latin/Devanagari sibling pair from Ek Type, designed
// for Indian use, so it pairs naturally with the Hindi accent words below.
const hind = Hind({
  variable: "--font-hind",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// A handful of short Hindi accent words throughout the UI (rashi names, small
// badges) — the Devanagari subset, not the full Noto character set.
const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  weight: ["500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chaya-jewellery.vercel.app/"),
  title: {
    default: "Chaya Jewellery — Certified Jewellery",
    template: "%s · Chaya Jewellery",
  },
  description:
    "Natural, independently certified Jewellery sourced at origin. Ruby, blue sapphire, yellow sapphire, emerald, pearl and coral with GIA, IGI and GRS reports. Free gemmologist consultation.",
  keywords: [
    "Certified Jewellery",
    "Bracelet",
    "Earrings",
    "Necklace",
    "Rings",
  ],
  openGraph: {
    type: "website",
    siteName: "Chaya Jewellery",
    locale: "en_IN",
    title: "Chaya Jewellery — Certified Natural Jewellery",
    description:
      "Natural, independently certified jewellery sourced at origin. Treatments always disclosed.",
    images: [
      {
        url: "/og-image.jpg", // Fallback generic image
        width: 1200,
        height: 630,
        alt: "Chaya Jewellery - Premium Certified Jewellery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chaya Jewellery — Certified Natural Jewellery",
    description:
      "Natural, independently certified Jewellery sourced at origin. Treatments always disclosed.",
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#16001d",
};

import { GoogleAnalytics } from "@/components/shared/analytics";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IN"
      className={`${cormorant.variable} ${hind.variable} ${notoDevanagari.variable} h-full overflow-x-hidden antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden">
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
