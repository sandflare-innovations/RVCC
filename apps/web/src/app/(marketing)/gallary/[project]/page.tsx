import { Footer } from "@layout/Footer";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { FloatingContact } from "@/components/common/FloatingContact";
import { GallaryProject } from "@/data/gallary";
import { getGalleryCollections, getProjectBySlug } from "@/lib/content/projects";
import { getServiceBySlug } from "@/lib/content/services";

import ProjectClient from "./ProjectClient";

interface Props {
  params: Promise<{ project: string }>;
}

async function getGalleryItem(slug: string): Promise<GallaryProject | null> {
  const dynamicCollections = await getGalleryCollections();

  // 1. Try to find a specific project in dynamic collections
  const project = dynamicCollections.find((p) => p.slug === slug || p.id === slug);
  if (project) return project;

  // 2. Try to fetch project directly by slug
  const directProject = await getProjectBySlug(slug);
  if (directProject) {
    const images =
      Array.isArray(directProject.gallery) && directProject.gallery.length > 0
        ? directProject.gallery
        : (directProject.coverImage || directProject.image ? [directProject.coverImage || directProject.image] : []);

    return {
      id: String(directProject.id),
      slug: directProject.slug,
      title: directProject.title,
      description: directProject.description || "",
      thumbnail: directProject.coverImage || directProject.image || images[0] || "",
      images,
      serviceSlugs: Array.isArray(directProject.serviceSlugs) ? directProject.serviceSlugs : [],
    };
  }

  // 3. Try to find a service and aggregate its project images
  const service = await getServiceBySlug(slug);
  if (service) {
    const relatedProjects = dynamicCollections.filter(
      (p) => Array.isArray(p.serviceSlugs) && p.serviceSlugs.includes(service.slug)
    );
    const allImages = Array.from(
      new Set([
        ...(service.dynamicGalleryImages || []),
        ...relatedProjects.flatMap((p) => p.images),
        service.image,
      ].filter(Boolean))
    );

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
