import { LenisProvider } from "@/components/providers/LenisProvider";
import { LanguageProvider } from "@/context/LanguageContext";
import { Navbar } from "@layout/Navbar";

/** Marketing routes only — enquire keeps a lean layout without Lenis/Navbar weight. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <LenisProvider>
      <LanguageProvider>
        <Navbar />
        <main className="relative flex-grow">{children}</main>
      </LanguageProvider>
    </LenisProvider>
  );
}
