import "server-only";

export type PublicMediaFile = {
  id: string;
  name: string;
  originalName: string;
  fileUrl: string;
  fileType: "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO" | "OTHER";
  mimeType: string;
  sizeBytes: number;
  extension: string;
  description?: string | null;
  createdAt: string;
  folder?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

function apiBase(): string {
  const envUrl = process.env.API_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  if (process.env.NODE_ENV !== "production") {
    return "http://127.0.0.1:4000";
  }
  return "https://rvcc-api.rvcc.workers.dev";
}

export async function getPublicMedia(id: string): Promise<PublicMediaFile | null> {
  try {
    const res = await fetch(`${apiBase()}/media/${encodeURIComponent(id)}`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as { ok?: boolean; file?: PublicMediaFile };
    return data.file || null;
  } catch (err) {
    console.error(`[media/${id}] Fetch error:`, err);
    return null;
  }
}
