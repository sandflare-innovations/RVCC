import { prisma } from "../../../lib/prisma";
import { broadcastBidUpdate } from "./live-bids.controller";
import type { Env } from "../../../config/env";
import {
  mailInBackground,
  notifyBiddingClosed,
  notifyBiddingOpened,
  notifyClosingSoon,
} from "../../mail/events";

const HOUR = 60 * 60 * 1000;
/** Scheduled openings older than this are not announced (avoids mailing stale RFQs after a restart). */
const OPEN_NOTICE_GRACE_MS = 2 * HOUR;

const summarySelect = {
  id: true,
  project: true,
  referenceNumber: true,
  opensAt: true,
  closesAt: true,
} as const;

/** How long before closing the reminder goes out, scaled to the bidding window. */
function reminderLeadMs(opensAt: Date | null, closesAt: Date): number | null {
  const windowMs = closesAt.getTime() - (opensAt?.getTime() ?? closesAt.getTime() - 48 * HOUR);
  if (windowMs >= 48 * HOUR) return 24 * HOUR;
  if (windowMs >= 3 * HOUR) return HOUR;
  if (windowMs >= 45 * 60 * 1000) return 15 * 60 * 1000;
  return null;
}

/**
 * Checks for requirements whose bidding deadline (closesAt) has passed while
 * still in "OPEN" status, transitions them to "BIDDING_CLOSED", logs audit entries,
 * and notifies admins, vendors and connected SSE clients.
 */
export async function processExpiredRequirements(env?: Env): Promise<number> {
  const now = new Date();

  if (env) {
    await processBiddingSchedule(env, now).catch((err) =>
      console.error("[deadline-worker] schedule notices failed", err)
    );
  }

  try {
    const expiredReqs = await prisma.requirement.findMany({
      where: {
        status: "OPEN",
        closesAt: { lte: now },
      },
      select: {
        ...summarySelect,
        createdByAdminId: true,
      },
    });

    if (expiredReqs.length === 0) {
      return 0;
    }

    for (const req of expiredReqs) {
      // Close bidding first. Admin then starts evaluation — ranking never awards.
      await prisma.requirement.update({
        where: { id: req.id },
        data: { status: "BIDDING_CLOSED", closedNoticeSentAt: env ? now : undefined },
      });

      await prisma.auditLog.create({
        data: {
          action: "requirement.deadline_expired",
          entityType: "Requirement",
          entityId: req.id,
          actorName: "System Automation",
          actorRole: "SYSTEM",
          previousStatus: "OPEN",
          newStatus: "BIDDING_CLOSED",
          note: `Bidding deadline passed for ${req.referenceNumber || req.project}. Status transitioned to BIDDING_CLOSED.`,
          metadata: { project: req.project, closedAt: now.toISOString() },
        },
      }).catch((e) => console.warn("[deadline-worker] audit log error", e));

      if (env) {
        mailInBackground("bidding-closed", () => notifyBiddingClosed(env, req));
      }

      try {
        void broadcastBidUpdate(req.id, env);
      } catch (e) {
        console.warn("[deadline-worker] broadcast error", e);
      }
    }

    console.log(`[deadline-worker] Transitioned ${expiredReqs.length} expired requirement(s) to BIDDING_CLOSED.`);
    return expiredReqs.length;
  } catch (err) {
    console.error("[deadline-worker] Error processing expired requirements:", err);
    return 0;
  }
}

/** Opening announcements for scheduled bidding and closing-soon reminders. */
async function processBiddingSchedule(env: Env, now: Date) {
  const opening = await prisma.requirement.findMany({
    where: {
      status: "OPEN",
      deletedAt: null,
      openNoticeSentAt: null,
      opensAt: { lte: now, gte: new Date(now.getTime() - OPEN_NOTICE_GRACE_MS) },
      closesAt: { gt: now },
    },
    select: summarySelect,
  });

  for (const req of opening) {
    const claimed = await prisma.requirement.updateMany({
      where: { id: req.id, openNoticeSentAt: null },
      data: { openNoticeSentAt: now },
    });
    if (claimed.count === 0) continue;
    mailInBackground("bidding-opened", () => notifyBiddingOpened(env, req));
    void broadcastBidUpdate(req.id, env);
  }

  const live = await prisma.requirement.findMany({
    where: {
      status: "OPEN",
      deletedAt: null,
      closingReminderSentAt: null,
      closesAt: { gt: now, lte: new Date(now.getTime() + 24 * HOUR) },
      OR: [{ opensAt: null }, { opensAt: { lte: now } }],
    },
    select: summarySelect,
  });

  for (const req of live) {
    if (!req.closesAt) continue;
    const lead = reminderLeadMs(req.opensAt, req.closesAt);
    if (lead == null) {
      await prisma.requirement.update({
        where: { id: req.id },
        data: { closingReminderSentAt: now },
      });
      continue;
    }
    if (req.closesAt.getTime() - now.getTime() > lead) continue;

    const claimed = await prisma.requirement.updateMany({
      where: { id: req.id, closingReminderSentAt: null },
      data: { closingReminderSentAt: now },
    });
    if (claimed.count === 0) continue;
    mailInBackground("closing-soon", () => notifyClosingSoon(env, req));
  }
}
