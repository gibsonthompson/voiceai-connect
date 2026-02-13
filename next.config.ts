import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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