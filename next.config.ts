import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
    ],
    // Serve WebP/AVIF by default, cache for 1 year
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
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

export default withSentryConfig(nextConfig, {
  // Suppress noisy build output
  silent: true,

  // Automatically tree-shake Sentry logger statements
  disableLogger: true,

  // Upload source maps only in CI / when SENTRY_AUTH_TOKEN is set
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
