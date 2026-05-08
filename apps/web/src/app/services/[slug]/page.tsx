import { notFound } from "next/navigation";

import { Metadata } from "next";

import { FloatingContact } from "@/components/common/FloatingContact";
import { Footer } from "@/components/layout/Footer";
import { services } from "@/data/services";
import { ServiceDetailContent } from "@/sections/services/detail/ServiceDetailContent";
import { ServiceDetailHero } from "@/sections/services/detail/ServiceDetailHero";
import { ServiceDetailProjects } from "@/sections/services/detail/ServiceDetailProjects";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug || s.id.toString() === slug);

  if (!service) return { title: "Service Not Found" };

  return {
    title: `${service.title} | RVCC Services`,
    description: service.description,
  };
}

export async function generateStaticParams() {
  return services.map((service) => ({
    slug: service.slug,
  }));
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug || s.id.toString() === slug);

  if (!service) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <ServiceDetailHero service={service} />
      <div className="relative z-10 bg-white">
        <ServiceDetailContent service={service} />
        <ServiceDetailProjects service={service} />
        <Footer />
      </div>
      <FloatingContact />
    </main>
  );
}
