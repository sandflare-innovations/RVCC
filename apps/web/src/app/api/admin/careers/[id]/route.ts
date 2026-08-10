import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { writeAudit } from "@/lib/admin/session";
import { slugify } from "@/lib/content/careers";
import { prisma } from "@/lib/db";

import { jobSchema } from "../route";

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

  // partial() so the list view can toggle isPublished without resending the post.
  const parsed = jobSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid posting." },
      { status: 400 }
    );
  }

  const existing = await prisma.jobPosting.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Posting not found." }, { status: 404 });

  const data = { ...parsed.data };
  if (data.slug !== undefined || data.title !== undefined) {
    const slug = slugify(data.slug?.trim() || data.title || existing.title);
    if (!slug) return NextResponse.json({ error: "Could not derive a slug." }, { status: 400 });
    const clash = await prisma.jobPosting.findUnique({ where: { slug } });
    if (clash && clash.id !== id) {
      return NextResponse.json({ error: `The slug “${slug}” is already in use.` }, { status: 409 });
    }
    data.slug = slug;
  }

  const updated = await prisma.jobPosting.update({ where: { id }, data });

  await writeAudit({
    adminId: admin.id,
    action: "career.updated",
    entityType: "JobPosting",
    entityId: id,
    metadata: { slug: updated.slug, published: updated.isPublished },
  });

  return NextResponse.json({ ok: true, slug: updated.slug });
}

/** SUPER_ADMIN only, matching the rule used for deleting registrations. */
export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { admin, deny } = await requireAdmin("SUPER_ADMIN");
  if (deny) return deny;

  const { id } = await ctx.params;
  const existing = await prisma.jobPosting.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Posting not found." }, { status: 404 });

  // Snapshot first — the audit row outlives the record.
  await writeAudit({
    adminId: admin.id,
    action: "career.deleted",
    entityType: "JobPosting",
    entityId: id,
    metadata: { slug: existing.slug, title: existing.title },
  });

  await prisma.jobPosting.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
