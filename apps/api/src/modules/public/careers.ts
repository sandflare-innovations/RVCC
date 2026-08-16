import type { Env } from "../../config/env";
import { corsHeaders, json } from "../../lib/http";
import { createSql, type Sql } from "../../lib/sql";

/** Public published careers — no auth. */
export async function handlePublicCareersList(
  sql: Sql,
  env: Env,
  request: Request
): Promise<Response> {
  const rows = await sql`
    SELECT
      id, slug, title, department, location, "employmentType",
      "postedAt", description, requirements, benefits, "isRemote"
    FROM "JobPosting"
    WHERE "isPublished" = true
    ORDER BY "sortOrder" ASC, "postedAt" DESC
  `;

  const jobs = rows.map((r) => ({
    id: String(r.id),
    slug: String(r.slug),
    title: String(r.title),
    department: String(r.department),
    location: String(r.location),
    type: String(r.employmentType),
    postedAt: r.postedAt
      ? new Date(String(r.postedAt)).toISOString().slice(0, 10)
      : "",
    description: String(r.description ?? ""),
    requirements: Array.isArray(r.requirements) ? (r.requirements as string[]) : [],
    benefits: Array.isArray(r.benefits) ? (r.benefits as string[]) : [],
    isRemote: Boolean(r.isRemote),
  }));

  return json(env, request, { jobs });
}

export async function handlePublicCareersRequest(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  let sql;
  try {
    sql = createSql(env);
  } catch (err) {
    console.error(err);
    return json(env, request, { error: "Service unavailable" }, 503);
  }

  try {
    if (request.method === "GET") {
      return await handlePublicCareersList(sql, env, request);
    }
    return json(env, request, { error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("[careers]", err);
    return json(env, request, { error: "Internal error" }, 500);
  } finally {
    try {
      await sql.end({ timeout: 2 });
    } catch {
      /* ignore */
    }
  }
}
