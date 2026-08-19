/** Shared by proxy (edge) and server — Node-API free. */

export const ADMIN_COOKIE = "rvcc_admin_session";
/** Non-httpOnly chrome display cache — layout skips /auth/me when this is set. */
export const ADMIN_PROFILE_COOKIE = "rvcc_admin_profile";
/** Long-lived staff sessions — activity slides this window further. */
export const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14d
export const ADMIN_LOGIN_PATH = "/login";
export const ADMIN_HOME_PATH = "/";

/**
 * Where a server-side guard sends a request whose cookie exists but whose
 * session is dead. The marker is what lets the proxy tell "signed in, go home"
 * apart from "cookie is stale, drop it" — it cannot check the session itself.
 */
export const ADMIN_SESSION_EXPIRED_PARAM = "expired";
export const ADMIN_LOGIN_EXPIRED_PATH = `${ADMIN_LOGIN_PATH}?${ADMIN_SESSION_EXPIRED_PARAM}=1`;

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

/**
 * Options that delete the session cookie. Every field except maxAge must match
 * adminCookieOptions() — a browser treats a differing path or domain as a
 * different cookie and leaves the original in place.
 */
export function expiredCookieOptions() {
  return { ...adminCookieOptions(), maxAge: 0 };
}
