import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disable aggressive Router Cache that causes stale pages on client-side navigation.
    // Without this, Next.js caches RSC payloads from prefetched routes and reuses them,
    // which can result in URL changing but page content not updating (the double-click bug).
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  async redirects() {
    return [
      {
        source: "/get-started",
        destination: "/signup",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;