import { Hono } from "hono";

import type { Env } from "./config/env";
import { corsHeaders, json } from "./lib/http";
import { handlePublicCareersRequest } from "./modules/public/careers";
import { handleAdminRequest } from "./routes/admin";
import { handleEnquireRequest } from "./routes/enquire";
import { handleHealthCheck } from "./routes/health";
import { handleVendorRequest } from "./routes/vendor";

function rewritePath(request: Request, stripPrefix: string): Request {
  const url = new URL(request.url);
  const rest = url.pathname.slice(stripPrefix.length) || "/";
  url.pathname = rest.startsWith("/") ? rest : `/${rest}`;
  const init: RequestInit = {
    method: request.method,
    headers: request.headers,
  };
  if (request.method !== "GET" && request.method !== "HEAD" && request.body) {
    init.body = request.body;
    (init as any).duplex = "half";
  }
  return new Request(url, init);
}

export function createApp(env: Env) {
  const app = new Hono();

  app.options("*", (c) => {
    return new Response(null, { status: 204, headers: corsHeaders(c.req.raw, env) });
  });

  app.get("/", (c) => handleHealthCheck(c.req.raw, env));
  app.get("/health", (c) => handleHealthCheck(c.req.raw, env));
  app.on("HEAD", ["/health", "/"], (c) => {
    return new Response(null, { status: 204, headers: corsHeaders(c.req.raw, env) });
  });

  app.all("/careers", (c) => handlePublicCareersRequest(c.req.raw, env));
  app.all("/careers/apply", (c) => handlePublicCareersRequest(c.req.raw, env));

  app.all("/admin", (c) => handleAdminRequest(rewritePath(c.req.raw, "/admin"), env));
  app.all("/admin/*", (c) => handleAdminRequest(rewritePath(c.req.raw, "/admin"), env));

  app.all("/vendor", (c) => handleVendorRequest(rewritePath(c.req.raw, "/vendor"), env));
  app.all("/vendor/*", (c) => handleVendorRequest(rewritePath(c.req.raw, "/vendor"), env));

  app.all("/enquire", (c) => handleEnquireRequest(rewritePath(c.req.raw, "/enquire"), env));
  app.all("/enquire/*", (c) => handleEnquireRequest(rewritePath(c.req.raw, "/enquire"), env));

  app.notFound((c) => json(env, c.req.raw, { error: "Not Found" }, 404));

  app.onError((err, c) => {
    console.error("[api]", err);
    return json(env, c.req.raw, { error: "Internal error" }, 500);
  });

  return app;
}
