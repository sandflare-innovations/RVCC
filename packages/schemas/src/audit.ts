import { z } from "zod";
import { cuidSchema, paginationQuerySchema, sanitizedStringSchema } from "./common";

/**
 * Audit Log Schemas
 */
export const createAuditLogSchema = z.object({
  adminId: cuidSchema.nullable().optional(),
  vendorId: cuidSchema.nullable().optional(),
  action: sanitizedStringSchema(1, 100),
  entityType: sanitizedStringSchema(1, 100),
  entityId: cuidSchema,
  actorName: sanitizedStringSchema(0, 150).default(""),
  actorRole: sanitizedStringSchema(0, 100).default(""),
  previousStatus: sanitizedStringSchema(0, 50).nullable().optional(),
  newStatus: sanitizedStringSchema(0, 50).nullable().optional(),
  note: sanitizedStringSchema(0, 2000).nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
});
export type CreateAuditLogInput = z.infer<typeof createAuditLogSchema>;

export const queryAuditLogsSchema = paginationQuerySchema.extend({
  entityType: z.string().max(100).optional(),
  entityId: z.string().max(64).optional(),
  adminId: z.string().max(64).optional(),
  vendorId: z.string().max(64).optional(),
  action: z.string().max(100).optional(),
});
export type QueryAuditLogsInput = z.infer<typeof queryAuditLogsSchema>;
