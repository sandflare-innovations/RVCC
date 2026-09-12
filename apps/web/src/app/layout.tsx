import "./globals.css";
import "flag-icons/css/flag-icons.min.css";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Maven_Pro } from "next/font/google";
import localFont from "next/font/local";
import type { Metadata } from "next";
import Script from "next/script";

import { PwaUpdateBanner } from "@/components/pwa/pwa-update-banner";
import { ServiceWorkerRegistrar } from "@/components/pwa/sw-registrar";

const mavenPro = Maven_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-primary",
  display: "swap",
});

const araHamah = localFont({
  src: "../../public/fonts/Ara Hamah Alislam Regular/Ara Hamah Alislam Regular.otf",
  variable: "--font-heading",
  display: "swap",
});

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
    <html
      lang="en"
      className={`${mavenPro.variable} ${araHamah.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="font-primary relative flex min-h-full flex-col" suppressHydrationWarning>
        <PwaUpdateBanner />
        {children}
        <ServiceWorkerRegistrar />
        {process.env.VERCEL && <SpeedInsights />}
        <Script id="microsoft-clarity" strategy="lazyOnload">
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
