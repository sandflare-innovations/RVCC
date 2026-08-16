import { type Env, assertApiSecret, corsHeaders, json, unauthorized } from "./cors";
import { createSql } from "./db";
import {
  handleDashboard,
  handleLogin,
  handleLogout,
  handleMe,
  handlePassword,
  handleQuoteSave,
  handleRequirementGet,
  handleRequirementsList,
} from "./handlers";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    const url = new URL(request.url);

    // Public liveness only — no service name, DB mode, or config hints.
    if (url.pathname === "/" || url.pathname === "/health") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return json(env, request, { error: "Method Not Allowed" }, 405);
      }
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request, env),
      });
    }

    // All data routes require the shared API secret (Next.js BFF only).
    if (!assertApiSecret(request, env)) {
      return unauthorized(env, request);
    }

    let sql;
    try {
      sql = createSql(env);
    } catch (err) {
      console.error(err);
      return json(env, request, { error: "Service unavailable" }, 503);
    }

    try {
      if (url.pathname === "/auth/login" && request.method === "POST") {
        return await handleLogin(sql, env, request);
      }
      if (url.pathname === "/auth/logout" && request.method === "POST") {
        return await handleLogout(sql, env, request);
      }
      if (url.pathname === "/auth/me" && request.method === "GET") {
        return await handleMe(sql, env, request);
      }
      if (url.pathname === "/auth/password" && request.method === "POST") {
        return await handlePassword(sql, env, request);
      }
      if (url.pathname === "/requirements" && request.method === "GET") {
        return await handleRequirementsList(sql, env, request);
      }
      // The /quote pattern must be tested before the bare :id pattern, or the
      // literal string "quote" is read as a requirement id.
      const quoteSave = url.pathname.match(/^\/requirements\/([^/]+)\/quote$/);
      if (quoteSave && request.method === "PUT") {
        return await handleQuoteSave(sql, env, request, decodeURIComponent(quoteSave[1]!));
      }
      const reqOne = url.pathname.match(/^\/requirements\/([^/]+)$/);
      if (reqOne && request.method === "GET") {
        return await handleRequirementGet(sql, env, request, decodeURIComponent(reqOne[1]!));
      }

      if (url.pathname === "/dashboard" && request.method === "GET") {
        return await handleDashboard(sql, env, request);
      }

      return json(env, request, { error: "Not Found" }, 404);
    } catch (err) {
      console.error("[vendor-api]", err);
      return json(env, request, { error: "Internal error" }, 500);
    } finally {
      try {
        await sql.end({ timeout: 2 });
      } catch {
        /* ignore */
      }
    }
  },
} satisfies ExportedHandler<Env>;
