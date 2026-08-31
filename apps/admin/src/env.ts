import { type AdminEnv,adminEnvSchema, validateEnv } from "@rvcc/schemas";

export const env: AdminEnv = validateEnv(adminEnvSchema, {
  NODE_ENV: process.env.NODE_ENV,
  API_URL: process.env.API_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_VENDOR_PORTAL_URL: process.env.NEXT_PUBLIC_VENDOR_PORTAL_URL,
  NEXT_PUBLIC_ADMIN_PORTAL_URL: process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
});
