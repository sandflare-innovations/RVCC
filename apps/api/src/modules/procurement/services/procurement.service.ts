import { Prisma, type Currency, type ProcurementPriority, type ProcurementStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { cuid } from "../../../lib/sql";
import type {
  CreatePurchaseRequestInput,
  ReviewPurchaseRequestInput,
} from "../schemas/procurement.schema";
import type { PurchaseRequestDetailDTO } from "../types/procurement.types";
import { nextReferenceNumber } from "./reference-number";

function isReferenceNumberConflict(err: unknown): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") {
    return false;
  }
  const target = err.meta?.target;
  return Array.isArray(target) && target.includes("referenceNumber");
}

export function formatStatusToClient(status: string): string {
  return status.toLowerCase();
}

export function formatPriorityToClient(priority: string): string {
  return priority.toLowerCase();
}

export class ProcurementService {
  /**
   * Generate PR-YYYY-XXX sequential reference number.
   * Reads all rows (including soft-deleted) so retired numbers stay reserved.
   */
  static async generateReferenceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const rows = await prisma.$queryRaw<Array<{ referenceNumber: string }>>`
      SELECT "referenceNumber" FROM "PurchaseRequest"
      WHERE "referenceNumber" LIKE ${`PR-${year}-%`}
    `;
    const refs = rows.map((row) => row.referenceNumber);
    const refNum = nextReferenceNumber(year, refs);
    return refNum;
  }

  /**
   * Load purchase request detail with items, attachments, and audit trail
   */
  static async loadPurchaseRequestDetail(
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
   * List purchase requests with counts
   */
  static async listPurchaseRequests(statusQuery?: string | null) {
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

    return rows.map((r) => ({
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
  }

  /**
   * Create purchase request with items and attachments
   */
  static async createPurchaseRequest(adminId: string, input: CreatePurchaseRequestInput) {
    const reqId = cuid();
    const refNum = await this.generateReferenceNumber();

    let calculatedTotal = 0;
    const processedItems = input.items.map((it, idx) => {
      const quantity = it.quantity || 1;
      const estimatedUnitPrice = it.estimatedUnitPrice || 0;
      const totalPrice = quantity * estimatedUnitPrice;
      calculatedTotal += totalPrice;

      return {
        name: it.name.trim(),
        category: it.category || "General",
        quantity,
        unit: it.unit || "pcs",
        estimatedUnitPrice,
        totalPrice,
        preferredVendor: it.preferredVendor?.trim() || null,
        notes: it.notes?.trim() || null,
        sortOrder: idx + 1,
      };
    });

    const processedAttachments = (input.attachments || []).map((att) => ({
      name: att.name.trim(),
      url: att.url.trim(),
      sizeBytes: att.sizeBytes || 0,
      mimeType: att.mimeType || "application/pdf",
    }));

    const priority = input.priority.toUpperCase() as ProcurementPriority;
    const currency = (input.currency || "SAR") as Currency;

    const maxAttempts = 8;
    let createdRef = refNum;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      createdRef = attempt === 1 ? refNum : await this.generateReferenceNumber();
      try {
        await prisma.purchaseRequest.create({
          data: {
            id: reqId,
            referenceNumber: createdRef,
            title: input.title.trim(),
            description: input.description?.trim() || "",
            department: input.department.trim(),
            requesterName: input.requesterName.trim(),
            requesterEmail: input.requesterEmail?.trim() || null,
            priority,
            status: "PENDING" as ProcurementStatus,
            requiredByDate: new Date(input.requiredByDate),
            currency,
            estimatedAmount: calculatedTotal,
            costCenter: input.costCenter?.trim() || null,
            createdById: adminId,
            items: { create: processedItems },
            attachments: { create: processedAttachments },
          },
        });
        return { reqId, refNum: createdRef, calculatedTotal };
      } catch (err) {
        if (!isReferenceNumberConflict(err) || attempt === maxAttempts) {
          throw err;
        }
      }
    }

    return { reqId, refNum: createdRef, calculatedTotal };
  }

  /**
   * Review purchase request (update status, notes)
   */
  static async reviewPurchaseRequest(id: string, input: ReviewPurchaseRequestInput) {
    const existing = await prisma.purchaseRequest.findFirst({
      where: {
        OR: [{ id }, { referenceNumber: { equals: id, mode: "insensitive" } }],
      },
    });
    if (!existing) return null;

    const status = input.status.toUpperCase() as ProcurementStatus;
    const prevStatus = existing.status;

    await prisma.purchaseRequest.update({
      where: { id: existing.id },
      data: {
        status,
        adminNotes: input.adminNotes !== undefined ? input.adminNotes.trim() : existing.adminNotes,
      },
    });

    let actionLabel = "Status Updated";
    if (status === "APPROVED") actionLabel = "Requisition Approved";
    else if (status === "REJECTED") actionLabel = "Requisition Rejected";
    else if (status === "REVISION_REQUESTED") actionLabel = "Revision Requested";
    else if (status === "UNDER_REVIEW") actionLabel = "Moved to Under Review";

    return {
      existing,
      status,
      prevStatus,
      actionLabel,
    };
  }

  /**
   * Delete purchase request
   */
  static async deletePurchaseRequest(id: string) {
    const existing = await prisma.purchaseRequest.findFirst({
      where: {
        OR: [{ id }, { referenceNumber: { equals: id, mode: "insensitive" } }],
      },
    });
    if (!existing) return null;

    await prisma.purchaseRequestItem.deleteMany({ where: { purchaseRequestId: existing.id } });
    await prisma.purchaseRequestAttachment.deleteMany({
      where: { purchaseRequestId: existing.id },
    });
    await prisma.purchaseRequest.delete({ where: { id: existing.id } });

    return existing;
  }
}
