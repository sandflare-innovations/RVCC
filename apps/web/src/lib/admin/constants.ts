/** Shared by middleware (edge) and server code, so this file must stay Node-API free. */

export const ADMIN_COOKIE = "rvcc_admin_session";
export const VENDOR_COOKIE = "rvcc_vendor_session";

export const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8h — staff shift
export const VENDOR_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7d

/** Failed logins allowed before the account is temporarily locked. */
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MS = 1000 * 60 * 15;

export const ADMIN_LOGIN_PATH = "/admin/login";
export const ADMIN_HOME_PATH = "/admin";

export type AdminRoleName = "SUPER_ADMIN" | "ADMIN" | "REVIEWER";

/** Higher wins. Used for `requireRole` checks. */
export const ROLE_RANK: Record<AdminRoleName, number> = {
  REVIEWER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};
