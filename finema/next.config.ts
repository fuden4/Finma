import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
  async rewrites() {
    return [
      {
        source: "/images/:path*",
        destination: "/api/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
