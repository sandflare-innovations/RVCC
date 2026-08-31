import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import { requireAdmin, writeAudit } from "./auth";
import { cuid } from "./db";
import { prisma } from "../../lib/prisma";
import type { Currency, ProcurementPriority, ProcurementStatus } from "@prisma/client";

export type ProcurementPriorityType = "low" | "medium" | "high" | "urgent";
export type ProcurementStatusType =
  | "draft"
  | "submitted"
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "revision_requested";

export interface PurchaseRequestItemDTO {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  totalPrice: number;
  preferredVendor?: string | null;
  notes?: string | null;
}

export interface PurchaseRequestAttachmentDTO {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface PurchaseRequestAuditDTO {
  id: string;
  action: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  note?: string | null;
  previousStatus?: string;
  newStatus?: string;
}

export interface PurchaseRequestDetailDTO {
  id: string;
  referenceNumber: string;
  title: string;
  description: string;
  department: string;
  requesterName: string;
  requesterEmail?: string | null;
  priority: string;
  status: string;
  requiredByDate: string;
  currency: string;
  totalEstimatedAmount: number;
  costCenter?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  items: PurchaseRequestItemDTO[];
  attachments: PurchaseRequestAttachmentDTO[];
  auditTrail: PurchaseRequestAuditDTO[];
}

function formatStatusToClient(status: string): string {
  return status.toLowerCase();
}

function formatPriorityToClient(priority: string): string {
  return priority.toLowerCase();
}

/** Generate PR-2026-XXX sequential reference */
async function generateReferenceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.purchaseRequest.count();
  const nextNum = count + 1;
  return `PR-${year}-${String(nextNum).padStart(3, "0")}`;
}

export async function loadPurchaseRequestDetail(
  _sql: unknown,
  idOrRef: string
): Promise<PurchaseRequestDetailDTO | null> {
  const req = await prisma.purchaseRequest.findFirst({
    where: {
      OR: [{ id: idOrRef }, { referenceNumber: { equals: idOrRef, mode: "insensitive" } }],
    },
    include: {
      createdBy: { select: { email: true, name: true } },
      items: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      attachments: { orderBy: { uploadedAt: "asc" } },
    },
  });

  if (!req) return null;

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      entityType: "PurchaseRequest",
      entityId: req.id,
    },
    orderBy: { createdAt: "asc" },
  });

  return {
    id: req.id,
    referenceNumber: req.referenceNumber,
    title: req.title,
    description: req.description || "",
    department: req.department,
    requesterName: req.requesterName,
    requesterEmail: req.requesterEmail || null,
    priority: formatPriorityToClient(req.priority),
    status: formatStatusToClient(req.status),
    requiredByDate: req.requiredByDate ? req.requiredByDate.toISOString().split("T")[0] : "",
    currency: req.currency || "SAR",
    totalEstimatedAmount: Number(req.estimatedAmount) || 0,
    costCenter: req.costCenter || null,
    adminNotes: req.adminNotes || null,
    createdAt: req.createdAt.toISOString(),
    updatedAt: req.updatedAt.toISOString(),
    items: req.items.map((it) => ({
      id: it.id,
      name: it.name,
      category: it.category,
      quantity: Number(it.quantity) || 0,
      unit: it.unit,
      estimatedUnitPrice: Number(it.estimatedUnitPrice) || 0,
      totalPrice: Number(it.totalPrice) || 0,
      preferredVendor: it.preferredVendor || null,
      notes: it.notes || null,
    })),
    attachments: req.attachments.map((att) => ({
      id: att.id,
      name: att.name,
      size: Number(att.sizeBytes) || 0,
      type: att.mimeType || "application/pdf",
      url: att.url,
      uploadedAt: att.uploadedAt.toISOString(),
    })),
    auditTrail: auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      actorName: log.actorName || "Staff",
      actorRole: log.actorRole || "admin",
      timestamp: log.createdAt.toISOString(),
      note: log.note || null,
      previousStatus: log.previousStatus ? formatStatusToClient(log.previousStatus) : undefined,
      newStatus: log.newStatus ? formatStatusToClient(log.newStatus) : undefined,
    })),
  };
}

/**
 * GET /admin/procurement
 * Returns list of purchase requests with items count and total estimated amounts.
 */
export async function handleProcurementList(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request);
  if (auth.deny) return auth.deny;

  const url = new URL(request.url);
  const statusQuery = url.searchParams.get("status");

  const whereClause: { status?: ProcurementStatus } = {};
  if (statusQuery && statusQuery.toUpperCase() !== "ALL") {
    whereClause.status = statusQuery.toUpperCase() as ProcurementStatus;
  }

  const rows = await prisma.purchaseRequest.findMany({
    where: whereClause,
    include: {
      _count: { select: { items: true, attachments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const list = rows.map((r) => ({
    id: r.id,
    referenceNumber: r.referenceNumber,
    title: r.title,
    description: r.description || "",
    department: r.department,
    requesterName: r.requesterName,
    requesterEmail: r.requesterEmail || null,
    priority: formatPriorityToClient(r.priority),
    status: formatStatusToClient(r.status),
    requiredByDate: r.requiredByDate ? r.requiredByDate.toISOString().split("T")[0] : "",
    currency: r.currency || "SAR",
    totalEstimatedAmount: Number(r.estimatedAmount) || 0,
    costCenter: r.costCenter || null,
    itemsCount: r._count.items,
    attachmentsCount: r._count.attachments,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return json(env, request, list);
}

/**
 * GET /admin/procurement/:id
 */
export async function handleProcurementGet(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request);
  if (auth.deny) return auth.deny;

  const detail = await loadPurchaseRequestDetail(sql, id);
  if (!detail) {
    return json(env, request, { error: "Purchase requisition not found" }, 404);
  }

  return json(env, request, detail);
}

/**
 * POST /admin/procurement
 * Creates a new purchase request with line items and optional attachments.
 */
export async function handleProcurementCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request);
  if (auth.deny) return auth.deny;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(env, request, { error: "Invalid JSON body" }, 400);
  }

  if (!body || typeof body !== "object") {
    return json(env, request, { error: "Invalid request body" }, 400);
  }

  const b = body as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const department = typeof b.department === "string" ? b.department.trim() : "";
  const requesterName = typeof b.requesterName === "string" ? b.requesterName.trim() : "";
  const requesterEmail = typeof b.requesterEmail === "string" ? b.requesterEmail.trim() : null;
  const description = typeof b.description === "string" ? b.description.trim() : "";
  const priorityRaw = typeof b.priority === "string" ? b.priority.toLowerCase() : "medium";
  const priority = (
    ["low", "medium", "high", "urgent"].includes(priorityRaw) ? priorityRaw.toUpperCase() : "MEDIUM"
  ) as ProcurementPriority;
  const requiredByDateStr = typeof b.requiredByDate === "string" ? b.requiredByDate : "";
  const currency = (typeof b.currency === "string" ? b.currency.trim() : "SAR") as Currency;
  const costCenter = typeof b.costCenter === "string" ? b.costCenter.trim() : null;
  const itemsRaw = Array.isArray(b.items) ? (b.items as Array<Record<string, unknown>>) : [];
  const attachmentsRaw = Array.isArray(b.attachments)
    ? (b.attachments as Array<Record<string, unknown>>)
    : [];

  if (!title || title.length < 3) {
    return json(env, request, { error: "Title must be at least 3 characters" }, 400);
  }
  if (!department) {
    return json(env, request, { error: "Department is required" }, 400);
  }
  if (!requesterName) {
    return json(env, request, { error: "Requester name is required" }, 400);
  }
  if (!requiredByDateStr || isNaN(Date.parse(requiredByDateStr))) {
    return json(env, request, { error: "Valid required by date is required" }, 400);
  }
  if (itemsRaw.length === 0) {
    return json(env, request, { error: "At least one line item is required" }, 400);
  }

  const reqId = cuid();
  const refNum = await generateReferenceNumber();

  let calculatedTotal = 0;
  const processedItems = itemsRaw.map((it, idx) => {
    const name = typeof it.name === "string" ? it.name.trim() : "";
    const category = typeof it.category === "string" ? it.category.trim() : "General";
    const quantity = Number(it.quantity) || 1;
    const unit = typeof it.unit === "string" ? it.unit.trim() : "pcs";
    const estimatedUnitPrice = Number(it.estimatedUnitPrice) || 0;
    const totalPrice = quantity * estimatedUnitPrice;
    calculatedTotal += totalPrice;

    return {
      name,
      category,
      quantity,
      unit,
      estimatedUnitPrice,
      totalPrice,
      preferredVendor: typeof it.preferredVendor === "string" ? it.preferredVendor.trim() : null,
      notes: typeof it.notes === "string" ? it.notes.trim() : null,
      sortOrder: idx + 1,
    };
  });

  const processedAttachments = attachmentsRaw
    .filter((att) => typeof att.name === "string" && typeof att.url === "string")
    .map((att) => ({
      name: String(att.name).trim(),
      url: String(att.url).trim(),
      sizeBytes: Number(att.sizeBytes) || 0,
      mimeType: typeof att.mimeType === "string" ? att.mimeType : "application/pdf",
    }));

  await prisma.purchaseRequest.create({
    data: {
      id: reqId,
      referenceNumber: refNum,
      title,
      description,
      department,
      requesterName,
      requesterEmail,
      priority,
      status: "PENDING" as ProcurementStatus,
      requiredByDate: new Date(requiredByDateStr),
      currency,
      estimatedAmount: calculatedTotal,
      costCenter,
      createdById: auth.admin.id,
      items: { create: processedItems },
      attachments: { create: processedAttachments },
    },
  });

  await writeAudit(sql, {
    adminId: auth.admin.id,
    action: "Requisition Submitted",
    entityType: "PurchaseRequest",
    entityId: reqId,
    actorName: requesterName,
    actorRole: "requester",
    previousStatus: "DRAFT",
    newStatus: "SUBMITTED",
    note: "Initial purchase request submitted.",
    metadata: { ref: refNum, title, amount: calculatedTotal },
  });

  const detail = await loadPurchaseRequestDetail(sql, reqId);
  return json(env, request, detail, 201);
}

/**
 * POST /admin/procurement/:id/review
 * Updates status, notes, and records an immutable audit log.
 */
export async function handleProcurementReview(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request);
  if (auth.deny) return auth.deny;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(env, request, { error: "Invalid JSON body" }, 400);
  }

  if (!body || typeof body !== "object") {
    return json(env, request, { error: "Invalid request body" }, 400);
  }

  const b = body as Record<string, unknown>;
  const statusRaw = typeof b.status === "string" ? b.status.toLowerCase() : "";
  const validStatuses = [
    "draft",
    "submitted",
    "pending",
    "under_review",
    "approved",
    "rejected",
    "revision_requested",
  ];
  if (!validStatuses.includes(statusRaw)) {
    return json(env, request, { error: `Invalid status: ${statusRaw}` }, 400);
  }

  const status = statusRaw.toUpperCase() as ProcurementStatus;
  const note = typeof b.note === "string" ? b.note.trim() : null;
  const adminNotes = typeof b.adminNotes === "string" ? b.adminNotes.trim() : undefined;

  const existing = await prisma.purchaseRequest.findFirst({
    where: {
      OR: [{ id }, { referenceNumber: { equals: id, mode: "insensitive" } }],
    },
  });

  if (!existing) {
    return json(env, request, { error: "Purchase requisition not found" }, 404);
  }

  const prevStatus = existing.status;

  await prisma.purchaseRequest.update({
    where: { id: existing.id },
    data: {
      status,
      adminNotes: adminNotes !== undefined ? adminNotes : existing.adminNotes,
    },
  });

  let actionLabel = "Status Updated";
  if (status === "APPROVED") actionLabel = "Requisition Approved";
  else if (status === "REJECTED") actionLabel = "Requisition Rejected";
  else if (status === "REVISION_REQUESTED") actionLabel = "Revision Requested";
  else if (status === "UNDER_REVIEW") actionLabel = "Moved to Under Review";

  await writeAudit(sql, {
    adminId: auth.admin.id,
    action: actionLabel,
    entityType: "PurchaseRequest",
    entityId: existing.id,
    actorName: auth.admin.name || "Admin",
    actorRole: auth.admin.role,
    previousStatus: prevStatus,
    newStatus: status,
    note: note || (adminNotes ?? null),
    metadata: {
      ref: existing.referenceNumber,
      title: existing.title,
    },
  });

  const detail = await loadPurchaseRequestDetail(sql, existing.id);
  return json(env, request, detail);
}

/**
 * DELETE /admin/procurement/:id
 */
export async function handleProcurementDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request);
  if (auth.deny) return auth.deny;

  const existing = await prisma.purchaseRequest.findFirst({
    where: {
      OR: [{ id }, { referenceNumber: { equals: id, mode: "insensitive" } }],
    },
  });

  if (!existing) {
    return json(env, request, { error: "Purchase requisition not found" }, 404);
  }

  await prisma.purchaseRequestItem.deleteMany({ where: { purchaseRequestId: existing.id } });
  await prisma.purchaseRequestAttachment.deleteMany({ where: { purchaseRequestId: existing.id } });
  await prisma.purchaseRequest.delete({ where: { id: existing.id } });

  await writeAudit(sql, {
    adminId: auth.admin.id,
    action: "Requisition Deleted",
    entityType: "PurchaseRequest",
    entityId: existing.id,
    actorName: auth.admin.name || "Admin",
    actorRole: auth.admin.role,
    previousStatus: existing.status,
    newStatus: "DELETED",
    note: `Purchase request ${existing.referenceNumber} was deleted.`,
  });

  return json(env, request, { ok: true, id: existing.id });
}
