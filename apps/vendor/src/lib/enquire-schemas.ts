import { z } from "zod";

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
  purposes: z.array(z.string()).optional().default([]),
});

export const classificationItemSchema = z.object({
  id: z.string().optional(),
  classification: z.string().optional().default(""),
  certificateNumber: z.string().optional().default(""),
  certifyingAgency: z.string().optional().default(""),
  effectiveDate: z.string().optional().default(""),
  expirationDate: z.string().optional().default(""),
});

export const bankItemSchema = z.object({
  id: z.string().optional(),
  country: z.string().optional().default(""),
  bankName: z.string().optional().default(""),
  branchName: z.string().optional().default(""),
  accountName: z.string().optional().default(""),
  accountNumber: z.string().optional().default(""),
  iban: z.string().optional().default(""),
  routingNumber: z.string().optional().default(""),
  currency: z.string().optional().default("SAR"),
});

export const draftPatchSchema = z.object({
  step: z.string(),
  company: companySchema.optional(),
  contacts: z.array(contactItemSchema).optional(),
  addresses: z.array(addressItemSchema).optional(),
  classifications: z.array(classificationItemSchema).optional(),
  bankAccounts: z.array(bankItemSchema).optional(),
  productCategories: z.array(z.string()).optional(),
  questionnaire: z.array(z.object({ questionKey: z.string(), answer: z.string() })).optional(),
});
