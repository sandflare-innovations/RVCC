import type { Env } from "../../config/env";
import { corsHeaders, json } from "../../lib/http";
import { prisma } from "../../lib/prisma";

export async function handlePublicProjectsList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const rows = await prisma.project.findMany({
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

  const projects = rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: p.category,
    client: p.client,
    location: p.location,
    year: p.year,
    status: p.status,
    description: p.description,
    image: p.coverImage || (p.gallery[0]?.imageUrl ?? "/images/projects/1.webp"),
    coverImage: p.coverImage,
    scope: p.scope,
    gallery: p.gallery.map((g) => g.imageUrl),
    sortOrder: p.sortOrder,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return json(env, request, { projects }, 200, {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  });
}

export async function handlePublicProjectDetail(
  _sql: unknown,
  env: Env,
  request: Request,
  slug: string
): Promise<Response> {
  const project = await prisma.project.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      isActive: true,
      deletedAt: null,
    },
    include: {
      gallery: {
        where: { isActive: true, deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!project) {
    return json(env, request, { error: "Project not found." }, 404);
  }

  const galleryUrls = project.gallery.map((g) => g.imageUrl);
  if (project.coverImage && !galleryUrls.includes(project.coverImage)) {
    galleryUrls.unshift(project.coverImage);
  }

  return json(
    env,
    request,
    {
      project: {
        id: project.id,
        slug: project.slug,
        title: project.title,
        category: project.category,
        client: project.client,
        location: project.location,
        year: project.year,
        status: project.status,
        description: project.description,
        image: project.coverImage || (galleryUrls[0] ?? "/images/projects/1.webp"),
        coverImage: project.coverImage,
        scope: project.scope,
        gallery: galleryUrls,
        sortOrder: project.sortOrder,
        isActive: project.isActive,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      },
    },
    200,
    {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    }
  );
}

export async function handlePublicProjectsRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  try {
    if (path === "/projects" && request.method === "GET") {
      return await handlePublicProjectsList(null, env, request);
    }

    const detailMatch = path.match(/^\/projects\/([^/]+)$/);
    if (detailMatch && request.method === "GET") {
      const slug = decodeURIComponent(detailMatch[1]!);
      return await handlePublicProjectDetail(null, env, request, slug);
    }

    return json(env, request, { error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("[public/projects]", err);
    return json(env, request, { error: "Internal error" }, 500);
  }
}
