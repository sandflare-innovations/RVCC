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
  return "";
}

export async function getPublicMedia(id: string): Promise<PublicMediaFile | null> {
  const base = apiBase();
  if (!base) return null;

  try {
    const res = await fetch(`${base}/media/${encodeURIComponent(id)}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(2000),
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
