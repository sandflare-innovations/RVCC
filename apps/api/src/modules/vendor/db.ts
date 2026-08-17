import postgres from "postgres";

import type { Env } from "../../config/env";

export type Sql = ReturnType<typeof postgres>;

// Worker isolates serve many requests. Keeping one client per database URL lets
// postgres/Hyperdrive retain its connections instead of paying a new connection
// setup cost on every authenticated portal request.
const clients = new Map<string, Sql>();

export function createSql(env: Env): Sql {
  if (!env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL");
  }

  const connectionString = env.DATABASE_URL;
  const cached = clients.get(connectionString);
  if (cached) return cached;

  const client = postgres(connectionString, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
  clients.set(connectionString, client);
  return client;
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
