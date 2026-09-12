import { Footer } from "@layout/Footer";
import { QualityContent } from "@sections/quality/QualityContent";
import { QualityHero } from "@sections/quality/QualityHero";
import { Metadata } from "next";
import { getPageHero } from "@/lib/content/hero";

export const metadata: Metadata = {
  title: "Quality Policy | RVCC - ISO Certified Excellence",
  description:
    "Explore RVCC's commitment to quality standards, safety management, and sustainable project delivery. ISO 9001:2008 Certified.",
  keywords: ["Quality Policy", "ISO 9001", "HSE Policy", "Safety", "RVCC", "Construction Quality"],
};

export default async function QualityPolicyPage() {
  const hero = await getPageHero("quality-policy", {
    title1: "Quality",
    title2: "Management",
    badge: "ISO 9001",
    description:
      "Architecting precision through rigorous standards and continuous improvement in every project landscape.",
  });

  return (
    <div className="relative min-h-screen bg-white">
      <QualityHero hero={hero} />
      <QualityContent />
      <Footer />
    </div>
  );
}
