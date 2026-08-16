import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getVendorFromSession } from "@/lib/session";

/** This vendor's own notifications, scoped by the session — never a parameter. */
export async function GET() {
  const vendor = await getVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const items = await prisma.notification.findMany({
    where: { vendorUserId: vendor.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    items,
    unread: items.filter((n) => n.readAt === null).length,
  });
}

export async function POST() {
  const vendor = await getVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  await prisma.notification.updateMany({
    where: { vendorUserId: vendor.id, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
