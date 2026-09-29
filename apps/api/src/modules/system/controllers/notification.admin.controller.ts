import type { Env } from "../../../config/env";
import { json } from "../../../lib/http";
import { requireAdmin } from "../../auth";
import { getAdminFromSession } from "../../auth/services/admin-auth.service";
import { NotificationService } from "../services/notification.service";

function sessionToken(request: Request): string | null {
  return request.headers.get("X-Admin-Session");
}

export class NotificationAdminController {
  /** This admin's own notifications, scoped by the session — never a parameter. */
  static async handleAdminNotificationsGet(
    sql: unknown,
    env: Env,
    request: Request
  ): Promise<Response> {
    const admin = await getAdminFromSession(sql, sessionToken(request));
    if (!admin) return json(env, request, { error: "Not signed in." }, 401);

    try {
      const data = await NotificationService.listAdminNotifications(admin.id);
      return json(env, request, data);
    } catch (err) {
      console.error("[admin notifications] list failed", err);
      return json(env, request, { items: [], unread: 0 });
    }
  }

  static async handleAdminNotificationsMarkRead(
    sql: unknown,
    env: Env,
    request: Request
  ): Promise<Response> {
    const admin = await getAdminFromSession(sql, sessionToken(request));
    if (!admin) return json(env, request, { error: "Not signed in." }, 401);

    try {
      await NotificationService.markAllAsRead(admin.id);
    } catch (err) {
      console.error("[admin notifications] mark-read failed", err);
    }

    return json(env, request, { ok: true });
  }

  static async handleAdminPushSubscribe(
    sql: unknown,
    env: Env,
    request: Request
  ): Promise<Response> {
    const admin = await getAdminFromSession(sql, sessionToken(request));
    if (!admin) return json(env, request, { error: "Not signed in." }, 401);

    try {
      const body = (await request.json()) as {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      } | null;

      if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
        return json(env, request, { error: "Invalid push subscription object" }, 400);
      }

      await NotificationService.subscribePush(admin.id, {
        endpoint: body.endpoint,
        keys: { p256dh: body.keys.p256dh, auth: body.keys.auth },
      });

      return json(env, request, { ok: true });
    } catch (err) {
      console.error("[admin push subscribe] failed", err);
      return json(env, request, { error: "Failed to save subscription" }, 500);
    }
  }

  static async handleAdminPushUnsubscribe(
    sql: unknown,
    env: Env,
    request: Request
  ): Promise<Response> {
    const admin = await getAdminFromSession(sql, sessionToken(request));
    if (!admin) return json(env, request, { error: "Not signed in." }, 401);

    try {
      const body = (await request.json()) as { endpoint?: string } | null;
      if (!body?.endpoint) {
        return json(env, request, { error: "Missing endpoint" }, 400);
      }

      await NotificationService.unsubscribePush(admin.id, body.endpoint);
      return json(env, request, { ok: true });
    } catch (err) {
      console.error("[admin push unsubscribe] failed", err);
      return json(env, request, { error: "Failed to remove subscription" }, 500);
    }
  }
}

export const handleAdminNotificationsGet =
  NotificationAdminController.handleAdminNotificationsGet;
export const handleAdminNotificationsMarkRead =
  NotificationAdminController.handleAdminNotificationsMarkRead;
export const handleAdminPushSubscribe =
  NotificationAdminController.handleAdminPushSubscribe;
export const handleAdminPushUnsubscribe =
  NotificationAdminController.handleAdminPushUnsubscribe;

export async function handleAdminSendVendorMessage(
  sql: unknown,
  env: Env,
  request: Request,
  vendorId: string
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "VENDOR_ADMIN");
  if (deny) return deny;

  let body: { title?: string; body?: string; linkPath?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json(env, request, { error: "Invalid JSON body" }, 400);
  }

  const title = (body.title || "").trim();
  const message = (body.body || "").trim();
  if (!title || !message) {
    return json(env, request, { error: "Title and message are required." }, 400);
  }

  const item = await NotificationService.sendAdminVendorMessage(env, {
    vendorUserId: vendorId,
    title,
    body: message,
    linkPath: body.linkPath,
  });
  if (!item) return json(env, request, { error: "Vendor not found." }, 404);

  return json(env, request, { ok: true, item }, 201);
}
