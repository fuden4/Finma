import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: appRoot,
  },
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
