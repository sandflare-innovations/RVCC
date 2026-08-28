import { type NextRequest, NextResponse } from "next/server";

import {
  PROCUREMENT_COOKIE,
  PROCUREMENT_LOGIN_PATH,
  PROCUREMENT_PROFILE_COOKIE,
  PROCUREMENT_SESSION_EXPIRED_PARAM,
  expiredCookieOptions,
  procurementCookieOptions,
} from "@/lib/constants";

/**
 * PWA and static assets that must remain open without auth redirection.
 */
function isPublicPwaAsset(pathname: string) {
  return (
    pathname === "/manifest.json" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname === "/offline.html" ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/fonts/")
  );
}

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPwaAsset(pathname)) {
    return NextResponse.next();
  }

  if (pathname === PROCUREMENT_LOGIN_PATH) {
    if (request.nextUrl.searchParams.has(PROCUREMENT_SESSION_EXPIRED_PARAM)) {
      const res = NextResponse.next();
      res.cookies.set(PROCUREMENT_COOKIE, "", expiredCookieOptions());
      res.cookies.set(PROCUREMENT_PROFILE_COOKIE, "", expiredCookieOptions());
      return res;
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    const token = request.cookies.get(PROCUREMENT_COOKIE)?.value;
    if (token) {
      const res = NextResponse.next();
      res.cookies.set(PROCUREMENT_COOKIE, token, procurementCookieOptions());
      return res;
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(PROCUREMENT_COOKIE)?.value;
  if (!token) {
    const url = new URL(PROCUREMENT_LOGIN_PATH, request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.cookies.set(PROCUREMENT_COOKIE, token, procurementCookieOptions());
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|sw.js|offline.html|icons/|images/|fonts/).*)",
  ],
};
