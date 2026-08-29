import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import { getAdminFromSession } from "./auth";
import { prisma } from "../../lib/prisma";

function sessionToken(request: Request): string | null {
  return request.headers.get("X-Admin-Session");
}

/** This admin's own notifications, scoped by the session — never a parameter. */
export async function handleAdminNotificationsGet(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const admin = await getAdminFromSession(sql, sessionToken(request));
  if (!admin) return json(env, request, { error: "Not signed in." }, 401);

  try {
    const rawItems = await prisma.notification.findMany({
      where: { adminId: admin.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const items = rawItems.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      linkPath: n.linkPath,
      readAt: n.readAt ? n.readAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
    }));

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
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const admin = await getAdminFromSession(sql, sessionToken(request));
  if (!admin) return json(env, request, { error: "Not signed in." }, 401);

  try {
    await prisma.notification.updateMany({
      where: {
        adminId: admin.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  } catch (err) {
    console.error("[admin notifications] mark-read failed", err);
    return json(env, request, { ok: true });
  }

  return json(env, request, { ok: true });
}
