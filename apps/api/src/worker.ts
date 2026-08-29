/**
 * Cloudflare Workers entry for the unified Hono API.
 * Local Node entry remains src/index.ts.
 */
import { createApp } from "./app";

export type WorkerEnv = {
  DATABASE_URL: string;
  DATABASE_READ_URL?: string;
  ALLOWED_ORIGINS?: string;
  VENDOR_PORTAL_URL?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_SECURE?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  ENQUIRE_FROM_EMAIL?: string;
  R2_PUBLIC_URL?: string;
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
  UPLOADS?: import("./config/env").R2Bucket;
};

function toAppEnv(env: WorkerEnv): import("./config/env").Env {
  return {
    DATABASE_URL: env.DATABASE_URL,
    DATABASE_READ_URL: env.DATABASE_READ_URL?.trim() || undefined,
    ALLOWED_ORIGINS:
      env.ALLOWED_ORIGINS?.trim() ||
      "https://rvcc-enquiry.vercel.app,https://rvcc-vendor.vercel.app,https://rvcc-admin.vercel.app,http://localhost:3000,http://localhost:3001,http://localhost:3002",
    VENDOR_PORTAL_URL: (env.VENDOR_PORTAL_URL || "https://rvcc-vendor.vercel.app").replace(
      /\/$/,
      ""
    ),
    SMTP_HOST: env.SMTP_HOST,
    SMTP_PORT: env.SMTP_PORT,
    SMTP_SECURE: env.SMTP_SECURE,
    SMTP_USER: env.SMTP_USER,
    SMTP_PASS: env.SMTP_PASS,
    SMTP_FROM: env.SMTP_FROM,
    ENQUIRE_FROM_EMAIL: env.ENQUIRE_FROM_EMAIL,
    R2_PUBLIC_URL: env.R2_PUBLIC_URL?.trim() || undefined,
    R2_ACCOUNT_ID: env.R2_ACCOUNT_ID?.trim() || undefined,
    R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID?.trim() || undefined,
    R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY?.trim() || undefined,
    R2_BUCKET_NAME: env.R2_BUCKET_NAME?.trim() || undefined,
    uploadsBucket: env.UPLOADS,
    PORT: 0,
    NODE_ENV: "production",
  };
}

import { syncExchangeRates } from "./modules/bidding/fx";

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    if (!env.DATABASE_URL) {
      return new Response(JSON.stringify({ error: "DATABASE_URL not configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }
    process.env.DATABASE_URL = env.DATABASE_URL;
    const app = createApp(toAppEnv(env));
    return app.fetch(request);
  },

  async scheduled(event: any, env: WorkerEnv, ctx: any) {
    if (env.DATABASE_URL) {
      process.env.DATABASE_URL = env.DATABASE_URL;
      ctx.waitUntil(syncExchangeRates());
    }
  }
};
