import "server-only";

/**
 * Server-only client for workers/vendor-api.
 * Browser never sees VENDOR_API_SECRET — only the Next BFF calls this.
 */
export async function vendorWorkerFetch(
  path: string,
  init: RequestInit & { sessionToken?: string | null } = {}
): Promise<Response> {
  const base = process.env.VENDOR_API_URL?.replace(/\/$/, "");
  const secret = process.env.VENDOR_API_SECRET;
  if (!base || !secret) {
    throw new Error("VENDOR_API_URL and VENDOR_API_SECRET must be set");
  }

  const { sessionToken, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);
  headers.set("Authorization", `Bearer ${secret}`);
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  if (sessionToken) headers.set("X-Vendor-Session", sessionToken);

  return fetch(`${base}${path.startsWith("/") ? path : `/${path}`}`, {
    ...rest,
    headers,
    cache: "no-store",
  });
}

export function workerConfigured(): boolean {
  return Boolean(process.env.VENDOR_API_URL && process.env.VENDOR_API_SECRET);
}
