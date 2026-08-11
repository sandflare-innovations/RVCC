export interface Env {
  /** Cloudflare Hyperdrive binding (preferred). */
  HYPERDRIVE?: { connectionString: string };
  /** Fallback direct Postgres URL (wrangler secret). Never expose to the browser. */
  DATABASE_URL?: string;
  /** Shared secret — Next.js BFF must send Authorization: Bearer <API_SECRET> */
  API_SECRET: string;
  /**
   * Comma-separated allowed Origins for CORS.
   * Leave unset/empty until configured; local wrangler.toml sets "*" for convenience.
   */
  ALLOWED_ORIGINS?: string;
  /** Enquire Worker base URL (no trailing slash) for decision mail. */
  ENQUIRE_WORKER_URL?: string;
  /** Shared secret for the enquire Worker. */
  ENQUIRE_API_SECRET?: string;
  /** Vendor portal origin (no trailing slash); mail links go to `${VENDOR_PORTAL_URL}/login`. */
  VENDOR_PORTAL_URL?: string;
}

export function corsHeaders(request: Request, env: Env): HeadersInit {
  const allowed = (env.ALLOWED_ORIGINS || "*").trim();
  const origin = request.headers.get("Origin");
  let allowOrigin = "";
  if (allowed === "*") {
    allowOrigin = origin || "*";
  } else if (allowed) {
    const list = allowed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (origin && list.includes(origin)) allowOrigin = origin;
    else if (list[0]) allowOrigin = list[0];
  }
  return {
    "Access-Control-Allow-Origin": allowOrigin || "null",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Admin-Session",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function json(env: Env, request: Request, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(request, env),
    },
  });
}

export function unauthorized(env: Env, request: Request): Response {
  return json(env, request, { error: "Unauthorized" }, 401);
}

function timingSafeEqualString(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aa = enc.encode(a);
  const bb = enc.encode(b);
  const len = Math.max(aa.byteLength, bb.byteLength);
  let out = aa.byteLength === bb.byteLength ? 0 : 1;
  for (let i = 0; i < len; i++) {
    out |= (aa[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return out === 0;
}

export function assertApiSecret(request: Request, env: Env): boolean {
  const expected = env.API_SECRET;
  if (!expected) return false;
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return Boolean(token) && timingSafeEqualString(token, expected);
}
