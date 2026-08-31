import { type ProcurementEnv,procurementEnvSchema, validateEnv } from "@rvcc/schemas";

export const env: ProcurementEnv = validateEnv(procurementEnvSchema, {
  NODE_ENV: process.env.NODE_ENV,
  API_URL: process.env.API_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_VENDOR_PORTAL_URL: process.env.NEXT_PUBLIC_VENDOR_PORTAL_URL,
  NEXT_PUBLIC_ADMIN_PORTAL_URL: process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL,
});
