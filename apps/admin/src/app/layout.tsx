import "./globals.css";
import "flag-icons/css/flag-icons.min.css";

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { PwaBootstrap } from "./pwa-bootstrap";
import { PwaSplash } from "./pwa-splash";
import { PwaUpdateBanner } from "./pwa-update-banner";
import { ServiceWorkerRegistrar } from "./sw-registrar";

const adminSans = Inter({ subsets: ["latin"], display: "swap", variable: "--font-enquire-sans" });

export const viewport: Viewport = {
  themeColor: "#fafafa",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "RVCC Admin",
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RVCC Admin",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48 256x256", type: "image/x-icon" },
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <PwaBootstrap />
      </head>
      <body
        data-admin
        suppressHydrationWarning
        className={`${adminSans.variable} font-enquire min-h-screen bg-zinc-50 antialiased`}
      >
        <PwaSplash />
        <PwaUpdateBanner />
        {children}
        <ServiceWorkerRegistrar />
        <SpeedInsights />
      </body>
    </html>
  );
}
