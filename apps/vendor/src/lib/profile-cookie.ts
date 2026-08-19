import "server-only";

import { cookies } from "next/headers";

import { VENDOR_PROFILE_COOKIE, vendorCookieOptions } from "@/lib/constants";

export type VendorProfile = {
  id: string;
  email: string;
  name: string;
  mustChangePassword: boolean;
  registrationId: string | null;
};

export function encodeVendorProfile(vendor: VendorProfile): string {
  return Buffer.from(JSON.stringify(vendor)).toString("base64url");
}

export function decodeVendorProfile(raw: string | undefined): VendorProfile | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as VendorProfile;
    if (!data?.id) return null;
    return data;
  } catch {
    return null;
  }
}

export async function readVendorProfile(): Promise<VendorProfile | null> {
  const jar = await cookies();
  return decodeVendorProfile(jar.get(VENDOR_PROFILE_COOKIE)?.value);
}

export function vendorProfileCookieOptions() {
  return vendorCookieOptions();
}

export function expiredVendorProfileCookieOptions() {
  return { ...vendorCookieOptions(), maxAge: 0 };
}
