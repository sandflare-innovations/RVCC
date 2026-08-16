import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RVCC | WHERE IDEAS ARE SHAPED TO REALITY",
    template: "%s | RVCC",
  },
  description:
    "A forward-thinking brand focused on engineering, design, and manufacturing. RVCC: Delivering precision and excellence in every project.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="font-primary relative min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
