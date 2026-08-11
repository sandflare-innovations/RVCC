import { type NextRequest, NextResponse } from "next/server";

import { VENDOR_COOKIE, VENDOR_HOME_PATH, VENDOR_LOGIN_PATH } from "@/lib/constants";

/**
 * Cheap cookie-presence gate. Real auth is /auth/me via the vendor-api worker.
 */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === VENDOR_LOGIN_PATH) {
    if (request.cookies.get(VENDOR_COOKIE)?.value) {
      return NextResponse.redirect(new URL(VENDOR_HOME_PATH, request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (!request.cookies.get(VENDOR_COOKIE)?.value) {
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
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
