import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@rvcc/schemas", "@rvcc/types", "@rvcc/utils"],
};

export default nextConfig;
