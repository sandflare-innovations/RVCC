/**
 * Process env for the unified API. Loaded once at boot; never expose to browsers.
 */

/** Minimal R2 binding surface (Cloudflare Worker). */
export type R2Bucket = {
  put(
    key: string,
    value: ArrayBuffer | ReadableStream | Uint8Array,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
  delete(key: string): Promise<void>;
};

export type AppEnv = {
  DATABASE_URL: string;
  /** Optional read replica for heavy SELECTs (dashboard aggregates). */
  DATABASE_READ_URL?: string;
  ALLOWED_ORIGINS: string;
  VENDOR_PORTAL_URL: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_SECURE?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  ENQUIRE_FROM_EMAIL?: string;
  /** Public base URL for uploaded files (R2 dev domain or custom CDN). */
  R2_PUBLIC_URL?: string;
  /** S3-compatible R2 credentials (Node local dev / fallback when no binding). */
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
  /** Cloudflare Worker R2 binding — set in worker.ts, not process.env. */
  uploadsBucket?: R2Bucket;
  PORT: number;
  NODE_ENV: string;
};

function required(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

export function loadEnv(): AppEnv {
  return {
    DATABASE_URL: required("DATABASE_URL"),
    DATABASE_READ_URL: process.env.DATABASE_READ_URL?.trim() || undefined,
    ALLOWED_ORIGINS:
      process.env.ALLOWED_ORIGINS?.trim() ||
      "https://rvcc-enquiry.vercel.app,https://rvcc-vendor.vercel.app,https://rvcc-admin.vercel.app,http://localhost:3000,http://localhost:3001,http://localhost:3002",
    VENDOR_PORTAL_URL: (process.env.VENDOR_PORTAL_URL || "https://rvcc-vendor.vercel.app").replace(
      /\/$/,
      ""
    ),
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    ENQUIRE_FROM_EMAIL: process.env.ENQUIRE_FROM_EMAIL,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL?.trim() || undefined,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID?.trim() || undefined,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID?.trim() || undefined,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY?.trim() || undefined,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME?.trim() || undefined,
    PORT: Number(process.env.PORT || 4000),
    NODE_ENV: process.env.NODE_ENV || "development",
  };
}

/** Alias used by ported Worker modules (same shape, no Hyperdrive / API_SECRET). */
export type Env = AppEnv;
