import postgres from "postgres";

import type { Env } from "../config/env";
import { isCloudflareWorkerRuntime } from "./runtime";

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

function clientFor(url: string): Sql {
  return postgres(url, {
    max: 1,
    idle_timeout: 30,
    connect_timeout: 10,
    prepare: false,
  });
}

/**
 * Postgres client for this request.
 * Workers: always a fresh client — reusing module-level sockets causes
 * "Cannot perform I/O on behalf of a different request" across isolates.
 * Node: one pooled client per process for local dev.
 */
export function createSql(env: Env, options: { readOnly?: boolean } = {}): Sql {
  const databaseUrl = resolveDatabaseUrl(env, options.readOnly);
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL");
  }

  if (isCloudflareWorkerRuntime()) {
    return clientFor(databaseUrl);
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

/** Close per-request clients on Workers after each fetch handler completes. */
export async function releaseSql(sql: Sql | undefined): Promise<void> {
  if (!sql || !isCloudflareWorkerRuntime()) return;
  try {
    await sql.end({ timeout: 0 });
  } catch {
    /* isolate may already be tearing down */
  }
}

/** Drop pooled clients (Node local dev only). */
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
    msg.includes("broken pipe") ||
    msg.includes("different request")
  );
}

/** Retry once with a fresh client — each attempt releases its own connection on Workers. */
export async function withDbRetry<T>(env: Env, fn: (sql: Sql) => Promise<T>): Promise<T> {
  const run = async (): Promise<T> => {
    const sql = createSql(env);
    try {
      return await fn(sql);
    } finally {
      await releaseSql(sql);
    }
  };

  try {
    return await run();
  } catch (err) {
    if (!isTransientDbError(err)) throw err;
    console.warn("[db] transient error, retrying with fresh client", err);
    if (!isCloudflareWorkerRuntime()) resetSqlPool();
    return await run();
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
