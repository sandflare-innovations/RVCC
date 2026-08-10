/** Vendor portal sessions last a week (unlike staff 8h shift sessions). */
export const VENDOR_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7d

/** Failed logins allowed before the account is temporarily locked. */
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MS = 1000 * 60 * 15; // 15min
