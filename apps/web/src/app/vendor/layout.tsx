import { Inter } from "next/font/google";

import type { Metadata } from "next";

const vendorSans = Inter({ subsets: ["latin"], display: "swap", variable: "--font-enquire-sans" });

export const metadata: Metadata = {
  title: "Supplier Portal | RVCC",
  robots: { index: false, follow: false },
};

/** Shell only — /vendor/login must render signed-out. Guard lives in (protected). */
export default function VendorRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-admin
      className={`${vendorSans.variable} font-enquire min-h-screen bg-zinc-50 antialiased`}
    >
      {children}
    </div>
  );
}
