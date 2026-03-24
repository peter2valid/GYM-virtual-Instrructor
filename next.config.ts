import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" }, // private R2 endpoint
      { protocol: "https", hostname: "**.r2.dev" },                   // public R2 CDN
    ],
    // Serve WebP/AVIF by default, cache for 1 year
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    // GIFs must bypass next/image optimization (it can't compress animated GIFs)
    unoptimized: false,
  },
  // Long-lived cache for immutable static assets
  async headers() {
    return [
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
