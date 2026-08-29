import { z } from "zod";
import { cuidSchema, nonNegativeDecimalSchema, positiveDecimalSchema, sanitizedStringSchema } from "./common";
import { currencySchema, requirementStatusSchema } from "./enums";

/**
 * Requirement / RFQ Schemas
 */
export const createRequirementSchema = z.object({
  project: sanitizedStringSchema(1, 200),
  scopeOfWork: sanitizedStringSchema(5, 5000),
  sellingPrice: nonNegativeDecimalSchema.optional(),
  currency: currencySchema.default("SAR"),
  closesAt: z.coerce.date(),
  invitedVendorIds: z.array(cuidSchema).default([]),
});
export type CreateRequirementInput = z.infer<typeof createRequirementSchema>;

export const updateRequirementSchema = createRequirementSchema.partial().extend({
  status: requirementStatusSchema.optional(),
});
export type UpdateRequirementInput = z.infer<typeof updateRequirementSchema>;

/**
 * Quote Submission & Evaluation Schemas
 */
export const submitQuoteSchema = z.object({
  requirementId: cuidSchema,
  currency: currencySchema.default("SAR"),
  exchangeRate: positiveDecimalSchema.default(1.0),
  newPrice: positiveDecimalSchema,
  remarks: sanitizedStringSchema(0, 2000).default(""),
});
export type SubmitQuoteInput = z.infer<typeof submitQuoteSchema>;

export const awardQuoteSchema = z.object({
  quoteId: cuidSchema,
  adminNotes: sanitizedStringSchema(0, 1000).default(""),
});
export type AwardQuoteInput = z.infer<typeof awardQuoteSchema>;
