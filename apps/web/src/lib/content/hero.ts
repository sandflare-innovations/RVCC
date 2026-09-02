import "server-only";

import { HERO_CACHE_TAG, HERO_REVALIDATE_SECONDS } from "@/lib/cache";
import type { HeroSlideItem } from "@/types/hero";

export const DEFAULT_HERO_SLIDES: HeroSlideItem[] = [
  {
    id: "default-1",
    badge: "Architecture & Design",
    title1: "Building",
    title2: "Legacy",
    description:
      "Redefining the architectural landscape of Saudi Arabia through visionary design, sustainable practices, and unmatched precision engineering.",
    imageUrl: "/images/projects/13.webp",
    primaryBtnText: "Explore Works",
    primaryBtnLink: "#projects",
    secondaryBtnText: "E-Vendor Registration",
    secondaryBtnLink: "/enquire/verify",
    sortOrder: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "default-2",
    badge: "Architecture & Design",
    title1: "Shaping",
    title2: "Reality",
    description:
      "Transforming complex engineering concepts into monumental commercial, industrial, and residential masterpieces across the Kingdom.",
    imageUrl: "/images/projects/4.webp",
    primaryBtnText: "Explore Works",
    primaryBtnLink: "#projects",
    secondaryBtnText: "E-Vendor Registration",
    secondaryBtnLink: "/enquire/verify",
    sortOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "default-3",
    badge: "Architecture & Design",
    title1: "Beyond",
    title2: "Limits",
    description:
      "Executing state-of-the-art infrastructure that drives forward Saudi Vision 2030, inspiring communities and setting new industry benchmarks.",
    imageUrl: "/images/projects/2.webp",
    primaryBtnText: "Explore Works",
    primaryBtnLink: "#projects",
    secondaryBtnText: "E-Vendor Registration",
    secondaryBtnLink: "/enquire/verify",
    sortOrder: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function apiBase(): string {
  return (process.env.API_URL || "https://rvcc-api.rvcc.workers.dev").replace(/\/$/, "");
}

/**
 * Fetch dynamic hero slides from apps/api (`GET /hero-slides`).
 * Returns DEFAULT_HERO_SLIDES if the API is offline or returns no active slides.
 */
export async function getHeroSlides(): Promise<HeroSlideItem[]> {
  try {
    const res = await fetch(`${apiBase()}/hero-slides`, {
      next: { revalidate: HERO_REVALIDATE_SECONDS, tags: [HERO_CACHE_TAG] },
    });

    if (!res.ok) {
      console.warn("[hero-slides] API returned", res.status, "- using default fallback slides");
      return DEFAULT_HERO_SLIDES;
    }

    const data = (await res.json()) as { slides?: HeroSlideItem[] };
    if (!data.slides || data.slides.length === 0) {
      return DEFAULT_HERO_SLIDES;
    }

    return data.slides;
  } catch (err) {
    console.warn("[hero-slides] Could not reach API, using default fallback slides", err);
    return DEFAULT_HERO_SLIDES;
  }
}
