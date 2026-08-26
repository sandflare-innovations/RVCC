import { z } from "zod";

/**
 * Authentication & OTP Schemas
 */
export const otpRequestSchema = z.object({
  email: z
    .string()
    .email()
    .transform((e) => e.trim().toLowerCase()),
});

export const otpVerifySchema = z.object({
  email: z
    .string()
    .email()
    .transform((e) => e.trim().toLowerCase()),
  code: z.string().regex(/^\d{6}$/),
});

/**
 * Enquiry & Vendor Registration Schemas
 */
export const companySchema = z.object({
  legalName: z.string().optional().default(""),
  dbaName: z.string().optional().default(""),
  country: z.string().optional().default(""),
  taxIdentifiers: z
    .object({
      vat: z.string().optional().default(""),
      cr: z.string().optional().default(""),
      tin: z.string().optional().default(""),
    })
    .optional()
    .default({ vat: "", cr: "", tin: "" }),
  organizationType: z.string().optional().default(""),
  supplierType: z.string().optional().default(""),
  website: z.string().optional().default(""),
  yearEstablished: z.string().optional().default(""),
  dunsNumber: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

export const contactItemSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().optional().default(""),
  lastName: z.string().optional().default(""),
  email: z.string().email().or(z.literal("")).optional().default(""),
  jobTitle: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  mobile: z.string().optional().default(""),
  isAdministrative: z.boolean().optional().default(false),
  requestUserAccount: z.boolean().optional().default(false),
});

export const addressItemSchema = z.object({
  id: z.string().optional(),
  label: z.string().optional().default(""),
  line1: z.string().optional().default(""),
  line2: z.string().optional().default(""),
  city: z.string().optional().default(""),
  region: z.string().optional().default(""),
  postalCode: z.string().optional().default(""),
  country: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().optional().default(""),
  isPrimary: z.boolean().optional().default(false),
  addressType: z.string().optional().default(""),
});

export const bankItemSchema = z.object({
  id: z.string().optional(),
  beneficiaryName: z.string().optional().default(""),
  bankName: z.string().optional().default(""),
  accountNumber: z.string().optional().default(""),
  iban: z.string().optional().default(""),
  swiftCode: z.string().optional().default(""),
  routingNumber: z.string().optional().default(""),
  branchName: z.string().optional().default(""),
  currency: z.string().optional().default(""),
  country: z.string().optional().default(""),
  isPrimary: z.boolean().optional().default(false),
});

export const productsStepSchema = z.object({
  categories: z.array(z.string()).default([]),
  capabilities: z.array(z.string()).default([]),
  materials: z.array(z.string()).default([]),
  comments: z.string().optional().default(""),
});

export const questionnaireStepSchema = z.record(z.unknown()).default({});

export const registrationPayloadSchema = z.object({
  company: companySchema,
  contacts: z.array(contactItemSchema).default([]),
  addresses: z.array(addressItemSchema).default([]),
  bank: z.array(bankItemSchema).default([]),
  products: productsStepSchema.optional(),
  questionnaire: questionnaireStepSchema.optional(),
});

export const businessClassificationSchema = z.object({
  classification: z.string().optional().default(""),
  certificateNumber: z.string().optional().default(""),
  certifyingAgency: z.string().optional().default(""),
  effectiveDate: z.string().optional().default(""),
  expirationDate: z.string().optional().default(""),
});

export const draftPatchSchema = z.object({
  company: companySchema.partial().optional(),
  contacts: z.array(contactItemSchema).optional(),
  addresses: z.array(addressItemSchema).optional(),
  bank: z.array(bankItemSchema).optional(),
  bankAccounts: z.array(z.record(z.unknown())).optional(),
  classifications: z.array(businessClassificationSchema.or(z.record(z.unknown()))).optional(),
  products: productsStepSchema.partial().optional(),
  productCategories: z.array(z.string()).optional(),
  questionnaire: z.union([questionnaireStepSchema, z.array(z.object({ questionKey: z.string(), answer: z.string() }))]).optional(),
  step: z.string().optional(),
  currentStep: z.union([z.number().int().min(0).max(10), z.string()]).optional(),
});

export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type CompanyInput = z.infer<typeof companySchema>;
export type ContactItemInput = z.infer<typeof contactItemSchema>;
export type AddressItemInput = z.infer<typeof addressItemSchema>;
export type BankItemInput = z.infer<typeof bankItemSchema>;
export type RegistrationPayload = z.infer<typeof registrationPayloadSchema>;
export type DraftPatchInput = z.infer<typeof draftPatchSchema>;

