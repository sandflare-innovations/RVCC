import { NextResponse } from "next/server";

import "server-only";

import type { AdminRoleName } from "@/lib/admin/constants";
import { type AdminIdentity, getAdminFromSession, hasRole } from "@/lib/admin/session";

/**
 * Auth gate for admin API routes.
 *
 * Route handlers are excluded from the middleware matcher on purpose: they must
 * answer 401/403 rather than redirect to an HTML login page, which a fetch()
 * caller cannot act on.
 *
 * Returns either the caller's identity or the response to send back.
 */
export async function requireAdmin(
  minimum: AdminRoleName = "ADMIN"
): Promise<{ admin: AdminIdentity; deny: null } | { admin: null; deny: NextResponse }> {
  const admin = await getAdminFromSession();

  if (!admin) {
    return {
      admin: null,
      deny: NextResponse.json({ error: "Not signed in." }, { status: 401 }),
    };
  }

  if (!hasRole(admin.role, minimum)) {
    return {
      admin: null,
      deny: NextResponse.json({ error: "Your role does not permit this action." }, { status: 403 }),
    };
  }

  return { admin, deny: null };
}
