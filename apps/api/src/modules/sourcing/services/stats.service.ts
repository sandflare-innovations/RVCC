import { prisma } from "../../../lib/prisma";
import { normalizeStatus } from "../lib/status-machine";

export class SourcingStatsService {
  static async getDashboard() {
    const requirements = await prisma.requirement.findMany({
      where: { deletedAt: null },
      include: {
        quotes: { where: { status: "SUBMITTED", deletedAt: null }, select: { amountSar: true, newPrice: true } },
        manualQuotations: { where: { deletedAt: null }, select: { amountSar: true, totalPrice: true } },
        _count: { select: { invites: true, quotes: true } },
      },
    });

    const now = Date.now();
    const soon = now + 48 * 60 * 60 * 1000;
    let draft = 0;
    let activeBids = 0;
    let closingSoon = 0;
    let underEvaluation = 0;
    let shortlisted = 0;
    let awarded = 0;
    let awardedValue = 0;
    let savingsVsQuotes = 0;
    let savingsVsBudget = 0;
    const byCategory: Record<string, number> = {};
    const monthlyValue: Record<string, number> = {};
    let invited = 0;
    let bidSubmitted = 0;

    for (const r of requirements) {
      const status = normalizeStatus(r.status);
      if (status === "DRAFT" || status === "QUOTATION_COLLECTION") draft += 1;
      if (status === "OPEN") {
        activeBids += 1;
        if (r.closesAt && r.closesAt.getTime() <= soon && r.closesAt.getTime() > now) closingSoon += 1;
      }
      if (status === "BIDDING_CLOSED" || status === "EVALUATING") underEvaluation += 1;
      if (status === "SHORTLISTED") shortlisted += 1;
      if (status === "AWARDED") {
        awarded += 1;
        const value = Number(r.awardedValue ?? 0);
        awardedValue += value;
        const initialQuotes = r.manualQuotations.map((q) => Number(q.amountSar ?? q.totalPrice)).filter((n) => n > 0);
        if (initialQuotes.length && value > 0) {
          savingsVsQuotes += Math.min(...initialQuotes) - value;
        }
        if (r.estimatedBudget && value > 0) {
          savingsVsBudget += Number(r.estimatedBudget) - value;
        }
        const month = (r.awardedAt ?? r.updatedAt).toISOString().slice(0, 7);
        monthlyValue[month] = (monthlyValue[month] ?? 0) + value;
      }
      const cat = r.category || "General";
      byCategory[cat] = (byCategory[cat] ?? 0) + 1;
      invited += r._count.invites;
      bidSubmitted += r.quotes.length;
    }

    return {
      totalRequirements: requirements.length,
      draftRequirements: draft,
      activeBids,
      bidsClosingSoon: closingSoon,
      underEvaluation,
      shortlistedSuppliers: shortlisted,
      awardedProcurements: awarded,
      totalProcurementValue: Math.round(awardedValue * 100) / 100,
      savingsAgainstQuotations: Math.round(savingsVsQuotes * 100) / 100,
      savingsAgainstBudget: Math.round(savingsVsBudget * 100) / 100,
      charts: {
        monthlyProcurementValue: Object.entries(monthlyValue)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, value]) => ({ month, value })),
        procurementByCategory: Object.entries(byCategory).map(([category, count]) => ({ category, count })),
        supplierParticipation: { invited, bidSubmitted },
        bidCompetition: {
          averageBidders: requirements.length
            ? Math.round((bidSubmitted / requirements.length) * 10) / 10
            : 0,
        },
      },
    };
  }
}
