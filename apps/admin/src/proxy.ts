import { type NextRequest, NextResponse } from "next/server";

import { ADMIN_COOKIE, ADMIN_LOGIN_PATH, adminCookieOptions } from "@/lib/constants";

/**
 * Cheap cookie-presence gate. Real auth is /auth/me via the admin-api worker.
 * Also slides the browser cookie maxAge forward on every page navigation.
 */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === ADMIN_LOGIN_PATH) {
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
