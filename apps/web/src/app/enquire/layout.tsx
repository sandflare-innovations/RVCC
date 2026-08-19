import { Inter } from "next/font/google";

import { EnquireProvider } from "@/sections/enquire/EnquireContext";

/*
 * Scoped to /enquire/* — the rest of the site keeps Maven Pro. next/font
 * self-hosts the file at build time, so there is no runtime request to Google
 * and no layout shift while the portal's forms paint.
 */
const enquireSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-enquire-sans",
});

export default function EnquireLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={enquireSans.variable}>
      <EnquireProvider>
        <main className="relative flex-grow">{children}</main>
      </EnquireProvider>
    </div>
  );
}
