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
      // Legacy /get-started URL. The canonical wizard entry point is /signup.
      // /signup/plan and /signup/success are sibling routes in the same
      // directory. Embed.js (current version) loads /signup directly and
      // skips this redirect. Older embed.js files cached on agency
      // marketing sites still reference /get-started; this rule routes
      // them to the canonical path with all query params preserved
      // (embed=true, agency, parent_origin, etc).
      //
      // The :path* rule below is defensive. No sub-paths currently exist
      // under /get-started, but if anyone ever links to /get-started/foo
      // by accident or in a future regression, it'll still resolve.
      {
        source: "/get-started",
        destination: "/signup",
        permanent: true,
      },
      {
        source: "/get-started/:path*",
        destination: "/signup/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;