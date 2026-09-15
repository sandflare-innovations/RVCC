import { quoteEvaluationActionSchema } from "@rvcc/schemas";
import type { QuoteEvaluationStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { assertTransition, normalizeStatus } from "../lib/status-machine";

const EVALUATING_STATUSES = new Set(["BIDDING_CLOSED", "EVALUATING", "SHORTLISTED"]);

export class EvaluationService {
  static async applyQuoteAction(requirementId: string, quoteId: string, adminId: string, raw: unknown) {
    const requirement = await prisma.requirement.findFirst({
      where: { id: requirementId, deletedAt: null },
    });
    if (!requirement) return { error: "Requirement not found.", status: 404 as const };
    if (!EVALUATING_STATUSES.has(normalizeStatus(requirement.status))) {
      return { error: "Evaluation actions are only available after bidding closes.", status: 409 as const };
    }

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, requirementId, deletedAt: null },
    });
    if (!quote) return { error: "Quote not found.", status: 404 as const };

    const input = quoteEvaluationActionSchema.parse(raw);
    const evaluationStatus = input.action as QuoteEvaluationStatus;
    const data: Record<string, unknown> = {
      evaluationStatus,
      evaluationNote: input.note || "",
    };
    if (input.technicalScore != null) data.technicalScore = input.technicalScore;
    if (input.commercialScore != null) data.commercialScore = input.commercialScore;
    if (evaluationStatus === "SHORTLISTED") {
      data.shortlistedAt = new Date();
      data.shortlistedByAdminId = adminId;
    }

    await prisma.quote.update({ where: { id: quoteId }, data });

    if (evaluationStatus === "SHORTLISTED") {
      const current = normalizeStatus(requirement.status);
      if (current !== "SHORTLISTED") {
        assertTransition(requirement.status, "SHORTLISTED");
        await prisma.requirement.update({
          where: { id: requirementId },
          data: { status: "SHORTLISTED" },
        });
      }
    }

    return { ok: true as const, evaluationStatus };
  }
}
