import { Footer } from "@layout/Footer";
import { QualityContent } from "@sections/quality/QualityContent";
import { QualityHero } from "@sections/quality/QualityHero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quality Policy | RVCC - ISO Certified Excellence",
  description:
    "Explore RVCC's commitment to quality standards, safety management, and sustainable project delivery. ISO 9001:2008 Certified.",
  keywords: ["Quality Policy", "ISO 9001", "HSE Policy", "Safety", "RVCC", "Construction Quality"],
};

export default function QualityPolicyPage() {
  return (
    <div className="relative min-h-screen bg-white">
      <QualityHero />
      <QualityContent />
      <Footer />
    </div>
  );
}
