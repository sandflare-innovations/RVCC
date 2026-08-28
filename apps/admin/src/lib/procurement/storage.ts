import { PurchaseRequest, RequestStatus } from "@/types/procurement";
import { INITIAL_PURCHASE_REQUESTS } from "./initial-data";

const STORAGE_KEY = "procurement_requests_construction_v2";

export class AdminProcurementStore {
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
    return (
      requests.find(
        (r) => r.id === id || r.referenceNumber.toLowerCase() === id.toLowerCase()
      ) || null
    );
  }

  static saveRequests(requests: PurchaseRequest[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    } catch (e) {
      console.error("Failed to save procurement requests to storage", e);
    }
  }

  static updateStatus(
    id: string,
    newStatus: RequestStatus,
    adminName: string,
    note?: string,
    adminNotes?: string
  ): PurchaseRequest | null {
    const requests = this.getRequests();
    const index = requests.findIndex(
      (r) => r.id === id || r.referenceNumber.toLowerCase() === id.toLowerCase()
    );

    if (index === -1) return null;

    const current = requests[index];
    const prevStatus = current.status;
    const now = new Date().toISOString();

    const actionMap: Record<RequestStatus, string> = {
      draft: "Status Reverted to Draft",
      submitted: "Re-submitted for Review",
      under_review: "Moved to Under Review",
      approved: "Requisition Approved",
      rejected: "Requisition Rejected",
      revision_requested: "Revision Requested from Requester",
    };

    const updated: PurchaseRequest = {
      ...current,
      status: newStatus,
      updatedAt: now,
      adminNotes: adminNotes !== undefined ? adminNotes : current.adminNotes,
      auditTrail: [
        {
          id: `log-${Date.now()}`,
          action: actionMap[newStatus] || `Status updated to ${newStatus}`,
          actorName: adminName || "Admin",
          actorRole: "admin",
          timestamp: now,
          note: note || `Changed status from ${prevStatus} to ${newStatus}.`,
          previousStatus: prevStatus,
          newStatus: newStatus,
        },
        ...(current.auditTrail || []),
      ],
    };

    requests[index] = updated;
    this.saveRequests(requests);
    return updated;
  }
}
