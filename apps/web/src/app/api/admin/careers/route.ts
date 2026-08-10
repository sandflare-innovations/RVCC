import { NextResponse } from "next/server";

import { z } from "zod";

import { requireAdmin } from "@/lib/admin/guard";
import { writeAudit } from "@/lib/admin/session";
import { slugify } from "@/lib/content/careers";
import { prisma } from "@/lib/db";

export const jobSchema = z.object({
  title: z.string().trim().min(2, "Title is required."),
  slug: z.string().trim().optional(),
  department: z.string().trim().min(1, "Department is required."),
  location: z.string().trim().min(1, "Location is required."),
  employmentType: z.string().trim().min(1, "Employment type is required."),
  description: z.string().trim().min(1, "Description is required."),
  // Sent as arrays; the form splits its textareas on newlines.
  requirements: z.array(z.string().trim().min(1)).default([]),
  benefits: z.array(z.string().trim().min(1)).default([]),
  isRemote: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export async function POST(request: Request) {
  const { admin, deny } = await requireAdmin("ADMIN");
  if (deny) return deny;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = jobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid posting." },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const slug = slugify(data.slug?.trim() || data.title);
  if (!slug) return NextResponse.json({ error: "Could not derive a slug." }, { status: 400 });

  const clash = await prisma.jobPosting.findUnique({ where: { slug } });
  if (clash) {
    return NextResponse.json({ error: `The slug “${slug}” is already in use.` }, { status: 409 });
  }

  const created = await prisma.jobPosting.create({
    data: { ...data, slug, createdById: admin.id },
  });

  await writeAudit({
    adminId: admin.id,
    action: "career.created",
    entityType: "JobPosting",
    entityId: created.id,
    metadata: { slug, title: created.title, published: created.isPublished },
  });

  return NextResponse.json({ ok: true, id: created.id, slug });
}
