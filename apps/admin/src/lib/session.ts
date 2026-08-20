import { cache } from "react";
import { unstable_cache } from "next/cache";

import { cookies } from "next/headers";

import { createHash } from "node:crypto";
import "server-only";

import { adminWorkerFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE, type AdminRoleName } from "@/lib/constants";
import { cacheDel, cacheGet, cacheSet } from "@/lib/redis-cache";

export type AdminIdentity = {
  id: string;
  email: string;
  name: string;
  role: AdminRoleName;
};

const SESSION_REVALIDATE_SECONDS = 45;
const TTL_MS = SESSION_REVALIDATE_SECONDS * 1000;
const ME_RETRY_DELAYS_MS = [0, 200, 500, 1200];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type CacheEntry = { at: number; identity: AdminIdentity };
const identityCache = new Map<string, CacheEntry>();

function tokenKey(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function sessionCacheKey(token: string) {
  return `rvcc:admin:session:${tokenKey(token)}`;
}

async function fetchAdminIdentity(token: string): Promise<AdminIdentity | null> {
  const key = tokenKey(token);
  const memHit = identityCache.get(key);
  if (memHit && Date.now() - memHit.at < TTL_MS) return memHit.identity;

  const redisHit = await cacheGet<AdminIdentity>(sessionCacheKey(token));
  if (redisHit) {
    identityCache.set(key, { at: Date.now(), identity: redisHit });
    return redisHit;
  }

  try {
    for (let attempt = 0; attempt < ME_RETRY_DELAYS_MS.length; attempt++) {
      if (ME_RETRY_DELAYS_MS[attempt]) await sleep(ME_RETRY_DELAYS_MS[attempt]!);

      const res = await adminWorkerFetch("/auth/me", { method: "GET", sessionToken: token });
      if (res.ok) {
        const data = (await res.json()) as AdminIdentity;
        if (!data?.id || !data?.role) return null;
        identityCache.set(key, { at: Date.now(), identity: data });
        await cacheSet(sessionCacheKey(token), data, SESSION_REVALIDATE_SECONDS);
        return data;
      }

      if (res.status === 401 || res.status === 403) {
        identityCache.delete(key);
        await cacheDel(sessionCacheKey(token));
        return null;
      }

      if (attempt < ME_RETRY_DELAYS_MS.length - 1) continue;
      return memHit?.identity ?? null;
    }
    return memHit?.identity ?? null;
  } catch (err) {
    console.error("[admin] /auth/me failed", err);
    return memHit?.identity ?? null;
  }
}

function getCachedAdminIdentity(token: string) {
  const key = tokenKey(token);
  return unstable_cache(() => fetchAdminIdentity(token), ["admin-identity", key], {
    revalidate: SESSION_REVALIDATE_SECONDS,
  })();
}

export async function clearAdminSessionCache(token?: string) {
  if (!token) {
    identityCache.clear();
    return;
  }
  identityCache.delete(tokenKey(token));
  await cacheDel(sessionCacheKey(token));
}

/** For login / profile refresh — bypasses layout on subsequent navigations. */
export async function resolveAdminIdentity(token: string): Promise<AdminIdentity | null> {
  return fetchAdminIdentity(token);
}

export const getAdminFromSession = cache(async (): Promise<AdminIdentity | null> => {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    return await getCachedAdminIdentity(token);
  } catch (err) {
    console.error("[admin] session cache miss failed", err);
    return null;
  }
});
