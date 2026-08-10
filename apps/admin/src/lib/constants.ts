/** Shared by proxy (edge) and server — Node-API free. */

export const ADMIN_COOKIE = "rvcc_admin_session";
export const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 8;
export const ADMIN_LOGIN_PATH = "/login";
export const ADMIN_HOME_PATH = "/";

export type AdminRoleName = "SUPER_ADMIN" | "ADMIN" | "REVIEWER";

export const ROLE_RANK: Record<AdminRoleName, number> = {
  REVIEWER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

export function hasRole(role: AdminRoleName, minimum: AdminRoleName): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(ADMIN_SESSION_TTL_MS / 1000),
  };
}
