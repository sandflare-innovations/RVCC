import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  async redirects() {
    return [
      { source: "/gallary", destination: "/gallery", permanent: true },
      { source: "/gallary/:path*", destination: "/gallery/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
