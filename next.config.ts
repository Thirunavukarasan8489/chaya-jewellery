import type { NextConfig } from "next";

// SECURITY: the app had no security headers at all — no CSP, no
// X-Frame-Options, no HSTS, no Referrer-Policy — on any response. This is
// the one CSP allowlist covering every third party this app actually loads
// client-side today: Razorpay's checkout widget (script + its own
// frame/API calls), Google Analytics (gtag.js), and Cloudinary product
// images. next/font (used for all site typefaces) self-hosts at build
// time, so no Google Fonts domains are needed here. If a new third-party
// script/embed is added later, it needs a matching entry here too, or CSP
// will silently block it.
// Turbopack/React dev mode calls eval() for HMR and dev-only debugging
// (component stack reconstruction) — blocking it broke `npm run dev`
// entirely. Production React never calls eval(), so 'unsafe-eval' is
// scoped to development only, keeping the production CSP tighter.
const isDev = process.env.NODE_ENV !== 'production';

const csp = [
  "default-src 'self'",
  // 'unsafe-inline' is needed for Next.js's own inline bootstrap scripts
  // and Google's inline gtag config snippet; a nonce-based CSP would be
  // stricter but is a larger, separate change to how pages are rendered.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://checkout.razorpay.com https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  // blob: is required for client-side file previews (URL.createObjectURL)
  // in the admin media-upload forms (hero banners, product images, etc.) —
  // the browser blocks rendering a blob: <img> without it, showing a
  // broken-image icon even though the file itself uploads fine.
  "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://*.razorpay.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://checkout.razorpay.com https://www.google-analytics.com https://analytics.google.com",
  "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // frame-ancestors above is the modern equivalent; X-Frame-Options stays
  // as a fallback for older browsers that don't honor CSP frame-ancestors.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

  // Default position is bottom-left, which sits directly on top of our fixed
  // mobile bottom tab bar's Home tab, hiding it during `next dev`. This is a
  // dev-only overlay (never present in a production build), so disabling it
  // trades a diagnostic badge for a bottom nav that's actually visible.
  devIndicators: false,

  // Compress responses with gzip
  compress: true,

  // Configure remote patterns for next/image
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
