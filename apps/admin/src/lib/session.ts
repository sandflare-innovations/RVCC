import { cache } from "react";

import { cookies } from "next/headers";

import { createHash } from "node:crypto";
import "server-only";

import { adminWorkerFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE, type AdminRoleName } from "@/lib/constants";

export type AdminIdentity = {
  id: string;
  email: string;
  name: string;
  role: AdminRoleName;
};

type CacheEntry = { at: number; identity: AdminIdentity };
const identityCache = new Map<string, CacheEntry>();
/** Short TTL so chrome navigations stay instant without stale roles for long. */
const TTL_MS = 45_000;

function tokenKey(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function clearAdminSessionCache(token?: string) {
  if (!token) {
    identityCache.clear();
    return;
  }
  identityCache.delete(tokenKey(token));
}

/**
 * Deduped per RSC request via React.cache, plus a short process-local TTL so
 * sibling navigations (dashboard → registrations) skip the worker round-trip.
 */
export const getAdminFromSession = cache(async (): Promise<AdminIdentity | null> => {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const key = tokenKey(token);
  const hit = identityCache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.identity;

  try {
    const res = await adminWorkerFetch("/auth/me", { method: "GET", sessionToken: token });
    if (!res.ok) {
      // Only hard-logout on definitive auth failure — never on 5xx/network blips.
      if (res.status === 401 || res.status === 403) {
        identityCache.delete(key);
        return null;
      }
      return hit?.identity ?? null;
    }
    const data = (await res.json()) as AdminIdentity;
    if (!data?.id || !data?.role) return null;
    identityCache.set(key, { at: Date.now(), identity: data });
    return data;
  } catch (err) {
    console.error("[admin] /auth/me failed", err);
    return hit?.identity ?? null;
  }
});
