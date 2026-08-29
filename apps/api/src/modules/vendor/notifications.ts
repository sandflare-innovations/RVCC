import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import { getVendorFromSession } from "./auth";
import { prisma } from "../../lib/prisma";

function sessionToken(request: Request): string | null {
  return request.headers.get("X-Vendor-Session");
}

/** This vendor's own notifications, scoped by the session — never a parameter. */
export async function handleVendorNotificationsGet(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const vendor = await getVendorFromSession(sql, sessionToken(request));
  if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

  const rawItems = await prisma.notification.findMany({
    where: { vendorUserId: vendor.id },
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
}

export async function handleVendorNotificationsMarkRead(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const vendor = await getVendorFromSession(sql, sessionToken(request));
  if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

  await prisma.notification.updateMany({
    where: {
      vendorUserId: vendor.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return json(env, request, { ok: true });
}
