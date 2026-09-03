import type { Env } from "../../config/env";
import { corsHeaders, json } from "../../lib/http";
import { prisma } from "../../lib/prisma";

export async function handlePublicClientsList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const rows = await prisma.clientPartner.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  const clients = rows.map((c) => ({
    id: c.id,
    name: c.name,
    logoUrl: c.logoUrl,
    industry: c.industry,
    websiteUrl: c.websiteUrl,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return json(env, request, { clients }, 200, {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  });
}

export async function handlePublicClientsRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  try {
    if (request.method === "GET") {
      return await handlePublicClientsList(null, env, request);
    }
    return json(env, request, { error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("[public/clients]", err);
    return json(env, request, { error: "Internal error" }, 500);
  }
}
