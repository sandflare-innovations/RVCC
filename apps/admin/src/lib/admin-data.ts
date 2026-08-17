import { cookies } from "next/headers";

import "server-only";

import { adminApiFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

/** Cookie-backed fetch to apps/api `/admin/*` for RSC pages. */
export async function adminSessionFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: "Not signed in." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return adminApiFetch(path, { ...init, sessionToken: token });
}

export async function adminSessionJson<T>(
  path: string,
  init: RequestInit = {}
): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  const res = await adminSessionFetch(path, init);
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, data: (await res.json()) as T };
}
