import { NextResponse } from "next/server";

import { z } from "zod";

import { requireAdmin } from "@/lib/admin/guard";
import { writeAudit } from "@/lib/admin/session";
import { prisma } from "@/lib/db";

const schema = z.object({ isActive: z.boolean() });

/** Enable or disable a vendor portal login. */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { admin, deny } = await requireAdmin("ADMIN");
  if (deny) return deny;

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "isActive is required" }, { status: 400 });
  }

  const vendor = await prisma.vendorUser.findUnique({ where: { id } });
  if (!vendor) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const { isActive } = parsed.data;

  await prisma.vendorUser.update({ where: { id }, data: { isActive } });

  /*
   * getVendorFromSession already rejects inactive accounts on every request, so
   * disabling takes effect immediately. Revoking as well means the rows do not
   * sit around live until their 7-day expiry.
   */
  if (!isActive) {
    await prisma.vendorSession.updateMany({
      where: { vendorId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  await writeAudit({
    adminId: admin.id,
    action: isActive ? "vendor.enabled" : "vendor.disabled",
    entityType: "VendorUser",
    entityId: id,
    metadata: { email: vendor.email },
  });

  return NextResponse.json({ ok: true, isActive });
}
