import { cookies } from "next/headers";

import "server-only";

import { VENDOR_COOKIE } from "@/lib/constants";
import { vendorWorkerFetch } from "@/lib/vendor-api";

export type VendorIdentity = {
  id: string;
  email: string;
  name: string;
  mustChangePassword: boolean;
  registrationId: string;
};

/** Authoritative session check via vendor-api worker. */
export async function getVendorFromSession(): Promise<VendorIdentity | null> {
  const jar = await cookies();
  const token = jar.get(VENDOR_COOKIE)?.value;
  if (!token) return null;

  try {
    const res = await vendorWorkerFetch("/auth/me", { method: "GET", sessionToken: token });
    if (!res.ok) return null;
    const data = (await res.json()) as VendorIdentity;
    if (!data?.id || !data?.registrationId) return null;
    return data;
  } catch (err) {
    console.error("[vendor] /auth/me failed", err);
    return null;
  }
}
