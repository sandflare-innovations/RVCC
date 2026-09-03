import { ServicesGrid } from "@sections/services/ServicesGrid";
import { ServicesHero } from "@sections/services/ServicesHero";
import { Metadata } from "next";

import Contact from "@/components/common/Contact";
import { Footer } from "@/components/layout/Footer";

import { getServices } from "@/lib/content/services";

export const metadata: Metadata = {
  title: "Services | RVCC",
  description: "Explore our range of professional architectural and design services.",
};

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <div className="relative min-h-screen">
      <ServicesHero />
      <div className="bg-background relative z-10 w-full">
        <ServicesGrid initialServices={services} />
        <Contact />
        <Footer />
      </div>
    </div>
  );
}
