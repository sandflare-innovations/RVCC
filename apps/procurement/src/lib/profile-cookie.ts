import "server-only";

import { cookies } from "next/headers";
import {
  PROCUREMENT_PROFILE_COOKIE,
  procurementCookieOptions,
} from "@/lib/constants";

export type ProcurementUserProfile = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export function encodeProcurementProfile(profile: ProcurementUserProfile): string {
  return Buffer.from(JSON.stringify(profile)).toString("base64url");
}

export function decodeProcurementProfile(raw: string | undefined): ProcurementUserProfile | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as ProcurementUserProfile;
    if (!data?.id || !data?.email) return null;
    return data;
  } catch {
    return null;
  }
}

export async function readProcurementProfile(): Promise<ProcurementUserProfile | null> {
  const jar = await cookies();
  return decodeProcurementProfile(jar.get(PROCUREMENT_PROFILE_COOKIE)?.value);
}

export function procurementProfileCookieOptions() {
  return procurementCookieOptions();
}

export function expiredProcurementProfileCookieOptions() {
  return { ...procurementCookieOptions(), maxAge: 0 };
}
