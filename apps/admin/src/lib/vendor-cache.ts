/** In-memory vendor list cache — survives tab switches within the same browser session. */

export type CachedVendorRow = {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  portalAccess: "HELD" | "RELEASED";
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  lockedUntil: string | null;
  activeSessions: number;
  registrationId: string | null;
  companyName: string;
  referenceNumber: string | null;
  registrationStatus: string | null;
  registrationComplete: boolean;
  registration: {
    id: string;
    referenceNumber: string | null;
    status: string;
    company: { legalName: string } | null;
  } | null;
};

let cache: CachedVendorRow[] | null = null;
let fetchedAt = 0;

export function readVendorCache(): CachedVendorRow[] | null {
  return cache;
}

export function writeVendorCache(rows: CachedVendorRow[]) {
  cache = rows;
  fetchedAt = Date.now();
}

export function vendorCacheAgeMs(): number {
  return fetchedAt ? Date.now() - fetchedAt : Infinity;
}

export function clearVendorCache() {
  cache = null;
  fetchedAt = 0;
}
