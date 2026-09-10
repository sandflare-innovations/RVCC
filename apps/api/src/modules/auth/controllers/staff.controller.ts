import type { Env } from "../../../config/env";
import { json } from "../../../lib/http";
import { requireAdmin } from "../services/admin-auth.service";
import { StaffService } from "../services/staff.service";

export class StaffController {
  static async handleStaffOtpRequest(
    sql: unknown,
    env: Env,
    request: Request
  ): Promise<Response> {
    const auth = await requireAdmin(sql, env, request, "SUPER_ADMIN");
    if (auth.deny) return auth.deny;

    let body: any;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const action =
      typeof body?.action === "string" ? body.action : "STAFF_MANAGEMENT";

    const { code } = await StaffService.requestOtp(
      auth.admin.id,
      auth.admin.email,
      auth.admin.name,
      action
    );

    return json(env, request, {
      success: true,
      sentTo: auth.admin.email,
      expiresInSeconds: 300,
      devCodeHint: process.env.NODE_ENV !== "production" ? code : undefined,
    });
  }

  static async handleStaffList(
    sql: unknown,
    env: Env,
    request: Request
  ): Promise<Response> {
    const auth = await requireAdmin(sql, env, request, "SUPER_ADMIN");
    if (auth.deny) return auth.deny;

    const staff = await StaffService.listStaff();
    return json(env, request, staff);
  }

  static async handleStaffCreate(
    sql: unknown,
    env: Env,
    request: Request
  ): Promise<Response> {
    const auth = await requireAdmin(sql, env, request, "SUPER_ADMIN");
    if (auth.deny) return auth.deny;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return json(env, request, { error: "Invalid JSON payload" }, 400);
    }

    const { email, password, name, position, department, phone, role, otpCode } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return json(env, request, { error: "Valid email address is required" }, 400);
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return json(env, request, { error: "Password must be at least 8 characters" }, 400);
    }

    const res = await StaffService.createStaff(sql, auth.admin.id, {
      email,
      password,
      name,
      position,
      department,
      phone,
      role,
      otpCode,
    });

    if ("error" in res) {
      return json(env, request, { error: res.error }, res.status || 400);
    }

    return json(env, request, { success: true, id: res.id }, 201);
  }

  static async handleStaffUpdate(
    sql: unknown,
    env: Env,
    request: Request,
    id: string
  ): Promise<Response> {
    const auth = await requireAdmin(sql, env, request, "SUPER_ADMIN");
    if (auth.deny) return auth.deny;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return json(env, request, { error: "Invalid JSON body" }, 400);
    }

    const res = await StaffService.updateStaff(sql, auth.admin.id, id, body);
    if ("error" in res) {
      return json(env, request, { error: res.error }, res.status || 400);
    }

    return json(env, request, { success: true });
  }

  static async handleStaffPasswordReset(
    sql: unknown,
    env: Env,
    request: Request,
    id: string
  ): Promise<Response> {
    const auth = await requireAdmin(sql, env, request, "SUPER_ADMIN");
    if (auth.deny) return auth.deny;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return json(env, request, { error: "Invalid JSON body" }, 400);
    }

    const { newPassword, otpCode } = body;
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return json(env, request, { error: "Password must be at least 8 characters long." }, 400);
    }

    const res = await StaffService.resetStaffPassword(sql, auth.admin.id, id, {
      newPassword,
      otpCode,
    });
    if ("error" in res) {
      return json(env, request, { error: res.error }, res.status || 400);
    }

    return json(env, request, { success: true });
  }

  static async handleStaffDelete(
    sql: unknown,
    env: Env,
    request: Request,
    id: string
  ): Promise<Response> {
    const auth = await requireAdmin(sql, env, request, "SUPER_ADMIN");
    if (auth.deny) return auth.deny;

    let body: any;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const { otpCode } = body;

    const res = await StaffService.deleteStaff(sql, auth.admin.id, id, otpCode);
    if ("error" in res) {
      return json(env, request, { error: res.error }, res.status || 400);
    }

    return json(env, request, { success: true, deletedId: res.deletedId });
  }

  static async handleRoleList(
    sql: unknown,
    env: Env,
    request: Request
  ): Promise<Response> {
    const auth = await requireAdmin(sql, env, request, "SUPER_ADMIN");
    if (auth.deny) return auth.deny;

    const roles = await StaffService.listRoles();
    return json(env, request, roles);
  }

  static async handleRoleCreate(
    sql: unknown,
    env: Env,
    request: Request
  ): Promise<Response> {
    const auth = await requireAdmin(sql, env, request, "SUPER_ADMIN");
    if (auth.deny) return auth.deny;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return json(env, request, { error: "Invalid JSON" }, 400);
    }

    const { name, description } = body || {};
    const res = await StaffService.createRole(sql, auth.admin.id, {
      name,
      description,
    });

    if ("error" in res) {
      return json(env, request, { error: res.error }, res.status || 400);
    }

    return json(env, request, res.role, 201);
  }
}

export const handleStaffOtpRequest = StaffController.handleStaffOtpRequest;
export const handleStaffList = StaffController.handleStaffList;
export const handleStaffCreate = StaffController.handleStaffCreate;
export const handleStaffUpdate = StaffController.handleStaffUpdate;
export const handleStaffPasswordReset = StaffController.handleStaffPasswordReset;
export const handleStaffDelete = StaffController.handleStaffDelete;
export const handleRoleList = StaffController.handleRoleList;
export const handleRoleCreate = StaffController.handleRoleCreate;
