/** Shared by proxy (edge) and server — Node-API free. */

export const VENDOR_COOKIE = "rvcc_vendor_session";
export const VENDOR_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
export const VENDOR_LOGIN_PATH = "/login";
export const VENDOR_HOME_PATH = "/";

export function vendorCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(VENDOR_SESSION_TTL_MS / 1000),
  };
}
