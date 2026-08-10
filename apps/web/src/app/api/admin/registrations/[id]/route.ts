import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { writeAudit } from "@/lib/admin/session";
import { prisma } from "@/lib/db";

/**
 * Permanently deletes a registration and everything cascading from it —
 * company profile, contacts, addresses, classifications, bank accounts,
 * questionnaire answers, attachments and any provisioned vendor logins.
 *
 * SUPER_ADMIN only: this destroys commercial records and cannot be undone.
 */
export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { admin, deny } = await requireAdmin("SUPER_ADMIN");
  if (deny) return deny;

  const { id } = await ctx.params;

  const registration = await prisma.supplierRegistration.findUnique({
    where: { id },
    include: {
      company: { select: { legalName: true } },
      _count: {
        select: { contacts: true, addresses: true, bankAccounts: true, vendorUsers: true },
      },
    },
  });

  if (!registration) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  }

  /*
   * Snapshot before deleting. The audit row outlives the record (adminId is
   * SetNull, entityId is a plain string), so this is the only trace left of
   * what was removed.
   */
  await writeAudit({
    adminId: admin.id,
    action: "registration.deleted",
    entityType: "SupplierRegistration",
    entityId: id,
    metadata: {
      email: registration.email,
      referenceNumber: registration.referenceNumber,
      legalName: registration.company?.legalName ?? null,
      status: registration.status,
      cascaded: registration._count,
    },
  });

  await prisma.supplierRegistration.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
