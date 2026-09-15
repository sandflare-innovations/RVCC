import type { Env } from "../../../config/env";
import { json, readJson } from "../../../lib/http";
import { requireAdmin, writeAudit } from "../../auth";
import { serializeRequirement } from "../lib/serialize";
import { QuotationsService } from "../services/quotations.service";
import { SourcingService } from "../services/sourcing.service";

export async function handleRequirementsList(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (deny) return deny;

  const requirements = await SourcingService.listRequirements(admin.role);
  return json(env, request, requirements);
}

export async function handleRequirementGet(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (deny) return deny;

  const requirement = await SourcingService.getRequirementById(id);
  if (!requirement) return json(env, request, { error: "Requirement not found." }, 404);

  return json(env, request, {
    requirement: {
      ...serializeRequirement(requirement, admin.role, {
        awardedByEmail: requirement.awardedByAdmin?.email ?? null,
        createdByName: requirement.createdByAdmin?.name || requirement.createdByAdmin?.email || "",
        submittedByName: requirement.submittedByAdmin?.name || requirement.submittedByAdmin?.email || "",
      }),
      attachments: requirement.attachments.map((a) => ({
        id: a.id,
        name: a.name,
        url: a.url,
        sizeBytes: a.sizeBytes,
        mimeType: a.mimeType,
        uploadedAt: a.uploadedAt.toISOString(),
      })),
    },
    quotes: requirement.quotes.map((q) => ({
      id: q.id,
      newPrice: q.newPrice ? String(q.newPrice) : null,
      unitPrice: q.unitPrice ? String(q.unitPrice) : null,
      quantity: q.quantity != null ? Number(q.quantity) : null,
      vatRate: Number(q.vatRate ?? 0),
      vatAmount: q.vatAmount ? String(q.vatAmount) : null,
      totalPrice: q.totalPrice ? String(q.totalPrice) : null,
      deliveryPeriodDays: q.deliveryPeriodDays,
      paymentTerms: q.paymentTerms,
      warranty: q.warranty,
      notes: q.notes,
      remarks: q.remarks,
      status: q.status,
      evaluationStatus: q.evaluationStatus,
      evaluationNote: q.evaluationNote,
      technicalScore: q.technicalScore != null ? Number(q.technicalScore) : null,
      commercialScore: q.commercialScore != null ? Number(q.commercialScore) : null,
      submittedAt: q.submittedAt ? q.submittedAt.toISOString() : null,
      updatedAt: q.updatedAt.toISOString(),
      participantEmail: q.vendorUser.email,
      participantName: q.vendorUser.name,
      attachments: q.attachments.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        fileSize: a.fileSize,
        kind: a.kind,
        uploadedAt: a.uploadedAt.toISOString(),
      })),
      revisions: q.revisions.map((r) => ({
        id: r.id,
        price: r.price ? String(r.price) : null,
        amountSar: r.amountSar ? String(r.amountSar) : null,
        currency: r.currency,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      vendorUser: {
        email: q.vendorUser.email,
        name: q.vendorUser.name,
      },
    })),
    invites: requirement.invites.map((i) => ({
      id: i.id,
      email: i.vendorUser.email,
      name: i.vendorUser.name,
      inviteStatus: i.inviteStatus,
      emailStatus: i.emailStatus,
      inviteToken: i.inviteToken,
      viewedAt: i.viewedAt?.toISOString() ?? null,
      vendorUser: {
        id: i.vendorUser.id,
        email: i.vendorUser.email,
        name: i.vendorUser.name,
      },
    })),
    manualQuotations: requirement.manualQuotations.map((q) => QuotationsService.serialize(q as any)),
    quotationStats: QuotationsService.stats(requirement.manualQuotations),
  });
}

export async function handleRequirementAward(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = (await readJson(request)) as { quoteId?: string } | null;
  const quoteId = typeof body?.quoteId === "string" ? body.quoteId.trim() : "";
  if (!quoteId) return json(env, request, { error: "Choose a quote to award." }, 400);

  try {
    const result = await SourcingService.awardQuote(admin, id, quoteId, env);
    if ("notFound" in result && result.notFound) return json(env, request, { error: "Requirement not found." }, 404);
    if ("cancelled" in result && result.cancelled) return json(env, request, { error: "This requirement was cancelled." }, 409);
    if (!("described" in result) || !result.described) return json(env, request, { error: "Award failed." }, 400);

    await writeAudit(sql, {
      adminId: admin.id,
      action: "requirement.awarded",
      entityType: "Requirement",
      entityId: id,
      metadata: {
        quoteId,
        winner: result.winnerEmail,
        winningPrice: result.described.winningPrice,
        losingPrices: result.described.losingPrices,
      },
    });

    return json(env, request, { ok: true, winner: result.winnerEmail });
  } catch (err: any) {
    return json(env, request, { error: err.message }, 400);
  }
}

export async function handleRequirementCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (deny) return deny;

  let rawJson: any = {};
  try {
    rawJson = await readJson(request);
  } catch {
    return json(env, request, { error: "Invalid JSON" }, 400);
  }

  const url = new URL(request.url);
  const post = url.searchParams.get("post") === "true" || rawJson.post === true;

  try {
    const { id, referenceNumber, input } = await SourcingService.createRequirement(
      admin.id,
      rawJson,
      post,
      env,
      admin.role
    );

    await writeAudit(sql, {
      adminId: admin.id,
      action: post ? "requirement.posted" : "requirement.created",
      entityType: "Requirement",
      entityId: id,
      metadata: {
        project: input.project,
        closesAt: input.closesAt ? input.closesAt.toISOString() : null,
        invited: input.vendorUserIds.length,
      },
    });

    return json(env, request, { ok: true, requirement: { id, referenceNumber } }, 201);
  } catch (err: any) {
    return json(env, request, { error: err.message }, 400);
  }
}

export async function handleRequirementUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (deny) return deny;

  let rawJson: any = {};
  try {
    rawJson = await readJson(request);
  } catch {
    return json(env, request, { error: "Invalid JSON" }, 400);
  }

  const url = new URL(request.url);
  const post = url.searchParams.get("post") === "true" || rawJson.post === true;

  try {
    const updated = await SourcingService.updateRequirement(id, rawJson, post, admin.role);
    if (!updated) return json(env, request, { error: "Requirement not found" }, 404);

    await writeAudit(sql, {
      adminId: admin.id,
      action: "requirement.update",
      entityType: "Requirement",
      entityId: id,
      metadata: { project: updated.input.project, closesAt: updated.input.closesAt, status: updated.nextStatus },
    });

    return json(env, request, { ok: true, message: "Requirement updated successfully." });
  } catch (err: any) {
    return json(env, request, { error: err.message }, 400);
  }
}

export async function handleRequirementDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const deleted = await SourcingService.deleteRequirement(id);
  if (!deleted) return json(env, request, { error: "Requirement not found" }, 404);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "requirement.delete",
    entityType: "Requirement",
    entityId: id,
    metadata: { referenceNumber: deleted.referenceNumber, project: deleted.project },
  });

  return json(env, request, { ok: true, message: "Requirement deleted successfully." });
}

export async function handleRequirementExportCsv(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const result = await SourcingService.exportRequirementCsv(id);
  if (!result) {
    return new Response(JSON.stringify({ error: "Requirement not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(result.csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
    },
  });
}
