import type { Metadata } from "next";

import { LenisProvider } from "@/components/providers/LenisProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LanguageProvider } from "@/context/LanguageContext";

import { Footer } from "@layout/Footer";
import { Navbar } from "@layout/Navbar";

import "./globals.css";

export const metadata: Metadata = {
  title: "RVCC | WHERE IDEAS ARE SHAPED TO REALITY",
  description:
    "A forward-thinking brand focused on engineering, design, and manufacturing. RVCC: Delivering precision and excellence in every project.",
  keywords: ["Engineering", "Design", "Manufacturing", "RVCC", "Shaping Reality"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="font-primary flex min-h-full flex-col" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LenisProvider>
            <LanguageProvider>
              <Navbar />
              <main className="flex-grow">{children}</main>
            </LanguageProvider>
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
