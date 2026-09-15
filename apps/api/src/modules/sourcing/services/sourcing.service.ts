import type { RequirementStatus } from "@prisma/client";
import type { AdminRoleName } from "@rvcc/schemas";
import { canConfigureBidding } from "@rvcc/schemas";
import type { Env } from "../../../config/env";
import { prisma } from "../../../lib/prisma";
import { cuid } from "../../../lib/sql";
import { sendRequirementMail } from "../../system/services/notification.service";
import type { AwardableQuote } from "../types/sourcing.types";
import { normaliseRequirementInput } from "../lib/requirement-input";
import { serializeRequirement } from "../lib/serialize";
import {
  assertTransition,
  isEditableByProcurement,
  toPrismaStatus,
  type PipelineStatus,
} from "../lib/status-machine";

export function describeAward(quotes: AwardableQuote[], quoteId: string) {
  const winner = quotes.find((q) => q.id === quoteId);
  if (!winner) {
    throw new Error("That is not a submitted quote on this requirement.");
  }

  return {
    winner,
    winningPrice: winner.newPrice,
    losingPrices: quotes.filter((q) => q.id !== quoteId).map((q) => q.newPrice),
  };
}

export function makeReferenceNumber(now: Date, sequence: number): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `REQ-${y}${m}${d}-${String(sequence).padStart(4, "0")}`;
}

export function sanitizeCsvCell(cell: string | number | null | undefined): string {
  if (cell === null || cell === undefined) return '""';
  let str = String(cell);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export function toCsvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(sanitizeCsvCell).join(",");
}

const DETAIL_INCLUDE = {
  awardedByAdmin: { select: { email: true, name: true } },
  submittedByAdmin: { select: { email: true, name: true } },
  createdByAdmin: { select: { email: true, name: true } },
  attachments: { where: { deletedAt: null }, orderBy: { uploadedAt: "asc" as const } },
  quotes: {
    where: { deletedAt: null },
    include: {
      vendorUser: { select: { email: true, name: true } },
      revisions: { orderBy: { createdAt: "desc" as const } },
      attachments: { orderBy: { uploadedAt: "asc" as const } },
    },
    orderBy: [{ submittedAt: { sort: "desc" as const, nulls: "last" as const } }, { updatedAt: "desc" as const }],
  },
  invites: {
    include: {
      vendorUser: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
  manualQuotations: {
    where: { deletedAt: null },
    include: {
      attachments: { orderBy: { uploadedAt: "asc" as const } },
      vendorUser: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
};

export class SourcingService {
  static async listRequirements(role: AdminRoleName | "VENDOR" | null = "ADMIN") {
    const requirements = await prisma.requirement.findMany({
      where: { deletedAt: null },
      include: {
        _count: { select: { invites: true, quotes: true, manualQuotations: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return requirements.map((r) =>
      serializeRequirement(r, role, {
        invited: r._count.invites,
        submitted: r._count.quotes,
        invitedCount: r._count.invites,
        quotesCount: r._count.quotes,
        manualQuotationsCount: r._count.manualQuotations,
      })
    );
  }

  static async getRequirementById(id: string) {
    return prisma.requirement.findFirst({
      where: { id, deletedAt: null },
      include: DETAIL_INCLUDE,
    });
  }

  static async transitionStatus(id: string, to: PipelineStatus) {
    const requirement = await prisma.requirement.findFirst({
      where: { id, deletedAt: null },
    });
    if (!requirement) return null;
    assertTransition(requirement.status, to);
    return prisma.requirement.update({
      where: { id },
      data: { status: toPrismaStatus(to) },
    });
  }

  static async startQuotationCollection(id: string) {
    const requirement = await prisma.requirement.findFirst({
      where: { id, deletedAt: null },
    });
    if (!requirement) return null;
    if (!isEditableByProcurement(requirement.status) && requirement.status !== "DRAFT") {
      assertTransition(requirement.status, "QUOTATION_COLLECTION");
    }
    assertTransition(requirement.status, "QUOTATION_COLLECTION");
    return prisma.requirement.update({
      where: { id },
      data: { status: "QUOTATION_COLLECTION" },
    });
  }

  static async submitToAdmin(id: string, adminId: string) {
    const requirement = await prisma.requirement.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { manualQuotations: { where: { deletedAt: null } } } } },
    });
    if (!requirement) return null;
    if (requirement._count.manualQuotations < 1) {
      throw new Error("Add at least one supplier quotation before submitting to Admin.");
    }
    assertTransition(requirement.status, "SUBMITTED_TO_ADMIN");
    return prisma.requirement.update({
      where: { id },
      data: {
        status: "SUBMITTED_TO_ADMIN",
        submittedToAdminAt: new Date(),
        submittedByAdminId: adminId,
      },
    });
  }

  static async awardQuote(
    admin: { id: string; name?: string; role?: string },
    id: string,
    quoteId: string,
    env: Env
  ) {
    const requirement = await prisma.requirement.findUnique({
      where: { id },
      include: {
        quotes: {
          where: { status: "SUBMITTED", deletedAt: null },
          include: { vendorUser: { select: { id: true, email: true } } },
        },
      },
    });

    if (!requirement) return { notFound: true };
    if (requirement.status === "CANCELLED") return { cancelled: true };

    const described = describeAward(
      requirement.quotes.map((q) => ({
        id: q.id,
        newPrice: q.newPrice ? String(q.newPrice) : "",
        vendorEmail: q.vendorUser.email,
      })),
      quoteId
    );

    const winnerRow = requirement.quotes.find((q) => q.id === quoteId)!;
    const winningValue = winnerRow.totalPrice ?? winnerRow.newPrice;

    await prisma.$transaction(async (tx) => {
      await tx.requirement.update({
        where: { id },
        data: {
          awardedQuoteId: quoteId,
          awardedAt: new Date(),
          awardedByAdminId: admin.id,
          awardedValue: winningValue,
          status: "AWARDED",
        },
      });

      await tx.quote.update({
        where: { id: quoteId },
        data: { evaluationStatus: "AWARDED", status: "ACCEPTED" },
      });

      await tx.quote.updateMany({
        where: { requirementId: id, id: { not: quoteId }, deletedAt: null },
        data: { evaluationStatus: "NOT_SELECTED" },
      });
    });

    await prisma.notification.create({
      data: {
        id: cuid(),
        vendorUserId: winnerRow.vendorUser.id,
        type: "QUOTE_AWARDED",
        title: "You won " + requirement.project,
        body: "RVCC awarded this work to your quote.",
        linkPath: "/requirements/" + id,
      },
    });

    const admins = await prisma.adminUser.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          id: cuid(),
          adminId: a.id,
          type: "QUOTE_AWARDED",
          title: requirement.project + " awarded",
          body:
            "Awarded to " +
            described.winner.vendorEmail +
            " at " +
            described.winningPrice +
            " " +
            requirement.currency,
          linkPath: "/requirements/" + id,
        })),
      });
    }

    await sendRequirementMail(env, {
      kind: "AWARDED",
      recipients: [described.winner.vendorEmail],
      project: requirement.project,
      referenceNumber: requirement.referenceNumber ?? "",
      portalUrl: `${(env.VENDOR_PORTAL_URL || "").replace(/\/$/, "")}/requirements/${id}`,
    });

    return {
      ok: true,
      described,
      winnerEmail: described.winner.vendorEmail,
    };
  }

  static async createRequirement(
    adminId: string,
    rawJson: unknown,
    post: boolean,
    env: Env,
    role: AdminRoleName
  ) {
    const input = normaliseRequirementInput(rawJson);
    const id = cuid();
    const count = await prisma.requirement.count();
    const referenceNumber = makeReferenceNumber(new Date(), count + 1);

    // Fast-path OPEN is Admin-only and still requires a closing time.
    const openNow = post && canConfigureBidding(role);
    if (openNow && !input.closesAt) {
      throw new Error("Set a bidding closing time before posting the requirement.");
    }
    if (openNow && input.closesAt && input.closesAt.getTime() <= Date.now()) {
      throw new Error("The closing time must be in the future.");
    }

    const status: RequirementStatus = openNow ? "OPEN" : "DRAFT";

    await prisma.requirement.create({
      data: {
        id,
        referenceNumber,
        title: input.title,
        project: input.project,
        productServiceName: input.productServiceName,
        category: input.category,
        description: input.description,
        scopeOfWork: input.scopeOfWork,
        specifications: input.specifications,
        quantity: input.quantity,
        unit: input.unit,
        requiredDeliveryDate: input.requiredDeliveryDate,
        deliveryLocation: input.deliveryLocation,
        requestingDepartment: input.requestingDepartment,
        priority: input.priority,
        internalNotes: input.internalNotes,
        estimatedBudget: input.estimatedBudget,
        currency: input.currency,
        sellingPrice: input.sellingPrice,
        status,
        closesAt: input.closesAt,
        rankingStrategy: openNow ? "LOWEST_PRICE" : "CLOSEST_TO_TARGET",
        createdByAdminId: adminId,
        invites: {
          create: input.vendorUserIds.map((vId) => ({
            id: cuid(),
            vendorUserId: vId,
            inviteStatus: "INVITED",
          })),
        },
      },
    });

    if (openNow && input.vendorUserIds.length > 0) {
      await this.sendInviteEmails(env, id, input.project, input.scopeOfWork, referenceNumber, input.closesAt);
    }

    return { id, referenceNumber, input, status };
  }

  static async updateRequirement(id: string, rawJson: unknown, post: boolean, role: AdminRoleName) {
    const existing = await prisma.requirement.findUnique({
      where: { id },
      include: { invites: true },
    });
    if (!existing) return null;

    if (!canConfigureBidding(role) && !isEditableByProcurement(existing.status)) {
      throw new Error("This requirement can no longer be edited by Procurement.");
    }

    const input = normaliseRequirementInput(rawJson);
    let nextStatus = existing.status;
    if (post && canConfigureBidding(role) && existing.status === "DRAFT") {
      if (!input.closesAt) throw new Error("Set a bidding closing time before posting.");
      nextStatus = "OPEN";
    }

    await prisma.$transaction(async (tx) => {
      await tx.requirement.update({
        where: { id },
        data: {
          title: input.title,
          project: input.project,
          productServiceName: input.productServiceName,
          category: input.category,
          description: input.description,
          scopeOfWork: input.scopeOfWork,
          specifications: input.specifications,
          quantity: input.quantity,
          unit: input.unit,
          requiredDeliveryDate: input.requiredDeliveryDate,
          deliveryLocation: input.deliveryLocation,
          requestingDepartment: input.requestingDepartment,
          priority: input.priority,
          internalNotes: input.internalNotes,
          estimatedBudget: input.estimatedBudget,
          currency: input.currency,
          sellingPrice: canConfigureBidding(role) ? input.sellingPrice : existing.sellingPrice,
          closesAt: input.closesAt ?? existing.closesAt,
          status: nextStatus,
        },
      });

      if (input.vendorUserIds.length > 0) {
        const existingVendorIds = new Set(existing.invites.map((i) => i.vendorUserId));
        const newVendorIds = input.vendorUserIds.filter((vId) => !existingVendorIds.has(vId));
        if (newVendorIds.length > 0) {
          await tx.requirementInvite.createMany({
            data: newVendorIds.map((vId) => ({
              id: cuid(),
              requirementId: id,
              vendorUserId: vId,
              inviteStatus: "INVITED",
            })),
          });
        }
      }
    });

    return { input, nextStatus };
  }

  static async deleteRequirement(id: string) {
    const requirement = await prisma.requirement.findUnique({ where: { id } });
    if (!requirement) return null;

    await prisma.$transaction(async (tx) => {
      await tx.requirementInvite.deleteMany({ where: { requirementId: id } });
      await tx.quote.deleteMany({ where: { requirementId: id } });
      await tx.manualQuotation.deleteMany({ where: { requirementId: id } });
      await tx.requirementAttachment.deleteMany({ where: { requirementId: id } });
      await tx.requirement.delete({ where: { id } });
    });

    return requirement;
  }

  static async listActivity(id: string) {
    return prisma.auditLog.findMany({
      where: { entityType: "Requirement", entityId: id },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  static async exportRequirementCsv(id: string) {
    const requirement = await prisma.requirement.findUnique({
      where: { id },
      include: {
        quotes: {
          include: { vendorUser: { select: { email: true, name: true } } },
          orderBy: { amountSar: "asc" },
        },
      },
    });

    if (!requirement) return null;

    const headers = [
      "Requirement Ref",
      "Project",
      "Currency",
      "Status",
      "Closes At",
      "Vendor Name",
      "Vendor Email",
      "Quoted Price",
      "Amount (SAR)",
      "Quote Status",
      "Submitted At",
      "Remarks",
    ];

    const rows = [toCsvRow(headers)];
    for (const q of requirement.quotes) {
      rows.push(
        toCsvRow([
          requirement.referenceNumber,
          requirement.project,
          requirement.currency,
          requirement.status,
          requirement.closesAt?.toISOString() ?? "",
          q.vendorUser?.name || "N/A",
          q.vendorUser?.email || "N/A",
          q.newPrice ? String(q.newPrice) : "",
          q.amountSar ? String(q.amountSar) : "",
          q.status,
          q.submittedAt ? q.submittedAt.toISOString() : "",
          q.remarks || "",
        ])
      );
    }

    return {
      csv: rows.join("\r\n"),
      filename: `requirement-${requirement.referenceNumber || requirement.id}-quotes.csv`,
    };
  }

  static async sendInviteEmails(
    env: Env,
    requirementId: string,
    project: string,
    scopeOfWork: string,
    referenceNumber: string | null,
    closesAt: Date | null
  ) {
    const invited = await prisma.vendorUser.findMany({
      where: { invites: { some: { requirementId } } },
      select: { id: true, email: true },
    });
    if (invited.length === 0) return;

    const outcome = await sendRequirementMail(env, {
      kind: "POSTED",
      recipients: invited.map((v) => v.email),
      project,
      scopeOfWork,
      referenceNumber: referenceNumber ?? "",
      closesAt: closesAt?.toISOString(),
      portalUrl: `${(env.VENDOR_PORTAL_URL || "").replace(/\/$/, "")}/requirements/${requirementId}`,
    });

    if (!outcome.attempted) return;
    for (const v of invited) {
      const failure = outcome.failed.find((f) => f.to === v.email);
      await prisma.requirementInvite.updateMany({
        where: { requirementId, vendorUserId: v.id },
        data: {
          emailStatus: failure ? "FAILED" : "SENT",
          emailError: failure ? failure.error : null,
          emailedAt: failure ? null : new Date(),
        },
      });
    }
  }
}
