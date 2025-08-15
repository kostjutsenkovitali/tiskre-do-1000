import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.tiskre-do.eu",
      },
      {
        protocol: "https",
        hostname: "tiskre-do.eu",
      },
      {
        protocol: "https",
        hostname: "*.wp.com",
      },
    ],
  },
};

export default nextConfig;
