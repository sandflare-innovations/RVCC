import { z } from "zod";

/**
 * Currency Enum Schema (SAR, USD, AED, INR, EUR)
 */
export const currencySchema = z.enum(["SAR", "USD", "AED", "INR", "EUR"]);
export type CurrencyEnum = z.infer<typeof currencySchema>;

/**
 * Authentication & Security Enums
 */
export const loginStatusSchema = z.enum(["SUCCESS", "FAILED"]);
export type LoginStatusEnum = z.infer<typeof loginStatusSchema>;

export const adminRoleNameSchema = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "PROCUREMENT_ADMIN",
  "VENDOR_ADMIN",
  "WEBSITE_ADMIN",
  "REVIEWER",
]);
export type AdminRoleNameEnum = z.infer<typeof adminRoleNameSchema>;

export const portalAccessSchema = z.enum(["HELD", "RELEASED"]);
export type PortalAccessEnum = z.infer<typeof portalAccessSchema>;

export const businessRelationshipSchema = z.enum(["PROSPECTIVE", "SPEND_AUTHORIZED"]);
export type BusinessRelationshipEnum = z.infer<typeof businessRelationshipSchema>;

/**
 * Vendor Registration Status Enum
 */
export const registrationStatusSchema = z.enum([
  "DRAFT",
  "SUBMITTED",
  "PENDING",
  "APPROVED",
  "REJECTED",
]);
export type RegistrationStatusEnum = z.infer<typeof registrationStatusSchema>;

/**
 * Sourcing & RFQ Status Enums
 * PENDING is a legacy alias of SUBMITTED_TO_ADMIN.
 * OPEN is the live "Bidding Open" stage.
 */
export const REQUIREMENT_STATUSES = [
  "DRAFT",
  "QUOTATION_COLLECTION",
  "SUBMITTED_TO_ADMIN",
  "PENDING",
  "OPEN",
  "BIDDING_CLOSED",
  "EVALUATING",
  "SHORTLISTED",
  "AWARDED",
  "CANCELLED",
  "REJECTED",
] as const;
export const requirementStatusSchema = z.enum(REQUIREMENT_STATUSES);
export type RequirementStatusEnum = z.infer<typeof requirementStatusSchema>;

export const quoteStatusSchema = z.enum(["DRAFT", "SUBMITTED", "ACCEPTED", "REJECTED"]);
export type QuoteStatusEnum = z.infer<typeof quoteStatusSchema>;

export const rankingStrategySchema = z.enum([
  "CLOSEST_TO_TARGET",
  "LOWEST_PRICE",
  "TECHNICAL_COMMERCIAL",
  "WEIGHTED",
]);
export type RankingStrategyEnum = z.infer<typeof rankingStrategySchema>;

export const inviteStatusSchema = z.enum([
  "INVITED",
  "VIEWED",
  "ACCEPTED",
  "DECLINED",
  "BID_SUBMITTED",
]);
export type InviteStatusEnum = z.infer<typeof inviteStatusSchema>;

export const quotationSourceSchema = z.enum([
  "WHATSAPP",
  "EMAIL",
  "PHYSICAL",
  "PHONE",
  "OTHER",
]);
export type QuotationSourceEnum = z.infer<typeof quotationSourceSchema>;

export const quoteEvaluationStatusSchema = z.enum([
  "NONE",
  "SHORTLISTED",
  "REJECTED",
  "CLARIFICATION",
  "REVISED_OFFER",
  "NEGOTIATION",
  "AWARDED",
  "NOT_SELECTED",
]);
export type QuoteEvaluationStatusEnum = z.infer<typeof quoteEvaluationStatusSchema>;

export const quoteAttachmentKindSchema = z.enum(["SUPPORTING", "TECHNICAL", "COMMERCIAL"]);
export type QuoteAttachmentKindEnum = z.infer<typeof quoteAttachmentKindSchema>;

/**
 * Procurement Domain Enums
 */
export const PROCUREMENT_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "REVISION_REQUESTED",
] as const;
export const rawProcurementStatusSchema = z.enum(PROCUREMENT_STATUSES);
export const procurementStatusSchema = z.preprocess(
  (val) => (typeof val === "string" ? val.toUpperCase() : val),
  rawProcurementStatusSchema
);
export type ProcurementStatusEnum = z.infer<typeof rawProcurementStatusSchema>;

export const PROCUREMENT_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const rawProcurementPrioritySchema = z.enum(PROCUREMENT_PRIORITIES);
export const procurementPrioritySchema = z.preprocess(
  (val) => (typeof val === "string" ? val.toUpperCase() : val),
  rawProcurementPrioritySchema
);
export type ProcurementPriorityEnum = z.infer<typeof rawProcurementPrioritySchema>;

export const notificationTypeSchema = z.enum([
  "REQUIREMENT_POSTED",
  "QUOTE_SUBMITTED",
  "QUOTE_AWARDED",
]);
export type NotificationTypeEnum = z.infer<typeof notificationTypeSchema>;
