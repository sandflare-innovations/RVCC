import Script from "next/script";

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
      <body className="font-primary relative flex min-h-full flex-col" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LenisProvider>
            <LanguageProvider>
              <Navbar />
              <main className="relative flex-grow">{children}</main>
            </LanguageProvider>
          </LenisProvider>
        </ThemeProvider>
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "xemok4fk3m");`}
        </Script>
      </body>
    </html>
  );
}
