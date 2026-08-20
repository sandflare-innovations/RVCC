/** In-memory registration list cache — survives tab switches within the same browser session. */

export type CachedRegistrationRow = {
  id: string;
  email: string;
  status: string;
  referenceNumber: string | null;
  submittedAt: string | null;
  company: { legalName: string; country: string | null } | null;
};

let cache: CachedRegistrationRow[] | null = null;
let fetchedAt = 0;

export function readRegistrationCache(): CachedRegistrationRow[] | null {
  return cache;
}

export function writeRegistrationCache(rows: CachedRegistrationRow[]) {
  cache = rows;
  fetchedAt = Date.now();
}

export function registrationCacheAgeMs(): number {
  return fetchedAt ? Date.now() - fetchedAt : Infinity;
}

export function clearRegistrationCache() {
  cache = null;
  fetchedAt = 0;
}
