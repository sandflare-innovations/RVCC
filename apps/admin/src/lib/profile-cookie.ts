import "server-only";

import { cookies } from "next/headers";

import { ADMIN_PROFILE_COOKIE, adminCookieOptions, type AdminRoleName } from "@/lib/constants";

export type AdminProfile = {
  id: string;
  email: string;
  name: string;
  role: AdminRoleName;
};

export function encodeAdminProfile(admin: AdminProfile): string {
  return Buffer.from(JSON.stringify(admin)).toString("base64url");
}

export function decodeAdminProfile(raw: string | undefined): AdminProfile | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as AdminProfile;
    if (!data?.id || !data?.role) return null;
    return data;
  } catch {
    return null;
  }
}

export async function readAdminProfile(): Promise<AdminProfile | null> {
  const jar = await cookies();
  return decodeAdminProfile(jar.get(ADMIN_PROFILE_COOKIE)?.value);
}

export function adminProfileCookieOptions() {
  return adminCookieOptions();
}

export function expiredAdminProfileCookieOptions() {
  return { ...adminCookieOptions(), maxAge: 0 };
}
