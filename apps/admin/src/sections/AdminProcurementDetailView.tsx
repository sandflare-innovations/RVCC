"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Building,
  Calendar,
  User,
  Clock,
  Layers,
  FileText,
  AlertTriangle,
  History,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Tag,
  DollarSign,
  MessageSquare,
  ShieldCheck,
  Send,
  Loader2,
  Download,
} from "lucide-react";
import { PurchaseRequest, RequestStatus } from "@/types/procurement";
import { AdminProcurementStore } from "@/lib/procurement/storage";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusBadgeInfo,
  getPriorityBadgeInfo,
} from "@/lib/procurement/formatters";

export function AdminProcurementDetailView() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Status Change State
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | "">("");
  const [adminNote, setAdminNote] = useState("");
  const [isUpdating, startUpdating] = useTransition();
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const loadData = () => {
    if (params?.id) {
      const found = AdminProcurementStore.getRequestById(String(params.id));
      setRequest(found);
      if (found) {
        setSelectedStatus(found.status);
        setAdminNote(found.adminNotes || "");
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [params?.id]);

  const handleUpdateStatus = (newStatus: RequestStatus) => {
    if (!request) return;
    setFeedbackMsg(null);

    startUpdating(() => {
      try {
        const updated = AdminProcurementStore.updateStatus(
          request.id,
          newStatus,
          "Admin",
          `Status changed to ${newStatus.replace(/_/g, " ")}.`,
          adminNote
        );

        if (updated) {
          setRequest(updated);
          setSelectedStatus(updated.status);
          setFeedbackMsg({
            type: "success",
            text: `Requisition status successfully updated to "${newStatus.replace(/_/g, " ").toUpperCase()}".`,
          });
          setTimeout(() => setFeedbackMsg(null), 4000);
        }
      } catch {
        setFeedbackMsg({
          type: "error",
          text: "Failed to update requisition status. Please try again.",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
        <div className="h-6 w-32 bg-zinc-200 rounded-lg" />
        <div className="h-48 bg-white rounded-3xl border border-zinc-100" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-xl mx-auto my-16 text-center bg-white p-12 rounded-3xl border border-zinc-200 shadow-sm">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-zinc-900">Requisition Not Found</h2>
        <p className="text-sm text-zinc-500 mt-2">
          The requested requisition ID does not exist or has been removed.
        </p>
        <Link
          href="/procurement"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 transition"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Requisitions</span>
        </Link>
      </div>
    );
  }

  const statusBadge = getStatusBadgeInfo(request.status);
  const priorityBadge = getPriorityBadgeInfo(request.priority);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Back link */}
      <div>
        <Link
          href="/procurement"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to All Procurement Requisitions</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-md">
                {request.referenceNumber}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold ${statusBadge.bgClass} ${statusBadge.textClass} ${statusBadge.borderClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusBadge.dotClass}`} />
                {statusBadge.label}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${priorityBadge.bgClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${priorityBadge.dotClass}`} />
                {priorityBadge.label} Priority
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              {request.title}
            </h1>
            <p className="text-sm text-zinc-600 max-w-3xl leading-relaxed">
              {request.description}
            </p>
          </div>

          <div className="lg:text-right shrink-0 rounded-2xl bg-zinc-50 p-5 border border-zinc-100">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Total Estimated Amount
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-1">
              {formatCurrency(request.totalEstimatedAmount, request.currency)}
            </p>
            <p className="text-[11px] font-medium text-zinc-500 mt-1">
              Required by {formatDate(request.requiredByDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Details Left, Review Actions Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details, Items, Attachments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                <Building className="h-4 w-4" />
                <span>Department</span>
              </div>
              <p className="text-sm font-bold text-zinc-900 mt-1.5">{request.department}</p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                <User className="h-4 w-4" />
                <span>Requester</span>
              </div>
              <p className="text-sm font-bold text-zinc-900 mt-1.5">{request.requesterName}</p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                <Calendar className="h-4 w-4" />
                <span>Submitted Date</span>
              </div>
              <p className="text-sm font-bold text-zinc-900 mt-1.5">{formatDate(request.createdAt)}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="rounded-3xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-zinc-100 bg-zinc-50/70 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-zinc-900">
                <Layers className="h-4 w-4 text-[#0073bc]" />
                <span>Line Items & Materials ({request.items?.length || 0})</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/40 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    <th className="py-3 px-4">Item & Specifications</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Unit Est.</th>
                    <th className="py-3 px-4 text-right">Total Est.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs">
                  {request.items?.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-zinc-50/50 transition">
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-zinc-900">{item.name}</p>
                        {item.preferredVendor && (
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            Pref. Vendor: <span className="font-semibold text-zinc-700">{item.preferredVendor}</span>
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-[11px] text-zinc-400 mt-0.5 italic">{item.notes}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-800 whitespace-nowrap">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-zinc-600 whitespace-nowrap">
                        {formatCurrency(item.estimatedUnitPrice, request.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-zinc-900 whitespace-nowrap">
                        {formatCurrency(item.totalPrice, request.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Attachments */}
          {request.attachments && request.attachments.length > 0 && (
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0073bc]" />
                <span>Supporting Attachments & Specifications ({request.attachments.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {request.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100/80 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="h-5 w-5 text-zinc-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 truncate">{att.name}</p>
                        <p className="text-[10px] text-zinc-400">{(att.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => alert(`Opening ${att.name}`)}
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-white transition cursor-pointer"
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Trail */}
          {request.auditTrail && request.auditTrail.length > 0 && (
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <History className="h-4 w-4 text-zinc-500" />
                <span>Requisition Audit Log & History</span>
              </h3>
              <div className="space-y-3">
                {request.auditTrail.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 text-xs border-l-2 border-zinc-200 pl-3.5 py-1"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-zinc-900">{log.action}</p>
                        <span className="text-[10px] text-zinc-400">{formatDateTime(log.timestamp)}</span>
                      </div>
                      <p className="text-zinc-500 mt-0.5">By {log.actorName} ({log.actorRole})</p>
                      {log.note && <p className="text-zinc-700 mt-1 italic font-medium">"{log.note}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Status & Decision Panel */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs sticky top-6">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
              <ShieldCheck className="h-5 w-5 text-[#0073bc]" />
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Admin Review & Decision</h3>
                <p className="text-[11px] text-zinc-500">Update status & notify project teams</p>
              </div>
            </div>

            {feedbackMsg && (
              <div
                className={`my-4 p-3 rounded-xl text-xs font-semibold ${
                  feedbackMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {feedbackMsg.text}
              </div>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  Change Status
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("approved")}
                    disabled={isUpdating || request.status === "approved"}
                    className="flex items-center justify-between p-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-900 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Approve Requisition</span>
                    </div>
                    {request.status === "approved" && (
                      <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                        Current
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("under_review")}
                    disabled={isUpdating || request.status === "under_review"}
                    className="flex items-center justify-between p-3 rounded-2xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-amber-900 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span>Move to Under Review</span>
                    </div>
                    {request.status === "under_review" && (
                      <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">
                        Current
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("revision_requested")}
                    disabled={isUpdating || request.status === "revision_requested"}
                    className="flex items-center justify-between p-3 rounded-2xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 text-purple-900 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-purple-600" />
                      <span>Request Revisions</span>
                    </div>
                    {request.status === "revision_requested" && (
                      <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold">
                        Current
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("rejected")}
                    disabled={isUpdating || request.status === "rejected"}
                    className="flex items-center justify-between p-3 rounded-2xl border border-red-200 bg-red-50/60 hover:bg-red-100/70 text-red-900 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>Reject Requisition</span>
                    </div>
                    {request.status === "rejected" && (
                      <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                        Current
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Internal Admin / Audit Notes
                </label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add review feedback, required vendor quote details, or rejection rationale..."
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3 text-xs text-zinc-900 outline-none transition focus:border-[#0073bc] focus:bg-white focus:ring-2 focus:ring-[#0073bc]/10"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(request.status)}
                  disabled={isUpdating}
                  className="mt-2 w-full rounded-xl bg-zinc-900 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Save Review Note</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
