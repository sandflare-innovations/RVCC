import { Inter } from "next/font/google";

import type { Metadata } from "next";

import "./globals.css";

const vendorSans = Inter({ subsets: ["latin"], display: "swap", variable: "--font-enquire-sans" });

export const metadata: Metadata = {
  title: "RVCC Supplier Portal",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        data-vendor
        suppressHydrationWarning
        className={`${vendorSans.variable} font-enquire min-h-screen bg-zinc-50 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
