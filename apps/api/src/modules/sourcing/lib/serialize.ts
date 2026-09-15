import type { AdminRoleName } from "@rvcc/schemas";
import { decimalToString, redactTargetPrice } from "./redact";

type RequirementRow = {
  id: string;
  referenceNumber: string | null;
  title?: string | null;
  project: string;
  productServiceName?: string | null;
  category?: string | null;
  description?: string | null;
  scopeOfWork: string;
  specifications?: string | null;
  quantity?: unknown;
  unit?: string | null;
  requiredDeliveryDate?: Date | null;
  deliveryLocation?: string | null;
  requestingDepartment?: string | null;
  priority?: string | null;
  internalNotes?: string | null;
  sellingPrice?: unknown;
  estimatedBudget?: unknown;
  currency: string;
  opensAt?: Date | null;
  closesAt?: Date | null;
  minAcceptablePrice?: unknown;
  maxAcceptablePrice?: unknown;
  rankingStrategy?: string | null;
  allowBidRevisions?: boolean;
  revealCompetitorPrices?: boolean;
  revealTargetPrice?: boolean;
  priceWeight?: unknown;
  technicalWeight?: unknown;
  commercialWeight?: unknown;
  bidRules?: string | null;
  eligibilityNotes?: string | null;
  requiredDocuments?: unknown;
  termsAndConditions?: string | null;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
  awardedQuoteId?: string | null;
  awardedAt?: Date | null;
  awardedValue?: unknown;
  submittedToAdminAt?: Date | null;
};

export function displayTitle(row: { title?: string | null; project: string }): string {
  return (row.title && row.title.trim()) || row.project;
}

export function serializeRequirement(
  row: RequirementRow,
  role: AdminRoleName | "VENDOR" | null,
  extras: Record<string, unknown> = {}
) {
  const title = displayTitle(row);
  const payload = {
    id: row.id,
    referenceNumber: row.referenceNumber,
    title,
    project: title,
    productServiceName: row.productServiceName || "",
    category: row.category || "General",
    description: row.description || row.scopeOfWork || "",
    scopeOfWork: row.scopeOfWork,
    specifications: row.specifications || "",
    quantity: Number(row.quantity ?? 1),
    unit: row.unit || "pcs",
    requiredDeliveryDate: row.requiredDeliveryDate?.toISOString() ?? null,
    deliveryLocation: row.deliveryLocation || "",
    requestingDepartment: row.requestingDepartment || "",
    priority: row.priority || "MEDIUM",
    internalNotes: role === "VENDOR" ? "" : row.internalNotes || "",
    targetPrice: decimalToString(row.sellingPrice),
    sellingPrice: decimalToString(row.sellingPrice),
    estimatedBudget: decimalToString(row.estimatedBudget),
    currency: row.currency,
    opensAt: row.opensAt?.toISOString() ?? null,
    closesAt: row.closesAt?.toISOString() ?? null,
    minAcceptablePrice: decimalToString(row.minAcceptablePrice),
    maxAcceptablePrice: decimalToString(row.maxAcceptablePrice),
    rankingStrategy: row.rankingStrategy || "LOWEST_PRICE",
    allowBidRevisions: row.allowBidRevisions !== false,
    revealCompetitorPrices: Boolean(row.revealCompetitorPrices),
    revealTargetPrice: Boolean(row.revealTargetPrice),
    priceWeight: Number(row.priceWeight ?? 50),
    technicalWeight: Number(row.technicalWeight ?? 25),
    commercialWeight: Number(row.commercialWeight ?? 25),
    bidRules: row.bidRules || "",
    eligibilityNotes: row.eligibilityNotes || "",
    requiredDocuments: Array.isArray(row.requiredDocuments) ? row.requiredDocuments : [],
    termsAndConditions: row.termsAndConditions || "",
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? null,
    awardedQuoteId: row.awardedQuoteId ?? null,
    awardedAt: row.awardedAt?.toISOString() ?? null,
    awardedValue: decimalToString(row.awardedValue),
    submittedToAdminAt: row.submittedToAdminAt?.toISOString() ?? null,
    ...extras,
  };

  return redactTargetPrice(
    payload,
    role,
    row.status,
    Boolean(row.revealTargetPrice)
  );
}
