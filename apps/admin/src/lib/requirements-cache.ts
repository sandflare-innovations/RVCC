/** In-memory requirements list cache — survives navigation within the same browser session. */

export type CachedRequirementRow = {
  id: string;
  referenceNumber: string | null;
  project: string;
  closesAt: string;
  status: string;
  invited: number;
  submitted: number;
};

let cache: CachedRequirementRow[] | null = null;
let fetchedAt = 0;

export function readRequirementsCache(): CachedRequirementRow[] | null {
  return cache;
}

export function writeRequirementsCache(rows: CachedRequirementRow[]) {
  cache = rows;
  fetchedAt = Date.now();
}

export function clearRequirementsCache() {
  cache = null;
  fetchedAt = 0;
}
