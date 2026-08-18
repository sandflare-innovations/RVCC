import type { Env } from "../config/env";
import { corsHeaders, json } from "../lib/http";
import { createSql } from "../modules/vendor/db";
import {
  handleDashboard,
  handleLogin,
  handleLogout,
  handleMe,
  handlePassword,
  handleQuoteSave,
  handleRequirementGet,
  handleRequirementsList,
} from "../modules/vendor/handlers";
import {
  handleVendorNotificationsGet,
  handleVendorNotificationsMarkRead,
} from "../modules/vendor/notifications";

/**
 * Vendor domain router. Paths are relative to `/vendor`.
 * Auth is session-based (`X-Vendor-Session`); no shared API secret.
 */
export async function handleVendorRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  let sql;
  try {
    sql = createSql(env);
  } catch (err) {
    console.error(err);
    return json(env, request, { error: "Service unavailable" }, 503);
  }

  try {
    if (path === "/auth/login" && request.method === "POST") {
      return await handleLogin(sql, env, request);
    }
    if (path === "/auth/logout" && request.method === "POST") {
      return await handleLogout(sql, env, request);
    }
    if (path === "/auth/me" && request.method === "GET") {
      return await handleMe(sql, env, request);
    }
    if (path === "/auth/password" && request.method === "POST") {
      return await handlePassword(sql, env, request);
    }

    if (path === "/notifications" && request.method === "GET") {
      return await handleVendorNotificationsGet(sql, env, request);
    }
    if (path === "/notifications" && request.method === "POST") {
      return await handleVendorNotificationsMarkRead(sql, env, request);
    }

    if (path === "/requirements" && request.method === "GET") {
      return await handleRequirementsList(sql, env, request);
    }

    const quoteSave = path.match(/^\/requirements\/([^/]+)\/quote$/);
    if (quoteSave && request.method === "PUT") {
      return await handleQuoteSave(sql, env, request, decodeURIComponent(quoteSave[1]!));
    }

    const reqOne = path.match(/^\/requirements\/([^/]+)$/);
    if (reqOne && request.method === "GET") {
      return await handleRequirementGet(sql, env, request, decodeURIComponent(reqOne[1]!));
    }

    if (path === "/dashboard" && request.method === "GET") {
      return await handleDashboard(sql, env, request);
    }

    return json(env, request, { error: "Not Found" }, 404);
  } catch (err) {
    console.error("[vendor]", err);
    return json(env, request, { error: "Internal error" }, 500);
  }
}
