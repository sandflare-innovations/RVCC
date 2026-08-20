/** Resilient table fetch — dedupes parallel mounts and retries cold-start 503s. */

const RETRYABLE = new Set([0, 429, 502, 503, 504]);
const RETRY_DELAYS_MS = [0, 250, 700, 1500];

const inflight = new Map<string, Promise<TableFetchResult<unknown>>>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type TableFetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

async function fetchTableJsonOnce<T>(url: string): Promise<TableFetchResult<T>> {
  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    if (RETRY_DELAYS_MS[attempt]) await sleep(RETRY_DELAYS_MS[attempt]!);

    try {
      const res = await fetch(url, { credentials: "include" });
      const data = (await res.json().catch(() => null)) as T | { error?: string } | null;

      if (res.status === 401) {
        return { ok: false, status: 401, error: "Not signed in." };
      }

      if (res.ok && Array.isArray(data)) {
        return { ok: true, data: data as T };
      }

      const error =
        (data && typeof data === "object" && "error" in data && data.error) ||
        `Could not load data (${res.status || "network"}).`;

      if (!RETRYABLE.has(res.status) || attempt === RETRY_DELAYS_MS.length - 1) {
        return { ok: false, status: res.status || 503, error: String(error) };
      }
    } catch {
      if (attempt === RETRY_DELAYS_MS.length - 1) {
        return { ok: false, status: 0, error: "Network error — please try again." };
      }
    }
  }

  return { ok: false, status: 503, error: "Service unavailable." };
}

/** GET a JSON array for admin tables — shares one in-flight request per URL. */
export function fetchTableJson<T>(url: string): Promise<TableFetchResult<T[]>> {
  const existing = inflight.get(url);
  if (existing) return existing as Promise<TableFetchResult<T[]>>;

  const promise = fetchTableJsonOnce<T[]>(url).finally(() => {
    inflight.delete(url);
  });
  inflight.set(url, promise as Promise<TableFetchResult<unknown>>);
  return promise;
}
