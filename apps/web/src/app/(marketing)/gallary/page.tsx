import { Footer } from "@layout/Footer";
import {
  GallaryCollections,
  GallaryCollectionsSkeleton,
} from "@sections/gallary/GallaryCollections";
import { GallaryHero } from "@sections/gallary/GallaryHero";
import { Metadata } from "next";
import { Suspense } from "react";

import { FloatingContact } from "@/components/common/FloatingContact";
import { getGalleryCollections } from "@/lib/content/projects";
import { getServices } from "@/lib/content/services";

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

export default async function GallaryPage() {
  const [collections, services] = await Promise.all([
    getGalleryCollections(),
    getServices(),
  ]);

  return (
    <div className="relative min-h-screen">
      <GallaryHero initialCollections={collections} />
      <Suspense fallback={<GallaryCollectionsSkeleton />}>
        <GallaryCollections
          initialCollections={collections}
          initialServices={services}
        />
      </Suspense>
      <Footer />
      <FloatingContact />
    </div>
  );
}
