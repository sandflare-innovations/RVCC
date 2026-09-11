import "server-only";

import type { GallaryProject } from "@/data/gallary";
import type { DetailedProject } from "@/data/projects/detailed";
import { apiFetch } from "@/lib/api-fetch";
import {
  GALLERY_CACHE_TAG,
  GALLERY_REVALIDATE_SECONDS,
  PROJECTS_CACHE_TAG,
  PROJECTS_REVALIDATE_SECONDS,
} from "@/lib/cache";

/**
 * Fetch all active projects from the backend with ISR revalidation.
 */
export async function getProjects(): Promise<DetailedProject[]> {
  const data = await apiFetch<{ projects?: DetailedProject[] }>(
    "/projects",
    {
      next: { revalidate: PROJECTS_REVALIDATE_SECONDS, tags: [PROJECTS_CACHE_TAG] },
    },
    "projects"
  );

  if (!data || !data.projects || !Array.isArray(data.projects)) {
    return [];
  }

  return data.projects.map((p) => {
    const fallbackImage = "/images/projects/13.webp";
    const image =
      (p as any).image ||
      (p as any).coverImage ||
      (p.gallery?.[0] as any)?.imageUrl ||
      (typeof p.gallery?.[0] === "string" ? p.gallery[0] : null) ||
      fallbackImage;
    const gallery = Array.isArray(p.gallery)
      ? p.gallery
          .map((g: any) => (typeof g === "string" ? g : g?.imageUrl))
          .filter(Boolean)
      : [];

    return {
      ...p,
      image,
      coverImage: (p as any).coverImage || image,
      gallery: gallery.length > 0 ? gallery : [image],
    };
  });
}

/**
 * Fetch a single project by slug or ID with its connected gallery images.
 */
export async function getProjectBySlug(slug: string): Promise<DetailedProject | null> {
  const data = await apiFetch<{ project?: DetailedProject }>(
    `/projects/${encodeURIComponent(slug)}`,
    {
      next: { revalidate: PROJECTS_REVALIDATE_SECONDS, tags: [PROJECTS_CACHE_TAG] },
    },
    `projects/${slug}`
  );

  if (!data || !data.project) {
    return null;
  }

  const p = data.project;
  const fallbackImage = "/images/projects/13.webp";
  const image =
    (p as any).image ||
    (p as any).coverImage ||
    (p.gallery?.[0] as any)?.imageUrl ||
    (typeof p.gallery?.[0] === "string" ? p.gallery[0] : null) ||
    fallbackImage;
  const gallery = Array.isArray(p.gallery)
    ? p.gallery
        .map((g: any) => (typeof g === "string" ? g : g?.imageUrl))
        .filter(Boolean)
    : [];

  return {
    ...p,
    image,
    coverImage: (p as any).coverImage || image,
    gallery: gallery.length > 0 ? gallery : [image],
  };
}

/**
 * Fetch gallery collections grouped by project.
 */
export async function getGalleryCollections(): Promise<GallaryProject[]> {
  const data = await apiFetch<{ collections?: GallaryProject[] }>(
    "/gallery",
    {
      next: { revalidate: GALLERY_REVALIDATE_SECONDS, tags: [GALLERY_CACHE_TAG] },
    },
    "gallery"
  );

  if (!data || !data.collections || !Array.isArray(data.collections)) {
    return [];
  }

  return data.collections;
}
