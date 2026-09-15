import { z } from "zod";
import { cuidSchema, emailSchema, sanitizedStringSchema } from "./common";
import { adminRoleNameSchema } from "./enums";

/**
 * RBAC & Staff Management Schemas
 */
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name too long")
    .regex(
      /^[A-Z0-9_]+$/,
      "Role name must be uppercase alphanumeric with underscores (e.g. PROCUREMENT_MANAGER)"
    ),
  description: sanitizedStringSchema(0, 255).default(""),
  permissionIds: z.array(cuidSchema).default([]),
});
export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = createRoleSchema.partial();
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const createStaffMemberSchema = z.object({
  email: emailSchema,
  name: sanitizedStringSchema(1, 120),
  position: sanitizedStringSchema(0, 100).default(""),
  department: sanitizedStringSchema(0, 100).default(""),
  phone: sanitizedStringSchema(0, 30).default(""),
  roleId: cuidSchema.optional(),
  roleName: adminRoleNameSchema.optional(),
  password: z.string().min(8, "Initial password must be at least 8 characters").max(128).optional(),
});
export type CreateStaffMemberInput = z.infer<typeof createStaffMemberSchema>;

export const updateStaffMemberSchema = z.object({
  name: sanitizedStringSchema(1, 120).optional(),
  position: sanitizedStringSchema(0, 100).optional(),
  department: sanitizedStringSchema(0, 100).optional(),
  phone: sanitizedStringSchema(0, 30).optional(),
  roleId: cuidSchema.nullable().optional(),
  roleName: adminRoleNameSchema.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateStaffMemberInput = z.infer<typeof updateStaffMemberSchema>;

/**
 * RBAC Role Hierarchy & Helper Functions
 */
export type AdminRoleName = z.infer<typeof adminRoleNameSchema>;

export const ROLE_RANK: Record<AdminRoleName, number> = {
  REVIEWER: 1,
  WEBSITE_ADMIN: 2,
  VENDOR_ADMIN: 2,
  PROCUREMENT_ADMIN: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export function canManageStaff(role: AdminRoleName): boolean {
  return role === "SUPER_ADMIN";
}

export function canManageVendors(role: AdminRoleName): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "VENDOR_ADMIN";
}

export function canManageProcurement(role: AdminRoleName): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "PROCUREMENT_ADMIN";
}

/** Procurement staff may create requirements and capture offline quotations. */
export function canCaptureQuotations(role: AdminRoleName): boolean {
  return canManageProcurement(role);
}

/** Only Admin+ may set the confidential target, open bidding, evaluate, and award. */
export function canConfigureBidding(role: AdminRoleName): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

/**
 * Target price is confidential. Procurement staff see it after they submit
 * the requirement. Vendors never see it through this helper.
 */
export function canSeeConfidentialTarget(role: AdminRoleName, status: string): boolean {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return true;
  if (role !== "PROCUREMENT_ADMIN") return false;
  return [
    "SUBMITTED_TO_ADMIN",
    "PENDING",
    "OPEN",
    "BIDDING_CLOSED",
    "EVALUATING",
    "SHORTLISTED",
    "AWARDED",
    "CANCELLED",
  ].includes(status);
}

export function canManageWebsite(role: AdminRoleName): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "WEBSITE_ADMIN";
}

export function hasRole(role: AdminRoleName, minimum: AdminRoleName): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

