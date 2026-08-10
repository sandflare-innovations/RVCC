import "server-only";

/**
 * Server-only client for workers/admin-api.
 * Browser never sees ADMIN_API_SECRET — only the Next BFF calls this.
 */
export async function adminWorkerFetch(
  path: string,
  init: RequestInit & { sessionToken?: string | null } = {}
): Promise<Response> {
  const base = process.env.ADMIN_API_URL?.replace(/\/$/, "");
  const secret = process.env.ADMIN_API_SECRET;
  if (!base || !secret) {
    throw new Error("ADMIN_API_URL and ADMIN_API_SECRET must be set");
  }

  const { sessionToken, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);
  headers.set("Authorization", `Bearer ${secret}`);
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  if (sessionToken) headers.set("X-Admin-Session", sessionToken);

  return fetch(`${base}${path.startsWith("/") ? path : `/${path}`}`, {
    ...rest,
    headers,
    cache: "no-store",
  });
}

export function workerConfigured(): boolean {
  return Boolean(process.env.ADMIN_API_URL && process.env.ADMIN_API_SECRET);
}
