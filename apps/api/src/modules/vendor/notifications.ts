import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import { getVendorFromSession } from "./auth";

function sessionToken(request: Request): string | null {
  return request.headers.get("X-Vendor-Session");
}

/** This vendor's own notifications, scoped by the session — never a parameter. */
export async function handleVendorNotificationsGet(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const vendor = await getVendorFromSession(null, sessionToken(request));
  if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

  return json(env, request, {
    items: [],
    unread: 0,
  });
}

export async function handleVendorNotificationsMarkRead(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const vendor = await getVendorFromSession(null, sessionToken(request));
  if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

  return json(env, request, { ok: true });
}


