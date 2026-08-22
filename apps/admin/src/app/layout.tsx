import { Inter } from "next/font/google";

import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";
import "flag-icons/css/flag-icons.min.css";

const adminSans = Inter({ subsets: ["latin"], display: "swap", variable: "--font-enquire-sans" });

export const metadata: Metadata = {
  title: "RVCC Admin",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        data-admin
        suppressHydrationWarning
        className={`${adminSans.variable} font-enquire min-h-screen bg-zinc-50 antialiased`}
      >
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
