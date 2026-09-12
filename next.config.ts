import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
