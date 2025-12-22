import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "connect.hsannu.com" },
      { protocol: "http", hostname: "connect.hsannu.com" },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  webpack: (config) => {
    config.externals = [...config.externals, { canvas: "canvas" }]; // Required for PDF.js canvas
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api/documents/static",
        destination: "https://connect.hsannu.com/api/documents/static",
      },
      {
        source: "/api/documents/:path*",
        destination: "https://connect.hsannu.com/api/documents/:path*",
      },
      {
        source: "/api/document-files/:path*",
        destination: "https://connect.hsannu.com/api/document-files/:path*",
      },
      {
        source: "/document-files/:path*",
        destination: "https://connect.hsannu.com/document-files/:path*",
      },
    ];
  },
};

export default nextConfig;
