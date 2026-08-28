/** Cache for procurement requisitions list */
import { PurchaseRequest } from "@/types/procurement";

let cache: PurchaseRequest[] | null = null;
let fetchedAt = 0;

export function readProcurementCache(): PurchaseRequest[] | null {
  return cache;
}

export function writeProcurementCache(rows: PurchaseRequest[]) {
  cache = rows;
  fetchedAt = Date.now();
}

export function procurementCacheAgeMs(): number {
  return fetchedAt ? Date.now() - fetchedAt : Infinity;
}

export function clearProcurementCache() {
  cache = null;
  fetchedAt = 0;
}
