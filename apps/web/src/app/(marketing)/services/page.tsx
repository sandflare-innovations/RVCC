import { ServicesGrid } from "@sections/services/ServicesGrid";
import { ServicesHero } from "@sections/services/ServicesHero";
import { Metadata } from "next";

import Contact from "@/components/common/Contact";
import { Footer } from "@/components/layout/Footer";
import { getHeroSlides, getPageHero } from "@/lib/content/hero";
import { getServices } from "@/lib/content/services";

export const metadata: Metadata = {
  title: "Services | RVCC",
  description: "Explore our range of professional architectural and design services.",
};

export default async function ServicesPage() {
  const [services, hero] = await Promise.all([
    getServices(),
    getPageHero("services", {
      badge: "OUR SERVICES",
      title1: "SHAPING",
      title2: "THE FUTURE",
      description: "Delivering excellence through innovative architectural solutions and precision engineering since 2006.",
      imageUrl: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/overview-2.webp",
    }),
  ]);

  return (
    <div className="relative min-h-screen">
      <ServicesHero hero={hero} />
      <div className="bg-background relative z-10 w-full">
        <ServicesGrid initialServices={services} />
        <Contact />
        <Footer />
      </div>
    </div>
  );
}
