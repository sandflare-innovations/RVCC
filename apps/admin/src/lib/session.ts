import { cookies } from "next/headers";

import "server-only";

import { adminWorkerFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE, type AdminRoleName } from "@/lib/constants";

export type AdminIdentity = {
  id: string;
  email: string;
  name: string;
  role: AdminRoleName;
};

/** Authoritative session check via admin-api worker. */
export async function getAdminFromSession(): Promise<AdminIdentity | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  try {
    const res = await adminWorkerFetch("/auth/me", { method: "GET", sessionToken: token });
    if (!res.ok) return null;
    const data = (await res.json()) as AdminIdentity;
    if (!data?.id || !data?.role) return null;
    return data;
  } catch (err) {
    console.error("[admin] /auth/me failed", err);
    return null;
  }
}
