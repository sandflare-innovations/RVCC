import "server-only";

import { apiFetch } from "@/lib/api-fetch";
import { HERO_CACHE_TAG, HERO_REVALIDATE_SECONDS } from "@/lib/cache";
import type { HeroSlideItem } from "@/types/hero";

/**
 * Fetch dynamic hero slides from apps/api (`GET /hero-slides`).
 * Returns empty array and logs to terminal if the API is offline or returns no active slides.
 */
export async function getHeroSlides(): Promise<HeroSlideItem[]> {
  const data = await apiFetch<{ slides?: HeroSlideItem[] }>(
    "/hero-slides",
    {
      next: { revalidate: HERO_REVALIDATE_SECONDS, tags: [HERO_CACHE_TAG] },
    },
    "hero-slides"
  );

  if (!data || !data.slides || data.slides.length === 0) {
    return [];
  }

  return data.slides;
}
