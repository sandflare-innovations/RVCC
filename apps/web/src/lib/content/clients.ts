import "server-only";

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
 */
export async function getClientPartners(): Promise<ClientPartnerItem[]> {
  try {
    const res = await fetch(`${apiBase()}/clients`, {
      next: { revalidate: 60, tags: ["clients"] },
    });

    if (!res.ok) {
      console.warn(`[clients] API returned status ${res.status}`);
      return [];
    }

    const data = (await res.json()) as { clients?: ClientPartnerItem[] };
    if (!data.clients || !Array.isArray(data.clients)) {
      return [];
    }

    return data.clients;
  } catch (err) {
    console.error("[clients] Could not reach API:", err);
    return [];
  }
}

