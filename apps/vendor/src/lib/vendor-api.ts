import "server-only";

/** Server-only client for apps/api `/vendor/*`. */
function vendorBaseUrl(): string {
  const base = (process.env.API_URL || process.env.VENDOR_API_URL || "http://localhost:4000")?.replace(/\/$/, "");
  return `${base}/vendor`;
}

export async function vendorApiFetch(
  path: string,
  init: RequestInit & { sessionToken?: string | null } = {}
): Promise<Response> {
  const { sessionToken, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  if (sessionToken) headers.set("X-Vendor-Session", sessionToken);

  return fetch(`${vendorBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`, {
    ...rest,
    headers,
    cache: "no-store",
  });
}

export function apiConfigured(): boolean {
  return Boolean(process.env.API_URL || process.env.VENDOR_API_URL);
}

/** @deprecated Use vendorApiFetch */
export const vendorWorkerFetch = vendorApiFetch;

/** @deprecated Use apiConfigured */
export const workerConfigured = apiConfigured;

