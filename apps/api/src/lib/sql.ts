import postgres from "postgres";

import type { Env } from "../config/env";

export type Sql = ReturnType<typeof postgres>;

let singletonSql: Sql | null = null;
let currentDbUrl: string | null = null;

/** Pooled singleton client for high-performance response times across requests. */
export function createSql(env: Env): Sql {
  if (!env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL");
  }
  if (singletonSql && currentDbUrl === env.DATABASE_URL) {
    return singletonSql;
  }
  currentDbUrl = env.DATABASE_URL;
  singletonSql = postgres(env.DATABASE_URL, {
    max: 25,
    idle_timeout: 30,
    connect_timeout: 10,
    prepare: false,
  });
  return singletonSql;
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
