import type { Env } from "../../../config/env";
import { json } from "../../../lib/http";
import { requireAdmin } from "../../auth/services/admin-auth.service";
import { DashboardService } from "../services/dashboard.service";

export class DashboardAdminController {
  static async handleDashboard(
    sql: unknown,
    env: Env,
    request: Request
  ): Promise<Response> {
    const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
    if (deny) return deny;

    try {
      const payload = await DashboardService.getDashboardMetrics();
      return json(env, request, payload, 200, {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      });
    } catch (err) {
      console.error("[admin dashboard failed]", err);
      return json(env, request, { error: "Database unavailable." }, 503);
    }
  }

  static async handleIndustriesList(
    sql: unknown,
    env: Env,
    request: Request
  ): Promise<Response> {
    const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
    if (deny) return deny;

    const rows = await DashboardService.listIndustries();
    return json(env, request, rows);
  }
}

export const handleDashboard = DashboardAdminController.handleDashboard;
export const handleIndustriesList = DashboardAdminController.handleIndustriesList;
