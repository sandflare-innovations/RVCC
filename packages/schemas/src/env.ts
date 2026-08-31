import { z } from "zod";

/**
 * Common shared environment variable schema for web applications (Next.js).
 */
export const baseNextAppEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_VENDOR_PORTAL_URL: z.string().url().optional(),
  NEXT_PUBLIC_ADMIN_PORTAL_URL: z.string().url().optional(),
});

/**
 * Admin App environment schema.
 */
export const adminEnvSchema = baseNextAppEnvSchema.extend({
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
});

/**
 * Vendor App environment schema.
 */
export const vendorEnvSchema = baseNextAppEnvSchema.extend({
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

/**
 * Public Web App environment schema.
 */
export const webEnvSchema = baseNextAppEnvSchema.extend({
  NEXT_PUBLIC_ASSET_CDN_URL: z.string().url().optional(),
  NEXT_PUBLIC_PDF_CDN_URL: z.string().url().optional(),
  DOC_PASSWORD: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  ANALYZE: z.enum(["true", "false"]).optional(),
});

/**
 * Procurement App environment schema.
 */
export const procurementEnvSchema = baseNextAppEnvSchema;

/**
 * Unified API environment schema.
 */
export const apiEnvSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_READ_URL: z.string().optional(),
  ALLOWED_ORIGINS: z.string().default(
    "https://rvcc-enquiry.vercel.app,https://rvcc-vendor.vercel.app,https://rvcc-admin.vercel.app,http://localhost:3000,http://localhost:3001,http://localhost:3002"
  ),
  VENDOR_PORTAL_URL: z.string().url().default("https://rvcc-vendor.vercel.app"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z.enum(["true", "false"]).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  ENQUIRE_FROM_EMAIL: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
});

/**
 * Helper to validate environment variables against a schema with formatted error output.
 */
export function validateEnv<T extends z.ZodTypeAny>(
  schema: T,
  rawEnv?: Record<string, unknown>
): z.infer<T> {
  const envSource =
    rawEnv ??
    (typeof globalThis !== "undefined" && "process" in globalThis
      ? (globalThis as unknown as { process: { env: Record<string, unknown> } }).process.env
      : {});
  const result = schema.safeParse(envSource);
  if (!result.success) {
    const formatted = result.error.format();
    console.error("❌ Invalid environment variables:", JSON.stringify(formatted, null, 2));
    throw new Error("Invalid environment configuration. Check logs above.");
  }
  return result.data;
}

export type BaseNextAppEnv = z.infer<typeof baseNextAppEnvSchema>;
export type AdminEnv = z.infer<typeof adminEnvSchema>;
export type VendorEnv = z.infer<typeof vendorEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;
export type ProcurementEnv = z.infer<typeof procurementEnvSchema>;
export type ApiEnv = z.infer<typeof apiEnvSchema>;
