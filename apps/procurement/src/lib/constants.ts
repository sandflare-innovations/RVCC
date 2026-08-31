export {
  PROCUREMENT_COOKIE,
  PROCUREMENT_PROFILE_COOKIE,
  PROCUREMENT_SESSION_TTL_MS,
} from "@rvcc/utils";
import {
  PROCUREMENT_SESSION_TTL_MS,
} from "@rvcc/utils";

export const PROCUREMENT_LOGIN_PATH = "/login";
export const PROCUREMENT_HOME_PATH = "/";

export const PROCUREMENT_SESSION_EXPIRED_PARAM = "expired";
export const PROCUREMENT_LOGIN_EXPIRED_PATH = `${PROCUREMENT_LOGIN_PATH}?${PROCUREMENT_SESSION_EXPIRED_PARAM}=1`;

export function procurementCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(PROCUREMENT_SESSION_TTL_MS / 1000),
  };
}

export function expiredCookieOptions() {
  return { ...procurementCookieOptions(), maxAge: 0 };
}
