/**
 * Process env for the unified API. Loaded once at boot; never expose to browsers.
 */
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
    VENDOR_PORTAL_URL: (
      process.env.VENDOR_PORTAL_URL || "https://rvcc-vendor.vercel.app"
    ).replace(/\/$/, ""),
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    ENQUIRE_FROM_EMAIL: process.env.ENQUIRE_FROM_EMAIL,
    PORT: Number(process.env.PORT || 4000),
    NODE_ENV: process.env.NODE_ENV || "development",
  };
}

/** Alias used by ported Worker modules (same shape, no Hyperdrive / API_SECRET). */
export type Env = AppEnv;
