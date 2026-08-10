import { Inter } from "next/font/google";

import type { Metadata } from "next";

const adminSans = Inter({ subsets: ["latin"], display: "swap", variable: "--font-enquire-sans" });

export const metadata: Metadata = {
  title: "RVCC Admin",
  // Keep the whole admin surface out of search results.
  robots: { index: false, follow: false },
};

/**
 * Shell only — no auth here on purpose. /admin/login must render for signed-out
 * users, and it nests under this layout. The auth gate lives one level down in
 * admin/(protected)/layout.tsx, which the login route sits outside of.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-admin
      className={`${adminSans.variable} font-enquire min-h-screen bg-zinc-50 antialiased`}
    >
      {children}
    </div>
  );
}
