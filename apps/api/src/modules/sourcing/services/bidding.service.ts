import { randomBytes } from "node:crypto";
import { bidConfigSchema, inviteSuppliersSchema } from "@rvcc/schemas";
import type { Currency, RankingStrategy } from "@prisma/client";
import type { Env } from "../../../config/env";
import { generateTempPassword, hashPassword } from "../../../lib/password";
import { prisma } from "../../../lib/prisma";
import { cuid } from "../../../lib/sql";
import { SourcingService } from "./sourcing.service";
import { assertTransition } from "../lib/status-machine";

function asDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export class BiddingService {
  static async saveConfig(requirementId: string, raw: unknown) {
    const requirement = await prisma.requirement.findFirst({
      where: { id: requirementId, deletedAt: null },
    });
    if (!requirement) return null;

    const status = requirement.status;
    if (!["SUBMITTED_TO_ADMIN", "PENDING", "OPEN"].includes(status)) {
      throw new Error("Bid configuration is only available after the requirement is submitted to Admin.");
    }

    const input = bidConfigSchema.parse(raw);
    const closesAt = asDate(input.closesAt);
    if (!closesAt) throw new Error("A valid closing date and time is required.");
    if (closesAt.getTime() <= Date.now()) throw new Error("The closing time must be in the future.");

    const opensAt = asDate(input.opensAt) ?? new Date();
    if (input.maxAcceptablePrice != null && input.minAcceptablePrice != null) {
      if (input.maxAcceptablePrice < input.minAcceptablePrice) {
        throw new Error("Maximum acceptable price must be greater than the minimum.");
      }
    }

    return prisma.requirement.update({
      where: { id: requirementId },
      data: {
        sellingPrice: input.targetPrice,
        estimatedBudget: input.estimatedBudget ?? requirement.estimatedBudget,
        currency: (input.currency || requirement.currency) as Currency,
        opensAt,
        closesAt,
        minAcceptablePrice: input.minAcceptablePrice ?? null,
        maxAcceptablePrice: input.maxAcceptablePrice ?? null,
        rankingStrategy: input.rankingStrategy as RankingStrategy,
        allowBidRevisions: input.allowBidRevisions ?? true,
        revealCompetitorPrices: input.revealCompetitorPrices ?? false,
        revealTargetPrice: input.revealTargetPrice ?? false,
        priceWeight: input.priceWeight ?? 50,
        technicalWeight: input.technicalWeight ?? 25,
        commercialWeight: input.commercialWeight ?? 25,
        bidRules: input.bidRules || "",
        eligibilityNotes: input.eligibilityNotes || "",
        requiredDocuments: input.requiredDocuments ?? [],
        termsAndConditions: input.termsAndConditions || "",
      },
    });
  }

  static async invite(requirementId: string, raw: unknown, env: Env) {
    const requirement = await prisma.requirement.findFirst({
      where: { id: requirementId, deletedAt: null },
    });
    if (!requirement) return null;

    const input = inviteSuppliersSchema.parse(raw);
    const vendorIds = [...input.vendorUserIds];

    for (const newbie of input.newSuppliers) {
      const existing = await prisma.vendorUser.findUnique({ where: { email: newbie.email } });
      if (existing) {
        vendorIds.push(existing.id);
        continue;
      }
      const tempPassword = generateTempPassword();
      const vendorId = cuid();
      await prisma.vendorUser.create({
        data: {
          id: vendorId,
          email: newbie.email,
          name: newbie.name,
          passwordHash: await hashPassword(tempPassword),
          mustChangePassword: true,
          isActive: true,
          portalAccess: "RELEASED",
        },
      });
      vendorIds.push(vendorId);
    }

    const uniqueIds = [...new Set(vendorIds)];
    const existingInvites = await prisma.requirementInvite.findMany({
      where: { requirementId },
      select: { vendorUserId: true },
    });
    const already = new Set(existingInvites.map((i) => i.vendorUserId));
    const toCreate = uniqueIds.filter((id) => !already.has(id));

    if (toCreate.length > 0) {
      await prisma.requirementInvite.createMany({
        data: toCreate.map((vendorUserId) => ({
          id: cuid(),
          requirementId,
          vendorUserId,
          inviteStatus: "INVITED",
          inviteToken: randomBytes(24).toString("hex"),
        })),
      });
    }

    if (input.sendEmail !== false) {
      await SourcingService.sendInviteEmails(
        env,
        requirementId,
        requirement.project,
        requirement.scopeOfWork,
        requirement.referenceNumber,
        requirement.closesAt
      );
    }

    const invites = await prisma.requirementInvite.findMany({
      where: { requirementId },
      include: { vendorUser: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });

    return {
      invites: invites.map((i) => ({
        id: i.id,
        vendorUserId: i.vendorUserId,
        email: i.vendorUser.email,
        name: i.vendorUser.name,
        inviteStatus: i.inviteStatus,
        emailStatus: i.emailStatus,
        inviteToken: i.inviteToken,
        viewedAt: i.viewedAt?.toISOString() ?? null,
        respondedAt: i.respondedAt?.toISOString() ?? null,
      })),
    };
  }

  static async openBidding(requirementId: string) {
    const requirement = await prisma.requirement.findFirst({
      where: { id: requirementId, deletedAt: null },
      include: { _count: { select: { invites: true } } },
    });
    if (!requirement) return null;
    if (!requirement.sellingPrice) throw new Error("Set a confidential target price before opening bidding.");
    if (!requirement.closesAt) throw new Error("Set a bidding closing time before opening bidding.");
    if (requirement.closesAt.getTime() <= Date.now()) throw new Error("The closing time must be in the future.");
    if (requirement._count.invites < 1) throw new Error("Invite at least one supplier before opening bidding.");

    assertTransition(requirement.status, "OPEN");
    return prisma.requirement.update({
      where: { id: requirementId },
      data: {
        status: "OPEN",
        opensAt: requirement.opensAt ?? new Date(),
      },
    });
  }

  static async closeBidding(requirementId: string) {
    const requirement = await prisma.requirement.findFirst({
      where: { id: requirementId, deletedAt: null },
    });
    if (!requirement) return null;
    assertTransition(requirement.status, "BIDDING_CLOSED");
    return prisma.requirement.update({
      where: { id: requirementId },
      data: { status: "BIDDING_CLOSED" },
    });
  }

  static async startEvaluation(requirementId: string) {
    const requirement = await prisma.requirement.findFirst({
      where: { id: requirementId, deletedAt: null },
    });
    if (!requirement) return null;
    assertTransition(requirement.status, "EVALUATING");
    return prisma.requirement.update({
      where: { id: requirementId },
      data: { status: "EVALUATING" },
    });
  }
}
