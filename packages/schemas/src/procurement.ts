import { z } from "zod";
import {
  cuidSchema,
  nonNegativeDecimalSchema,
  positiveDecimalSchema,
  sanitizedStringSchema,
} from "./common";
import { currencySchema, procurementPrioritySchema, procurementStatusSchema } from "./enums";

/**
 * Purchase Request Line Item Schema (Input)
 */
export const purchaseRequestItemSchema = z.object({
  id: cuidSchema.optional(),
  name: sanitizedStringSchema(1, 200),
  category: sanitizedStringSchema(1, 100).default("General"),
  quantity: positiveDecimalSchema,
  unit: sanitizedStringSchema(1, 50).default("pcs"),
  currency: currencySchema.default("SAR"),
  exchangeRate: positiveDecimalSchema.default(1.0),
  estimatedUnitPrice: nonNegativeDecimalSchema.default(0),
  totalPrice: nonNegativeDecimalSchema.default(0),
  preferredVendor: sanitizedStringSchema(0, 200).nullable().optional(),
  notes: sanitizedStringSchema(0, 1000).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});
export type PurchaseRequestItemInput = z.infer<typeof purchaseRequestItemSchema>;

/**
 * Purchase Request Attachment Schema (Input)
 */
export const purchaseRequestAttachmentSchema = z.object({
  id: cuidSchema.optional(),
  name: sanitizedStringSchema(1, 255),
  url: z.string().min(1, "Attachment URL is required"),
  sizeBytes: z.coerce.number().int().nonnegative().optional().default(0),
  mimeType: sanitizedStringSchema(0, 100).optional().default("application/pdf"),
});
export type PurchaseRequestAttachmentInput = z.infer<typeof purchaseRequestAttachmentSchema>;

/**
 * Purchase Request Creation & Update Schemas
 */
export const createPurchaseRequestSchema = z.object({
  title: sanitizedStringSchema(3, 200),
  description: sanitizedStringSchema(0, 2000).default(""),
  department: sanitizedStringSchema(1, 100),
  // Portal may omit this; handleProcurementCreate fills it from the session.
  requesterName: sanitizedStringSchema(1, 120),
  requesterEmail: z.string().email().nullable().optional(),
  priority: procurementPrioritySchema.default("MEDIUM"),
  requiredByDate: z.union([z.string().min(1), z.date()]),
  currency: currencySchema.default("SAR"),
  estimatedAmount: nonNegativeDecimalSchema.default(0),
  costCenter: sanitizedStringSchema(0, 100).nullable().optional(),
  adminNotes: sanitizedStringSchema(0, 2000).nullable().optional(),
  items: z.array(purchaseRequestItemSchema).min(1, "At least one item is required"),
  attachments: z.array(purchaseRequestAttachmentSchema).optional().default([]),
});
export type CreatePurchaseRequestInput = z.infer<typeof createPurchaseRequestSchema>;

export const updatePurchaseRequestSchema = createPurchaseRequestSchema.partial().extend({
  status: procurementStatusSchema.optional(),
});
export type UpdatePurchaseRequestInput = z.infer<typeof updatePurchaseRequestSchema>;

export const reviewPurchaseRequestSchema = z.object({
  status: procurementStatusSchema,
  note: sanitizedStringSchema(0, 2000).nullable().optional(),
  adminNotes: sanitizedStringSchema(0, 2000).optional(),
});
export type ReviewPurchaseRequestInput = z.infer<typeof reviewPurchaseRequestSchema>;

/**
 * Purchase Request DTOs (Output Shapes)
 */
export const purchaseRequestItemDTOSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  quantity: z.number(),
  unit: z.string(),
  estimatedUnitPrice: z.number(),
  totalPrice: z.number(),
  preferredVendor: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type PurchaseRequestItemDTO = z.infer<typeof purchaseRequestItemDTOSchema>;

export const purchaseRequestAttachmentDTOSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.string(),
  url: z.string(),
  uploadedAt: z.string(),
});
export type PurchaseRequestAttachmentDTO = z.infer<typeof purchaseRequestAttachmentDTOSchema>;

export const purchaseRequestAuditDTOSchema = z.object({
  id: z.string(),
  action: z.string(),
  actorName: z.string(),
  actorRole: z.string(),
  timestamp: z.string(),
  note: z.string().nullable().optional(),
  previousStatus: z.string().optional(),
  newStatus: z.string().optional(),
});
export type PurchaseRequestAuditDTO = z.infer<typeof purchaseRequestAuditDTOSchema>;

export const purchaseRequestDetailDTOSchema = z.object({
  id: z.string(),
  referenceNumber: z.string(),
  title: z.string(),
  description: z.string(),
  department: z.string(),
  requesterName: z.string(),
  requesterEmail: z.string().nullable().optional(),
  priority: z.string(),
  status: z.string(),
  requiredByDate: z.string(),
  currency: z.string(),
  totalEstimatedAmount: z.number(),
  costCenter: z.string().nullable().optional(),
  adminNotes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(purchaseRequestItemDTOSchema),
  attachments: z.array(purchaseRequestAttachmentDTOSchema),
  auditTrail: z.array(purchaseRequestAuditDTOSchema),
});
export type PurchaseRequestDetailDTO = z.infer<typeof purchaseRequestDetailDTOSchema>;

export const purchaseRequestListItemDTOSchema = z.object({
  id: z.string(),
  referenceNumber: z.string(),
  title: z.string(),
  description: z.string(),
  department: z.string(),
  requesterName: z.string(),
  requesterEmail: z.string().nullable().optional(),
  priority: z.string(),
  status: z.string(),
  requiredByDate: z.string(),
  currency: z.string(),
  totalEstimatedAmount: z.number(),
  costCenter: z.string().nullable().optional(),
  itemsCount: z.number().int(),
  attachmentsCount: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PurchaseRequestListItemDTO = z.infer<typeof purchaseRequestListItemDTOSchema>;

export const procurementStatsDTOSchema = z.object({
  totalRequests: z.number(),
  pendingReviewCount: z.number(),
  approvedCount: z.number(),
  rejectedCount: z.number(),
  totalEstimatedSpend: z.number(),
  urgentCount: z.number(),
});
export type ProcurementStatsDTO = z.infer<typeof procurementStatsDTOSchema>;
