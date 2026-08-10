import "server-only";

import type { JobPosition } from "@/data/careers";
import { prisma } from "@/lib/db";

export const DEPARTMENTS = ["Architecture", "Engineering", "Management", "Operations"] as const;
export const EMPLOYMENT_TYPES = ["Full-time", "Contract", "Internship"] as const;

/** Row shape → the JobPosition contract the public CareerList already expects. */
type Row = {
  id: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  postedAt: Date;
  description: string;
  requirements: string[];
  benefits: string[];
  isRemote: boolean;
};

function toJobPosition(r: Row): JobPosition {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    department: r.department as JobPosition["department"],
    location: r.location,
    type: r.employmentType as JobPosition["type"],
    postedAt: r.postedAt.toISOString().slice(0, 10),
    description: r.description,
    requirements: r.requirements,
    benefits: r.benefits,
    isRemote: r.isRemote,
  };
}

/**
 * Published postings for the public careers page.
 *
 * Returns [] rather than throwing if the database is unreachable — a CMS outage
 * should degrade the careers section, not take down the page around it.
 */
export async function getPublishedJobs(): Promise<JobPosition[]> {
  try {
    const rows = await prisma.jobPosting.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { postedAt: "desc" }],
    });
    return rows.map(toJobPosition);
  } catch (err) {
    console.error("[careers] could not load postings", err);
    return [];
  }
}

/** Slugs must be unique and URL-safe; the admin form derives one from the title. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}
