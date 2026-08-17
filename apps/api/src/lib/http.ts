import type { Env } from "../config/env";

const SESSION_HEADERS =
  "Content-Type, X-Admin-Session, X-Vendor-Session, X-Enquire-Session, User-Agent";

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
    else if (!origin && list[0]) allowOrigin = list[0];
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
