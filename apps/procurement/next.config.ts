import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverActions: {
    bodySizeLimit: "25mb",
  },
  experimental: {
    proxyClientMaxBodySize: "25mb",
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  transpilePackages: ["@rvcc/schemas", "@rvcc/types", "@rvcc/utils"],
};

export default nextConfig;
