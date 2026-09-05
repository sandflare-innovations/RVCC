import "server-only";

import { DOCUMENTS as FALLBACK_DOCUMENTS, type DocumentItem } from "@/data/documents";

function apiBase(): string {
  const envUrl = process.env.API_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  if (process.env.NODE_ENV !== "production") {
    return "http://127.0.0.1:4000";
  }
  return "https://rvcc-api.rvcc.workers.dev";
}

export type WebDocumentItem = DocumentItem & {
  sizeBytes?: number;
  pageCount?: number;
  requiresAuth?: boolean;
};

/**
 * Fetch all published company documents from the API.
 * Falls back to bundled static documents if API is unreachable.
 */
export async function getDocuments(): Promise<WebDocumentItem[]> {
  try {
    const res = await fetch(`${apiBase()}/documents`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.warn(`[getDocuments] API returned status ${res.status}, using fallback`);
      return FALLBACK_DOCUMENTS;
    }

    const data = await res.json();
    if (!Array.isArray(data.documents) || data.documents.length === 0) {
      return FALLBACK_DOCUMENTS;
    }

    return data.documents.map((d: any) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      category: (d.category || "Profile") as DocumentItem["category"],
      description: d.description || "",
      fileSize: d.fileSize || "0 MB",
      sizeBytes: d.sizeBytes,
      pageCount: d.pageCount,
      filePath: d.filePath || d.fileUrl,
      fileUrl: d.fileUrl,
      image: d.coverImage || "/images/books/company-profile.webp",
      requiresAuth: Boolean(d.requiresAuth),
      updatedAt: d.updatedAt
        ? new Date(d.updatedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : "March 2026",
    }));
  } catch (err) {
    console.warn("[getDocuments] Fetch failed, falling back to static:", err);
    return FALLBACK_DOCUMENTS;
  }
}

/**
 * Fetch a single company document by slug from the API.
 */
export async function getDocumentBySlug(slug: string): Promise<WebDocumentItem | null> {
  try {
    const res = await fetch(`${apiBase()}/documents/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      const fallback = FALLBACK_DOCUMENTS.find((d) => d.slug === slug);
      return fallback || null;
    }

    const data = await res.json();
    if (!data.document) {
      const fallback = FALLBACK_DOCUMENTS.find((d) => d.slug === slug);
      return fallback || null;
    }

    const d = data.document;
    return {
      id: d.id,
      slug: d.slug,
      title: d.title,
      category: (d.category || "Profile") as DocumentItem["category"],
      description: d.description || "",
      fileSize: d.fileSize || "0 MB",
      sizeBytes: d.sizeBytes,
      pageCount: d.pageCount,
      filePath: d.filePath || d.fileUrl,
      fileUrl: d.fileUrl,
      image: d.coverImage || "/images/books/company-profile.webp",
      requiresAuth: Boolean(d.requiresAuth),
      updatedAt: d.updatedAt
        ? new Date(d.updatedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : "March 2026",
    };
  } catch (err) {
    console.warn(`[getDocumentBySlug/${slug}] Fetch failed, using fallback:`, err);
    const fallback = FALLBACK_DOCUMENTS.find((d) => d.slug === slug);
    return fallback || null;
  }
}
