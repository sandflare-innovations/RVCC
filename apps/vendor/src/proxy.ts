import { type NextRequest, NextResponse } from "next/server";

import {
  VENDOR_COOKIE,
  VENDOR_HOME_PATH,
  VENDOR_LOGIN_PATH,
  VENDOR_SESSION_EXPIRED_PARAM,
  expiredCookieOptions,
  vendorCookieOptions,
} from "@/lib/constants";

/** Public marketing + registration surfaces — no vendor session required. */
function isPublicPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/login" || pathname === "/access-held") return true;
  if (pathname.startsWith("/register")) return true;
  if (pathname.startsWith("/enquire")) return true;
  if (pathname.startsWith("/api/")) return true;

  const marketing = [
    "/about",
    "/services",
    "/projects",
    "/gallary",
    "/clients",
    "/documents",
    "/careers",
    "/quality-policy",
    "/contact",
  ];
  return marketing.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Cheap cookie-presence gate for /portal only.
 * Real auth is /auth/me via apps/api.
 * Also slides the browser cookie maxAge forward on every portal navigation.
 */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === VENDOR_LOGIN_PATH) {
    if (request.nextUrl.searchParams.has(VENDOR_SESSION_EXPIRED_PARAM)) {
      const res = NextResponse.next();
      res.cookies.set(VENDOR_COOKIE, "", expiredCookieOptions());
      return res;
    }
    if (request.cookies.get(VENDOR_COOKIE)?.value) {
      return NextResponse.redirect(new URL(VENDOR_HOME_PATH, request.url));
    }
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Only /portal/** requires a session cookie.
  if (!pathname.startsWith("/portal")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(VENDOR_COOKIE)?.value;
  if (!token) {
    const url = new URL(VENDOR_LOGIN_PATH, request.url);
    url.searchParams.set("next", pathname + search);
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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|fonts/|videos/|3D-Objects/|media/).*)",
  ],
};
