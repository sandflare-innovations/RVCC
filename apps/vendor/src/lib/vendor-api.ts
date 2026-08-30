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

  const url = `${vendorBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  let res: Response;
  try {
    res = await fetch(url, { ...rest, headers, cache: "no-store" });
  } catch {
    // Retry once on network connection error (e.g. server restarting or sleep)
    await new Promise((r) => setTimeout(r, 200));
    res = await fetch(url, { ...rest, headers, cache: "no-store" });
  }

  // Retry once on transient 500/502/503 error
  if (!res.ok && (res.status === 500 || res.status === 502 || res.status === 503) && init.method !== "POST") {
    await new Promise((r) => setTimeout(r, 200));
    try {
      const retryRes = await fetch(url, { ...rest, headers, cache: "no-store" });
      if (retryRes.ok) return retryRes;
    } catch {}
  }

  return res;
}

export function apiConfigured(): boolean {
  return Boolean(process.env.API_URL || process.env.VENDOR_API_URL);
}

/** @deprecated Use vendorApiFetch */
export const vendorWorkerFetch = vendorApiFetch;

/** @deprecated Use apiConfigured */
export const workerConfigured = apiConfigured;

