import { z } from "zod";
import {
  cuidSchema,
  emailSchema,
  nonNegativeDecimalSchema,
  positiveDecimalSchema,
  sanitizedStringSchema,
} from "./common";
import {
  currencySchema,
  inviteStatusSchema,
  procurementPrioritySchema,
  quotationSourceSchema,
  quoteAttachmentKindSchema,
  quoteEvaluationStatusSchema,
  rankingStrategySchema,
  requirementStatusSchema,
} from "./enums";

/**
 * Requirement create. Closing time is optional until Admin configures bidding.
 * `project` stays for backwards compatibility with the existing RFQ form.
 */
export const createRequirementSchema = z.object({
  title: sanitizedStringSchema(1, 200).optional(),
  project: sanitizedStringSchema(1, 200).optional(),
  productServiceName: sanitizedStringSchema(0, 200).optional().default(""),
  category: sanitizedStringSchema(0, 100).optional().default("General"),
  description: sanitizedStringSchema(0, 5000).optional().default(""),
  scopeOfWork: sanitizedStringSchema(0, 5000).optional().default(""),
  specifications: sanitizedStringSchema(0, 8000).optional().default(""),
  quantity: positiveDecimalSchema.optional().default(1),
  unit: sanitizedStringSchema(0, 50).optional().default("pcs"),
  requiredDeliveryDate: z.union([z.string(), z.date()]).nullable().optional(),
  deliveryLocation: sanitizedStringSchema(0, 300).optional().default(""),
  requestingDepartment: sanitizedStringSchema(0, 120).optional().default(""),
  priority: procurementPrioritySchema.optional().default("MEDIUM"),
  internalNotes: sanitizedStringSchema(0, 4000).optional().default(""),
  estimatedBudget: nonNegativeDecimalSchema.nullable().optional(),
  sellingPrice: nonNegativeDecimalSchema.optional(),
  targetPrice: nonNegativeDecimalSchema.optional(),
  currency: currencySchema.default("SAR"),
  closesAt: z.union([z.string(), z.date()]).optional(),
  invitedVendorIds: z.array(cuidSchema).default([]),
  vendorUserIds: z.array(cuidSchema).optional(),
});
export type CreateRequirementInput = z.infer<typeof createRequirementSchema>;

export const updateRequirementSchema = createRequirementSchema.partial().extend({
  status: requirementStatusSchema.optional(),
});
export type UpdateRequirementInput = z.infer<typeof updateRequirementSchema>;

export const submitQuoteSchema = z.object({
  requirementId: cuidSchema.optional(),
  currency: currencySchema.default("SAR"),
  exchangeRate: positiveDecimalSchema.default(1.0),
  newPrice: nonNegativeDecimalSchema.optional(),
  unitPrice: nonNegativeDecimalSchema.optional(),
  quantity: positiveDecimalSchema.optional(),
  vatRate: nonNegativeDecimalSchema.optional().default(0),
  vatAmount: nonNegativeDecimalSchema.optional(),
  totalPrice: nonNegativeDecimalSchema.optional(),
  deliveryPeriodDays: z.coerce.number().int().min(0).nullable().optional(),
  paymentTerms: sanitizedStringSchema(0, 500).optional().default(""),
  warranty: sanitizedStringSchema(0, 500).optional().default(""),
  notes: sanitizedStringSchema(0, 4000).optional().default(""),
  remarks: sanitizedStringSchema(0, 2000).optional().default(""),
  submit: z.boolean().optional().default(false),
});
export type SubmitQuoteInput = z.infer<typeof submitQuoteSchema>;

export const awardQuoteSchema = z.object({
  quoteId: cuidSchema,
  adminNotes: sanitizedStringSchema(0, 1000).default(""),
});
export type AwardQuoteInput = z.infer<typeof awardQuoteSchema>;

export const manualQuotationSchema = z.object({
  vendorUserId: cuidSchema.nullable().optional(),
  supplierName: sanitizedStringSchema(1, 200),
  contactPerson: sanitizedStringSchema(0, 120).optional().default(""),
  phone: sanitizedStringSchema(0, 40).optional().default(""),
  email: sanitizedStringSchema(0, 255).optional().default(""),
  currency: currencySchema.default("SAR"),
  quantity: positiveDecimalSchema.default(1),
  unitPrice: nonNegativeDecimalSchema,
  vatRate: nonNegativeDecimalSchema.optional().default(0),
  deliveryPeriod: sanitizedStringSchema(0, 200).optional().default(""),
  paymentTerms: sanitizedStringSchema(0, 500).optional().default(""),
  validity: sanitizedStringSchema(0, 200).optional().default(""),
  warranty: sanitizedStringSchema(0, 500).optional().default(""),
  remarks: sanitizedStringSchema(0, 2000).optional().default(""),
  source: quotationSourceSchema.default("OTHER"),
  receivedAt: z.union([z.string(), z.date()]).optional(),
});
export type ManualQuotationInput = z.infer<typeof manualQuotationSchema>;

export const bidConfigSchema = z.object({
  targetPrice: nonNegativeDecimalSchema,
  estimatedBudget: nonNegativeDecimalSchema.nullable().optional(),
  currency: currencySchema.optional(),
  opensAt: z.union([z.string(), z.date()]).optional(),
  closesAt: z.union([z.string(), z.date()]),
  minAcceptablePrice: nonNegativeDecimalSchema.nullable().optional(),
  maxAcceptablePrice: nonNegativeDecimalSchema.nullable().optional(),
  rankingStrategy: rankingStrategySchema.default("CLOSEST_TO_TARGET"),
  allowBidRevisions: z.boolean().optional().default(true),
  revealCompetitorPrices: z.boolean().optional().default(false),
  revealTargetPrice: z.boolean().optional().default(false),
  priceWeight: nonNegativeDecimalSchema.optional(),
  technicalWeight: nonNegativeDecimalSchema.optional(),
  commercialWeight: nonNegativeDecimalSchema.optional(),
  bidRules: sanitizedStringSchema(0, 8000).optional().default(""),
  eligibilityNotes: sanitizedStringSchema(0, 4000).optional().default(""),
  requiredDocuments: z.array(sanitizedStringSchema(1, 120)).optional().default([]),
  termsAndConditions: sanitizedStringSchema(0, 8000).optional().default(""),
});
export type BidConfigInput = z.infer<typeof bidConfigSchema>;

export const inviteSuppliersSchema = z.object({
  vendorUserIds: z.array(cuidSchema).default([]),
  newSuppliers: z
    .array(
      z.object({
        name: sanitizedStringSchema(1, 120),
        email: emailSchema,
        phone: sanitizedStringSchema(0, 40).optional().default(""),
      })
    )
    .default([]),
  sendEmail: z.boolean().optional().default(true),
});
export type InviteSuppliersInput = z.infer<typeof inviteSuppliersSchema>;

export const quoteEvaluationActionSchema = z.object({
  action: quoteEvaluationStatusSchema,
  note: sanitizedStringSchema(0, 2000).optional().default(""),
  technicalScore: nonNegativeDecimalSchema.nullable().optional(),
  commercialScore: nonNegativeDecimalSchema.nullable().optional(),
});
export type QuoteEvaluationActionInput = z.infer<typeof quoteEvaluationActionSchema>;

export const inviteRespondSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED"]),
  declineReason: sanitizedStringSchema(0, 1000).optional().default(""),
});
export type InviteRespondInput = z.infer<typeof inviteRespondSchema>;

export { quoteAttachmentKindSchema, inviteStatusSchema };
