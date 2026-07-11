import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
    proxyClientMaxBodySize: "500mb",
  },
  async rewrites() {
    return [
      {
        source: "/images/:path*",
        destination: "/api/uploads/:path*",
      },
      {
        source: "/videos/:path*",
        destination: "/api/videos/:path*",
      },
    ];
  },
};

export default nextConfig;
