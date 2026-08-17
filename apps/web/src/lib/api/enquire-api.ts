import { cookies } from "next/headers";

import "server-only";

import { ENQUIRE_COOKIE } from "@/lib/enquire-constants";

/** Server-only client for apps/api `/enquire/*`. */
function enquireBaseUrl(): string {
  const base = process.env.API_URL?.replace(/\/$/, "");
  if (!base) throw new Error("Set API_URL");
  return `${base}/enquire`;
}

export async function enquireApiFetch(
  path: string,
  init: RequestInit & { sessionToken?: string | null } = {}
): Promise<Response> {
  const { sessionToken, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");

  let session = sessionToken;
  if (session === undefined) {
    const jar = await cookies();
    session = jar.get(ENQUIRE_COOKIE)?.value ?? null;
  }
  if (session) headers.set("X-Enquire-Session", session);

  return fetch(`${enquireBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`, {
    ...rest,
    headers,
    cache: "no-store",
  });
}

export function apiConfigured(): boolean {
  return Boolean(process.env.API_URL);
}
