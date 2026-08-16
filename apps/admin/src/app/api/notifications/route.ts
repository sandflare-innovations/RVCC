import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getAdminFromSession } from "@/lib/session";

/** This admin's own notifications, scoped by the session — never a parameter. */
export async function GET() {
  const admin = await getAdminFromSession();
  if (!admin) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const items = await prisma.notification.findMany({
    where: { adminId: admin.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    items,
    unread: items.filter((n) => n.readAt === null).length,
  });
}

export async function POST() {
  const admin = await getAdminFromSession();
  if (!admin) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  await prisma.notification.updateMany({
    where: { adminId: admin.id, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
