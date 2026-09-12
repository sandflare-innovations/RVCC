import { heroSlideInputSchema } from "@rvcc/schemas";
import type { Env } from "../../../config/env";
import { corsHeaders, json } from "../../../lib/http";
import { requireAdmin, writeAudit } from "../../auth";
import { HeroService } from "./hero.service";

async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function handleAdminHeroSlidesList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  await HeroService.cleanupUnusedPageHeroes(env).catch(() => undefined);

  const url = new URL(request.url);
  const page = url.searchParams.get("page") || undefined;
  const slides = await HeroService.listAdminSlides(page);
  return json(env, request, { slides });
}

export async function handleAdminHeroSlideGet(
  _sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const slide = await HeroService.getSlideById(id);
  if (!slide) return json(env, request, { error: "Slide not found." }, 404);
  return json(env, request, { slide });
}

export async function handleAdminHeroSlideCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = await readJson(request);
  const parsed = heroSlideInputSchema.safeParse(raw);
  if (!parsed.success) {
    return json(env, request, { error: parsed.error.issues[0]?.message || "Invalid payload" }, 400);
  }

  const slide = await HeroService.createSlide({
    page: parsed.data.page || "home",
    title1: parsed.data.title1.trim(),
    title2: parsed.data.title2.trim(),
    imageUrl: parsed.data.imageUrl.trim(),
    description: (parsed.data.description ?? "").trim(),
    badge: (parsed.data.badge ?? "").trim(),
    primaryBtnText: parsed.data.primaryBtnText ? parsed.data.primaryBtnText.trim() : undefined,
    primaryBtnLink: parsed.data.primaryBtnLink ? parsed.data.primaryBtnLink.trim() : undefined,
    secondaryBtnText: parsed.data.secondaryBtnText ? parsed.data.secondaryBtnText.trim() : undefined,
    secondaryBtnLink: parsed.data.secondaryBtnLink ? parsed.data.secondaryBtnLink.trim() : undefined,
    sortOrder: parsed.data.sortOrder,
    isActive: parsed.data.isActive,
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "hero_slides.created",
    entityType: "HeroSlide",
    entityId: slide.id,
    metadata: { title1: slide.title1, title2: slide.title2, page: slide.page },
  });

  return json(env, request, { ok: true, slide }, 201);
}

export async function handleAdminPageHeroUpsert(
  sql: unknown,
  env: Env,
  request: Request,
  page: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = await readJson(request);
  const parsed = heroSlideInputSchema.safeParse(raw);
  if (!parsed.success) {
    return json(env, request, { error: parsed.error.issues[0]?.message || "Invalid payload" }, 400);
  }

  const slide = await HeroService.upsertPageHero(
    page,
    {
      title1: parsed.data.title1.trim(),
      title2: parsed.data.title2.trim(),
      imageUrl: parsed.data.imageUrl.trim(),
      description: (parsed.data.description ?? "").trim(),
      badge: (parsed.data.badge ?? "").trim(),
      primaryBtnText: parsed.data.primaryBtnText ? parsed.data.primaryBtnText.trim() : undefined,
      primaryBtnLink: parsed.data.primaryBtnLink ? parsed.data.primaryBtnLink.trim() : undefined,
      secondaryBtnText: parsed.data.secondaryBtnText ? parsed.data.secondaryBtnText.trim() : undefined,
      secondaryBtnLink: parsed.data.secondaryBtnLink ? parsed.data.secondaryBtnLink.trim() : undefined,
      isActive: parsed.data.isActive,
    },
    env
  );

  await writeAudit(sql, {
    adminId: admin.id,
    action: "hero_slides.page_updated",
    entityType: "HeroSlide",
    entityId: slide.id,
    metadata: { page, title1: slide.title1, title2: slide.title2 },
  });

  return json(env, request, { ok: true, slide });
}

export async function handleAdminHeroSlideUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = await readJson(request);
  const parsed = heroSlideInputSchema.partial().safeParse(raw);
  if (!parsed.success) {
    return json(env, request, { error: parsed.error.issues[0]?.message || "Invalid payload" }, 400);
  }

  const existing = await HeroService.getSlideById(id);
  if (!existing) return json(env, request, { error: "Slide not found." }, 404);

  const data: Record<string, unknown> = {};
  if (parsed.data.page !== undefined) data.page = parsed.data.page;
  if (parsed.data.title1 !== undefined) data.title1 = parsed.data.title1.trim();
  if (parsed.data.title2 !== undefined) data.title2 = parsed.data.title2.trim();
  if (parsed.data.imageUrl !== undefined) data.imageUrl = parsed.data.imageUrl.trim();
  if (parsed.data.description !== undefined) data.description = parsed.data.description.trim();
  if (parsed.data.badge !== undefined) data.badge = parsed.data.badge.trim();
  if (parsed.data.primaryBtnText !== undefined) data.primaryBtnText = parsed.data.primaryBtnText ? parsed.data.primaryBtnText.trim() : null;
  if (parsed.data.primaryBtnLink !== undefined) data.primaryBtnLink = parsed.data.primaryBtnLink ? parsed.data.primaryBtnLink.trim() : null;
  if (parsed.data.secondaryBtnText !== undefined) data.secondaryBtnText = parsed.data.secondaryBtnText ? parsed.data.secondaryBtnText.trim() : null;
  if (parsed.data.secondaryBtnLink !== undefined) data.secondaryBtnLink = parsed.data.secondaryBtnLink ? parsed.data.secondaryBtnLink.trim() : null;
  if (parsed.data.sortOrder !== undefined) data.sortOrder = parsed.data.sortOrder;
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;

  const slide = await HeroService.updateSlide(id, data, env);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "hero_slides.updated",
    entityType: "HeroSlide",
    entityId: id,
    metadata: { changed: Object.keys(data) },
  });

  return json(env, request, { ok: true, slide });
}

export async function handleAdminHeroSlideDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const deleted = await HeroService.deleteSlide(id, env);
  if (!deleted) return json(env, request, { error: "Slide not found." }, 404);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "hero_slides.deleted",
    entityType: "HeroSlide",
    entityId: id,
    metadata: { title1: deleted.title1, title2: deleted.title2 },
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

  const raw = (await readJson(request)) as { slideIds?: unknown } | null;
  if (!raw || !Array.isArray(raw.slideIds) || raw.slideIds.length === 0) {
    return json(env, request, { error: "slideIds must be a non-empty array" }, 400);
  }

  const slideIds = raw.slideIds.map(String);
  await HeroService.reorderSlides(slideIds);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "hero_slides.reordered",
    entityType: "HeroSlide",
    entityId: "order",
    metadata: { count: slideIds.length },
  });

  return json(env, request, { ok: true });
}

export async function handlePublicHeroRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return json(env, request, { error: "Method not allowed" }, 405);
  }

  try {
    const url = new URL(request.url);
    const page = url.searchParams.get("page") || "home";
    const slides = await HeroService.listPublicSlides(page);
    return json(env, request, { slides }, 200, {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    });
  } catch (err) {
    console.error("[public/hero-slides]", err);
    return json(env, request, { error: "Internal server error" }, 500);
  }
}
