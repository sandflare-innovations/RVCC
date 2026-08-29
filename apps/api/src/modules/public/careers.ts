import type { Env } from "../../config/env";
import { corsHeaders, json } from "../../lib/http";
import { handleCareerApply } from "./career-apply";
import { prisma } from "../../lib/prisma";

/** Public published careers — no auth. */
export async function handlePublicCareersList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const rows = await prisma.jobPosting.findMany({
    where: { isPublished: true },
    orderBy: [
      { sortOrder: "asc" },
      { postedAt: "desc" },
    ],
  });

  const jobs = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    department: r.department,
    location: r.location,
    type: r.employmentType,
    postedAt: r.postedAt ? r.postedAt.toISOString().slice(0, 10) : "",
    description: r.description ?? "",
    requirements: Array.isArray(r.requirements) ? r.requirements : [],
    benefits: Array.isArray(r.benefits) ? r.benefits : [],
    isRemote: Boolean(r.isRemote),
  }));

  return json(env, request, { jobs }, 200, {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  });
}

export async function handlePublicCareersRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  try {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "POST" && path.endsWith("/apply")) {
      return await handleCareerApply(null, env, request);
    }
    if (request.method === "GET") {
      return await handlePublicCareersList(null, env, request);
    }
    return json(env, request, { error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("[careers]", err);
    return json(env, request, { error: "Internal error" }, 500);
  }
}
