/**
 * RVCC PDF CDN — Cloudflare Worker
 *
 * Most files are served natively by Workers Static Assets (Range + CORS via _headers).
 * This Worker handles cache misses only — mainly the oversized water-feature PDF via
 * Vercel origin + Cache API.
 */

export interface Env {
  FILES?: Fetcher;
  ASSETS?: R2Bucket;
  ORIGIN_URL?: string;
  ALLOWED_ORIGINS?: string;
}

const CACHE_CONTROL = "public, max-age=31536000, immutable";

function corsHeaders(request: Request, env: Env): HeadersInit {
  const allowed = (env.ALLOWED_ORIGINS || "*").trim();
  const origin = request.headers.get("Origin");

  let allowOrigin = "*";
  if (allowed !== "*") {
    const list = allowed.split(",").map((s) => s.trim()).filter(Boolean);
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

function withCdnHeaders(
  request: Request,
  env: Env,
  source: string,
  res: Response,
  key: string
): Response {
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders(request, env)).forEach(([k, v]) => headers.set(k, v));
  headers.set("Cache-Control", CACHE_CONTROL);
  headers.set("X-CDN-Source", source);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", contentTypeForKey(key));
  }
  headers.set("Accept-Ranges", "bytes");

  if (request.method === "HEAD") {
    return new Response(null, { status: res.status, headers });
  }
  return new Response(res.body, { status: res.status, headers });
}

function applyRangeHeaders(
  headers: Headers,
  object: R2ObjectBody,
  hadRange: boolean
): number {
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

async function serveFromR2(
  request: Request,
  env: Env,
  key: string
): Promise<Response | null> {
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
        hint: "Set ORIGIN_URL to https://rvcc-dev.vercel.app",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json", ...corsHeaders(request, env) },
      }
    );
  }

  const cache = caches.default;
  const cacheKey = new Request(`https://pdf-cdn-cache.internal/${key}`, { method: "GET" });

  const cached = await cache.match(cacheKey);
  if (cached) {
    return withCdnHeaders(request, env, "edge-cache", cached, key);
  }

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

  const headers = new Headers(corsHeaders(request, env));
  headers.set("Content-Type", upstream.headers.get("Content-Type") || contentTypeForKey(key));
  headers.set("Cache-Control", CACHE_CONTROL);
  headers.set("Accept-Ranges", "bytes");
  headers.set("X-CDN-Source", "origin-vercel");

  const responseForCache = new Response(upstream.body, { status: 200, headers });
  ctx.waitUntil(cache.put(cacheKey, responseForCache.clone()));

  if (request.method === "HEAD") return new Response(null, { status: 200, headers });
  return responseForCache;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
          layers: [
            "cloudflare-assets (most PDFs + pdf.js worker)",
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

    // Static Assets are served by the platform before this Worker runs.
    // We only reach here for files not staged (e.g. water-feature 166MB).

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
