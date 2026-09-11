import "server-only";

import type { NewsEventDTO } from "@rvcc/schemas";
import { apiFetch } from "@/lib/api-fetch";
import { NEWS_CACHE_TAG, NEWS_REVALIDATE_SECONDS } from "@/lib/cache";

export type WebNewsItem = NewsEventDTO;

/**
 * Fetch all published active news & events items dynamically from the API.
 */
export async function getNews(): Promise<WebNewsItem[]> {
  const data = await apiFetch<{ news?: WebNewsItem[] }>(
    "/news",
    {
      next: { revalidate: NEWS_REVALIDATE_SECONDS, tags: [NEWS_CACHE_TAG] },
    },
    "news"
  );

  if (!data || !data.news || !Array.isArray(data.news)) {
    return [];
  }

  return data.news;
}

/**
 * Fetch a single news & event item dynamically by slug from the API.
 */
export async function getNewsBySlug(slug: string): Promise<WebNewsItem | null> {
  const data = await apiFetch<{ news?: WebNewsItem }>(
    `/news/${encodeURIComponent(slug)}`,
    {
      next: { revalidate: NEWS_REVALIDATE_SECONDS, tags: [NEWS_CACHE_TAG] },
    },
    `news/${slug}`
  );

  if (!data || !data.news) {
    return null;
  }

  return data.news;
}
