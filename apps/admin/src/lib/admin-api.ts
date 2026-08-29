import "server-only";

/** Server-only client for apps/api `/admin/*`. */
function adminBaseUrl(): string {
  const base = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL)?.replace(/\/$/, "");
  if (!base) throw new Error("Set API_URL (or NEXT_PUBLIC_API_URL)");
  return `${base}/admin`;
}

export async function adminApiFetch(
  path: string,
  init: RequestInit & { sessionToken?: string | null } = {}
): Promise<Response> {
  const { sessionToken, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  if (!headers.has("User-Agent")) headers.set("User-Agent", "RVCC-Admin-SSR/1.0");
  if (sessionToken) headers.set("X-Admin-Session", sessionToken);

  return fetch(`${adminBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`, {
    ...rest,
    headers,
    cache: "no-store",
  });
}

/** @deprecated Use adminApiFetch */
export const adminWorkerFetch = adminApiFetch;

export function apiConfigured(): boolean {
  return Boolean(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL);
}

/** @deprecated Use apiConfigured */
export const workerConfigured = apiConfigured;
