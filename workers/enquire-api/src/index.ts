import { type Env, assertApiSecret, corsHeaders, json, unauthorized } from "./cors";
import { createSql } from "./db";
import {
  handleDraftGet,
  handleDraftPatch,
  handleOtpRequest,
  handleOtpVerify,
  handleSubmit,
} from "./handlers";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
      if (url.pathname === "/otp/request" && request.method === "POST") {
        return await handleOtpRequest(sql, env, request, ctx);
      }
      if (url.pathname === "/otp/verify" && request.method === "POST") {
        return await handleOtpVerify(sql, env, request);
      }
      if (url.pathname === "/draft" && request.method === "GET") {
        return await handleDraftGet(sql, env, request);
      }
      if (url.pathname === "/draft" && request.method === "PATCH") {
        return await handleDraftPatch(sql, env, request);
      }
      if (url.pathname === "/submit" && request.method === "POST") {
        return await handleSubmit(sql, env, request, ctx);
      }

      return json(env, request, { error: "Not Found" }, 404);
    } catch (err) {
      console.error("[enquire-api]", err);
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
