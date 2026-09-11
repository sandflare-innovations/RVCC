import { MajorProjectItem } from "../../types";

export interface DetailedProject extends MajorProjectItem {
  slug: string;
  category: string;
  client: string;
  year: string;
  status: "Completed" | "In Progress" | "Upcoming";
  gallery: string[];
  scope: string[];
  coverImage?: string;
}

/**
 * Empty export preserved for type compatibility.
 * All projects are now fetched dynamically from the database via apps/api (/projects).
 */
export const PROJECTS: DetailedProject[] = [];
