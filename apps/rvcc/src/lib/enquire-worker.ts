import { cookies } from "next/headers";

import { ENQUIRE_COOKIE } from "@/lib/enquire-constants";

type ApiMethod = "GET" | "POST" | "PATCH";

/** Server-only client for apps/api `/enquire/*`. */
function enquireBaseUrl(): string {
  const base = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL)?.replace(/\/$/, "");
  if (!base) throw new Error("Set API_URL (or NEXT_PUBLIC_API_URL)");
  return `${base}/enquire`;
}

export async function enquireApiFetch(
  path: string,
  init: {
    method?: ApiMethod;
    body?: unknown;
    sessionToken?: string | null;
  } = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  let session = init.sessionToken;
  if (session === undefined) {
    const jar = await cookies();
    session = jar.get(ENQUIRE_COOKIE)?.value ?? null;
  }
  if (session) headers["X-Enquire-Session"] = session;

  return fetch(`${enquireBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`, {
    method: init.method || "GET",
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
}

/** @deprecated Use enquireApiFetch */
export const enquireWorkerFetch = enquireApiFetch;

export function apiConfigured(): boolean {
  return Boolean(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL);
}

/** @deprecated Use apiConfigured */
export const workerConfigured = apiConfigured;
