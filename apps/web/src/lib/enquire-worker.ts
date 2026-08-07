import { cookies } from "next/headers";

import { ENQUIRE_COOKIE } from "@/lib/enquire-constants";

type WorkerMethod = "GET" | "POST" | "PATCH";

/**
 * Calls the Cloudflare enquire Worker. DB credentials live only on the Worker
 * (Hyperdrive / DATABASE_URL secret) — never in the browser.
 */
export async function enquireWorkerFetch(
  path: string,
  init: {
    method?: WorkerMethod;
    body?: unknown;
    sessionToken?: string | null;
  } = {}
): Promise<Response> {
  const base = process.env.ENQUIRE_WORKER_URL?.replace(/\/$/, "");
  const secret = process.env.ENQUIRE_API_SECRET;

  if (!base || !secret) {
    throw new Error("ENQUIRE_WORKER_URL and ENQUIRE_API_SECRET are required");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  };

  let session = init.sessionToken;
  if (session === undefined) {
    const jar = await cookies();
    session = jar.get(ENQUIRE_COOKIE)?.value ?? null;
  }
  if (session) headers["X-Enquire-Session"] = session;

  return fetch(`${base}${path}`, {
    method: init.method || "GET",
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
}

export function workerConfigured(): boolean {
  return Boolean(process.env.ENQUIRE_WORKER_URL && process.env.ENQUIRE_API_SECRET);
}
