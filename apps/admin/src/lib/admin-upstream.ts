import "server-only";

import { adminApiFetch } from "@/lib/admin-api";

const RETRYABLE = new Set([429, 502, 503, 504]);
const RETRY_DELAYS_MS = [0, 150, 400, 900];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** GET to apps/api with retries for cold-start / transient upstream failures. */
export async function adminUpstreamGet(path: string, sessionToken: string): Promise<Response> {
  let last: Response | null = null;

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    if (RETRY_DELAYS_MS[attempt]) await sleep(RETRY_DELAYS_MS[attempt]!);

    try {
      const res = await adminApiFetch(path, { method: "GET", sessionToken });
      if (res.status === 401 || res.status === 403) return res;
      if (res.ok) return res;
      last = res;
      if (!RETRYABLE.has(res.status) || attempt === RETRY_DELAYS_MS.length - 1) return res;
    } catch (err) {
      if (attempt === RETRY_DELAYS_MS.length - 1) throw err;
    }
  }

  return last ?? new Response(JSON.stringify({ error: "Upstream unavailable." }), { status: 503 });
}

export type AdminListResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

/** Proxy a JSON array list endpoint — never confuse failures with an empty list. */
export async function proxyAdminList<T>(
  path: string,
  sessionToken: string,
  logLabel: string
): Promise<AdminListResult<T[]>> {
  try {
    const res = await adminUpstreamGet(path, sessionToken);
    const data = await res.json().catch(() => null);

    if (res.status === 401) {
      return { ok: false, status: 401, error: "Not signed in." };
    }
    if (res.status === 403) {
      return { ok: false, status: 403, error: "Your role does not permit this action." };
    }
    if (!res.ok || !Array.isArray(data)) {
      console.error(`[admin BFF ${logLabel}] upstream`, res.status, data);
      return {
        ok: false,
        status: res.status || 503,
        error: "Could not reach the data service. Retrying…",
      };
    }

    return { ok: true, data: data as T[] };
  } catch (err) {
    console.error(`[admin BFF ${logLabel}]`, err);
    return { ok: false, status: 503, error: "Upstream unavailable." };
  }
}

/** Proxy a JSON object endpoint. */
export async function proxyAdminGet<T>(
  path: string,
  sessionToken: string,
  logLabel: string
): Promise<AdminListResult<T>> {
  try {
    const res = await adminUpstreamGet(path, sessionToken);
    const data = await res.json().catch(() => null);

    if (res.status === 401) {
      return { ok: false, status: 401, error: "Not signed in." };
    }
    if (res.status === 403) {
      return { ok: false, status: 403, error: "Your role does not permit this action." };
    }
    if (!res.ok || !data) {
      console.error(`[admin BFF ${logLabel}] upstream`, res.status, data);
      return {
        ok: false,
        status: res.status || 503,
        error: "Could not reach the data service. Retrying…",
      };
    }

    return { ok: true, data: data as T };
  } catch (err) {
    console.error(`[admin BFF ${logLabel}]`, err);
    return { ok: false, status: 503, error: "Upstream unavailable." };
  }
}
