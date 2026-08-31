import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { PwaUpdateBanner } from "@/components/pwa/pwa-update-banner";
import { ServiceWorkerRegistrar } from "@/components/pwa/sw-registrar";

const adminSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-enquire-sans",
});

export const viewport: Viewport = {
  themeColor: "#fafafa",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "RVCC Procurement Portal",
  description: "Enterprise Procurement & Purchase Requisition Management System",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RVCC Procurement",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={adminSans.variable}>
      <body className="font-enquire min-h-screen bg-zinc-50 text-zinc-900 antialiased selection:bg-[#0073bc] selection:text-white">
        <PwaUpdateBanner />
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
