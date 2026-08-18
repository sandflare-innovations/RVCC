import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import { getVendorFromSession } from "./auth";
import type { Sql } from "./db";

function sessionToken(request: Request): string | null {
  return request.headers.get("X-Vendor-Session");
}

/** This vendor's own notifications, scoped by the session — never a parameter. */
export async function handleVendorNotificationsGet(
  sql: Sql,
  env: Env,
  request: Request
): Promise<Response> {
  const vendor = await getVendorFromSession(sql, sessionToken(request));
  if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

  const items = await sql`
    SELECT id, type, title, body, "linkPath", "readAt", "createdAt"
    FROM "Notification"
    WHERE "vendorUserId" = ${vendor.id}
    ORDER BY "createdAt" DESC
    LIMIT 20
  `;

  return json(env, request, {
    items,
    unread: items.filter((n) => n.readAt == null).length,
  });
}

export async function handleVendorNotificationsMarkRead(
  sql: Sql,
  env: Env,
  request: Request
): Promise<Response> {
  const vendor = await getVendorFromSession(sql, sessionToken(request));
  if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

  await sql`
    UPDATE "Notification"
    SET "readAt" = NOW()
    WHERE "vendorUserId" = ${vendor.id} AND "readAt" IS NULL
  `;

  return json(env, request, { ok: true });
}
