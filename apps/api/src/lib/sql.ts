import postgres from "postgres";

import type { Env } from "../config/env";

export type Sql = ReturnType<typeof postgres>;

let primarySql: Sql | null = null;
let primaryUrl: string | null = null;
let replicaSql: Sql | null = null;
let replicaUrl: string | null = null;

function resolveDatabaseUrl(env: Env, readOnly = false): string {
  if (readOnly && env.DATABASE_READ_URL?.trim()) {
    return env.DATABASE_READ_URL.trim();
  }
  return env.DATABASE_URL;
}

/** Hyperdrive / Workers: reuse one client per isolate, max 1 connection. */
function clientFor(url: string): Sql {
  return postgres(url, {
    max: 1,
    idle_timeout: 30,
    connect_timeout: 10,
    prepare: false,
  });
}

export function createSql(env: Env, options: { readOnly?: boolean } = {}): Sql {
  const databaseUrl = resolveDatabaseUrl(env, options.readOnly);
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL");
  }

  if (options.readOnly && env.DATABASE_READ_URL?.trim()) {
    if (replicaSql && replicaUrl === databaseUrl) return replicaSql;
    replicaUrl = databaseUrl;
    replicaSql = clientFor(databaseUrl);
    return replicaSql;
  }

  if (primarySql && primaryUrl === databaseUrl) return primarySql;
  primaryUrl = databaseUrl;
  primarySql = clientFor(databaseUrl);
  return primarySql;
}

/** Read replica when `DATABASE_READ_URL` is set — falls back to primary. */
export function createReadSql(env: Env): Sql {
  return createSql(env, { readOnly: true });
}

/** Drop pooled clients so the next query opens a fresh connection (stale isolate sockets). */
export function resetSqlPool(): void {
  primarySql = null;
  primaryUrl = null;
  replicaSql = null;
  replicaUrl = null;
}

export function isTransientDbError(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err).toLowerCase();
  return (
    msg.includes("connect") ||
    msg.includes("connection") ||
    msg.includes("timeout") ||
    msg.includes("econnreset") ||
    msg.includes("closed") ||
    msg.includes("terminated") ||
    msg.includes("socket") ||
    msg.includes("broken pipe")
  );
}

/** Retry once after resetting the pool — covers Worker/Hyperdrive cold starts. */
export async function withDbRetry<T>(env: Env, fn: (sql: Sql) => Promise<T>): Promise<T> {
  try {
    return await fn(createSql(env));
  } catch (err) {
    if (!isTransientDbError(err)) throw err;
    console.warn("[db] transient error, retrying with fresh pool", err);
    resetSqlPool();
    return await fn(createSql(env));
  }
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
