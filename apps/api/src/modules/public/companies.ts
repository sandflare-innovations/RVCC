import type { Env } from "../../config/env";
import { corsHeaders, json } from "../../lib/http";
import { prisma } from "../../lib/prisma";

export async function handlePublicSisterCompaniesList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const rows = await (prisma as any).sisterCompany.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  const companies = rows.map((c: any) => ({
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

  return json(env, request, { companies }, 200, {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  });
}

export async function handlePublicSisterCompaniesRequest(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  try {
    return await handlePublicSisterCompaniesList(null, env, request);
  } catch (err) {
    console.error("[public_sister_companies] error:", err);
    return json(env, request, { error: "Failed to load sister companies" }, 500);
  }
}
