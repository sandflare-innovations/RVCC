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
    const image =
      (p as any).image ||
      (p as any).coverImage ||
      (p.gallery?.[0] as any)?.imageUrl ||
      (typeof p.gallery?.[0] === "string" ? p.gallery[0] : null) ||
      "";
    const gallery = Array.isArray(p.gallery)
      ? p.gallery
          .map((g: any) => (typeof g === "string" ? g : g?.imageUrl))
          .filter(Boolean)
      : [];

    return {
      ...p,
      image,
      coverImage: (p as any).coverImage || image,
      gallery: gallery.length > 0 ? gallery : image ? [image] : [],
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
  const image =
    (p as any).image ||
    (p as any).coverImage ||
    (p.gallery?.[0] as any)?.imageUrl ||
    (typeof p.gallery?.[0] === "string" ? p.gallery[0] : null) ||
    "";
  const gallery = Array.isArray(p.gallery)
    ? p.gallery
        .map((g: any) => (typeof g === "string" ? g : g?.imageUrl))
        .filter(Boolean)
    : [];

  return {
    ...p,
    image,
    coverImage: (p as any).coverImage || image,
    gallery: gallery.length > 0 ? gallery : image ? [image] : [],
  };
}

/**
 * Fetch gallery collections grouped by project dynamically.
 */
export async function getGalleryCollections(): Promise<GallaryProject[]> {
  const data = await apiFetch<{ collections?: GallaryProject[]; images?: any[] }>(
    "/gallery",
    {
      next: { revalidate: GALLERY_REVALIDATE_SECONDS, tags: [GALLERY_CACHE_TAG] },
    },
    "gallery"
  );

  if (data?.collections && Array.isArray(data.collections) && data.collections.length > 0) {
    return data.collections;
  }

  // If images array returned instead of collections, group them by project
  if (data?.images && Array.isArray(data.images) && data.images.length > 0) {
    const map = new Map<string, GallaryProject>();
    for (const img of data.images) {
      const slug = img.projectSlug || img.projectId;
      if (!slug) continue;
      if (!map.has(slug)) {
        map.set(slug, {
          id: img.projectId || slug,
          slug,
          title: img.projectTitle || slug,
          description: img.caption || "",
          thumbnail: img.imageUrl,
          images: [],
          serviceSlugs: Array.isArray(img.serviceSlugs) ? [...img.serviceSlugs] : [],
        });
      }
      const col = map.get(slug)!;
      col.images.push(img.imageUrl);
      if (img.isCover) {
        col.thumbnail = img.imageUrl;
      }
    }
    return Array.from(map.values());
  }

  // Fallback to active projects that have gallery images or cover images
  const projects = await getProjects();
  if (projects && projects.length > 0) {
    return projects
      .filter((p) => (p.gallery && p.gallery.length > 0) || p.coverImage || p.image)
      .map((p) => {
        const images =
          Array.isArray(p.gallery) && p.gallery.length > 0
            ? p.gallery
            : (p.coverImage || p.image ? [p.coverImage || p.image] : []);

        return {
          id: String(p.id),
          slug: p.slug,
          title: p.title,
          description: p.description || "",
          thumbnail: p.coverImage || p.image || images[0] || "",
          images,
          serviceSlugs: Array.isArray(p.serviceSlugs) ? p.serviceSlugs : [],
        };
      });
  }

  return [];
}

