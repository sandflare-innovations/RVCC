export const REQUIREMENT_FILTERS = [
  { value: "OPEN", label: "Open" },
  { value: "DRAFT", label: "Draft" },
  { value: "AWARDED", label: "Awarded" },
  { value: "CLOSED", label: "Closed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "ALL", label: "All" },
] as const;

export type RequirementFilterValue = (typeof REQUIREMENT_FILTERS)[number]["value"];

const VALID = new Set<string>(REQUIREMENT_FILTERS.map((f) => f.value));

export function parseRequirementFilter(raw: string | null | undefined): RequirementFilterValue {
  const value = (raw ?? "").trim().toUpperCase();
  return VALID.has(value) ? (value as RequirementFilterValue) : "ALL";
}

export function parseRequirementSearch(raw: string | null | undefined, maxLen = 120): string {
  return String(raw ?? "")
    .replace(/[\0-\x1f\x7f]/g, "")
    .trim()
    .slice(0, maxLen);
}

type RequirementLike = {
  referenceNumber: string | null;
  project: string;
  status: string;
  closesAt: string | null;
};

export function matchesRequirementFilter(r: RequirementLike, filter: RequirementFilterValue): boolean {
  if (filter === "ALL") return true;
  
  const isExpired = r.closesAt && new Date(r.closesAt).getTime() <= Date.now();
  
  if (filter === "CLOSED") {
    return r.status === "OPEN" && !!isExpired;
  }
  if (filter === "OPEN") {
    return r.status === "OPEN" && !isExpired;
  }
  
  return r.status === filter;
}

export function matchesRequirementSearch(r: RequirementLike, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  const hay = [
    r.referenceNumber ?? "",
    r.project,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export function filterRequirementRows<T extends RequirementLike>(
  rows: T[],
  filter: RequirementFilterValue,
  q: string
): T[] {
  const search = parseRequirementSearch(q);
  return rows.filter((r) => matchesRequirementFilter(r, filter) && matchesRequirementSearch(r, search));
}
