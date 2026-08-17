import { notFound } from "next/navigation";

import { Metadata } from "next";

import { FloatingContact } from "@/components/common/FloatingContact";
import { Footer } from "@/components/layout/Footer";
import { GALLERY_PROJECTS, GalleryProject } from "@/data/gallery";
import { services } from "@/data/services";

import ProjectClient from "./ProjectClient";

interface Props {
  params: Promise<{ project: string }>;
}

async function getGalleryItem(slug: string): Promise<GalleryProject | null> {
  const project = GALLERY_PROJECTS.find((p) => p.slug === slug);
  if (project) return project;

  const service = services.find((s) => s.slug === slug);
  if (service) {
    const relatedProjects = GALLERY_PROJECTS.filter((p) => p.serviceSlugs.includes(service.slug));
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

export default async function ProjectGalleryPage({ params }: Props) {
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
