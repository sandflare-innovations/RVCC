import "server-only";

import type { DocumentItem } from "@/data/documents";

function apiBase(): string {
  const envUrl = process.env.API_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  if (process.env.NODE_ENV !== "production") {
    return "http://127.0.0.1:4000";
  }
  return "https://rvcc-api.rvcc.workers.dev";
}

export type WebDocumentItem = DocumentItem;

/**
 * Fetch all published company documents dynamically from the API.
 */
export async function getDocuments(): Promise<WebDocumentItem[]> {
  try {
    const res = await fetch(`${apiBase()}/documents`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.warn(`[getDocuments] API returned status ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data.documents)) {
      return [];
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
    console.error("[getDocuments] Fetch failed:", err);
    return [];
  }
}

/**
 * Fetch a single company document dynamically by slug from the API.
 */
export async function getDocumentBySlug(slug: string): Promise<WebDocumentItem | null> {
  try {
    const res = await fetch(`${apiBase()}/documents/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (!data.document) {
      return null;
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
    console.error(`[getDocumentBySlug/${slug}] Fetch failed:`, err);
    return null;
  }
}

