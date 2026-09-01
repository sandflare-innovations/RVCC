import { prisma } from "../../lib/prisma";
import { broadcastBidUpdate } from "./live-bids";
import type { Env } from "../../config/env";

/**
 * Checks for requirements whose bidding deadline (closesAt) has passed while
 * still in "OPEN" status, transitions them to "EVALUATING", logs audit entries,
 * and notifies admins and connected SSE clients.
 */
export async function processExpiredRequirements(env?: Env): Promise<number> {
  const now = new Date();

  try {
    const expiredReqs = await prisma.requirement.findMany({
      where: {
        status: "OPEN",
        closesAt: { lte: now },
      },
      select: {
        id: true,
        project: true,
        referenceNumber: true,
        createdByAdminId: true,
      },
    });

    if (expiredReqs.length === 0) {
      return 0;
    }

    for (const req of expiredReqs) {
      // 1. Transition status from OPEN to EVALUATING
      await prisma.requirement.update({
        where: { id: req.id },
        data: { status: "EVALUATING" },
      });

      // 2. Write system audit log
      await prisma.auditLog.create({
        data: {
          action: "requirement.deadline_expired",
          entityType: "Requirement",
          entityId: req.id,
          actorName: "System Automation",
          actorRole: "SYSTEM",
          previousStatus: "OPEN",
          newStatus: "EVALUATING",
          note: `Bidding deadline passed for ${req.referenceNumber || req.project}. Status transitioned to EVALUATING.`,
          metadata: { project: req.project, closedAt: now.toISOString() },
        },
      }).catch((e) => console.warn("[deadline-worker] audit log error", e));

      // 3. Notify author admin or general procurement
      if (req.createdByAdminId) {
        await prisma.notification.create({
          data: {
            adminId: req.createdByAdminId,
            type: "REQUIREMENT_UPDATED",
            title: `Bidding Concluded: ${req.project}`,
            body: `Deadline reached. Requirement is now in EVALUATING stage.`,
            linkPath: `/requirements/${req.id}`,
          },
        }).catch((e) => console.warn("[deadline-worker] notification error", e));
      }

      // 4. Notify live streams
      try {
        void broadcastBidUpdate(req.id, env);
      } catch (e) {
        console.warn("[deadline-worker] broadcast error", e);
      }
    }

    console.log(`[deadline-worker] Transitioned ${expiredReqs.length} expired requirement(s) to EVALUATING.`);
    return expiredReqs.length;
  } catch (err) {
    console.error("[deadline-worker] Error processing expired requirements:", err);
    return 0;
  }
}
