import { randomInt } from "node:crypto";
import { hashPassword } from "../../../lib/password";
import { prisma } from "../../../lib/prisma";
import { cuid, hashSha256 } from "../../../lib/sql";
import type { AdminRoleName, RoleItem, StaffListItem } from "../types/auth.types";
import { writeAudit } from "./admin-auth.service";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_OTP_ATTEMPTS = 5;

function generateOtpCode(): string {
  return String(randomInt(100000, 999999));
}

export class StaffService {
  /** Verify action OTP for the logged-in administrator */
  static async verifyOtpChallenge(
    _sql: unknown,
    adminId: string,
    action: string,
    otpCode: string
  ): Promise<{ valid: boolean; error?: string }> {
    if (!otpCode || typeof otpCode !== "string") {
      return { valid: false, error: "OTP code is required for this operation." };
    }

    const codeHash = await hashSha256(otpCode.trim());
    const now = new Date();

    const challenge = await prisma.adminOtp.findFirst({
      where: {
        adminId,
        action,
        expiresAt: { gt: now },
        consumedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!challenge) {
      return {
        valid: false,
        error: "No active verification code found or code has expired. Please request a new OTP.",
      };
    }

    if (Number(challenge.attempts) >= MAX_OTP_ATTEMPTS) {
      await prisma.adminOtp.delete({ where: { id: challenge.id } });
      return {
        valid: false,
        error: "Maximum verification attempts exceeded. Please request a new OTP.",
      };
    }

    if (challenge.codeHash !== codeHash) {
      await prisma.adminOtp.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      return { valid: false, error: "Invalid verification code. Please check and try again." };
    }

    await prisma.adminOtp.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    return { valid: true };
  }

  static async requestOtp(adminId: string, adminEmail: string, adminName: string, action = "STAFF_MANAGEMENT") {
    await prisma.adminOtp.deleteMany({
      where: {
        OR: [{ adminId }, { expiresAt: { lt: new Date() } }],
      },
    });

    const code = generateOtpCode();
    const codeHash = await hashSha256(code);
    const challengeId = cuid();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await prisma.adminOtp.create({
      data: {
        id: challengeId,
        adminId,
        action,
        codeHash,
        attempts: 0,
        expiresAt,
      },
    });

    console.log(`\n======================================================`);
    console.log(`[ADMIN SECURITY OTP]`);
    console.log(`Recipient: ${adminEmail} (${adminName})`);
    console.log(`Action:    ${action}`);
    console.log(`Code:      ${code}`);
    console.log(`Expires:   ${expiresAt.toISOString()}`);
    console.log(`======================================================\n`);

    return { code, expiresAt };
  }

  static async listRoles(): Promise<RoleItem[]> {
    const roles = await prisma.role.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { admins: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isSystem: Boolean(r.isSystem),
      adminCount: r._count.admins,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  static async createRole(
    sql: unknown,
    creatorAdminId: string,
    data: { name: string; description?: string }
  ): Promise<{ role?: RoleItem; error?: string; status: number }> {
    const rawName = (data.name || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

    if (!rawName || rawName.length < 2) {
      return { error: "Role name must contain at least 2 alphanumeric characters.", status: 400 };
    }

    const existing = await prisma.role.findUnique({
      where: { name: rawName },
    });
    if (existing) {
      return { error: `Role '${rawName}' already exists.`, status: 409 };
    }

    const created = await prisma.role.create({
      data: {
        name: rawName,
        description: data.description?.trim() || `${rawName} Role`,
        isSystem: false,
      },
      include: {
        _count: { select: { admins: true } },
      },
    });

    void writeAudit(sql, {
      adminId: creatorAdminId,
      action: "staff.role.create",
      entityType: "Role",
      entityId: created.id,
      newStatus: created.name,
      note: `Created custom role ${created.name}`,
    });

    return {
      role: {
        id: created.id,
        name: created.name,
        description: created.description,
        isSystem: created.isSystem,
        adminCount: created._count.admins,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
      status: 201,
    };
  }

  static async listStaff(): Promise<StaffListItem[]> {
    const rows = await prisma.adminUser.findMany({
      include: { role: true },
      orderBy: { createdAt: "asc" },
    });

    const rolePriority: Record<string, number> = {
      SUPER_ADMIN: 1,
      ADMIN: 2,
      PROCUREMENT_ADMIN: 3,
      VENDOR_ADMIN: 4,
      WEBSITE_ADMIN: 5,
      REVIEWER: 6,
    };

    const sortedRows = [...rows].sort((a, b) => {
      const roleA = a.role?.name || "ADMIN";
      const roleB = b.role?.name || "ADMIN";
      const pA = rolePriority[roleA] || 99;
      const pB = rolePriority[roleB] || 99;
      return pA - pB;
    });

    return sortedRows.map((r) => {
      const isLocked = Boolean(r.lockedUntil && new Date(r.lockedUntil) > new Date());
      const roleName = (r.role?.name || "ADMIN") as AdminRoleName;
      return {
        id: r.id,
        email: r.email,
        name: r.name || "",
        position: r.position || "",
        department: r.department || "",
        phone: r.phone || "",
        role: roleName,
        isActive: Boolean(r.isActive),
        lastLoginAt: r.lastLoginAt ? new Date(r.lastLoginAt).toISOString() : null,
        failedAttempts: Number(r.failedAttempts) || 0,
        isLocked,
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString(),
      };
    });
  }

  static async createStaff(
    sql: unknown,
    creatorAdminId: string,
    data: {
      email: string;
      password: string;
      name?: string;
      position?: string;
      department?: string;
      phone?: string;
      role?: string;
      otpCode: string;
    }
  ) {
    const otpCheck = await this.verifyOtpChallenge(sql, creatorAdminId, "CREATE_STAFF", data.otpCode);
    if (!otpCheck.valid) return { error: otpCheck.error, status: 403 };

    const normalizedEmail = data.email.trim().toLowerCase();
    const existing = await prisma.adminUser.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return { error: "An account with this email already exists.", status: 409 };
    }

    const passwordHash = await hashPassword(data.password);
    const staffId = cuid();
    const requestedRole = (data.role || "ADMIN").trim().toUpperCase();

    let roleRecord = await prisma.role.findUnique({
      where: { name: requestedRole },
    });

    if (!roleRecord) {
      const validRoles = [
        "SUPER_ADMIN",
        "ADMIN",
        "PROCUREMENT_ADMIN",
        "VENDOR_ADMIN",
        "WEBSITE_ADMIN",
        "REVIEWER",
      ];
      const roleToCreate = validRoles.includes(requestedRole) ? requestedRole : "ADMIN";
      roleRecord = await prisma.role.upsert({
        where: { name: roleToCreate },
        update: {},
        create: {
          name: roleToCreate,
          description: `${roleToCreate} Role`,
          isSystem: true,
        },
      });
    }

    await prisma.adminUser.create({
      data: {
        id: staffId,
        email: normalizedEmail,
        name: data.name || "",
        position: data.position || "",
        department: data.department || "",
        phone: data.phone || "",
        passwordHash,
        roleId: roleRecord.id,
        isActive: true,
      },
    });

    await writeAudit(sql, {
      adminId: creatorAdminId,
      action: "CREATE_STAFF_USER",
      entityType: "AdminUser",
      entityId: staffId,
      metadata: {
        email: normalizedEmail,
        name: data.name,
        role: roleRecord.name,
        position: data.position,
        department: data.department,
      },
    });

    return { success: true, id: staffId };
  }

  static async updateStaff(
    sql: unknown,
    operatorAdminId: string,
    id: string,
    data: {
      name?: string;
      position?: string;
      department?: string;
      phone?: string;
      role?: string;
      isActive?: boolean;
      otpCode?: string;
    }
  ) {
    const target = await prisma.adminUser.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!target) return { error: "Staff user not found", status: 404 };

    const currentRoleName = target.role?.name || "ADMIN";

    if (currentRoleName === "SUPER_ADMIN" && (data.role !== "SUPER_ADMIN" || data.isActive === false)) {
      const superAdminsCount = await prisma.adminUser.count({
        where: {
          role: { name: "SUPER_ADMIN" },
          isActive: true,
        },
      });
      if (superAdminsCount <= 1) {
        return { error: "Cannot demote or deactivate the last active Super Admin.", status: 400 };
      }
    }

    const isSecurityChange = data.role !== undefined || data.isActive !== undefined;
    if (isSecurityChange) {
      const otpCheck = await this.verifyOtpChallenge(sql, operatorAdminId, "UPDATE_STAFF", data.otpCode || "");
      if (!otpCheck.valid) {
        return { error: otpCheck.error, status: 403 };
      }
    }

    const nextName = typeof data.name === "string" ? data.name : target.name;
    const nextPosition = typeof data.position === "string" ? data.position : target.position;
    const nextDepartment = typeof data.department === "string" ? data.department : target.department;
    const nextPhone = typeof data.phone === "string" ? data.phone : target.phone;
    const nextIsActive = typeof data.isActive === "boolean" ? data.isActive : Boolean(target.isActive);

    let nextRoleId = target.roleId;
    let nextRoleName = currentRoleName;
    if (data.role !== undefined && data.role !== currentRoleName) {
      const requestedRole = data.role.trim().toUpperCase();
      let roleRecord = await prisma.role.findUnique({
        where: { name: requestedRole },
      });
      if (!roleRecord) {
        const validRoles = [
          "SUPER_ADMIN",
          "ADMIN",
          "PROCUREMENT_ADMIN",
          "VENDOR_ADMIN",
          "WEBSITE_ADMIN",
          "REVIEWER",
        ];
        if (validRoles.includes(requestedRole)) {
          roleRecord = await prisma.role.create({
            data: { name: requestedRole, description: `${requestedRole} Role`, isSystem: true },
          });
        }
      }
      if (roleRecord) {
        nextRoleId = roleRecord.id;
        nextRoleName = roleRecord.name as AdminRoleName;
      }
    }

    await prisma.adminUser.update({
      where: { id },
      data: {
        name: nextName,
        position: nextPosition,
        department: nextDepartment,
        phone: nextPhone,
        roleId: nextRoleId,
        isActive: nextIsActive,
      },
    });

    if (nextIsActive === false) {
      await prisma.adminSession.deleteMany({
        where: { adminId: id },
      });
    }

    await writeAudit(sql, {
      adminId: operatorAdminId,
      action: "UPDATE_STAFF_USER",
      entityType: "AdminUser",
      entityId: id,
      metadata: {
        email: target.email,
        name: nextName,
        role: nextRoleName,
        isActive: nextIsActive,
        position: nextPosition,
        department: nextDepartment,
      },
    });

    return { success: true };
  }

  static async resetStaffPassword(
    sql: unknown,
    operatorAdminId: string,
    id: string,
    data: { newPassword: string; otpCode: string }
  ) {
    const target = await prisma.adminUser.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    });
    if (!target) return { error: "Staff user not found", status: 404 };

    const otpCheck = await this.verifyOtpChallenge(sql, operatorAdminId, "RESET_PASSWORD", data.otpCode);
    if (!otpCheck.valid) {
      return { error: otpCheck.error, status: 403 };
    }

    const passwordHash = await hashPassword(data.newPassword);

    await prisma.adminUser.update({
      where: { id },
      data: {
        passwordHash,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    await prisma.adminSession.deleteMany({
      where: { adminId: id },
    });

    await writeAudit(sql, {
      adminId: operatorAdminId,
      action: "RESET_STAFF_PASSWORD",
      entityType: "AdminUser",
      entityId: id,
      metadata: { email: target.email, name: target.name },
    });

    return { success: true };
  }

  static async deleteStaff(
    sql: unknown,
    operatorAdminId: string,
    id: string,
    otpCode: string
  ) {
    if (id === operatorAdminId) {
      return { error: "You cannot delete your own active administrator account.", status: 400 };
    }

    const target = await prisma.adminUser.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!target) return { error: "Staff user not found", status: 404 };

    const roleName = target.role?.name || "ADMIN";
    if (roleName === "SUPER_ADMIN") {
      const superAdminsCount = await prisma.adminUser.count({
        where: {
          role: { name: "SUPER_ADMIN" },
          isActive: true,
        },
      });
      if (superAdminsCount <= 1) {
        return { error: "Cannot delete the last active Super Admin account.", status: 400 };
      }
    }

    const otpCheck = await this.verifyOtpChallenge(sql, operatorAdminId, "DELETE_STAFF", otpCode);
    if (!otpCheck.valid) {
      return { error: otpCheck.error, status: 403 };
    }

    await prisma.adminSession.deleteMany({ where: { adminId: id } });
    await prisma.adminUser.delete({ where: { id } });

    await writeAudit(sql, {
      adminId: operatorAdminId,
      action: "DELETE_STAFF_USER",
      entityType: "AdminUser",
      entityId: id,
      metadata: { email: target.email, name: target.name, role: roleName },
    });

    return { success: true, deletedId: id };
  }
}

export const verifyOtpChallenge = StaffService.verifyOtpChallenge.bind(StaffService);
