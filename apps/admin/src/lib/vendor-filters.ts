/** Allowed vendor list filters — shared by UI and BFF so URLs cannot inject arbitrary values. */

export const VENDOR_FILTERS = [
  { value: "RELEASED", label: "Access released" },
  { value: "HELD", label: "Access held" },
  { value: "PENDING", label: "Temporary password" },
  { value: "ALL", label: "All" },
] as const;

export type VendorFilterValue = (typeof VENDOR_FILTERS)[number]["value"];

const VALID = new Set<string>(VENDOR_FILTERS.map((f) => f.value));

export function parseVendorFilter(raw: string | null | undefined): VendorFilterValue {
  const value = (raw ?? "").trim().toUpperCase();
  return VALID.has(value) ? (value as VendorFilterValue) : "RELEASED";
}

/** Trim, cap length, and strip control characters from free-text search. */
export function parseVendorSearch(raw: string | null | undefined, maxLen = 120): string {
  return String(raw ?? "")
    .replace(/[\0-\x1f\x7f]/g, "")
    .trim()
    .slice(0, maxLen);
}
