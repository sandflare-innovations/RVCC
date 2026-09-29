import type { Env } from "../../../config/env";
import { prisma } from "../../../lib/prisma";
import { cuid } from "../../../lib/sql";
import {
  sendApprovedEmail,
  sendAwardEmail,
  sendRejectedEmail,
  sendRequirementPostedEmail,
} from "../../mail/mail";
import type {
  DecisionRecipient,
  NotificationItem,
  NotifyOutcome,
  RequirementMailOutcome,
} from "../types/system.types";

type VendorNotifyInput = {
  vendorUserIds: string[];
  type:
    | "REQUIREMENT_POSTED"
    | "REQUIREMENT_UPDATED"
    | "QUOTE_SUBMITTED"
    | "QUOTE_AWARDED"
    | "VENDOR_MESSAGE";
  title: string;
  body: string;
  linkPath: string;
};

function serializeNotification(n: {
  id: string;
  type: string;
  title: string;
  body: string;
  linkPath: string;
  readAt: Date | null;
  createdAt: Date;
}): NotificationItem {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    linkPath: n.linkPath,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
  };
}

export class NotificationService {
  static async notifyVendors(input: VendorNotifyInput): Promise<void> {
    const ids = [...new Set(input.vendorUserIds.filter(Boolean))];
    if (ids.length === 0) return;

    await prisma.notification.createMany({
      data: ids.map((vendorUserId) => ({
        id: cuid(),
        vendorUserId,
        type: input.type,
        title: input.title,
        body: input.body,
        linkPath: input.linkPath,
      })),
    });
  }

  static async listVendorNotifications(vendorUserId: string): Promise<{
    items: NotificationItem[];
    unread: number;
  }> {
    const rawItems = await prisma.notification.findMany({
      where: { vendorUserId },
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    const items = rawItems.map(serializeNotification);
    return {
      items,
      unread: items.filter((n) => n.readAt == null).length,
    };
  }

  static async markVendorAllAsRead(vendorUserId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { vendorUserId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  static async sendAdminVendorMessage(input: {
    vendorUserId: string;
    title: string;
    body: string;
    linkPath?: string;
  }): Promise<NotificationItem | null> {
    const vendor = await prisma.vendorUser.findFirst({
      where: { id: input.vendorUserId },
      select: { id: true },
    });
    if (!vendor) return null;

    const row = await prisma.notification.create({
      data: {
        id: cuid(),
        vendorUserId: vendor.id,
        type: "VENDOR_MESSAGE",
        title: input.title,
        body: input.body,
        linkPath: input.linkPath || "/",
      },
    });

    return serializeNotification(row);
  }

  /**
   * List notifications for an admin
   */
  static async listAdminNotifications(adminId: string): Promise<{
    items: NotificationItem[];
    unread: number;
  }> {
    const rawItems = await prisma.notification.findMany({
      where: { adminId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const items = rawItems.map(serializeNotification);

    return {
      items,
      unread: items.filter((n) => n.readAt == null).length,
    };
  }

  /**
   * Mark all unread notifications as read for an admin
   */
  static async markAllAsRead(adminId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        adminId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  /**
   * Register push notification subscription
   */
  static async subscribePush(
    adminId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
  ): Promise<void> {
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        adminId,
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        adminId,
      },
    });
  }

  /**
   * Unregister push notification subscription
   */
  static async unsubscribePush(adminId: string, endpoint: string): Promise<void> {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint, adminId },
    });
  }

  /**
   * Sends approval/rejection mail in-process (SMTP lives in this API).
   * Never throws — the decision is already committed before this runs.
   */
  static async notifyDecision(
    env: Env,
    input: {
      decision: "APPROVED" | "REJECTED";
      legalName: string;
      referenceNumber: string;
      reason?: string;
      recipients: DecisionRecipient[];
    }
  ): Promise<NotifyOutcome> {
    const base: NotifyOutcome = { attempted: false, sent: [], failed: [] };

    const portalBase = (env.VENDOR_PORTAL_URL || "").replace(/\/$/, "");
    if (!portalBase) {
      return { ...base, error: "VENDOR_PORTAL_URL is not configured — no mail sent." };
    }

    if (input.recipients.length === 0) {
      return { ...base, error: "No recipient addresses." };
    }

    const portalUrl = `${portalBase}/login`;
    const sent: string[] = [];
    const failed: { to: string; error: string }[] = [];

    for (const r of input.recipients) {
      try {
        if (input.decision === "APPROVED") {
          await sendApprovedEmail(env, r.to, {
            legalName: input.legalName,
            referenceNumber: input.referenceNumber,
            portalUrl,
            loginEmail: r.loginEmail,
            tempPassword: r.tempPassword,
          });
        } else {
          await sendRejectedEmail(env, r.to, {
            legalName: input.legalName,
            referenceNumber: input.referenceNumber,
            reason: input.reason || "",
          });
        }
        sent.push(r.to);
      } catch (err) {
        failed.push({ to: r.to, error: (err as Error).message || "send failed" });
      }
    }

    return { attempted: true, sent, failed };
  }

  /**
   * Sends requirement posted/awarded mail in-process. Never throws.
   */
  static async sendRequirementMail(
    env: Env,
    input: {
      kind: "POSTED" | "AWARDED";
      recipients: string[];
      project: string;
      scopeOfWork?: string;
      referenceNumber: string;
      closesAt?: string;
      portalUrl: string;
    }
  ): Promise<RequirementMailOutcome> {
    const base: RequirementMailOutcome = { attempted: false, sent: [], failed: [] };
    if (input.recipients.length === 0) return base;

    const sent: string[] = [];
    const failed: { to: string; error: string }[] = [];

    for (const to of input.recipients) {
      try {
        if (input.kind === "POSTED") {
          await sendRequirementPostedEmail(env, to, {
            project: input.project,
            scopeOfWork: input.scopeOfWork || "",
            referenceNumber: input.referenceNumber,
            closesAt: input.closesAt || "",
            portalUrl: input.portalUrl,
          });
        } else {
          await sendAwardEmail(env, to, {
            project: input.project,
            referenceNumber: input.referenceNumber,
            portalUrl: input.portalUrl,
          });
        }
        sent.push(to);
      } catch (err) {
        failed.push({ to, error: (err as Error).message || "send failed" });
      }
    }

    return { attempted: true, sent, failed };
  }
}

export const notifyDecision = NotificationService.notifyDecision;
export const sendRequirementMail = NotificationService.sendRequirementMail;
