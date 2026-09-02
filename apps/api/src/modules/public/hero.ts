import type { Env } from "../../config/env";
import { corsHeaders, json } from "../../lib/http";
import { prisma } from "../../lib/prisma";

export async function handlePublicHeroSlidesList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const rows = await prisma.heroSlide.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  const slides = rows.map((r) => ({
    id: r.id,
    badge: r.badge,
    title1: r.title1,
    title2: r.title2,
    description: r.description,
    imageUrl: r.imageUrl,
    primaryBtnText: r.primaryBtnText,
    primaryBtnLink: r.primaryBtnLink,
    secondaryBtnText: r.secondaryBtnText,
    secondaryBtnLink: r.secondaryBtnLink,
    sortOrder: r.sortOrder,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return json(env, request, { slides }, 200, {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  });
}

export async function handlePublicHeroRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  try {
    if (request.method === "GET") {
      return await handlePublicHeroSlidesList(null, env, request);
    }
    return json(env, request, { error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("[public/hero-slides]", err);
    return json(env, request, { error: "Internal error" }, 500);
  }
}
