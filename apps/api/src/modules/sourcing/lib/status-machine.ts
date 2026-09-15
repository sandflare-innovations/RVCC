import type { RequirementStatus } from "@prisma/client";

/**
 * Canonical pipeline statuses. PENDING is treated as SUBMITTED_TO_ADMIN.
 */
export const PIPELINE_STATUSES = [
  "DRAFT",
  "QUOTATION_COLLECTION",
  "SUBMITTED_TO_ADMIN",
  "OPEN",
  "BIDDING_CLOSED",
  "EVALUATING",
  "SHORTLISTED",
  "AWARDED",
  "CANCELLED",
] as const;

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

const ALLOWED: Record<PipelineStatus, PipelineStatus[]> = {
  DRAFT: ["QUOTATION_COLLECTION", "CANCELLED"],
  QUOTATION_COLLECTION: ["SUBMITTED_TO_ADMIN", "DRAFT", "CANCELLED"],
  SUBMITTED_TO_ADMIN: ["OPEN", "QUOTATION_COLLECTION", "CANCELLED"],
  OPEN: ["BIDDING_CLOSED", "CANCELLED"],
  BIDDING_CLOSED: ["EVALUATING", "CANCELLED"],
  EVALUATING: ["SHORTLISTED", "AWARDED", "CANCELLED"],
  SHORTLISTED: ["AWARDED", "EVALUATING", "CANCELLED"],
  AWARDED: [],
  CANCELLED: [],
};

/** Map stored Prisma values onto the pipeline used by transition rules. */
export function normalizeStatus(status: string): PipelineStatus {
  if (status === "PENDING") return "SUBMITTED_TO_ADMIN";
  if (status === "REJECTED") return "CANCELLED";
  if ((PIPELINE_STATUSES as readonly string[]).includes(status)) {
    return status as PipelineStatus;
  }
  return "DRAFT";
}

export function assertTransition(from: string, to: PipelineStatus): void {
  const current = normalizeStatus(from);
  if (current === to) return;
  const allowed = ALLOWED[current] ?? [];
  if (!allowed.includes(to)) {
    throw new Error(`Cannot move a requirement from ${current} to ${to}.`);
  }
}

export function toPrismaStatus(status: PipelineStatus): RequirementStatus {
  return status as RequirementStatus;
}

export function isEditableByProcurement(status: string): boolean {
  const current = normalizeStatus(status);
  return current === "DRAFT" || current === "QUOTATION_COLLECTION";
}

export function isBiddingOpen(status: string, closesAt?: Date | null): boolean {
  if (normalizeStatus(status) !== "OPEN") return false;
  if (!closesAt) return true;
  return closesAt.getTime() > Date.now();
}

export function isPastDeadline(closesAt?: Date | null): boolean {
  if (!closesAt) return false;
  return closesAt.getTime() <= Date.now();
}

export const VENDOR_VISIBLE_STATUSES: RequirementStatus[] = [
  "OPEN",
  "BIDDING_CLOSED",
  "EVALUATING",
  "SHORTLISTED",
  "AWARDED",
  "CANCELLED",
];
