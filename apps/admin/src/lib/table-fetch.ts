/** Resilient table fetch — dedupes parallel mounts, retries cold-start auth/service errors. */

import { ADMIN_LOGIN_EXPIRED_PATH } from "@/lib/constants";

const RETRY_DELAYS_MS = [0, 300, 800, 1500];
const RETRYABLE = new Set([429, 502, 503, 504]);

const inflight = new Map<string, Promise<TableFetchResult<unknown>>>();
let authRedirectScheduled = false;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function scheduleAuthRedirect() {
  if (authRedirectScheduled || typeof window === "undefined") return;
  authRedirectScheduled = true;
  window.location.replace(ADMIN_LOGIN_EXPIRED_PATH);
}

export type TableFetchResult<T> =
  { ok: true; data: T } | { ok: false; status: number; error: string };

async function fetchTableJsonOnce<T>(url: string): Promise<TableFetchResult<T>> {
  const lastAttempt = RETRY_DELAYS_MS.length - 1;

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    if (RETRY_DELAYS_MS[attempt]) await sleep(RETRY_DELAYS_MS[attempt]!);

    try {
      const res = await fetch(url, { credentials: "include", cache: "no-store" });
      const data = (await res.json().catch(() => null)) as T | { error?: string } | null;

      if (res.ok && Array.isArray(data)) {
        return { ok: true, data: data as T };
      }

      const error =
        (data && typeof data === "object" && "error" in data && data.error) ||
        `Could not load data (${res.status || "network"}).`;

      // Transient 401 while Worker DB pool warms — retry before treating as signed-out.
      if (res.status === 401 && attempt < lastAttempt) continue;
      if (res.status === 401) {
        scheduleAuthRedirect();
        return { ok: false, status: 401, error: "Session expired — redirecting to sign in…" };
      }

      if (RETRYABLE.has(res.status) && attempt < lastAttempt) continue;

      return { ok: false, status: res.status || 503, error: String(error) };
    } catch {
      if (attempt === lastAttempt) {
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
