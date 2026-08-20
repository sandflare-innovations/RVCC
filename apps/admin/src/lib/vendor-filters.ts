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

type VendorLike = {
  email: string;
  name: string | null;
  companyName: string;
  referenceNumber: string | null;
  portalAccess: "HELD" | "RELEASED";
  mustChangePassword: boolean;
  registration: { company: { legalName: string } | null } | null;
};

/** Client-side filter — no network round-trip when switching tabs. */
export function matchesVendorFilter(v: VendorLike, filter: VendorFilterValue): boolean {
  if (filter === "ALL") return true;
  if (filter === "RELEASED") return v.portalAccess === "RELEASED";
  if (filter === "HELD") return v.portalAccess === "HELD";
  if (filter === "PENDING") return v.mustChangePassword;
  return true;
}

/** Client-side search across email, name, company, reference. */
export function matchesVendorSearch(v: VendorLike, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  const hay = [
    v.email,
    v.name ?? "",
    v.companyName,
    v.referenceNumber ?? "",
    v.registration?.company?.legalName ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export function filterVendorRows<T extends VendorLike>(
  rows: T[],
  filter: VendorFilterValue,
  q: string
): T[] {
  const search = parseVendorSearch(q);
  return rows.filter((v) => matchesVendorFilter(v, filter) && matchesVendorSearch(v, search));
}
