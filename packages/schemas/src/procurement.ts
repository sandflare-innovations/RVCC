import { z } from "zod";
import { cuidSchema, nonNegativeDecimalSchema, positiveDecimalSchema, sanitizedStringSchema } from "./common";
import { currencySchema, procurementPrioritySchema, procurementStatusSchema } from "./enums";

/**
 * Purchase Request Line Item Schema
 */
export const purchaseRequestItemSchema = z.object({
  id: cuidSchema.optional(),
  name: sanitizedStringSchema(1, 200),
  category: sanitizedStringSchema(1, 100),
  quantity: positiveDecimalSchema,
  unit: sanitizedStringSchema(1, 50),
  currency: currencySchema.default("SAR"),
  exchangeRate: positiveDecimalSchema.default(1.0),
  estimatedUnitPrice: nonNegativeDecimalSchema.default(0),
  totalPrice: nonNegativeDecimalSchema.default(0),
  preferredVendor: sanitizedStringSchema(0, 200).optional(),
  notes: sanitizedStringSchema(0, 1000).optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});
export type PurchaseRequestItemInput = z.infer<typeof purchaseRequestItemSchema>;

/**
 * Purchase Request Creation & Update Schemas
 */
export const createPurchaseRequestSchema = z.object({
  title: sanitizedStringSchema(3, 200),
  description: sanitizedStringSchema(0, 2000).default(""),
  department: sanitizedStringSchema(1, 100),
  requesterName: sanitizedStringSchema(1, 120),
  requesterEmail: z.string().email().optional(),
  priority: procurementPrioritySchema.default("MEDIUM"),
  requiredByDate: z.coerce.date(),
  currency: currencySchema.default("SAR"),
  estimatedAmount: nonNegativeDecimalSchema.default(0),
  costCenter: sanitizedStringSchema(0, 100).optional(),
  adminNotes: sanitizedStringSchema(0, 2000).optional(),
  items: z.array(purchaseRequestItemSchema).min(1, "At least one item is required"),
});
export type CreatePurchaseRequestInput = z.infer<typeof createPurchaseRequestSchema>;

export const updatePurchaseRequestSchema = createPurchaseRequestSchema.partial().extend({
  status: procurementStatusSchema.optional(),
});
export type UpdatePurchaseRequestInput = z.infer<typeof updatePurchaseRequestSchema>;

export const reviewPurchaseRequestSchema = z.object({
  status: procurementStatusSchema,
  adminNotes: sanitizedStringSchema(0, 2000).default(""),
});
export type ReviewPurchaseRequestInput = z.infer<typeof reviewPurchaseRequestSchema>;
