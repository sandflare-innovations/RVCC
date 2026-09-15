import { createRequirementSchema } from "@rvcc/schemas";
import type { Currency, ProcurementPriority } from "@prisma/client";

function asDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Normalise create/update payloads from both the legacy RFQ form
 * and the new procurement requirement form.
 */
export function normaliseRequirementInput(raw: unknown) {
  const parsed = createRequirementSchema.parse(raw ?? {});
  const title = (parsed.title || parsed.project || "").trim();
  const scopeOfWork = (parsed.scopeOfWork || parsed.description || parsed.specifications || "").trim();

  if (!title) throw new Error("A requirement title is required.");
  if (!scopeOfWork) throw new Error("A description or scope of work is required.");

  const vendorUserIds = [
    ...(parsed.invitedVendorIds ?? []),
    ...(parsed.vendorUserIds ?? []),
  ].filter((id, index, all) => all.indexOf(id) === index);

  const target = parsed.targetPrice ?? parsed.sellingPrice ?? null;
  const closesAt = asDate(parsed.closesAt);

  return {
    title,
    project: title,
    productServiceName: parsed.productServiceName || title,
    category: parsed.category || "General",
    description: parsed.description || scopeOfWork,
    scopeOfWork,
    specifications: parsed.specifications || "",
    quantity: parsed.quantity ?? 1,
    unit: parsed.unit || "pcs",
    requiredDeliveryDate: asDate(parsed.requiredDeliveryDate),
    deliveryLocation: parsed.deliveryLocation || "",
    requestingDepartment: parsed.requestingDepartment || "",
    priority: String(parsed.priority || "MEDIUM").toUpperCase() as ProcurementPriority,
    internalNotes: parsed.internalNotes || "",
    estimatedBudget: parsed.estimatedBudget ?? null,
    sellingPrice: target,
    currency: (parsed.currency || "SAR") as Currency,
    closesAt,
    vendorUserIds,
  };
}

export type NormalisedRequirementInput = ReturnType<typeof normaliseRequirementInput>;
