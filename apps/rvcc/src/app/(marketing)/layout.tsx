import Script from "next/script";

import { Navbar } from "@/components/layout/Navbar";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const clarityEnabled = process.env.NODE_ENV === "production";

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <LenisProvider>
        <div className="font-primary relative flex min-h-full flex-col">
          <Navbar />
          <main className="relative flex-grow">{children}</main>
        </div>
      </LenisProvider>
      {clarityEnabled ? (
        <Script id="microsoft-clarity" strategy="lazyOnload">
          {`(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "xemok4fk3m");`}
        </Script>
      ) : null}
    </ThemeProvider>
  );
}
