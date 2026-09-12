import { aboutContentInputSchema } from "@rvcc/schemas";
import type { Env } from "../../../config/env";
import { corsHeaders, json } from "../../../lib/http";
import { requireAdmin, writeAudit } from "../../auth";
import { AboutService } from "./about.service";

async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function handlePublicAboutRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return json(env, request, { error: "Method not allowed" }, 405);
  }

  try {
    const about = await AboutService.getAboutContent();
    return json(
      env,
      request,
      { ok: true, about },
      200,
      { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=86400" }
    );
  } catch (err) {
    console.error("[public/about]", err);
    return json(env, request, { error: "Internal server error" }, 500);
  }
}

export async function handleAdminAboutGet(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  try {
    const about = await AboutService.getAboutContent();
    return json(env, request, { ok: true, about });
  } catch (err) {
    console.error("[admin/about GET]", err);
    return json(env, request, { error: "Internal server error" }, 500);
  }
}

export async function handleAdminAboutUpdate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const raw = await readJson(request);
  const parsed = aboutContentInputSchema.safeParse(raw);
  if (!parsed.success) {
    return json(env, request, { error: parsed.error.issues[0]?.message || "Invalid payload" }, 400);
  }

  try {
    const about = await AboutService.updateAboutContent(parsed.data);

    await writeAudit(sql, {
      adminId: admin.id,
      action: "about_content.updated",
      entityType: "AboutContent",
      entityId: "default",
      metadata: { updatedAt: about.updatedAt },
    });

    return json(env, request, { ok: true, about });
  } catch (err) {
    console.error("[admin/about PUT]", err);
    return json(env, request, { error: "Internal server error" }, 500);
  }
}

export async function handleAdminAboutMediaUpload(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(env, request, { error: "Expected multipart form data" }, 400);
  }

  const file = form.get("file");
  const type = String(form.get("type") ?? "image").trim(); // "video" | "image"

  if (!(file instanceof File)) {
    return json(env, request, { error: "File is required." }, 400);
  }

  try {
    const bytes = await file.arrayBuffer();
    const { putPublicAsset, publicUploadUrl } = await import("../../../lib/storage");

    let key: string;
    let contentType = file.type || "application/octet-stream";

    if (type === "video") {
      const ext = file.name.endsWith(".webm") ? "webm" : "mp4";
      contentType = ext === "webm" ? "video/webm" : "video/mp4";
      key = `content/about/about-${Date.now()}.${ext}`;
    } else {
      const ext = file.name.endsWith(".png") ? "png" : file.name.endsWith(".jpeg") || file.name.endsWith(".jpg") ? "jpg" : "webp";
      contentType = file.type || `image/${ext}`;
      key = `content/about/overview-${Date.now()}.${ext}`;
    }

    await putPublicAsset(env, key, bytes, contentType);
    const fileUrl = publicUploadUrl(env, key);

    return json(env, request, { ok: true, fileUrl, key });
  } catch (err) {
    console.error("[about/upload]", err);
    return json(env, request, { error: "Failed to upload asset." }, 500);
  }
}
