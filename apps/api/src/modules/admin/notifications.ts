import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import { getAdminFromSession } from "./auth";
import type { Sql } from "./db";

function sessionToken(request: Request): string | null {
  return request.headers.get("X-Admin-Session");
}

/** This admin's own notifications, scoped by the session — never a parameter. */
export async function handleAdminNotificationsGet(
  sql: Sql,
  env: Env,
  request: Request
): Promise<Response> {
  const admin = await getAdminFromSession(sql, sessionToken(request));
  if (!admin) return json(env, request, { error: "Not signed in." }, 401);

  try {
    const items = (await sql`
      SELECT id, type, title, body, "linkPath", "readAt", "createdAt"
      FROM "Notification"
      WHERE "adminId" = ${admin.id}
      ORDER BY "createdAt" DESC
      LIMIT 20
    `) as Array<{
      id: string;
      type: string;
      title: string;
      body: string;
      linkPath: string;
      readAt: string | null;
      createdAt: string;
    }>;

    return json(env, request, {
      items,
      unread: items.filter((n) => n.readAt == null).length,
    });
  } catch (err) {
    console.error("[admin notifications] list failed", err);
    return json(env, request, { items: [], unread: 0 });
  }
}

export async function handleAdminNotificationsMarkRead(
  sql: Sql,
  env: Env,
  request: Request
): Promise<Response> {
  const admin = await getAdminFromSession(sql, sessionToken(request));
  if (!admin) return json(env, request, { error: "Not signed in." }, 401);

  try {
    await sql`
      UPDATE "Notification"
      SET "readAt" = NOW()
      WHERE "adminId" = ${admin.id} AND "readAt" IS NULL
    `;
  } catch (err) {
    console.error("[admin notifications] mark-read failed", err);
    return json(env, request, { ok: true });
  }

  return json(env, request, { ok: true });
}
