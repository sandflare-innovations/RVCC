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
 */
export const requirementStatusSchema = z.enum([
  "DRAFT",
  "PENDING",
  "OPEN",
  "AWARDED",
  "CANCELLED",
  "REJECTED",
]);
export type RequirementStatusEnum = z.infer<typeof requirementStatusSchema>;

export const quoteStatusSchema = z.enum(["DRAFT", "SUBMITTED", "ACCEPTED", "REJECTED"]);
export type QuoteStatusEnum = z.infer<typeof quoteStatusSchema>;

/**
 * Procurement Domain Enums
 */
export const procurementStatusSchema = z.enum([
  "DRAFT",
  "SUBMITTED",
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "REVISION_REQUESTED",
]);
export type ProcurementStatusEnum = z.infer<typeof procurementStatusSchema>;

export const procurementPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export type ProcurementPriorityEnum = z.infer<typeof procurementPrioritySchema>;

export const notificationTypeSchema = z.enum([
  "REQUIREMENT_POSTED",
  "QUOTE_SUBMITTED",
  "QUOTE_AWARDED",
]);
export type NotificationTypeEnum = z.infer<typeof notificationTypeSchema>;
