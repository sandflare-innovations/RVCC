import "server-only";

import { HERO_CACHE_TAG, HERO_REVALIDATE_SECONDS } from "@/lib/cache";
import type { HeroSlideItem } from "@/types/hero";

function apiBase(): string {
  return (process.env.API_URL || "https://rvcc-api.rvcc.workers.dev").replace(/\/$/, "");
}

/**
 * Fetch dynamic hero slides from apps/api (`GET /hero-slides`).
 */
export async function getHeroSlides(): Promise<HeroSlideItem[]> {
  try {
    const res = await fetch(`${apiBase()}/hero-slides`, {
      next: { revalidate: HERO_REVALIDATE_SECONDS, tags: [HERO_CACHE_TAG] },
    });

    if (!res.ok) {
      console.warn("[hero-slides] API returned", res.status);
      return [];
    }

    const data = (await res.json()) as { slides?: HeroSlideItem[] };
    return data.slides || [];
  } catch (err) {
    console.warn("[hero-slides] Could not reach API:", err);
    return [];
  }
}
