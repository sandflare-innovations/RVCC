import "server-only";

import {
  GALLERY_CACHE_TAG,
  GALLERY_REVALIDATE_SECONDS,
  PROJECTS_CACHE_TAG,
  PROJECTS_REVALIDATE_SECONDS,
} from "@/lib/cache";
import type { DetailedProject } from "@/data/projects/detailed";
import type { GallaryProject } from "@/data/gallary";

function apiBase(): string {
  return (process.env.API_URL || "https://rvcc-api.rvcc.workers.dev").replace(/\/$/, "");
}

/**
 * Fetch all active projects from the backend with ISR revalidation.
 */
export async function getProjects(): Promise<DetailedProject[]> {
  try {
    const res = await fetch(`${apiBase()}/projects`, {
      next: { revalidate: PROJECTS_REVALIDATE_SECONDS, tags: [PROJECTS_CACHE_TAG] },
    });

    if (!res.ok) {
      console.warn(`[projects] API returned status ${res.status}`);
      return [];
    }

    const data = (await res.json()) as { projects?: DetailedProject[] };
    if (!data.projects || !Array.isArray(data.projects)) {
      return [];
    }

    return data.projects;
  } catch (err) {
    console.error("[projects] Could not reach API:", err);
    return [];
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
    return null;
  } catch (err) {
    console.error(`[projects/${slug}] Could not reach API:`, err);
    return null;
  }
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
      console.warn(`[gallery] API returned status ${res.status}`);
      return [];
    }

    const data = (await res.json()) as { collections?: GallaryProject[] };
    if (!data.collections || !Array.isArray(data.collections)) {
      return [];
    }

    return data.collections;
  } catch (err) {
    console.error("[gallery] Could not reach API:", err);
    return [];
  }
}

