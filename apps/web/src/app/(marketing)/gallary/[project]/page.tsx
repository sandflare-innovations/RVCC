import { Footer } from "@layout/Footer";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { FloatingContact } from "@/components/common/FloatingContact";
import { GALLARY_PROJECTS, GallaryProject } from "@/data/gallary";
import { services } from "@/data/services";
import { getGalleryCollections } from "@/lib/content/projects";

import ProjectClient from "./ProjectClient";

interface Props {
  params: Promise<{ project: string }>;
}

async function getGalleryItem(slug: string): Promise<GallaryProject | null> {
  const dynamicCollections = await getGalleryCollections();

  // 1. Try to find a specific project
  const project = dynamicCollections.find((p) => p.slug === slug || p.id === slug);
  if (project) return project;

  // Fallback check in static gallery
  const staticFound = GALLARY_PROJECTS.find((p) => p.slug === slug || p.id === slug);
  if (staticFound) return staticFound;

  // 2. Try to find a service and aggregate its project images
  const service = services.find((s) => s.slug === slug);
  if (service) {
    const relatedProjects = dynamicCollections.filter((p) => p.serviceSlugs.includes(service.slug));
    const allImages = relatedProjects.flatMap((p) => p.images);

    if (allImages.length === 0) return null;

    return {
      id: `service-${service.id}`,
      slug: service.slug,
      title: service.title,
      description: service.description,
      thumbnail: allImages[0] || service.image,
      images: allImages,
      serviceSlugs: [service.slug],
    };
  }

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { project: slug } = await params;
  const item = await getGalleryItem(slug);

  if (!item) return { title: "Collection Not Found" };

  return {
    title: `${item.title} | RVCC Gallery`,
    description: item.description,
  };
}

export default async function ProjectGallaryPage({ params }: Props) {
  const { project: slug } = await params;
  const item = await getGalleryItem(slug);

  if (!item) {
    notFound();
  }

  return (
    <div className="bg-background relative min-h-screen">
      <ProjectClient project={item} />
      <Footer />
      <FloatingContact />
    </div>
  );
}
