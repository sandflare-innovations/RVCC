import { Suspense } from "react";

import { Metadata } from "next";

import { FloatingContact } from "@/components/common/FloatingContact";
import { Footer } from "@/components/layout/Footer";
import { GallaryCollections } from "@/sections/gallary/GallaryCollections";
import { GallaryHero } from "@/sections/gallary/GallaryHero";

export const metadata: Metadata = {
  title: "Gallery | RVCC - Visualizing Excellence",
  description:
    "Explore our architectural and engineering achievements through our curated project gallery. From iconic towers to urban landscapes.",
  keywords: ["Gallery", "Projects", "Architecture", "Engineering", "RVCC", "Construction Gallery"],
  openGraph: {
    title: "RVCC Project Gallery",
    description: "Visual showcase of RVCC's premier projects across Saudi Arabia.",
    type: "website",
  },
};

export default function GallaryPage() {
  return (
    <div className="relative min-h-screen">
      <GallaryHero />
      <Suspense fallback={<div className="container py-24 text-center">Loading gallery...</div>}>
        <GallaryCollections />
      </Suspense>
      <Footer />
      <FloatingContact />
    </div>
  );
}
