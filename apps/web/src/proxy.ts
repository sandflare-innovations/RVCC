import { type NextRequest, NextResponse } from "next/server";

import { ADMIN_COOKIE, ADMIN_LOGIN_PATH, VENDOR_COOKIE } from "@/lib/admin/constants";

const VENDOR_LOGIN_PATH = "/vendor/login";

/**
 * Next 16 renamed the `middleware` file convention to `proxy`; the old name
 * still works but logs a deprecation warning.
 *
 * Runs on the edge, so it cannot reach Prisma. This is a cheap gate only — it
 * checks that a session cookie is present and bounces anonymous traffic away
 * from /admin. The real check (session live, unrevoked, admin active) happens
 * in src/app/admin/layout.tsx, which runs on the server with database access.
 *
 * Never treat cookie presence alone as proof of authentication.
 */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // --- Vendor portal (separate cookie and code path from admin) ---
  if (pathname.startsWith("/vendor")) {
    const hasVendor = Boolean(request.cookies.get(VENDOR_COOKIE)?.value);
    if (pathname === VENDOR_LOGIN_PATH) {
      return hasVendor
        ? NextResponse.redirect(new URL("/vendor", request.url))
        : NextResponse.next();
    }
    if (!hasVendor) {
      const url = new URL(VENDOR_LOGIN_PATH, request.url);
      if (pathname !== "/vendor") url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname === ADMIN_LOGIN_PATH) {
    // Already signed in? Skip the login form.
    if (request.cookies.get(ADMIN_COOKIE)?.value) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (!request.cookies.get(ADMIN_COOKIE)?.value) {
    const url = new URL(ADMIN_LOGIN_PATH, request.url);
    if (pathname !== "/admin") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // API routes handle their own auth so they can return 401 instead of a redirect.
  matcher: ["/admin/:path*", "/vendor/:path*"],
};
