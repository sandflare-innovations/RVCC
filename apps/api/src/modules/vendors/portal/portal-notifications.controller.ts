import type { Env } from "../../../config/env";
import { json } from "../../../lib/http";
import { getVendorFromSession } from "../../auth/services/vendor-auth.service";
import { NotificationService } from "../../system/services/notification.service";

function sessionToken(request: Request): string | null {
  return request.headers.get("X-Vendor-Session");
}

export class VendorPortalNotificationsController {
  static async handleVendorNotificationsGet(
    _sql: unknown,
    env: Env,
    request: Request
  ): Promise<Response> {
    const vendor = await getVendorFromSession(null, sessionToken(request));
    if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

    try {
      const data = await NotificationService.listVendorNotifications(vendor.id);
      return json(env, request, data);
    } catch (err) {
      console.error("[vendor notifications] list failed", err);
      return json(env, request, { items: [], unread: 0 });
    }
  }

  static async handleVendorNotificationsMarkRead(
    _sql: unknown,
    env: Env,
    request: Request
  ): Promise<Response> {
    const vendor = await getVendorFromSession(null, sessionToken(request));
    if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

    try {
      await NotificationService.markVendorAllAsRead(vendor.id);
    } catch (err) {
      console.error("[vendor notifications] mark-read failed", err);
    }

    return json(env, request, { ok: true });
  }
}

export const handleVendorNotificationsGet =
  VendorPortalNotificationsController.handleVendorNotificationsGet;
export const handleVendorNotificationsMarkRead =
  VendorPortalNotificationsController.handleVendorNotificationsMarkRead;
