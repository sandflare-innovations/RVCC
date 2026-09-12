import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  transpilePackages: ["@rvcc/schemas", "@rvcc/types", "@rvcc/utils"],
};

export default nextConfig;
