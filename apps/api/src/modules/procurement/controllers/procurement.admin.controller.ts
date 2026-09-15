import type { Env } from "../../../config/env";
import { json } from "../../../lib/http";
import { requireAdmin, writeAudit } from "../../auth";
import {
  createPurchaseRequestSchema,
  reviewPurchaseRequestSchema,
} from "../schemas/procurement.schema";
import { ProcurementService } from "../services/procurement.service";

async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Fill session identity and portal field aliases before Zod parse. */
function normalizeCreateBody(
  raw: unknown,
  admin: { name: string; email: string }
): Record<string, unknown> {
  const body =
    raw && typeof raw === "object" ? { ...(raw as Record<string, unknown>) } : {};

  // Portal form never sent requesterName; Zod then returned the generic "Required".
  const name = typeof body.requesterName === "string" ? body.requesterName.trim() : "";
  if (!name) body.requesterName = admin.name;

  if (body.requesterEmail == null || body.requesterEmail === "") {
    body.requesterEmail = admin.email || null;
  }

  // Modal sends totalEstimatedAmount; schema expects estimatedAmount.
  if (body.estimatedAmount == null && body.totalEstimatedAmount != null) {
    body.estimatedAmount = body.totalEstimatedAmount;
  }

  if (Array.isArray(body.items)) {
    body.items = body.items.map((item) => {
      if (!item || typeof item !== "object") return item;
      const next = { ...(item as Record<string, unknown>) };
      delete next.id;
      return next;
    });
  }

  // File picker stores url "#"; those are not real uploads yet.
  if (Array.isArray(body.attachments)) {
    body.attachments = body.attachments
      .filter((att) => {
        if (!att || typeof att !== "object") return false;
        const url = String((att as { url?: unknown }).url ?? "");
        return url.length > 0 && url !== "#";
      })
      .map((att) => {
        const a = att as Record<string, unknown>;
        return {
          name: a.name,
          url: a.url,
          sizeBytes: a.sizeBytes ?? a.size,
          mimeType: a.mimeType ?? a.type,
        };
      });
  }

  return body;
}

function formatZodIssues(error: { issues: { path: (string | number)[]; message: string }[] }) {
  const issues = error.issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    message: issue.message,
  }));
  return {
    error: issues
      .map((issue) => (issue.path === "(root)" ? issue.message : `${issue.path}: ${issue.message}`))
      .join("; "),
    issues,
  };
}

export async function loadPurchaseRequestDetail(_sql: unknown, idOrRef: string) {
  return await ProcurementService.loadPurchaseRequestDetail(idOrRef);
}

export async function handleProcurementList(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (auth.deny) return auth.deny;

  const url = new URL(request.url);
  const statusQuery = url.searchParams.get("status");

  const list = await ProcurementService.listPurchaseRequests(statusQuery);
  return json(env, request, list);
}

export async function handleProcurementGet(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (auth.deny) return auth.deny;

  const detail = await ProcurementService.loadPurchaseRequestDetail(id);
  if (!detail) {
    return json(env, request, { error: "Purchase requisition not found" }, 404);
  }

  return json(env, request, detail);
}

export async function handleProcurementCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (auth.deny) return auth.deny;

  const rawBody = normalizeCreateBody(await readJson(request), auth.admin);
  const parsed = createPurchaseRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return json(env, request, formatZodIssues(parsed.error), 400);
  }

  const { reqId, refNum, calculatedTotal } = await ProcurementService.createPurchaseRequest(
    auth.admin.id,
    parsed.data
  );

  await writeAudit(sql, {
    adminId: auth.admin.id,
    action: "Requisition Submitted",
    entityType: "PurchaseRequest",
    entityId: reqId,
    actorName: parsed.data.requesterName,
    actorRole: "requester",
    previousStatus: "DRAFT",
    newStatus: "SUBMITTED",
    note: "Initial purchase request submitted.",
    metadata: { ref: refNum, title: parsed.data.title, amount: calculatedTotal },
  });

  const detail = await ProcurementService.loadPurchaseRequestDetail(reqId);
  return json(env, request, detail, 201);
}

export async function handleProcurementReview(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (auth.deny) return auth.deny;

  const rawBody = await readJson(request);
  const parsed = reviewPurchaseRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message || "Invalid request body";
    return json(env, request, { error: issue }, 400);
  }

  const result = await ProcurementService.reviewPurchaseRequest(id, parsed.data);
  if (!result) {
    return json(env, request, { error: "Purchase requisition not found" }, 404);
  }

  await writeAudit(sql, {
    adminId: auth.admin.id,
    action: result.actionLabel,
    entityType: "PurchaseRequest",
    entityId: result.existing.id,
    actorName: auth.admin.name || "Admin",
    actorRole: auth.admin.role,
    previousStatus: result.prevStatus,
    newStatus: result.status,
    note: parsed.data.note || (parsed.data.adminNotes ?? null),
    metadata: {
      ref: result.existing.referenceNumber,
      title: result.existing.title,
    },
  });

  const detail = await ProcurementService.loadPurchaseRequestDetail(result.existing.id);
  return json(env, request, detail);
}

export async function handleProcurementDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (auth.deny) return auth.deny;

  const deleted = await ProcurementService.deletePurchaseRequest(id);
  if (!deleted) {
    return json(env, request, { error: "Purchase requisition not found" }, 404);
  }

  await writeAudit(sql, {
    adminId: auth.admin.id,
    action: "Requisition Deleted",
    entityType: "PurchaseRequest",
    entityId: deleted.id,
    actorName: auth.admin.name || "Admin",
    actorRole: auth.admin.role,
    previousStatus: deleted.status,
    newStatus: "DELETED",
    note: `Purchase request ${deleted.referenceNumber} was deleted.`,
  });

  return json(env, request, { ok: true, id: deleted.id });
}
