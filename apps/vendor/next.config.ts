import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  reactStrictMode: true,
  transpilePackages: ["@repo/ui", "@repo/auth-password", "@repo/rfq"],
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
