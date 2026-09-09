import type { Env } from "../../../config/env";
import { json, readJson } from "../../../lib/http";
import { requireAdmin, writeAudit } from "../../auth";
import { RegistrationsService } from "./registrations.service";

export async function handleRegistrationsList(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const url = new URL(request.url);
  const statusRaw = (url.searchParams.get("status") || "SUBMITTED").trim();
  const q = url.searchParams.get("q") || "";

  try {
    const list = await RegistrationsService.listRegistrations(statusRaw, q);
    return json(env, request, list);
  } catch (err) {
    console.error("[admin registrations] list failed", err);
    return json(env, request, { error: "Database unavailable." }, 503);
  }
}

export async function handleRegistrationGet(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const registration = await RegistrationsService.loadRegistration(id);
  if (!registration) return json(env, request, { error: "Registration not found." }, 404);
  return json(env, request, registration);
}

export async function handleRegistrationReview(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = (await readJson(request)) as {
    decision?: unknown;
    reviewNote?: unknown;
  } | null;

  const decision = typeof body?.decision === "string" ? body.decision.toUpperCase().trim() : "";
  const reviewNote = typeof body?.reviewNote === "string" ? body.reviewNote.trim() : "";

  if (decision !== "APPROVED" && decision !== "REJECTED") {
    return json(env, request, { error: "Decision must be APPROVED or REJECTED." }, 400);
  }

  const result = await RegistrationsService.reviewRegistration(admin, id, decision, reviewNote, env);
  if (result.notFound) return json(env, request, { error: "Registration not found." }, 404);
  if (result.notReviewable) {
    return json(
      env,
      request,
      { error: `Registration is not pending review (status: ${result.currentStatus}).` },
      409
    );
  }

  await writeAudit(sql, {
    adminId: admin.id,
    action: decision === "APPROVED" ? "registration.approved" : "registration.rejected",
    entityType: "SupplierRegistration",
    entityId: id,
    metadata: {
      decision,
      reviewNote: reviewNote || null,
      vendorEmail: result.vendorEmail,
      vendorUserId: result.vendorUserId,
    },
  });

  return json(env, request, {
    ok: true,
    status: decision,
    vendorCreated: decision === "APPROVED",
    vendorEmail: decision === "APPROVED" ? result.vendorEmail : undefined,
  });
}

export async function handleRegistrationDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const deleted = await RegistrationsService.deleteRegistration(id);
  if (!deleted) return json(env, request, { error: "Registration not found." }, 404);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "registration.deleted",
    entityType: "SupplierRegistration",
    entityId: id,
    metadata: {
      email: deleted.email,
      status: deleted.status,
      referenceNumber: deleted.referenceNumber,
    },
  });

  return json(env, request, { ok: true, deletedId: id });
}

export async function handleRegistrationsExportCsv(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const result = await RegistrationsService.exportRegistrationsCsv();
  return new Response(result.csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
