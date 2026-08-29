import { z } from "zod";
import { cuidSchema, sanitizedStringSchema } from "./common";
import { businessRelationshipSchema, currencySchema, registrationStatusSchema } from "./enums";

/**
 * Vendor Onboarding & Registration Schemas
 */
export const companySchema = z.object({
  legalName: sanitizedStringSchema(0, 200).default(""),
  dbaName: sanitizedStringSchema(0, 200).default(""),
  country: sanitizedStringSchema(0, 100).default(""),
  taxIdentifiers: z
    .object({
      vat: sanitizedStringSchema(0, 50).default(""),
      cr: sanitizedStringSchema(0, 50).default(""),
      tin: sanitizedStringSchema(0, 50).default(""),
    })
    .default({ vat: "", cr: "", tin: "" }),
  organizationType: sanitizedStringSchema(0, 100).default(""),
  supplierType: sanitizedStringSchema(0, 100).default(""),
  website: sanitizedStringSchema(0, 255).default(""),
  yearEstablished: sanitizedStringSchema(0, 10).default(""),
  dunsNumber: sanitizedStringSchema(0, 50).default(""),
  description: sanitizedStringSchema(0, 2000).default(""),
});
export type CompanyInput = z.infer<typeof companySchema>;

export const contactItemSchema = z.object({
  id: cuidSchema.optional(),
  firstName: sanitizedStringSchema(0, 80).default(""),
  lastName: sanitizedStringSchema(0, 80).default(""),
  email: z
    .string()
    .email()
    .or(z.literal(""))
    .default("")
    .transform((e) => e.trim().toLowerCase()),
  jobTitle: sanitizedStringSchema(0, 100).default(""),
  phone: sanitizedStringSchema(0, 30).default(""),
  mobile: sanitizedStringSchema(0, 30).default(""),
  isAdministrative: z.boolean().default(false),
  requestUserAccount: z.boolean().default(false),
});
export type ContactItemInput = z.infer<typeof contactItemSchema>;

export const addressItemSchema = z.object({
  id: cuidSchema.optional(),
  label: sanitizedStringSchema(0, 100).default(""),
  line1: sanitizedStringSchema(0, 255).default(""),
  line2: sanitizedStringSchema(0, 255).default(""),
  city: sanitizedStringSchema(0, 100).default(""),
  region: sanitizedStringSchema(0, 100).default(""),
  postalCode: sanitizedStringSchema(0, 30).default(""),
  country: sanitizedStringSchema(0, 100).default(""),
  phone: sanitizedStringSchema(0, 30).default(""),
  email: z
    .string()
    .email()
    .or(z.literal(""))
    .default("")
    .transform((e) => e.trim().toLowerCase()),
  isPrimary: z.boolean().default(false),
  addressType: sanitizedStringSchema(0, 50).default(""),
  purposes: z.array(z.string().max(50)).default([]),
});
export type AddressItemInput = z.infer<typeof addressItemSchema>;

export const bankItemSchema = z.object({
  id: cuidSchema.optional(),
  beneficiaryName: sanitizedStringSchema(0, 150).default(""),
  accountName: sanitizedStringSchema(0, 150).default(""),
  bankName: sanitizedStringSchema(0, 150).default(""),
  accountNumber: sanitizedStringSchema(0, 50).default(""),
  iban: sanitizedStringSchema(0, 50).default(""),
  swiftCode: sanitizedStringSchema(0, 30).default(""),
  routingNumber: sanitizedStringSchema(0, 50).default(""),
  branchName: sanitizedStringSchema(0, 100).default(""),
  currency: currencySchema.default("SAR"),
  country: sanitizedStringSchema(0, 100).default(""),
  isPrimary: z.boolean().default(false),
});
export type BankItemInput = z.infer<typeof bankItemSchema>;

export const businessClassificationSchema = z.object({
  classification: sanitizedStringSchema(0, 100).default(""),
  certificateNumber: sanitizedStringSchema(0, 100).default(""),
  certifyingAgency: sanitizedStringSchema(0, 150).default(""),
  effectiveDate: sanitizedStringSchema(0, 30).default(""),
  expirationDate: sanitizedStringSchema(0, 30).default(""),
});
export type BusinessClassificationInput = z.infer<typeof businessClassificationSchema>;

export const productsStepSchema = z.object({
  categories: z.array(sanitizedStringSchema(0, 100)).default([]),
  capabilities: z.array(sanitizedStringSchema(0, 100)).default([]),
  materials: z.array(sanitizedStringSchema(0, 100)).default([]),
  comments: sanitizedStringSchema(0, 1000).default(""),
});
export type ProductsStepInput = z.infer<typeof productsStepSchema>;

export const questionnaireStepSchema = z.record(z.unknown()).default({});
export type QuestionnaireStepInput = z.infer<typeof questionnaireStepSchema>;

export const registrationPayloadSchema = z.object({
  company: companySchema,
  contacts: z.array(contactItemSchema).default([]),
  addresses: z.array(addressItemSchema).default([]),
  bank: z.array(bankItemSchema).default([]),
  products: productsStepSchema.optional(),
  questionnaire: questionnaireStepSchema.optional(),
});
export type RegistrationPayload = z.infer<typeof registrationPayloadSchema>;

export const draftPatchSchema = z.object({
  company: companySchema.partial().optional(),
  contacts: z.array(contactItemSchema).optional(),
  addresses: z.array(addressItemSchema).optional(),
  bank: z.array(bankItemSchema).optional(),
  bankAccounts: z.array(z.record(z.unknown())).optional(),
  classifications: z.array(businessClassificationSchema.or(z.record(z.unknown()))).optional(),
  products: productsStepSchema.partial().optional(),
  productCategories: z.array(z.string()).optional(),
  questionnaire: z
    .union([
      questionnaireStepSchema,
      z.array(z.object({ questionKey: z.string(), answer: z.string() })),
    ])
    .optional(),
  step: z.string().optional(),
  currentStep: z.union([z.number().int().min(0).max(10), z.string()]).optional(),
});
export type DraftPatchInput = z.infer<typeof draftPatchSchema>;

export const reviewRegistrationSchema = z.object({
  status: registrationStatusSchema,
  businessRelationship: businessRelationshipSchema.optional(),
  reviewNote: sanitizedStringSchema(0, 1000).default(""),
});
export type ReviewRegistrationInput = z.infer<typeof reviewRegistrationSchema>;
