import "server-only";

import { apiFetch } from "@/lib/api-fetch";
import { HERO_CACHE_TAG, HERO_REVALIDATE_SECONDS } from "@/lib/cache";
import type { HeroSlideItem } from "@/types/hero";

/**
 * Fetch dynamic hero slides from apps/api (`GET /hero-slides`).
 * Returns empty array and logs to terminal if the API is offline or returns no active slides.
 */
export async function getHeroSlides(page = "home"): Promise<HeroSlideItem[]> {
  const data = await apiFetch<{ slides?: HeroSlideItem[] }>(
    page === "home" ? "/hero-slides" : `/hero-slides?page=${encodeURIComponent(page)}`,
    {
      next: { revalidate: HERO_REVALIDATE_SECONDS, tags: [HERO_CACHE_TAG] },
    },
    `hero-slides-${page}`
  );

  if (!data || !data.slides || data.slides.length === 0) {
    return [];
  }

  return data.slides;
}

/**
 * Fetch dynamic single-banner hero for a specific page with ISR revalidation.
 */
export async function getPageHero(
  page: string,
  fallbackDefaults?: Partial<HeroSlideItem>
): Promise<HeroSlideItem | null> {
  const data = await apiFetch<{ slides?: HeroSlideItem[] }>(
    `/hero-slides?page=${encodeURIComponent(page)}`,
    {
      next: { revalidate: HERO_REVALIDATE_SECONDS, tags: [HERO_CACHE_TAG] },
    },
    `hero-slides-${page}`
  );

  if (data?.slides && data.slides.length > 0) {
    return data.slides[0];
  }

  if (fallbackDefaults) {
    return {
      title1: fallbackDefaults.title1 || "",
      title2: fallbackDefaults.title2 || "",
      description: fallbackDefaults.description || "",
      imageUrl: fallbackDefaults.imageUrl || "",
      badge: fallbackDefaults.badge || "",
      ...fallbackDefaults,
    };
  }

  return null;
}
