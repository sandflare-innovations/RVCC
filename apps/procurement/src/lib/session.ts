import "server-only";

import { createHash } from "node:crypto";

import { cookies } from "next/headers";
import { cache } from "react";

import { PROCUREMENT_COOKIE } from "@/lib/constants";
import { procurementApiFetch } from "@/lib/procurement-api";

export type ProcurementIdentity = {
  id: string;
  email: string;
  name: string;
  role: string;
};

const SESSION_REVALIDATE_SECONDS = 45;
const TTL_MS = SESSION_REVALIDATE_SECONDS * 1000;

type CacheEntry = { at: number; identity: ProcurementIdentity };
const identityCache = new Map<string, CacheEntry>();

function tokenKey(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function fetchProcurementIdentity(token: string): Promise<ProcurementIdentity | null> {
  const key = tokenKey(token);
  const memHit = identityCache.get(key);
  if (memHit && Date.now() - memHit.at < TTL_MS) return memHit.identity;

  try {
    const res = await procurementApiFetch("/auth/me", { method: "GET", sessionToken: token });
    if (res.ok) {
      const data = (await res.json()) as ProcurementIdentity;
      if (!data?.id) return null;
      identityCache.set(key, { at: Date.now(), identity: data });
      return data;
    }
    if (res.status === 401 || res.status === 403) {
      identityCache.delete(key);
      return null;
    }
    return memHit?.identity ?? null;
  } catch (err) {
    console.error("[procurement/session] fetch failed", err);
    return memHit?.identity ?? null;
  }
}

export const getCurrentProcurementUser = cache(async (): Promise<ProcurementIdentity | null> => {
  const jar = await cookies();
  const token = jar.get(PROCUREMENT_COOKIE)?.value;
  if (!token) return null;
  return fetchProcurementIdentity(token);
});

export async function resolveProcurementIdentity(
  token: string
): Promise<ProcurementIdentity | null> {
  return fetchProcurementIdentity(token);
}

export function clearProcurementSessionCache(token: string): void {
  identityCache.delete(tokenKey(token));
}
