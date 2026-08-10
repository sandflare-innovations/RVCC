import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  reactStrictMode: true,
  transpilePackages: ["@repo/ui", "@repo/db", "@repo/auth-password"],
};

export default nextConfig;
