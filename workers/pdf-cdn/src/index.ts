/**
 * RVCC PDF CDN — Cloudflare Worker
 *
 * run_worker_first=true so we handle OPTIONS + Range before Static Assets.
 * Assets (≤25MB) are fetched via FILES binding (native 206 when Range works).
 * Oversized PDFs pull from Vercel once, then Cache API (no fake Accept-Ranges).
 */

export interface Env {
  FILES?: Fetcher;
  ASSETS?: R2Bucket;
  ORIGIN_URL?: string;
  ALLOWED_ORIGINS?: string;
}

const CACHE_CONTROL = "public, max-age=31536000, immutable";
/** Only slice in-Worker when the object fits comfortably in memory. */
const MAX_MANUAL_RANGE_BYTES = 30 * 1024 * 1024;

function corsHeaders(request: Request, env: Env): HeadersInit {
  const allowed = (env.ALLOWED_ORIGINS || "*").trim();
  const origin = request.headers.get("Origin");

  let allowOrigin = "*";
  if (allowed !== "*") {
    const list = allowed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (origin && list.includes(origin)) allowOrigin = origin;
    else if (list[0]) allowOrigin = list[0];
  } else if (origin) {
    allowOrigin = origin;
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Range, If-None-Match, If-Modified-Since",
    "Access-Control-Expose-Headers":
      "Accept-Ranges, Content-Range, Content-Length, Content-Type, ETag, Cache-Control, X-CDN-Source",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function contentTypeForKey(key: string): string {
  if (key.endsWith(".pdf")) return "application/pdf";
  if (key.endsWith(".mjs")) return "text/javascript; charset=utf-8";
  if (key.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (key.endsWith(".json")) return "application/json; charset=utf-8";
  return "application/octet-stream";
}

function normalizeKey(pathname: string): string | null {
  if (pathname === "/health" || pathname === "/") return null;
  if (!pathname.startsWith("/pdf/") && !pathname.startsWith("/pdfjs/")) return null;
  if (pathname.includes("..")) return null;
  return pathname.replace(/^\/+/, "");
}

function parseByteRange(
  rangeHeader: string,
  size: number
): { start: number; end: number } | "invalid" | null {
  const m = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
  if (!m) return "invalid";

  const hasStart = m[1] !== "";
  const hasEnd = m[2] !== "";
  if (!hasStart && !hasEnd) return "invalid";

  let start: number;
  let end: number;

  if (!hasStart) {
    // bytes=-N (last N bytes)
    const suffix = parseInt(m[2], 10);
    if (Number.isNaN(suffix) || suffix <= 0) return "invalid";
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = parseInt(m[1], 10);
    end = hasEnd ? parseInt(m[2], 10) : size - 1;
    if (Number.isNaN(start) || Number.isNaN(end)) return "invalid";
  }

  if (start < 0 || start >= size || end < start) return "invalid";
  end = Math.min(end, size - 1);
  return { start, end };
}

function withCors(
  request: Request,
  env: Env,
  res: Response,
  source: string,
  extra?: HeadersInit
): Response {
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders(request, env)).forEach(([k, v]) => headers.set(k, v));
  headers.set("X-CDN-Source", source);
  headers.set("Cache-Control", headers.get("Cache-Control") || CACHE_CONTROL);
  if (extra) Object.entries(extra).forEach(([k, v]) => headers.set(k, String(v)));

  if (request.method === "HEAD") {
    return new Response(null, { status: res.status, headers });
  }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

/** Turn a full 200 body into a proper 206 when the platform ignored Range. */
async function forceByteRangeIfNeeded(
  request: Request,
  env: Env,
  res: Response,
  source: string,
  key: string
): Promise<Response> {
  const rangeHeader = request.headers.get("Range");
  if (!rangeHeader || res.status === 206 || res.status === 416) {
    const out = withCors(request, env, res, source);
    if (!out.headers.has("Accept-Ranges")) out.headers.set("Accept-Ranges", "bytes");
    return out;
  }

  if (res.status !== 200) {
    return withCors(request, env, res, source);
  }

  const lenHeader = res.headers.get("Content-Length");
  const declared = lenHeader ? parseInt(lenHeader, 10) : NaN;
  if (!Number.isNaN(declared) && declared > MAX_MANUAL_RANGE_BYTES) {
    // Too large to slice here — do not advertise ranges (avoids pdf.js corruption).
    const headers = new Headers(withCors(request, env, res, source).headers);
    headers.delete("Accept-Ranges");
    return new Response(res.body, { status: 200, headers });
  }

  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_MANUAL_RANGE_BYTES) {
    const headers = new Headers(corsHeaders(request, env));
    headers.set("Content-Type", res.headers.get("Content-Type") || contentTypeForKey(key));
    headers.set("Cache-Control", CACHE_CONTROL);
    headers.set("X-CDN-Source", source);
    headers.set("Content-Length", String(buf.byteLength));
    // No Accept-Ranges
    if (request.method === "HEAD") return new Response(null, { status: 200, headers });
    return new Response(buf, { status: 200, headers });
  }

  const parsed = parseByteRange(rangeHeader, buf.byteLength);
  if (parsed === "invalid") {
    const headers = new Headers(corsHeaders(request, env));
    headers.set("Content-Range", `bytes */${buf.byteLength}`);
    headers.set("X-CDN-Source", source);
    return new Response(null, { status: 416, headers });
  }
  if (!parsed) {
    return withCors(
      request,
      env,
      new Response(buf, { status: 200, headers: res.headers }),
      source,
      {
        "Accept-Ranges": "bytes",
        "Content-Length": String(buf.byteLength),
      }
    );
  }

  const { start, end } = parsed;
  const slice = buf.slice(start, end + 1);
  const headers = new Headers(corsHeaders(request, env));
  headers.set("Content-Type", res.headers.get("Content-Type") || contentTypeForKey(key));
  headers.set("Cache-Control", CACHE_CONTROL);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Range", `bytes ${start}-${end}/${buf.byteLength}`);
  headers.set("Content-Length", String(slice.byteLength));
  headers.set("X-CDN-Source", source);
  if (res.headers.has("ETag")) headers.set("ETag", res.headers.get("ETag")!);

  if (request.method === "HEAD") return new Response(null, { status: 206, headers });
  return new Response(slice, { status: 206, headers });
}

async function serveFromFiles(request: Request, env: Env, key: string): Promise<Response | null> {
  if (!env.FILES) return null;

  // Fetch the full object without Range. Passing Range into FILES.fetch can
  // return an empty body (→ 416 */0). We apply byte ranges ourselves below.
  const fullReq = new Request(request.url, {
    method: "GET",
    headers: (() => {
      const h = new Headers();
      const inm = request.headers.get("If-None-Match");
      const ims = request.headers.get("If-Modified-Since");
      if (inm) h.set("If-None-Match", inm);
      if (ims) h.set("If-Modified-Since", ims);
      return h;
    })(),
  });

  const assetRes = await env.FILES.fetch(fullReq);
  if (assetRes.status === 404) return null;
  if (assetRes.status === 304) {
    return withCors(request, env, assetRes, "cloudflare-assets");
  }

  const rangeHeader = request.headers.get("Range");
  if (!rangeHeader) {
    const out = withCors(request, env, assetRes, "cloudflare-assets");
    out.headers.set("Accept-Ranges", "bytes");
    return out;
  }

  return forceByteRangeIfNeeded(request, env, assetRes, "cloudflare-assets", key);
}

function applyRangeHeaders(headers: Headers, object: R2ObjectBody, hadRange: boolean): number {
  headers.set("Accept-Ranges", "bytes");
  headers.set("etag", object.httpEtag);

  if (hadRange && object.range) {
    const offset = "offset" in object.range ? object.range.offset : 0;
    const length =
      "length" in object.range && object.range.length != null
        ? object.range.length
        : object.size - offset;
    const end = offset + length - 1;
    headers.set("Content-Range", `bytes ${offset}-${end}/${object.size}`);
    headers.set("Content-Length", String(length));
    return 206;
  }

  headers.set("Content-Length", String(object.size));
  return 200;
}

async function serveFromR2(request: Request, env: Env, key: string): Promise<Response | null> {
  if (!env.ASSETS) return null;

  const hadRange = request.headers.has("Range");
  const object = await env.ASSETS.get(key, {
    onlyIf: request.headers,
    range: request.headers,
  });

  if (object === null) return null;

  if (!("body" in object) || object.body === undefined) {
    const headers = new Headers(corsHeaders(request, env));
    headers.set("etag", object.httpEtag);
    return new Response(null, { status: 304, headers });
  }

  const headers = new Headers(corsHeaders(request, env));
  object.writeHttpMetadata(headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", contentTypeForKey(key));
  headers.set("Cache-Control", CACHE_CONTROL);
  headers.set("X-CDN-Source", "r2");

  const status = applyRangeHeaders(headers, object, hadRange);
  if (request.method === "HEAD") return new Response(null, { status, headers });
  return new Response(object.body, { status, headers });
}

/** Oversized PDFs not in Static Assets: pull from Vercel, then Cache API. */
async function serveFromOrigin(
  request: Request,
  env: Env,
  key: string,
  ctx: ExecutionContext
): Promise<Response | null> {
  const origin = env.ORIGIN_URL?.replace(/\/$/, "");
  if (!origin) return null;

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
    return new Response(
      JSON.stringify({
        error: "ORIGIN_URL cannot be localhost on a deployed Worker",
        hint: "Set ORIGIN_URL to https://rvcc-prod.vercel.app",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json", ...corsHeaders(request, env) },
      }
    );
  }

  const cache = caches.default;
  const cacheKey = new Request(`https://pdf-cdn-cache.internal/${key}`, { method: "GET" });

  // Cache API can satisfy Range from a stored full response on some runtimes.
  const rangeHeader = request.headers.get("Range");
  if (rangeHeader) {
    const rangedKey = new Request(cacheKey.url, {
      method: "GET",
      headers: { Range: rangeHeader },
    });
    const rangedHit = await cache.match(rangedKey);
    if (rangedHit && rangedHit.status === 206) {
      return withCors(request, env, rangedHit, "edge-cache");
    }
  }

  let cached = await cache.match(cacheKey);
  if (!cached) {
    const upstream = await fetch(`${origin}/${key}`, {
      method: "GET",
      headers: { Accept: request.headers.get("Accept") || "*/*" },
      cf: { cacheTtl: 31_536_000, cacheEverything: true },
    });

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({
          error: "Origin fetch failed",
          origin: `${origin}/${key}`,
          status: upstream.status,
        }),
        {
          status: upstream.status === 404 ? 404 : 502,
          headers: { "Content-Type": "application/json", ...corsHeaders(request, env) },
        }
      );
    }

    const storeHeaders = new Headers();
    storeHeaders.set(
      "Content-Type",
      upstream.headers.get("Content-Type") || contentTypeForKey(key)
    );
    storeHeaders.set("Cache-Control", CACHE_CONTROL);
    // Intentionally omit Accept-Ranges on stored oversized objects.
    storeHeaders.set("X-CDN-Source", "origin-vercel");

    const responseForCache = new Response(upstream.body, { status: 200, headers: storeHeaders });
    ctx.waitUntil(cache.put(cacheKey, responseForCache.clone()));
    cached = responseForCache;
  }

  // Large origin objects: never lie about Range support.
  if (rangeHeader) {
    const len = parseInt(cached.headers.get("Content-Length") || "0", 10);
    if (!len || len > MAX_MANUAL_RANGE_BYTES) {
      const headers = new Headers(corsHeaders(request, env));
      headers.set("Content-Type", cached.headers.get("Content-Type") || contentTypeForKey(key));
      headers.set("Cache-Control", CACHE_CONTROL);
      headers.set("X-CDN-Source", cached.headers.get("X-CDN-Source") || "edge-cache");
      if (cached.headers.has("Content-Length")) {
        headers.set("Content-Length", cached.headers.get("Content-Length")!);
      }
      // No Accept-Ranges — pdf.js will full-fetch (safe).
      if (request.method === "HEAD") return new Response(null, { status: 200, headers });
      return new Response(cached.body, { status: 200, headers });
    }
    return forceByteRangeIfNeeded(request, env, cached, "edge-cache", key);
  }

  return withCors(request, env, cached, cached.headers.get("X-CDN-Source") || "edge-cache");
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Must run before Static Assets (run_worker_first) — assets alone returned 405 for OPTIONS.
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD, OPTIONS", ...corsHeaders(request, env) },
      });
    }

    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          ok: true,
          service: "rvcc-pdf-cdn",
          cdn: "https://rvcc-pdf-cdn.rvcc.workers.dev",
          range: "206 for assets ≤25MB; oversized origin objects do not advertise Range",
          layers: [
            "worker-first (OPTIONS + Range)",
            "cloudflare-assets via FILES binding",
            "r2 (optional)",
            "origin-vercel + edge cache (PDFs > 25MB)",
          ],
          origin: env.ORIGIN_URL || null,
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders(request, env) },
        }
      );
    }

    const key = normalizeKey(url.pathname);
    if (!key) {
      return new Response("Not Found", { status: 404, headers: corsHeaders(request, env) });
    }

    const fromFiles = await serveFromFiles(request, env, key);
    if (fromFiles) return fromFiles;

    const fromR2 = await serveFromR2(request, env, key);
    if (fromR2) return fromR2;

    const fromOrigin = await serveFromOrigin(request, env, key, ctx);
    if (fromOrigin) return fromOrigin;

    return new Response(
      JSON.stringify({
        error: "Asset not found",
        key,
        hint: "Run npm run deploy to stage assets, or ensure the file exists on ORIGIN_URL.",
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders(request, env) },
      }
    );
  },
} satisfies ExportedHandler<Env>;
