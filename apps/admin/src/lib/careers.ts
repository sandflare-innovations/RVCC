import "server-only";

export const DEPARTMENTS = ["Architecture", "Engineering", "Management", "Operations"] as const;
export const EMPLOYMENT_TYPES = ["Full-time", "Contract", "Internship"] as const;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}
