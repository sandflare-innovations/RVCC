import { z } from "zod";

/**
 * Common Primitives & Sanitary Filters
 */
export const cuidSchema = z
  .string()
  .min(1, "Identifier is required")
  .max(64, "Identifier exceeds maximum length");

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(255, "Email too long")
  .transform((val) => val.trim().toLowerCase());

export const sanitizedStringSchema = (min = 0, max = 500) =>
  z
    .string()
    .max(max, `Text exceeds maximum allowed length of ${max} characters`)
    .transform((val) => val.trim())
    .refine((val) => val.length >= min, {
      message: `Must be at least ${min} characters`,
    });

export const positiveDecimalSchema = z
  .union([z.number().positive(), z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid monetary amount")])
  .transform((v) => (typeof v === "number" ? v : parseFloat(v)));

export const nonNegativeDecimalSchema = z
  .union([z.number().min(0), z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid monetary amount")])
  .transform((v) => (typeof v === "number" ? v : parseFloat(v)));

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
