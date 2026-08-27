import { PurchaseRequest } from "@/types/procurement";
import { INITIAL_PURCHASE_REQUESTS } from "./initial-data";

const STORAGE_KEY = "procurement_requests_construction_v2";

export class ProcurementStore {
  static getRequests(): PurchaseRequest[] {
    if (typeof window === "undefined") {
      return INITIAL_PURCHASE_REQUESTS;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PURCHASE_REQUESTS));
        return INITIAL_PURCHASE_REQUESTS;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_PURCHASE_REQUESTS;
    }
  }

  static getRequestById(id: string): PurchaseRequest | null {
    const requests = this.getRequests();
    return requests.find((r) => r.id === id || r.referenceNumber.toLowerCase() === id.toLowerCase()) || null;
  }

  static saveRequests(requests: PurchaseRequest[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    } catch (e) {
      console.error("Failed to save requests to storage", e);
    }
  }

  static addRequest(newReq: Omit<PurchaseRequest, "id" | "referenceNumber" | "createdAt" | "updatedAt" | "auditTrail" | "status">): PurchaseRequest {
    const requests = this.getRequests();
    const count = requests.length + 1;
    const ref = `PR-2026-${String(count).padStart(3, "0")}`;
    const now = new Date().toISOString();

    const created: PurchaseRequest = {
      ...newReq,
      id: `req-${Date.now()}`,
      referenceNumber: ref,
      status: "submitted",
      createdAt: now,
      updatedAt: now,
      auditTrail: [
        {
          id: `log-${Date.now()}`,
          action: "Requisition Submitted",
          actorName: newReq.requesterName || "Requester",
          actorRole: "requester",
          timestamp: now,
          note: "Submitted new requisition request for admin review.",
          previousStatus: "draft",
          newStatus: "submitted",
        },
      ],
    };

    const updated = [created, ...requests];
    this.saveRequests(updated);
    return created;
  }

  static resetToDefault(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PURCHASE_REQUESTS));
  }
}
