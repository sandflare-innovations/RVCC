import type { Env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { cuid } from "../../lib/sql";
import { sendNoticeEmail, smtpConfigured, type NoticeEmail } from "./mail";

const ADMIN_ALERT_ROLES = ["SUPER_ADMIN", "ADMIN"];
export const VENDOR_ADMIN_ALERT_ROLES = ["SUPER_ADMIN", "ADMIN", "VENDOR_ADMIN"];

type NotificationType =
  | "REQUIREMENT_POSTED"
  | "REQUIREMENT_UPDATED"
  | "QUOTE_SUBMITTED"
  | "QUOTE_AWARDED"
  | "VENDOR_MESSAGE";

/** Never blocks or fails the request that triggered the email. */
export function mailInBackground(label: string, task: () => Promise<unknown>): void {
  void task().catch((err) => console.warn(`[mail:${label}]`, (err as Error)?.message || err));
}

export function vendorPortalUrl(env: Env, path = "/"): string {
  return `${(env.VENDOR_PORTAL_URL || "").replace(/\/$/, "")}${path}`;
}

export function adminPortalUrl(env: Env, path = "/"): string {
  return `${(env.ADMIN_PORTAL_URL || "").replace(/\/$/, "")}${path}`;
}

export function formatWhen(date: Date | string | null | undefined): string {
  if (!date) return "Not set";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "Not set";
  return `${d.toLocaleString("en-GB", {
    timeZone: "Asia/Riyadh",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })} (Riyadh time)`;
}

export function formatMoney(amount: unknown, currency: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

async function sendToEach(env: Env, recipients: string[], notice: NoticeEmail) {
  if (!smtpConfigured(env)) return { sent: [] as string[], failed: recipients };
  const sent: string[] = [];
  const failed: string[] = [];
  for (const to of [...new Set(recipients.filter(Boolean))]) {
    try {
      await sendNoticeEmail(env, to, notice);
      sent.push(to);
    } catch (err) {
      failed.push(to);
      console.warn(`[mail] ${notice.subject} -> ${to} failed:`, (err as Error)?.message || err);
    }
  }
  return { sent, failed };
}

async function adminRecipients(roles: string[]) {
  return prisma.adminUser.findMany({
    where: { isActive: true, deletedAt: null, role: { name: { in: roles } } },
    select: { id: true, email: true },
  });
}

/** In-app notification + email to active admins. */
export async function alertAdmins(
  env: Env,
  input: {
    type: NotificationType;
    title: string;
    body: string;
    linkPath: string;
    email?: NoticeEmail;
    roles?: string[];
  }
) {
  const admins = await adminRecipients(input.roles ?? ADMIN_ALERT_ROLES);
  if (admins.length === 0) return;

  await prisma.notification
    .createMany({
      data: admins.map((a) => ({
        id: cuid(),
        adminId: a.id,
        type: input.type,
        title: input.title,
        body: input.body,
        linkPath: input.linkPath,
      })),
    })
    .catch((err) => console.warn("[alertAdmins] notification insert failed", err));

  if (input.email) {
    await sendToEach(
      env,
      admins.map((a) => a.email),
      input.email
    );
  }
}

/** In-app notification + email to specific vendors. */
export async function alertVendors(
  env: Env,
  input: {
    vendorUserIds: string[];
    type: NotificationType;
    title: string;
    body: string;
    linkPath: string;
    email?: NoticeEmail;
  }
) {
  const ids = [...new Set(input.vendorUserIds.filter(Boolean))];
  if (ids.length === 0) return;

  const vendors = await prisma.vendorUser.findMany({
    where: { id: { in: ids }, isActive: true },
    select: { id: true, email: true },
  });
  if (vendors.length === 0) return;

  await prisma.notification
    .createMany({
      data: vendors.map((v) => ({
        id: cuid(),
        vendorUserId: v.id,
        type: input.type,
        title: input.title,
        body: input.body,
        linkPath: input.linkPath,
      })),
    })
    .catch((err) => console.warn("[alertVendors] notification insert failed", err));

  if (input.email) {
    await sendToEach(
      env,
      vendors.map((v) => v.email),
      input.email
    );
  }
}

/** Invited vendors who can still bid online (excludes vendors RVCC quoted offline). */
export async function biddingVendorIds(requirementId: string): Promise<string[]> {
  const [invites, offline] = await Promise.all([
    prisma.requirementInvite.findMany({
      where: { requirementId },
      select: { vendorUserId: true },
    }),
    prisma.manualQuotation.findMany({
      where: { requirementId, deletedAt: null, vendorUserId: { not: null } },
      select: { vendorUserId: true },
    }),
  ]);
  const offlineIds = new Set(offline.map((m) => m.vendorUserId).filter(Boolean) as string[]);
  return invites.map((i) => i.vendorUserId).filter((id) => !offlineIds.has(id));
}

type RequirementSummary = {
  id: string;
  project: string;
  referenceNumber: string | null;
  opensAt: Date | null;
  closesAt: Date | null;
};

function requirementDetails(r: RequirementSummary): [string, string][] {
  return [
    ["Reference", r.referenceNumber || "—"],
    ["Project", r.project],
    ["Opens", formatWhen(r.opensAt)],
    ["Closes", formatWhen(r.closesAt)],
  ];
}

export async function notifyBiddingOpened(env: Env, r: RequirementSummary) {
  const vendorIds = await biddingVendorIds(r.id);
  const link = `/requirements/${r.id}`;
  await alertVendors(env, {
    vendorUserIds: vendorIds,
    type: "REQUIREMENT_UPDATED",
    title: "Live bidding is open",
    body: `Bidding is now open for ${r.project}. Submit your bid before ${formatWhen(r.closesAt)}.`,
    linkPath: link,
    email: {
      subject: `RVCC — Bidding is now open: ${r.project}`,
      title: "Bidding Is Open",
      paragraphs: [
        "Bidding is now open for the requirement below. Review the auction amount, then submit your bid with remarks and your bid document before the deadline.",
      ],
      details: requirementDetails(r),
      cta: { label: "Submit your bid", url: vendorPortalUrl(env, link) },
    },
  });
}

export async function notifyBiddingScheduled(env: Env, r: RequirementSummary) {
  const vendorIds = await biddingVendorIds(r.id);
  const link = `/requirements/${r.id}`;
  await alertVendors(env, {
    vendorUserIds: vendorIds,
    type: "REQUIREMENT_UPDATED",
    title: "Bidding scheduled",
    body: `Bidding for ${r.project} opens ${formatWhen(r.opensAt)}.`,
    linkPath: link,
    email: {
      subject: `RVCC — Bidding scheduled: ${r.project}`,
      title: "Bidding Scheduled",
      paragraphs: [
        "Bidding has been scheduled for the requirement below. You can review the scope now. Bid submission opens at the time shown, and we will email you again when it opens.",
      ],
      details: requirementDetails(r),
      cta: { label: "Review the requirement", url: vendorPortalUrl(env, link) },
    },
  });
}

export async function notifyClosingSoon(env: Env, r: RequirementSummary) {
  const vendorIds = await biddingVendorIds(r.id);
  if (vendorIds.length === 0) return;
  const submitted = await prisma.quote.findMany({
    where: { requirementId: r.id, status: "SUBMITTED", vendorUserId: { in: vendorIds } },
    select: { vendorUserId: true },
  });
  const submittedIds = new Set(submitted.map((q) => q.vendorUserId));
  const link = `/requirements/${r.id}`;

  const pending = vendorIds.filter((id) => !submittedIds.has(id));
  const revisers = vendorIds.filter((id) => submittedIds.has(id));

  await alertVendors(env, {
    vendorUserIds: pending,
    type: "REQUIREMENT_UPDATED",
    title: "Bidding closes soon",
    body: `You have not submitted a bid for ${r.project}. Bidding closes ${formatWhen(r.closesAt)}.`,
    linkPath: link,
    email: {
      subject: `RVCC — Reminder: bidding closes soon for ${r.project}`,
      title: "Bidding Closes Soon",
      paragraphs: [
        "You have not submitted a bid for this requirement yet. Submit your bid with remarks and your bid document before bidding closes.",
      ],
      details: requirementDetails(r),
      cta: { label: "Submit your bid", url: vendorPortalUrl(env, link) },
    },
  });

  await alertVendors(env, {
    vendorUserIds: revisers,
    type: "REQUIREMENT_UPDATED",
    title: "Bidding closes soon",
    body: `Bidding for ${r.project} closes ${formatWhen(r.closesAt)}. You can still revise your bid.`,
    linkPath: link,
    email: {
      subject: `RVCC — Bidding closes soon for ${r.project}`,
      title: "Bidding Closes Soon",
      paragraphs: [
        "Your bid is recorded. Bidding closes soon; check your ranking and revise your bid before the deadline if needed.",
      ],
      details: requirementDetails(r),
      cta: { label: "View your bid", url: vendorPortalUrl(env, link) },
    },
  });
}

export async function notifyBiddingClosed(env: Env, r: RequirementSummary) {
  const vendorIds = await biddingVendorIds(r.id);
  const link = `/requirements/${r.id}`;
  const [bidCount] = await Promise.all([
    prisma.quote.count({ where: { requirementId: r.id, status: "SUBMITTED", deletedAt: null } }),
  ]);

  await alertVendors(env, {
    vendorUserIds: vendorIds,
    type: "REQUIREMENT_UPDATED",
    title: "Bidding closed",
    body: `Bidding for ${r.project} has closed. RVCC is evaluating the bids.`,
    linkPath: link,
    email: {
      subject: `RVCC — Bidding closed: ${r.project}`,
      title: "Bidding Closed",
      paragraphs: [
        "Bidding for the requirement below has closed. RVCC Procurement is now evaluating the bids and will notify you of the outcome.",
      ],
      details: requirementDetails(r),
      cta: { label: "View in your portal", url: vendorPortalUrl(env, link) },
    },
  });

  await alertAdmins(env, {
    type: "REQUIREMENT_UPDATED",
    title: `Bidding closed: ${r.project}`,
    body: `${bidCount} bid(s) received. Ready for evaluation.`,
    linkPath: link,
    email: {
      subject: `RVCC Admin — Bidding closed: ${r.project} (${bidCount} bids)`,
      title: "Bidding Closed",
      paragraphs: [`Bidding has closed with ${bidCount} submitted bid(s). The requirement is ready for evaluation and award.`],
      details: requirementDetails(r),
      cta: { label: "Open in admin", url: adminPortalUrl(env, link) },
    },
  });
}
