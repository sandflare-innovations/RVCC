import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { slugify } from "../../lib/storage";
import { cuid } from "./db";
import { requireAdmin, writeAudit } from "./auth";

function parseJson(request: Request): Promise<any> {
  return request.json().catch(() => null);
}

export async function handleAdminProjectsList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const projects = await prisma.project.findMany({
    where: { deletedAt: null },
    include: {
      _count: {
        select: { gallery: { where: { deletedAt: null } } },
      },
    },
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
  });

  return json(env, request, {
    projects: projects.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      category: p.category,
      serviceSlugs: (p as any).serviceSlugs ?? [],
      client: p.client,
      location: p.location,
      year: p.year,
      status: p.status,
      description: p.description,
      coverImage: p.coverImage,
      scope: p.scope,
      sortOrder: p.sortOrder,
      isActive: p.isActive,
      _count: {
        gallery: p._count.gallery,
      },
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  });
}

export async function handleAdminProjectGet(
  _sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const project = await prisma.project.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      deletedAt: null,
    },
    include: {
      gallery: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!project) {
    return json(env, request, { error: "Project not found." }, 404);
  }

  return json(env, request, {
    project: {
      id: project.id,
      slug: project.slug,
      title: project.title,
      category: project.category,
      serviceSlugs: (project as any).serviceSlugs ?? [],
      client: project.client,
      location: project.location,
      year: project.year,
      status: project.status,
      description: project.description,
      coverImage: project.coverImage,
      scope: project.scope,
      sortOrder: project.sortOrder,
      isActive: project.isActive,
      gallery: project.gallery.map((g) => ({
        id: g.id,
        projectId: g.projectId,
        imageUrl: g.imageUrl,
        caption: g.caption,
        serviceSlugs: (g as any).serviceSlugs ?? [],
        isCover: (g as any).isCover ?? (project.coverImage === g.imageUrl),
        sortOrder: g.sortOrder,
        isActive: g.isActive,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
      })),
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    },
  });
}

export async function handleAdminProjectCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = await parseJson(request);
  if (!body || typeof body !== "object") {
    return json(env, request, { error: "Invalid JSON body." }, 400);
  }

  const title = String(body.title ?? "").trim();
  if (!title) {
    return json(env, request, { error: "Project title is required." }, 400);
  }

  let slug = String(body.slug ?? "").trim();
  if (!slug) {
    slug = slugify(title);
  }
  if (!slug) {
    slug = `project-${cuid().slice(-6)}`;
  }

  // Ensure unique slug
  let finalSlug = slug;
  let counter = 1;
  while (true) {
    const existing = await prisma.project.findFirst({
      where: { slug: finalSlug, deletedAt: null },
    });
    if (!existing) break;
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  const category = String(body.category ?? "Commercial Architecture").trim();
  const serviceSlugs = Array.isArray(body.serviceSlugs)
    ? body.serviceSlugs.map(String).filter(Boolean)
    : [];
  const client = String(body.client ?? "").trim();
  const location = String(body.location ?? "Riyadh, KSA").trim();
  const year = String(body.year ?? new Date().getFullYear().toString()).trim();
  const status = String(body.status ?? "Completed").trim();
  const description = String(body.description ?? "").trim();
  const coverImage = String(body.coverImage ?? "").trim();
  const scope = Array.isArray(body.scope) ? body.scope.map(String).filter(Boolean) : [];
  const sortOrder = Number.isInteger(body.sortOrder) ? Number(body.sortOrder) : 0;
  const isActive = typeof body.isActive === "boolean" ? body.isActive : true;

  const newProject = await prisma.project.create({
    data: {
      id: cuid(),
      slug: finalSlug,
      title,
      category,
      serviceSlugs,
      client,
      location,
      year,
      status,
      description,
      coverImage,
      scope,
      sortOrder,
      isActive,
    } as any,
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "project.created",
    entityType: "Project",
    entityId: newProject.id,
    metadata: { title, slug: finalSlug },
  });

  return json(
    env,
    request,
    {
      ok: true,
      project: {
        ...newProject,
        createdAt: newProject.createdAt.toISOString(),
        updatedAt: newProject.updatedAt.toISOString(),
      },
    },
    201
  );
}

export async function handleAdminProjectUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
  });
  if (!project) {
    return json(env, request, { error: "Project not found." }, 404);
  }

  const body = await parseJson(request);
  if (!body || typeof body !== "object") {
    return json(env, request, { error: "Invalid JSON body." }, 400);
  }

  const updateData: Record<string, any> = {};

  if (typeof body.title === "string" && body.title.trim()) {
    updateData.title = body.title.trim();
  }
  if (typeof body.slug === "string" && body.slug.trim() && body.slug.trim() !== project.slug) {
    const rawSlug = slugify(body.slug.trim());
    const existing = await prisma.project.findFirst({
      where: { slug: rawSlug, id: { not: id }, deletedAt: null },
    });
    if (existing) {
      return json(env, request, { error: "Slug is already in use by another project." }, 409);
    }
    updateData.slug = rawSlug;
  }
  if (typeof body.category === "string") updateData.category = body.category.trim();
  if (Array.isArray(body.serviceSlugs)) {
    updateData.serviceSlugs = body.serviceSlugs.map(String).filter(Boolean);
  }
  if (typeof body.client === "string") updateData.client = body.client.trim();
  if (typeof body.location === "string") updateData.location = body.location.trim();
  if (typeof body.year === "string") updateData.year = body.year.trim();
  if (typeof body.status === "string") updateData.status = body.status.trim();
  if (typeof body.description === "string") updateData.description = body.description.trim();
  if (typeof body.coverImage === "string") updateData.coverImage = body.coverImage.trim();
  if (Array.isArray(body.scope)) updateData.scope = body.scope.map(String).filter(Boolean);
  if (typeof body.sortOrder === "number") updateData.sortOrder = body.sortOrder;
  if (typeof body.isActive === "boolean") updateData.isActive = body.isActive;

  const updated = await prisma.project.update({
    where: { id },
    data: updateData,
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "project.updated",
    entityType: "Project",
    entityId: id,
    metadata: updateData,
  });

  return json(env, request, {
    ok: true,
    project: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
}

export async function handleAdminProjectDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "SUPER_ADMIN");
  if (deny) return deny;

  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
  });
  if (!project) {
    return json(env, request, { error: "Project not found." }, 404);
  }

  await prisma.project.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "project.deleted",
    entityType: "Project",
    entityId: id,
    metadata: { title: project.title },
  });

  return json(env, request, { ok: true });
}

export async function handleAdminProjectsReorder(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = await parseJson(request);
  if (!body || !Array.isArray(body.projectIds)) {
    return json(env, request, { error: "Expected projectIds array." }, 400);
  }

  const projectIds: string[] = body.projectIds;
  await prisma.$transaction(
    projectIds.map((id, index) =>
      prisma.project.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  await writeAudit(sql, {
    adminId: admin.id,
    action: "project.reordered",
    entityType: "Project",
    entityId: "order",
    metadata: { count: projectIds.length },
  });

  return json(env, request, { ok: true });
}
