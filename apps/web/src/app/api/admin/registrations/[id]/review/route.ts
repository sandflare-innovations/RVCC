import { NextResponse } from "next/server";

import { z } from "zod";

import { requireAdmin } from "@/lib/admin/guard";
import { notifyDecision } from "@/lib/admin/notify";
import { writeAudit } from "@/lib/admin/session";
import { generateTempPassword, hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";

const schema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().max(2000).optional(),
});

/** Only a submitted application is awaiting a decision. */
const REVIEWABLE = new Set(["SUBMITTED"]);

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  // REVIEWER is read-only; approving is a commercial decision.
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
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  const { action } = parsed.data;
  const note = parsed.data.note?.trim() || null;

  // A rejection without a reason is not actionable for the vendor.
  if (action === "REJECT" && !note) {
    return NextResponse.json({ error: "A reason is required to reject." }, { status: 400 });
  }

  const registration = await prisma.supplierRegistration.findUnique({
    where: { id },
    include: { contacts: true, vendorUsers: true, company: { select: { legalName: true } } },
  });

  if (!registration) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  }

  if (!REVIEWABLE.has(registration.status)) {
    return NextResponse.json(
      {
        error: `This registration is ${registration.status.toLowerCase()} and is no longer awaiting review.`,
      },
      { status: 409 }
    );
  }

  const now = new Date();

  const origin = new URL(request.url).origin;
  const legalName = registration.company?.legalName ?? "";
  const reference = registration.referenceNumber ?? "";

  if (action === "REJECT") {
    await prisma.supplierRegistration.update({
      where: { id },
      data: { status: "REJECTED", reviewedAt: now, reviewedById: admin.id, reviewNote: note },
    });
    await writeAudit({
      adminId: admin.id,
      action: "registration.rejected",
      entityType: "SupplierRegistration",
      entityId: id,
      metadata: { note },
    });

    // After the commit: a mail failure must not undo a recorded decision.
    const notified = await notifyDecision({
      decision: "REJECTED",
      legalName,
      referenceNumber: reference,
      reason: note ?? "",
      recipients: [{ to: registration.email }],
      origin,
    });

    return NextResponse.json({ ok: true, status: "REJECTED", notified });
  }

  /*
   * Approval provisions vendor logins. Accounts go to contacts who asked for
   * one; if nobody did, the registrant still needs a way in, so the
   * registration email gets an account.
   */
  const requested = registration.contacts.filter((c) => c.requestUserAccount && c.email);
  const targets = requested.length
    ? requested.map((c) => ({ email: c.email, name: `${c.firstName} ${c.lastName}`.trim() }))
    : [{ email: registration.email, name: "" }];

  const created: { email: string; tempPassword: string }[] = [];

  for (const t of targets) {
    const email = t.email.trim().toLowerCase();
    if (!email) continue;

    // An email may already own an account from an earlier registration.
    const existing = await prisma.vendorUser.findUnique({ where: { email } });
    if (existing) continue;

    const tempPassword = generateTempPassword();
    await prisma.vendorUser.create({
      data: {
        email,
        name: t.name,
        passwordHash: await hashPassword(tempPassword),
        mustChangePassword: true,
        registrationId: id,
      },
    });
    created.push({ email, tempPassword });
  }

  await prisma.supplierRegistration.update({
    where: { id },
    data: {
      status: "APPROVED",
      businessRelationship: "SPEND_AUTHORIZED",
      reviewedAt: now,
      reviewedById: admin.id,
      reviewNote: note,
    },
  });

  await writeAudit({
    adminId: admin.id,
    action: "registration.approved",
    entityType: "SupplierRegistration",
    entityId: id,
    // Never log the passwords themselves.
    metadata: { note, accountsCreated: created.map((c) => c.email) },
  });

  const notified = await notifyDecision({
    decision: "APPROVED",
    legalName,
    referenceNumber: reference,
    recipients: created.length
      ? created.map((c) => ({ to: c.email, loginEmail: c.email, tempPassword: c.tempPassword }))
      : [{ to: registration.email }],
    origin,
  });

  return NextResponse.json({
    ok: true,
    status: "APPROVED",
    notified,
    /*
     * Returned so the panel can fall back to manual relay when mail fails.
     * The UI only reveals these if delivery did not succeed — a temp password
     * that already reached the vendor's inbox should not linger on screen.
     */
    credentials: created,
  });
}
