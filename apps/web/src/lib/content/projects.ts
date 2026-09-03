import "server-only";

import {
  GALLERY_CACHE_TAG,
  GALLERY_REVALIDATE_SECONDS,
  PROJECTS_CACHE_TAG,
  PROJECTS_REVALIDATE_SECONDS,
} from "@/lib/cache";
import { PROJECTS as STATIC_PROJECTS, DetailedProject } from "@/data/projects/detailed";
import { GALLARY_PROJECTS as STATIC_GALLERY, GallaryProject } from "@/data/gallary";

function apiBase(): string {
  return (process.env.API_URL || "https://rvcc-api.rvcc.workers.dev").replace(/\/$/, "");
}

/**
 * Fetch all active projects from the backend with ISR revalidation.
 * Gracefully falls back to STATIC_PROJECTS if the backend is unavailable or empty.
 */
export async function getProjects(): Promise<DetailedProject[]> {
  try {
    const res = await fetch(`${apiBase()}/projects`, {
      next: { revalidate: PROJECTS_REVALIDATE_SECONDS, tags: [PROJECTS_CACHE_TAG] },
    });

    if (!res.ok) {
      return STATIC_PROJECTS;
    }

    const data = (await res.json()) as { projects?: DetailedProject[] };
    if (!data.projects || data.projects.length === 0) {
      return STATIC_PROJECTS;
    }

    return data.projects;
  } catch (err) {
    console.warn("[projects] Could not reach API, using static fallback", err);
    return STATIC_PROJECTS;
  }
}

/**
 * Fetch a single project by slug or ID with its connected gallery images.
 */
export async function getProjectBySlug(slug: string): Promise<DetailedProject | null> {
  try {
    const res = await fetch(`${apiBase()}/projects/${encodeURIComponent(slug)}`, {
      next: { revalidate: PROJECTS_REVALIDATE_SECONDS, tags: [PROJECTS_CACHE_TAG] },
    });

    if (res.ok) {
      const data = (await res.json()) as { project?: DetailedProject };
      if (data.project) return data.project;
    }
  } catch (err) {
    console.warn(`[projects/${slug}] Could not reach API, falling back to static`, err);
  }

  // Fallback to static
  const found = STATIC_PROJECTS.find((p) => p.slug === slug || p.id === slug);
  return found ?? null;
}

/**
 * Fetch gallery collections grouped by project.
 */
export async function getGalleryCollections(): Promise<GallaryProject[]> {
  try {
    const res = await fetch(`${apiBase()}/gallery`, {
      next: { revalidate: GALLERY_REVALIDATE_SECONDS, tags: [GALLERY_CACHE_TAG] },
    });

    if (!res.ok) {
      return STATIC_GALLERY;
    }

    const data = (await res.json()) as { collections?: GallaryProject[] };
    if (!data.collections || data.collections.length === 0) {
      return STATIC_GALLERY;
    }

    return data.collections;
  } catch (err) {
    console.warn("[gallery] Could not reach API, using static fallback", err);
    return STATIC_GALLERY;
  }
}
