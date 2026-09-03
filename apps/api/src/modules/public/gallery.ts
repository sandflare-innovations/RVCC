import type { Env } from "../../config/env";
import { corsHeaders, json } from "../../lib/http";
import { prisma } from "../../lib/prisma";

export async function handlePublicGalleryList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const projects = await prisma.project.findMany({
    where: { isActive: true, deletedAt: null },
    include: {
      gallery: {
        where: { isActive: true, deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
  });

  const collections = projects.map((p) => {
    const images = p.gallery.map((g) => g.imageUrl);
    if (p.coverImage && !images.includes(p.coverImage)) {
      images.unshift(p.coverImage);
    }

    const serviceSlugs =
      (p as any).serviceSlugs && (p as any).serviceSlugs.length > 0
        ? (p as any).serviceSlugs
        : [p.category.toLowerCase().replace(/\s+/g, "-")];

    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      thumbnail: p.coverImage || images[0] || "/images/projects/1.webp",
      images,
      serviceSlugs,
    };
  });

  return json(env, request, { collections }, 200, {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  });
}

export async function handlePublicGalleryRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  try {
    if (request.method === "GET") {
      return await handlePublicGalleryList(null, env, request);
    }
    return json(env, request, { error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("[public/gallery]", err);
    return json(env, request, { error: "Internal error" }, 500);
  }
}
