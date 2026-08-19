export type CreateRequirementInput = {
  scopeOfWork: string;
  project: string;
  sellingPrice?: string | null;
  currency?: string;
  closesAt: string;
  /** Vendor ids. "Agent" at RVCC means vendor, so there is only one audience. */
  vendorUserIds: string[];
};

/**
 * Kept free of database and Worker imports so it is testable from the repo root
 * Lives in apps/api so postgres resolves from the api package.
 */
export function normaliseRequirementInput(input: CreateRequirementInput) {
  const scopeOfWork = String(input?.scopeOfWork ?? "").trim();
  const project = String(input?.project ?? "").trim();

  if (!scopeOfWork) throw new Error("A scope of work is required.");
  if (!project) throw new Error("A project is required.");

  const closesAt = new Date(input?.closesAt ?? "");
  if (Number.isNaN(closesAt.getTime())) throw new Error("A valid closing time is required.");
  if (closesAt.getTime() <= Date.now()) throw new Error("The closing time must be in the future.");

  // Left as a string: converting to a JS number here would undo the whole point
  // of storing money as NUMERIC.
  const raw = input.sellingPrice == null ? "" : String(input.sellingPrice).trim();
  if (raw && !/^\d+(\.\d{1,2})?$/.test(raw)) {
    throw new Error("The selling price must be a number with at most two decimals.");
  }

  return {
    scopeOfWork,
    project,
    sellingPrice: raw || null,
    currency: String(input.currency ?? "SAR").trim() || "SAR",
    closesAt,
    vendorUserIds: Array.isArray(input.vendorUserIds) ? input.vendorUserIds : [],
  };
}

/** REQ-YYYYMMDD-NNNN reference format for requirements. */
export function makeReferenceNumber(now: Date, sequence: number): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `REQ-${y}${m}${d}-${String(sequence).padStart(4, "0")}`;
}
