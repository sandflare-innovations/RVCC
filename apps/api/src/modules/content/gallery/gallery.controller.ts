import type { Env } from "../../../config/env";
import { corsHeaders, json } from "../../../lib/http";
import { requireAdmin, writeAudit } from "../../auth";
import { GalleryService } from "./gallery.service";

async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
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

  const images = await GalleryService.listAdminImages(projectId);
  return json(env, request, { images });
}

export async function handleAdminGalleryImageGet(
  _sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const image = await GalleryService.getImageById(id);
  if (!image) return json(env, request, { error: "Image not found." }, 404);
  return json(env, request, { image });
}

export async function handleAdminGalleryImageCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = (await readJson(request)) as Record<string, unknown> | null;
  if (!raw) return json(env, request, { error: "Invalid JSON body" }, 400);

  const projectId = String(raw.projectId ?? "").trim();
  const imageUrl = String(raw.imageUrl ?? "").trim();

  if (!projectId || !imageUrl) {
    return json(env, request, { error: "projectId and imageUrl are required." }, 400);
  }

  const image = await GalleryService.createImage({
    projectId,
    imageUrl,
    caption: String(raw.caption ?? "").trim(),
    serviceSlugs: Array.isArray(raw.serviceSlugs) ? raw.serviceSlugs.map(String) : [],
    isCover: Boolean(raw.isCover),
    sortOrder: typeof raw.sortOrder === "number" ? raw.sortOrder : undefined,
    isActive: typeof raw.isActive === "boolean" ? raw.isActive : undefined,
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "gallery.created",
    entityType: "GalleryImage",
    entityId: image.id,
    metadata: { projectId },
  });

  return json(env, request, { ok: true, image }, 201);
}

export async function handleAdminGalleryImageUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = (await readJson(request)) as Record<string, unknown> | null;
  if (!raw) return json(env, request, { error: "Invalid JSON body" }, 400);

  const existing = await GalleryService.getImageById(id);
  if (!existing) return json(env, request, { error: "Image not found." }, 404);

  const data: Record<string, unknown> = {};
  if (raw.imageUrl !== undefined) data.imageUrl = String(raw.imageUrl).trim();
  if (raw.caption !== undefined) data.caption = String(raw.caption).trim();
  if (Array.isArray(raw.serviceSlugs)) data.serviceSlugs = raw.serviceSlugs.map(String);
  if (typeof raw.isCover === "boolean") data.isCover = raw.isCover;
  if (typeof raw.sortOrder === "number") data.sortOrder = raw.sortOrder;
  if (typeof raw.isActive === "boolean") data.isActive = raw.isActive;

  const image = await GalleryService.updateImage(id, data);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "gallery.updated",
    entityType: "GalleryImage",
    entityId: id,
    metadata: { changed: Object.keys(data) },
  });

  return json(env, request, { ok: true, image });
}

export async function handleAdminGalleryImageDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const deleted = await GalleryService.deleteImage(id);
  if (!deleted) return json(env, request, { error: "Image not found." }, 404);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "gallery.deleted",
    entityType: "GalleryImage",
    entityId: id,
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

  const raw = (await readJson(request)) as { imageIds?: unknown } | null;
  if (!raw || !Array.isArray(raw.imageIds) || raw.imageIds.length === 0) {
    return json(env, request, { error: "imageIds must be a non-empty array" }, 400);
  }

  const imageIds = raw.imageIds.map(String);
  await GalleryService.reorderImages(imageIds);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "gallery.reordered",
    entityType: "GalleryImage",
    entityId: "order",
    metadata: { count: imageIds.length },
  });

  return json(env, request, { ok: true });
}

export async function handlePublicGalleryRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return json(env, request, { error: "Method not allowed" }, 405);
  }

  try {
    const images = await GalleryService.listPublicImages();

    // Group images into project-based collections for web clients
    const collectionsMap = new Map<string, any>();
    for (const img of images) {
      const slug = img.projectSlug || img.projectId;
      if (!slug) continue;
      if (!collectionsMap.has(slug)) {
        collectionsMap.set(slug, {
          id: img.projectId,
          slug,
          title: img.projectTitle || slug,
          description: img.caption || "",
          thumbnail: img.imageUrl,
          images: [] as string[],
          serviceSlugs: Array.isArray(img.serviceSlugs) ? [...img.serviceSlugs] : [],
        });
      }
      const col = collectionsMap.get(slug);
      col.images.push(img.imageUrl);
      if (img.isCover) {
        col.thumbnail = img.imageUrl;
      }
      if (Array.isArray(img.serviceSlugs)) {
        for (const s of img.serviceSlugs) {
          if (!col.serviceSlugs.includes(s)) {
            col.serviceSlugs.push(s);
          }
        }
      }
    }
    const collections = Array.from(collectionsMap.values());

    return json(env, request, { images, collections }, 200, {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    });
  } catch (err) {
    console.error("[public/gallery]", err);
    return json(env, request, { error: "Internal server error" }, 500);
  }
}
