import { Metadata } from "next";
import { GallaryHero } from "@sections/gallary/GallaryHero";
import { GallaryCollections } from "@sections/gallary/GallaryCollections";
import { Footer } from "@layout/Footer";
import { FloatingContact } from "@/components/common/FloatingContact";

export const metadata: Metadata = {
  title: "Gallery | RVCC - Visualizing Excellence",
  description: "Explore our architectural and engineering achievements through our curated project gallery. From iconic towers to urban landscapes.",
  keywords: ["Gallery", "Projects", "Architecture", "Engineering", "RVCC", "Construction Gallery"],
  openGraph: {
    title: "RVCC Project Gallery",
    description: "Visual showcase of RVCC's premier projects across Saudi Arabia.",
    type: "website",
  }
};

export default function GallaryPage() {
  return (
    <div className="relative min-h-screen">
      <GallaryHero />
      <GallaryCollections />
      <Footer />
      <FloatingContact />
    </div>
  );
}
