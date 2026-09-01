import type { Env } from "../config/env";
import { corsHeaders, json } from "../lib/http";
import {
  handleDashboard,
  handleLogin,
  handleLogout,
  handleMe,
  handlePassword,
  handleQuoteAttachmentDelete,
  handleQuoteAttachmentUpload,
  handleQuoteSave,
  handleRequirementGet,
  handleRequirementsList,
} from "../modules/vendor/handlers";
import {
  handleVendorNotificationsGet,
  handleVendorNotificationsMarkRead,
} from "../modules/vendor/notifications";
import { handleVendorLiveBids } from "../modules/bidding/live-bids";
import { enforceRateLimit } from "../lib/rate-limit";

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

  try {

    if (path === "/auth/login" && request.method === "POST") {
      const limited = await enforceRateLimit(request, env, "vendor:login", { limit: 8, windowSeconds: 60 });
      if (limited) return limited;
      return await handleLogin(null, env, request);
    }
    if (path === "/auth/logout" && request.method === "POST") {
      return await handleLogout(null, env, request);
    }
    if (path === "/auth/me" && request.method === "GET") {
      return await handleMe(null, env, request);
    }
    if (path === "/auth/password" && request.method === "POST") {
      const limited = await enforceRateLimit(request, env, "vendor:password", { limit: 5, windowSeconds: 60 });
      if (limited) return limited;
      return await handlePassword(null, env, request);
    }

    if (path === "/notifications" && request.method === "GET") {
      return await handleVendorNotificationsGet(null, env, request);
    }
    if (path === "/notifications" && request.method === "POST") {
      return await handleVendorNotificationsMarkRead(null, env, request);
    }

    if (path === "/requirements" && request.method === "GET") {
      return await handleRequirementsList(null, env, request);
    }

    const quoteAttDel = path.match(/^\/requirements\/([^/]+)\/quote\/attachment\/([^/]+)$/);
    if (quoteAttDel && request.method === "DELETE") {
      return await handleQuoteAttachmentDelete(
        null,
        env,
        request,
        decodeURIComponent(quoteAttDel[1]!),
        decodeURIComponent(quoteAttDel[2]!)
      );
    }

    const quoteAttUpload = path.match(/^\/requirements\/([^/]+)\/quote\/attachment$/);
    if (quoteAttUpload && request.method === "POST") {
      const limited = await enforceRateLimit(request, env, "vendor:quote-att", { limit: 30, windowSeconds: 60 });
      if (limited) return limited;
      return await handleQuoteAttachmentUpload(
        null,
        env,
        request,
        decodeURIComponent(quoteAttUpload[1]!)
      );
    }

    const quoteSave = path.match(/^\/requirements\/([^/]+)\/quote$/);
    if (quoteSave && request.method === "PUT") {
      const limited = await enforceRateLimit(request, env, "vendor:quote-save", { limit: 60, windowSeconds: 60 });
      if (limited) return limited;
      return await handleQuoteSave(null, env, request, decodeURIComponent(quoteSave[1]!));
    }

    const reqLiveBids = path.match(/^\/requirements\/([^/]+)\/live-bids$/);
    if (reqLiveBids && request.method === "GET") {
      return await handleVendorLiveBids(null, env, request, decodeURIComponent(reqLiveBids[1]!));
    }

    const reqOne = path.match(/^\/requirements\/([^/]+)$/);
    if (reqOne && request.method === "GET") {
      return await handleRequirementGet(null, env, request, decodeURIComponent(reqOne[1]!));
    }

    if (path === "/dashboard" && request.method === "GET") {
      return await handleDashboard(null, env, request);
    }

    return json(env, request, { error: "Not Found" }, 404);
  } catch (err) {
    console.error("[vendor]", err);
    return json(env, request, { error: "Internal error" }, 500);
  }
}
