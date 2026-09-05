import type { Env } from "../../config/env";
import { corsHeaders, json } from "../../lib/http";
import { prisma } from "../../lib/prisma";

export async function handlePublicDocumentsRequest(
  request: Request,
  env: Env,
  slug?: string
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return json(env, request, { error: "Method not allowed" }, 405);
  }

  try {
    // ── Single document by slug ──────────────────────────────────────────────
    if (slug) {
      const doc = await (prisma as any).companyDocument.findFirst({
        where: {
          slug,
          isPublished: true,
          deletedAt: null,
        },
      });

      if (!doc) {
        return json(env, request, { error: "Document not found" }, 404);
      }

      return json(
        env,
        request,
        {
          ok: true,
          document: {
            id: doc.id,
            slug: doc.slug,
            title: doc.title,
            category: doc.category,
            description: doc.description,
            fileSize: doc.fileSize,
            sizeBytes: Number(doc.sizeBytes),
            pageCount: doc.pageCount,
            fileUrl: doc.fileUrl,
            storageKey: doc.storageKey,
            filePath: doc.filePath,
            coverImage: doc.coverImage,
            sortOrder: doc.sortOrder,
            requiresAuth: doc.requiresAuth,
            createdAt: doc.createdAt.toISOString(),
            updatedAt: doc.updatedAt.toISOString(),
          },
        },
        200,
        {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=86400",
        }
      );
    }

    // ── List all published documents ─────────────────────────────────────────
    const docs = await (prisma as any).companyDocument.findMany({
      where: {
        isPublished: true,
        deletedAt: null,
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
    });

    return json(
      env,
      request,
      {
        ok: true,
        documents: docs.map((d: any) => ({
          id: d.id,
          slug: d.slug,
          title: d.title,
          category: d.category,
          description: d.description,
          fileSize: d.fileSize,
          sizeBytes: Number(d.sizeBytes),
          pageCount: d.pageCount,
          fileUrl: d.fileUrl,
          storageKey: d.storageKey,
          filePath: d.filePath,
          coverImage: d.coverImage,
          sortOrder: d.sortOrder,
          requiresAuth: d.requiresAuth,
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
        })),
      },
      200,
      {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=86400",
      }
    );
  } catch (err) {
    console.error("[public/documents]", err);
    return json(env, request, { error: "Failed to retrieve documents" }, 500);
  }
}
