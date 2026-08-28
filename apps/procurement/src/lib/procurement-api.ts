import "server-only";

/** Server-only client for apps/api `/admin/*` endpoints used by procurement staff. */
function apiBaseUrl(): string {
  const base = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL)?.replace(/\/$/, "");
  if (!base) throw new Error("Set API_URL (or NEXT_PUBLIC_API_URL)");
  return `${base}/admin`;
}

export async function procurementApiFetch(
  path: string,
  init: RequestInit & { sessionToken?: string | null } = {}
): Promise<Response> {
  const { sessionToken, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  if (sessionToken) headers.set("X-Admin-Session", sessionToken);

  return fetch(`${apiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`, {
    ...rest,
    headers,
    cache: "no-store",
  });
}
