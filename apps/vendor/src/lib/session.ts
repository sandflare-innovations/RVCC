import { cache } from "react";

import { cookies } from "next/headers";

import { createHash } from "node:crypto";
import "server-only";

import { VENDOR_COOKIE } from "@/lib/constants";
import { vendorWorkerFetch } from "@/lib/vendor-api";

export type VendorIdentity = {
  id: string;
  email: string;
  name: string;
  mustChangePassword: boolean;
  registrationId: string | null;
  portalAccess: "HELD" | "RELEASED";
  registrationComplete: boolean;
};

type CacheEntry = { at: number; identity: VendorIdentity };
const identityCache = new Map<string, CacheEntry>();
const TTL_MS = 45_000;

function tokenKey(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function clearVendorSessionCache(token?: string) {
  if (!token) {
    identityCache.clear();
    return;
  }
  identityCache.delete(tokenKey(token));
}

export const getVendorFromSession = cache(async (): Promise<VendorIdentity | null> => {
  const jar = await cookies();
  const token = jar.get(VENDOR_COOKIE)?.value;
  if (!token) return null;

  const key = tokenKey(token);
  const hit = identityCache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.identity;

  try {
    const res = await vendorWorkerFetch("/auth/me", { method: "GET", sessionToken: token });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        identityCache.delete(key);
        return null;
      }
      return hit?.identity ?? null;
    }
    const data = (await res.json()) as VendorIdentity;
    if (!data?.id) return null;
    const identity: VendorIdentity = {
      id: data.id,
      email: data.email,
      name: data.name,
      mustChangePassword: Boolean(data.mustChangePassword),
      registrationId: data.registrationId ?? null,
      portalAccess: data.portalAccess === "RELEASED" ? "RELEASED" : "HELD",
      registrationComplete: data.registrationComplete !== false,
    };
    identityCache.set(key, { at: Date.now(), identity });
    return identity;
  } catch (err) {
    console.error("[vendor] /auth/me failed", err);
    return hit?.identity ?? null;
  }
});
