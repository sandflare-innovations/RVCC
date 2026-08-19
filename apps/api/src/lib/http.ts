import type { Env } from "../config/env";

const SESSION_HEADERS =
  "Content-Type, X-Admin-Session, X-Vendor-Session, X-Enquire-Session, User-Agent";

export function corsHeaders(request: Request, env: Env): HeadersInit {
  const allowed = (env.ALLOWED_ORIGINS || "").trim();
  const origin = request.headers.get("Origin");
  let allowOrigin = "";

  const originAllowed = (candidate: string | null): boolean => {
    if (!candidate) return false;
    if (allowed === "*") return true;
    if (!allowed) return false;
    const list = allowed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.includes(candidate)) return true;
    try {
      const host = new URL(candidate).hostname;
      if (host.endsWith(".vercel.app")) return true;
      if (host.endsWith(".pages.dev")) return true;
    } catch {
      /* ignore */
    }
    return false;
  };

  if (allowed === "*") {
    allowOrigin = origin || "*";
  } else if (origin && originAllowed(origin)) {
    allowOrigin = origin;
  } else if (!origin && allowed) {
    allowOrigin = allowed.split(",")[0]?.trim() || "";
  }
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": allowOrigin || "null",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": SESSION_HEADERS,
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (allowOrigin && allowOrigin !== "*") {
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  return headers;
}

export function json(
  env: Env,
  request: Request,
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(request, env),
      ...extraHeaders,
    },
  });
}

export function unauthorized(env: Env, request: Request): Response {
  return json(env, request, { error: "Unauthorized" }, 401);
}
