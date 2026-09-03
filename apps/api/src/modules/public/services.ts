import type { Env } from "../../config/env";
import { corsHeaders, json } from "../../lib/http";
import { prisma } from "../../lib/prisma";

export async function handlePublicServicesList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const rows = await prisma.service.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  const services = rows.map((s) => ({
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
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return json(env, request, { services }, 200, {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  });
}

export async function handlePublicServiceDetail(
  _sql: unknown,
  env: Env,
  request: Request,
  slug: string
): Promise<Response> {
  const service = await prisma.service.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      isActive: true,
      deletedAt: null,
    },
  });

  if (!service) {
    return json(env, request, { error: "Service not found." }, 404);
  }

  // Fetch gallery images tagged with this service
  const galleryImages = await prisma.galleryImage.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      serviceSlugs: { has: service.slug },
    },
    include: {
      project: {
        select: { id: true, title: true, slug: true, coverImage: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  // Projects associated with this service
  const projects = await prisma.project.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      serviceSlugs: { has: service.slug },
    },
    include: {
      gallery: {
        where: { isActive: true, deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  return json(
    env,
    request,
    {
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
          imageUrl: g.imageUrl,
          caption: g.caption,
          projectId: g.projectId,
          projectTitle: g.project?.title,
          projectSlug: g.project?.slug,
        })),
        projects: projects.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          category: p.category,
          coverImage: p.coverImage,
          images: p.gallery.map((g) => g.imageUrl),
        })),
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
      },
    },
    200,
    {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    }
  );
}

export async function handlePublicServicesRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");

  try {
    if (path === "/services" && request.method === "GET") {
      return await handlePublicServicesList(null, env, request);
    }

    const detailMatch = path.match(/^\/services\/([^/]+)$/);
    if (detailMatch && request.method === "GET") {
      const slug = decodeURIComponent(detailMatch[1]!);
      return await handlePublicServiceDetail(null, env, request, slug);
    }

    return json(env, request, { error: "Not Found" }, 404);
  } catch (err) {
    console.error("[public/services]", err);
    return json(env, request, { error: "Internal error" }, 500);
  }
}
