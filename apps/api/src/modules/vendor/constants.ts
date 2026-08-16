/** Vendor portal sessions stay signed in for a month with sliding renewal. */
export const VENDOR_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30d

/** Failed logins allowed before the account is temporarily locked. */
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MS = 1000 * 60 * 15; // 15min
