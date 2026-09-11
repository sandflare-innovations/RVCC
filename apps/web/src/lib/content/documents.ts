import "server-only";

import type { DocumentItem } from "@/data/documents";
import { apiFetch } from "@/lib/api-fetch";
import { DOCUMENTS_CACHE_TAG, DOCUMENTS_REVALIDATE_SECONDS } from "@/lib/cache";

export type WebDocumentItem = DocumentItem;

function mapDocumentItem(d: any): WebDocumentItem {
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
}

/**
 * Fetch all published company documents dynamically from the API.
 */
export async function getDocuments(): Promise<WebDocumentItem[]> {
  const data = await apiFetch<{ documents?: any[] }>(
    "/documents",
    {
      next: { revalidate: DOCUMENTS_REVALIDATE_SECONDS, tags: [DOCUMENTS_CACHE_TAG] },
    },
    "documents"
  );

  if (!data?.documents || !Array.isArray(data.documents)) {
    return [];
  }

  return data.documents.map(mapDocumentItem);
}

/**
 * Fetch a single company document dynamically by slug from the API.
 */
export async function getDocumentBySlug(slug: string): Promise<WebDocumentItem | null> {
  const data = await apiFetch<{ document?: any }>(
    `/documents/${encodeURIComponent(slug)}`,
    {
      next: { revalidate: DOCUMENTS_REVALIDATE_SECONDS, tags: [DOCUMENTS_CACHE_TAG] },
    },
    `documents/${slug}`
  );

  if (!data?.document) {
    return null;
  }

  return mapDocumentItem(data.document);
}

