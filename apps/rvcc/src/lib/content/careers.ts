import "server-only";

import type { JobPosition } from "@/data/careers";

export const DEPARTMENTS = ["Architecture", "Engineering", "Management", "Operations"] as const;
export const EMPLOYMENT_TYPES = ["Full-time", "Contract", "Internship"] as const;

function apiBase(): string | null {
  const base = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL)?.replace(/\/$/, "");
  return base || null;
}

/**
 * Published postings for the public careers page (via apps/api GET /careers).
 *
 * Returns [] rather than throwing if the API is unreachable — a CMS outage
 * should degrade the careers section, not take down the page around it.
 */
export async function getPublishedJobs(): Promise<JobPosition[]> {
  const base = apiBase();
  if (!base) {
    console.error("[careers] API_URL is not set");
    return [];
  }

  try {
    const res = await fetch(`${base}/careers`, { cache: "no-store" });
    if (!res.ok) {
      console.error("[careers] API returned", res.status);
      return [];
    }
    const data = (await res.json()) as { jobs?: JobPosition[] };
    return (Array.isArray(data.jobs) ? data.jobs : []) as JobPosition[];
  } catch (err) {
    console.error("[careers] could not load postings", err);
    return [];
  }
}
