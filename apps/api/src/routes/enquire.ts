import type { Env } from "../config/env";
import { corsHeaders, json } from "../lib/http";
import { createSql } from "../modules/enquire/db";
import { releaseSql } from "../lib/sql";
import {
  handleDraftGet,
  handleDraftPatch,
  handleOtpRequest,
  handleOtpVerify,
  handleSubmit,
  resolveEnquireRegistration,
} from "../modules/enquire/handlers";
import { createAttachmentHandlers } from "../modules/enquire/attachments";

const attachmentHandlers = createAttachmentHandlers(resolveEnquireRegistration);

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
    if (path === "/attachments" && request.method === "POST") {
      return await attachmentHandlers.handleAttachmentUpload(sql, env, request);
    }

    const attachmentOne = path.match(/^\/attachments\/([^/]+)$/);
    if (attachmentOne && request.method === "DELETE") {
      return await attachmentHandlers.handleAttachmentDelete(
        sql,
        env,
        request,
        decodeURIComponent(attachmentOne[1]!)
      );
    }

    return json(env, request, { error: "Not Found" }, 404);
  } catch (err) {
    console.error("[enquire]", err);
    return json(env, request, { error: "Internal error" }, 500);
  } finally {
    await releaseSql(sql);
  }
}
