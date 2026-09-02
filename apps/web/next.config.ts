import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: false,
  transpilePackages: [
    "three",
    "@react-three/fiber",
    "@react-three/drei",
    "react-pdf",
    "pdfjs-dist",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/register", destination: "/enquire/verify", permanent: true },
      { source: "/register/:path*", destination: "/enquire/:path*", permanent: true },
      { source: "/enquiry", destination: "/enquire/verify", permanent: true },
      { source: "/enquiry/:path*", destination: "/enquire/:path*", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/pdfjs/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/pdf/books/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
          { key: "Accept-Ranges", value: "bytes" },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig as any);
