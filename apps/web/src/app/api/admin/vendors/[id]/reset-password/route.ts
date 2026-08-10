import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { writeAudit } from "@/lib/admin/session";
import { generateTempPassword, hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";

/**
 * Issues a fresh temporary password and forces a change on next sign-in.
 * All existing sessions are revoked — a reset must evict whoever held the old one.
 */
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { admin, deny } = await requireAdmin("ADMIN");
  if (deny) return deny;

  const { id } = await ctx.params;

  const vendor = await prisma.vendorUser.findUnique({ where: { id } });
  if (!vendor) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const tempPassword = generateTempPassword();

  await prisma.vendorUser.update({
    where: { id },
    data: {
      passwordHash: await hashPassword(tempPassword),
      mustChangePassword: true,
      failedAttempts: 0,
      lockedUntil: null,
    },
  });

  await prisma.vendorSession.updateMany({
    where: { vendorId: id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await writeAudit({
    adminId: admin.id,
    action: "vendor.password_reset",
    entityType: "VendorUser",
    entityId: id,
    // Never log the password itself.
    metadata: { email: vendor.email },
  });

  // Shown once in the panel; email delivery lands with the worker deploy.
  return NextResponse.json({ ok: true, email: vendor.email, tempPassword });
}
