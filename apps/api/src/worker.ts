/**
 * Cloudflare Workers entry for the unified Hono API.
 * Local Node entry remains src/index.ts.
 */
import { createApp } from "./app";
import type { Env } from "./config/env";

export type WorkerEnv = {
  DATABASE_URL: string;
  ALLOWED_ORIGINS?: string;
  VENDOR_PORTAL_URL?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_SECURE?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  ENQUIRE_FROM_EMAIL?: string;
};

function toAppEnv(env: WorkerEnv): Env {
  return {
    DATABASE_URL: env.DATABASE_URL,
    ALLOWED_ORIGINS: env.ALLOWED_ORIGINS?.trim() || "*",
    VENDOR_PORTAL_URL: (env.VENDOR_PORTAL_URL || "").replace(/\/$/, ""),
    SMTP_HOST: env.SMTP_HOST,
    SMTP_PORT: env.SMTP_PORT,
    SMTP_SECURE: env.SMTP_SECURE,
    SMTP_USER: env.SMTP_USER,
    SMTP_PASS: env.SMTP_PASS,
    SMTP_FROM: env.SMTP_FROM,
    ENQUIRE_FROM_EMAIL: env.ENQUIRE_FROM_EMAIL,
    PORT: 0,
    NODE_ENV: "production",
  };
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    if (!env.DATABASE_URL) {
      return new Response(JSON.stringify({ error: "DATABASE_URL not configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }
    const app = createApp(toAppEnv(env));
    return app.fetch(request);
  },
};
