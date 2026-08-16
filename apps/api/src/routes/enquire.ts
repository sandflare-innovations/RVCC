import type { Env } from "../config/env";
import { corsHeaders, json } from "../lib/http";
import { createSql } from "../modules/enquire/db";
import {
  handleDraftGet,
  handleDraftPatch,
  handleOtpRequest,
  handleOtpVerify,
  handleSubmit,
} from "../modules/enquire/handlers";

/**
 * Enquire (supplier registration) domain. Paths relative to `/enquire`.
 * Auth is session-based (`X-Enquire-Session`); mail runs in-process.
 */
export async function handleEnquireRequest(request: Request, env: Env): Promise<Response> {
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
    if (path === "/otp/request" && request.method === "POST") {
      return await handleOtpRequest(sql, env, request);
    }
    if (path === "/otp/verify" && request.method === "POST") {
      return await handleOtpVerify(sql, env, request);
    }
    if (path === "/draft" && request.method === "GET") {
      return await handleDraftGet(sql, env, request);
    }
    if (path === "/draft" && request.method === "PATCH") {
      return await handleDraftPatch(sql, env, request);
    }
    if (path === "/submit" && request.method === "POST") {
      return await handleSubmit(sql, env, request);
    }

    return json(env, request, { error: "Not Found" }, 404);
  } catch (err) {
    console.error("[enquire]", err);
    return json(env, request, { error: "Internal error" }, 500);
  } finally {
    try {
      await sql.end({ timeout: 2 });
    } catch {
      /* ignore */
    }
  }
}
