import "server-only";

import { apiFetch } from "@/lib/api-fetch";
import { CAREERS_CACHE_TAG, CAREERS_REVALIDATE_SECONDS } from "@/lib/cache";
import type { JobPosition } from "@/types/careers";

export const DEPARTMENTS = ["Architecture", "Engineering", "Management", "Operations"] as const;
export const EMPLOYMENT_TYPES = ["Full-time", "Contract", "Internship"] as const;

/**
 * Published postings for the public careers page (apps/api `GET /careers`).
 *
 * Returns [] rather than throwing if the API is unreachable — a backend outage
 * should degrade the careers section, not take down the page around it.
 */
export async function getPublishedJobs(): Promise<JobPosition[]> {
  const data = await apiFetch<{ jobs?: JobPosition[] }>(
    "/careers",
    {
      next: { revalidate: CAREERS_REVALIDATE_SECONDS, tags: [CAREERS_CACHE_TAG] },
    },
    "careers"
  );

  return data?.jobs ?? [];
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}
