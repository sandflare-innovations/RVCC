import { Inter } from "next/font/google";

import type { Metadata } from "next";

const portalSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-enquire-sans",
});

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Shared shell for login / register / access-held / portal. */
export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-vendor
      className={`${portalSans.variable} font-enquire min-h-screen bg-zinc-50 antialiased`}
    >
      {children}
    </div>
  );
}
