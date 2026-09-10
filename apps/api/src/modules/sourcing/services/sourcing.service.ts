import type { RequirementStatus } from "@prisma/client";
import type { Env } from "../../../config/env";
import { prisma } from "../../../lib/prisma";
import { cuid } from "../../../lib/sql";
import { sendRequirementMail } from "../../system/services/notification.service";
import type { AwardableQuote, CreateRequirementInput } from "../types/sourcing.types";

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

export function normaliseRequirementInput(input: CreateRequirementInput) {
  const scopeOfWork = String(input?.scopeOfWork ?? "").trim();
  const project = String(input?.project ?? "").trim();

  if (!scopeOfWork) throw new Error("A scope of work is required.");
  if (!project) throw new Error("A project is required.");

  const closesAt = new Date(input?.closesAt ?? "");
  if (Number.isNaN(closesAt.getTime())) throw new Error("A valid closing time is required.");
  if (closesAt.getTime() <= Date.now()) throw new Error("The closing time must be in the future.");

  const raw = input.sellingPrice == null ? "" : String(input.sellingPrice).trim();
  if (raw && !/^\d+(\.\d{1,2})?$/.test(raw)) {
    throw new Error("The selling price must be a number with at most two decimals.");
  }

  return {
    scopeOfWork,
    project,
    sellingPrice: raw || null,
    currency: String(input.currency ?? "SAR").trim() || "SAR",
    closesAt,
    vendorUserIds: Array.isArray(input.vendorUserIds) ? input.vendorUserIds : [],
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

export class SourcingService {
  /**
   * List all requirements for admin
   */
  static async listRequirements() {
    const requirements = await prisma.requirement.findMany({
      where: { deletedAt: null },
      include: {
        _count: { select: { invites: true, quotes: true } },
        quotes: {
          select: {
            id: true,
            newPrice: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return requirements.map((r) => ({
      id: r.id,
      project: r.project,
      referenceNumber: r.referenceNumber,
      scopeOfWork: r.scopeOfWork,
      currency: r.currency,
      closesAt: r.closesAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
      status: r.status,
      awardedQuoteId: r.awardedQuoteId,
      awardedAt: r.awardedAt ? r.awardedAt.toISOString() : null,
      invited: r._count.invites,
      submitted: r._count.quotes,
      invitedCount: r._count.invites,
      quotesCount: r._count.quotes,
    }));
  }

  /**
   * Get single requirement detail
   */
  static async getRequirementById(id: string) {
    return await prisma.requirement.findUnique({
      where: { id },
      include: {
        awardedByAdmin: { select: { email: true } },
        quotes: {
          include: {
            vendorUser: { select: { email: true, name: true } },
            revisions: { orderBy: { createdAt: "desc" } },
            attachments: { orderBy: { uploadedAt: "asc" } },
          },
          orderBy: [{ submittedAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
        },
        invites: {
          include: {
            vendorUser: { select: { id: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  /**
   * Award quote on requirement
   */
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
          where: { status: "SUBMITTED" },
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

    await prisma.requirement.update({
      where: { id },
      data: {
        awardedQuoteId: quoteId,
        awardedAt: new Date(),
        awardedByAdminId: admin.id,
        status: "AWARDED",
      },
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

  /**
   * Create a new requirement
   */
  static async createRequirement(
    adminId: string,
    rawJson: any,
    post: boolean,
    env: Env
  ) {
    const input = normaliseRequirementInput(rawJson as CreateRequirementInput);
    const id = cuid();
    const count = await prisma.requirement.count();
    const referenceNumber = makeReferenceNumber(new Date(), count + 1);

    await prisma.requirement.create({
      data: {
        id,
        referenceNumber,
        project: input.project,
        scopeOfWork: input.scopeOfWork,
        currency: input.currency as any,
        sellingPrice: input.sellingPrice ? Number(input.sellingPrice) : null,
        status: (post ? "OPEN" : "DRAFT") as RequirementStatus,
        closesAt: new Date(input.closesAt),
        createdByAdminId: adminId,
        invites: {
          create: input.vendorUserIds.map((vId) => ({
            id: cuid(),
            vendorUserId: vId,
          })),
        },
      },
    });

    if (post && input.vendorUserIds.length > 0) {
      const invited = await prisma.vendorUser.findMany({
        where: { id: { in: input.vendorUserIds } },
        select: { id: true, email: true },
      });

      const outcome = await sendRequirementMail(env, {
        kind: "POSTED",
        recipients: invited.map((v) => v.email),
        project: input.project,
        scopeOfWork: input.scopeOfWork,
        referenceNumber: referenceNumber ?? "",
        closesAt: new Date(input.closesAt).toISOString(),
        portalUrl: `${(env.VENDOR_PORTAL_URL || "").replace(/\/$/, "")}/requirements/${id}`,
      });

      if (outcome.attempted) {
        for (const v of invited) {
          const failure = outcome.failed.find((f) => f.to === v.email);
          await prisma.requirementInvite.updateMany({
            where: { requirementId: id, vendorUserId: v.id },
            data: {
              emailStatus: failure ? "FAILED" : "SENT",
              emailError: failure ? failure.error : null,
              emailedAt: failure ? null : new Date(),
            },
          });
        }
      }
    }

    return { id, referenceNumber, input };
  }

  /**
   * Update existing requirement
   */
  static async updateRequirement(
    id: string,
    rawJson: any,
    post: boolean
  ) {
    const existing = await prisma.requirement.findUnique({
      where: { id },
      include: { invites: true },
    });
    if (!existing) return null;

    const input = normaliseRequirementInput(rawJson as CreateRequirementInput);

    let nextStatus = existing.status;
    if (post && existing.status === "DRAFT") {
      nextStatus = "OPEN";
    }

    await prisma.$transaction(async (tx) => {
      await tx.requirement.update({
        where: { id },
        data: {
          project: input.project,
          scopeOfWork: input.scopeOfWork,
          currency: input.currency as any,
          sellingPrice: input.sellingPrice ? Number(input.sellingPrice) : null,
          closesAt: new Date(input.closesAt),
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
            })),
          });
        }
      }
    });

    return { input, nextStatus };
  }

  /**
   * Delete requirement and associated invites and quotes
   */
  static async deleteRequirement(id: string) {
    const requirement = await prisma.requirement.findUnique({
      where: { id },
    });
    if (!requirement) return null;

    await prisma.$transaction(async (tx) => {
      await tx.requirementInvite.deleteMany({ where: { requirementId: id } });
      await tx.quote.deleteMany({ where: { requirementId: id } });
      await tx.requirement.delete({ where: { id } });
    });

    return requirement;
  }

  /**
   * Export requirement quotes to CSV
   */
  static async exportRequirementCsv(id: string) {
    const requirement = await prisma.requirement.findUnique({
      where: { id },
      include: {
        quotes: {
          include: {
            vendorUser: { select: { email: true, name: true } },
          },
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
          requirement.closesAt.toISOString(),
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
}

