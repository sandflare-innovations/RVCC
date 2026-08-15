import { NextResponse } from "next/server";

import { z } from "zod";

import { getAdminFromCookies } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db";

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
});

const patchSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean(),
});

/**
 * API routes cannot use requireAdmin() — it redirects, which is meaningless for
 * a fetch. Return 401 instead.
 */
async function guard(): Promise<NextResponse | null> {
  const admin = await getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return null;
}

export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await prisma.agent.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An agent with that email already exists." },
      { status: 409 }
    );
  }

  await prisma.agent.create({
    data: {
      email,
      name: parsed.data.name ?? "",
      company: parsed.data.company ?? "",
      phone: parsed.data.phone ?? "",
    },
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  await prisma.agent.update({
    where: { id: parsed.data.id },
    data: { isActive: parsed.data.isActive },
  });

  // Deactivating must end any live session immediately, not at expiry.
  if (!parsed.data.isActive) {
    await prisma.agentSession.deleteMany({ where: { agentId: parsed.data.id } });
  }

  return NextResponse.json({ ok: true });
}
