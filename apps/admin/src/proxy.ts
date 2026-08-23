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
function isPublicPwaAsset(pathname: string) {
  return (
    pathname === "/manifest.json" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname === "/offline.html" ||
    pathname.startsWith("/icons/")
  );
}

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPwaAsset(pathname)) {
    return NextResponse.next();
  }

  if (pathname === ADMIN_LOGIN_PATH) {
    if (request.nextUrl.searchParams.has(ADMIN_SESSION_EXPIRED_PARAM)) {
      const res = NextResponse.next();
      res.cookies.set(ADMIN_COOKIE, "", expiredCookieOptions());
      res.cookies.set(ADMIN_PROFILE_COOKIE, "", expiredCookieOptions());
      return res;
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (token) {
      const res = NextResponse.next();
      res.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());
      return res;
    }
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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|sw.js|offline.html|icons/).*)",
  ],
};
