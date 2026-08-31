import "server-only";

import { cookies } from "next/headers";

import { ENQUIRE_COOKIE } from "@/lib/enquire-constants";

function enquireBaseUrl(): string {
  const base = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL)?.replace(/\/$/, "");
  if (!base) throw new Error("Set API_URL (or NEXT_PUBLIC_API_URL)");
  return `${base}/enquire`;
}

export async function enquireWorkerFetch(
  path: string,
  init: RequestInit & { sessionToken?: string | null } = {}
): Promise<Response> {
  const { sessionToken, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);
  const isFormData = typeof FormData !== "undefined" && rest.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

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

export function workerConfigured(): boolean {
  return Boolean(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL);
}
