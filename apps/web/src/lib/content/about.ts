import "server-only";

import type { AboutContentDTO } from "@rvcc/schemas";
import { apiFetch } from "@/lib/api-fetch";
import { ABOUT_CACHE_TAG, ABOUT_REVALIDATE_SECONDS } from "@/lib/cache";

const FALLBACK_ABOUT_CONTENT: AboutContentDTO = {
  id: "default",
  videoUrl: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/about.mp4",
  videoPosterUrl: null,
  homeStats: [
    { value: 2006, label: "YEAR FOUNDED", suffix: "" },
    { value: 100, label: "COMPLETED PROJECTS", suffix: "+" },
    { value: 30, label: "ONGOING PROJECTS", suffix: "+" },
    { value: 15, label: "GOVERNMENT PROJECTS", suffix: "+" },
    { value: 100, label: "SATISFIED CLIENTS", suffix: "%" },
  ],
  aboutStats: [
    {
      description: "Premier projects successfully delivered across the Saudi Kingdom",
      value: "150",
    },
    {
      description: "Strategic urban centers and cities served nationwide",
      value: "12",
    },
    {
      description: "Years of unwavering architectural and engineering excellence",
      value: "15",
    },
    {
      description: "Dedicated professional teams shaping global visions into reality",
      value: "50",
    },
  ],
  overviewImages: [
    "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/overview-1.webp",
    "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/overview-2.webp",
    "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/overview-3.webp",
    "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/overview-4.webp",
  ],
  overviewTitle: "The Art of Structural Perfection.",
  overviewSubtitle: "Company Profile",
  overviewDescription1:
    "Riyadh Villas Contracting Company (RVCC) stands as a beacon of refined engineering and timeless structural design. For nearly two decades, we have been the quiet force behind the Kingdom's most prestigious developments.",
  overviewDescription2:
    "Our philosophy is simple: perfection is not when there is nothing more to add, but when there is nothing left to take away. We bring this minimalist precision to every civil, structural, and engineering challenge we undertake.",
  classABadge: "Class A",
  classADescription: "Ministry Accredited Excellence",
  deliveriesCount: "150+",
  yearsCount: "20+",
  updatedAt: new Date().toISOString(),
};

/**
 * Fetch dynamic about content from apps/api (`GET /about`) with ISR.
 * Returns cached or fallback data if the API is offline or returns an empty state.
 */
export async function getAboutContent(): Promise<AboutContentDTO> {
  const data = await apiFetch<{ about?: AboutContentDTO }>(
    "/about",
    {
      next: { revalidate: ABOUT_REVALIDATE_SECONDS, tags: [ABOUT_CACHE_TAG] },
    },
    "about"
  );

  if (!data || !data.about) {
    return FALLBACK_ABOUT_CONTENT;
  }

  return data.about;
}
