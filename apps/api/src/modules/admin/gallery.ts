import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { cuid } from "./db";
import { requireAdmin, writeAudit } from "./auth";

function parseJson(request: Request): Promise<any> {
  return request.json().catch(() => null);
}

export async function handleAdminGalleryImagesList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");

  const where: any = { deletedAt: null };
  if (projectId) {
    where.projectId = projectId;
  }

  const images = await prisma.galleryImage.findMany({
    where,
    include: {
      project: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
  });

  return json(env, request, {
    images: images.map((img) => ({
      id: img.id,
      projectId: img.projectId,
      projectTitle: img.project?.title,
      projectSlug: img.project?.slug,
      imageUrl: img.imageUrl,
      caption: img.caption,
      serviceSlugs: (img as any).serviceSlugs ?? [],
      isCover: (img as any).isCover ?? false,
      sortOrder: img.sortOrder,
      isActive: img.isActive,
      createdAt: img.createdAt.toISOString(),
      updatedAt: img.updatedAt.toISOString(),
    })),
  });
}

export async function handleAdminGalleryImageCreate(
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

  const projectId = String(body.projectId ?? "").trim();
  const imageUrl = String(body.imageUrl ?? "").trim();

  if (!projectId) {
    return json(env, request, { error: "Project ID is required." }, 400);
  }
  if (!imageUrl) {
    return json(env, request, { error: "Image URL is required." }, 400);
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
  });
  if (!project) {
    return json(env, request, { error: "Associated project not found." }, 404);
  }

  const caption = String(body.caption ?? "").trim();
  const serviceSlugs = Array.isArray(body.serviceSlugs)
    ? body.serviceSlugs.map(String).filter(Boolean)
    : (project as any).serviceSlugs ?? [];
  const isCover = typeof body.isCover === "boolean" ? body.isCover : false;
  const sortOrder = Number.isInteger(body.sortOrder) ? Number(body.sortOrder) : 0;
  const isActive = typeof body.isActive === "boolean" ? body.isActive : true;

  if (isCover) {
    // Unset any previous cover in this project
    await prisma.galleryImage.updateMany({
      where: { projectId },
      data: { isCover: false } as any,
    });
    // Set as project coverImage
    await prisma.project.update({
      where: { id: projectId },
      data: { coverImage: imageUrl },
    });
  }

  const newImage = await prisma.galleryImage.create({
    data: {
      id: cuid(),
      projectId,
      imageUrl,
      caption,
      serviceSlugs,
      isCover,
      sortOrder,
      isActive,
    } as any,
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "gallery_image.created",
    entityType: "GalleryImage",
    entityId: newImage.id,
    metadata: { projectId, projectTitle: project.title, imageUrl },
  });

  return json(
    env,
    request,
    {
      ok: true,
      image: {
        ...newImage,
        projectTitle: project.title,
        projectSlug: project.slug,
        createdAt: newImage.createdAt.toISOString(),
        updatedAt: newImage.updatedAt.toISOString(),
      },
    },
    201
  );
}

export async function handleAdminGalleryImageUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const image = await prisma.galleryImage.findFirst({
    where: { id, deletedAt: null },
  });
  if (!image) {
    return json(env, request, { error: "Gallery image not found." }, 404);
  }

  const body = await parseJson(request);
  if (!body || typeof body !== "object") {
    return json(env, request, { error: "Invalid JSON body." }, 400);
  }

  const updateData: Record<string, any> = {};
  if (typeof body.caption === "string") updateData.caption = body.caption.trim();
  if (typeof body.imageUrl === "string" && body.imageUrl.trim()) {
    updateData.imageUrl = body.imageUrl.trim();
  }
  if (Array.isArray(body.serviceSlugs)) {
    updateData.serviceSlugs = body.serviceSlugs.map(String).filter(Boolean);
  }
  if (typeof body.isCover === "boolean") {
    updateData.isCover = body.isCover;
    if (body.isCover) {
      await prisma.galleryImage.updateMany({
        where: { projectId: image.projectId },
        data: { isCover: false } as any,
      });
      await prisma.project.update({
        where: { id: image.projectId },
        data: { coverImage: updateData.imageUrl || image.imageUrl },
      });
    }
  }
  if (typeof body.projectId === "string" && body.projectId.trim() && body.projectId !== image.projectId) {
    const projectExists = await prisma.project.findFirst({
      where: { id: body.projectId.trim(), deletedAt: null },
    });
    if (!projectExists) {
      return json(env, request, { error: "Target project does not exist." }, 404);
    }
    updateData.projectId = body.projectId.trim();
  }
  if (typeof body.sortOrder === "number") updateData.sortOrder = body.sortOrder;
  if (typeof body.isActive === "boolean") updateData.isActive = body.isActive;

  const updated = await prisma.galleryImage.update({
    where: { id },
    data: updateData as any,
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "gallery_image.updated",
    entityType: "GalleryImage",
    entityId: id,
    metadata: updateData,
  });

  return json(env, request, {
    ok: true,
    image: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
}

export async function handleAdminGalleryImageDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const image = await prisma.galleryImage.findFirst({
    where: { id, deletedAt: null },
  });
  if (!image) {
    return json(env, request, { error: "Gallery image not found." }, 404);
  }

  await prisma.galleryImage.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "gallery_image.deleted",
    entityType: "GalleryImage",
    entityId: id,
    metadata: { projectId: image.projectId, imageUrl: image.imageUrl },
  });

  return json(env, request, { ok: true });
}

export async function handleAdminGalleryImagesReorder(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = await parseJson(request);
  if (!body || !Array.isArray(body.imageIds)) {
    return json(env, request, { error: "Expected imageIds array." }, 400);
  }

  const imageIds: string[] = body.imageIds;
  await prisma.$transaction(
    imageIds.map((id, index) =>
      prisma.galleryImage.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  await writeAudit(sql, {
    adminId: admin.id,
    action: "gallery_image.reordered",
    entityType: "GalleryImage",
    entityId: "order",
    metadata: { count: imageIds.length },
  });

  return json(env, request, { ok: true });
}
