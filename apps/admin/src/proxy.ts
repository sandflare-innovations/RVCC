import { type NextRequest, NextResponse } from "next/server";

import {
  ADMIN_COOKIE,
  ADMIN_LOGIN_PATH,
  ADMIN_PROFILE_COOKIE,
  ADMIN_SESSION_EXPIRED_PARAM,
  adminCookieOptions,
  expiredCookieOptions,
} from "@/lib/constants";

/**
 * Cheap cookie-presence gate. Real auth is /auth/me via apps/api.
 * Also slides the browser cookie maxAge forward on every page navigation.
 */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === ADMIN_LOGIN_PATH) {
    // A server-side guard rejected the session and sent us here. Drop the dead
    // cookie and serve the login form; without this the branch below sees a
    // cookie, bounces to the home path, the guard rejects it again, and the two
    // redirect until the browser gives up with ERR_TOO_MANY_REDIRECTS.
    if (request.nextUrl.searchParams.has(ADMIN_SESSION_EXPIRED_PARAM)) {
      const res = NextResponse.next();
      res.cookies.set(ADMIN_COOKIE, "", expiredCookieOptions());
      res.cookies.set(ADMIN_PROFILE_COOKIE, "", expiredCookieOptions());
      return res;
    }
    if (request.cookies.get(ADMIN_COOKIE)?.value) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) {
    const url = new URL(ADMIN_LOGIN_PATH, request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
