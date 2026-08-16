/** Long-lived staff sessions — activity slides this window further. */
export const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14d

/** Failed logins allowed before the account is temporarily locked. */
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MS = 1000 * 60 * 15;

export type AdminRoleName = "SUPER_ADMIN" | "ADMIN" | "REVIEWER";

/** Higher wins. Used for requireAdmin checks. */
export const ROLE_RANK: Record<AdminRoleName, number> = {
  REVIEWER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};
