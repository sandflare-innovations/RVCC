import {
  adminRoleNameSchema,
  createAuditLogSchema,
  portalAccessSchema,
  ROLE_RANK,
  z,
} from "@rvcc/schemas";

// ── Admin Roles & Constants ───────────────────────────────────────────────

export const adminRoleNameEnumSchema = adminRoleNameSchema;
export type AdminRoleName = z.infer<typeof adminRoleNameSchema>;

export const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14d
export const VENDOR_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7d
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MS = 1000 * 60 * 15;

export { ROLE_RANK };

// ── Admin Identity & Results ───────────────────────────────────────────────

export const adminIdentitySchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: adminRoleNameSchema,
});
export type AdminIdentity = z.infer<typeof adminIdentitySchema>;

export const loginSuccessResultSchema = z.object({
  ok: z.literal(true),
  adminId: z.string(),
  admin: adminIdentitySchema,
});

export const loginFailureResultSchema = z.object({
  ok: z.literal(false),
  reason: z.enum(["invalid", "locked", "disabled"]),
  retryAfterMs: z.number().optional(),
});

export const loginResultSchema = z.discriminatedUnion("ok", [
  loginSuccessResultSchema,
  loginFailureResultSchema,
]);
export type LoginResult = z.infer<typeof loginResultSchema>;

export const staffListItemSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  position: z.string(),
  department: z.string(),
  phone: z.string(),
  role: adminRoleNameSchema,
  isActive: z.boolean(),
  lastLoginAt: z.string().nullable(),
  failedAttempts: z.number().int(),
  isLocked: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type StaffListItem = z.infer<typeof staffListItemSchema>;

export const roleItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  isSystem: z.boolean(),
  adminCount: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type RoleItem = z.infer<typeof roleItemSchema>;

export const auditLogEntrySchema = createAuditLogSchema.extend({
  adminId: z.string().nullable().optional(),
  vendorId: z.string().nullable().optional(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  actorName: z.string().optional(),
  actorRole: z.string().optional(),
  previousStatus: z.string().nullable().optional(),
  newStatus: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;

// ── Vendor Identity & Results ──────────────────────────────────────────────

export const vendorLoginSuccessSchema = z.object({
  ok: z.literal(true),
  vendorId: z.string(),
  mustChangePassword: z.boolean(),
  portalAccess: portalAccessSchema,
  vendor: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
  }),
});

export const vendorLoginFailureSchema = z.object({
  ok: z.literal(false),
  reason: z.enum(["invalid", "locked", "disabled", "held", "incomplete"]),
  retryAfterMs: z.number().optional(),
});

export const vendorLoginResultSchema = z.discriminatedUnion("ok", [
  vendorLoginSuccessSchema,
  vendorLoginFailureSchema,
]);
export type VendorLoginResult = z.infer<typeof vendorLoginResultSchema>;

export const vendorIdentitySchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  mustChangePassword: z.boolean(),
  registrationId: z.string().nullable(),
  portalAccess: portalAccessSchema,
  registrationComplete: z.boolean(),
});
export type VendorIdentity = z.infer<typeof vendorIdentitySchema>;

