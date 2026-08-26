import { type NextRequest, NextResponse } from "next/server";

import {
  VENDOR_COOKIE,
  VENDOR_HOME_PATH,
  VENDOR_LOGIN_PATH,
  VENDOR_PROFILE_COOKIE,
  VENDOR_SESSION_EXPIRED_PARAM,
  expiredCookieOptions,
  vendorCookieOptions,
} from "@/lib/constants";

/**
 * Cheap cookie-presence gate. Real auth is /auth/me via apps/api.
 * Also slides the browser cookie maxAge forward on every page navigation.
 */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === VENDOR_LOGIN_PATH) {
    if (request.nextUrl.searchParams.has(VENDOR_SESSION_EXPIRED_PARAM)) {
      const res = NextResponse.next();
      res.cookies.set(VENDOR_COOKIE, "", expiredCookieOptions());
      res.cookies.set(VENDOR_PROFILE_COOKIE, "", expiredCookieOptions());
      return res;
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(VENDOR_COOKIE)?.value;
  if (!token) {
    const url = new URL(VENDOR_LOGIN_PATH, request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next({
    request: {
      headers: (() => {
        const h = new Headers(request.headers);
        h.set("x-pathname", pathname);
        return h;
      })(),
    },
  });
  res.cookies.set(VENDOR_COOKIE, token, vendorCookieOptions());
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|fonts/).*)"],
};
