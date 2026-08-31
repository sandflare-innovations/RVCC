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
