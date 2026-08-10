import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { z } from "zod";

import { VENDOR_COOKIE } from "@/lib/admin/constants";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import { getVendorFromSession, revokeAllVendorSessions } from "@/lib/vendor/session";

const schema = z.object({
  currentPassword: z.string().min(1),
  // 12 matches the floor enforced by scripts/create-admin.mjs.
  newPassword: z.string().min(12, "New password must be at least 12 characters."),
});

export async function POST(request: Request) {
  const vendor = await getVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid password." },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  const record = await prisma.vendorUser.findUnique({ where: { id: vendor.id } });
  if (!record) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  if (!(await verifyPassword(currentPassword, record.passwordHash))) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  if (await verifyPassword(newPassword, record.passwordHash)) {
    return NextResponse.json(
      { error: "New password must differ from the current one." },
      { status: 400 }
    );
  }

  await prisma.vendorUser.update({
    where: { id: vendor.id },
    data: { passwordHash: await hashPassword(newPassword), mustChangePassword: false },
  });

  /*
   * Sign out every other device. If the temporary password leaked in transit,
   * changing it must actually evict whoever else used it.
   */
  const jar = await cookies();
  await revokeAllVendorSessions(vendor.id, jar.get(VENDOR_COOKIE)?.value);

  return NextResponse.json({ ok: true });
}
