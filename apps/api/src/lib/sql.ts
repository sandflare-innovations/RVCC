import postgres from "postgres";

import type { Env } from "../config/env";

export type Sql = ReturnType<typeof postgres>;

/** One pooled client per request (same pattern as the Workers). */
export function createSql(env: Env): Sql {
  if (!env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL");
  }
  return postgres(env.DATABASE_URL, {
    // Workers / serverless: one connection per isolate; pooling breaks across requests.
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
}

export function cuid(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashSha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
