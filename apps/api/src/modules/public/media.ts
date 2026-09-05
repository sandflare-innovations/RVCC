import type { Env } from "../../config/env";
import { corsHeaders, json } from "../../lib/http";
import { prisma } from "../../lib/prisma";

export async function handlePublicMediaRequest(
  request: Request,
  env: Env,
  id: string
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return json(env, request, { error: "Method not allowed" }, 405);
  }

  try {
    const file = await (prisma as any).managedFile.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        originalName: true,
        fileUrl: true,
        fileType: true,
        mimeType: true,
        sizeBytes: true,
        extension: true,
        description: true,
        createdAt: true,
        folder: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!file) {
      return json(env, request, { error: "Media file not found or inactive" }, 404);
    }

    return json(
      env,
      request,
      {
        ok: true,
        file: {
          ...file,
          sizeBytes: Number(file.sizeBytes),
          createdAt: file.createdAt.toISOString(),
        },
      },
      200,
      {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      }
    );
  } catch (err) {
    console.error("[public/media]", err);
    return json(env, request, { error: "Internal server error" }, 500);
  }
}
