import "server-only";

import { apiFetch } from "@/lib/api-fetch";

export interface SisterCompanyItem {
  id: string;
  name: string;
  logoUrl: string;
  industry: string;
  websiteUrl?: string | null;
  sortOrder: number;
  isActive?: boolean;
}

export interface ConcernLogo {
  src: string;
  href?: string;
}

/**
 * Fetch dynamic sister concern companies from apps/api (`GET /sister-companies`).
 * Returns empty array and logs to terminal if API is offline or returns empty.
 */
export async function getSisterCompanies(): Promise<SisterCompanyItem[]> {
  const data = await apiFetch<{ companies?: SisterCompanyItem[] }>(
    "/sister-companies",
    {
      next: { revalidate: 60, tags: ["sister-companies"] },
    },
    "sister-companies"
  );

  if (!data || !data.companies || data.companies.length === 0) {
    return [];
  }

  return data.companies;
}
