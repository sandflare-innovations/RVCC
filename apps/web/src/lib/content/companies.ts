import "server-only";

import { concernLogos as FALLBACK_LOGOS, type ConcernLogo } from "@/data/home/csr";

export interface SisterCompanyItem {
  id: string;
  name: string;
  logoUrl: string;
  industry: string;
  websiteUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
}

function apiBase(): string {
  return (process.env.API_URL || "https://rvcc-api.rvcc.workers.dev").replace(/\/$/, "");
}

/**
 * Fetch dynamic sister concern companies from apps/api (`GET /sister-companies`).
 * Falls back to static FALLBACK_LOGOS if the API is offline or returns empty.
 */
export async function getSisterCompanies(): Promise<ConcernLogo[]> {
  try {
    const res = await fetch(`${apiBase()}/sister-companies`, {
      next: { revalidate: 60, tags: ["sister-companies"] },
    });

    if (!res.ok) {
      return FALLBACK_LOGOS;
    }

    const data = (await res.json()) as { companies?: SisterCompanyItem[] };
    if (!data.companies || data.companies.length === 0) {
      return FALLBACK_LOGOS;
    }

    return data.companies.map((c) => ({
      src: c.logoUrl,
      href: c.websiteUrl || undefined,
    }));
  } catch (err) {
    console.warn("[sister-companies] Could not reach API, using static fallback logos", err);
    return FALLBACK_LOGOS;
  }
}
