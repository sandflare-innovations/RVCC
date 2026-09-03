import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { requireAdmin, writeAudit } from "./auth";
import { cuid } from "./db";
import {
  putPublicAsset,
  storageKeyForGallery,
  validateUploadFile,
  validateUploadBytes,
  detectMagicMime,
  publicUploadUrl,
} from "../../lib/storage";

async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// ── Hero Slides Admin Handlers ───────────────────────────────────────────────

export async function handleAdminHeroSlidesList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const slides = await prisma.heroSlide.findMany({
    where: { deletedAt: null },
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  return json(env, request, {
    slides: slides.map((s) => ({
      id: s.id,
      badge: s.badge,
      title1: s.title1,
      title2: s.title2,
      description: s.description,
      imageUrl: s.imageUrl,
      primaryBtnText: s.primaryBtnText,
      primaryBtnLink: s.primaryBtnLink,
      secondaryBtnText: s.secondaryBtnText,
      secondaryBtnLink: s.secondaryBtnLink,
      sortOrder: s.sortOrder,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
  });
}

export async function handleAdminHeroSlideGet(
  _sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const slide = await prisma.heroSlide.findFirst({
    where: { id, deletedAt: null },
  });
  if (!slide) return json(env, request, { error: "Hero slide not found." }, 404);

  return json(env, request, {
    slide: {
      id: slide.id,
      badge: slide.badge,
      title1: slide.title1,
      title2: slide.title2,
      description: slide.description,
      imageUrl: slide.imageUrl,
      primaryBtnText: slide.primaryBtnText,
      primaryBtnLink: slide.primaryBtnLink,
      secondaryBtnText: slide.secondaryBtnText,
      secondaryBtnLink: slide.secondaryBtnLink,
      sortOrder: slide.sortOrder,
      isActive: slide.isActive,
      createdAt: slide.createdAt.toISOString(),
      updatedAt: slide.updatedAt.toISOString(),
    },
  });
}

export async function handleAdminHeroSlideCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = (await readJson(request)) as {
    badge?: string;
    title1?: string;
    title2?: string;
    description?: string;
    imageUrl?: string;
    primaryBtnText?: string;
    primaryBtnLink?: string;
    secondaryBtnText?: string;
    secondaryBtnLink?: string;
    sortOrder?: number;
    isActive?: boolean;
  } | null;

  if (!body) return json(env, request, { error: "Invalid JSON body" }, 400);

  const title1 = String(body.title1 ?? "").trim();
  const title2 = String(body.title2 ?? "").trim();
  const description = String(body.description ?? "").trim();
  const imageUrl = String(body.imageUrl ?? "").trim();

  if (!title1) return json(env, request, { error: "Title 1 is required." }, 400);
  if (!title2) return json(env, request, { error: "Title 2 is required." }, 400);
  if (!description) return json(env, request, { error: "Description is required." }, 400);
  if (!imageUrl) return json(env, request, { error: "Image URL is required." }, 400);

  const highestSort = await prisma.heroSlide.findFirst({
    where: { deletedAt: null },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : (highestSort?.sortOrder ?? -1) + 1;

  const slide = await prisma.heroSlide.create({
    data: {
      id: cuid(),
      badge: String(body.badge ?? "Architecture & Design").trim() || "Architecture & Design",
      title1,
      title2,
      description,
      imageUrl,
      primaryBtnText: body.primaryBtnText ? String(body.primaryBtnText).trim() : "Explore Works",
      primaryBtnLink: body.primaryBtnLink ? String(body.primaryBtnLink).trim() : "#projects",
      secondaryBtnText: body.secondaryBtnText ? String(body.secondaryBtnText).trim() : "E-Vendor Registration",
      secondaryBtnLink: body.secondaryBtnLink ? String(body.secondaryBtnLink).trim() : "/enquire/verify",
      sortOrder,
      isActive: body.isActive !== false,
    },
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "hero_slide.created",
    entityType: "HeroSlide",
    entityId: slide.id,
    metadata: { title1: slide.title1, title2: slide.title2 },
  });

  return json(env, request, { ok: true, slide }, 201);
}

export async function handleAdminHeroSlideUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const existing = await prisma.heroSlide.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) return json(env, request, { error: "Hero slide not found." }, 404);

  const body = (await readJson(request)) as {
    badge?: string;
    title1?: string;
    title2?: string;
    description?: string;
    imageUrl?: string;
    primaryBtnText?: string | null;
    primaryBtnLink?: string | null;
    secondaryBtnText?: string | null;
    secondaryBtnLink?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  } | null;

  if (!body) return json(env, request, { error: "Invalid JSON body" }, 400);

  const data: Record<string, unknown> = {};

  if (body.badge !== undefined) data.badge = String(body.badge).trim() || "Architecture & Design";
  if (body.title1 !== undefined) {
    const t = String(body.title1).trim();
    if (!t) return json(env, request, { error: "Title 1 cannot be empty." }, 400);
    data.title1 = t;
  }
  if (body.title2 !== undefined) {
    const t = String(body.title2).trim();
    if (!t) return json(env, request, { error: "Title 2 cannot be empty." }, 400);
    data.title2 = t;
  }
  if (body.description !== undefined) {
    const d = String(body.description).trim();
    if (!d) return json(env, request, { error: "Description cannot be empty." }, 400);
    data.description = d;
  }
  if (body.imageUrl !== undefined) {
    const img = String(body.imageUrl).trim();
    if (!img) return json(env, request, { error: "Image URL cannot be empty." }, 400);
    data.imageUrl = img;
  }
  if (body.primaryBtnText !== undefined) data.primaryBtnText = body.primaryBtnText ? String(body.primaryBtnText).trim() : null;
  if (body.primaryBtnLink !== undefined) data.primaryBtnLink = body.primaryBtnLink ? String(body.primaryBtnLink).trim() : null;
  if (body.secondaryBtnText !== undefined) data.secondaryBtnText = body.secondaryBtnText ? String(body.secondaryBtnText).trim() : null;
  if (body.secondaryBtnLink !== undefined) data.secondaryBtnLink = body.secondaryBtnLink ? String(body.secondaryBtnLink).trim() : null;
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  const updated = await prisma.heroSlide.update({
    where: { id },
    data,
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "hero_slide.updated",
    entityType: "HeroSlide",
    entityId: id,
    metadata: { changed: Object.keys(data) },
  });

  return json(env, request, { ok: true, slide: updated });
}

export async function handleAdminHeroSlideDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const existing = await prisma.heroSlide.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, title1: true, title2: true },
  });
  if (!existing) return json(env, request, { error: "Hero slide not found." }, 404);

  await prisma.heroSlide.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "hero_slide.deleted",
    entityType: "HeroSlide",
    entityId: id,
    metadata: { title1: existing.title1, title2: existing.title2 },
  });

  return json(env, request, { ok: true });
}

export async function handleAdminHeroSlidesReorder(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = (await readJson(request)) as { slideIds?: string[] } | null;
  if (!body || !Array.isArray(body.slideIds)) {
    return json(env, request, { error: "slideIds array is required." }, 400);
  }

  const { slideIds } = body;
  await prisma.$transaction(
    slideIds.map((id, index) =>
      prisma.heroSlide.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  await writeAudit(sql, {
    adminId: admin.id,
    action: "hero_slides.reordered",
    entityType: "HeroSlide",
    entityId: "order",
    metadata: { count: slideIds.length },
  });

  return json(env, request, { ok: true });
}

// ── Public Image Upload Endpoint for Admin Content ──────────────────────────

export async function handleAdminContentMediaUpload(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(env, request, { error: "Expected multipart form data" }, 400);
  }

  const file = form.get("file");
  const folder = String(form.get("folder") ?? "hero").trim();
  const label = String(form.get("label") ?? "image").trim();

  if (!(file instanceof File)) {
    return json(env, request, { error: "File is required." }, 400);
  }

  const fileError = validateUploadFile(file, { maxBytes: 10 * 1024 * 1024 });
  if (fileError) return json(env, request, { error: fileError }, 400);

  const bytes = await file.arrayBuffer();
  const byteError = validateUploadBytes(new Uint8Array(bytes), { maxBytes: 10 * 1024 * 1024 });
  if (byteError) return json(env, request, { error: byteError }, 400);

  const detectedMime = detectMagicMime(new Uint8Array(bytes));
  const mimeType = detectedMime || file.type || "image/webp";

  const key = storageKeyForGallery(folder, label, detectedMime === "application/pdf" ? "pdf" : "webp");

  try {
    await putPublicAsset(env, key, bytes, mimeType);
  } catch (err) {
    console.error("[content/upload] upload error", err);
    return json(env, request, { error: "Failed to store public media" }, 500);
  }

  const fileUrl = publicUploadUrl(env, key);
  return json(env, request, { ok: true, fileUrl, key });
}
