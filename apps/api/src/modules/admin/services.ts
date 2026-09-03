import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { slugify } from "../../lib/storage";
import { cuid } from "./db";
import { requireAdmin, writeAudit } from "./auth";

function parseJson(request: Request): Promise<any> {
  return request.json().catch(() => null);
}

export async function handleAdminServicesList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const services = await prisma.service.findMany({
    where: { deletedAt: null },
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
  });

  // Count gallery images tagged with each service slug
  const allGalleryImages = await prisma.galleryImage.findMany({
    where: { deletedAt: null },
    select: { serviceSlugs: true },
  });

  const countBySlug: Record<string, number> = {};
  for (const img of allGalleryImages) {
    const slugs = (img as any).serviceSlugs || [];
    for (const s of slugs) {
      countBySlug[s] = (countBySlug[s] || 0) + 1;
    }
  }

  return json(env, request, {
    services: services.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      description: s.description,
      longDescription: s.longDescription,
      image: s.image,
      iconName: s.iconName,
      features: s.features,
      sortOrder: s.sortOrder,
      isActive: s.isActive,
      _count: {
        galleryImages: countBySlug[s.slug] || 0,
      },
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
  });
}

export async function handleAdminServiceGet(
  _sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const service = await prisma.service.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      deletedAt: null,
    },
  });

  if (!service) {
    return json(env, request, { error: "Service not found." }, 404);
  }

  // Find all gallery images tagged with this service's slug
  const galleryImages = await prisma.galleryImage.findMany({
    where: {
      deletedAt: null,
      serviceSlugs: { has: service.slug },
    },
    include: {
      project: {
        select: { id: true, title: true, slug: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return json(env, request, {
    service: {
      id: service.id,
      slug: service.slug,
      title: service.title,
      description: service.description,
      longDescription: service.longDescription,
      image: service.image,
      iconName: service.iconName,
      features: service.features,
      sortOrder: service.sortOrder,
      isActive: service.isActive,
      galleryImages: galleryImages.map((g) => ({
        id: g.id,
        projectId: g.projectId,
        projectTitle: g.project?.title,
        projectSlug: g.project?.slug,
        imageUrl: g.imageUrl,
        caption: g.caption,
        serviceSlugs: (g as any).serviceSlugs ?? [],
        isCover: (g as any).isCover ?? false,
        sortOrder: g.sortOrder,
        isActive: g.isActive,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
      })),
      _count: {
        galleryImages: galleryImages.length,
      },
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    },
  });
}

export async function handleAdminServiceCreate(
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
    return json(env, request, { error: "Service title is required." }, 400);
  }

  let slug = String(body.slug ?? "").trim();
  if (!slug) {
    slug = slugify(title);
  } else {
    slug = slugify(slug);
  }

  const existingSlug = await prisma.service.findFirst({
    where: { slug, deletedAt: null },
  });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  const description = String(body.description ?? "").trim();
  const longDescription = String(body.longDescription ?? "").trim();
  const image = String(body.image ?? "").trim();
  const iconName = String(body.iconName ?? "Wrench").trim();
  const features = Array.isArray(body.features)
    ? body.features.map(String).map((s: string) => s.trim()).filter(Boolean)
    : [];
  const sortOrder = Number.isInteger(body.sortOrder) ? Number(body.sortOrder) : 0;
  const isActive = typeof body.isActive === "boolean" ? body.isActive : true;

  const newService = await prisma.service.create({
    data: {
      id: cuid(),
      slug,
      title,
      description,
      longDescription,
      image,
      iconName,
      features,
      sortOrder,
      isActive,
    },
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "service.created",
    entityType: "Service",
    entityId: newService.id,
    metadata: { title, slug },
  });

  return json(env, request, { ok: true, service: newService }, 201);
}

export async function handleAdminServiceUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const service = await prisma.service.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      deletedAt: null,
    },
  });

  if (!service) {
    return json(env, request, { error: "Service not found." }, 404);
  }

  const body = await parseJson(request);
  if (!body || typeof body !== "object") {
    return json(env, request, { error: "Invalid JSON body." }, 400);
  }

  const updateData: Record<string, any> = {};

  if (typeof body.title === "string" && body.title.trim()) {
    updateData.title = body.title.trim();
  }
  if (typeof body.slug === "string" && body.slug.trim()) {
    const newSlug = slugify(body.slug.trim());
    if (newSlug !== service.slug) {
      const conflict = await prisma.service.findFirst({
        where: { slug: newSlug, id: { not: service.id }, deletedAt: null },
      });
      if (conflict) {
        return json(env, request, { error: "Slug is already used by another service." }, 409);
      }
      updateData.slug = newSlug;
    }
  }
  if (typeof body.description === "string") updateData.description = body.description.trim();
  if (typeof body.longDescription === "string") updateData.longDescription = body.longDescription.trim();
  if (typeof body.image === "string") updateData.image = body.image.trim();
  if (typeof body.iconName === "string") updateData.iconName = body.iconName.trim();
  if (Array.isArray(body.features)) {
    updateData.features = body.features.map(String).map((s: string) => s.trim()).filter(Boolean);
  }
  if (typeof body.sortOrder === "number") updateData.sortOrder = body.sortOrder;
  if (typeof body.isActive === "boolean") updateData.isActive = body.isActive;

  const updated = await prisma.service.update({
    where: { id: service.id },
    data: updateData,
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "service.updated",
    entityType: "Service",
    entityId: service.id,
    metadata: updateData,
  });

  return json(env, request, { ok: true, service: updated });
}

export async function handleAdminServiceDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const service = await prisma.service.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      deletedAt: null,
    },
  });

  if (!service) {
    return json(env, request, { error: "Service not found." }, 404);
  }

  await prisma.service.update({
    where: { id: service.id },
    data: { deletedAt: new Date(), isActive: false },
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "service.deleted",
    entityType: "Service",
    entityId: service.id,
    metadata: { title: service.title, slug: service.slug },
  });

  return json(env, request, { ok: true });
}

export async function handleAdminServicesReorder(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = await parseJson(request);
  if (!body || !Array.isArray(body.items)) {
    return json(env, request, { error: "Invalid reorder payload — expected { items: { id, sortOrder }[] }" }, 400);
  }

  const updates = (body.items as { id: string; sortOrder: number }[]).filter(
    (item) => item && typeof item.id === "string" && typeof item.sortOrder === "number"
  );

  await prisma.$transaction(
    updates.map((item) =>
      prisma.service.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );

  await writeAudit(sql, {
    adminId: admin.id,
    action: "service.reordered",
    entityType: "Service",
    entityId: "all",
    metadata: { count: updates.length },
  });

  return json(env, request, { ok: true, count: updates.length });
}
