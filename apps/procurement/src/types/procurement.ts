export type RequestStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "revision_requested";

export type PriorityLevel = "low" | "medium" | "high" | "urgent";

export interface RequestItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  totalPrice: number;
  preferredVendor?: string;
  notes?: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actorName: string;
  actorRole: "requester" | "admin" | "system";
  timestamp: string;
  note?: string;
  previousStatus?: RequestStatus;
  newStatus?: RequestStatus;
}

export interface PurchaseRequest {
  id: string;
  referenceNumber: string; // e.g. "PR-2026-001"
  title: string;
  description: string;
  department: string;
  costCenter?: string;
  requesterName: string;
  requesterEmail?: string;
  priority: PriorityLevel;
  requiredByDate: string;
  status: RequestStatus;
  items: RequestItem[];
  totalEstimatedAmount: number;
  currency: string;
  attachments: Attachment[];
  adminNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  auditTrail: AuditLogEntry[];
}

export interface ProcurementStats {
  totalRequests: number;
  pendingReviewCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalEstimatedSpend: number;
  urgentCount: number;
}
