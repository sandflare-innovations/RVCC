import "server-only";

import { apiFetch } from "@/lib/api-fetch";
import { CLIENTS_CACHE_TAG, CLIENTS_REVALIDATE_SECONDS } from "@/lib/cache";

export interface ClientPartnerItem {
  id: string;
  name: string;
  logoUrl: string;
  industry: string;
  websiteUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
}

/**
 * Fetch dynamic client partners from apps/api (`GET /clients`).
 */
export async function getClientPartners(): Promise<ClientPartnerItem[]> {
  const data = await apiFetch<{ clients?: ClientPartnerItem[] }>(
    "/clients",
    {
      next: { revalidate: CLIENTS_REVALIDATE_SECONDS, tags: [CLIENTS_CACHE_TAG] },
    },
    "clients"
  );

  if (!data || !data.clients || !Array.isArray(data.clients)) {
    return [];
  }

  return data.clients;
}
