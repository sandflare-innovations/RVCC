import "server-only";

/** Server-only client for apps/api `/vendor/*`. */
function vendorBaseUrl(): string {
  const base = (process.env.API_URL || process.env.VENDOR_API_URL)?.replace(/\/$/, "");
  if (!base) throw new Error("Set API_URL");
  return `${base}/vendor`;
}

/**
 * Wraps a native Response to fix a Next.js 15 / Turbopack bug where
 * fetch() responses are wrapped in internal Proxy objects whose .json()
 * method returns a Proxy rather than a plain object, causing NextResponse.json()
 * to fail with 500/503 when serializing the result.
 *
 * By overriding .json() to always go through .text() + JSON.parse we guarantee
 * a plain JS object is returned, fixing ALL proxy API routes in one place.
 */
function patchResponse(raw: Response): Response {
  return new Proxy(raw, {
    get(target, prop) {
      if (prop === "json") {
        return async () => {
          const text = await target.text();
          try {
            return JSON.parse(text);
          } catch {
            return {};
          }
        };
      }
      const val = (target as any)[prop];
      return typeof val === "function" ? val.bind(target) : val;
    },
  });
}

export async function vendorApiFetch(
  path: string,
  init: RequestInit & { sessionToken?: string | null } = {}
): Promise<Response> {
  const { sessionToken, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  if (sessionToken) headers.set("X-Vendor-Session", sessionToken);

  const raw = await fetch(`${vendorBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`, {
    ...rest,
    headers,
    cache: "no-store",
  });
  return patchResponse(raw);
}

export function apiConfigured(): boolean {
  return Boolean(process.env.API_URL || process.env.VENDOR_API_URL);
}

/** @deprecated Use vendorApiFetch */
export const vendorWorkerFetch = vendorApiFetch;

/** @deprecated Use apiConfigured */
export const workerConfigured = apiConfigured;
