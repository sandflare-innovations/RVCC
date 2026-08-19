/**
 * Two-tier PDF cache:
 *   L1 — module-level Map<string, ArrayBuffer>  (instant, same session)
 *   L2 — Cache API  (survives soft navigations, cleared by browser normally)
 *
 * All public helpers are safe to call during SSR (they no-op).
 */

const CACHE_NAME = "rvcc-pdf-v1";

const memoryCache = new Map<string, ArrayBuffer>();

function normalizeKey(url: string): string {
  if (typeof window === "undefined") return url;
  try {
    const u = new URL(url, window.location.href);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

/** Store PDF bytes in both L1 (memory) and L2 (Cache API). */
export async function cachePdf(url: string, buf: ArrayBuffer): Promise<void> {
  const key = normalizeKey(url);
  memoryCache.set(key, buf);

  if (typeof caches === "undefined") return;
  try {
    const store = await caches.open(CACHE_NAME);
    const res = new Response(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "X-Cached-At": String(Date.now()),
      },
    });
    await store.put(key, res);
  } catch {
    /* quota or private-browsing — L1 still works */
  }
}

/**
 * Retrieve cached PDF.
 * Returns an object-URL string that react-pdf can consume directly,
 * or null if not cached.
 */
export async function getCachedPdfUrl(url: string): Promise<string | null> {
  const key = normalizeKey(url);

  const mem = memoryCache.get(key);
  if (mem) return URL.createObjectURL(new Blob([mem], { type: "application/pdf" }));

  if (typeof caches === "undefined") return null;
  try {
    const store = await caches.open(CACHE_NAME);
    const res = await store.match(key);
    if (!res) return null;
    const buf = await res.arrayBuffer();
    memoryCache.set(key, buf);
    return URL.createObjectURL(new Blob([buf], { type: "application/pdf" }));
  } catch {
    return null;
  }
}

/** Check if a PDF is already cached (memory only — synchronous). */
export function hasCachedPdf(url: string): boolean {
  return memoryCache.has(normalizeKey(url));
}

/** Fetch a PDF, cache it, return an object-URL. */
export async function fetchAndCachePdf(url: string): Promise<string> {
  const cached = await getCachedPdfUrl(url);
  if (cached) return cached;

  const res = await fetch(url, { credentials: "omit" });
  if (!res.ok) throw new Error(`PDF fetch failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  await cachePdf(url, buf);
  return URL.createObjectURL(new Blob([buf], { type: "application/pdf" }));
}
