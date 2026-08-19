import "server-only";

import { cache } from "react";

import { adminSessionJson } from "@/lib/admin-data";

export type IndustryRow = { id: string; name: string };

/** Industries change rarely — dedupe within a single server request / navigation. */
export const getAdminIndustries = cache(async (): Promise<IndustryRow[]> => {
  const result = await adminSessionJson<IndustryRow[]>("/industries");
  return result.ok ? result.data : [];
});
