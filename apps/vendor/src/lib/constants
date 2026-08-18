/** Shared by proxy (edge) and server — Node-API free. */

export const VENDOR_COOKIE = "rvcc_vendor_session";
/** Vendor portal sessions stay signed in for a month with sliding renewal. */
export const VENDOR_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30d
export const VENDOR_LOGIN_PATH = "/login";
export const VENDOR_HOME_PATH = "/";

/**
 * Where a server-side guard sends a request whose cookie exists but whose
 * session is dead. The marker is what lets the proxy tell "signed in, go home"
 * apart from "cookie is stale, drop it" — it cannot check the session itself.
 */
export const VENDOR_SESSION_EXPIRED_PARAM = "expired";
export const VENDOR_LOGIN_EXPIRED_PATH = `${VENDOR_LOGIN_PATH}?${VENDOR_SESSION_EXPIRED_PARAM}=1`;

export function vendorCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(VENDOR_SESSION_TTL_MS / 1000),
  };
}

/**
 * Options that delete the session cookie. Every field except maxAge must match
 * vendorCookieOptions() — a browser treats a differing path or domain as a
 * different cookie and leaves the original in place.
 */
export function expiredCookieOptions() {
  return { ...vendorCookieOptions(), maxAge: 0 };
}
