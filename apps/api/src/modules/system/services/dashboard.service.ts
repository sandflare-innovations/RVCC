import { prisma } from "../../../lib/prisma";
import type { DashboardMetrics } from "../types/system.types";

export class DashboardService {
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    const statusGroups = await prisma.supplierRegistration.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    const byStatus: Record<string, number> = {};
    for (const group of statusGroups) {
      byStatus[group.status] = group._count.status;
    }

    const vendorsCount = await prisma.vendorUser.count({
      where: { isActive: true, deletedAt: null },
    });
    const publishedJobs = await prisma.jobPosting.count({ where: { isPublished: true } });
    const totalJobs = await prisma.jobPosting.count();

    const now = new Date();
    const in48Hours = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const openCount = await prisma.requirement.count({
      where: { status: "OPEN", closesAt: { gt: now } },
    });
    const closingSoon = await prisma.requirement.count({
      where: {
        status: "OPEN",
        closesAt: { gt: now, lte: in48Hours },
      },
    });
    const awaitingAward = await prisma.requirement.count({
      where: {
        awardedQuoteId: null,
        OR: [
          { status: "OPEN", closesAt: { lte: now } },
          { status: "EVALUATING" },
        ],
      },
    });

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const activeVendors = await prisma.vendorUser.findMany({
      where: { isActive: true },
      select: {
        id: true,
        email: true,
        invites: {
          where: { createdAt: { gte: ninetyDaysAgo } },
          select: { id: true },
        },
        quotes: {
          where: { status: "SUBMITTED" },
          select: {
            id: true,
            submittedAt: true,
            awardedFor: { select: { id: true } },
          },
        },
      },
      orderBy: { email: "asc" },
      take: 100,
    });

    const performance = activeVendors.map((v) => {
      const invited = v.invites.length;
      const submitted = v.quotes.filter(
        (q) => q.submittedAt && q.submittedAt >= ninetyDaysAgo
      ).length;
      const won = v.quotes.filter((q) => q.awardedFor != null).length;
      return {
        email: v.email,
        invited,
        submitted,
        won,
      };
    });

    const recentQuotesRows = await prisma.quote.findMany({
      where: { status: "SUBMITTED" },
      include: {
        vendorUser: { select: { name: true, email: true } },
        requirement: { select: { id: true, project: true } },
      },
      orderBy: { submittedAt: { sort: "desc", nulls: "last" } },
      take: 5,
    });

    const recentQuotes = recentQuotesRows.map((q) => ({
      id: q.id,
      newPrice: Number(q.newPrice) || 0,
      submittedAt: q.submittedAt ? q.submittedAt.toISOString() : null,
      vendorName: q.vendorUser?.name || "Unknown Vendor",
      vendorEmail: q.vendorUser?.email || "",
      requirementId: q.requirement.id,
      requirementTitle: q.requirement.project,
    }));

    return {
      pendingRegistrations: (byStatus.SUBMITTED ?? 0) + (byStatus.PENDING ?? 0),
      activeVendors: vendorsCount,
      vendors: vendorsCount,
      publishedJobs,
      totalJobs,
      openCount,
      closingSoon,
      awaitingAward,
      byStatus,
      performance,
      recentQuotes,
    };
  }

  static async listIndustries() {
    const rows = await prisma.industry.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return rows.map((r) => ({ id: r.id, name: r.name }));
  }
}
