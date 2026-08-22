/** Allowed registration list filters — shared by UI so URLs cannot inject arbitrary values. */

export const REGISTRATION_FILTERS = [
  { value: "SUBMITTED", label: "Awaiting review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "DRAFT", label: "In progress" },
  { value: "ALL", label: "All" },
] as const;

export type RegistrationFilterValue = (typeof REGISTRATION_FILTERS)[number]["value"];

const VALID = new Set<string>(REGISTRATION_FILTERS.map((f) => f.value));

export function parseRegistrationFilter(raw: string | null | undefined): RegistrationFilterValue {
  const value = (raw ?? "").trim().toUpperCase();
  return VALID.has(value) ? (value as RegistrationFilterValue) : "ALL";
}

export function parseRegistrationSearch(raw: string | null | undefined, maxLen = 120): string {
  return String(raw ?? "")
    .replace(/[\0-\x1f\x7f]/g, "")
    .trim()
    .slice(0, maxLen);
}

type RegistrationLike = {
  email: string;
  status: string;
  referenceNumber: string | null;
  company: { legalName: string } | null;
};

export function matchesRegistrationFilter(
  r: RegistrationLike,
  filter: RegistrationFilterValue
): boolean {
  if (filter === "ALL") return true;
  return r.status === filter;
}

export function matchesRegistrationSearch(r: RegistrationLike, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  const hay = [r.email, r.referenceNumber ?? "", r.company?.legalName ?? ""]
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export function filterRegistrationRows<T extends RegistrationLike>(
  rows: T[],
  filter: RegistrationFilterValue,
  q: string
): T[] {
  const search = parseRegistrationSearch(q);
  return rows.filter(
    (r) => matchesRegistrationFilter(r, filter) && matchesRegistrationSearch(r, search)
  );
}
