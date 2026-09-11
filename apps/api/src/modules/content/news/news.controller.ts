import { newsEventInputSchema } from "@rvcc/schemas";
import type { Env } from "../../../config/env";
import { corsHeaders, json } from "../../../lib/http";
import { requireAdmin, writeAudit } from "../../auth";
import { NewsService } from "./news.service";

async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// ── Public Handlers ─────────────────────────────────────────────────────────

export async function handlePublicNewsList(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return json(env, request, { error: "Method not allowed" }, 405);
  }

  try {
    const news = await NewsService.listPublicNews();
    return json(env, request, { news }, 200, {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    });
  } catch (err) {
    console.error("[public/news]", err);
    return json(env, request, { error: "Internal server error" }, 500);
  }
}

export async function handlePublicNewsGet(
  request: Request,
  env: Env,
  slug: string
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return json(env, request, { error: "Method not allowed" }, 405);
  }

  try {
    const news = await NewsService.getNewsBySlug(slug);
    if (!news) return json(env, request, { error: "News article not found." }, 404);

    return json(env, request, { news }, 200, {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    });
  } catch (err) {
    console.error(`[public/news/${slug}]`, err);
    return json(env, request, { error: "Internal server error" }, 500);
  }
}

// ── Admin Handlers ──────────────────────────────────────────────────────────

export async function handleAdminNewsList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const news = await NewsService.listAdminNews();
  return json(env, request, { news });
}

export async function handleAdminNewsGet(
  _sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const news = await NewsService.getNewsById(id);
  if (!news) return json(env, request, { error: "News article not found." }, 404);
  return json(env, request, { news });
}

export async function handleAdminNewsCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = await readJson(request);
  const parsed = newsEventInputSchema.safeParse(raw);
  if (!parsed.success) {
    return json(env, request, { error: parsed.error.issues[0]?.message || "Invalid payload" }, 400);
  }

  const title = parsed.data.title.trim();
  const imageUrl = parsed.data.imageUrl.trim();
  if (!title || !imageUrl) {
    return json(env, request, { error: "title and imageUrl are required." }, 400);
  }

  const news = await NewsService.createNews({
    title,
    slug: parsed.data.slug?.trim(),
    date: parsed.data.date?.trim(),
    excerpt: parsed.data.excerpt?.trim(),
    content: parsed.data.content,
    imageUrl,
    category: parsed.data.category?.trim(),
    edition: parsed.data.edition?.trim(),
    sortOrder: parsed.data.sortOrder,
    isActive: parsed.data.isActive,
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "news.created",
    entityType: "NewsEvent",
    entityId: news.id,
    metadata: { title, slug: news.slug },
  });

  return json(env, request, { ok: true, news }, 201);
}

export async function handleAdminNewsUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = await readJson(request);
  const parsed = newsEventInputSchema.partial().safeParse(raw);
  if (!parsed.success) {
    return json(env, request, { error: parsed.error.issues[0]?.message || "Invalid payload" }, 400);
  }

  const existing = await NewsService.getNewsById(id);
  if (!existing) return json(env, request, { error: "News article not found." }, 404);

  const data: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title.trim();
  if (parsed.data.slug !== undefined) data.slug = parsed.data.slug.trim();
  if (parsed.data.date !== undefined) data.date = parsed.data.date.trim();
  if (parsed.data.excerpt !== undefined) data.excerpt = parsed.data.excerpt.trim();
  if (parsed.data.content !== undefined) data.content = parsed.data.content;
  if (parsed.data.imageUrl !== undefined) data.imageUrl = parsed.data.imageUrl.trim();
  if (parsed.data.category !== undefined) data.category = parsed.data.category.trim();
  if (parsed.data.edition !== undefined) data.edition = parsed.data.edition.trim();
  if (parsed.data.sortOrder !== undefined) data.sortOrder = parsed.data.sortOrder;
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;

  const news = await NewsService.updateNews(id, data);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "news.updated",
    entityType: "NewsEvent",
    entityId: id,
    metadata: { changed: Object.keys(data) },
  });

  return json(env, request, { ok: true, news });
}

export async function handleAdminNewsDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const deleted = await NewsService.deleteNews(id);
  if (!deleted) return json(env, request, { error: "News article not found." }, 404);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "news.deleted",
    entityType: "NewsEvent",
    entityId: id,
    metadata: { title: deleted.title },
  });

  return json(env, request, { ok: true });
}

export async function handleAdminNewsReorder(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = (await readJson(request)) as { newsIds?: unknown } | null;
  if (!raw || !Array.isArray(raw.newsIds) || raw.newsIds.length === 0) {
    return json(env, request, { error: "newsIds must be a non-empty array" }, 400);
  }

  const newsIds = raw.newsIds.map(String);
  await NewsService.reorderNews(newsIds);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "news.reordered",
    entityType: "NewsEvent",
    entityId: "order",
    metadata: { count: newsIds.length },
  });

  return json(env, request, { ok: true });
}
