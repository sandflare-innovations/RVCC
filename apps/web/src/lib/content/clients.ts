import "server-only";

import { clients as FALLBACK_CLIENTS } from "@/data/clients";

export interface ClientPartnerItem {
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
 * Fetch dynamic client partners from apps/api (`GET /clients`).
 * Falls back to static FALLBACK_CLIENTS if the API is offline or returns empty.
 */
export async function getClientPartners(): Promise<ClientPartnerItem[]> {
  try {
    const res = await fetch(`${apiBase()}/clients`, {
      next: { revalidate: 60, tags: ["clients"] },
    });

    if (!res.ok) {
      return FALLBACK_CLIENTS.map((c) => ({
        id: String(c.id),
        name: c.name,
        logoUrl: c.logo,
        industry: c.industry,
        sortOrder: c.id,
        isActive: true,
      }));
    }

    const data = (await res.json()) as { clients?: ClientPartnerItem[] };
    if (!data.clients || data.clients.length === 0) {
      return FALLBACK_CLIENTS.map((c) => ({
        id: String(c.id),
        name: c.name,
        logoUrl: c.logo,
        industry: c.industry,
        sortOrder: c.id,
        isActive: true,
      }));
    }

    return data.clients;
  } catch (err) {
    console.warn("[clients] Could not reach API, using static fallback clients", err);
    return FALLBACK_CLIENTS.map((c) => ({
      id: String(c.id),
      name: c.name,
      logoUrl: c.logo,
      industry: c.industry,
      sortOrder: c.id,
      isActive: true,
    }));
  }
}
